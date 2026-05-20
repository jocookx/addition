import type { SupabaseClient } from "@supabase/supabase-js";
import type { CourseType } from "@/domain/catalog";
import type { CourseProgressOverview, LessonProgressStatus } from "@/domain/course-progress";
import type { LessonProgressRecord } from "@/domain/learning-progress";
import { normalizeCourseModules } from "@/server/catalog/normalize-course";
import { SupabaseLearningProgressRepository } from "@/server/repositories/supabase-learning-progress-repository";
import { LearningProgressService } from "@/server/services/learning-progress-service";

type CourseRow = {
  id: string;
  title: string;
  type: CourseType;
  software: string;
  modules: unknown;
};

function normalizeLessonStatus(value: LessonProgressRecord | undefined): LessonProgressStatus {
  if (!value) return "not_started";
  return value.status;
}

function buildService(db: SupabaseClient) {
  const repository = new SupabaseLearningProgressRepository(db);
  return new LearningProgressService(repository);
}

export async function getCourseProgressOverview(
  db: SupabaseClient,
  userId: string,
  courseId: string,
): Promise<CourseProgressOverview | null> {
  const { data: courseRow, error: courseError } = await db
    .from("addition_courses")
    .select("id,title,type,software,modules")
    .eq("id", courseId)
    .maybeSingle();

  if (courseError) {
    throw new Error(`Failed loading course: ${courseError.message}`);
  }
  if (!courseRow) return null;

  const course = courseRow as CourseRow;
  const modules = normalizeCourseModules(course.modules);
  const service = buildService(db);
  const snapshot = await service.getSnapshot(userId, courseId);

  const lessonById = new Map<string, LessonProgressRecord>();
  for (const lesson of snapshot.lessons) lessonById.set(lesson.lessonId, lesson);

  let totalLessons = 0;
  let completedLessons = 0;
  let inProgressLessons = 0;
  let estimatedMinutes = 0;
  let nextLessonId: string | null = null;

  const progressModules = modules.map((moduleItem) => ({
    id: moduleItem.id,
    title: moduleItem.title,
    lessons: moduleItem.lessons.map((lesson) => {
      totalLessons += 1;
      if (lesson.durationMin) estimatedMinutes += lesson.durationMin;

      const progress = lessonById.get(lesson.id);
      const status = normalizeLessonStatus(progress);
      const elapsedSeconds = progress?.elapsedSeconds || 0;

      if (status === "completed") completedLessons += 1;
      if (status === "in_progress") inProgressLessons += 1;
      if (!nextLessonId && status !== "completed") nextLessonId = lesson.id;

      return {
        id: lesson.id,
        title: lesson.title,
        durationMin: lesson.durationMin,
        status,
        elapsedSeconds,
      };
    }),
  }));

  const percentComplete = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const enrollment = snapshot.enrollments.find((item) => item.courseId === courseId) || null;

  return {
    courseId: course.id,
    title: course.title,
    type: course.type,
    software: course.software,
    enrollment,
    totalLessons,
    completedLessons,
    inProgressLessons,
    percentComplete,
    estimatedMinutes,
    nextLessonId,
    modules: progressModules,
  };
}
