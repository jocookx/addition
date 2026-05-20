import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

const DeckSchema = z.object({
  title:       z.string().min(1),
  software:    z.string().default(""),
  topic:       z.string().default(""),
  description: z.string().default(""),
  sort_order:  z.number().int().default(0),
  published:   z.boolean().default(false),
});

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from("addition_flashcard_decks")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return errorResponse(error.message, 500);
  return okResponse({ decks: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json() as unknown;
    const parsed = DeckSchema.parse(body);
    const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from("addition_flashcard_decks")
      .insert(parsed).select().single();

    if (error) return errorResponse(error.message, 500);
    return okResponse(data, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Invalid input", 400);
  }
}
