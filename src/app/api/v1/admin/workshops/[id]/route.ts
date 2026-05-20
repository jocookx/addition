import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

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
    const { data, error } = await db
      .from("addition_workshops")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) return errorResponse(`DB: ${error.message}`, 500);
    if (!data) return errorResponse("Not found", 404);
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
