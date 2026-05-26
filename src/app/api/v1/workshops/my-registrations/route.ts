import { errorResponse, okResponse } from "@/lib/http";
import { requireUserFromRequest } from "@/server/auth/require-user";
import { createSupabaseServiceClient } from "@/server/supabase/clients";
import type { WorkshopListItem } from "@/domain/workshop";

export async function GET(request: Request) {
  const auth = await requireUserFromRequest(request);
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const db = createSupabaseServiceClient();

  // Fetch workshop IDs the user has registered for
  const { data: regs, error: regsError } = await db
    .from("addition_workshop_registrations")
    .select("workshop_id, status")
    .eq("user_id", user.id)
    .in("status", ["registered", "confirmed"]);

  if (regsError) {
    return errorResponse("Failed to load registrations", 500);
  }

  if (!regs || regs.length === 0) {
    return okResponse({ workshops: [] });
  }

  const workshopIds = regs.map((r) => r.workshop_id as string);

  const { data: rows, error: wsError } = await db
    .from("addition_workshops")
    .select("id, title, date, time, timezone, duration, format, image, price, upcoming, start_time, end_time, calendar_url, join_url, recording_status, recording_url, recording_access_level")
    .in("id", workshopIds)
    .order("date", { ascending: true });

  if (wsError) {
    return errorResponse("Failed to load workshop details", 500);
  }

  const workshops: WorkshopListItem[] = (rows ?? []).map((row) => ({
    id:         row.id,
    title:      row.title,
    date:       row.date,
    time:       row.time ?? null,
    timezone:   row.timezone ?? null,
    duration:   row.duration ?? null,
    format:     row.format === "in-person" ? "in-person" : "online",
    image:      row.image ?? null,
    price:      row.price ?? null,
    upcoming:   row.upcoming ?? false,
    // Required WorkshopListItem fields with safe defaults
    track:      "",
    level:      "",
    week:       0,
    software:   [],
    location:   "",
    pricePence: 0,
    capacity:   0,
    learn:      [],
    stripePaymentLink: null,
    tutorName:  null,
    startTime: row.start_time ?? null,
    endTime: row.end_time ?? null,
    calendarUrl: row.calendar_url ?? "",
    joinUrl: row.join_url ?? "",
    recordingStatus: row.recording_status ?? "none",
    recordingUrl: row.recording_url ?? "",
    recordingAccessLevel: row.recording_access_level ?? "booked_users",
    bookingStatus: regs.find((reg) => reg.workshop_id === row.id)?.status ?? null,
  }));

  return okResponse({ workshops });
}
