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

  const rateLimit = await enforceLearningWriteRateLimit(auth.userId, "lesson_complete");
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

    const durationMin =
      current.modules
        .flatMap((moduleItem) => moduleItem.lessons)
        .find((lesson) => lesson.id === normalizedLessonId)?.durationMin || null;
    const elapsedSeconds = durationMin ? Math.max(60, durationMin * 60) : 300;

    const service = buildService(token);
    await service.applyPatch(auth.userId, {
      enrollments: [{ courseId: normalizedCourseId, status: "active" }],
      lessons: [
        {
          courseId: normalizedCourseId,
          lessonId: normalizedLessonId,
          status: "completed",
          elapsedSeconds,
          metadata: { source: "lesson-complete-api" },
        },
      ],
      event: {
        type: "api_lesson_completed",
        payload: { courseId: normalizedCourseId, lessonId: normalizedLessonId, elapsedSeconds },
      },
    });

    let overview = await getCourseProgressOverview(db, auth.userId, normalizedCourseId);
    if (!overview) return errorResponse("Course not found.", 404);

    if (
      overview.totalLessons > 0 &&
      overview.completedLessons >= overview.totalLessons &&
      overview.enrollment?.status !== "completed"
    ) {
      await service.applyPatch(auth.userId, {
        enrollments: [{ courseId: normalizedCourseId, status: "completed" }],
        event: { type: "api_course_completed", payload: { courseId: normalizedCourseId } },
      });
      overview = await getCourseProgressOverview(db, auth.userId, normalizedCourseId);
      if (!overview) return errorResponse("Course not found.", 404);
    }

    const response = okResponse({ overview });
    for (const [name, value] of Object.entries(rateLimit.headers)) response.headers.set(name, value);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return errorResponse(message, 500);
  }
}
