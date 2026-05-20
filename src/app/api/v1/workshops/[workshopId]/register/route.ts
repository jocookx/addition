// Workshop registration: creates a Stripe Checkout Session when Stripe is configured.
// If STRIPE_SECRET_KEY is not present, it falls back to a manually configured
// stripe_payment_link for local/content setup.

import Stripe from "stripe";
import { errorResponse, okResponse } from "@/lib/http";
import { ensureUserProfile } from "@/server/auth/ensure-user-profile";
import { requireUserFromRequest } from "@/server/auth/require-user";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

const ACTIVE_REGISTRATION_STATUSES = ["registered", "confirmed"];

function getCohortId(workshopId: string): string {
  return workshopId.replace(/^ws-/, "").replace(/-w\d+[a-z]$/, "");
}

function isStripeTestPaymentLink(value: string): boolean {
  try {
    const url = new URL(value);
    return url.hostname === "buy.stripe.com" && url.pathname.startsWith("/test_");
  } catch {
    return false;
  }
}

function getStripe(): Stripe | null {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) return null;
  if (process.env.NODE_ENV === "production" && apiKey.startsWith("sk_test_")) {
    throw new Error("A Stripe test secret key is configured in production.");
  }
  return new Stripe(apiKey, { apiVersion: "2026-02-25.clover" as Stripe.LatestApiVersion });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workshopId: string }> },
) {
  const auth = await requireUserFromRequest(request);
  if (!auth.ok) return auth.response;
  const user = auth.user;
  const { workshopId } = await params;

  const supabase = createSupabaseServiceClient();
  try {
    await ensureUserProfile(supabase, user);
  } catch (profileError) {
    console.error("[register] Failed to ensure user profile:", profileError);
    return errorResponse("Could not prepare your account for registration", 500);
  }

  const { data: workshop, error } = await supabase
    .from("addition_workshops")
    .select("id, title, date, time, timezone, format, location, price_pence, stripe_payment_link, capacity, upcoming")
    .eq("id", workshopId)
    .single();

  if (error || !workshop) {
    return errorResponse("Workshop not found", 404);
  }

  if (!workshop.upcoming) {
    return errorResponse("Workshop is no longer available", 410);
  }

  // Check if user is already registered
  const { data: existing, error: existingError } = await supabase
    .from("addition_workshop_registrations")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("workshop_id", workshopId)
    .maybeSingle();

  if (existingError) {
    console.error("[register] Failed to check existing registration:", existingError.message);
    return errorResponse("Could not verify registration status", 500);
  }

  if (existing?.status && ACTIVE_REGISTRATION_STATUSES.includes(existing.status)) {
    return errorResponse("You are already registered for this workshop", 409);
  }

  // Check capacity — count active registrations for this workshop
  const { count, error: countError } = await supabase
    .from("addition_workshop_registrations")
    .select("id", { count: "exact", head: true })
    .eq("workshop_id", workshopId)
    .in("status", ACTIVE_REGISTRATION_STATUSES);

  if (countError) {
    console.error("[register] Failed to check capacity:", countError.message);
    return errorResponse("Could not verify capacity", 500);
  }

  if (typeof count === "number" && count >= (workshop.capacity ?? Infinity)) {
    return errorResponse("This workshop is fully booked", 409);
  }

  const origin = new URL(request.url).origin;
  const cohortId = getCohortId(workshopId);
  const pricePence = Number(workshop.price_pence ?? 0);

  if (!Number.isFinite(pricePence) || pricePence < 0) {
    return errorResponse("Workshop price is not configured", 503);
  }

  if (pricePence === 0) {
    const { error: insertError } = await supabase
      .from("addition_workshop_registrations")
      .upsert(
        {
          user_id: user.id,
          workshop_id: workshopId,
          status: "registered",
          stripe_session_id: null,
        },
        { onConflict: "user_id,workshop_id" },
      );

    if (insertError) {
      console.error("[register] Free registration failed:", insertError.message);
      return errorResponse("Could not register for this workshop", 500);
    }

    return okResponse({ url: `${origin}/workshops/${encodeURIComponent(cohortId)}?registered=success` });
  }

  const stripe = getStripe();
  if (stripe) {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      allow_promotion_codes: true,
      client_reference_id: `${user.id}__${workshopId}`,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            unit_amount: pricePence,
            product_data: {
              name: workshop.title || "ADDITION workshop",
              description: "ADDITION live workshop",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        kind: "workshop",
        userId: user.id,
        workshopId,
      },
      success_url: `${origin}/workshops/${encodeURIComponent(cohortId)}?checkout=success`,
      cancel_url: `${origin}/workshops/${encodeURIComponent(cohortId)}?checkout=cancelled`,
    });

    if (!session.url) {
      return errorResponse("Stripe did not return a checkout URL", 500);
    }

    return okResponse({ url: session.url });
  }

  if (!workshop.stripe_payment_link) {
    return errorResponse("Booking not yet open for this workshop", 503);
  }

  if (
    process.env.NODE_ENV === "production" &&
    isStripeTestPaymentLink(workshop.stripe_payment_link)
  ) {
    console.error("[register] Stripe test payment link configured in production:", workshopId);
    return errorResponse("Booking is not live yet for this workshop", 503);
  }

  // Fallback: append prefilled email to the Stripe Payment Link URL.
  let url: URL;
  try {
    url = new URL(workshop.stripe_payment_link);
    if (user.email) url.searchParams.set("prefilled_email", user.email);
    // Stripe Payment Links support ?client_reference_id= for webhook correlation
    url.searchParams.set("client_reference_id", `${user.id}__${workshopId}`);
  } catch {
    console.error("[register] Malformed stripe_payment_link for workshop:", workshopId);
    return errorResponse("Booking not yet open for this workshop", 503);
  }

  return okResponse({ url: url.toString() });
}
