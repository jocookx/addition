import { errorResponse, okResponse } from "@/lib/http";
import { requireUserFromRequest } from "@/server/auth/require-user";
import { createSupabaseServiceClient } from "@/server/supabase/clients";
import { getStripe } from "@/server/stripe";

export async function POST(request: Request) {
  const auth = await requireUserFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from("addition_users")
      .select("stripe_customer_id")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (error) return errorResponse(error.message, 500);
    const customerId = data?.stripe_customer_id || "";
    if (!customerId) return errorResponse("No Stripe customer is connected to this account yet.", 404);

    const origin = new URL(request.url).origin;
    const body = await request.json().catch(() => ({})) as { returnTo?: unknown };
    const returnTo = typeof body.returnTo === "string" && body.returnTo.startsWith("/") ? body.returnTo : "/settings";
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}${returnTo}`,
    });

    return okResponse({ url: session.url });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Could not open billing portal.", 500);
  }
}
