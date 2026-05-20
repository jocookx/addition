import type { CourseProgressOverview } from "@/domain/course-progress";
import { fetchJson } from "@/lib/api/fetch-json";

function buildAuthHeaders(accessToken: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function getCourseProgressOverview(
  accessToken: string,
  courseId: string,
): Promise<CourseProgressOverview> {
  const payload = await fetchJson<{ overview: CourseProgressOverview }>(
    `/api/v1/learning/course-progress/${encodeURIComponent(courseId)}`,
    {
      method: "GET",
      headers: buildAuthHeaders(accessToken),
      retries: 1,
      timeoutMs: 12_000,
    },
  );

  return payload.overview;
}
