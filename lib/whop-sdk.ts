import { Whop } from "@whop/sdk";

export const whopsdk = new Whop({
  apiKey: process.env.WHOP_API_KEY,
  webhookKey: btoa(process.env.WHOP_WEBHOOK_SECRET || ""),
});

export const WHOP_COMPANY_ID = process.env.WHOP_COMPANY_ID;
export const WHOP_PRODUCT_ID = process.env.WHOP_PRODUCT_ID;
