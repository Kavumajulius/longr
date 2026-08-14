import fs from "fs";

async function verify() {
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

  const { Whop } = await import("@whop/sdk");
  const whopsdk = new Whop({ apiKey: process.env.WHOP_API_KEY });

  console.log("=== VERIFYING ALL WHOP PROMO CODES ===\n");

  let pass = true;
  let hasMore = true;
  let cursor: string | undefined;
  const allPromos: any[] = [];

  while (hasMore) {
    const response: any = await whopsdk.promoCodes.list({
      company_id: process.env.WHOP_COMPANY_ID!,
      ...(cursor ? { after: cursor } : {}),
    });
    allPromos.push(...response.data);
    hasMore = response.page_info?.has_next_page ?? false;
    cursor = response.page_info?.end_cursor;
  }

  const expectedEnvVars: Record<number, string> = {
    10: process.env.WHOP_PROMO_CODE_10 ?? "",
    15: process.env.WHOP_PROMO_CODE_15 ?? "",
    20: process.env.WHOP_PROMO_CODE_20 ?? "",
    25: process.env.WHOP_PROMO_CODE_25 ?? "",
    30: process.env.WHOP_PROMO_CODE_30 ?? "",
    35: process.env.WHOP_PROMO_CODE_35 ?? "",
    40: process.env.WHOP_PROMO_CODE_40 ?? "",
    45: process.env.WHOP_PROMO_CODE_45 ?? "",
  };

  // Check all expected env vars are set
  console.log("--- Environment Variable Check ---");
  for (const [pct, code] of Object.entries(expectedEnvVars)) {
    if (!code) {
      console.log(`❌ WHOP_PROMO_CODE_${pct} is NOT SET`);
      pass = false;
    } else {
      console.log(`✅ WHOP_PROMO_CODE_${pct} = "${code}"`);
    }
  }

  console.log("\n--- Whop API Promo Code Verification ---");
  for (const [pct, code] of Object.entries(expectedEnvVars)) {
    if (!code) { console.log(`⏭️ Skipping ${pct}% (env var not set)`); continue; }
    
    const promo = allPromos.find(p => p.code?.toUpperCase() === code.toUpperCase());
    
    if (!promo) {
      console.log(`❌ ${code}: NOT FOUND in Whop API`);
      pass = false;
      continue;
    }

    const checks = {
      status: promo.status === "active",
      duration: promo.duration === "once",
      amount: Math.abs(promo.amount_off - parseInt(pct as string) / 100) < 0.001,
      type: promo.promo_type === "percentage",
      one_per_customer: promo.one_per_customer === true,
      product: promo.product?.id === process.env.WHOP_PRODUCT_ID,
      unlimited_stock: promo.unlimited_stock === true,
      no_expiry: promo.expires_at === null,
    };

    const allPassed = Object.values(checks).every(Boolean);
    const icon = allPassed ? "✅" : "❌";

    console.log(`${icon} ${code} (${promo.id})`);
    console.log(`   status: ${promo.status} ${checks.status ? "✓" : "✗"}`);
    console.log(`   duration: ${promo.duration} ${checks.duration ? "✓" : "✗"}`);
    console.log(`   amount_off: ${promo.amount_off} (expected ${pct}%) ${checks.amount ? "✓" : "✗"}`);
    console.log(`   promo_type: ${promo.promo_type} ${checks.type ? "✓" : "✗"}`);
    console.log(`   one_per_customer: ${promo.one_per_customer} ${checks.one_per_customer ? "✓" : "✗"}`);
    console.log(`   product_scope: ${promo.product?.id} ${checks.product ? "✓" : "✗"}`);
    console.log(`   unlimited_stock: ${promo.unlimited_stock} ${checks.unlimited_stock ? "✓" : "✗"}`);
    console.log(`   expires_at: ${promo.expires_at} ${checks.no_expiry ? "✓" : "✗"}`);

    if (!allPassed) pass = false;
  }

  console.log("\n=== RESULT ===");
  if (pass) {
    console.log("✅ All promotions verified successfully!");
  } else {
    console.log("❌ One or more verifications FAILED — see details above.");
    process.exit(1);
  }
}

verify();
