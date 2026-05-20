import { fetchJson } from "@/lib/api/fetch-json";
import type { WorkshopDetail, WorkshopListItem } from "@/domain/workshop";

const workshopListCache = new Map<string, Promise<WorkshopListItem[]>>();
const workshopDetailCache = new Map<string, Promise<WorkshopDetail>>();

export async function getWorkshops(options?: {
  upcoming?: boolean;
  track?: string;
}): Promise<WorkshopListItem[]> {
  const params = new URLSearchParams();
  if (options?.upcoming === false) params.set("upcoming", "false");
  if (options?.track) params.set("track", options.track);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const cacheKey = qs || "?upcoming=true";
  const cached = workshopListCache.get(cacheKey);
  if (cached) return cached;

  const request = fetchJson<{ workshops: WorkshopListItem[] }>(`/api/v1/workshops${qs}`)
    .then((body) => body.workshops)
    .catch((error) => {
      workshopListCache.delete(cacheKey);
      throw error;
    });
  workshopListCache.set(cacheKey, request);
  return request;
}

export async function getWorkshopDetail(workshopId: string): Promise<WorkshopDetail> {
  const cached = workshopDetailCache.get(workshopId);
  if (cached) return cached;

  const request = fetchJson<{ workshop: WorkshopDetail }>(`/api/v1/workshops/${encodeURIComponent(workshopId)}`)
    .then((body) => body.workshop)
    .catch((error) => {
      workshopDetailCache.delete(workshopId);
      throw error;
    });
  workshopDetailCache.set(workshopId, request);
  return request;
}

export async function getWorkshopRegisterUrl(
  workshopId: string,
  accessToken: string,
): Promise<string> {
  const body = await fetchJson<{ url: string }>(
    `/api/v1/workshops/${encodeURIComponent(workshopId)}/register`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return body.url;
}

export async function getWorkshopEmbeddedCheckoutClientSecret(
  workshopId: string,
  accessToken: string,
): Promise<string> {
  const body = await fetchJson<{ clientSecret: string }>(
    `/api/v1/workshops/${encodeURIComponent(workshopId)}/checkout-session`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  return body.clientSecret;
}

export async function getMyRegisteredWorkshops(
  accessToken: string,
): Promise<WorkshopListItem[]> {
  const body = await fetchJson<{ workshops: WorkshopListItem[] }>(
    "/api/v1/workshops/my-registrations",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return body.workshops;
}

export async function getWorkshopCartCheckoutUrl(
  workshopIds: string[],
  accessToken?: string,
): Promise<string> {
  const body = await fetchJson<{ url: string }>("/api/v1/workshops/cart/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ workshopIds }),
  });
  return body.url;
}
