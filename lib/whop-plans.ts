export const WHOP_TIER_DETAILS = {
  weekly: { title: "Longr 1 Week", amount: 9.99, days: 7 },
  monthly: { title: "Longr 4 Weeks", amount: 24.99, days: 28 },
  annual: { title: "Longr Annual", amount: 79.99, days: 365 },
} as const;

export type WhopTier = keyof typeof WHOP_TIER_DETAILS;

export const WHOP_TIER_PLANS: Record<WhopTier, string> = {
  weekly: "plan_Ze81H1zA72kpz",
  monthly: "plan_fzPN3kxV5zWgf",
  annual: "plan_E7WF2HV8JIUzc",
};

// Wheel outcomes are 10-35%. A single checkout-recovery offer can add 10%.
export const ALLOWED_INTRODUCTORY_DISCOUNTS = new Set([
  0, 10, 15, 20, 25, 30, 35, 40, 45,
]);

export function isWhopTier(value: unknown): value is WhopTier {
  return typeof value === "string" && value in WHOP_TIER_DETAILS;
}
