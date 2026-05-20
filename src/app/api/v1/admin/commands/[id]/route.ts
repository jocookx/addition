import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

const CommandPatchSchema = z.object({
  name:        z.string().min(1).optional(),
  software:    z.string().min(1).optional(),
  menu:        z.string().optional(),
  description: z.string().optional(),
  source:      z.string().optional(),
  icon:        z.string().optional(),
  gif:         z.string().optional(),
  shortcut:    z.string().optional(),
  addon:       z.string().optional(),
  tags:        z.array(z.string()).optional(),
  intentCategories: z.array(z.string()).optional(),
  objectTypes:  z.array(z.string()).optional(),
  outcomes:     z.array(z.string()).optional(),
  difficulty:   z.string().optional(),
});

function hasMissingColumn(error: { message?: string } | null): boolean {
  return Boolean(error?.message && /column .* does not exist/i.test(error.message));
}

function stripLegacyMissingCommandFields<T extends Record<string, unknown>>(patch: T) {
  const legacyPatch = { ...patch };
  delete legacyPatch.shortcut;
  delete legacyPatch.addon;
  delete legacyPatch.intent_categories;
  delete legacyPatch.object_types;
  delete legacyPatch.outcomes;
  delete legacyPatch.difficulty;
  return legacyPatch;
}

function toDatabasePatch(patch: z.infer<typeof CommandPatchSchema>) {
  const next: Record<string, unknown> = { ...patch };
  if (patch.intentCategories) {
    next.intent_categories = patch.intentCategories;
    delete next.intentCategories;
  }
  if (patch.objectTypes) {
    next.object_types = patch.objectTypes;
    delete next.objectTypes;
  }
  return next;
}

function normalizeCommand(row: Record<string, unknown>) {
  return {
    ...row,
    shortcut: typeof row.shortcut === "string" ? row.shortcut : "",
    addon: typeof row.addon === "string" ? row.addon : "",
    tags: Array.isArray(row.tags) ? row.tags : [],
    intentCategories: Array.isArray(row.intent_categories) ? row.intent_categories : Array.isArray(row.intentCategories) ? row.intentCategories : [],
    objectTypes: Array.isArray(row.object_types) ? row.object_types : Array.isArray(row.objectTypes) ? row.objectTypes : [],
    outcomes: Array.isArray(row.outcomes) ? row.outcomes : [],
    difficulty: typeof row.difficulty === "string" && row.difficulty ? row.difficulty : "beginner",
  };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) return errorResponse("Missing id", 400);

  try {
    const body = await request.json();
    const patch = CommandPatchSchema.parse(body);
    const dbPatch = toDatabasePatch(patch);
    const db = createSupabaseServiceClient();
    let { data, error } = await db
      .from("addition_commands")
      .update(dbPatch)
      .eq("id", id)
      .select()
      .single();

    if (hasMissingColumn(error)) {
      const legacy = await db
        .from("addition_commands")
        .update(stripLegacyMissingCommandFields(dbPatch))
        .eq("id", id)
        .select()
        .single();
      data = legacy.data;
      error = legacy.error;
    }

    if (error) return errorResponse(`DB: ${error.message}`, 500);
    if (!data) return errorResponse("Not found", 404);
    return okResponse(normalizeCommand(data as Record<string, unknown>));
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Invalid input", 400);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) return errorResponse("Missing id", 400);

  const db = createSupabaseServiceClient();
  const { error } = await db.from("addition_commands").delete().eq("id", id);
  if (error) return errorResponse(`DB: ${error.message}`, 500);
  return okResponse({ deleted: true });
}
