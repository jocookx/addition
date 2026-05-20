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

async function readSupabaseStudioPayload(): Promise<StudioPayload> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from("addition_courses")
    .select("id,type,title,software,summary,image,draft,category,level,project_domain,path_kind,access_level,status,course_promise,learning_outcome,modules,updated_at")
    .in("type", ["course", "core"])
    .order("title", { ascending: true });

  if (error) throw new Error(`Failed loading Supabase courses: ${error.message}`);

  const items = sortItems(((data ?? []) as CourseRow[]).map(normalizeDbCourse));
  const softwareOptions = Array.from(new Set(items.map((item) => item.software).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
  const categories = Array.from(new Set(items.map((item) => item.category).filter(Boolean) as string[])).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );

  return StudioPayloadSchema.parse({ categories, softwareOptions, items });
}

async function writeSupabaseStudioPayload(payload: StudioPayload): Promise<StudioPayload> {
  const parsed = StudioPayloadSchema.parse(payload);
  const db = createSupabaseServiceClient();
  const ids = parsed.items.map((item) => item.id);
  const rows = parsed.items.map((item) => ({
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
    access_level: typeof (item as unknown as Record<string, unknown>).accessLevel === "string"
      ? ((item as unknown as Record<string, unknown>).accessLevel as string)
      : "Free",
    status: typeof (item as unknown as Record<string, unknown>).status === "string"
      ? ((item as unknown as Record<string, unknown>).status as string)
      : item.draft ? "Draft" : "Published",
    course_promise: typeof (item as unknown as Record<string, unknown>).coursePromise === "string"
      ? ((item as unknown as Record<string, unknown>).coursePromise as string)
      : "",
    learning_outcome: typeof (item as unknown as Record<string, unknown>).learningOutcome === "string"
      ? ((item as unknown as Record<string, unknown>).learningOutcome as string)
      : "",
    modules: item.modules,
    updated_at: new Date().toISOString(),
  }));

  if (rows.length > 0) {
    const { error } = await db.from("addition_courses").upsert(rows, { onConflict: "id" });
    if (error) throw new Error(`Failed saving Supabase courses: ${error.message}`);
  }

  const existing = await db.from("addition_courses").select("id").in("type", ["course", "core"]);
  if (existing.error) throw new Error(`Failed checking removed Supabase courses: ${existing.error.message}`);
  const removedIds = (existing.data ?? []).map((row) => row.id).filter((id) => !ids.includes(id));
  if (removedIds.length > 0) {
    const { error } = await db.from("addition_courses").delete().in("id", removedIds);
    if (error) throw new Error(`Failed deleting removed Supabase courses: ${error.message}`);
  }

  return readSupabaseStudioPayload();
}

export async function readStudioPayload(): Promise<StudioPayload> {
  try {
    return await readSupabaseStudioPayload();
  } catch {
    // Local fallback for older development environments without Supabase configured.
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
    // Local fallback for older development environments without Supabase configured.
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
