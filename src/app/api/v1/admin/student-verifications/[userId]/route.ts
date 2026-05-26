import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

const PatchSchema = z.object({
  status: z.enum(["approved", "rejected", "pending"]),
  reviewNotes: z.string().max(1000).default(""),
}).strict();

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;
  const { userId } = await params;
  if (!userId) return errorResponse("Missing userId.", 400);

  const body = await request.json().catch(() => ({}));
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid request body.", 400, parsed.error.issues);

  const db = createSupabaseServiceClient();
  const { error } = await db
    .from("addition_student_verifications")
    .upsert({
      user_id: userId,
      status: parsed.data.status,
      review_notes: parsed.data.reviewNotes,
      reviewed_at: parsed.data.status === "pending" ? null : new Date().toISOString(),
      method: "manual",
      verification_method: "evidence_upload",
    }, { onConflict: "user_id" });

  if (error) return errorResponse(error.message, 500);

  if (parsed.data.status === "approved") {
    const { error: userError } = await db
      .from("addition_users")
      .update({ plan: "student" })
      .eq("id", userId)
      .eq("plan", "free");
    if (userError) return errorResponse(userError.message, 500);
  }

  return okResponse({ updated: true });
}
