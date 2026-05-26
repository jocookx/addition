import { promises as fs } from "node:fs";
import path from "node:path";
import { StudioCourseSchema, StudioPayloadSchema, type StudioCourse, type StudioPayload } from "@/domain/content-studio";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

type StoreShape = {
  users?: Record<string, unknown>;
  analytics?: Record<string, unknown>;
  content?: {
    software?: unknown[];
    core?: unknown[];
    courses?: unknown[];
    categories?: unknown[];
    [key: string]: unknown;
  };
};

type CourseRow = {
  id: string;
  type: string;
  title: string;
  software: string;
  summary: string | null;
  image: string | null;
  draft: boolean | null;
  category?: string | null;
  level?: string | null;
  project_domain?: string | null;
  path_kind?: string | null;
  access_level?: string | null;
  status?: string | null;
  course_promise?: string | null;
  learning_outcome?: string | null;
  modules: unknown;
  updated_at?: string | null;
};

type ModuleRow = {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
};

type LessonRow = {
  id: string;
  module_id: string;
  course_id: string;
  title: string;
  video_url: string;
  video_id: string | null;
  image: string;
  content: string;
  duration_min: number | null;
  sort_order: number;
  metadata: Record<string, unknown> | null;
};

// ── Dev-only file fallback ────────────────────────────────────────────────────

async function resolveStorePath(): Promise<string> {
  const candidates = [
    path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "backend-store.json"),
    path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "backend-store.json"),
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next location.
    }
  }

  throw new Error("Could not locate backend-store.json.");
}

// ── Normalisation helpers ─────────────────────────────────────────────────────

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asString(item).trim())
    .filter(Boolean)
    .filter((item, index, arr) => arr.indexOf(item) === index);
}

function normalizeItems(bucket: "core" | "courses", rows: unknown[]): StudioCourse[] {
  return rows
    .filter((row) => row && typeof row === "object")
    .map((row) => StudioCourseSchema.parse({ bucket, ...(row as Record<string, unknown>) }));
}

function sortItems(items: StudioCourse[]): StudioCourse[] {
  return items.slice().sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
}

function normalizeDbCourse(row: CourseRow): StudioCourse {
  return StudioCourseSchema.parse({
    bucket: row.type === "core" ? "core" : "courses",
    id: row.id,
    title: row.title,
    type: row.type === "combo" ? "course" : row.type,
    software: row.software,
    summary: row.summary ?? "",
    image: row.image ?? "",
    draft: row.draft ?? false,
    category: row.category ?? "",
    level: row.level || "",
    projectDomain: row.project_domain ?? "",
    pathKind: row.path_kind ?? "",
    accessLevel: row.access_level ?? "Free",
    status: row.status || (row.draft ? "Draft" : "Published"),
    coursePromise: row.course_promise ?? "",
    learningOutcome: row.learning_outcome ?? "",
    modules: Array.isArray(row.modules) ? row.modules : [],
    updatedAt: row.updated_at ?? "",
  });
}

function dbTypeForCourse(item: StudioCourse): "course" | "core" {
  return item.bucket === "core" ? "core" : "course";
}

function lessonRowToStudioLesson(les: LessonRow): Record<string, unknown> {
  return {
    id: les.id,
    title: les.title,
    video: les.video_url,
    videoId: les.video_id ?? "",
    image: les.image,
    content: les.content,
    durationMin: les.duration_min,
    // Spread extra fields (transcript, steps, practiceTask, etc.) from metadata
    ...(les.metadata && typeof les.metadata === "object" ? les.metadata : {}),
  };
}

// ── Relational DB read/write ──────────────────────────────────────────────────

/**
 * Returns true if the addition_modules table exists.
 * Used to gracefully fall back to JSONB until the migration has been run.
 */
async function relationalTablesExist(
  db: ReturnType<typeof createSupabaseServiceClient>,
): Promise<boolean> {
  const { error } = await db.from("addition_modules").select("id").limit(1);
  // Supabase returns a 42P01 PGRST code when the table doesn't exist
  return !error || !error.message.includes("does not exist");
}

