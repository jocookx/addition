import type { LearningSummary } from "@/domain/learning-summary";
import { fetchJson } from "@/lib/api/fetch-json";

function buildAuthHeaders(accessToken: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function getLearningSummary(accessToken: string): Promise<LearningSummary> {
  const payload = await fetchJson<{ summary: LearningSummary }>("/api/v1/learning/summary", {
    method: "GET",
    headers: buildAuthHeaders(accessToken),
    retries: 1,
    timeoutMs: 12_000,
  });
  return payload.summary;
}
