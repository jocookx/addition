import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) throw new Error("STRIPE_SECRET_KEY is not configured.");
  if (process.env.NODE_ENV === "production" && apiKey.startsWith("sk_test_")) {
    throw new Error("A Stripe test secret key is configured in production.");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(apiKey, { apiVersion: "2026-02-25.clover" as Stripe.LatestApiVersion });
  }
  return stripeClient;
}
