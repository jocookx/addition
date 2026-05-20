import { okResponse, errorResponse } from "@/lib/http";
import { requireUserFromRequest } from "@/server/auth/require-user";
import { createSupabaseServiceClient } from "@/server/supabase/clients";
import type { PathEnrolment } from "@/domain/learning-path";

export async function GET(request: Request) {
  const auth = await requireUserFromRequest(request);
  if (!auth.ok) return auth.response;

  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from("addition_path_enrolments")
    .select("path_id, enrolled_at")
    .eq("user_id", auth.user.id);

  if (error) return errorResponse(error.message, 500);

  const enrolments: PathEnrolment[] = (data ?? []).map((r) => ({
    pathId:     r.path_id,
    enrolledAt: r.enrolled_at,
  }));

  return okResponse({ enrolments });
}

export async function POST(request: Request) {
  const auth = await requireUserFromRequest(request);
  if (!auth.ok) return auth.response;

  const body = await request.json() as { pathId?: string };
  if (!body.pathId) return errorResponse("pathId required", 400);

  const db = createSupabaseServiceClient();
  const { error } = await db
    .from("addition_path_enrolments")
    .upsert({ user_id: auth.user.id, path_id: body.pathId }, { onConflict: "user_id,path_id" });

  if (error) return errorResponse(error.message, 500);
  return okResponse({ ok: true });
}
