import type { ComboListItem } from "@/domain/combo";
import { fetchJson } from "@/lib/api/fetch-json";

const comboCache = new Map<string, Promise<ComboListItem[]>>();

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSteps(value: unknown): ComboListItem["commands"] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === "string") return { name: item.trim(), note: "" };
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      return {
        name: cleanString(record.name),
        note: cleanString(record.note),
      };
    }
    return { name: "", note: "" };
  }).filter((step) => step.name);
}

function normalizeCombo(combo: Partial<ComboListItem> & { commands?: unknown; tags?: unknown }): ComboListItem {
  return {
    id: cleanString(combo.id),
    title: cleanString(combo.title),
    software: cleanString(combo.software),
    difficulty: cleanString(combo.difficulty),
    description: cleanString(combo.description),
    gif: cleanString(combo.gif),
    commands: normalizeSteps(combo.commands),
    tags: Array.isArray(combo.tags) ? combo.tags.map((tag) => cleanString(tag)).filter(Boolean) : [],
  };
}

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
    .then((payload) => (payload.combos || []).map(normalizeCombo))
    .catch((err) => {
      comboCache.delete(cacheKey);
      throw err;
    });

  comboCache.set(cacheKey, request);
  return request;
}