async function readRelationalPayload(
  db: ReturnType<typeof createSupabaseServiceClient>,
  courseRows: CourseRow[],
): Promise<StudioPayload> {
  const courseIds = courseRows.map((c) => c.id);

  // Fetch all modules for these courses in one query
  const { data: moduleData, error: modErr } = await db
    .from("addition_modules")
    .select("id, course_id, title, sort_order")
    .in("course_id", courseIds)
    .order("sort_order", { ascending: true });

  if (modErr) throw new Error(`Failed loading modules: ${modErr.message}`);

  const modules = (moduleData ?? []) as ModuleRow[];
  const moduleIds = modules.map((m) => m.id);

  // Fetch all lessons in one query
  const { data: lessonData, error: lesErr } = await db
    .from("addition_lessons")
    .select("id, module_id, course_id, title, video_url, video_id, image, content, duration_min, sort_order, metadata")
    .in("module_id", moduleIds)
    .order("sort_order", { ascending: true });

  if (lesErr) throw new Error(`Failed loading lessons: ${lesErr.message}`);

  const lessons = (lessonData ?? []) as LessonRow[];

  // Build lookup maps
  const lessonsByModule = new Map<string, LessonRow[]>();
  for (const lesson of lessons) {
    const arr = lessonsByModule.get(lesson.module_id) ?? [];
    arr.push(lesson);
    lessonsByModule.set(lesson.module_id, arr);
  }

  const modulesByCourse = new Map<string, ModuleRow[]>();
  for (const mod of modules) {
    const arr = modulesByCourse.get(mod.course_id) ?? [];
    arr.push(mod);
    modulesByCourse.set(mod.course_id, arr);
  }

  // Assemble the StudioCourse hierarchy
  const items = sortItems(
    courseRows.map((course) => {
      const courseMods = modulesByCourse.get(course.id) ?? [];
      const studioModules = courseMods.map((mod) => ({
        id: mod.id,
        title: mod.title,
        lessons: (lessonsByModule.get(mod.id) ?? []).map(lessonRowToStudioLesson),
      }));
      return normalizeDbCourse({ ...course, modules: studioModules });
    }),
  );

  const softwareOptions = Array.from(new Set(items.map((i) => i.software).filter(Boolean))).sort();
  const categories = Array.from(
    new Set(items.map((i) => i.category).filter(Boolean) as string[]),
  ).sort();

  return StudioPayloadSchema.parse({ categories, softwareOptions, items });
}

