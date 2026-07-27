import type {
  CourseCatalogDetail,
  CourseCatalogListItem,
  CourseModule,
  CourseResource,
  CourseType,
} from "@/domain/catalog";

type CourseListRow = {
  id: string;
  title: string;
  type: CourseType;
  software: string;
  modules: unknown;
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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function extractCloudflareVideoId(value: string): string {
  if (!value) return "";
  const patterns = [
    /iframe\.cloudflarestream\.com\/([^/?#]+)/i,
    /videodelivery\.net\/([^/?#]+)/i,
    /cloudflarestream\.com\/([^/?#]+)\/(?:iframe|manifest|watch)/i,
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1] && !match[1].includes(".")) return match[1];
  }
  return "";
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanString(item))
    .filter((item, index, arr) => item.length > 0 && arr.indexOf(item) === index);
}

function normalizeResources(value: unknown): CourseResource[] {
  if (!Array.isArray(value)) return [];
  const resources: CourseResource[] = [];
  for (const item of value) {
    const record = asRecord(item);
    if (!record) continue;
    const name = cleanString(record.name);
    const url = cleanString(record.url);
    if (!name || !url) continue;
    resources.push({ name, url });
  }
  return resources;
}

function toDurationMinutes(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

export function normalizeCourseModules(rawModules: unknown): CourseModule[] {
  if (!Array.isArray(rawModules)) return [];

  const modules: CourseModule[] = [];
  for (let moduleIndex = 0; moduleIndex < rawModules.length; moduleIndex += 1) {
    const rawModule = asRecord(rawModules[moduleIndex]);
    if (!rawModule) continue;

    const moduleId = cleanString(rawModule.id) || `module-${moduleIndex + 1}`;
    const moduleTitle = cleanString(rawModule.title) || `Module ${moduleIndex + 1}`;
    const rawLessons = Array.isArray(rawModule.lessons) ? rawModule.lessons : [];

    const lessons = rawLessons
      .map((lessonItem, lessonIndex) => {
        const lesson = asRecord(lessonItem);
        if (!lesson) return null;
        const lessonId = cleanString(lesson.id) || `lesson-${moduleIndex + 1}-${lessonIndex + 1}`;
        const rawVideo = cleanString(lesson.video);
        const cloudflareVideoId =
          cleanString(lesson.videoId) ||
          cleanString(lesson.video_id) ||
          extractCloudflareVideoId(rawVideo);

        return {
          id: lessonId,
          title: cleanString(lesson.title) || `Lesson ${lessonIndex + 1}`,
          video: cloudflareVideoId ? "" : rawVideo,
          videoId: cloudflareVideoId,
          accessLevel: cleanString(lesson.accessLevel) || cleanString(lesson.access_level),
          image: cleanString(lesson.image),
          content: cleanString(lesson.content),
          durationMin: toDurationMinutes(lesson.durationMin),
          resources: normalizeResources(lesson.resources),
        };
      })
      .filter((item): item is CourseModule["lessons"][number] => Boolean(item));

    modules.push({
      id: moduleId,
      title: moduleTitle,
      lessons,
    });
  }

  return modules;
}

export function getCourseCounts(modules: CourseModule[]): { moduleCount: number; lessonCount: number } {
  const moduleCount = modules.length;
  const lessonCount = modules.reduce((sum, moduleItem) => sum + moduleItem.lessons.length, 0);
  return { moduleCount, lessonCount };
}

export function getFirstLessonId(modules: CourseModule[]): string | null {
  for (const moduleItem of modules) {
    if (!moduleItem.lessons.length) continue;
    return moduleItem.lessons[0].id;
  }
  return null;
}

export function toCatalogListItem(row: CourseListRow): CourseCatalogListItem {
  const modules = normalizeCourseModules(row.modules);
  const counts = getCourseCounts(modules);
  const lessons = modules.flatMap((m, mi) =>
    m.lessons.map((l, li) => ({
      id: l.id,
      module: m.title,
      moduleIndex: mi,
      lessonIndex: li,
      title: l.title,
      content: l.content.slice(0, 400),
    })),
  );
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    software: row.software,
    firstLessonId: getFirstLessonId(modules),
    moduleCount: counts.moduleCount,
    lessonCount: counts.lessonCount,
    lessons,
  };
}

export function toCatalogDetail(row: CourseDetailRow): CourseCatalogDetail {
  const modules = normalizeCourseModules(row.modules);
  const counts = getCourseCounts(modules);
  const estimatedMinutes = modules.reduce(
    (total, moduleItem) =>
      total +
      moduleItem.lessons.reduce((moduleTotal, lesson) => moduleTotal + (lesson.durationMin || 0), 0),
    0,
  );

  return {
    id: row.id,
    title: row.title,
    type: row.type,
    software: row.software,
    summary: cleanString(row.summary),
    image: cleanString(row.image),
    content: cleanString(row.content),
    commands: toStringArray(row.commands),
    combos: toStringArray(row.combos),
    resources: normalizeResources(row.resources),
    modules,
    firstLessonId: getFirstLessonId(modules),
    moduleCount: counts.moduleCount,
    lessonCount: counts.lessonCount,
    estimatedMinutes,
  };
}
