import { errorResponse, okResponse } from "@/lib/http";
import { createSupabaseServiceClient } from "@/server/supabase/clients";
import type { WorkshopDetail } from "@/domain/workshop";

const WORKSHOP_DETAIL_SELECT = `
  id, title, date, time, timezone, duration, format, location,
  price, price_pence, capacity, upcoming,
  track, level, week, software, image, stripe_payment_link,
  description, learn, included, principles, recordings, gallery,
  tutor_id,
  addition_tutors ( name, bio, image )
`;

const WORKSHOP_DETAIL_SELECT_LEGACY = `
  id, title, date, time, timezone, duration, format, location,
  price, price_pence, capacity, upcoming,
  track, level, week, software, image, stripe_payment_link,
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
