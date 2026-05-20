import type { CommandListItem } from "@/domain/command";
import { fetchJson } from "@/lib/api/fetch-json";

export async function getCommands(software?: string): Promise<CommandListItem[]> {
  const query = software && software !== "All" ? `?software=${encodeURIComponent(software)}` : "";
  const payload = await fetchJson<{ commands?: CommandListItem[] }>(`/api/v1/commands${query}`, {
    method: "GET",
    retries: 2,
    timeoutMs: 10_000,
  });
  return payload.commands || [];
}
