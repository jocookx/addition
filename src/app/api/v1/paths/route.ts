import { okResponse, errorResponse } from "@/lib/http";
import { createSupabaseServiceClient } from "@/server/supabase/clients";
import type { LearningPathListItem } from "@/domain/learning-path";

export async function GET() {
  try {
    const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from("addition_learning_paths")
      .select("id, title, slug, description, outcome, level, audience, software, image, course_ids, sort_order")
      .eq("published", true)
      .order("sort_order", { ascending: true });

    if (error) return errorResponse(error.message, 500);

    const rawPaths = data ?? [];
    const allCourseIds = Array.from(new Set(rawPaths.flatMap((r) => r.course_ids ?? [])));
    const publishedCourseIds = new Set<string>();

    if (allCourseIds.length > 0) {
      const { data: courses, error: courseError } = await db
        .from("addition_courses")
        .select("id")
        .in("id", allCourseIds)
        .eq("draft", false)
        .eq("status", "Published");

      if (courseError) return errorResponse(courseError.message, 500);
      for (const course of courses ?? []) publishedCourseIds.add(course.id);
    }

    const paths: LearningPathListItem[] = rawPaths
      .map((r) => ({
      id:          r.id,
      title:       r.title,
      slug:        r.slug,
      description: r.description,
      outcome:     r.outcome,
      level:       r.level,
      audience:    r.audience,
      software:    r.software ?? [],
      image:       r.image ?? "",
      courseCount: (r.course_ids ?? []).filter((id: string) => publishedCourseIds.has(id)).length,
      sortOrder:   r.sort_order,
    }))
      .filter((path) => path.courseCount > 0);

    return okResponse({ paths });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error", 500);
  }
}
