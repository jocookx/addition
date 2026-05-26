import type { ResourceListItem } from "@/domain/resource";
import { fetchJson } from "@/lib/api/fetch-json";

export async function getResources(accessToken?: string, filters?: {
  search?: string;
  software?: string;
  type?: string;
  access?: string;
}): Promise<ResourceListItem[]> {
  const url = new URL("/api/v1/resources", window.location.origin);
  if (filters?.search) url.searchParams.set("search", filters.search);
  if (filters?.software && filters.software !== "All") url.searchParams.set("software", filters.software);
  if (filters?.type && filters.type !== "All") url.searchParams.set("type", filters.type);
  if (filters?.access && filters.access !== "All") url.searchParams.set("access", filters.access);
  const payload = await fetchJson<{ resources: ResourceListItem[] }>(url.toString(), {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    retries: 1,
    timeoutMs: 10_000,
  });
  return payload.resources;
}
