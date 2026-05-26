import { randomUUID } from "node:crypto";
import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

const WorkshopUpsertSchema = z.object({
  title:               z.string().min(1),
  date:                z.string().min(1),
  time:                z.string().default("09:00"),
  timezone:            z.string().default("Europe/London"),
  duration:            z.string().default(""),
  format:              z.enum(["online", "in-person"]).default("online"),
  location:            z.string().default(""),
  price:               z.string().default("£0"),
  price_pence:         z.number().int().nonnegative().default(0),
  capacity:            z.number().int().nonnegative().default(12),
  upcoming:            z.boolean().default(true),
  track:               z.string().default(""),
  level:               z.string().default(""),
  week:                z.number().int().nonnegative().default(1),
  software:            z.array(z.string()).default([]),
  image:               z.string().default(""),
  description:         z.string().default(""),
  learn:               z.array(z.string()).default([]),
  included:            z.array(z.string()).default([]),
  principles:          z.array(z.string()).default([]),
  stripe_payment_link: z.string().nullable().default(null),
  tutor_id:            z.string().nullable().default(null),
  start_time:          z.string().nullable().default(null),
  end_time:            z.string().nullable().default(null),
  live_provider:       z.enum(["zoom", "youtube", "vimeo", "custom", "other"]).default("zoom"),
  join_url:            z.string().default(""),
  host_url:            z.string().default(""),
  meeting_id:          z.string().default(""),
  passcode:            z.string().default(""),
  live_embed_url:      z.string().default(""),
  calendar_url:        z.string().default(""),
  pre_work:            z.array(z.string()).default([]),
  resources:           z.array(z.string()).default([]),
  recording_status:    z.enum(["none", "processing", "available", "failed"]).default("none"),
  recording_url:       z.string().default(""),
  recording_embed_url: z.string().default(""),
  recording_duration:  z.string().default(""),
  recording_thumbnail: z.string().default(""),
  recording_access_level: z.enum(["booked_users", "pro", "student", "purchased", "free"]).default("booked_users"),
});

const WorkshopPatchSchema = WorkshopUpsertSchema.partial();

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

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
      .order("date", { ascending: true })
      .limit(500);

    if (error) return errorResponse(`DB: ${error.message}`, 500);
    return okResponse({ workshops: data ?? [], total: (data ?? []).length });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error", 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const parsed = WorkshopUpsertSchema.parse(body);
    const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from("addition_workshops")
      .insert({ id: randomUUID(), ...parsed })
      .select()
      .single();

    if (error) return errorResponse(`DB: ${error.message}`, 500);
    return okResponse(data, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Invalid input", 400);
  }
}

export async function PATCH(request: Request) {
  // Bulk patch — e.g. mark all past as upcoming=false
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as { ids: string[]; patch: Record<string, unknown> };
    const { ids, patch } = body;
    if (!Array.isArray(ids) || ids.length === 0) return errorResponse("ids required", 400);
    const validated = WorkshopPatchSchema.parse(patch);
    const db = createSupabaseServiceClient();
    const { error } = await db.from("addition_workshops").update(validated).in("id", ids);
    if (error) return errorResponse(`DB: ${error.message}`, 500);
    return okResponse({ updated: ids.length });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Invalid input", 400);
  }
}
