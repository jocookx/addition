import { errorResponse, okResponse } from "@/lib/http";
import { requireUserFromRequest } from "@/server/auth/require-user";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

/**
 * DELETE /api/v1/user/reset-progress
 * Wipes all learning progress for the authenticated user:
 * - addition_lesson_progress
 * - addition_enrollments
 * - addition_command_progress
 * User account and toolkit are preserved.
 */
export async function DELETE(request: Request) {
  const auth = await requireUserFromRequest(request);
  if (!auth.ok) return auth.response;

  const userId = auth.user.id;
  const db = createSupabaseServiceClient();

  // Delete in dependency order (lesson_progress first, then enrollments)
  const [lpResult, cpResult, enrResult] = await Promise.all([
    db.from("addition_lesson_progress").delete().eq("user_id", userId),
    db.from("addition_command_progress").delete().eq("user_id", userId),
    db.from("addition_enrollments").delete().eq("user_id", userId),
  ]);

  const errors = [lpResult.error, cpResult.error, enrResult.error].filter(Boolean);
  if (errors.length) {
    return errorResponse(`Reset partially failed: ${errors.map((e) => e!.message).join("; ")}`, 500);
  }

  return okResponse({ reset: true });
}
