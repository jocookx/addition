import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from("search_logs")
      .select("id,raw_query,detected_intent,detected_software,confidence_score,result_count,clicked_item_id,no_result,created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return errorResponse(error.message, 500);
    return okResponse(data ?? []);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error", 500);
  }
}
