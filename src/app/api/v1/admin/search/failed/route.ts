import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from("search_failed_searches")
      .select("id,raw_query,normalised_query,reason,reviewed,admin_notes,suggested_synonym,created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return errorResponse(error.message, 500);
    return okResponse(data ?? []);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error", 500);
  }
}
