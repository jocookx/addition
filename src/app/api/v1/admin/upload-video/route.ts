/**
 * POST /api/v1/admin/upload-video
 *
 * Returns a one-time Cloudflare Stream direct-upload URL plus the video UID.
 * The browser uses the uploadUrl with the TUS protocol to upload directly to
 * Cloudflare — the video file never passes through this server.
 *
 * Response: { uploadUrl: string, videoId: string }
 */
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createDirectUpload, isCloudflareStreamConfigured } from "@/lib/cloudflare-stream";

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  if (!isCloudflareStreamConfigured()) {
    return errorResponse(
      "Cloudflare Stream is not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_STREAM_API_TOKEN.",
      503,
    );
  }

  try {
    const result = await createDirectUpload();
    return okResponse(result);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Could not create upload slot.", 500);
  }
}
