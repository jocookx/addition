import { errorResponse, okResponse } from "@/lib/http";
import { readBearerToken, requireUserIdFromRequest } from "@/server/auth/require-user";
import { getRecommendedCommands } from "@/server/learning/get-recommended-commands";
import { createSupabaseUserClient } from "@/server/supabase/clients";

type RouteContext = {
  params: Promise<{ courseId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireUserIdFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const { courseId } = await context.params;
    const normalizedCourseId = decodeURIComponent(courseId || "").trim();
    if (!normalizedCourseId) return errorResponse("Course ID is required.", 400);

    const token = readBearerToken(request);
    if (!token) return errorResponse("Missing bearer token.", 401);
    const db = createSupabaseUserClient(token);
    const commands = await getRecommendedCommands(db, auth.userId, normalizedCourseId);
    if (!commands) return errorResponse("Course not found.", 404);
    return okResponse({ commands });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return errorResponse(message, 500);
  }
}
