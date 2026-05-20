import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

const QuestionSchema = z.object({
  software:       z.string().default(""),
  topic:          z.string().default(""),
  question_text:  z.string().min(1),
  question_type:  z.enum(["mc", "tf", "short"]).default("mc"),
  options:        z.array(z.string()).default([]),
  correct_answer: z.string().default(""),
  explanation:    z.string().default(""),
  difficulty:     z.string().default("beginner"),
  tags:           z.array(z.string()).default([]),
  published:      z.boolean().default(false),
});

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const software = url.searchParams.get("software");
  const db = createSupabaseServiceClient();
  let q = db.from("addition_quiz_questions").select("*").order("created_at", { ascending: false });
  if (software) q = q.eq("software", software);

  const { data, error } = await q;
  if (error) return errorResponse(error.message, 500);
  return okResponse({ questions: data ?? [], total: (data ?? []).length });
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json() as unknown;
    const parsed = QuestionSchema.parse(body);
    const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from("addition_quiz_questions")
      .insert(parsed).select().single();

    if (error) return errorResponse(error.message, 500);
    return okResponse(data, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Invalid input", 400);
  }
}
