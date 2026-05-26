import { errorResponse, okResponse } from "@/lib/http";
import { getAccessDecision } from "@/domain/access";
import { createSupabaseServiceClient } from "@/server/supabase/clients";
import { readBearerToken, requireUserFromRequest } from "@/server/auth/require-user";
import { ensureUserProfile } from "@/server/auth/ensure-user-profile";
import { createSupabaseUserClient } from "@/server/supabase/clients";
import type { WorkshopDetail } from "@/domain/workshop";

const WORKSHOP_DETAIL_SELECT = `
  id, title, date, time, timezone, duration, format, location,
  price, price_pence, capacity, upcoming,
  track, level, week, software, image, stripe_payment_link,
  start_time, end_time, live_provider, join_url, host_url, meeting_id, passcode, live_embed_url, calendar_url,
  pre_work, resources, recording_status, recording_url, recording_embed_url, recording_duration,
  recording_thumbnail, recording_uploaded_at, recording_access_level,
  description, learn, included, principles, recordings, gallery,
  tutor_id,
  addition_tutors ( name, bio, image )
`;

const WORKSHOP_DETAIL_SELECT_LEGACY = `
  id, title, date, time, timezone, duration, format, location,
  price, price_pence, capacity, upcoming,
  track, level, week, software, image, stripe_payment_link,
  start_time, end_time, live_provider, join_url, host_url, meeting_id, passcode, live_embed_url, calendar_url,
  pre_work, resources, recording_status, recording_url, recording_embed_url, recording_duration,
  recording_thumbnail, recording_uploaded_at, recording_access_level,
  description, learn, included, principles, recordings,
  tutor_id,
  addition_tutors ( name, bio, image )
`;

