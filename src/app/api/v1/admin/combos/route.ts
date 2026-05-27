import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

const ComboSchema = z.object({
  title:       z.string().min(1),
  software:    z.string().default(""),
  difficulty:  z.string().default("beginner"),
  description: z.string().default(""),
  image:       z.string().default(""),
  commands:    z.array(z.object({ name: z.string(), note: z.string().default("") })).default([]),
  tags:        z.array(z.string()).default([]),
  draft:       z.boolean().default(true),
});

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function normalizeSteps(value: unknown): Array<{ name: string; note: string }> {
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

function hasMissingColumn(error: { message?: string } | null): boolean {
  return Boolean(error?.message && /column .* does not exist/i.test(error.message));
}

function normalizeLegacyCombo(row: Record<string, unknown>) {
  return {
    ...row,
    title: cleanString(row.title) || "Untitled Workflow Combo",
    software: cleanString(row.software),
    difficulty: cleanString(row.difficulty) || "beginner",
    description: cleanString(row.description),
    image: cleanString(row.image),
    commands: normalizeSteps(row.commands),
    tags: stringArray(row.tags),
    draft: typeof row.draft === "boolean" ? row.draft : false,
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const db = createSupabaseServiceClient();
    const { data, error: initialError } = await db
      .from("addition_courses")
      .select("id,title,software,difficulty,description,image,commands,tags,draft")
      .eq("type", "combo")
      .order("title", { ascending: true });

    let error = initialError;
    let combos: Record<string, unknown>[] = [];
    if (hasMissingColumn(error)) {
      const legacy = await db
        .from("addition_courses")
        .select("id,title,software,image,commands,tags")
        .eq("type", "combo")
        .order("title", { ascending: true });
      combos = legacy.data?.map((row) => normalizeLegacyCombo(row as Record<string, unknown>)) ?? [];
      error = legacy.error;
    } else {
      combos = data?.map((row) => normalizeLegacyCombo(row as Record<string, unknown>)) ?? [];
    }

    if (error) return errorResponse(error.message, 500);
    return okResponse({ combos, total: combos.length });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error", 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json() as unknown;
    const parsed = ComboSchema.parse(body);
    const db = createSupabaseServiceClient();
    const fullPayload = { ...parsed, type: "combo" };
    let { data, error } = await db
      .from("addition_courses")
      .insert(fullPayload)
      .select()
      .single();

    if (hasMissingColumn(error)) {
      const legacyPayload = {
        title: parsed.title,
        software: parsed.software,
        image: parsed.image,
        commands: parsed.commands,
        tags: parsed.tags,
        type: "combo",
      };
      const legacy = await db
        .from("addition_courses")
        .insert(legacyPayload)
        .select()
        .single();
      data = legacy.data ? normalizeLegacyCombo(legacy.data as Record<string, unknown>) : null;
      error = legacy.error;
    }

    if (error) return errorResponse(error.message, 500);
    return okResponse(normalizeLegacyCombo(data as Record<string, unknown>), 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Invalid input", 400);
  }
}
