import { errorResponse, okResponse } from "@/lib/http";
import { readBearerToken, requireUserIdFromRequest } from "@/server/auth/require-user";
import { getLearningSummary } from "@/server/learning/get-learning-summary";
import { createSupabaseUserClient } from "@/server/supabase/clients";

export async function GET(request: Request) {
  const auth = await requireUserIdFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const token = readBearerToken(request);
    if (!token) return errorResponse("Missing bearer token.", 401);
    const db = createSupabaseUserClient(token);
    const summary = await getLearningSummary(db, auth.userId);
    return okResponse({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return errorResponse(message, 500);
  }
}
