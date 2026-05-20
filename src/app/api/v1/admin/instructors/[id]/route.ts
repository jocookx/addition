import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

const InstructorPatchSchema = z.object({
  name: z.string().min(1).optional(),
  title: z.string().optional(),
  studio: z.string().optional(),
  bio: z.string().optional(),
  expertise: z.array(z.string()).optional(),
  image: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const parsed = InstructorPatchSchema.parse(await request.json());
    const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from("addition_tutors")
      .update(parsed)
      .eq("id", id)
      .select("id,name,title,studio,bio,expertise,image,created_at")
      .single();

    if (error) return errorResponse(`DB: ${error.message}`, 500);
    return okResponse(data);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Invalid input", 400);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const db = createSupabaseServiceClient();
    const { error } = await db.from("addition_tutors").delete().eq("id", id);
    if (error) return errorResponse(`DB: ${error.message}`, 500);
    return okResponse({ deleted: id });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error", 500);
  }
}
