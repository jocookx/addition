import type { SupabaseClient } from "@supabase/supabase-js";
import type { LearningSummary } from "@/domain/learning-summary";
import type { CourseType } from "@/domain/catalog";
import { normalizeCourseModules } from "@/server/catalog/normalize-course";
import { getCourseProgressOverview } from "@/server/learning/get-course-progress-overview";
import { SupabaseLearningProgressRepository } from "@/server/repositories/supabase-learning-progress-repository";
import { LearningProgressService } from "@/server/services/learning-progress-service";

type CourseRow = {
  id: string;
  title: string;
  type: CourseType;
  software: string;
  modules: unknown;
};

type LearningEventRow = {
  id: number;
  event_type: string;
  created_at: string;
  payload: Record<string, unknown> | null;
};

function buildService(db: SupabaseClient) {
  const repository = new SupabaseLearningProgressRepository(db);
  return new LearningProgressService(repository);
}

function isoDay(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildPastDays(days: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset));
    out.push(isoDay(d));
  }
  return out;
}

function computeStreak(isoDaysWithActivity: Set<string>): number {
  let streak = 0;
  const now = new Date();
  for (let offset = 0; offset < 365; offset += 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset));
    const key = isoDay(d);
    if (!isoDaysWithActivity.has(key)) break;
    streak += 1;
  }
  return streak;
}

export async function getLearningSummary(db: SupabaseClient, userId: string): Promise<LearningSummary> {
  const service = buildService(db);
  const snapshot = await service.getSnapshot(userId);

  const courseIds = Array.from(new Set(snapshot.enrollments.map((enrollment) => enrollment.courseId)));
  const { data: courseRows, error: courseError } = courseIds.length
    ? await db.from("addition_courses").select("id,title,type,software,modules").in("id", courseIds)
    : { data: [], error: null };
  if (courseError) throw new Error(`Failed loading courses for summary: ${courseError.message}`);

  const courseMap = new Map<string, CourseRow>();
  for (const row of (courseRows || []) as CourseRow[]) courseMap.set(row.id, row);

  const lessonsByCourse = new Map<string, Set<string>>();
  for (const lesson of snapshot.lessons) {
    const bucket = lessonsByCourse.get(lesson.courseId) || new Set<string>();
    if (lesson.status === "completed") bucket.add(lesson.lessonId);
    lessonsByCourse.set(lesson.courseId, bucket);
  }

  const courses = snapshot.enrollments
    .map((enrollment) => {
      const row = courseMap.get(enrollment.courseId);
      const modules = row ? normalizeCourseModules(row.modules) : [];
      const totalLessons = modules.reduce((sum, moduleItem) => sum + moduleItem.lessons.length, 0);
      const completedLessons = lessonsByCourse.get(enrollment.courseId)?.size || 0;
      const percentComplete = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
      return {
        courseId: enrollment.courseId,
        title: row?.title || enrollment.courseId,
        software: row?.software || "Unknown",
        status: enrollment.status,
        percentComplete,
        completedLessons,
        totalLessons,
      };
    })
    .sort((a, b) => {
      if (a.status !== b.status) {
        const order = { active: 0, completed: 1, archived: 2, dropped: 3 } as const;
        return order[a.status] - order[b.status];
      }
      return a.title.localeCompare(b.title);
    });

  const { data: recentEventRows, error: eventError } = await db
    .from("addition_learning_events")
    .select("id,event_type,created_at,payload")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (eventError) throw new Error(`Failed loading recent events: ${eventError.message}`);

  const recentEvents = ((recentEventRows || []) as LearningEventRow[]).map((row) => ({
    id: row.id,
    type: row.event_type,
    createdAt: row.created_at,
    payload: row.payload || {},
  }));

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);

  const { data: activityRows, error: activityError } = await db
    .from("addition_learning_events")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  if (activityError) throw new Error(`Failed loading learning activity: ${activityError.message}`);

  const byDay = new Map<string, number>();
  const daysWithActivity = new Set<string>();
  for (const row of (activityRows || []) as Array<{ created_at: string }>) {
    const ts = Date.parse(row.created_at);
    if (!Number.isFinite(ts)) continue;
    const day = isoDay(new Date(ts));
    byDay.set(day, (byDay.get(day) || 0) + 1);
    daysWithActivity.add(day);
  }

  const activityDays = buildPastDays(7).map((day) => ({
    day,
    count: byDay.get(day) || 0,
  }));
  const eventsLast7Days = activityDays.reduce((sum, item) => sum + item.count, 0);
  const streakDays = computeStreak(daysWithActivity);

  const practicedCommands = snapshot.commands.filter((command) => command.repetitions > 0).length;
  const masteredCommands = snapshot.commands.filter((command) => command.status === "mastered").length;
  const completedLessons = snapshot.lessons.filter((lesson) => lesson.status === "completed").length;

  // Use only the first active enrollment — the loop previously always broke
  // on the first hit, so this is equivalent without the N+1 overhead.
  const firstActiveCourseId = snapshot.enrollments.find((item) => item.status === "active")?.courseId;
  let nextUp: LearningSummary["nextUp"] = null;
  if (firstActiveCourseId) {
    const overview = await getCourseProgressOverview(db, userId, firstActiveCourseId);
    if (overview) {
      nextUp = {
        courseId: overview.courseId,
        title: overview.title,
        software: overview.software,
        percentComplete: overview.percentComplete,
        nextLessonId: overview.nextLessonId,
      };
    }
  }

  return {
    userId,
    generatedAt: new Date().toISOString(),
    totals: {
      activeCourses: snapshot.enrollments.filter((item) => item.status === "active").length,
      completedCourses: snapshot.enrollments.filter((item) => item.status === "completed").length,
      completedLessons,
      masteredCommands,
      practicedCommands,
      eventsLast7Days,
      streakDays,
    },
    activity: {
      days: activityDays,
    },
    nextUp,
    recentEvents,
    courses,
  };
}
