import { errorResponse, okResponse } from "@/lib/http";
import type { CourseCatalogDetail, CourseType } from "@/domain/catalog";
import { toCatalogDetail } from "@/server/catalog/normalize-course";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

type RouteContext = {
  params: Promise<{ courseId: string }>;
};

type CourseDetailRow = {
  id: string;
  title: string;
  type: CourseType;
  software: string;
  summary: string | null;
  image: string | null;
  content: string | null;
  commands: unknown;
  combos: unknown;
  resources: unknown;
  modules: unknown;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { courseId } = await context.params;
    const normalizedCourseId = decodeURIComponent(courseId || "").trim();
    if (!normalizedCourseId) return errorResponse("Course ID is required.", 400);

    const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from("addition_courses")
      .select("id,title,type,software,summary,image,content,commands,combos,resources,modules")
      .eq("id", normalizedCourseId)
      .eq("draft", false)
      .eq("status", "Published")
      .maybeSingle();

    if (error) return errorResponse(`Failed loading course detail: ${error.message}`, 500);
    if (!data) return errorResponse("Course not found.", 404);

    const course: CourseCatalogDetail = toCatalogDetail(data as CourseDetailRow);
    return okResponse({ course });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return errorResponse(message, 500);
  }
}
