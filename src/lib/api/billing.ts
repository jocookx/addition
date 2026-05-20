import { fetchJson } from "@/lib/api/fetch-json";

export type BillingPlan = "pro" | "student";
export type BillingInterval = "monthly" | "yearly";

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
