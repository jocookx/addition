import { errorResponse, okResponse } from "@/lib/http";
import { readBearerToken, requireUserIdFromRequest } from "@/server/auth/require-user";
import { enforceLearningWriteRateLimit } from "@/server/auth/rate-limit-write";
import { getCourseProgressOverview } from "@/server/learning/get-course-progress-overview";
import { SupabaseLearningProgressRepository } from "@/server/repositories/supabase-learning-progress-repository";
import { LearningProgressService } from "@/server/services/learning-progress-service";
import { createSupabaseUserClient } from "@/server/supabase/clients";

type RouteContext = {
  params: Promise<{ courseId: string; lessonId: string }>;
};

function buildService(accessToken: string) {
  const repository = new SupabaseLearningProgressRepository(createSupabaseUserClient(accessToken));
  return new LearningProgressService(repository);
}

function lessonExists(lessonId: string, modules: { lessons: { id: string }[] }[]): boolean {
  return modules.some((moduleItem) => moduleItem.lessons.some((lesson) => lesson.id === lessonId));
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireUserIdFromRequest(request);
  if (!auth.ok) return auth.response;

  const rateLimit = await enforceLearningWriteRateLimit(auth.userId, "lesson_start");
  if (!rateLimit.ok) return rateLimit.response;

  try {
    const token = readBearerToken(request);
    if (!token) return errorResponse("Missing bearer token.", 401);
    const { courseId, lessonId } = await context.params;
    const normalizedCourseId = decodeURIComponent(courseId || "").trim();
    const normalizedLessonId = decodeURIComponent(lessonId || "").trim();
    if (!normalizedCourseId || !normalizedLessonId) return errorResponse("Course ID and lesson ID are required.", 400);

    const db = createSupabaseUserClient(token);
    const current = await getCourseProgressOverview(db, auth.userId, normalizedCourseId);
    if (!current) return errorResponse("Course not found.", 404);
    if (!lessonExists(normalizedLessonId, current.modules)) return errorResponse("Lesson not found in course.", 404);

    const service = buildService(token);
    await service.applyPatch(auth.userId, {
      enrollments: [{ courseId: normalizedCourseId, status: "active" }],
      lessons: [{ courseId: normalizedCourseId, lessonId: normalizedLessonId, status: "in_progress" }],
      event: { type: "api_lesson_started", payload: { courseId: normalizedCourseId, lessonId: normalizedLessonId } },
    });

    const overview = await getCourseProgressOverview(db, auth.userId, normalizedCourseId);
    if (!overview) return errorResponse("Course not found.", 404);
    const response = okResponse({ overview });
    for (const [name, value] of Object.entries(rateLimit.headers)) response.headers.set(name, value);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return errorResponse(message, 500);
  }
}
