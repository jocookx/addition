import type { CourseCatalogDetail, CourseCatalogListItem } from "@/domain/catalog";
import { fetchJson } from "@/lib/api/fetch-json";

export async function getCourseCatalog(): Promise<CourseCatalogListItem[]> {
  const payload = await fetchJson<{ courses?: CourseCatalogListItem[] }>("/api/v1/catalog/courses", {
    method: "GET",
    retries: 2,
    timeoutMs: 10_000,
  });
  return payload.courses || [];
}

export async function getCourseDetail(courseId: string): Promise<CourseCatalogDetail> {
  const payload = await fetchJson<{ course: CourseCatalogDetail }>(
    `/api/v1/catalog/courses/${encodeURIComponent(courseId)}`,
    {
      method: "GET",
      retries: 1,
      timeoutMs: 10_000,
    },
  );
  return payload.course;
}
