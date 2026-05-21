import { fetchJson } from "@/lib/api/fetch-json";

export type BillingPlan = "pro" | "student";
export type BillingInterval = "monthly" | "yearly";

export type PlanPrice = {
  plan: BillingPlan;
  interval: BillingInterval;
  amount: number;   // in smallest currency unit (e.g. pence / cents)
  currency: string; // e.g. "gbp"
};

export async function getBillingCheckoutUrl(
  plan: BillingPlan,
  accessToken: string,
  returnTo = "/dashboard",
  interval: BillingInterval = "monthly",
): Promise<string> {
  const body = await fetchJson<{ url: string }>("/api/v1/billing/checkout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ plan, returnTo, interval }),
  });
  return body.url;
}

export async function getBillingClientSecret(
  plan: BillingPlan,
  interval: BillingInterval,
  accessToken: string,
  returnTo = "/dashboard",
): Promise<string> {
  const body = await fetchJson<{ clientSecret: string }>("/api/v1/billing/checkout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ plan, returnTo, interval, embedded: true }),
  });
  return body.clientSecret;
}

/** Fetches live plan prices from Stripe (cached at the CDN). */
export async function getPlanPrices(): Promise<PlanPrice[]> {
  try {
    return await fetchJson<PlanPrice[]>("/api/v1/billing/prices");
  } catch {
    return [];
  }
}
