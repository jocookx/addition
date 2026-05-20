import { errorResponse, okResponse } from "@/lib/http";
import { StudioPayloadSchema } from "@/domain/content-studio";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { readStudioPayload, writeStudioPayload } from "@/server/content-studio/file-content-studio-repository";

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const payload = await readStudioPayload();
    return okResponse(payload);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed loading content studio data.", 500);
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const payload = StudioPayloadSchema.parse(body);
    const saved = await writeStudioPayload(payload);
    return okResponse(saved);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed saving content studio data.", 400);
  }
}
