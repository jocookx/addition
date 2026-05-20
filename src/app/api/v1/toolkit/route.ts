import type { ToolkitItem } from "@/domain/toolkit";
import { errorResponse, okResponse } from "@/lib/http";
import { readBearerToken, requireUserIdFromRequest } from "@/server/auth/require-user";
import { createSupabaseUserClient } from "@/server/supabase/clients";

type ToolkitRow = {
  id: string;
  content_id: string;
  content_type: string;
  saved_at: string;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: Request) {
  const auth = await requireUserIdFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const token = readBearerToken(request);
    if (!token) return errorResponse("Missing bearer token.", 401);

    const db = createSupabaseUserClient(token);
    const { data, error } = await db
      .from("addition_toolkit")
      .select("id,content_id,content_type,saved_at")
      .order("saved_at", { ascending: false });

    if (error) return errorResponse(error.message, 500);

    const items: ToolkitItem[] = ((data || []) as ToolkitRow[]).map((row) => ({
      id: cleanString(row.id),
      contentId: cleanString(row.content_id),
      contentType: cleanString(row.content_type) as ToolkitItem["contentType"],
      savedAt: cleanString(row.saved_at),
    }));

    return okResponse({ items });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown server error.", 500);
  }
}
