import type { ComboListItem } from "@/domain/combo";
import { fetchJson } from "@/lib/api/fetch-json";

export async function getCombos(software?: string): Promise<ComboListItem[]> {
  const query = software && software !== "All" ? `?software=${encodeURIComponent(software)}` : "";
  const payload = await fetchJson<{ combos?: ComboListItem[] }>(`/api/v1/combos${query}`, {
    method: "GET",
    retries: 2,
    timeoutMs: 10_000,
  });
  return payload.combos || [];
}
