import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

const ResourceSchema = z.object({
  title: z.string().min(1),
  type: z.string().default("Link"),
  software: z.string().default(""),
  file_url: z.string().default(""),
  external_url: z.string().default(""),
  description: z.string().default(""),
  access_level: z.string().default("Free"),
  linked_lessons: z.array(z.string()).default([]),
  linked_courses: z.array(z.string()).default([]),
  status: z.string().default("Draft"),
  tags: z.array(z.string()).default([]),
});

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;
  const db = createSupabaseServiceClient();
  const { data, error } = await db.from("addition_resources").select("*").order("updated_at", { ascending: false });
  if (error) return errorResponse(error.message, 500);
  return okResponse({ resources: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;
  try {
    const parsed = ResourceSchema.parse(await request.json());
    const db = createSupabaseServiceClient();
    const { data, error } = await db.from("addition_resources").insert(parsed).select().single();
    if (error) return errorResponse(error.message, 500);
    return okResponse(data, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Invalid input", 400);
  }
}
