import { Whop } from "@whop/sdk";

const sdk = new Whop({ apiKey: process.env.WHOP_API_KEY });

const productId = "prod_1r0zECBxVDbZo";

try {
  const plans = await sdk.plans.list({
    account_id: process.env.WHOP_COMPANY_ID,
    product_id: productId,
  });
  console.log("PLANS for product", productId, ":");
  for (const p of plans.data ?? []) {
    console.log(
      `- id=${p.id} title=${p.title} price=${p.recurring_price ?? p.price} type=${p.recurring ? "recurring" : "one_time"}`,
    );
  }
} catch (e) {
  console.error("plans.list failed:", e.message);
}

try {
  const configs = await sdk.checkoutConfigurations.list({
    account_id: process.env.WHOP_COMPANY_ID,
  });
  console.log("\nCHECKOUT CONFIGS:");
  for (const c of configs.data ?? []) {
    console.log(
      `- id=${c.id} planId=${c.plan?.id} planTitle=${c.plan?.title} status=${c.status ?? ""}`,
    );
  }
} catch (e) {
  console.error("checkoutConfigurations.list failed:", e.message);
}
