import { Whop } from "@whop/sdk";
import { readFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)="(.*)"$/);
  if (m) env[m[1]] = m[2];
}
process.env = { ...env, ...process.env };

const whopsdk = new Whop({ apiKey: process.env.WHOP_API_KEY });

const PLANS = {
  weekly: "plan_Ze81H1zA72kpz",
  monthly: "plan_fzPN3kxV5zWgf",
  annual: "plan_E7WF2HV8JIUzc",
};

async function main() {
  console.log("=== 1. Whoami / company check ===");
  try {
    const user = await whopsdk.users.retrieve();
    console.log("API key valid, user:", user.username ?? user.id);
  } catch (e) {
    console.log("whoami failed:", e.message);
  }

  console.log("\n=== 2. Plan checks ===");
  for (const [tier, planId] of Object.entries(PLANS)) {
    try {
      const plan = await whopsdk.plans.retrieve(planId);
      console.log(`[${tier}] ${planId}:`, JSON.stringify({
        id: plan.id,
        title: plan.title,
        price: plan.base_price ?? plan.price,
        currency: plan.currency,
        renewal: plan.renewal_period_type ?? plan.renewal_period,
        visible: plan.visible,
        direct: plan.direct,
        stock: plan.stock,
        plan_options: plan.plan_options,
        payment_method_verification: plan.payment_method_verification,
        requirements: plan.requirements,
      }, null, 2));
    } catch (e) {
      console.log(`[${tier}] ${planId} retrieve failed:`, e.status, e.message);
    }
  }

  console.log("\n=== 3. Promo code checks ===");
  const codes = ["LONGRINTRO10V2", "LONGRINTRO15", "LONGRINTRO20", "LONGRINTRO25", "LONGRINTRO30", "LONGRINTRO35", "LONGRINTRO40", "LONGRINTRO45"];
  try {
    const list = [];
    for await (const p of whopsdk.promoCodes.list({ company_id: process.env.WHOP_COMPANY_ID })) {
      list.push(p);
      if (list.length >= 100) break;
    }
    console.log(`Found ${list.length} promo codes for company:`);
    for (const c of list) {
      console.log(` - ${c.code} | type=${c.promo_type} amount=${c.amount} | plans=${c.plan_ids?.join(",") ?? "ALL"} | archived=${c.archived_at ?? "no"}`);
      if (!codes.includes(c.code)) continue;
    }
    const found = new Set(list.map((c) => c.code));
    for (const code of codes) {
      if (!found.has(code)) console.log(` !! MISSING promo code configured in .env.local: ${code}`);
    }
  } catch (e) {
    console.log("promoCodes.list failed:", e.status, e.message);
  }

  console.log("\n=== 4. Create checkout configuration (annual, like the app does) ===");
  try {
    const cfg = await whopsdk.checkoutConfigurations.create({
      account_id: process.env.WHOP_COMPANY_ID,
      plan_id: PLANS.annual,
      metadata: { source: "longr_diagnostic" },
    });
    console.log("Created checkout configuration:", JSON.stringify({
      id: cfg.id,
      purchase_url: cfg.purchase_url,
      mode: cfg.mode,
      plan_id: cfg.plan?.id,
      metadata: cfg.metadata,
    }, null, 2));

    console.log("\n=== 5. Retrieve it back (public endpoint the embed uses) ===");
    try {
      const got = await whopsdk.checkoutConfigurations.retrieve(cfg.id);
      console.log("Retrieve OK:", JSON.stringify({
        id: got.id,
        mode: got.mode,
        plan: got.plan ? { id: got.plan.id, base_price: got.plan.base_price } : null,
        payment_methods: got.payment_method_overrides ?? "(defaults)",
      }, null, 2));
    } catch (e) {
      console.log("retrieve failed:", e.status, e.message);
    }
  } catch (e) {
    console.log("checkoutConfigurations.create failed:", e.status, e.message);
  }
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
