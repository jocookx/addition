import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

const PatchSchema = z.object({
  question: z.string().min(1).optional(),
  alternative_phrasings: z.array(z.string()).optional(),
  software: z.string().optional(),
  intent: z.string().optional(),
  difficulty: z.string().optional(),
  short_answer: z.string().optional(),
  detailed_answer: z.string().optional(),
  linked_commands: z.array(z.string()).optional(),
  linked_combos: z.array(z.string()).optional(),
  linked_lessons: z.array(z.string()).optional(),
  linked_courses: z.array(z.string()).optional(),
  common_mistakes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  frequency: z.number().int().optional(),
  status: z.string().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  try {
    const patch = PatchSchema.parse(await request.json());
    const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from("addition_problem_solver")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
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
  const { error } = await db.from("addition_problem_solver").delete().eq("id", id);
  if (error) return errorResponse(error.message, 500);
  return okResponse({ deleted: id });
}
