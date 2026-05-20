/**
 * Supabase-backed rate limiter.
 *
 * Persists buckets in `addition_rate_limits` so limits survive serverless
 * cold starts and are shared across all function instances.
 *
 * Table DDL (run once in Supabase SQL editor):
 *
 *   create table if not exists addition_rate_limits (
 *     key       text primary key,
 *     count     int  not null default 0,
 *     reset_at  timestamptz not null
 *   );
 *
 * Note: the upsert is not perfectly atomic — a very small race window exists
 * between read and write, but it is acceptable for this use-case (learning
 * activity limits at 60-120 req/min). For adversarial rate-limit bypass
 * protection, use an RPC with FOR UPDATE instead.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type RateLimitResult =
  | { ok: true;  remaining: number; resetAt: number }
  | { ok: false; retryAfterSeconds: number; resetAt: number };

type RateLimitOptions = {
  key: string;
  max: number;
  windowMs: number;
};

export async function consumeRateLimit(
  db: SupabaseClient,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const now = Date.now();

  // Fetch existing bucket
  const { data: existing } = await db
    .from("addition_rate_limits")
    .select("count, reset_at")
    .eq("key", options.key)
    .maybeSingle();

  const resetAt = existing?.reset_at ? new Date(existing.reset_at).getTime() : 0;
  const windowExpired = resetAt <= now;

  if (!existing || windowExpired) {
    // Start a fresh window
    const newResetAt = new Date(now + options.windowMs).toISOString();
    await db.from("addition_rate_limits").upsert(
      { key: options.key, count: 1, reset_at: newResetAt },
      { onConflict: "key" },
    );
    return { ok: true, remaining: Math.max(0, options.max - 1), resetAt: now + options.windowMs };
  }

  if (existing.count >= options.max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));
    return { ok: false, retryAfterSeconds, resetAt };
  }

  // Increment within current window
  await db
    .from("addition_rate_limits")
    .update({ count: existing.count + 1 })
    .eq("key", options.key);

  return {
    ok: true,
    remaining: Math.max(0, options.max - existing.count - 1),
    resetAt,
  };
}
