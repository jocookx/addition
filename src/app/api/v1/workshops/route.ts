import { errorResponse, okResponse } from "@/lib/http";
import { createSupabaseServiceClient } from "@/server/supabase/clients";
import type { WorkshopListItem } from "@/domain/workshop";

type WorkshopRow = {
  id: string | null;
  title: string | null;
  date: string | null;
  time: string | null;
  timezone: string | null;
  duration: string | null;
  format: string | null;
  location: string | null;
  price: string | null;
  price_pence: number | null;
  capacity: number | null;
  upcoming: boolean | null;
  track: string | null;
  level: string | null;
  week: number | null;
  software: unknown;
  image: string | null;
  stripe_payment_link: string | null;
  addition_tutors: { name?: string | null } | null;
  learn: unknown;
  start_time?: string | null;
  end_time?: string | null;
  calendar_url?: string | null;
  recording_status?: string | null;
  recording_url?: string | null;
  recording_access_level?: string | null;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const upcomingOnly = searchParams.get("upcoming") !== "false";
  const track        = searchParams.get("track")    ?? null;

  try {
    const db = createSupabaseServiceClient();
    let query = db
      .from("addition_workshops")
      .select(`
        id, title, date, time, timezone, duration, format, location,
        price, price_pence, capacity, upcoming,
        track, level, week, software, image, stripe_payment_link,
        start_time, end_time, calendar_url, recording_status, recording_url, recording_access_level,
        learn,
        addition_tutors ( name )
      `)
      .order("date", { ascending: true })
      .limit(200);

    if (upcomingOnly) query = query.eq("upcoming", true);
    if (track)        query = query.ilike("track", track);

    const { data, error } = await query;
    if (error) return errorResponse(`DB error: ${error.message}`, 500);

    const workshops: WorkshopListItem[] = ((data ?? []) as WorkshopRow[]).map((row) => ({
      id:                row.id ?? "",
      title:             row.title ?? "",
      date:              row.date ?? "",
      time:              row.time ?? "",
      timezone:          row.timezone ?? "Europe/London",
      duration:          row.duration ?? "",
      format:            row.format === "in-person" ? "in-person" : "online",
      location:          row.location ?? "",
      price:             row.price ?? "£0",
      pricePence:        row.price_pence ?? 0,
      capacity:          row.capacity ?? 0,
      upcoming:          row.upcoming ?? false,
      track:             row.track ?? "",
      level:             row.level ?? "",
      week:              row.week  ?? 0,
      software:          Array.isArray(row.software) ? row.software.filter((item): item is string => typeof item === "string") : [],
      image:             row.image ?? "",
      stripePaymentLink: row.stripe_payment_link ?? null,
      tutorName:         (row.addition_tutors as { name?: string } | null)?.name ?? null,
      learn:             Array.isArray(row.learn) ? row.learn.filter((item): item is string => typeof item === "string") : [],
      startTime:         row.start_time ?? null,
      endTime:           row.end_time ?? null,
      calendarUrl:       row.calendar_url ?? "",
      recordingStatus:   row.recording_status === "processing" || row.recording_status === "available" || row.recording_status === "failed" ? row.recording_status : "none",
      recordingUrl:      row.recording_url ?? "",
      recordingAccessLevel: row.recording_access_level === "pro" || row.recording_access_level === "student" || row.recording_access_level === "purchased" || row.recording_access_level === "free" ? row.recording_access_level : "booked_users",
    }));

    return okResponse({ workshops, total: workshops.length });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error", 500);
  }
}
