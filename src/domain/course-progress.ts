import type { CourseType } from "@/domain/catalog";
import type { EnrollmentRecord, LessonProgressStatusSchema } from "@/domain/learning-progress";
import type { z } from "zod";

export type LessonProgressStatus = z.infer<typeof LessonProgressStatusSchema>;

export type CourseLessonProgressItem = {
  id: string;
  title: string;
  durationMin: number | null;
  status: LessonProgressStatus;
  elapsedSeconds: number;
};

export type CourseModuleProgressItem = {
  id: string;
  title: string;
  lessons: CourseLessonProgressItem[];
};

export type CourseProgressOverview = {
  courseId: string;
  title: string;
  type: CourseType;
  software: string;
  enrollment: EnrollmentRecord | null;
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  percentComplete: number;
  estimatedMinutes: number;
  nextLessonId: string | null;
  modules: CourseModuleProgressItem[];
};
