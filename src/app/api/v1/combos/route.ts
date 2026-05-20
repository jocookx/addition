import { promises as fs } from "node:fs";
import path from "node:path";
import type { ComboListItem, ComboStep } from "@/domain/combo";
import { cachedOkResponse, errorResponse } from "@/lib/http";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

export const revalidate = 3600;

type ComboRow = {
  id: string;
  title: string;
  software: string | null;
  difficulty: string | null;
  description: string | null;
  summary: string | null;
  image: string | null;
  commands: unknown;
  tags: string[] | null;
};

type BackendStore = {
  content?: {
    combos?: unknown[];
  };
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSteps(value: unknown): ComboStep[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return { name: cleanString(item), note: "" };
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      return {
        name: cleanString((item as { name?: unknown }).name),
        note: cleanString((item as { note?: unknown }).note),
      };
    })
    .filter((item): item is ComboStep => Boolean(item?.name));
}

function toComboListItem(row: ComboRow): ComboListItem {
  return {
    id: cleanString(row.id),
    title: cleanString(row.title),
    software: cleanString(row.software),
    difficulty: cleanString(row.difficulty),
    description: cleanString(row.description) || cleanString(row.summary),
    gif: cleanString(row.image),
    commands: normalizeSteps(row.commands),
    tags: Array.isArray(row.tags) ? row.tags.map((tag) => cleanString(tag)).filter(Boolean) : [],
  };
}

async function loadFallbackCombos(): Promise<ComboListItem[]> {
  const repoRoot = path.resolve(process.cwd(), "..", "..");
  const storePath = path.join(repoRoot, "data", "backend-store.json");
  const raw = await fs.readFile(storePath, "utf8");
  const parsed = JSON.parse(raw) as BackendStore;
  const items = Array.isArray(parsed.content?.combos) ? parsed.content.combos : [];

  return items
    .filter((item): item is ComboRow => Boolean(item && typeof item === "object" && !Array.isArray(item)))
    .map((item) => toComboListItem(item));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const software = cleanString(url.searchParams.get("software"));

  try {
    let combos: ComboListItem[] = [];

    try {
      const db = createSupabaseServiceClient();
      const { data, error } = await db
        .from("addition_courses")
        .select("id,title,software,difficulty,description,summary,image,commands,tags")
        .eq("type", "combo")
        .order("title", { ascending: true });

      if (error) throw new Error(error.message);
      combos = ((data || []) as ComboRow[]).map(toComboListItem);
    } catch {
      combos = await loadFallbackCombos();
    }

    const filtered = (software ? combos.filter((combo) => combo.software === software) : combos)
      .filter((combo) => combo.title)
      .sort((a, b) => a.title.localeCompare(b.title));

    return cachedOkResponse({ combos: filtered, total: filtered.length }, 3600, 86400);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Unknown server error.", 500);
  }
}
