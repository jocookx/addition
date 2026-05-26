import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { readBearerToken, requireUserIdFromRequest } from "@/server/auth/require-user";
import { createSupabaseUserClient } from "@/server/supabase/clients";

const MasterySchema = z.enum(["not_started", "practising", "confident", "mastered"]);

const ProgressPatchSchema = z.object({
  commands: z.array(z.object({
    commandId: z.string().uuid(),
    attemptedDelta: z.number().int().min(0).max(100).default(0),
    correctDelta: z.number().int().min(0).max(100).default(0),
    incorrectDelta: z.number().int().min(0).max(100).default(0),
    confidence: z.number().int().min(0).max(100).optional(),
    masteryState: MasterySchema.optional(),
  })).max(200).default([]),
}).strict();

export async function GET(request: Request) {
  const auth = await requireUserIdFromRequest(request);
  if (!auth.ok) return auth.response;
  const token = readBearerToken(request);
  if (!token) return errorResponse("Missing bearer token.", 401);

  const db = createSupabaseUserClient(token);
  const { data, error } = await db
    .from("addition_command_progress")
    .select("command_id,attempted_count,correct_count,incorrect_count,confidence,mastery_state,last_practiced_at")
    .eq("user_id", auth.userId)
    .order("last_practiced_at", { ascending: false })
    .limit(1000);

  if (error) return errorResponse(error.message, 500);

  return okResponse({
    commands: (data ?? []).map((row) => ({
      commandId: row.command_id,
      attemptedCount: row.attempted_count ?? 0,
      correctCount: row.correct_count ?? 0,
      incorrectCount: row.incorrect_count ?? 0,
      confidence: row.confidence ?? 0,
      masteryState: row.mastery_state ?? "not_started",
      lastPracticedAt: row.last_practiced_at,
    })),
  });
}

export async function PATCH(request: Request) {
  const auth = await requireUserIdFromRequest(request);
  if (!auth.ok) return auth.response;
  const token = readBearerToken(request);
  if (!token) return errorResponse("Missing bearer token.", 401);

  const body = await request.json().catch(() => ({}));
  const parsed = ProgressPatchSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid request body.", 400, parsed.error.issues);
  if (!parsed.data.commands.length) return okResponse({ updated: 0 });

  const db = createSupabaseUserClient(token);
  const commandIds = parsed.data.commands.map((item) => item.commandId);
  const { data: existing, error: existingError } = await db
    .from("addition_command_progress")
    .select("command_id,attempted_count,correct_count,incorrect_count,confidence,mastery_state")
    .eq("user_id", auth.userId)
    .in("command_id", commandIds);

  if (existingError) return errorResponse(existingError.message, 500);
  const existingMap = new Map((existing ?? []).map((row) => [row.command_id as string, row]));
  const now = new Date().toISOString();
  const rows = parsed.data.commands.map((item) => {
    const current = existingMap.get(item.commandId);
    const attempted = Number(current?.attempted_count ?? 0) + item.attemptedDelta;
    const correct = Number(current?.correct_count ?? 0) + item.correctDelta;
    const incorrect = Number(current?.incorrect_count ?? 0) + item.incorrectDelta;
    const confidence = item.confidence ?? Math.min(100, Math.max(0, Math.round((correct / Math.max(1, attempted)) * 100)));
    const masteryState = item.masteryState ?? (confidence >= 90 && attempted >= 5 ? "mastered" : confidence >= 70 ? "confident" : attempted > 0 ? "practising" : "not_started");
    return {
      user_id: auth.userId,
      command_id: item.commandId,
      attempted_count: attempted,
      correct_count: correct,
      incorrect_count: incorrect,
      confidence,
      mastery_state: masteryState,
      status: masteryState === "mastered" ? "mastered" : masteryState === "not_started" ? "new" : "learning",
      proficiency: confidence,
      repetitions: attempted,
      last_practiced_at: now,
    };
  });

  const { error } = await db.from("addition_command_progress").upsert(rows, {
    onConflict: "user_id,command_id",
    ignoreDuplicates: false,
    defaultToNull: false,
  });
  if (error) return errorResponse(error.message, 500);
  return okResponse({ updated: rows.length });
}
