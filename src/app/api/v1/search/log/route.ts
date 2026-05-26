/**
 * POST /api/v1/search/log
 * Records a click event on a search result.
 * Body: { logId, clickedItemId, clickedItemType }
 */
import { errorResponse, okResponse } from "@/lib/http";
import { consumeRateLimit } from "@/server/rate-limit";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

// RFC 4122 UUID (v1–v5) — validates both logId and clickedItemId to prevent
// free-form strings being used as SQL-injection vectors or log-spam keys.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: Request) {
  try {
    const db = createSupabaseServiceClient();

    // Rate limit unauthenticated analytics writes — 30 per minute per IP
    const limit = await consumeRateLimit(db, {
      key: `search-log:${getClientIp(req)}`,
      max: 30,
      windowMs: 60 * 1000,
    });
    if (!limit.ok) {
      const r = errorResponse("Too many requests.", 429);
      r.headers.set("Retry-After", String(limit.retryAfterSeconds));
      return r;
    }

    const body = await req.json() as {
      logId?: string;
      clickedItemId?: string;
      clickedItemType?: string;
    };
    const { logId, clickedItemId, clickedItemType } = body;

    // Validate that both IDs are well-formed UUIDs before hitting the DB.
    // This prevents IDOR probing with arbitrary strings and eliminates an
    // entire class of injection-adjacent inputs.
    if (!logId || !UUID_RE.test(logId)) return errorResponse("Invalid logId.", 400);
    if (!clickedItemId || !UUID_RE.test(clickedItemId)) return errorResponse("Invalid clickedItemId.", 400);

    const safeType =
      typeof clickedItemType === "string" ? clickedItemType.slice(0, 50) : null;

    await db
      .from("search_logs")
      .update({ clicked_item_id: clickedItemId, clicked_item_type: safeType })
      .eq("id", logId);

    return okResponse({ ok: true });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Log failed.", 500);
  }
}
