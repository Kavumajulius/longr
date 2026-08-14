import { issueDiscountToken, verifyDiscountToken } from "../lib/whop-discount-token";
import { POST as checkoutRoute } from "../app/api/whop/checkout/route";
import { NextRequest } from "next/server";
import fs from "fs";

// Mock env
const envLocal = fs.readFileSync(".env.local", "utf-8");
for (const line of envLocal.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    process.env[key] = value;
  }
}

async function runTest() {
  async function testCheckout(name: string, payload: any) {
    console.log(`\n--- Test: ${name} ---`);
    const req = new NextRequest("http://localhost:3000/api/whop/checkout", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    
    const res = await checkoutRoute(req);
    const data = await res.json();
    console.log("Status:", res.status);
    if (res.status === 200) {
      console.log("Pricing:", data.pricing);
      console.log("Promo code:", data.promoCode);
      if (data.pricing.discount > 0) {
        if (data.pricing.total < data.pricing.regularAmount && data.pricing.renewalAmount === data.pricing.regularAmount) {
            console.log("✅ Discount applies only to first payment, renewal is full price.");
        } else {
            console.log("❌ Failed validation: renewal is not full price or total is not discounted.");
        }
      }
    } else {
      console.log("Error:", data);
    }
  }

  // 1. No-discount annual checkout
  await testCheckout("No-discount annual checkout", {
    email: "test@example.com",
    tier: "annual",
    discount: 0
  });

  // 2. 10% promotion on a recurring plan (monthly)
  const token10 = issueDiscountToken(10);
  await testCheckout("10% promotion on weekly plan", {
    email: "test@example.com",
    tier: "weekly",
    discount: 10,
    discountToken: token10
  });

  // 3. 25% promotion on a recurring plan (monthly)
  const token25 = issueDiscountToken(25);
  await testCheckout("25% promotion on monthly plan", {
    email: "test@example.com",
    tier: "monthly",
    discount: 25,
    discountToken: token25
  });

  // 4. 45% promotion on a recurring plan (annual)
  const token45 = issueDiscountToken(45);
  await testCheckout("45% promotion on annual plan", {
    email: "test@example.com",
    tier: "annual",
    discount: 45,
    discountToken: token45
  });

  // 5. Missing promotion environment variable
  const oldEnv = process.env.WHOP_PROMO_CODE_20;
  delete process.env.WHOP_PROMO_CODE_20;
  const token20 = issueDiscountToken(20);
  await testCheckout("Missing promotion env var (20%)", {
    email: "test@example.com",
    tier: "weekly",
    discount: 20,
    discountToken: token20
  });
  process.env.WHOP_PROMO_CODE_20 = oldEnv;

  // 6. Modified or invalid signed discount token
  await testCheckout("Modified discount token", {
    email: "test@example.com",
    tier: "weekly",
    discount: 30,
    discountToken: token45 // Sending 45% token for 30% discount
  });
  await testCheckout("Invalid discount token", {
    email: "test@example.com",
    tier: "weekly",
    discount: 30,
    discountToken: "invalid.token.here"
  });

  // 7. Expired signed discount token
  // Let's create an expired token by monkey-patching Date.now
  const originalDateNow = Date.now;
  Date.now = () => originalDateNow() - (1000 * 60 * 60 * 24); // 24 hours ago
  const expiredToken = issueDiscountToken(15);
  Date.now = originalDateNow;
  
  await testCheckout("Expired signed discount token", {
    email: "test@example.com",
    tier: "weekly",
    discount: 15,
    discountToken: expiredToken
  });

}

runTest();
