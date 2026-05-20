// Stripe webhook handler
// Listens for checkout.session.completed events from Payment Links
// and writes a confirmed registration row to Supabase.
//
// Environment variables required:
//   STRIPE_SECRET_KEY        — from Stripe Dashboard → Developers → API keys
//   STRIPE_WEBHOOK_SECRET    — from Stripe Dashboard → Webhooks → Signing secret
//
// Stripe CLI local testing:
//   stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe

import { createSupabaseServiceClient } from "@/server/supabase/clients";
import { errorResponse, okResponse } from "@/lib/http";
import { sendWorkshopConfirmation } from "@/server/email/send-workshop-confirmation";

// Stripe signature verification using the Web Crypto API.
// No Stripe SDK required — this implements the same HMAC-SHA256 algorithm
// documented at https://stripe.com/docs/webhooks/signatures
async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  // Parse "t=1234,v1=abc...,v0=..." header format
  const parts: Record<string, string> = {};
  for (const chunk of signatureHeader.split(",")) {
    const eq = chunk.indexOf("=");
    if (eq > 0) parts[chunk.slice(0, eq)] = chunk.slice(eq + 1);
  }

  const timestamp = parts["t"];
  const expectedSig = parts["v1"];
  if (!timestamp || !expectedSig) return false;

  // Reject replays older than 5 minutes
  const tsSeconds = parseInt(timestamp, 10);
  if (!Number.isFinite(tsSeconds)) return false; // malformed timestamp
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - tsSeconds) > 300) return false;

  const payload = `${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const computed = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison via XOR to prevent timing attacks
  if (computed.length !== expectedSig.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(req: Request) {
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeWebhookSecret) {
    return errorResponse("Stripe webhook secret not configured", 500);
  }

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return errorResponse("Missing stripe-signature header", 400);
  }

  const valid = await verifyStripeSignature(rawBody, signature, stripeWebhookSecret);
  if (!valid) {
    return errorResponse("Invalid webhook signature", 400);
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  if (event.type !== "checkout.session.completed") {
    // Acknowledge other event types without processing
    return okResponse({ received: true });
  }

  const session = event.data.object as {
    client_reference_id?: string;
    customer_email?: string;
    customer_details?: {
      email?: string | null;
      name?: string | null;
    } | null;
    id?: string;
    metadata?: Record<string, string>;
    payment_status?: string;
  };

  const supabase = createSupabaseServiceClient();

  if (session.metadata?.kind === "subscription") {
    const userId = session.metadata.userId || session.client_reference_id || "";
    const plan = session.metadata.plan === "student" ? "student" : "pro";

    if (!userId) {
      return errorResponse("Missing subscription user reference", 400);
    }

    const { error } = await supabase
      .from("addition_users")
      .update({ plan })
      .eq("id", userId);

    if (error) {
      console.error("[stripe-webhook] Subscription plan update failed:", error.message);
      return errorResponse("Failed to update subscription", 500);
    }

    return okResponse({ received: true });
  }

  if (session.metadata?.kind === "workshop_cart") {
    if (session.payment_status !== "paid") {
      return okResponse({ received: true });
    }

    const userId = session.metadata.userId || "";
    let workshopIds: string[] = [];
    try {
      const parsed = JSON.parse(session.metadata.workshopIds || "[]") as unknown;
      workshopIds = Array.isArray(parsed) ? parsed.map((id) => String(id || "").trim()).filter(Boolean) : [];
    } catch {
      workshopIds = [];
    }

    if (!workshopIds.length) return errorResponse("Invalid workshop cart metadata", 400);

    if (!userId) {
      const guestEmail = session.customer_details?.email?.toLowerCase() ?? "";
      const guestName = session.customer_details?.name ?? "";
      if (!guestEmail) return errorResponse("Missing guest checkout email", 400);

      const rows = workshopIds.map((workshopId) => ({
        user_id: null,
        guest_email: guestEmail,
        guest_name: guestName,
        workshop_id: workshopId,
        status: "registered",
        stripe_session_id: session.id ?? null,
      }));
      const { error } = await supabase
        .from("addition_workshop_registrations")
        .upsert(rows, { onConflict: "stripe_session_id,workshop_id" });

      if (error) {
        console.error("[stripe-webhook] Guest cart DB upsert failed:", error.message);
        return errorResponse("Failed to record guest cart registrations", 500);
      }

      return okResponse({ received: true });
    }

    const authUser = await supabase.auth.admin.getUserById(userId);
    const userEmail = authUser.data?.user?.email ?? "";
    const userNameCandidate =
      authUser.data?.user?.user_metadata?.name ??
      authUser.data?.user?.user_metadata?.full_name ??
      "";

    if (userEmail) {
      const { error: profileError } = await supabase
        .from("addition_users")
        .upsert(
          {
            id: userId,
            email: userEmail.toLowerCase(),
            name: typeof userNameCandidate === "string" && userNameCandidate.trim()
              ? userNameCandidate.trim()
              : userEmail.split("@")[0],
          },
          { onConflict: "id" },
        );
      if (profileError) {
        console.error("[stripe-webhook] Cart user profile upsert failed:", profileError.message);
        return errorResponse("Failed to prepare registration profile", 500);
      }
    }

    const rows = workshopIds.map((workshopId) => ({
      user_id: userId,
      workshop_id: workshopId,
      status: "registered",
      stripe_session_id: session.id ?? null,
    }));
    const { error } = await supabase
      .from("addition_workshop_registrations")
      .upsert(rows, { onConflict: "user_id,workshop_id" });

    if (error) {
      console.error("[stripe-webhook] Cart DB upsert failed:", error.message);
      return errorResponse("Failed to record cart registrations", 500);
    }

    return okResponse({ received: true });
  }

  if (session.metadata?.kind && session.metadata.kind !== "workshop") {
    return okResponse({ received: true });
  }

  if (session.payment_status !== "paid") {
    return okResponse({ received: true });
  }

  let userId = session.metadata?.userId ?? "";
  let workshopId = session.metadata?.workshopId ?? "";

  if (!userId || !workshopId) {
    // client_reference_id format: "{userId}__{workshopId}"
    // Split on first __ only so workshopIds containing __ are preserved.
    const ref = session.client_reference_id ?? "";
    const separatorIdx = ref.indexOf("__");
    if (separatorIdx === -1) {
      return errorResponse("Invalid client_reference_id", 400);
    }
    userId = ref.slice(0, separatorIdx);
    workshopId = ref.slice(separatorIdx + 2);
  }

  if (!userId || !workshopId) {
    return errorResponse("Invalid client_reference_id", 400);
  }

  const authUser = await supabase.auth.admin.getUserById(userId);
  const userEmail = authUser.data?.user?.email ?? "";
  const userNameCandidate =
    authUser.data?.user?.user_metadata?.name ??
    authUser.data?.user?.user_metadata?.full_name ??
    "";

  if (userEmail) {
    const { error: profileError } = await supabase
      .from("addition_users")
      .upsert(
        {
          id: userId,
          email: userEmail.toLowerCase(),
          name: typeof userNameCandidate === "string" && userNameCandidate.trim()
            ? userNameCandidate.trim()
            : userEmail.split("@")[0],
        },
        { onConflict: "id" },
      );

    if (profileError) {
      console.error("[stripe-webhook] User profile upsert failed:", profileError.message);
      return errorResponse("Failed to prepare registration profile", 500);
    }
  }

  const { error } = await supabase
    .from("addition_workshop_registrations")
    .upsert(
      {
        user_id:          userId,
        workshop_id:      workshopId,
        status:           "registered",
        stripe_session_id: session.id ?? null,
      },
      { onConflict: "user_id,workshop_id" },
    );

  if (error) {
    console.error("[stripe-webhook] DB upsert failed:", error.message);
    return errorResponse("Failed to record registration", 500);
  }

  // Send confirmation email — best-effort, non-blocking
  void (async () => {
    try {
      // Resolve user email + workshop details for the confirmation email
      const workshopResult = await supabase
          .from("addition_workshops")
          .select("title, date, time, timezone, format, location")
          .eq("id", workshopId)
          .single();

      const email = authUser.data?.user?.email;
      const ws = workshopResult.data;

      if (email && ws) {
        await sendWorkshopConfirmation({
          toEmail:        email,
          toName:         typeof userNameCandidate === "string" && userNameCandidate.trim() ? userNameCandidate.trim() : null,
          workshopId,
          workshopTitle:  ws.title ?? workshopId,
          date:           ws.date  ?? "",
          time:           ws.time  ?? "",
          timezone:       ws.timezone ?? "UTC",
          format:         ws.format   ?? "Online",
          location:       ws.location ?? "",
        });
      }
    } catch (emailErr) {
      console.error("[stripe-webhook] Failed to send confirmation email:", emailErr);
    }
  })();

  return okResponse({ received: true });
}
