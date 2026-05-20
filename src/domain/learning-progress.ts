import { z } from "zod";

export const EnrollmentStatusSchema = z.enum(["active", "completed", "archived", "dropped"]);
export const LessonProgressStatusSchema = z.enum(["not_started", "in_progress", "completed"]);
export const CommandProgressStatusSchema = z.enum(["new", "learning", "mastered"]);

export const EnrollmentPatchSchema = z
  .object({
    courseId: z.string().min(1).max(160),
    status: EnrollmentStatusSchema.default("active"),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const LessonProgressPatchSchema = z
  .object({
    courseId: z.string().min(1).max(160),
    lessonId: z.string().min(1).max(160),
    status: LessonProgressStatusSchema.optional(),
    elapsedSeconds: z.number().int().nonnegative().max(10_000_000).optional(),
    lastSeenAt: z.string().datetime().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const CommandProgressPatchSchema = z
  .object({
    commandId: z.string().uuid(),
    status: CommandProgressStatusSchema.optional(),
    proficiency: z.number().int().min(0).max(100).optional(),
    repetitions: z.number().int().nonnegative().max(1_000_000).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const LearningProgressPatchSchema = z
  .object({
    enrollments: z.array(EnrollmentPatchSchema).max(200).optional(),
    lessons: z.array(LessonProgressPatchSchema).max(2_000).optional(),
    commands: z.array(CommandProgressPatchSchema).max(2_000).optional(),
    event: z
      .object({
        type: z.string().min(1).max(120),
        payload: z.record(z.string(), z.unknown()).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type EnrollmentPatch = z.infer<typeof EnrollmentPatchSchema>;
export type LessonProgressPatch = z.infer<typeof LessonProgressPatchSchema>;
export type CommandProgressPatch = z.infer<typeof CommandProgressPatchSchema>;
export type LearningProgressPatch = z.infer<typeof LearningProgressPatchSchema>;

export type EnrollmentRecord = {
  courseId: string;
  status: z.infer<typeof EnrollmentStatusSchema>;
  enrolledAt: string;
  completedAt: string | null;
  metadata: Record<string, unknown>;
};

export type LessonProgressRecord = {
  courseId: string;
  lessonId: string;
  status: z.infer<typeof LessonProgressStatusSchema>;
  elapsedSeconds: number;
  firstStartedAt: string | null;
  completedAt: string | null;
  lastSeenAt: string;
  metadata: Record<string, unknown>;
};

export type CommandProgressRecord = {
  commandId: string;
  status: z.infer<typeof CommandProgressStatusSchema>;
  proficiency: number;
  repetitions: number;
  lastPracticedAt: string;
  metadata: Record<string, unknown>;
};

export type LearningProgressSnapshot = {
  userId: string;
  generatedAt: string;
  enrollments: EnrollmentRecord[];
  lessons: LessonProgressRecord[];
  commands: CommandProgressRecord[];
};

