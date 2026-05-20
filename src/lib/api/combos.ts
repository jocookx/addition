import type { ComboListItem } from "@/domain/combo";
import { fetchJson } from "@/lib/api/fetch-json";

const comboCache = new Map<string, Promise<ComboListItem[]>>();

export async function getCombos(software?: string): Promise<ComboListItem[]> {
  const query = software && software !== "All" ? `?software=${encodeURIComponent(software)}` : "";
  const cacheKey = query || "all";
  const cached = comboCache.get(cacheKey);
  if (cached) return cached;

  const request = fetchJson<{ combos?: ComboListItem[] }>(`/api/v1/combos${query}`, {
    method: "GET",
    retries: 2,
    timeoutMs: 10_000,
  })
    .then((payload) => payload.combos || [])
    .catch((err) => {
      comboCache.delete(cacheKey);
      throw err;
    });

  comboCache.set(cacheKey, request);
  return request;
}
