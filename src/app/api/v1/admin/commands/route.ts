import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

function cleanString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function hasMissingColumn(error: { message?: string } | null): boolean {
  return Boolean(error?.message && /column .* does not exist/i.test(error.message));
}

function normalizeLegacyCommand(row: Record<string, unknown>) {
  return {
    ...row,
    shortcut: cleanString(row.shortcut),
    addon: cleanString(row.addon),
    tags: Array.isArray(row.tags) ? row.tags : [],
    intentCategories: Array.isArray(row.intent_categories) ? row.intent_categories : Array.isArray(row.intentCategories) ? row.intentCategories : [],
    objectTypes: Array.isArray(row.object_types) ? row.object_types : Array.isArray(row.objectTypes) ? row.objectTypes : [],
    outcomes: Array.isArray(row.outcomes) ? row.outcomes : [],
    difficulty: cleanString(row.difficulty) || "beginner",
  };
}

const CommandUpsertSchema = z.object({
  id:          z.string().optional(),
  name:        z.string().min(1),
  software:    z.string().min(1),
  menu:        z.string().default(""),
  description: z.string().default(""),
  source:      z.string().default(""),
  icon:        z.string().default(""),
  gif:         z.string().default(""),
  shortcut:    z.string().default(""),
  addon:       z.string().default(""),
  tags:        z.array(z.string()).default([]),
  intentCategories: z.array(z.string()).default([]),
  objectTypes:  z.array(z.string()).default([]),
  outcomes:     z.array(z.string()).default([]),
  difficulty:   z.string().default("beginner"),
});

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const software = cleanString(searchParams.get("software"));
  const q        = cleanString(searchParams.get("q")).toLowerCase();
  const page     = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit    = Math.min(200, Math.max(10, Number(searchParams.get("limit") || "100")));
  const offset   = (page - 1) * limit;

  try {
    const db = createSupabaseServiceClient();
    let query = db
      .from("addition_commands")
      .select("id,name,software,menu,description,source,icon,gif,shortcut,addon,tags,intent_categories,object_types,outcomes,difficulty", { count: "exact" })
      .order("software", { ascending: true })
      .order("name",     { ascending: true })
      .range(offset, offset + limit - 1);

    if (software) query = query.eq("software", software);
    if (q) {
      const qEscaped = q.replace(/[%_\\]/g, "\\$&");
      query = query.or(`name.ilike.%${qEscaped}%,description.ilike.%${qEscaped}%`);
    }

    const { data, error: initialError, count: initialCount } = await query;
    let error = initialError;
    let count = initialCount;
    let commandRows: Record<string, unknown>[] = [];
    if (hasMissingColumn(error)) {
      let legacyQuery = db
        .from("addition_commands")
        .select("id,name,software,menu,description,source,icon,gif,tags", { count: "exact" })
        .order("software", { ascending: true })
        .order("name",     { ascending: true })
        .range(offset, offset + limit - 1);

      if (software) legacyQuery = legacyQuery.eq("software", software);
      if (q) {
        const qEscaped = q.replace(/[%_\\]/g, "\\$&");
        legacyQuery = legacyQuery.or(`name.ilike.%${qEscaped}%,description.ilike.%${qEscaped}%`);
      }

      const legacy = await legacyQuery;
      commandRows = legacy.data?.map((row) => normalizeLegacyCommand(row as Record<string, unknown>)) ?? [];
      error = legacy.error;
      count = legacy.count;
    } else {
      commandRows = data?.map((row) => normalizeLegacyCommand(row as Record<string, unknown>)) ?? [];
    }

    if (error) return errorResponse(`DB: ${error.message}`, 500);

    return okResponse({ commands: commandRows, total: count ?? 0, page, limit });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error", 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const parsed = CommandUpsertSchema.parse(body);
    const db = createSupabaseServiceClient();
    const fullPayload = {
      name:        parsed.name,
      software:    parsed.software,
      menu:        parsed.menu,
      description: parsed.description,
      source:      parsed.source,
      icon:        parsed.icon,
      gif:         parsed.gif,
      shortcut:    parsed.shortcut,
      addon:       parsed.addon,
      tags:        parsed.tags,
      intent_categories: parsed.intentCategories,
      object_types: parsed.objectTypes,
      outcomes:     parsed.outcomes,
      difficulty:   parsed.difficulty,
    };

    let { data, error } = await db
      .from("addition_commands")
      .insert(fullPayload)
      .select()
      .single();

    if (hasMissingColumn(error)) {
      const legacyPayload = {
        name:        fullPayload.name,
        software:    fullPayload.software,
        menu:        fullPayload.menu,
        description: fullPayload.description,
        source:      fullPayload.source,
        icon:        fullPayload.icon,
        gif:         fullPayload.gif,
        tags:        fullPayload.tags,
      };
      const legacy = await db
        .from("addition_commands")
        .insert(legacyPayload)
        .select()
        .single();
      data = legacy.data ? normalizeLegacyCommand(legacy.data as Record<string, unknown>) : null;
      error = legacy.error;
    }

    if (error) return errorResponse(`DB: ${error.message}`, 500);
    return okResponse(normalizeLegacyCommand(data as Record<string, unknown>), 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Invalid input", 400);
  }
}
