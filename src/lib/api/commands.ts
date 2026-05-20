import type { CommandListItem } from "@/domain/command";
import { fetchJson } from "@/lib/api/fetch-json";

const commandCache = new Map<string, Promise<CommandListItem[]>>();

export async function getCommands(software?: string): Promise<CommandListItem[]> {
  const query = software && software !== "All" ? `?software=${encodeURIComponent(software)}` : "";
  const cacheKey = query || "all";
  const cached = commandCache.get(cacheKey);
  if (cached) return cached;

  const request = fetchJson<{ commands?: CommandListItem[] }>(`/api/v1/commands${query}`, {
    method: "GET",
    retries: 2,
    timeoutMs: 15_000,
  })
    .then((payload) => payload.commands || [])
    .catch((err) => {
      commandCache.delete(cacheKey);
      throw err;
    });

  commandCache.set(cacheKey, request);
  return request;
}
