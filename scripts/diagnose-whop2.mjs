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
  console.log("=== Full plan objects ===");
  for (const [tier, planId] of Object.entries(PLANS)) {
    try {
      const plan = await whopsdk.plans.retrieve(planId);
      console.log(`\n[${tier}] ${planId}:`);
      console.log(JSON.stringify(plan, null, 2));
    } catch (e) {
      console.log(`[${tier}] failed:`, e.status, e.message);
    }
  }

  console.log("\n=== Company / account status ===");
  try {
    const company = await whopsdk.companies.retrieve(process.env.WHOP_COMPANY_ID);
    console.log(JSON.stringify(company, null, 2));
  } catch (e) {
    console.log("company retrieve failed:", e.status, e.message);
  }
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
