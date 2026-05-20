import type { CourseCatalogDetail, CourseCatalogListItem } from "@/domain/catalog";
import { fetchJson } from "@/lib/api/fetch-json";

let catalogCache: Promise<CourseCatalogListItem[]> | null = null;

export async function getCourseCatalog(): Promise<CourseCatalogListItem[]> {
  if (catalogCache) return catalogCache;
  catalogCache = fetchJson<{ courses?: CourseCatalogListItem[] }>("/api/v1/catalog/courses", {
    method: "GET",
    retries: 2,
    timeoutMs: 10_000,
  })
    .then((payload) => payload.courses || [])
    .catch((err) => { catalogCache = null; throw err; });
  return catalogCache;
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
