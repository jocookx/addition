import type { UserProfile } from "@/domain/user-profile";
import { fetchJson } from "@/lib/api/fetch-json";

function buildAuthHeaders(accessToken: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function ensureAuthProfile(accessToken: string): Promise<UserProfile> {
  const payload = await fetchJson<{ profile: UserProfile }>("/api/v1/auth/profile", {
    method: "POST",
    headers: buildAuthHeaders(accessToken),
    timeoutMs: 12_000,
  });
  return payload.profile;
}

export async function getAuthProfile(accessToken: string): Promise<UserProfile> {
  const payload = await fetchJson<{ profile: UserProfile }>("/api/v1/auth/profile", {
    method: "GET",
    headers: buildAuthHeaders(accessToken),
    retries: 1,
    timeoutMs: 12_000,
  });
  return payload.profile;
}

export async function updateAuthProfile(
  accessToken: string,
  updates: Partial<Pick<UserProfile, "level" | "name">>,
): Promise<UserProfile> {
  const payload = await fetchJson<{ profile: UserProfile }>("/api/v1/auth/profile", {
    method: "PATCH",
    headers: buildAuthHeaders(accessToken),
    body: JSON.stringify(updates),
    retries: 0,
    timeoutMs: 12_000,
  });
  return payload.profile;
}
