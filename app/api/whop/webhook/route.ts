import { type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { whopsdk } from "@/lib/whop-sdk";
import { getAdminFirestore } from "@/lib/firebase-admin";
import type { UnwrapWebhookEvent } from "@whop/sdk/resources/webhooks";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers);

  let event: UnwrapWebhookEvent;
  try {
    event = whopsdk.webhooks.unwrap(rawBody, { headers });
  } catch (error) {
    console.error("[whop/webhook] signature verification failed", error);
    return new Response("Invalid signature", { status: 400 });
  }

  const db = getAdminFirestore();
  if (!db) {
    console.error("[whop/webhook] Firestore admin is not configured");
    return new Response("OK", { status: 200 });
  }

  // At-least-once delivery: dedupe by the unique event id.
  const eventLog = db.collection("whopWebhookEvents").doc(event.id);
  try {
    const existing = await eventLog.get();
    if (existing.exists) {
      return new Response("OK", { status: 200 });
    }
  } catch (error) {
    console.error("[whop/webhook] failed to check event log", error);
    return new Response("OK", { status: 200 });
  }

  try {
    const data = event.data as unknown as Record<string, unknown> | null;
    const metadata =
      data && typeof data.metadata === "object" && data.metadata !== null
        ? (data.metadata as Record<string, unknown>)
        : {};
    const uid = typeof metadata.uid === "string" ? metadata.uid : null;

    const succeeded =
      event.type === "payment.succeeded" ||
      event.type === "membership.activated";

    if (uid) {
      const userRef = db.collection("users").doc(uid);

      if (succeeded) {
        await userRef.set(
          {
            subscribed: true,
            subscriptionTier:
              typeof metadata.tier === "string" ? metadata.tier : "monthly",
            whopPaymentId:
              typeof data?.id === "string" ? data.id : null,
            subscribedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      } else if (event.type === "membership.deactivated") {
        await userRef.set(
          {
            subscribed: false,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
    } else if (succeeded && typeof data?.id === "string") {
      // Guest payments are securely claimed after the buyer creates their Longr
      // account. Keeping this record makes reconciliation auditable and retryable.
      await db.collection("pendingWhopPurchases").doc(data.id).set({
        paymentId: data.id,
        tier: typeof metadata.tier === "string" ? metadata.tier : "monthly",
        checkoutEmail:
          typeof metadata.onboarding_email === "string"
            ? metadata.onboarding_email
            : null,
        eventType: event.type,
        receivedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    await eventLog.set({
      type: event.type,
      processedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("[whop/webhook] failed to process event", error);
    return new Response("Processing failed", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
