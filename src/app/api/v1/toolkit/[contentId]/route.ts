import { errorResponse, okResponse } from "@/lib/http";
import { readBearerToken, requireUserIdFromRequest } from "@/server/auth/require-user";
import { createSupabaseUserClient } from "@/server/supabase/clients";

const VALID_TYPES = new Set(["command", "combo", "course", "resource"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ contentId: string }> },
) {
  const auth = await requireUserIdFromRequest(request);
  if (!auth.ok) return auth.response;

  const { contentId } = await params;
  if (!contentId) return errorResponse("Missing contentId.", 400);

  let contentType: string;
  try {
    const body = await request.json();
    contentType = typeof body?.contentType === "string" ? body.contentType.trim() : "";
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  if (!VALID_TYPES.has(contentType)) {
    return errorResponse("contentType must be 'command', 'combo', 'course', or 'resource'.", 400);
  }

  try {
    const token = readBearerToken(request);
    if (!token) return errorResponse("Missing bearer token.", 401);

    const db = createSupabaseUserClient(token);
    const { error } = await db.from("addition_toolkit").insert({
      user_id: auth.userId,
      content_id: contentId,
      content_type: contentType,
    });

    if (error) {
      // Unique violation — already saved, treat as success
      if (error.code === "23505") return okResponse({ saved: true });
      return errorResponse(error.message, 500);
    }

    return okResponse({ saved: true });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown server error.", 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ contentId: string }> },
) {
  const auth = await requireUserIdFromRequest(request);
  if (!auth.ok) return auth.response;

  const { contentId } = await params;
  if (!contentId) return errorResponse("Missing contentId.", 400);

  const { searchParams } = new URL(request.url);
  const contentType = (searchParams.get("type") || "").trim();
  if (!VALID_TYPES.has(contentType)) {
    return errorResponse("?type must be 'command', 'combo', 'course', or 'resource'.", 400);
  }

  try {
    const token = readBearerToken(request);
    if (!token) return errorResponse("Missing bearer token.", 401);

    const db = createSupabaseUserClient(token);
    const { error } = await db
      .from("addition_toolkit")
      .delete()
      .eq("user_id", auth.userId)
      .eq("content_id", contentId)
      .eq("content_type", contentType);

    if (error) return errorResponse(error.message, 500);

    return okResponse({ removed: true });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown server error.", 500);
  }
}
