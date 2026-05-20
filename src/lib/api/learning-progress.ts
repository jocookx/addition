import type { LearningProgressPatch, LearningProgressSnapshot } from "@/domain/learning-progress";
import { fetchJson } from "@/lib/api/fetch-json";

function buildAuthHeaders(accessToken: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function getLearningProgress(accessToken: string, courseId?: string): Promise<LearningProgressSnapshot> {
  const qs = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
  return fetchJson<LearningProgressSnapshot>(`/api/v1/learning/progress${qs}`, {
    method: "GET",
    headers: buildAuthHeaders(accessToken),
    retries: 1,
    timeoutMs: 12_000,
  });
}

export async function patchLearningProgress(
  accessToken: string,
  payload: LearningProgressPatch,
): Promise<LearningProgressSnapshot> {
  return fetchJson<LearningProgressSnapshot>("/api/v1/learning/progress", {
    method: "PATCH",
    headers: buildAuthHeaders(accessToken),
    body: JSON.stringify(payload),
    timeoutMs: 12_000,
  });
}
