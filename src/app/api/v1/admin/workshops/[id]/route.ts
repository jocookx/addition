import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";
import { sendWorkshopRecordingAvailable } from "@/server/email/send-workshop-recording-available";

const WorkshopPatchSchema = z.object({
  title:               z.string().min(1).optional(),
  date:                z.string().optional(),
  time:                z.string().optional(),
  timezone:            z.string().optional(),
  duration:            z.string().optional(),
  format:              z.enum(["online", "in-person"]).optional(),
  location:            z.string().optional(),
  price:               z.string().optional(),
  price_pence:         z.number().int().nonnegative().optional(),
  capacity:            z.number().int().nonnegative().optional(),
  upcoming:            z.boolean().optional(),
  track:               z.string().optional(),
  level:               z.string().optional(),
  week:                z.number().int().nonnegative().optional(),
  software:            z.array(z.string()).optional(),
  image:               z.string().optional(),
  description:         z.string().optional(),
  learn:               z.array(z.string()).optional(),
  included:            z.array(z.string()).optional(),
  principles:          z.array(z.string()).optional(),
  stripe_payment_link: z.string().nullable().optional(),
  tutor_id:            z.string().nullable().optional(),
  start_time:          z.string().nullable().optional(),
  end_time:            z.string().nullable().optional(),
  live_provider:       z.enum(["zoom", "youtube", "vimeo", "custom", "other"]).optional(),
  join_url:            z.string().optional(),
  host_url:            z.string().optional(),
  meeting_id:          z.string().optional(),
  passcode:            z.string().optional(),
  live_embed_url:      z.string().optional(),
  calendar_url:        z.string().optional(),
  pre_work:            z.array(z.string()).optional(),
  resources:           z.array(z.string()).optional(),
  recording_status:    z.enum(["none", "processing", "available", "failed"]).optional(),
  recording_url:       z.string().optional(),
  recording_embed_url: z.string().optional(),
  recording_duration:  z.string().optional(),
  recording_thumbnail: z.string().optional(),
  recording_access_level: z.enum(["booked_users", "pro", "student", "purchased", "free"]).optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) return errorResponse("Missing id", 400);

  try {
    const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from("addition_workshops")
      .select(`
        id, title, date, time, timezone, duration, format, location,
        price, price_pence, capacity, upcoming,
        track, level, week, software, image, description,
        learn, included, principles,
        start_time, end_time, live_provider, join_url, host_url, meeting_id, passcode, live_embed_url,
        calendar_url, pre_work, resources, recording_status, recording_url, recording_embed_url,
        recording_duration, recording_thumbnail, recording_uploaded_at, recording_access_level,
        stripe_payment_link, tutor_id,
        addition_tutors ( id, name, title, studio, bio, expertise, image )
      `)
      .eq("id", id)
      .single();

    if (error) return errorResponse(`DB: ${error.message}`, 500);
    if (!data) return errorResponse("Not found", 404);
    return okResponse(data);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error", 500);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) return errorResponse("Missing id", 400);

  try {
    const body = await request.json();
    const patch = WorkshopPatchSchema.parse(body);
    const db = createSupabaseServiceClient();
    const { data: before } = await db
      .from("addition_workshops")
      .select("recording_status")
      .eq("id", id)
      .maybeSingle();
    const { data, error } = await db
      .from("addition_workshops")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) return errorResponse(`DB: ${error.message}`, 500);
    if (!data) return errorResponse("Not found", 404);
    if (
      patch.recording_status === "available"
      && before?.recording_status !== "available"
      && typeof patch.recording_url === "string"
      && patch.recording_url.trim()
    ) {
      void (async () => {
        try {
          const { data: registrations } = await db
            .from("addition_workshop_registrations")
            .select("user_id,guest_email,guest_name")
            .eq("workshop_id", id)
            .in("status", ["registered", "confirmed", "completed"]);
          for (const registration of registrations ?? []) {
            let email = registration.guest_email || "";
            let name = registration.guest_name || null;
            if (!email && registration.user_id) {
              const authUser = await db.auth.admin.getUserById(registration.user_id);
              email = authUser.data.user?.email ?? "";
              const candidate = authUser.data.user?.user_metadata?.name ?? authUser.data.user?.user_metadata?.full_name ?? "";
              name = typeof candidate === "string" && candidate.trim() ? candidate.trim() : null;
            }
            if (email) {
              await sendWorkshopRecordingAvailable({
                toEmail: email,
                toName: name,
                workshopTitle: data.title ?? id,
                recordingUrl: patch.recording_url || "",
              });
            }
          }
        } catch (emailError) {
          console.error("[admin-workshops] Recording email failed:", emailError);
        }
      })();
    }
    return okResponse(data);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Invalid input", 400);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) return errorResponse("Missing id", 400);

  const db = createSupabaseServiceClient();
  const { error } = await db.from("addition_workshops").delete().eq("id", id);
  if (error) return errorResponse(`DB: ${error.message}`, 500);
  return okResponse({ deleted: true });
}
