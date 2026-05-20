import Stripe from "stripe";
import { errorResponse, okResponse } from "@/lib/http";
import { ensureUserProfile } from "@/server/auth/ensure-user-profile";
import { requireUserFromRequest } from "@/server/auth/require-user";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

const ACTIVE_REGISTRATION_STATUSES = ["registered", "confirmed"];

function getCohortId(workshopId: string): string {
  return workshopId.replace(/^ws-/, "").replace(/-w\d+[a-z]$/, "");
}

function getStripe(): Stripe | null {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) return null;
  if (process.env.NODE_ENV === "production" && apiKey.startsWith("sk_test_")) {
    throw new Error("A Stripe test secret key is configured in production.");
  }
  return new Stripe(apiKey, { apiVersion: "2026-02-25.clover" as Stripe.LatestApiVersion });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workshopId: string }> },
) {
  const auth = await requireUserFromRequest(request);
  if (!auth.ok) return auth.response;

  const stripe = getStripe();
  if (!stripe) {
    return errorResponse("Stripe embedded checkout is not configured.", 503);
  }

  const user = auth.user;
  const { workshopId } = await params;
  const supabase = createSupabaseServiceClient();

  try {
    await ensureUserProfile(supabase, user);
  } catch (profileError) {
    console.error("[checkout-session] Failed to ensure user profile:", profileError);
    return errorResponse("Could not prepare your account for checkout", 500);
  }

  const { data: workshop, error } = await supabase
    .from("addition_workshops")
    .select("id, title, date, time, timezone, format, location, price_pence, capacity, upcoming")
    .eq("id", workshopId)
    .single();

  if (error || !workshop) {
    return errorResponse("Workshop not found", 404);
  }

  if (!workshop.upcoming) {
    return errorResponse("Workshop is no longer available", 410);
  }

  const pricePence = Number(workshop.price_pence ?? 0);
  if (!Number.isFinite(pricePence) || pricePence <= 0) {
    return errorResponse("Workshop price is not configured for checkout", 503);
  }

  const { data: existing, error: existingError } = await supabase
    .from("addition_workshop_registrations")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("workshop_id", workshopId)
    .maybeSingle();

  if (existingError) {
    console.error("[checkout-session] Failed to check existing registration:", existingError.message);
    return errorResponse("Could not verify registration status", 500);
  }

  if (existing?.status && ACTIVE_REGISTRATION_STATUSES.includes(existing.status)) {
    return errorResponse("You are already registered for this workshop", 409);
  }

  const { count, error: countError } = await supabase
    .from("addition_workshop_registrations")
    .select("id", { count: "exact", head: true })
    .eq("workshop_id", workshopId)
    .in("status", ACTIVE_REGISTRATION_STATUSES);

  if (countError) {
    console.error("[checkout-session] Failed to check capacity:", countError.message);
    return errorResponse("Could not verify capacity", 500);
  }

  if (typeof count === "number" && count >= (workshop.capacity ?? Infinity)) {
    return errorResponse("This workshop is fully booked", 409);
  }

  const origin = new URL(request.url).origin;
  const cohortId = getCohortId(workshopId);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    ui_mode: "embedded",
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
    return_url: `${origin}/workshops/${encodeURIComponent(cohortId)}?checkout=complete&session_id={CHECKOUT_SESSION_ID}`,
  });

  if (!session.client_secret) {
    return errorResponse("Stripe did not return an embedded checkout client secret", 500);
  }

  return okResponse({ clientSecret: session.client_secret });
}
