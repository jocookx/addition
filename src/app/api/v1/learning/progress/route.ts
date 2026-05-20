import { ZodError } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { readBearerToken, requireUserIdFromRequest } from "@/server/auth/require-user";
import { enforceLearningWriteRateLimit } from "@/server/auth/rate-limit-write";
import { SupabaseLearningProgressRepository } from "@/server/repositories/supabase-learning-progress-repository";
import { LearningProgressService } from "@/server/services/learning-progress-service";
import { createSupabaseUserClient } from "@/server/supabase/clients";

function buildService(accessToken: string) {
  const repository = new SupabaseLearningProgressRepository(createSupabaseUserClient(accessToken));
  return new LearningProgressService(repository);
}

export async function GET(request: Request) {
  const auth = await requireUserIdFromRequest(request);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId") || undefined;

  try {
    const token = readBearerToken(request);
    if (!token) return errorResponse("Missing bearer token.", 401);
    const service = buildService(token);
    const snapshot = await service.getSnapshot(auth.userId, courseId);
    return okResponse(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return errorResponse(message, 500);
  }
}

export async function PATCH(request: Request) {
  const auth = await requireUserIdFromRequest(request);
  if (!auth.ok) return auth.response;

  const rateLimit = await enforceLearningWriteRateLimit(auth.userId, "progress_patch");
  if (!rateLimit.ok) return rateLimit.response;

  try {
    const token = readBearerToken(request);
    if (!token) return errorResponse("Missing bearer token.", 401);
    const payload = await request.json();
    const service = buildService(token);
    const snapshot = await service.applyPatch(auth.userId, payload);
    const response = okResponse(snapshot);
    for (const [name, value] of Object.entries(rateLimit.headers)) response.headers.set(name, value);
    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid progress payload.", 400, error.issues);
    }
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return errorResponse(message, 500);
  }
}
