import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json() as {
      user_phrase?: string;
      command_name?: string;
      content_id?: string;
      software?: string;
      weight?: number;
    };

    const { user_phrase, command_name, content_id, software, weight } = body;
    if (!user_phrase) return errorResponse("Missing user_phrase", 400);
    if (!command_name && !content_id) return errorResponse("Must provide command_name or content_id", 400);

    const db = createSupabaseServiceClient();
    const { error } = await db.from("search_synonyms").insert({
      user_phrase: user_phrase.trim().toLowerCase(),
      command_name: command_name ?? null,
      content_id:   content_id ?? null,
      software:     software ?? null,
      weight:       weight ?? 1.0,
    });

    if (error) return errorResponse(error.message, 500);
    return okResponse({ ok: true });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error", 500);
  }
}
