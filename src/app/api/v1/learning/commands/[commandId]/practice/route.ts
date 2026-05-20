import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { readBearerToken, requireUserIdFromRequest } from "@/server/auth/require-user";
import { enforceLearningWriteRateLimit } from "@/server/auth/rate-limit-write";
import { SupabaseLearningProgressRepository } from "@/server/repositories/supabase-learning-progress-repository";
import { LearningProgressService } from "@/server/services/learning-progress-service";
import { createSupabaseUserClient } from "@/server/supabase/clients";

type RouteContext = {
  params: Promise<{ commandId: string }>;
};

const PracticePayloadSchema = z
  .object({
    courseId: z.string().min(1).max(160).optional(),
    delta: z.number().int().min(1).max(10).default(1),
  })
  .strict();

function buildService(accessToken: string) {
  const repository = new SupabaseLearningProgressRepository(createSupabaseUserClient(accessToken));
  return new LearningProgressService(repository);
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireUserIdFromRequest(request);
  if (!auth.ok) return auth.response;

  const rateLimit = await enforceLearningWriteRateLimit(auth.userId, "command_practice");
  if (!rateLimit.ok) return rateLimit.response;

  try {
    const token = readBearerToken(request);
    if (!token) return errorResponse("Missing bearer token.", 401);
    const { commandId } = await context.params;
    const normalizedCommandId = decodeURIComponent(commandId || "").trim();
    if (!normalizedCommandId) return errorResponse("Command ID is required.", 400);

    const body = await request.json().catch(() => ({}));
    const parsed = PracticePayloadSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Invalid request body.", 400, parsed.error.issues);
    }

    const db = createSupabaseUserClient(token);
    const { data: commandRow, error: commandError } = await db
      .from("addition_commands")
      .select("id,name")
      .eq("id", normalizedCommandId)
      .maybeSingle();

    if (commandError) return errorResponse(`Failed loading command: ${commandError.message}`, 500);
    if (!commandRow) return errorResponse("Command not found.", 404);

    const service = buildService(token);
    const snapshot = await service.getSnapshot(auth.userId);
    const current = snapshot.commands.find((item) => item.commandId === normalizedCommandId);

    const repetitions = (current?.repetitions || 0) + parsed.data.delta;
    const proficiency = Math.min(100, Math.round((current?.proficiency || 0) + parsed.data.delta * 8));
    const status = proficiency >= 90 ? "mastered" : "learning";

    await service.applyPatch(auth.userId, {
      commands: [{ commandId: normalizedCommandId, repetitions, proficiency, status }],
      event: {
        type: "api_command_practiced",
        payload: { commandId: normalizedCommandId, commandName: commandRow.name, delta: parsed.data.delta },
      },
    });

    const next = await service.getSnapshot(auth.userId);
    const updated = next.commands.find((item) => item.commandId === normalizedCommandId);
    if (!updated) return errorResponse("Failed to persist command practice.", 500);

    if (parsed.data.courseId) {
      const enrollment = next.enrollments.find((item) => item.courseId === parsed.data.courseId);
      if (!enrollment) {
        await service.applyPatch(auth.userId, {
          enrollments: [{ courseId: parsed.data.courseId, status: "active" }],
          event: {
            type: "api_course_enrolled_via_command_practice",
            payload: { courseId: parsed.data.courseId, commandId: normalizedCommandId },
          },
        });
      }
    }

    const response = okResponse({
      command: {
        id: normalizedCommandId,
        name: commandRow.name,
        status: updated.status,
        proficiency: updated.proficiency,
        repetitions: updated.repetitions,
        lastPracticedAt: updated.lastPracticedAt,
      },
    });
    for (const [name, value] of Object.entries(rateLimit.headers)) response.headers.set(name, value);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return errorResponse(message, 500);
  }
}
