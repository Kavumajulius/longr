import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";
import { WHOP_COMPANY_ID, WHOP_PRODUCT_ID, whopsdk } from "@/lib/whop-sdk";
import { isWhopTier } from "@/lib/whop-plans";

export const dynamic = "force-dynamic";

function asMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? value as Record<string, unknown>
    : {};
}

export async function POST(request: NextRequest) {
  let body: { idToken?: unknown; receiptId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { idToken, receiptId } = body;
  if (typeof idToken !== "string" || idToken.length === 0) {
    return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
  }
  if (typeof receiptId !== "string" || !/^pay_[A-Za-z0-9]+$/.test(receiptId)) {
    return NextResponse.json({ error: "A valid Whop receipt is required" }, { status: 400 });
  }

  const adminAuth = getAdminAuth();
  const db = getAdminFirestore();
  if (!adminAuth || !db || !WHOP_COMPANY_ID || !WHOP_PRODUCT_ID) {
    return NextResponse.json({ error: "Purchase verification is not configured" }, { status: 500 });
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payment = await whopsdk.payments.retrieve(receiptId);
    const paid = payment.status === "paid" || payment.substatus === "succeeded";
    if (!paid || !payment.paid_at) {
      return NextResponse.json({ error: "Payment has not completed" }, { status: 409 });
    }
    if (payment.company?.id !== WHOP_COMPANY_ID || payment.product?.id !== WHOP_PRODUCT_ID) {
      return NextResponse.json({ error: "Payment does not belong to Longr" }, { status: 403 });
    }

    const accountEmail = decoded.email?.trim().toLowerCase();
    const paymentEmail = payment.user?.email?.trim().toLowerCase();
    if (accountEmail && paymentEmail && accountEmail !== paymentEmail) {
      return NextResponse.json(
        { error: "Use the same email address that was entered at checkout" },
        { status: 409 },
      );
    }

    let metadata = asMetadata(payment.metadata);
    if (payment.checkout_configuration_id) {
      const checkout = await whopsdk.checkoutConfigurations.retrieve(
        payment.checkout_configuration_id,
      );
      metadata = { ...asMetadata(checkout.metadata), ...metadata };
    }

    const tier = isWhopTier(metadata.tier) ? metadata.tier : "monthly";
    const introductoryDiscount =
      typeof metadata.introductory_discount === "number"
        ? metadata.introductory_discount
        : 0;
    const claimRef = db.collection("whopPaymentClaims").doc(receiptId);
    const userRef = db.collection("users").doc(decoded.uid);

    await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(claimRef);
      const claimedUid = existing.exists ? existing.get("uid") : null;
      if (typeof claimedUid === "string" && claimedUid !== decoded.uid) {
        throw new Error("RECEIPT_ALREADY_CLAIMED");
      }

      transaction.set(claimRef, {
        uid: decoded.uid,
        tier,
        paymentId: payment.id,
        membershipId: payment.membership?.id ?? null,
        claimedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      transaction.set(userRef, {
        subscribed: true,
        subscriptionTier: tier,
        introductoryDiscount,
        whopPaymentId: payment.id,
        whopMembershipId: payment.membership?.id ?? null,
        whopPlanId: payment.plan?.id ?? null,
        subscriptionAmount: payment.total ?? payment.settlement_amount,
        subscriptionCurrency: payment.currency,
        subscribedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    });

    return NextResponse.json({ ok: true, tier });
  } catch (error) {
    if (error instanceof Error && error.message === "RECEIPT_ALREADY_CLAIMED") {
      return NextResponse.json({ error: "This payment is already linked to another account" }, { status: 409 });
    }
    console.error("[whop/claim-purchase] failed to verify purchase", error);
    return NextResponse.json({ error: "Unable to verify the completed payment" }, { status: 502 });
  }
}
