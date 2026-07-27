import { errorResponse, okResponse } from "@/lib/http";
import { getAccessDecision } from "@/domain/access";
import { createSignedStreamToken, getSignedIframeUrl } from "@/lib/cloudflare-stream";
import { ensureUserProfile } from "@/server/auth/ensure-user-profile";
import { requireUserFromRequest } from "@/server/auth/require-user";
import { consumeRateLimit } from "@/server/rate-limit";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

type LessonRecord = {
  id?: unknown;
  videoId?: unknown;
  video_id?: unknown;
  accessLevel?: unknown;
  access_level?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function findLesson(modules: unknown, lessonId: string): LessonRecord | null {
  if (!Array.isArray(modules)) return null;
  for (const moduleItem of modules) {
    const moduleRecord = asRecord(moduleItem);
    const lessons = Array.isArray(moduleRecord?.lessons) ? moduleRecord.lessons : [];
    for (const lessonItem of lessons) {
      const lesson = asRecord(lessonItem);
      if (String(lesson?.id || "") === lessonId) return lesson as LessonRecord;
    }
  }
  return null;
}

export async function POST(request: Request) {
  const auth = await requireUserFromRequest(request);
  if (!auth.ok) return auth.response;

  let body: { courseId?: unknown; lessonId?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  const courseId = typeof body.courseId === "string" ? body.courseId.trim() : "";
  const lessonId = typeof body.lessonId === "string" ? body.lessonId.trim() : "";
  if (!courseId || !lessonId) return errorResponse("courseId and lessonId are required.", 400);

  try {
    const db = createSupabaseServiceClient();
    const rate = await consumeRateLimit(db, {
      key: `video-token:user:${auth.user.id}`,
      max: 180,
      windowMs: 60 * 60 * 1000,
    });
    if (!rate.ok) {
      const response = errorResponse("Too many video token requests. Try again later.", 429, {
        retryAfterSeconds: rate.retryAfterSeconds,
      });
      response.headers.set("Retry-After", String(rate.retryAfterSeconds));
      return response;
    }

    const [profile, verificationResult, courseResult] = await Promise.all([
      ensureUserProfile(db, auth.user),
      db
        .from("addition_student_verifications")
        .select("status")
        .eq("user_id", auth.user.id)
        .maybeSingle(),
      db
        .from("addition_courses")
        .select("id,access_level,modules")
        .eq("id", courseId)
        .eq("draft", false)
        .eq("status", "Published")
        .maybeSingle(),
    ]);

    if (courseResult.error) return errorResponse(courseResult.error.message, 500);
    if (!courseResult.data) return errorResponse("Course not found.", 404);

    const lesson = findLesson(courseResult.data.modules, lessonId);
    if (!lesson) return errorResponse("Lesson not found.", 404);

    const lessonAccessLevel =
      typeof lesson.accessLevel === "string" ? lesson.accessLevel :
      typeof lesson.access_level === "string" ? lesson.access_level :
      typeof courseResult.data.access_level === "string" ? courseResult.data.access_level :
      "Free";

    const decision = getAccessDecision(
      { accessLevel: lessonAccessLevel },
      {
        plan: profile.plan,
        subscriptionStatus: profile.subscriptionStatus,
        studentVerificationStatus: verificationResult.data?.status ?? "not_started",
      },
    );
    if (!decision.canAccess) return errorResponse("You do not have access to this lesson video.", 403);

    const videoId =
      typeof lesson.videoId === "string" ? lesson.videoId.trim() :
      typeof lesson.video_id === "string" ? lesson.video_id.trim() :
      "";
    if (!videoId) return errorResponse("Lesson does not have a protected Cloudflare video.", 404);

    const token = await createSignedStreamToken(videoId, 60 * 60);
    return okResponse(
      {
        iframeUrl: getSignedIframeUrl(token),
        expiresInSeconds: 3600,
      },
      200,
      {
        "Cache-Control": "no-store",
      },
    );
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Could not create video token.", 500);
  }
}
