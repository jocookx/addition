import { randomUUID } from "node:crypto";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

type EntityKey =
  | "curriculum"
  | "courses"
  | "paths"
  | "workshops"
  | "commands"
  | "combos"
  | "resources"
  | "problem-solver"
  | "practice-decks"
  | "flashcards"
  | "quiz-questions"
  | "certificates";

type EntityConfig = {
  label: string;
  table: string;
  columns: string[];
  sample: Record<string, string>;
  mapRow: (row: Record<string, string>) => Record<string, unknown>;
};

function slugify(value: string, fallback: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function list(value: string): string[] {
  return value.split("|").map((item) => item.trim()).filter(Boolean);
}

function bool(value: string, fallback = false): boolean {
  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "1", "published"].includes(normalized)) return true;
  if (["false", "no", "0", "draft"].includes(normalized)) return false;
  return fallback;
}

function int(value: string, fallback = 0): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function positiveInt(value: string, fallback: number | null = null): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function text(row: Record<string, string>, key: string, fallback = ""): string {
  return (row[key] || fallback).trim();
}

function optionalId(row: Record<string, string>, prefix: string, titleKey = "title") {
  return text(row, "id") || `${prefix}-${slugify(text(row, titleKey), randomUUID().slice(0, 8))}`;
}

const CONFIGS: Record<EntityKey, EntityConfig> = {
  curriculum: {
    label: "Master Curriculum",
    table: "",
    columns: [
      "path_id", "path_title", "path_slug", "path_description", "path_outcome", "path_level", "path_audience", "path_software", "path_published", "path_sort_order",
      "course_id", "course_title", "course_summary", "course_promise", "course_learning_outcome", "course_software", "course_level", "course_category", "course_access_level", "course_status", "course_sort_order", "course_image",
      "module_id", "module_title", "module_sort_order",
      "lesson_id", "lesson_title", "lesson_sort_order", "lesson_video_url", "lesson_video_id", "lesson_image", "lesson_content", "lesson_duration_min", "lesson_status", "lesson_access_level",
      "resource_ids", "resource_titles", "resource_urls", "resource_type", "resource_access_level",
    ],
    sample: {
      path_id: "path-rhino-beginner",
      path_title: "Rhino Beginner",
      path_slug: "rhino-beginner",
      path_description: "A complete beginner path from Rhino fundamentals to confident modelling.",
      path_outcome: "Model clean architectural geometry with Rhino.",
      path_level: "explorer",
      path_audience: "Architecture and design learners",
      path_software: "Rhino",
      path_published: "false",
      path_sort_order: "1",
      course_id: "course-rhino-creating-geometry",
      course_title: "Creating Geometry",
      course_summary: "Create curves, surfaces and solids in Rhino.",
      course_promise: "Understand the geometry creation tools used in real design workflows.",
      course_learning_outcome: "Create and control curves, surfaces and solids.",
      course_software: "Rhino",
      course_level: "Beginner",
      course_category: "Course",
      course_access_level: "Free",
      course_status: "Draft",
      course_sort_order: "4",
      course_image: "",
      module_id: "mod-creating-geometry-curves",
      module_title: "Curves",
      module_sort_order: "1",
      lesson_id: "lesson-creating-geometry-001",
      lesson_title: "Drawing accurate lines",
      lesson_sort_order: "1",
      lesson_video_url: "",
      lesson_video_id: "",
      lesson_image: "",
      lesson_content: "Lesson notes, script or outline.",
      lesson_duration_min: "6",
      lesson_status: "Draft",
      lesson_access_level: "Free",
      resource_ids: "res-rhino-line-exercise",
      resource_titles: "Line exercise file",
      resource_urls: "https://example.com/line-exercise.3dm",
      resource_type: "Exercise file",
      resource_access_level: "Free",
    },
    mapRow: (row) => row,
  },
  courses: {
    label: "Courses",
    table: "addition_courses",
    columns: ["id", "title", "software", "summary", "course_promise", "learning_outcome", "category", "level", "access_level", "status", "draft", "image", "modules"],
    sample: {
      id: "course-rhino-foundations",
      title: "Rhino Foundations",
      software: "Rhino",
      summary: "A practical beginner course for clean Rhino modelling.",
      course_promise: "Model simple architectural geometry with a reliable workflow.",
      learning_outcome: "Create and edit clean curves, surfaces and solids.",
      category: "Course",
      level: "Beginner",
      access_level: "Free",
      status: "Draft",
      draft: "true",
      image: "",
      modules: "Getting Started|Core Commands|Practice Project",
    },
    mapRow: (row) => ({
      id: optionalId(row, "course"),
      type: "course",
      title: text(row, "title", "Untitled course"),
      software: text(row, "software"),
      summary: text(row, "summary"),
      course_promise: text(row, "course_promise"),
      learning_outcome: text(row, "learning_outcome"),
      category: text(row, "category"),
      level: text(row, "level"),
      access_level: text(row, "access_level", "Free"),
      status: text(row, "status", bool(text(row, "draft"), true) ? "Draft" : "Published"),
      draft: bool(text(row, "draft"), true),
      image: text(row, "image"),
      modules: list(text(row, "modules")).map((title, index) => ({
        id: `module-${index + 1}-${slugify(title, "module")}`,
        title,
        lessons: [],
      })),
      updated_at: new Date().toISOString(),
    }),
  },
  paths: {
    label: "Learning Paths",
    table: "addition_learning_paths",
    columns: ["id", "title", "slug", "description", "outcome", "level", "audience", "software", "image", "course_ids", "published", "sort_order"],
    sample: {
      id: "path-rhino-beginner",
      title: "Rhino Beginner Path",
      slug: "rhino-beginner",
      description: "A guided path for new Rhino learners.",
      outcome: "Build confidence with modelling basics.",
      level: "explorer",
      audience: "Architecture and design students",
      software: "Rhino",
      image: "",
      course_ids: "course-rhino-foundations",
      published: "false",
      sort_order: "1",
    },
    mapRow: (row) => ({
      id: optionalId(row, "path"),
      title: text(row, "title", "Untitled path"),
      slug: text(row, "slug") || slugify(text(row, "title"), "path"),
      description: text(row, "description"),
      outcome: text(row, "outcome"),
      level: text(row, "level", "explorer"),
      audience: text(row, "audience"),
      software: list(text(row, "software")),
      image: text(row, "image"),
      course_ids: list(text(row, "course_ids")),
      published: bool(text(row, "published")),
      sort_order: int(text(row, "sort_order")),
      updated_at: new Date().toISOString(),
    }),
  },
  workshops: {
    label: "Live Workshops",
    table: "addition_workshops",
    columns: [
      "id", "title", "date", "time", "timezone", "duration", "format", "location", "price", "price_pence", "capacity", "upcoming", "track", "level", "week", "software", "image", "description", "learn", "included", "principles", "stripe_payment_link",
      "start_time", "end_time", "live_provider", "join_url", "host_url", "meeting_id", "passcode", "live_embed_url", "calendar_url", "pre_work", "resources",
      "recording_status", "recording_url", "recording_embed_url", "recording_duration", "recording_thumbnail", "recording_access_level",
    ],
    sample: {
      id: "",
      title: "Rhino Clean Modelling Workshop",
      date: "2026-06-01",
      time: "18:00",
      timezone: "Europe/London",
      duration: "2 hours",
      format: "online",
      location: "Zoom",
      price: "GBP 49",
      price_pence: "4900",
      capacity: "20",
      upcoming: "true",
      track: "Rhino",
      level: "Beginner",
      week: "1",
      software: "Rhino",
      image: "",
      description: "A live workshop on clean Rhino modelling.",
      learn: "Clean curves|Reliable surfaces|Common fixes",
      included: "Recording|Exercise file",
      principles: "Model cleanly|Check edges",
      stripe_payment_link: "",
      start_time: "2026-06-01T18:00:00+01:00",
      end_time: "2026-06-01T20:00:00+01:00",
      live_provider: "zoom",
      join_url: "",
      host_url: "",
      meeting_id: "",
      passcode: "",
      live_embed_url: "",
      calendar_url: "",
      pre_work: "Install Rhino|Download exercise files",
      resources: "res-rhino-workshop-files|res-rhino-cheat-sheet",
      recording_status: "none",
      recording_url: "",
      recording_embed_url: "",
      recording_duration: "",
      recording_thumbnail: "",
      recording_access_level: "booked_users",
    },
    mapRow: (row) => ({
      ...(text(row, "id") ? { id: text(row, "id") } : {}),
      title: text(row, "title", "Untitled workshop"),
      date: text(row, "date"),
      time: text(row, "time", "09:00"),
      timezone: text(row, "timezone", "Europe/London"),
      duration: text(row, "duration"),
      format: text(row, "format", "online"),
      location: text(row, "location"),
      price: text(row, "price"),
      price_pence: int(text(row, "price_pence")),
      capacity: int(text(row, "capacity"), 12),
      upcoming: bool(text(row, "upcoming"), true),
      track: text(row, "track"),
      level: text(row, "level"),
      week: int(text(row, "week"), 1),
      software: list(text(row, "software")),
      image: text(row, "image"),
      description: text(row, "description"),
      learn: list(text(row, "learn")),
      included: list(text(row, "included")),
      principles: list(text(row, "principles")),
      stripe_payment_link: text(row, "stripe_payment_link") || null,
      start_time: text(row, "start_time") || null,
      end_time: text(row, "end_time") || null,
      live_provider: text(row, "live_provider", "zoom"),
      join_url: text(row, "join_url"),
      host_url: text(row, "host_url"),
      meeting_id: text(row, "meeting_id"),
      passcode: text(row, "passcode"),
      live_embed_url: text(row, "live_embed_url"),
      calendar_url: text(row, "calendar_url"),
      pre_work: list(text(row, "pre_work")),
      resources: list(text(row, "resources")),
      recording_status: text(row, "recording_status", "none"),
      recording_url: text(row, "recording_url"),
      recording_embed_url: text(row, "recording_embed_url"),
      recording_duration: text(row, "recording_duration"),
      recording_thumbnail: text(row, "recording_thumbnail"),
      recording_access_level: text(row, "recording_access_level", "booked_users"),
    }),
  },
  commands: {
    label: "Command Library",
    table: "addition_commands",
    columns: ["id", "name", "software", "menu", "description", "shortcut", "addon", "difficulty", "tags", "intent_categories", "object_types", "outcomes", "icon", "gif", "source"],
    sample: {
      id: "",
      name: "Loft",
      software: "Rhino",
      menu: "Surface > Loft",
      description: "Creates a surface through selected profile curves.",
      shortcut: "",
      addon: "",
      difficulty: "beginner",
      tags: "surface|curves",
      intent_categories: "Create",
      object_types: "Curve|Surface",
      outcomes: "Surface",
      icon: "",
      gif: "",
      source: "",
    },
    mapRow: (row) => ({
      ...(text(row, "id") ? { id: text(row, "id") } : {}),
      name: text(row, "name", "Untitled command"),
      software: text(row, "software"),
      menu: text(row, "menu"),
      description: text(row, "description"),
      shortcut: text(row, "shortcut"),
      addon: text(row, "addon"),
      difficulty: text(row, "difficulty", "beginner"),
      tags: list(text(row, "tags")),
      intent_categories: list(text(row, "intent_categories")),
      object_types: list(text(row, "object_types")),
      outcomes: list(text(row, "outcomes")),
      icon: text(row, "icon"),
      gif: text(row, "gif"),
      source: text(row, "source"),
    }),
  },
  combos: {
    label: "Workflow Combos",
    table: "addition_courses",
    columns: ["id", "title", "software", "description", "difficulty", "commands", "tags", "draft", "image"],
    sample: {
      id: "",
      title: "Create a clean lofted surface",
      software: "Rhino",
      description: "Build a controlled surface from clean profile curves.",
      difficulty: "beginner",
      commands: "Curve:Draw profiles|Rebuild:Clean point count|Loft:Create surface|Join:Close result",
      tags: "surface modelling|workflow",
      draft: "true",
      image: "",
    },
    mapRow: (row) => ({
      ...(text(row, "id") ? { id: text(row, "id") } : {}),
      type: "combo",
      title: text(row, "title", "Untitled combo"),
      software: text(row, "software"),
      description: text(row, "description"),
      difficulty: text(row, "difficulty", "beginner"),
      commands: list(text(row, "commands")).map((item) => {
        const [name, ...note] = item.split(":");
        return { name: name.trim(), note: note.join(":").trim() };
      }),
      tags: list(text(row, "tags")),
      draft: bool(text(row, "draft"), true),
      image: text(row, "image"),
      updated_at: new Date().toISOString(),
    }),
  },
  resources: {
    label: "Resources",
    table: "addition_resources",
    columns: ["id", "title", "type", "software", "file_url", "external_url", "description", "access_level", "linked_lessons", "linked_courses", "status", "tags"],
    sample: {
      id: "",
      title: "Rhino Loft Exercise File",
      type: "Exercise file",
      software: "Rhino",
      file_url: "",
      external_url: "",
      description: "Starter file for loft practice.",
      access_level: "Free",
      linked_lessons: "",
      linked_courses: "course-rhino-foundations",
      status: "Draft",
      tags: "exercise|rhino",
    },
    mapRow: (row) => ({
      ...(text(row, "id") ? { id: text(row, "id") } : {}),
      title: text(row, "title", "Untitled resource"),
      type: text(row, "type", "Link"),
      software: text(row, "software"),
      file_url: text(row, "file_url"),
      external_url: text(row, "external_url"),
      description: text(row, "description"),
      access_level: text(row, "access_level", "Free"),
      linked_lessons: list(text(row, "linked_lessons")),
      linked_courses: list(text(row, "linked_courses")),
      status: text(row, "status", "Draft"),
      tags: list(text(row, "tags")),
      updated_at: new Date().toISOString(),
    }),
  },
  "problem-solver": {
    label: "Problem Solver",
    table: "addition_problem_solver",
    columns: ["id", "question", "alternative_phrasings", "software", "intent", "difficulty", "short_answer", "detailed_answer", "linked_commands", "linked_combos", "linked_lessons", "linked_courses", "common_mistakes", "tags", "frequency", "status"],
    sample: {
      id: "",
      question: "Why is my loft twisted?",
      alternative_phrasings: "Loft is rotating|Surface is twisted",
      software: "Rhino",
      intent: "Troubleshooting",
      difficulty: "beginner",
      short_answer: "Check curve direction and seam alignment before lofting.",
      detailed_answer: "Use Dir to inspect curve direction, align seams, then rebuild if needed.",
      linked_commands: "Loft|Dir|Rebuild",
      linked_combos: "Create a clean lofted surface",
      linked_lessons: "",
      linked_courses: "course-rhino-foundations",
      common_mistakes: "Mixed curve directions and uneven point counts.",
      tags: "loft|surface",
      frequency: "0",
      status: "Draft",
    },
    mapRow: (row) => ({
      ...(text(row, "id") ? { id: text(row, "id") } : {}),
      question: text(row, "question", "Untitled learner question"),
      alternative_phrasings: list(text(row, "alternative_phrasings")),
      software: text(row, "software"),
      intent: text(row, "intent"),
      difficulty: text(row, "difficulty", "beginner"),
      short_answer: text(row, "short_answer"),
      detailed_answer: text(row, "detailed_answer"),
      linked_commands: list(text(row, "linked_commands")),
      linked_combos: list(text(row, "linked_combos")),
      linked_lessons: list(text(row, "linked_lessons")),
      linked_courses: list(text(row, "linked_courses")),
      common_mistakes: text(row, "common_mistakes"),
      tags: list(text(row, "tags")),
      frequency: int(text(row, "frequency")),
      status: text(row, "status", "Draft"),
      updated_at: new Date().toISOString(),
    }),
  },
  "practice-decks": {
    label: "Practice Tasks",
    table: "addition_flashcard_decks",
    columns: ["id", "title", "software", "topic", "description", "sort_order", "published"],
    sample: { id: "", title: "Rhino Surface Commands", software: "Rhino", topic: "Surfaces", description: "Practice core surface commands.", sort_order: "1", published: "false" },
    mapRow: (row) => ({
      ...(text(row, "id") ? { id: text(row, "id") } : {}),
      title: text(row, "title", "Untitled deck"),
      software: text(row, "software"),
      topic: text(row, "topic"),
      description: text(row, "description"),
      sort_order: int(text(row, "sort_order")),
      published: bool(text(row, "published")),
      updated_at: new Date().toISOString(),
    }),
  },
  flashcards: {
    label: "Flashcards",
    table: "addition_flashcards",
    columns: ["id", "deck_id", "front", "back", "hint", "sort_order"],
    sample: {
      id: "",
      deck_id: "paste-flashcard-deck-id-here",
      front: "What does Loft do?",
      back: "Creates a surface through selected profile curves.",
      hint: "Think surface from profiles.",
      sort_order: "1",
    },
    mapRow: (row) => ({
      ...(text(row, "id") ? { id: text(row, "id") } : {}),
      deck_id: text(row, "deck_id"),
      front: text(row, "front"),
      back: text(row, "back"),
      hint: text(row, "hint"),
      sort_order: int(text(row, "sort_order")),
    }),
  },
  "quiz-questions": {
    label: "Quiz Bank",
    table: "addition_quiz_questions",
    columns: ["id", "software", "topic", "question_text", "question_type", "options", "correct_answer", "explanation", "difficulty", "tags", "published"],
    sample: {
      id: "",
      software: "Rhino",
      topic: "Surfaces",
      question_text: "Which command creates a surface through profile curves?",
      question_type: "mc",
      options: "Loft|Trim|Join|Move",
      correct_answer: "Loft",
      explanation: "Loft creates a surface through selected profile curves.",
      difficulty: "beginner",
      tags: "loft|surface",
      published: "false",
    },
    mapRow: (row) => ({
      ...(text(row, "id") ? { id: text(row, "id") } : {}),
      software: text(row, "software"),
      topic: text(row, "topic"),
      question_text: text(row, "question_text", "Untitled question"),
      question_type: text(row, "question_type", "mc"),
      options: list(text(row, "options")),
      correct_answer: text(row, "correct_answer"),
      explanation: text(row, "explanation"),
      difficulty: text(row, "difficulty", "beginner"),
      tags: list(text(row, "tags")),
      published: bool(text(row, "published")),
      updated_at: new Date().toISOString(),
    }),
  },
  certificates: {
    label: "Certificates",
    table: "addition_certificates",
    columns: ["id", "title", "software", "description", "passing_score", "question_ids", "badge_image", "published"],
    sample: {
      id: "",
      title: "Rhino Foundations Certificate",
      software: "Rhino",
      description: "Certificate for completing Rhino foundations assessment.",
      passing_score: "80",
      question_ids: "",
      badge_image: "",
      published: "false",
    },
    mapRow: (row) => ({
      ...(text(row, "id") ? { id: text(row, "id") } : {}),
      title: text(row, "title", "Untitled certificate"),
      software: text(row, "software"),
      description: text(row, "description"),
      passing_score: int(text(row, "passing_score"), 80),
      question_ids: list(text(row, "question_ids")),
      badge_image: text(row, "badge_image"),
      published: bool(text(row, "published")),
      updated_at: new Date().toISOString(),
    }),
  },
};

