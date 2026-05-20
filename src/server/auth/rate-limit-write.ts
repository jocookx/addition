import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/http";
import { consumeRateLimit } from "@/server/rate-limit";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

type RateLimitResult =
  | { ok: true; headers: HeadersInit }
  | { ok: false; response: NextResponse };

type Scope = "progress_patch" | "lesson_start" | "lesson_complete" | "command_practice";

const SCOPE_LIMITS: Record<Scope, { max: number; windowMs: number }> = {
  progress_patch:   { max: 60,  windowMs: 60_000 },
  lesson_start:     { max: 60,  windowMs: 60_000 },
  lesson_complete:  { max: 60,  windowMs: 60_000 },
  command_practice: { max: 120, windowMs: 60_000 },
};

export async function enforceLearningWriteRateLimit(
  userId: string,
  scope: Scope,
): Promise<RateLimitResult> {
  const limit = SCOPE_LIMITS[scope];
  const key   = `learning:${scope}:${userId}`;
  const db    = createSupabaseServiceClient();
  const result = await consumeRateLimit(db, { key, max: limit.max, windowMs: limit.windowMs });

  if (!result.ok) {
    const response = errorResponse("Rate limit exceeded. Slow down and try again.", 429, {
      scope,
      retryAfterSeconds: result.retryAfterSeconds,
    });
    response.headers.set("Retry-After", String(result.retryAfterSeconds));
    response.headers.set("X-RateLimit-Limit", String(limit.max));
    response.headers.set("X-RateLimit-Remaining", "0");
    response.headers.set("X-RateLimit-Reset", String(result.resetAt));
    return { ok: false, response };
  }

  return {
    ok: true,
    headers: {
      "X-RateLimit-Limit":     String(limit.max),
      "X-RateLimit-Remaining": String(result.remaining),
      "X-RateLimit-Reset":     String(result.resetAt),
    },
  };
}
