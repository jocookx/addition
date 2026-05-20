import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

const PatchSchema = z.object({
  software:       z.string().optional(),
  topic:          z.string().optional(),
  question_text:  z.string().min(1).optional(),
  question_type:  z.enum(["mc", "tf", "short"]).optional(),
  options:        z.array(z.string()).optional(),
  correct_answer: z.string().optional(),
  explanation:    z.string().optional(),
  difficulty:     z.string().optional(),
  tags:           z.array(z.string()).optional(),
  published:      z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    const body = await request.json() as unknown;
    const patch = PatchSchema.parse(body);
    const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from("addition_quiz_questions")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id).select().single();

    if (error) return errorResponse(error.message, 500);
    return okResponse(data);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Invalid input", 400);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const db = createSupabaseServiceClient();
  const { error } = await db.from("addition_quiz_questions").delete().eq("id", id);
  if (error) return errorResponse(error.message, 500);
  return okResponse({ deleted: id });
}
