import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CommandProgressPatch,
  CommandProgressRecord,
  EnrollmentPatch,
  EnrollmentRecord,
  LessonProgressPatch,
  LessonProgressRecord,
  LearningProgressSnapshot,
} from "@/domain/learning-progress";
import type { LearningProgressRepository } from "@/server/repositories/learning-progress-repository";

type EnrollmentRow = {
  course_id: string;
  status: string;
  enrolled_at: string;
  completed_at: string | null;
  metadata: Record<string, unknown> | null;
};

type LessonRow = {
  course_id: string;
  lesson_id: string;
  status: string;
  elapsed_seconds: number;
  first_started_at: string | null;
  completed_at: string | null;
  last_seen_at: string;
  metadata: Record<string, unknown> | null;
};

type CommandRow = {
  command_id: string;
  status: string;
  proficiency: number;
  repetitions: number;
  last_practiced_at: string;
  metadata: Record<string, unknown> | null;
};

function ensureWriteSucceeded(error: { message: string } | null, scope: string): void {
  if (!error) return;
  throw new Error(`Failed ${scope}: ${error.message}`);
}

export class SupabaseLearningProgressRepository implements LearningProgressRepository {
  constructor(private readonly db: SupabaseClient) {}

  async getSnapshot(userId: string, courseId?: string): Promise<LearningProgressSnapshot> {
    const enrollmentsQuery = this.db
      .from("addition_enrollments")
      .select("course_id, status, enrolled_at, completed_at, metadata")
      .eq("user_id", userId)
      .order("enrolled_at", { ascending: false });

    const lessonsQuery = this.db
      .from("addition_lesson_progress")
      .select("course_id, lesson_id, status, elapsed_seconds, first_started_at, completed_at, last_seen_at, metadata")
      .eq("user_id", userId)
      .order("last_seen_at", { ascending: false });

    const commandsQuery = this.db
      .from("addition_command_progress")
      .select("command_id, status, proficiency, repetitions, last_practiced_at, metadata")
      .eq("user_id", userId)
      .order("last_practiced_at", { ascending: false })
      .limit(1000);

    if (courseId) {
      enrollmentsQuery.eq("course_id", courseId);
      lessonsQuery.eq("course_id", courseId);
    }

    const [{ data: enrollments, error: enrollmentsError }, { data: lessons, error: lessonsError }, { data: commands, error: commandsError }] =
      await Promise.all([enrollmentsQuery, lessonsQuery, commandsQuery]);

    ensureWriteSucceeded(enrollmentsError, "loading enrollments");
    ensureWriteSucceeded(lessonsError, "loading lesson progress");
    ensureWriteSucceeded(commandsError, "loading command progress");

    return {
      userId,
      generatedAt: new Date().toISOString(),
      enrollments: (enrollments || []).map(mapEnrollment),
      lessons: (lessons || []).map(mapLesson),
      commands: (commands || []).map(mapCommand),
    };
  }

  async upsertEnrollments(userId: string, updates: EnrollmentPatch[]): Promise<void> {
    if (!updates.length) return;
    const nowIso = new Date().toISOString();
    const rows = updates.map((update) => ({
      user_id: userId,
      course_id: update.courseId,
      status: update.status,
      completed_at: update.status === "completed" ? nowIso : null,
      ...(update.metadata ? { metadata: update.metadata } : {}),
    }));

    const { error } = await this.db.from("addition_enrollments").upsert(rows, {
      onConflict: "user_id,course_id",
      ignoreDuplicates: false,
      defaultToNull: false,
    });
    ensureWriteSucceeded(error, "upserting enrollments");
  }

  async upsertLessonProgress(userId: string, updates: LessonProgressPatch[]): Promise<void> {
    if (!updates.length) return;
    const nowIso = new Date().toISOString();
    const rows = updates.map((update) => {
      const row: Record<string, unknown> = {
        user_id: userId,
        course_id: update.courseId,
        lesson_id: update.lessonId,
        last_seen_at: update.lastSeenAt || nowIso,
      };

      if (update.status) {
        row.status = update.status;
        if (update.status === "in_progress") row.first_started_at = nowIso;
        if (update.status === "completed") row.completed_at = nowIso;
      }
      if (typeof update.elapsedSeconds === "number") row.elapsed_seconds = update.elapsedSeconds;
      if (update.metadata) row.metadata = update.metadata;

      return row;
    });

    const { error } = await this.db.from("addition_lesson_progress").upsert(rows, {
      onConflict: "user_id,course_id,lesson_id",
      ignoreDuplicates: false,
      defaultToNull: false,
    });
    ensureWriteSucceeded(error, "upserting lesson progress");
  }

  async upsertCommandProgress(userId: string, updates: CommandProgressPatch[]): Promise<void> {
    if (!updates.length) return;
    const nowIso = new Date().toISOString();
    const rows = updates.map((update) => {
      const row: Record<string, unknown> = {
        user_id: userId,
        command_id: update.commandId,
        last_practiced_at: nowIso,
      };

      if (update.status) row.status = update.status;
      if (typeof update.proficiency === "number") row.proficiency = update.proficiency;
      if (typeof update.repetitions === "number") row.repetitions = update.repetitions;
      if (update.metadata) row.metadata = update.metadata;

      return row;
    });

    const { error } = await this.db.from("addition_command_progress").upsert(rows, {
      onConflict: "user_id,command_id",
      ignoreDuplicates: false,
      defaultToNull: false,
    });
    ensureWriteSucceeded(error, "upserting command progress");
  }

  async appendEvent(userId: string, eventType: string, payload: Record<string, unknown>): Promise<void> {
    const { error } = await this.db.from("addition_learning_events").insert({
      user_id: userId,
      event_type: eventType,
      payload,
    });
    ensureWriteSucceeded(error, "writing learning event");
  }
}

function mapEnrollment(row: EnrollmentRow): EnrollmentRecord {
  return {
    courseId: row.course_id,
    status: row.status as EnrollmentRecord["status"],
    enrolledAt: row.enrolled_at,
    completedAt: row.completed_at,
    metadata: row.metadata || {},
  };
}

function mapLesson(row: LessonRow): LessonProgressRecord {
  return {
    courseId: row.course_id,
    lessonId: row.lesson_id,
    status: row.status as LessonProgressRecord["status"],
    elapsedSeconds: row.elapsed_seconds || 0,
    firstStartedAt: row.first_started_at,
    completedAt: row.completed_at,
    lastSeenAt: row.last_seen_at,
    metadata: row.metadata || {},
  };
}

function mapCommand(row: CommandRow): CommandProgressRecord {
  return {
    commandId: row.command_id,
    status: row.status as CommandProgressRecord["status"],
    proficiency: row.proficiency || 0,
    repetitions: row.repetitions || 0,
    lastPracticedAt: row.last_practiced_at,
    metadata: row.metadata || {},
  };
}