function escapeCsv(value: unknown): string {
  const textValue = String(value ?? "");
  if (/[",\n\r]/.test(textValue)) return `"${textValue.replace(/"/g, '""')}"`;
  return textValue;
}

function parseCsv(csv: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];
    if (quoted) {
      if (char === "\"" && next === "\"") {
        field += "\"";
        i += 1;
      } else if (char === "\"") {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === "\"") {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  row.push(field);
  rows.push(row);
  const [headers = [], ...body] = rows.filter((items) => items.some((item) => item.trim()));
  return body.map((items) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), (items[index] || "").trim()])),
  );
}

type MasterModule = {
  id: string;
  title: string;
  sortOrder: number;
  lessons: Array<{
    id: string;
    title: string;
    sortOrder: number;
    video: string;
    videoId: string;
    image: string;
    content: string;
    durationMin: number | null;
    resources: Array<{ name: string; url: string }>;
    status: string;
    accessLevel: string;
  }>;
};

type MasterCourse = {
  id: string;
  sortOrder: number;
  row: Record<string, unknown>;
  modules: Map<string, MasterModule>;
};

type MasterPath = {
  id: string;
  sortOrder: number;
  row: Record<string, unknown>;
  courseIds: Map<string, number>;
};

function masterId(row: Record<string, string>, key: string, prefix: string, titleKey: string): string {
  return text(row, key) || `${prefix}-${slugify(text(row, titleKey), randomUUID().slice(0, 8))}`;
}

function resourceItems(row: Record<string, string>): Array<{ id: string; title: string; url: string }> {
  const ids = list(text(row, "resource_ids"));
  const titles = list(text(row, "resource_titles"));
  const urls = list(text(row, "resource_urls"));
  const max = Math.max(ids.length, titles.length, urls.length);
  const items: Array<{ id: string; title: string; url: string }> = [];
  for (let index = 0; index < max; index += 1) {
    const title = titles[index] || ids[index] || `Resource ${index + 1}`;
    const url = urls[index] || "";
    if (!title && !url) continue;
    items.push({
      id: ids[index] || `res-${slugify(title, randomUUID().slice(0, 8))}`,
      title,
      url,
    });
  }
  return items;
}

async function importMasterCurriculum(csv: string): Promise<{ entity: string; imported: number; totalRows: number }> {
  const parsedRows = parseCsv(csv);
  const paths = new Map<string, MasterPath>();
  const courses = new Map<string, MasterCourse>();
  const resources = new Map<string, Record<string, unknown>>();

  for (let rowIndex = 0; rowIndex < parsedRows.length; rowIndex += 1) {
    const row = parsedRows[rowIndex];
    if (!Object.values(row).some(Boolean)) continue;

    const pathId = masterId(row, "path_id", "path", "path_title");
    const courseId = masterId(row, "course_id", "course", "course_title");
    const moduleId = masterId(row, "module_id", "module", "module_title");
    const lessonId = masterId(row, "lesson_id", "lesson", "lesson_title");
    const pathSort = int(text(row, "path_sort_order"), 0);
    const courseSort = int(text(row, "course_sort_order"), rowIndex);
    const moduleSort = int(text(row, "module_sort_order"), rowIndex);
    const lessonSort = int(text(row, "lesson_sort_order"), rowIndex);

    if (!paths.has(pathId)) {
      paths.set(pathId, {
        id: pathId,
        sortOrder: pathSort,
        row: {
          id: pathId,
          title: text(row, "path_title", "Untitled path"),
          slug: text(row, "path_slug") || slugify(text(row, "path_title"), pathId),
          description: text(row, "path_description"),
          outcome: text(row, "path_outcome"),
          level: text(row, "path_level", "explorer"),
          audience: text(row, "path_audience"),
          software: list(text(row, "path_software")),
          image: text(row, "path_image"),
          published: bool(text(row, "path_published")),
          sort_order: pathSort,
          updated_at: new Date().toISOString(),
        },
        courseIds: new Map(),
      });
    }
    paths.get(pathId)?.courseIds.set(courseId, courseSort);

    if (!courses.has(courseId)) {
      courses.set(courseId, {
        id: courseId,
        sortOrder: courseSort,
        row: {
          id: courseId,
          type: "course",
          title: text(row, "course_title", "Untitled course"),
          software: text(row, "course_software") || text(row, "path_software"),
          summary: text(row, "course_summary"),
          course_promise: text(row, "course_promise"),
          learning_outcome: text(row, "course_learning_outcome"),
          category: text(row, "course_category"),
          level: text(row, "course_level"),
          access_level: text(row, "course_access_level", "Free"),
          status: text(row, "course_status", "Draft"),
          draft: text(row, "course_status").toLowerCase() !== "published",
          image: text(row, "course_image"),
          modules: [],
          updated_at: new Date().toISOString(),
        },
        modules: new Map(),
      });
    }

    const course = courses.get(courseId);
    if (!course) continue;
    if (!course.modules.has(moduleId)) {
      course.modules.set(moduleId, { id: moduleId, title: text(row, "module_title", "Untitled module"), sortOrder: moduleSort, lessons: [] });
    }

    const lessonResources = resourceItems(row);
    const moduleItem = course.modules.get(moduleId);
    moduleItem?.lessons.push({
      id: lessonId,
      title: text(row, "lesson_title", "Untitled lesson"),
      sortOrder: lessonSort,
      video: text(row, "lesson_video_url"),
      videoId: text(row, "lesson_video_id"),
      image: text(row, "lesson_image"),
      content: text(row, "lesson_content"),
      durationMin: positiveInt(text(row, "lesson_duration_min")),
      resources: lessonResources.map((item) => ({ name: item.title, url: item.url })),
      status: text(row, "lesson_status", "Draft"),
      accessLevel: text(row, "lesson_access_level", text(row, "course_access_level", "Free")),
    });

    for (const resource of lessonResources) {
      resources.set(resource.id, {
        id: resource.id,
        title: resource.title,
        type: text(row, "resource_type", "Link"),
        software: text(row, "course_software") || text(row, "path_software"),
        file_url: resource.url,
        external_url: resource.url,
        description: text(row, "resource_description"),
        access_level: text(row, "resource_access_level", text(row, "course_access_level", "Free")),
        linked_lessons: [lessonId],
        linked_courses: [courseId],
        status: text(row, "resource_status", "Draft"),
        tags: list(text(row, "resource_tags")),
        updated_at: new Date().toISOString(),
      });
    }
  }

  const courseRows = [...courses.values()].map((course) => {
    const modules = [...course.modules.values()]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((moduleItem) => ({
        id: moduleItem.id,
        title: moduleItem.title,
        lessons: moduleItem.lessons
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((lesson) => ({
          ...lesson,
        })),
      }));
    return { ...course.row, modules };
  });

  const moduleRows = [...courses.values()].flatMap((course) =>
    [...course.modules.values()].map((moduleItem) => ({
      id: moduleItem.id,
      course_id: course.id,
      title: moduleItem.title,
      sort_order: moduleItem.sortOrder,
      updated_at: new Date().toISOString(),
    })),
  );

  const lessonRows = [...courses.values()].flatMap((course) =>
    [...course.modules.values()].flatMap((moduleItem) =>
      moduleItem.lessons.sort((a, b) => a.sortOrder - b.sortOrder).map((lesson) => ({
        id: lesson.id,
        module_id: moduleItem.id,
        course_id: course.id,
        title: lesson.title,
        video_url: lesson.video,
        video_id: lesson.videoId || null,
        image: lesson.image,
        content: lesson.content,
        duration_min: lesson.durationMin,
        sort_order: lesson.sortOrder,
        metadata: {
          status: lesson.status,
          accessLevel: lesson.accessLevel,
          resources: lesson.resources,
        },
        updated_at: new Date().toISOString(),
      })),
    ),
  );

  const pathRows = [...paths.values()].map((path) => ({
    ...path.row,
    course_ids: [...path.courseIds.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([courseId]) => courseId),
  }));

  const db = createSupabaseServiceClient();
  if (courseRows.length) {
    const { error } = await db.from("addition_courses").upsert(courseRows, { onConflict: "id" });
    if (error) throw new Error(`Courses: ${error.message}`);
  }
  if (moduleRows.length) {
    const { error } = await db.from("addition_modules").upsert(moduleRows, { onConflict: "id" });
    if (error) throw new Error(`Modules: ${error.message}`);
  }
  if (lessonRows.length) {
    const { error } = await db.from("addition_lessons").upsert(lessonRows, { onConflict: "id" });
    if (error) throw new Error(`Lessons: ${error.message}`);
  }
  if (pathRows.length) {
    const { error } = await db.from("addition_learning_paths").upsert(pathRows, { onConflict: "id" });
    if (error) throw new Error(`Paths: ${error.message}`);
  }
  const resourceRows = [...resources.values()];
  if (resourceRows.length) {
    const { error } = await db.from("addition_resources").upsert(resourceRows, { onConflict: "id" });
    if (error) throw new Error(`Resources: ${error.message}`);
  }

  return {
    entity: "Master Curriculum",
    imported: courseRows.length + moduleRows.length + lessonRows.length + pathRows.length + resourceRows.length,
    totalRows: parsedRows.length,
  };
}

export function getCsvTemplate(entity: string): { fileName: string; csv: string } | null {
  const normalizedEntity = entity === "master-curriculum" ? "curriculum" : entity;
  const config = CONFIGS[normalizedEntity as EntityKey];
  if (!config) return null;
  const csv = [
    config.columns.join(","),
    config.columns.map((column) => escapeCsv(config.sample[column])).join(","),
  ].join("\n");
  return {
    fileName: `addition-${normalizedEntity}-template.csv`,
    csv: `${csv}\n`,
  };
}

export async function importCsvRows(entity: string, csv: string): Promise<{ entity: string; imported: number; totalRows: number }> {
  if (entity === "curriculum" || entity === "master-curriculum") {
    return importMasterCurriculum(csv);
  }

  const config = CONFIGS[entity as EntityKey];
  if (!config) throw new Error("Unknown CSV import type.");

  const parsedRows = parseCsv(csv);
  const rows = parsedRows
    .map((row) => config.mapRow(row))
    .filter((row) => Object.values(row).some((value) => value !== "" && value !== null && value !== undefined));

  if (!rows.length) return { entity: config.label, imported: 0, totalRows: parsedRows.length };

  const db = createSupabaseServiceClient();
  const { error } = await db.from(config.table).upsert(rows);
  if (error) throw new Error(`DB: ${error.message}`);
  return { entity: config.label, imported: rows.length, totalRows: parsedRows.length };
}
