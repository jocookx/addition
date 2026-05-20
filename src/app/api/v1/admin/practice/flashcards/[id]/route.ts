import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

const PatchSchema = z.object({
  front:      z.string().min(1).optional(),
  back:       z.string().min(1).optional(),
  hint:       z.string().optional(),
  sort_order: z.number().int().optional(),
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
      .from("addition_flashcards")
      .update(patch).eq("id", id).select().single();

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
  const { error } = await db.from("addition_flashcards").delete().eq("id", id);
  if (error) return errorResponse(error.message, 500);
  return okResponse({ deleted: id });
}
