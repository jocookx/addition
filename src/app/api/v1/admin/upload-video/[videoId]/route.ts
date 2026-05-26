/**
 * GET /api/v1/admin/upload-video/[videoId]
 *
 * Poll Cloudflare Stream for the current status of a video after upload.
 * Returns VideoDetails: status, playbackUrl, thumbnailUrl, durationSeconds, ready.
 *
 * The admin client polls this every 3 seconds after TUS upload completes
 * until ready === true.
 */
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { getVideoDetails } from "@/lib/cloudflare-stream";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  const { videoId } = await params;
  if (!videoId || typeof videoId !== "string" || videoId.length < 8) {
    return errorResponse("Invalid videoId.", 400);
  }

  try {
    const details = await getVideoDetails(videoId);
    return okResponse(details);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Could not fetch video status.", 500);
  }
}
