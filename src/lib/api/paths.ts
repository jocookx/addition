import type { LearningPathListItem, LearningPathDetail, PathEnrolment } from "@/domain/learning-path";
import { fetchJson } from "@/lib/api/fetch-json";

function authHeaders(token: string): HeadersInit {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export async function getPaths(): Promise<LearningPathListItem[]> {
  const data = await fetchJson<{ paths: LearningPathListItem[] }>("/api/v1/paths");
  return data.paths;
}

export async function getPathDetail(pathId: string): Promise<LearningPathDetail> {
  const data = await fetchJson<{ path: LearningPathDetail }>(`/api/v1/paths/${pathId}`);
  return data.path;
}

export async function enrolInPath(pathId: string, token: string): Promise<void> {
  await fetchJson("/api/v1/paths/enrol", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ pathId }),
  });
}

export async function getMyEnrolments(token: string): Promise<PathEnrolment[]> {
  const data = await fetchJson<{ enrolments: PathEnrolment[] }>("/api/v1/paths/enrol", {
    headers: authHeaders(token),
  });
  return data.enrolments;
}
