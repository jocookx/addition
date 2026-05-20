import Stripe from "stripe";
import { errorResponse, okResponse } from "@/lib/http";
import { readBearerToken, type AuthenticatedUser } from "@/server/auth/require-user";
import { ensureUserProfile } from "@/server/auth/ensure-user-profile";
import { createSupabaseAnonClient, createSupabaseServiceClient } from "@/server/supabase/clients";

const ACTIVE_REGISTRATION_STATUSES = ["registered", "confirmed"];

function getStripe(): Stripe | null {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) return null;
  if (process.env.NODE_ENV === "production" && apiKey.startsWith("sk_test_")) {
    throw new Error("A Stripe test secret key is configured in production.");
  }
  return new Stripe(apiKey, { apiVersion: "2026-02-25.clover" as Stripe.LatestApiVersion });
}

function getCohortId(workshopId: string): string {
  return workshopId.replace(/^ws-/, "").replace(/-w\d+[a-z]$/, "");
}

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) return errorResponse("Stripe checkout is not configured.", 503);

  const body = await request.json().catch(() => ({}));
  const workshopIds = Array.isArray(body.workshopIds)
    ? Array.from(new Set(body.workshopIds.map((id: unknown) => String(id || "").trim()).filter(Boolean)))
    : [];

  if (!workshopIds.length) return errorResponse("Cart is empty.", 400);
  if (workshopIds.length > 10) return errorResponse("Too many workshops in one checkout.", 400);

  const supabase = createSupabaseServiceClient();
  let user: AuthenticatedUser | null = null;
  const token = readBearerToken(request);
  if (token) {
    const anonClient = createSupabaseAnonClient();
    const { data, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !data.user?.id) return errorResponse("Invalid or expired token.", 401);
    const metadata = data.user.user_metadata && typeof data.user.user_metadata === "object" ? data.user.user_metadata : {};
    const nameCandidate = (metadata as Record<string, unknown>).name;
    user = {
      id: data.user.id,
      email: data.user.email || null,
      name: typeof nameCandidate === "string" && nameCandidate.trim() ? nameCandidate.trim() : null,
    };
    await ensureUserProfile(supabase, user);
  }

  const { data: workshops, error } = await supabase
    .from("addition_workshops")
    .select("id, title, date, time, timezone, format, location, price_pence, capacity, upcoming")
    .in("id", workshopIds);

  if (error) return errorResponse("Could not load cart workshops.", 500);
  if (!workshops || workshops.length !== workshopIds.length) return errorResponse("One or more workshops could not be found.", 404);

  for (const workshop of workshops) {
    if (!workshop.upcoming) return errorResponse(`${workshop.title || "Workshop"} is no longer available.`, 410);
    const pricePence = Number(workshop.price_pence ?? 0);
    if (!Number.isFinite(pricePence) || pricePence <= 0) {
      return errorResponse(`${workshop.title || "Workshop"} is not configured for checkout.`, 503);
    }

    if (user) {
      const { data: existing, error: existingError } = await supabase
        .from("addition_workshop_registrations")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("workshop_id", workshop.id)
        .maybeSingle();
      if (existingError) return errorResponse("Could not verify registration status.", 500);
      if (existing?.status && ACTIVE_REGISTRATION_STATUSES.includes(existing.status)) {
        return errorResponse(`You are already registered for ${workshop.title || "this workshop"}.`, 409);
      }
    }

    const { count, error: countError } = await supabase
      .from("addition_workshop_registrations")
      .select("id", { count: "exact", head: true })
      .eq("workshop_id", workshop.id)
      .in("status", ACTIVE_REGISTRATION_STATUSES);
    if (countError) return errorResponse("Could not verify workshop capacity.", 500);
    if (typeof count === "number" && count >= (workshop.capacity ?? Infinity)) {
      return errorResponse(`${workshop.title || "Workshop"} is fully booked.`, 409);
    }
  }

  const origin = new URL(request.url).origin;
  const firstCohortId = getCohortId(workshops[0].id);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user?.email ?? undefined,
    customer_creation: user ? undefined : "if_required",
    allow_promotion_codes: true,
    client_reference_id: user ? `${user.id}__cart` : "guest__cart",
    line_items: workshops.map((workshop) => ({
      price_data: {
        currency: "gbp",
        unit_amount: Number(workshop.price_pence),
        product_data: {
          name: workshop.title || "ADDITION workshop",
          description: [workshop.date, workshop.time, workshop.timezone].filter(Boolean).join(" "),
        },
      },
      quantity: 1,
    })),
    metadata: {
      kind: "workshop_cart",
      userId: user?.id ?? "",
      checkoutMode: user ? "user" : "guest",
      workshopIds: JSON.stringify(workshopIds),
    },
    success_url: `${origin}/workshops/${encodeURIComponent(firstCohortId)}?checkout=success`,
    cancel_url: `${origin}/workshops/cart?checkout=cancelled`,
  });

  if (!session.url) return errorResponse("Stripe did not return a checkout URL.", 500);
  return okResponse({ url: session.url });
}
