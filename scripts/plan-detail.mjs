import { Whop } from "@whop/sdk";

const sdk = new Whop({ apiKey: process.env.WHOP_API_KEY });

const ids = [
  "plan_Ze81H1zA72kpz", // Weekly
  "plan_fzPN3kxV5zWgf", // Monthly
  "plan_E7WF2HV8JIUzc", // Annual
  "plan_osZA0yKqP5siw", // LONGR Weekly (dyn)
  "plan_tK7Qe9lgnT4y4", // LONGR Monthly (dyn)
];

for (const id of ids) {
  try {
    const p = await sdk.plans.retrieve(id);
    console.log(JSON.stringify({ id, ...p }, null, 1).slice(0, 700));
    console.log("---");
  } catch (e) {
    console.log(`ERR retrieve ${id}:`, e.message, "\n---");
  }
}
