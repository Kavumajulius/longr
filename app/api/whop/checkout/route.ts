import { NextResponse, type NextRequest } from "next/server";
import {
  whopsdk,
  WHOP_COMPANY_ID,
  WHOP_PRODUCT_ID,
} from "@/lib/whop-sdk";
import { getAdminAuth } from "@/lib/firebase-admin";
import { publicAppUrl } from "@/lib/app-url";
import {
  isWhopTier,
  WHOP_TIER_DETAILS,
  WHOP_TIER_PLANS,
} from "@/lib/whop-plans";
import { verifyDiscountToken } from "@/lib/whop-discount-token";

export const dynamic = "force-dynamic";

const INTRODUCTORY_PROMO_CODES: Record<number, string | undefined> = {
  10: process.env.WHOP_PROMO_CODE_10,
  15: process.env.WHOP_PROMO_CODE_15,
  20: process.env.WHOP_PROMO_CODE_20,
  25: process.env.WHOP_PROMO_CODE_25,
  30: process.env.WHOP_PROMO_CODE_30,
  35: process.env.WHOP_PROMO_CODE_35,
  40: process.env.WHOP_PROMO_CODE_40,
  45: process.env.WHOP_PROMO_CODE_45,
};

export async function POST(request: NextRequest) {
  let body: {
    uid?: unknown;
    tier?: unknown;
    idToken?: unknown;
    discount?: unknown;
    discountToken?: unknown;
    email?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { uid, tier, idToken, discount, discountToken, email } = body;

  if (!isWhopTier(tier)) {
    return NextResponse.json(
      { error: "tier must be one of: weekly, monthly, annual" },
      { status: 400 },
    );
  }

  const checkoutEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const hasAuthPayload = typeof uid === "string" || typeof idToken === "string";
  let authenticatedUid: string | null = null;

  if (hasAuthPayload) {
    if (
      typeof uid !== "string" ||
      uid.length === 0 ||
      typeof idToken !== "string" ||
      idToken.length === 0
    ) {
      return NextResponse.json({ error: "Invalid authentication details" }, { status: 400 });
    }

    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { error: "Firebase admin is not configured" },
        { status: 500 },
      );
    }

    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      if (decoded.uid !== uid) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      authenticatedUid = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  } else if (!/^\S+@\S+\.\S+$/.test(checkoutEmail)) {
    return NextResponse.json(
      { error: "A valid email is required to start checkout" },
      { status: 400 },
    );
  }

  if (!WHOP_COMPANY_ID || !WHOP_PRODUCT_ID) {
    return NextResponse.json(
      { error: "Whop is not configured" },
      { status: 500 },
    );
  }

  const planId = WHOP_TIER_PLANS[tier];
  const requestedDiscount = typeof discount === "number" && Number.isFinite(discount)
    ? Math.round(discount)
    : 0;
  const verifiedOffer = verifyDiscountToken(discountToken);
  const safeDiscount = verifiedOffer?.discount ?? 0;
  if (requestedDiscount !== safeDiscount) {
    return NextResponse.json(
      { error: safeDiscount === 0 ? "The introductory discount has expired" : "Invalid introductory discount" },
      { status: 409 },
    );
  }
  const promoCode = safeDiscount > 0
    ? INTRODUCTORY_PROMO_CODES[safeDiscount]?.trim()
    : undefined;
  if (safeDiscount > 0 && !promoCode) {
    console.error(`[whop/checkout] missing one-time promo for ${safeDiscount}% offer`);
    return NextResponse.json(
      { error: "This welcome discount is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }
  const detail = WHOP_TIER_DETAILS[tier];
  const metadata = {
    source: "longr_onboarding",
    tier,
    introductory_discount: safeDiscount,
    ...(authenticatedUid ? { uid: authenticatedUid } : {}),
    ...(checkoutEmail ? { onboarding_email: checkoutEmail } : {}),
  };

  try {
    const config = await whopsdk.checkoutConfigurations.create({
      account_id: WHOP_COMPANY_ID,
      plan_id: planId,
      metadata,
      redirect_url: `${publicAppUrl(request.nextUrl.origin)}/hub`,
    });

    const introductoryTotal = Number(
      (detail.amount * (1 - safeDiscount / 100)).toFixed(2),
    );

    return NextResponse.json({
      sessionId: config.id,
      planId: config.plan?.id ?? planId,
      purchaseUrl: safeDiscount === 0 ? config.purchase_url ?? null : null,
      promoCode: promoCode ?? null,
      pricing: {
        currency: "usd",
        regularAmount: detail.amount,
        discount: safeDiscount,
        discountAmount: Number((detail.amount - introductoryTotal).toFixed(2)),
        total: introductoryTotal,
        renewalAmount: detail.amount,
        billingPeriodDays: detail.days,
      },
    });
  } catch (error) {
    console.error(
      "[whop/checkout] failed to create checkout configuration",
      error,
    );
    return NextResponse.json(
      { error: "Failed to start checkout" },
      { status: 500 },
    );
  }
}
