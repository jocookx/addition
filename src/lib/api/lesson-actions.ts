import type { CourseProgressOverview } from "@/domain/course-progress";
import { fetchJson } from "@/lib/api/fetch-json";

function buildAuthHeaders(accessToken: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

async function postLessonAction(
  accessToken: string,
  courseId: string,
  lessonId: string,
  action: "start" | "complete",
): Promise<CourseProgressOverview> {
  const payload = await fetchJson<{ overview: CourseProgressOverview }>(
    `/api/v1/learning/lessons/${encodeURIComponent(courseId)}/${encodeURIComponent(lessonId)}/${action}`,
    {
      method: "POST",
      headers: buildAuthHeaders(accessToken),
      timeoutMs: 12_000,
    },
  );
  return payload.overview;
}

export function startLesson(
  accessToken: string,
  courseId: string,
  lessonId: string,
): Promise<CourseProgressOverview> {
  return postLessonAction(accessToken, courseId, lessonId, "start");
}

export function completeLesson(
  accessToken: string,
  courseId: string,
  lessonId: string,
): Promise<CourseProgressOverview> {
  return postLessonAction(accessToken, courseId, lessonId, "complete");
}
