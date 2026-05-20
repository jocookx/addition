import {
  LearningProgressPatchSchema,
  type LearningProgressPatch,
  type LearningProgressSnapshot,
} from "@/domain/learning-progress";
import type { LearningProgressRepository } from "@/server/repositories/learning-progress-repository";

export class LearningProgressService {
  constructor(private readonly repo: LearningProgressRepository) {}

  async getSnapshot(userId: string, courseId?: string): Promise<LearningProgressSnapshot> {
    return this.repo.getSnapshot(userId, courseId);
  }

  async applyPatch(userId: string, payload: unknown): Promise<LearningProgressSnapshot> {
    const patch = LearningProgressPatchSchema.parse(payload);
    await this.persistPatch(userId, patch);
    return this.repo.getSnapshot(userId);
  }

  private async persistPatch(userId: string, patch: LearningProgressPatch): Promise<void> {
    const tasks: Promise<void>[] = [];
    if (patch.enrollments?.length) tasks.push(this.repo.upsertEnrollments(userId, patch.enrollments));
    if (patch.lessons?.length) tasks.push(this.repo.upsertLessonProgress(userId, patch.lessons));
    if (patch.commands?.length) tasks.push(this.repo.upsertCommandProgress(userId, patch.commands));
    await Promise.all(tasks);

    if (patch.event?.type) {
      await this.repo.appendEvent(userId, patch.event.type, patch.event.payload || {});
    }
  }
}

