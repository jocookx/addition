import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

const PathSchema = z.object({
  id:          z.string().min(1),
  title:       z.string().min(1),
  slug:        z.string().min(1),
  description: z.string().default(""),
  outcome:     z.string().default(""),
  level:       z.enum(["explorer", "improver", "refiner"]).default("explorer"),
  audience:    z.string().default(""),
  software:    z.array(z.string()).default([]),
  image:       z.string().default(""),
  course_ids:  z.array(z.string()).default([]),
  published:   z.boolean().default(false),
  sort_order:  z.number().int().default(0),
});

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from("addition_learning_paths")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) return errorResponse(error.message, 500);
    return okResponse({ paths: data ?? [], total: (data ?? []).length });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error", 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json() as unknown;
    const parsed = PathSchema.parse(body);
    const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from("addition_learning_paths")
      .insert(parsed)
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);
    return okResponse(data, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Invalid input", 400);
  }
}
