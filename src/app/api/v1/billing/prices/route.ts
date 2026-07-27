import Stripe from "stripe";
import { cachedOkResponse, errorResponse } from "@/lib/http";
import { BILLING_PRICE_CONFIGS, getConfiguredPriceId } from "@/server/billing-plans";

export const dynamic = "force-dynamic";

type PriceInfo = {
  plan: "pro" | "student";
  interval: "monthly" | "yearly";
  amount: number;
  currency: string;
};

export async function GET() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) return errorResponse("Stripe not configured", 503);

  const stripe = new Stripe(apiKey, { apiVersion: "2026-02-25.clover" as Stripe.LatestApiVersion });

  const idMeta = new Map<string, { plan: "pro" | "student"; interval: "monthly" | "yearly" }>();
  try {
    for (const config of BILLING_PRICE_CONFIGS) {
      const id = getConfiguredPriceId(config);
      if (id) {
        idMeta.set(id, { plan: config.plan, interval: config.interval });
        continue;
      }
      const prices = await stripe.prices.list({
        active: true,
        lookup_keys: [config.lookupKey],
        limit: 1,
      });
      const lookupPriceId = prices.data[0]?.id;
      if (lookupPriceId) {
        idMeta.set(lookupPriceId, { plan: config.plan, interval: config.interval });
      }
    }
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Failed to resolve Stripe prices", 500);
  }

  if (!idMeta.size) return errorResponse("No prices configured", 503);

  try {
    const prices = await Promise.all(
      [...idMeta.keys()].map((id) => stripe.prices.retrieve(id)),
    );

    const result: PriceInfo[] = prices.map((price) => ({
      ...(idMeta.get(price.id) as { plan: "pro" | "student"; interval: "monthly" | "yearly" }),
      amount: price.unit_amount ?? 0,
      currency: price.currency,
    }));

    return cachedOkResponse(result, 3600, 86400);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Failed to fetch prices", 500);
  }
}
