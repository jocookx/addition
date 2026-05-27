import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

const PatchSchema = z.object({
  title:       z.string().min(1).optional(),
  software:    z.string().optional(),
  difficulty:  z.string().optional(),
  description: z.string().optional(),
  image:       z.string().optional(),
  commands:    z.array(z.object({ name: z.string(), note: z.string().default("") })).optional(),
  tags:        z.array(z.string()).optional(),
  draft:       z.boolean().optional(),
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

function stripLegacyMissingComboFields<T extends Record<string, unknown>>(patch: T) {
  const legacyPatch = { ...patch };
  delete legacyPatch.difficulty;
  delete legacyPatch.description;
  delete legacyPatch.draft;
  delete legacyPatch.updated_at;
  return legacyPatch;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    const body = await request.json() as unknown;
    const patch = PatchSchema.parse(body);
    const db = createSupabaseServiceClient();
    let { data, error } = await db
      .from("addition_courses")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id).eq("type", "combo")
      .select().single();

    if (hasMissingColumn(error)) {
      const legacy = await db
        .from("addition_courses")
        .update(stripLegacyMissingComboFields(patch))
        .eq("id", id).eq("type", "combo")
        .select().single();
      data = legacy.data ? normalizeLegacyCombo(legacy.data as Record<string, unknown>) : null;
      error = legacy.error;
    }

    if (error) return errorResponse(error.message, 500);
    return okResponse(normalizeLegacyCombo(data as Record<string, unknown>));
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Invalid input", 400);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    const db = createSupabaseServiceClient();
    const { error } = await db
      .from("addition_courses")
      .delete()
      .eq("id", id).eq("type", "combo");

    if (error) return errorResponse(error.message, 500);
    return okResponse({ deleted: id });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error", 500);
  }
}
