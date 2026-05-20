/**
 * POST /api/v1/search/log
 * Records a click event on a search result.
 * Body: { logId, clickedItemId, clickedItemType }
 */
import { errorResponse, okResponse } from "@/lib/http";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      logId?: string;
      clickedItemId?: string;
      clickedItemType?: string;
    };
    const { logId, clickedItemId, clickedItemType } = body;
    if (!logId || !clickedItemId) return errorResponse("Missing logId or clickedItemId", 400);

    const db = createSupabaseServiceClient();
    await db
      .from("search_logs")
      .update({ clicked_item_id: clickedItemId, clicked_item_type: clickedItemType ?? null })
      .eq("id", logId);

    return okResponse({ ok: true });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Log failed.", 500);
  }
}
