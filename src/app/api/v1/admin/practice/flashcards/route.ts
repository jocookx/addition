import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

const CardSchema = z.object({
  deck_id:    z.string().uuid(),
  front:      z.string().min(1),
  back:       z.string().min(1),
  hint:       z.string().default(""),
  sort_order: z.number().int().default(0),
});

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const deckId = url.searchParams.get("deck_id");
  const db = createSupabaseServiceClient();
  let q = db.from("addition_flashcards").select("*").order("sort_order", { ascending: true });
  if (deckId) q = q.eq("deck_id", deckId);

  const { data, error } = await q;
  if (error) return errorResponse(error.message, 500);
  return okResponse({ cards: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json() as unknown;
    const parsed = CardSchema.parse(body);
    const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from("addition_flashcards")
      .insert(parsed).select().single();

    if (error) return errorResponse(error.message, 500);
    return okResponse(data, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Invalid input", 400);
  }
}
