import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

const CertSchema = z.object({
  title:         z.string().min(1),
  software:      z.string().default(""),
  description:   z.string().default(""),
  passing_score: z.number().int().min(0).max(100).default(80),
  question_ids:  z.array(z.string()).default([]),
  badge_image:   z.string().default(""),
  published:     z.boolean().default(false),
});

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from("addition_certificates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return errorResponse(error.message, 500);
  return okResponse({ certificates: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json() as unknown;
    const parsed = CertSchema.parse(body);
    const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from("addition_certificates")
      .insert(parsed).select().single();

    if (error) return errorResponse(error.message, 500);
    return okResponse(data, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Invalid input", 400);
  }
}
