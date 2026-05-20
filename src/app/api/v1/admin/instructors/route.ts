import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

const InstructorSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1),
  title: z.string().default(""),
  studio: z.string().default(""),
  bio: z.string().default(""),
  expertise: z.array(z.string()).default([]),
  image: z.string().default(""),
});

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from("addition_tutors")
      .select("id,name,title,studio,bio,expertise,image,created_at")
      .order("name", { ascending: true });

    if (error) return errorResponse(`DB: ${error.message}`, 500);
    return okResponse({ instructors: data ?? [], total: (data ?? []).length });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error", 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const parsed = InstructorSchema.parse(await request.json());
    const id = parsed.id || `tutor-${slugify(parsed.name) || Date.now()}`;
    const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from("addition_tutors")
      .insert({ ...parsed, id })
      .select("id,name,title,studio,bio,expertise,image,created_at")
      .single();

    if (error) return errorResponse(`DB: ${error.message}`, 500);
    return okResponse(data, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Invalid input", 400);
  }
}