async function writeRelationalPayload(
  db: ReturnType<typeof createSupabaseServiceClient>,
  payload: StudioPayload,
): Promise<void> {
  const courseIds = payload.items.map((i) => i.id);

  // ── Upsert modules ──────────────────────────────────────────────────────
  const allModuleIds: string[] = [];
  const moduleRows: object[] = [];
  const lessonRows: object[] = [];

  for (const course of payload.items) {
    for (let mIdx = 0; mIdx < course.modules.length; mIdx++) {
      const mod = course.modules[mIdx];
      if (!mod.id) continue;
      allModuleIds.push(mod.id);
      moduleRows.push({
        id: mod.id,
        course_id: course.id,
        title: mod.title || "Untitled module",
        sort_order: mIdx,
        updated_at: new Date().toISOString(),
      });

      for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
        const les = mod.lessons[lIdx];
        if (!les.id) continue;

        // Separate core fields from extra metadata
        const { id, title, video, image, content, durationMin, resources, ...extra } = les;
        const videoIdVal = (extra as Record<string, unknown>).videoId ?? "";
        const restMeta = { ...extra };
        delete (restMeta as Record<string, unknown>).videoId;

        lessonRows.push({
          id,
          module_id: mod.id,
          course_id: course.id,
          title: title || "Untitled lesson",
          video_url: video ?? "",
          video_id: (videoIdVal as string) || null,
          image: image ?? "",
          content: content ?? "",
          duration_min: durationMin ?? null,
          sort_order: lIdx,
          metadata: Object.keys(restMeta).length > 0 ? restMeta : {},
          updated_at: new Date().toISOString(),
        });
      }
    }
  }

  if (moduleRows.length > 0) {
    const { error } = await db.from("addition_modules").upsert(moduleRows, { onConflict: "id" });
    if (error) throw new Error(`Failed saving modules: ${error.message}`);
  }

  if (lessonRows.length > 0) {
    const { error } = await db.from("addition_lessons").upsert(lessonRows, { onConflict: "id" });
    if (error) throw new Error(`Failed saving lessons: ${error.message}`);
  }

  // ── Delete orphaned modules (and their lessons via cascade) ─────────────
  if (courseIds.length > 0) {
    const { data: existingMods } = await db
      .from("addition_modules")
      .select("id")
      .in("course_id", courseIds);

    const existingModIds = new Set((existingMods ?? []).map((m: { id: string }) => m.id));
    const keepModIds = new Set(allModuleIds);
    const deleteModIds = [...existingModIds].filter((id) => !keepModIds.has(id));

    if (deleteModIds.length > 0) {
      await db.from("addition_modules").delete().in("id", deleteModIds);
      // Lessons cascade-delete due to FK constraint
    }
  }

  // ── Delete orphaned lessons (within surviving modules) ──────────────────
  if (allModuleIds.length > 0) {
    const { data: existingLessons } = await db
      .from("addition_lessons")
      .select("id")
      .in("module_id", allModuleIds);

    const existingLessonIds = new Set((existingLessons ?? []).map((l: { id: string }) => l.id));
    const keepLessonIds = new Set(lessonRows.map((r) => (r as { id: string }).id));
    const deleteLessonIds = [...existingLessonIds].filter((id) => !keepLessonIds.has(id));

    if (deleteLessonIds.length > 0) {
      await db.from("addition_lessons").delete().in("id", deleteLessonIds);
    }
  }
}

// ── Supabase read/write (primary) ─────────────────────────────────────────────

