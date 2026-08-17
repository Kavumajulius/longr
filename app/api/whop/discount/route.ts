import { NextResponse, type NextRequest } from "next/server";
import { issueDiscountToken, verifyDiscountToken } from "@/lib/whop-discount-token";

export const dynamic = "force-dynamic";

const WHEEL_DISCOUNTS = [10, 15, 20, 25, 30, 35] as const;

export async function POST(request: NextRequest) {
  let body: { action?: unknown; token?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let discount: number;
  if (body.action === "spin") {
    discount = WHEEL_DISCOUNTS[Math.floor(Math.random() * WHEEL_DISCOUNTS.length)];
  } else if (body.action === "boost") {
    const current = verifyDiscountToken(body.token);
    if (!current) {
      return NextResponse.json({ error: "The discount offer has expired" }, { status: 409 });
    }
    discount = Math.min(45, current.discount + 10);
  } else {
    return NextResponse.json({ error: "Unknown discount action" }, { status: 400 });
  }

  const token = issueDiscountToken(discount);
  if (!token) {
    return NextResponse.json(
      { error: "Discount signing is not configured" },
      { status: 500 }
    );
  }
  return NextResponse.json({ discount, token });
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
