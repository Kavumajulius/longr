import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { ALLOWED_INTRODUCTORY_DISCOUNTS } from "@/lib/whop-plans";

interface DiscountTokenPayload {
  discount: number;
  expiresAt: number;
  nonce: string;
}

const TOKEN_TTL_MS = 20 * 60 * 1000;

function signingSecret(): string {
  return process.env.CHECKOUT_SIGNING_SECRET || process.env.WHOP_WEBHOOK_SECRET || "";
}

function signature(value: string): Buffer {
  return createHmac("sha256", signingSecret())
    .update(`longr-checkout-discount:${value}`)
    .digest();
}

export function issueDiscountToken(discount: number): string | null {
  if (!signingSecret() || !ALLOWED_INTRODUCTORY_DISCOUNTS.has(discount) || discount === 0) {
    return null;
  }
  const payload: DiscountTokenPayload = {
    discount,
    expiresAt: Date.now() + TOKEN_TTL_MS,
    nonce: randomBytes(12).toString("base64url"),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded).toString("base64url")}`;
}

export function verifyDiscountToken(token: unknown): DiscountTokenPayload | null {
  if (!signingSecret() || typeof token !== "string") return null;
  const [encoded, receivedSignature, extra] = token.split(".");
  if (!encoded || !receivedSignature || extra) return null;

  try {
    const expected = signature(encoded);
    const received = Buffer.from(receivedSignature, "base64url");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as Partial<DiscountTokenPayload>;
    if (
      typeof payload.discount !== "number" ||
      !ALLOWED_INTRODUCTORY_DISCOUNTS.has(payload.discount) ||
      payload.discount === 0 ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt <= Date.now() ||
      typeof payload.nonce !== "string" ||
      payload.nonce.length < 8
    ) return null;

    return payload as DiscountTokenPayload;
  } catch {
    return null;
  }
}
