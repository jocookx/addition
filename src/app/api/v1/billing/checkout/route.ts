import Stripe from "stripe";
import { errorResponse, okResponse } from "@/lib/http";
import { requireUserFromRequest } from "@/server/auth/require-user";
import { getBillingPriceConfig, getConfiguredPriceId, type BillingInterval, type PaidBillingPlan } from "@/server/billing-plans";
import { createSupabaseServiceClient } from "@/server/supabase/clients";
import { getStripe } from "@/server/stripe";

async function resolvePriceId(stripe: Stripe, plan: PaidBillingPlan, interval: BillingInterval): Promise<string> {
  const config = getBillingPriceConfig(plan, interval);
  const envPriceId = getConfiguredPriceId(config);
  if (envPriceId) return envPriceId;

  const prices = await stripe.prices.list({
    active: true,
    lookup_keys: [config.lookupKey],
    limit: 1,
  });
  const priceId = prices.data[0]?.id;
  if (!priceId) {
    throw new Error(
      `Stripe price ${config.lookupKey} is not configured. Run npm run stripe:setup or set ${config.envNames.join(" or ")}.`,
    );
  }
  return priceId;
}

export async function POST(request: Request) {
  const auth = await requireUserFromRequest(request);
  if (!auth.ok) return auth.response;

  let body: { plan?: unknown; returnTo?: unknown; interval?: unknown; embedded?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  const plan: PaidBillingPlan | null = body.plan === "student" ? "student" : body.plan === "pro" ? "pro" : null;
  if (!plan) return errorResponse("plan must be 'pro' or 'student'.", 400);
  const interval = body.interval === "yearly" ? "yearly" : "monthly";
  const isEmbedded = body.embedded === true;

  if (plan === "student") {
    const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from("addition_student_verifications")
      .select("status")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (error) {
      return errorResponse(`Could not verify student status: ${error.message}`, 500);
    }
    if (data?.status !== "approved") {
      return errorResponse("Student access must be approved before checkout.", 403);
    }
  }

  const origin = new URL(request.url).origin;
  const returnTo = typeof body.returnTo === "string" && body.returnTo.startsWith("/") ? body.returnTo : "/dashboard";
  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Stripe init failed", 500);
  }

  let priceId: string;
  try {
    priceId = await resolvePriceId(stripe, plan, interval);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Stripe price lookup failed", 503);
  }

  const sessionMeta = {
    metadata: {
      kind: "subscription",
      plan,
      interval,
      userId: auth.user.id,
    },
    subscription_data: {
      metadata: {
        plan,
        interval,
        userId: auth.user.id,
      },
    },
  };

  const db = createSupabaseServiceClient();
  const { data: profile } = await db
    .from("addition_users")
    .select("stripe_customer_id")
    .eq("id", auth.user.id)
    .maybeSingle();
  const customerId = typeof profile?.stripe_customer_id === "string" && profile.stripe_customer_id
    ? profile.stripe_customer_id
    : undefined;

  let session: Stripe.Checkout.Session;
  try {
    if (isEmbedded) {
      session = await stripe.checkout.sessions.create({
        ui_mode: "embedded",
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: auth.user.id,
        customer: customerId,
        customer_email: customerId ? undefined : auth.user.email ?? undefined,
        return_url: `${origin}${returnTo}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        ...sessionMeta,
      });
    } else {
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: auth.user.id,
        customer: customerId,
        customer_email: customerId ? undefined : auth.user.email ?? undefined,
        success_url: `${origin}${returnTo}?checkout=success`,
        cancel_url: `${origin}${returnTo}?checkout=cancelled`,
        ...sessionMeta,
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stripe session creation failed";
    return errorResponse(msg, 500);
  }

  if (isEmbedded) {
    if (!session.client_secret) {
      return errorResponse("Stripe did not return a client secret.", 500);
    }
    return okResponse({ clientSecret: session.client_secret });
  }

  if (!session.url) {
    return errorResponse("Stripe did not return a checkout URL.", 500);
  }

  return okResponse({ url: session.url });
}
