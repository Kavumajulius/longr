import { Whop } from "@whop/sdk";
import { readFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)="(.*)"$/);
  if (m) env[m[1]] = m[2];
}
process.env = { ...env, ...process.env };

const whopsdk = new Whop({ apiKey: process.env.WHOP_API_KEY });

const ids = process.argv.slice(2);

async function main() {
  console.log("=== Recent payments (last 20) ===");
  try {
    let n = 0;
    for await (const p of whopsdk.payments.list({ company_id: process.env.WHOP_COMPANY_ID })) {
      console.log(JSON.stringify({
        id: p.id,
        status: p.status,
        amount: p.amount,
        currency: p.currency,
        plan: p.plan?.id,
        payment_type: p.payment_type,
        created: p.created_at,
        failure: p.failure_reason ?? p.failure_message ?? null,
        last4: p.card?.last4 ?? null,
      }));
      if (++n >= 20) break;
    }
    if (n === 0) console.log("(no payments found)");
  } catch (e) {
    console.log("payments.list failed:", e.status ?? "", e.message);
  }

  console.log("\n=== Checkout configuration states ===");
  for (const id of ids.length ? ids : ["ch_ah3irWZtUcqU85d"]) {
    try {
      const c = await whopsdk.checkoutConfigurations.retrieve(id);
      console.log(id, "->", JSON.stringify({ id: c.id, mode: c.mode, created: c.created_at, plan: c.plan?.id, deleted: !!c.deleted_at }, null, 0));
    } catch (e) {
      console.log(id, "-> retrieve failed:", e.status ?? "", e.message);
    }
  }
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
