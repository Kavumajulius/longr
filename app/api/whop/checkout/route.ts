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
    console.log("=== DEBUG: POST /api/whop/checkout ===");
    console.log("Body received");

    const body = await request.json();
    console.log("Body parsed:", JSON.stringify(body).substring(0, 200));

    const { uid, tier, idToken, discount, discountToken, email } = body;

    console.log("Checks: isWhopTier(tier) =", isWhopTier(tier));
    console.log("uid type:", typeof uid, "uid length:", uid?.length);
    console.log("idToken type:", typeof idToken, "idToken length:", idToken?.length);

    if (!isWhopTier(tier)) {
      return NextResponse.json(
        { error: "tier must be one of: weekly, monthly, annual" },
        { status: 400 },
      );
    }

    // Auth check
    if (typeof uid === "string" && typeof idToken === "string") {
      console.log("Auth check: uid.length =", uid.length, "idToken.length =", idToken.length);
      if (uid.length === 0 || idToken.length === 0) {
        return NextResponse.json({ error: "Invalid authentication details" }, { status: 400 });
      }

      const adminAuth = getAdminAuth();
      console.log("getAdminAuth() result:", adminAuth ? "AUTH OK" : "AUTH NULL");

      if (!adminAuth) {
        return NextResponse.json({ error: "Firebase admin not configured" }, { status: 500 });
      }

      try {
        console.log("Calling verifyIdToken...");
        const decoded = await adminAuth.verifyIdToken(idToken);
        console.log("Token decoded: uid =", decoded.uid);
        if (decoded.uid !== uid) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      } catch (error: any) {
        console.error("Token verification error:", error.message);
        return NextResponse.json({ error: "Token error: " + error.message }, { status: 403 });
      }
    } else if (!/^\S+@\S+\.\S+$/.test(email as string)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const checkoutEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!WHOP_COMPANY_ID || !WHOP_PRODUCT_ID) {
      return NextResponse.json({ error: "Whop not configured" }, { status: 500 });
    }

    const planId = WHOP_TIER_PLANS[tier];
    const requestedDiscount = typeof discount === "number" && Number.isFinite(discount)
      ? Math.round(discount)
      : 0;
    const verifiedOffer = verifyDiscountToken(discountToken);
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
    const detail = WHOP_TIER_DETAILS[tier];
    const metadata = {
      source: "longr_onboarding",
      tier,
      introductory_discount: safeDiscount,
      ...(checkoutEmail ? { onboarding_email: checkoutEmail } : {}),
    };

    try {
      console.log("Creating checkout config...");
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
      console.error("[whop/checkout] config error:", error.message, error.stack);
      return NextResponse.json({ error: "Checkout failed: " + error.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error("[whop/checkout] handler error:", error.message, error.stack);
    return NextResponse.json({ error: "Handler error: " + error.message }, { status: 500 });
  }
}