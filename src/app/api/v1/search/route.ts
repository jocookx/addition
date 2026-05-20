import { errorResponse, okResponse } from "@/lib/http";
import { normaliseLaunchSoftware } from "@/config/taxonomy";
import { runSearch } from "@/lib/search/engine";
import { readBearerToken, requireUserFromRequest } from "@/server/auth/require-user";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

function clean(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
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

  try {
    const db = createSupabaseServiceClient();
    const response = await runSearch(db, rawQ, { userId, software });
    return okResponse(response);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Search failed.", 500);
  }
}
