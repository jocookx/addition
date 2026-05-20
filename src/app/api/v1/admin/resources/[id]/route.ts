import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

const PatchSchema = z.object({
  title: z.string().min(1).optional(),
  type: z.string().optional(),
  software: z.string().optional(),
  file_url: z.string().optional(),
  external_url: z.string().optional(),
  description: z.string().optional(),
  access_level: z.string().optional(),
  linked_lessons: z.array(z.string()).optional(),
  linked_courses: z.array(z.string()).optional(),
  status: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  try {
    const patch = PatchSchema.parse(await request.json());
    const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from("addition_resources")
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
  const { error } = await db.from("addition_resources").delete().eq("id", id);
  if (error) return errorResponse(error.message, 500);
  return okResponse({ deleted: id });
}
