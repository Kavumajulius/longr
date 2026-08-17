import { NextResponse, type NextRequest } from "next/server";
import { issueDiscountToken, verifyDiscountToken } from "@/lib/whop-discount-token";

export const dynamic = "force-dynamic";

const WHEEL_DISCOUNTS = [10, 15, 20, 25, 30, 35] as const;

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
        "[whop/discount] Invalid response – received HTML instead of JSON:",
        text.substring(0, 200),
      );
      return NextResponse.json(
        { error: "Whop discount API returned an error page" },
        { status: 502 },
      );
    }

    const body = data as { action?: unknown; token?: unknown };

    if (body.action === "spin") {
      const discount = WHEEL_DISCOUNTS[Math.floor(Math.random() * WHEEL_DISCOUNTS.length)];
      const token = issueDiscountToken(discount);
      if (!token) {
        return NextResponse.json(
          { error: "Discount signing is not configured" },
          { status: 500 },
        );
      }
      return NextResponse.json({ discount, token });
    } else if (body.action === "boost") {
      if (!body.token) {
        return NextResponse.json({ error: "Token required" }, { status: 400 });
      }
      // The token is a signed string, verification handles parsing
      const current = verifyDiscountToken(body.token as string);
      if (!current) {
        return NextResponse.json({ error: "The discount offer has expired" }, { status: 409 });
      }
      const discount = Math.min(45, current.discount + 10);
      const newToken = issueDiscountToken(discount);
      if (!newToken) {
        return NextResponse.json(
          { error: "Discount signing is not configured" },
          { status: 500 },
        );
      }
      return NextResponse.json({ discount, token: newToken });
    } else {
      return NextResponse.json({ error: "Unknown discount action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("[whop/discount] handler error:", error.message);
    return NextResponse.json({ error: "Handler error: " + error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}