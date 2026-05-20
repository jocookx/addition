import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

const ProblemSchema = z.object({
  question: z.string().min(1),
  alternative_phrasings: z.array(z.string()).default([]),
  software: z.string().default(""),
  intent: z.string().default(""),
  difficulty: z.string().default("beginner"),
  short_answer: z.string().default(""),
  detailed_answer: z.string().default(""),
  linked_commands: z.array(z.string()).default([]),
  linked_combos: z.array(z.string()).default([]),
  linked_lessons: z.array(z.string()).default([]),
  linked_courses: z.array(z.string()).default([]),
  common_mistakes: z.string().default(""),
  tags: z.array(z.string()).default([]),
  frequency: z.number().int().default(0),
  status: z.string().default("Draft"),
});

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;
  const db = createSupabaseServiceClient();
  const { data, error } = await db.from("addition_problem_solver").select("*").order("updated_at", { ascending: false });
  if (error) return errorResponse(error.message, 500);
  return okResponse({ entries: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;
  try {
    const parsed = ProblemSchema.parse(await request.json());
    const db = createSupabaseServiceClient();
    const { data, error } = await db.from("addition_problem_solver").insert(parsed).select().single();
    if (error) return errorResponse(error.message, 500);
    return okResponse(data, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Invalid input", 400);
  }
}
