import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

export type AdminLearner = {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  level: string;
  createdAt: string;
  enrollments: number;
  completedLessons: number;
  lastSeen: string | null;
};

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const page  = Math.max(1, Number(searchParams.get("page")  || "1"));
  const limit = Math.min(200, Math.max(10, Number(searchParams.get("limit") || "50")));
  const q     = (searchParams.get("q") || "").trim().toLowerCase();
  const offset = (page - 1) * limit;

  try {
    const db = createSupabaseServiceClient();

    // Users
    let usersQ = db
      .from("addition_users")
      .select("id, email, name, plan, level, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (q) {
      // Escape SQL LIKE wildcards in user input to prevent unintended pattern matching
      const qEscaped = q.replace(/[%_\\]/g, "\\$&");
      usersQ = usersQ.or(`email.ilike.%${qEscaped}%,name.ilike.%${qEscaped}%`);
    }

    const { data: users, error: usersErr, count } = await usersQ;
    if (usersErr) return errorResponse(`DB users: ${usersErr.message}`, 500);

    const userIds = (users ?? []).map((u) => u.id);

    // Enrollments per user
    const { data: enrollments, error: enrollErr } = await db
      .from("addition_enrollments")
      .select("user_id")
      .in("user_id", userIds);
    if (enrollErr) return errorResponse(`DB enrollments: ${enrollErr.message}`, 500);

    const enrollCount = new Map<string, number>();
    for (const e of enrollments ?? []) {
      enrollCount.set(e.user_id, (enrollCount.get(e.user_id) ?? 0) + 1);
    }

    // Completed lessons per user
    const { data: lessonProgress, error: lpErr } = await db
      .from("addition_lesson_progress")
      .select("user_id, status")
      .in("user_id", userIds)
      .eq("status", "completed");
    if (lpErr) return errorResponse(`DB lesson_progress: ${lpErr.message}`, 500);

    const completedCount = new Map<string, number>();
    for (const lp of lessonProgress ?? []) {
      completedCount.set(lp.user_id, (completedCount.get(lp.user_id) ?? 0) + 1);
    }

    // Last seen per user (max last_seen_at from lesson_progress)
    const { data: lastSeenRows, error: lsErr } = await db
      .from("addition_lesson_progress")
      .select("user_id, last_seen_at")
      .in("user_id", userIds)
      .order("last_seen_at", { ascending: false });
    if (lsErr) return errorResponse(`DB last_seen: ${lsErr.message}`, 500);

    const lastSeen = new Map<string, string>();
    for (const row of lastSeenRows ?? []) {
      if (!lastSeen.has(row.user_id)) lastSeen.set(row.user_id, row.last_seen_at);
    }

    const learners: AdminLearner[] = (users ?? []).map((u) => ({
      id:               u.id,
      email:            u.email ?? "",
      name:             u.name ?? null,
      plan:             u.plan ?? "free",
      level:            u.level ?? "improver",
      createdAt:        u.created_at,
      enrollments:      enrollCount.get(u.id) ?? 0,
      completedLessons: completedCount.get(u.id) ?? 0,
      lastSeen:         lastSeen.get(u.id) ?? null,
    }));

    return okResponse({ learners, total: count ?? 0, page, limit });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error", 500);
  }
}
