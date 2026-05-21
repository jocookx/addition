import Stripe from "stripe";
import { cachedOkResponse, errorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

type PriceInfo = {
  plan: "pro" | "student";
  interval: "monthly" | "yearly";
  amount: number;
  currency: string;
};

const PRICE_LOOKUP: Array<{
  names: string[];
  plan: "pro" | "student";
  interval: "monthly" | "yearly";
}> = [
  {
    names: ["STRIPE_PRO_PRICE_ID", "STRIPE_PRICE_PRO_MONTH"],
    plan: "pro",
    interval: "monthly",
  },
  {
    names: ["STRIPE_PRO_YEARLY_PRICE_ID", "STRIPE_PRICE_PRO_YEAR", "STRIPE_PRICE_PRO_YEARLY"],
    plan: "pro",
    interval: "yearly",
  },
  {
    names: ["STRIPE_STUDENT_PRICE_ID", "STRIPE_PRICE_STUDENT_MONTH"],
    plan: "student",
    interval: "monthly",
  },
  {
    names: ["STRIPE_STUDENT_YEARLY_PRICE_ID", "STRIPE_PRICE_STUDENT_YEAR", "STRIPE_PRICE_STUDENT_YEARLY"],
    plan: "student",
    interval: "yearly",
  },
];

export async function GET() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) return errorResponse("Stripe not configured", 503);

  const stripe = new Stripe(apiKey, { apiVersion: "2026-02-25.clover" as Stripe.LatestApiVersion });

  // Build map of priceId → { plan, interval }
  const idMeta = new Map<string, { plan: "pro" | "student"; interval: "monthly" | "yearly" }>();
  for (const { names, plan, interval } of PRICE_LOOKUP) {
    for (const name of names) {
      const id = process.env[name];
      if (id) {
        idMeta.set(id, { plan, interval });
        break;
      }
    }
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