async function readSupabaseStudioPayload(): Promise<StudioPayload> {
  const db = createSupabaseServiceClient();

  const { data, error } = await db
    .from("addition_courses")
    .select(
      "id,type,title,software,summary,image,draft,category,level," +
      "project_domain,path_kind,access_level,status,course_promise," +
      "learning_outcome,modules,updated_at",
    )
    .in("type", ["course", "core"])
    .order("title", { ascending: true });

  if (error) throw new Error(`Failed loading Supabase courses: ${error.message}`);

  const courseRows = (data ?? []) as unknown as CourseRow[];

  // Use the relational tables if the migration has been run, otherwise fall
  // back to reading modules from the JSONB column on addition_courses.
  const useRelational = await relationalTablesExist(db);

  if (useRelational) {
    try {
      return await readRelationalPayload(db, courseRows);
    } catch {
      // Fall through to JSONB approach on any relational error
    }
  }

  // JSONB fallback (pre-migration)
  const items = sortItems(courseRows.map(normalizeDbCourse));
  const softwareOptions = Array.from(
    new Set(items.map((item) => item.software).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  const categories = Array.from(
    new Set(items.map((item) => item.category).filter(Boolean) as string[]),
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  return StudioPayloadSchema.parse({ categories, softwareOptions, items });
}

async function writeSupabaseStudioPayload(payload: StudioPayload): Promise<StudioPayload> {
  const parsed = StudioPayloadSchema.parse(payload);
  const db = createSupabaseServiceClient();
  const ids = parsed.items.map((item) => item.id);

  const courseRows = parsed.items.map((item) => ({
    id: item.id,
    type: dbTypeForCourse(item),
    title: item.title,
    software: item.software,
    summary: item.summary ?? "",
    image: item.image ?? "",
    draft: item.draft ?? false,
    category: item.category ?? "",
    level: item.level ?? "",
    project_domain: item.projectDomain ?? "",
    path_kind: item.pathKind ?? "",
    access_level:
      typeof (item as unknown as Record<string, unknown>).accessLevel === "string"
        ? ((item as unknown as Record<string, unknown>).accessLevel as string)
        : "Free",
    status:
      typeof (item as unknown as Record<string, unknown>).status === "string"
        ? ((item as unknown as Record<string, unknown>).status as string)
        : item.draft
          ? "Draft"
          : "Published",
    course_promise:
      typeof (item as unknown as Record<string, unknown>).coursePromise === "string"
        ? ((item as unknown as Record<string, unknown>).coursePromise as string)
        : "",
    learning_outcome:
      typeof (item as unknown as Record<string, unknown>).learningOutcome === "string"
        ? ((item as unknown as Record<string, unknown>).learningOutcome as string)
        : "",
    // Keep JSONB column in sync during the transition period
    modules: item.modules,
    updated_at: new Date().toISOString(),
  }));

  if (courseRows.length > 0) {
    const { error } = await db.from("addition_courses").upsert(courseRows, { onConflict: "id" });
    if (error) throw new Error(`Failed saving Supabase courses: ${error.message}`);
  }

  // Delete courses removed from the payload
  const existing = await db.from("addition_courses").select("id").in("type", ["course", "core"]);
  if (existing.error) throw new Error(`Failed checking removed courses: ${existing.error.message}`);
  const removedIds = (existing.data ?? []).map((row) => row.id).filter((id) => !ids.includes(id));
  if (removedIds.length > 0) {
    await db.from("addition_courses").delete().in("id", removedIds);
  }

  // Write to relational tables if the migration has been run
  const useRelational = await relationalTablesExist(db);
  if (useRelational) {
    try {
      await writeRelationalPayload(db, parsed);
    } catch (err) {
      // Non-fatal for now — JSONB column is the source of truth until migration is verified
      console.error("[content-studio] Relational write error (non-fatal):", err);
    }
  }

  return readSupabaseStudioPayload();
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function readStudioPayload(): Promise<StudioPayload> {
  try {
    return await readSupabaseStudioPayload();
  } catch {
    // Local fallback for development environments without Supabase configured.
  }

  const storePath = await resolveStorePath();
  const raw = await fs.readFile(/*turbopackIgnore: true*/ storePath, "utf8");
  const store = JSON.parse(raw) as StoreShape;
  const content = store.content || {};

  const items = sortItems([
    ...normalizeItems("core", Array.isArray(content.core) ? content.core : []),
    ...normalizeItems("courses", Array.isArray(content.courses) ? content.courses : []),
  ]);

  const softwareFromCatalog = items
    .map((item) => item.software.trim())
    .filter(Boolean)
    .filter((item, index, arr) => arr.indexOf(item) === index)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  const softwareOptions = Array.from(
    new Set([
      ...softwareFromCatalog,
      ...(Array.isArray(content.software) ? content.software : [])
        .map((entry) =>
          typeof entry === "string"
            ? entry
            : entry && typeof entry === "object"
              ? asString((entry as { name?: unknown }).name)
              : "",
        )
        .map((item) => item.trim())
        .filter(Boolean),
    ]),
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  return StudioPayloadSchema.parse({
    categories: asStringArray(content.categories),
    softwareOptions,
    items,
  });
}

export async function writeStudioPayload(payload: StudioPayload): Promise<StudioPayload> {
  try {
    return await writeSupabaseStudioPayload(payload);
  } catch {
    // Local fallback for development environments without Supabase configured.
  }

  const storePath = await resolveStorePath();
  const raw = await fs.readFile(/*turbopackIgnore: true*/ storePath, "utf8");
  const store = JSON.parse(raw) as StoreShape;
  const parsed = StudioPayloadSchema.parse(payload);

  const core = parsed.items
    .filter((item) => item.bucket === "core")
    .map((item) => {
      const rest = { ...item };
      delete (rest as { bucket?: string }).bucket;
      return rest;
    });
  const courses = parsed.items
    .filter((item) => item.bucket === "courses")
    .map((item) => {
      const rest = { ...item };
      delete (rest as { bucket?: string }).bucket;
      return rest;
    });

  store.content = {
    ...(store.content || {}),
    categories: parsed.categories,
    core,
    courses,
  };

  await fs.writeFile(/*turbopackIgnore: true*/ storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");

  return readStudioPayload();
}
