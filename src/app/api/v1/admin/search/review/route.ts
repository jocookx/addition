import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

export async function PATCH(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json() as {
      id?: string;
      reviewed?: boolean;
      admin_notes?: string;
      suggested_synonym?: string;
    };

    const { id, reviewed, admin_notes, suggested_synonym } = body;
    if (!id) return errorResponse("Missing id", 400);

    const db = createSupabaseServiceClient();
    const { error } = await db
      .from("search_failed_searches")
      .update({
        reviewed:          reviewed ?? true,
        admin_notes:       admin_notes ?? null,
        suggested_synonym: suggested_synonym ?? null,
        reviewed_at:       new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return errorResponse(error.message, 500);
    return okResponse({ ok: true });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error", 500);
  }
}
