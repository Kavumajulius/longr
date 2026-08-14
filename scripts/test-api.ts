async function runTest() {
  async function getToken(action: string, prevToken?: string) {
    const res = await fetch("http://localhost:3005/api/whop/discount", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, token: prevToken })
    });
    return await res.json();
  }

  async function testCheckout(name: string, payload: any) {
    console.log(`\n--- Test: ${name} ---`);
    const res = await fetch("http://localhost:3005/api/whop/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
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

  // Get a random discount token (10-35%)
  const { discount: d1, token: t1 } = await getToken("spin");
  await testCheckout(`${d1}% promotion on weekly plan`, {
    email: "test@example.com",
    tier: "weekly",
    discount: d1,
    discountToken: t1
  });

  // Boost to 45% (or +10%)
  const { discount: d2, token: t2 } = await getToken("boost", t1);
  await testCheckout(`${d2}% promotion on monthly plan`, {
    email: "test@example.com",
    tier: "monthly",
    discount: d2,
    discountToken: t2
  });

  // Invalid token
  await testCheckout("Invalid discount token", {
    email: "test@example.com",
    tier: "weekly",
    discount: 30,
    discountToken: "invalid.token.here"
  });
}

runTest();
