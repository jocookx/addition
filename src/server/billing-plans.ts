export type PaidBillingPlan = "pro" | "student";
export type BillingInterval = "monthly" | "yearly";

export type BillingPriceConfig = {
  plan: PaidBillingPlan;
  interval: BillingInterval;
  lookupKey: string;
  envNames: string[];
};

export const BILLING_PRICE_CONFIGS: BillingPriceConfig[] = [
  {
    plan: "pro",
    interval: "monthly",
    lookupKey: "addition_pro_monthly",
    envNames: ["STRIPE_PRO_PRICE_ID", "STRIPE_PRICE_PRO_MONTH"],
  },
  {
    plan: "pro",
    interval: "yearly",
    lookupKey: "addition_pro_yearly",
    envNames: ["STRIPE_PRO_YEARLY_PRICE_ID", "STRIPE_PRICE_PRO_YEAR", "STRIPE_PRICE_PRO_YEARLY"],
  },
  {
    plan: "student",
    interval: "monthly",
    lookupKey: "addition_student_monthly",
    envNames: ["STRIPE_STUDENT_PRICE_ID", "STRIPE_PRICE_STUDENT_MONTH"],
  },
  {
    plan: "student",
    interval: "yearly",
    lookupKey: "addition_student_yearly",
    envNames: ["STRIPE_STUDENT_YEARLY_PRICE_ID", "STRIPE_PRICE_STUDENT_YEAR", "STRIPE_PRICE_STUDENT_YEARLY"],
  },
];

export function getBillingPriceConfig(plan: PaidBillingPlan, interval: BillingInterval): BillingPriceConfig {
  const config = BILLING_PRICE_CONFIGS.find((item) => item.plan === plan && item.interval === interval);
  if (!config) throw new Error(`Unsupported billing price: ${plan}/${interval}`);
  return config;
}

export function getConfiguredPriceId(config: BillingPriceConfig): string | null {
  for (const name of config.envNames) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return null;
}
