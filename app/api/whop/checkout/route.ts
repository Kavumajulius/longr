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
  try {
    // ─── Read raw text first (defensive: catches HTML error pages) ───
    const text = await request.text();

    // Try to parse as JSON, but catch HTML error pages
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error(
        "[whop/checkout] Invalid response – received HTML instead of JSON:",
        text.substring(0, 200),
      );
      return NextResponse.json(
        {
          error:
            "Whop API returned an error page instead of JSON. Check server logs.",
        },
        { status: 502 },
      );
    }

    const body = data as {
      uid?: unknown;
      tier?: unknown;
      idToken?: unknown;
      discount?: unknown;
      discountToken?: unknown;
      email?: unknown;
    };

    if (!isWhopTier(body.tier)) {
      return NextResponse.json(
        { error: "tier must be one of: weekly, monthly, annual" },
        { status: 400 },
      );
    }

    // Auth check
    if (typeof body.uid === "string" && typeof body.idToken === "string") {
      if (body.uid.length === 0 || body.idToken.length === 0) {
        return NextResponse.json({ error: "Invalid authentication details" }, { status: 400 });
      }

      const adminAuth = getAdminAuth();
      if (!adminAuth) {
        return NextResponse.json({ error: "Firebase admin not configured" }, { status: 500 });
      }

      try {
        const decoded = await adminAuth.verifyIdToken(body.idToken);
        if (decoded.uid !== body.uid) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      } catch (error: any) {
        return NextResponse.json({ error: "Token error: " + error.message }, { status: 403 });
      }
    } else if (
      !/^\S+@\S+\.\S+$/.test(typeof body.email === "string" ? body.email : "")
    ) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const checkoutEmail = typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : "";

    if (!WHOP_COMPANY_ID || !WHOP_PRODUCT_ID) {
      return NextResponse.json({ error: "Whop not configured" }, { status: 500 });
    }

    const planId = WHOP_TIER_PLANS[body.tier];
    const requestedDiscount = typeof body.discount === "number" && Number.isFinite(body.discount)
      ? Math.round(body.discount)
      : 0;
    const verifiedOffer = verifyDiscountToken(body.discountToken);
    const safeDiscount = verifiedOffer?.discount ?? 0;
    if (requestedDiscount !== safeDiscount) {
      return NextResponse.json(
        { error: safeDiscount === 0 ? "Discount expired" : "Invalid discount" },
        { status: 409 },
      );
    }
    const promoCode = safeDiscount > 0
      ? INTRODUCTORY_PROMO_CODES[safeDiscount]?.trim()
      : undefined;
    if (safeDiscount > 0 && !promoCode) {
      return NextResponse.json(
        { error: "Discount temporarily unavailable" },
        { status: 503 },
      );
    }
    const detail = WHOP_TIER_DETAILS[body.tier];
    const metadata = {
      source: "longr_onboarding",
      tier: body.tier,
      introductory_discount: safeDiscount,
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
    } catch (error: any) {
      console.error("[whop/checkout] config error:", error.message);
      return NextResponse.json({ error: "Checkout failed: " + error.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error("[whop/checkout] handler error:", error.message);
    return NextResponse.json({ error: "Handler error: " + error.message }, { status: 500 });
  }
}