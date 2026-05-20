import { cachedOkResponse, errorResponse } from "@/lib/http";

export const revalidate = 3600;
import type { CourseCatalogListItem, CourseType } from "@/domain/catalog";
import { createSupabaseServiceClient } from "@/server/supabase/clients";
import { toCatalogListItem } from "@/server/catalog/normalize-course";

type CourseRow = {
  id: string;
  title: string;
  type: CourseType;
  software: string;
  modules: unknown;
};

export async function GET() {
  try {
    const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from("addition_courses")
      .select("id,title,type,software,modules")
      .eq("draft", false)
      .eq("status", "Published")
      .order("title", { ascending: true })
      .limit(100);

    if (error) return errorResponse(`Failed loading course catalog: ${error.message}`, 500);

    const courses: CourseCatalogListItem[] = ((data || []) as CourseRow[]).map(toCatalogListItem);

    return cachedOkResponse({ courses }, 3600, 86400);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Unknown server error.", 500);
  }
}
