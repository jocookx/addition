import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const db = createSupabaseServiceClient();

    const [logsRes, failedRes] = await Promise.all([
      db.from("search_logs").select("raw_query,confidence_score,no_result", { count: "exact" }),
      db.from("search_failed_searches").select("raw_query,reviewed"),
    ]);

    if (logsRes.error) return errorResponse(logsRes.error.message, 500);
    if (failedRes.error) return errorResponse(failedRes.error.message, 500);

    const logs   = logsRes.data ?? [];
    const failed = failedRes.data ?? [];

    const totalSearches  = logsRes.count ?? logs.length;
    const noResultCount  = logs.filter(l => l.no_result).length;
    const avgConfidence  = logs.length
      ? Math.round(logs.reduce((s, l) => s + (l.confidence_score ?? 0), 0) / logs.length)
      : 0;

    // Top queries by frequency
    const queryCount = new Map<string, number>();
    for (const l of logs) {
      const q = l.raw_query?.toLowerCase() ?? "";
      queryCount.set(q, (queryCount.get(q) ?? 0) + 1);
    }
    const topQueries = [...queryCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    // Top failed queries by frequency
    const failedCount = new Map<string, number>();
    for (const f of failed) {
      const q = f.raw_query?.toLowerCase() ?? "";
      failedCount.set(q, (failedCount.get(q) ?? 0) + 1);
    }
    const topFailed = [...failedCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    return okResponse({ totalSearches, noResultCount, avgConfidence, topQueries, topFailed });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error", 500);
  }
}