type WorkshopDetailRow = {
  id: string;
  title: string;
  date: string;
  time: string;
  timezone: string;
  duration: string;
  format: "online" | "in-person" | string;
  location: string;
  price: string;
  price_pence: number;
  capacity: number;
  upcoming: boolean;
  track: string | null;
  level: string | null;
  week: number | null;
  software: string[] | null;
  image: string | null;
  stripe_payment_link: string | null;
  start_time?: string | null;
  end_time?: string | null;
  live_provider?: "zoom" | "youtube" | "vimeo" | "custom" | "other" | string | null;
  join_url?: string | null;
  host_url?: string | null;
  meeting_id?: string | null;
  passcode?: string | null;
  live_embed_url?: string | null;
  calendar_url?: string | null;
  pre_work?: string[] | null;
  resources?: string[] | null;
  recording_status?: "none" | "processing" | "available" | "failed" | string | null;
  recording_url?: string | null;
  recording_embed_url?: string | null;
  recording_duration?: string | null;
  recording_thumbnail?: string | null;
  recording_uploaded_at?: string | null;
  recording_access_level?: "booked_users" | "pro" | "student" | "purchased" | "free" | string | null;
  description: string | null;
  learn: string[] | null;
  included: string[] | null;
  principles: string[] | null;
  recordings: { id: string; title: string; video: string }[] | null;
  gallery?: string[] | null;
  tutor_id: string | null;
  addition_tutors: { name?: string; bio?: string; image?: string } | null;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workshopId: string }> },
) {
  const { workshopId } = await params;
  try {
    const db = createSupabaseServiceClient();
    const token = readBearerToken(request);
    let userId = "";
    let userPlan = "free";
    let subscriptionStatus = "inactive";
    if (token) {
      const auth = await requireUserFromRequest(request);
      if (auth.ok) {
        userId = auth.user.id;
        const profile = await ensureUserProfile(createSupabaseUserClient(token), auth.user).catch(() => null);
        userPlan = profile?.plan ?? "free";
        subscriptionStatus = profile?.subscriptionStatus ?? "inactive";
      }
    }
    let result = await db
      .from("addition_workshops")
      .select(WORKSHOP_DETAIL_SELECT)
      .eq("id", workshopId)
      .single();

    if (result.error?.message.includes("gallery")) {
      result = await db
        .from("addition_workshops")
        .select(WORKSHOP_DETAIL_SELECT_LEGACY)
        .eq("id", workshopId)
        .single();
    }

    if (result.error || !result.data) return errorResponse("Workshop not found", 404);

    const data = result.data as WorkshopDetailRow;
    let bookingStatus: WorkshopDetail["bookingStatus"] = null;
    if (userId) {
      const { data: registration } = await db
        .from("addition_workshop_registrations")
        .select("status")
        .eq("user_id", userId)
        .eq("workshop_id", workshopId)
        .maybeSingle();
      bookingStatus = (registration?.status as WorkshopDetail["bookingStatus"]) ?? null;
    }
    const booked = bookingStatus === "registered" || bookingStatus === "confirmed" || bookingStatus === "completed";
    const recordingLevel = data.recording_access_level === "pro" || data.recording_access_level === "student" || data.recording_access_level === "purchased" || data.recording_access_level === "free"
      ? data.recording_access_level
      : "booked_users";
    const recordingAccess = recordingLevel === "booked_users"
      ? getAccessDecision({ purchased: booked, accessLevel: booked ? "Purchased" : "Workshop" }, { plan: userPlan, subscriptionStatus })
      : getAccessDecision({ accessLevel: recordingLevel === "free" ? "Free" : recordingLevel === "pro" ? "Pro" : recordingLevel === "student" ? "Student" : "Purchased" }, { plan: userPlan, subscriptionStatus });

    const tutor = data.addition_tutors;

    const workshop: WorkshopDetail = {
      id:                data.id,
      title:             data.title,
      date:              data.date,
      time:              data.time,
      timezone:          data.timezone,
      duration:          data.duration,
      format:            data.format === "in-person" ? "in-person" : "online",
      location:          data.location,
      price:             data.price,
      pricePence:        data.price_pence,
      capacity:          data.capacity,
      upcoming:          data.upcoming,
      track:             data.track ?? "",
      level:             data.level ?? "",
      week:              data.week  ?? 0,
      software:          data.software ?? [],
      image:             data.image ?? "",
      stripePaymentLink: data.stripe_payment_link ?? null,
      startTime:         data.start_time ?? null,
      endTime:           data.end_time ?? null,
      liveProvider:      data.live_provider === "youtube" || data.live_provider === "vimeo" || data.live_provider === "custom" || data.live_provider === "other" ? data.live_provider : "zoom",
      joinUrl:           booked ? (data.join_url || data.location || "") : "",
      hostUrl:           "",
      meetingId:         booked ? (data.meeting_id ?? "") : "",
      passcode:          booked ? (data.passcode ?? "") : "",
      liveEmbedUrl:      booked ? (data.live_embed_url ?? "") : "",
      calendarUrl:       data.calendar_url ?? "",
      preWork:           data.pre_work ?? [],
      resources:         data.resources ?? [],
      recordingStatus:   data.recording_status === "processing" || data.recording_status === "available" || data.recording_status === "failed" ? data.recording_status : "none",
      recordingUrl:      recordingAccess.canAccess ? (data.recording_url ?? "") : "",
      recordingEmbedUrl: recordingAccess.canAccess ? (data.recording_embed_url ?? "") : "",
      recordingDuration: data.recording_duration ?? "",
      recordingThumbnail:data.recording_thumbnail ?? "",
      recordingUploadedAt: data.recording_uploaded_at ?? null,
      recordingAccessLevel: recordingLevel,
      bookingStatus,
      description:       data.description ?? "",
      learn:             data.learn ?? [],
      included:          data.included ?? [],
      principles:        data.principles ?? [],
      recordings:        data.recordings ?? [],
      gallery:           data.gallery ?? [],
      tutorId:           data.tutor_id ?? null,
      tutorName:         tutor?.name ?? null,
      tutorBio:          tutor?.bio  ?? null,
      tutorImage:        tutor?.image ?? null,
    };

    return okResponse({ workshop });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error", 500);
  }
}
