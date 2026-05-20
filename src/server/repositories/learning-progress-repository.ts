import type {
  CommandProgressPatch,
  EnrollmentPatch,
  LessonProgressPatch,
  LearningProgressSnapshot,
} from "@/domain/learning-progress";

export interface LearningProgressRepository {
  getSnapshot(userId: string, courseId?: string): Promise<LearningProgressSnapshot>;
  upsertEnrollments(userId: string, updates: EnrollmentPatch[]): Promise<void>;
  upsertLessonProgress(userId: string, updates: LessonProgressPatch[]): Promise<void>;
  upsertCommandProgress(userId: string, updates: CommandProgressPatch[]): Promise<void>;
  appendEvent(userId: string, eventType: string, payload: Record<string, unknown>): Promise<void>;
}

