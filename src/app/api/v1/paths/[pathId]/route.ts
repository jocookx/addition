import { okResponse, errorResponse } from "@/lib/http";
import { createSupabaseServiceClient } from "@/server/supabase/clients";
import type { LearningPathDetail } from "@/domain/learning-path";
import { toCatalogListItem } from "@/server/catalog/normalize-course";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pathId: string }> },
) {
  const { pathId } = await params;
  try {
    const db = createSupabaseServiceClient();

    const { data: path, error: pathErr } = await db
      .from("addition_learning_paths")
      .select("id, title, slug, description, outcome, level, audience, software, image, course_ids, sort_order")
      .eq("id", pathId)
      .eq("published", true)
      .single();

    if (pathErr || !path) return errorResponse("Path not found", 404);

    const courseIds: string[] = path.course_ids ?? [];

    const courses = courseIds.length
      ? await (async () => {
          const { data } = await db
            .from("addition_courses")
            .select("id,title,type,software,modules")
            .in("id", courseIds)
            .eq("draft", false)
            .eq("status", "Published");
          const rows = data ?? [];
          // preserve order defined in course_ids
          return courseIds
            .map((id) => rows.find((r) => r.id === id))
            .filter(Boolean)
            .map((r) => {
              const item = toCatalogListItem(r as Parameters<typeof toCatalogListItem>[0]);
              return {
                id:               item.id,
                title:            item.title,
                type:             item.type,
                software:         item.software,
                lessonCount:      item.lessonCount,
                estimatedMinutes: item.lessonCount * 8, // ~8 min per lesson default
              };
            });
        })()
      : [];

    if (courses.length === 0) {
      return errorResponse("Path not found", 404);
    }

    const detail: LearningPathDetail = {
      id:          path.id,
      title:       path.title,
      slug:        path.slug,
      description: path.description,
      outcome:     path.outcome,
      level:       path.level,
      audience:    path.audience,
      software:    path.software ?? [],
      image:       path.image ?? "",
      courseCount: courses.length,
      sortOrder:   path.sort_order,
      courses,
    };

    return okResponse({ path: detail });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error", 500);
  }
}
