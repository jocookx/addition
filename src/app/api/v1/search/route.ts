import { errorResponse, okResponse } from "@/lib/http";
import { normaliseLaunchSoftware } from "@/config/taxonomy";
import { runSearch } from "@/lib/search/engine";
import { readBearerToken, requireUserFromRequest } from "@/server/auth/require-user";
import { consumeRateLimit } from "@/server/rate-limit";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

function clean(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawQ     = clean(searchParams.get("q")).slice(0, 300);
  const software = normaliseLaunchSoftware(clean(searchParams.get("software"))) ?? undefined;

  if (!rawQ) {
    return okResponse({ results: [], fixes: [], problems: [], total: 0, confidence: "low", confidenceScore: 0 });
  }

  // Resolve userId from bearer token if present — never trust client-supplied userId
  let userId: string | undefined;
  const token = readBearerToken(req);
  if (token) {
    const auth = await requireUserFromRequest(req);
    if (auth.ok) userId = auth.user.id;
  }

  const db = createSupabaseServiceClient();

  // Rate limit by user ID when authenticated, fall back to IP for public searches
  const rateLimitKey = userId ? `search:user:${userId}` : `search:ip:${getClientIp(req)}`;
  const limit = await consumeRateLimit(db, {
    key: rateLimitKey,
    max: 60,
    windowMs: 60 * 1000, // 60 requests per minute
  });
  if (!limit.ok) {
    const r = errorResponse("Too many search requests. Slow down.", 429);
    r.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return r;
  }

  try {
    const response = await runSearch(db, rawQ, { userId, software });
    return okResponse(response);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Search failed.", 500);
  }
}
