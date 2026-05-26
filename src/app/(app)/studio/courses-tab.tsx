"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { StudioCourse, StudioLesson, StudioModule, StudioPayload } from "@/domain/content-studio";
import { LAUNCH_SOFTWARE } from "@/config/taxonomy";
import { fetchJson } from "@/lib/api/fetch-json";
import { ImageUploadField } from "./image-upload-field";
import { CurriculumBuilder } from "./curriculum-builder";
import { LessonEditorDrawer } from "./lesson-editor-drawer";
// VideoUploadField is used inside LessonEditorDrawer — not imported here
import {
  AccessBadge,
  AdminDataTable,
  ContentHealthSummary,
  CsvBulkActions,
  EmptyState,
  HealthChecklist,
  MoreMenu,
  PageHeader,
  SaveStatusIndicator,
  StatusBadge,
  healthScore,
  missingHealth,
  statusFromDraft,
  type AccessLevel,
  type ContentStatus,
  type SavedView,
  type TableColumn,
} from "./studio-ui";
import { courseHealth, courseIsPublishReady, lessonHealth } from "./dashboard-tab";

type SaveState = "Saved" | "Unsaved changes" | "Saving..." | "Error saving";
type CourseTemplate = "blank" | "beginner" | "command" | "workflow";
type CourseTab = "overview" | "curriculum" | "lessons" | "commands" | "combos" | "resources" | "access" | "publish";
type LessonTab = "plan" | "script" | "video" | "steps" | "commands" | "combos" | "practice" | "resources" | "publish";
type LessonSelection = { courseId: string; moduleId: string; lessonId: string };
type CourseView = "all" | "attention" | "drafts" | "published" | "ready" | "rhino" | "grasshopper" | "revit" | "dynamo" | "twinmotion" | "unreal" | "photoshop" | "illustrator" | "indesign" | "ai" | "missing-videos" | "missing-practice";
type CourseColumnPreset = "overview" | "production" | "curriculum" | "publishing" | "audit";
type AiTask = "course-overview" | "lesson-plan" | "lesson-script" | "lesson-steps" | "practice-task";
type AiGenerateResponse = { fields: Record<string, string | number>; raw: string; model: string };

const COURSE_TABS: { id: CourseTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "curriculum", label: "Curriculum" },
  { id: "lessons", label: "Lessons" },
  { id: "commands", label: "Commands" },
  { id: "combos", label: "Combos" },
  { id: "resources", label: "Resources" },
  { id: "access", label: "Pricing / Access" },
  { id: "publish", label: "Publish" },
];

const LESSON_TABS: { id: LessonTab; label: string }[] = [
  { id: "plan", label: "Plan" },
  { id: "script", label: "Script" },
  { id: "video", label: "Video" },
  { id: "steps", label: "Steps" },
  { id: "commands", label: "Commands" },
  { id: "combos", label: "Combos" },
  { id: "practice", label: "Practice" },
  { id: "resources", label: "Resources" },
  { id: "publish", label: "Publish" },
];

const LEVEL_OPTIONS = ["Beginner", "Intermediate", "Advanced"];
const STATUS_OPTIONS: ContentStatus[] = ["Idea", "Draft", "Needs Script", "Needs Video", "Needs Resources", "Ready to Review", "Published", "Archived"];
const ACCESS_OPTIONS: AccessLevel[] = ["Free", "Pro", "Student", "Workshop", "Admin only"];
const COURSE_VIEWS: SavedView[] = [
  { id: "all", label: "All Courses" },
  { id: "attention", label: "Needs Attention" },
  { id: "drafts", label: "Drafts" },
  { id: "published", label: "Published" },
  { id: "ready", label: "Ready to Publish" },
  { id: "rhino", label: "Rhino" },
  { id: "grasshopper", label: "Grasshopper" },
  { id: "revit", label: "Revit" },
  { id: "dynamo", label: "Dynamo" },
  { id: "twinmotion", label: "Twinmotion" },
  { id: "unreal", label: "Unreal Engine" },
  { id: "photoshop", label: "Photoshop" },
  { id: "illustrator", label: "Illustrator" },
  { id: "indesign", label: "InDesign" },
  { id: "ai", label: "AI" },
  { id: "missing-videos", label: "Missing Videos" },
  { id: "missing-practice", label: "Missing Practice Tasks" },
];
const COURSE_COLUMN_PRESETS: SavedView[] = [
  { id: "overview", label: "Overview" },
  { id: "production", label: "Production" },
  { id: "curriculum", label: "Curriculum" },
  { id: "publishing", label: "Publishing" },
  { id: "audit", label: "Audit" },
];

function makeId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function lessonCount(course: StudioCourse) {
  return course.modules.reduce((total, module) => total + module.lessons.length, 0);
}

function minutesForCourse(course: StudioCourse) {
  return course.modules.reduce((total, module) => total + module.lessons.reduce((sum, lesson) => sum + (lesson.durationMin ?? 0), 0), 0);
}

function moveItem<T>(items: T[], from: number, to: number) {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function getString(record: unknown, key: string, fallback = ""): string {
  if (!record || typeof record !== "object") return fallback;
  const value = (record as Record<string, unknown>)[key];
  return typeof value === "string" ? value : fallback;
}

function getStatus(record: unknown, fallback: ContentStatus): ContentStatus {
  const value = getString(record, "status");
  return STATUS_OPTIONS.includes(value as ContentStatus) ? value as ContentStatus : fallback;
}

function getAccess(record: unknown): AccessLevel {
  const value = getString(record, "accessLevel", "Free");
  return ACCESS_OPTIONS.includes(value as AccessLevel) ? value as AccessLevel : "Free";
}

function courseStatus(course: StudioCourse): ContentStatus {
  return getStatus(course, statusFromDraft(course.draft));
}

function selectedLessonFrom(payload: StudioPayload | null, selection: LessonSelection | null) {
  if (!payload || !selection) return null;
  const course = payload.items.find((item) => item.id === selection.courseId) ?? null;
  const courseModule = course?.modules.find((item) => item.id === selection.moduleId) ?? null;
  const lesson = courseModule?.lessons.find((item) => item.id === selection.lessonId) ?? null;
  return course && courseModule && lesson ? { course, module: courseModule, lesson } : null;
}

function lessonHasVideo(lesson: StudioLesson): boolean {
  return Boolean(
    (lesson as unknown as Record<string, unknown>).videoId ||
    lesson.video,
  );
}

function courseHasMissingVideo(course: StudioCourse) {
  return course.modules.some((module) => module.lessons.some((lesson) => !lessonHasVideo(lesson)));
}

function courseHasMissingPractice(course: StudioCourse) {
  return course.modules.some((module) => module.lessons.some((lesson) => !getString(lesson, "practiceTask")));
}

function courseHasMissingScript(course: StudioCourse) {
  return course.modules.some((module) => module.lessons.some((lesson) => !getString(lesson, "voiceover") && !lesson.content));
}

function courseHasMissingDurations(course: StudioCourse) {
  return course.modules.some((module) => module.lessons.some((lesson) => !lesson.durationMin));
}

function courseCommandCount(course: StudioCourse) {
  const courseCommands = Array.isArray((course as unknown as Record<string, unknown>).commands)
    ? ((course as unknown as Record<string, unknown>).commands as unknown[]).length
    : 0;
  const lessonCommands = course.modules.reduce((total, module) =>
    total + module.lessons.filter((lesson) => Boolean(getString(lesson, "linkedCommands"))).length, 0);
  return courseCommands + lessonCommands;
}

function courseComboCount(course: StudioCourse) {
  const courseCombos = Array.isArray((course as unknown as Record<string, unknown>).combos)
    ? ((course as unknown as Record<string, unknown>).combos as unknown[]).length
    : 0;
  const lessonCombos = course.modules.reduce((total, module) =>
    total + module.lessons.filter((lesson) => Boolean(getString(lesson, "linkedCombos"))).length, 0);
  return courseCombos + lessonCombos;
}

function courseUpdatedAt(course: StudioCourse) {
  return getString(course, "updated_at") || getString(course, "updatedAt") || "";
}

function courseHealthLabel(course: StudioCourse) {
  const score = healthScore(courseHealth(course));
  let issue = "Ready";
  if (courseHasMissingVideo(course)) issue = "Missing videos";
  else if (courseHasMissingScript(course)) issue = "Missing scripts";
  else if (courseHasMissingPractice(course)) issue = "Missing practice";
  else if (courseCommandCount(course) === 0) issue = "No linked commands";
  else if (courseHasMissingDurations(course)) issue = "Missing durations";
  return `${score}% - ${issue}`;
}

function templateModules(template: CourseTemplate): StudioModule[] {
  const titles: Record<CourseTemplate, string[]> = {
    blank: [],
    beginner: [
      "What is this software?",
      "Interface overview",
      "Navigation",
      "Starting commands and tools",
      "Selecting objects",
      "Creating basic geometry",
      "Editing geometry",
      "Organising work",
      "Common mistakes",
      "Practice project",
    ],
    command: [
      "What problem does this command solve?",
      "Inputs and outputs",
      "Basic use",
      "Options",
      "Common mistakes",
      "Real project example",
      "Practice task",
    ],
    workflow: [
      "The design problem",
      "Commands needed",
      "Step-by-step workflow",
      "Troubleshooting",
      "Variations",
      "Practice challenge",
    ],
  };

  if (template === "blank") return [];
  return [
    {
      id: makeId("module"),
      title: template === "beginner" ? "Foundations" : template === "command" ? "Command Method" : "Workflow Build",
      lessons: titles[template].map((title) => ({
        id: makeId("lesson"),
        title,
        video: "",
        videoId: "",
        image: "",
        content: "",
        durationMin: null,
        resources: [],
        status: "Idea",
        accessLevel: "Free",
      })),
    },
  ];
}

export function CoursesTab({ accessToken }: { accessToken: string }) {
  const [payload, setPayload] = useState<StudioPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("Saved");
  const [query, setQuery] = useState("");
  const [softwareFilter, setSoftwareFilter] = useState("All");
  const [pathFilter, setPathFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [accessFilter, setAccessFilter] = useState("All");
  const [healthFilter, setHealthFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeView, setActiveView] = useState<CourseView>("all");
  const [courseColumnPreset, setCourseColumnPreset] = useState<CourseColumnPreset>("overview");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseTab, setCourseTab] = useState<CourseTab>("curriculum");
  const [lessonTab, setLessonTab] = useState<LessonTab>("plan");
  const [lessonSelection, setLessonSelection] = useState<LessonSelection | null>(null);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [template, setTemplate] = useState<CourseTemplate>("blank");
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [aiBusy, setAiBusy] = useState<AiTask | "">("");

  const timerRef = useRef<number | null>(null);
  const savingRef = useRef(false);
  const queuedRef = useRef(false);
  const payloadRef = useRef<StudioPayload | null>(null);
  const dirtyRef = useRef(false);
  const persistRef = useRef<(snapshot: StudioPayload) => Promise<void>>(async () => {});

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  }), [accessToken]);

  useEffect(() => {
    let alive = true;
    fetchJson<StudioPayload>("/api/v1/admin/content-studio", { headers })
      .then((data) => {
        if (!alive) return;
        setPayload(data);
        payloadRef.current = data;
        setSelectedCourseId(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Courses failed to load.");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [headers]);

  useEffect(() => {
    payloadRef.current = payload;
  }, [payload]);

  useEffect(() => {
    if (saveState !== "Unsaved changes" || !payload) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const snap = payloadRef.current;
      if (snap) void persistRef.current(snap);
    }, 900);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [saveState, payload]);

  async function persist(snapshot: StudioPayload) {
    if (savingRef.current) {
      queuedRef.current = true;
      return;
    }
    savingRef.current = true;
    setSaveState("Saving...");
    try {
      const saved = await fetchJson<StudioPayload>("/api/v1/admin/content-studio", {
        method: "PUT",
        headers,
        body: JSON.stringify(snapshot),
        timeoutMs: 20_000,
      });
      setPayload(saved);
      payloadRef.current = saved;
      dirtyRef.current = false;
      setSaveState("Saved");
    } catch (err) {
      setSaveState("Error saving");
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      savingRef.current = false;
      if (queuedRef.current) {
        queuedRef.current = false;
        const next = payloadRef.current;
        if (next && dirtyRef.current) void persist(next);
      }
    }
  }

  persistRef.current = persist;

  function updatePayload(mutator: (draft: StudioPayload) => void) {
    if (!payload) return;
    const next = structuredClone(payload);
    mutator(next);
    setPayload(next);
    payloadRef.current = next;
    dirtyRef.current = true;
    setSaveState("Unsaved changes");
  }

  function saveNow() {
    const snap = payloadRef.current;
    if (snap) void persist(snap);
  }

  function updateCourse(courseId: string, patch: Partial<StudioCourse> & Record<string, unknown>) {
    const current = payloadRef.current?.items.find((item) => item.id === courseId);
    const wantsPublish = patch.status === "Published" || patch.draft === false;
    if (current && wantsPublish) {
      const candidate = { ...current, ...patch };
      if (!courseIsPublishReady(candidate)) {
        setError("This course is still missing required launch content. Complete the Publish checklist before publishing.");
        patch = { ...patch, status: "Draft", draft: true };
      }
    }
    updatePayload((draft) => {
      const course = draft.items.find((item) => item.id === courseId);
      if (course) Object.assign(course, patch);
    });
  }

  function updateModule(courseId: string, moduleId: string, patch: Partial<StudioModule>) {
    updatePayload((draft) => {
      const courseModule = draft.items.find((item) => item.id === courseId)?.modules.find((item) => item.id === moduleId);
      if (courseModule) Object.assign(courseModule, patch);
    });
  }

  function updateLesson(courseId: string, moduleId: string, lessonId: string, patch: Partial<StudioLesson> & Record<string, unknown>) {
    updatePayload((draft) => {
      const lesson = draft.items.find((item) => item.id === courseId)?.modules.find((item) => item.id === moduleId)?.lessons.find((item) => item.id === lessonId);
      if (lesson) Object.assign(lesson, patch);
    });
  }

  async function generateCourseCopy(course: StudioCourse) {
    setAiBusy("course-overview");
    setError("");
    try {
      const result = await fetchJson<AiGenerateResponse>("/api/v1/admin/ai/generate", {
        method: "POST",
        headers,
        timeoutMs: 45_000,
        body: JSON.stringify({
          task: "course-overview",
          context: {
            title: course.title,
            software: course.software,
            level: course.level,
            category: course.category,
            summary: course.summary,
            modules: course.modules.map((module) => ({
              title: module.title,
              lessons: module.lessons.map((lesson) => lesson.title),
            })),
          },
        }),
      });
      updateCourse(course.id, result.fields);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI generation failed.");
    } finally {
      setAiBusy("");
    }
  }

  async function generateLessonContent(task: Exclude<AiTask, "course-overview">, course: StudioCourse, module: StudioModule, lesson: StudioLesson) {
    setAiBusy(task);
    setError("");
    try {
      const result = await fetchJson<AiGenerateResponse>("/api/v1/admin/ai/generate", {
        method: "POST",
        headers,
        timeoutMs: 45_000,
        body: JSON.stringify({
          task,
          context: {
            course: {
              title: course.title,
              software: course.software,
              level: course.level,
              category: course.category,
              summary: course.summary,
            },
            module: { title: module.title },
            lesson: {
              title: lesson.title,
              learningOutcome: getString(lesson, "learningOutcome"),
              content: lesson.content,
              voiceover: getString(lesson, "voiceover"),
              screenAction: getString(lesson, "screenAction"),
              steps: getString(lesson, "steps"),
              linkedCommands: getString(lesson, "linkedCommands"),
              practiceTask: getString(lesson, "practiceTask"),
            },
          },
        }),
      });
      updateLesson(course.id, module.id, lesson.id, result.fields);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI generation failed.");
    } finally {
      setAiBusy("");
    }
  }

  function createCourse() {
    const title = newCourseTitle.trim() || "New Course";
    const course: StudioCourse = {
      id: makeId("course"),
      bucket: "courses",
      title,
      type: "general",
      software: LAUNCH_SOFTWARE[0] ?? "",
      summary: "",
      image: "",
      draft: true,
      category: "",
      level: "Beginner",
      projectDomain: "",
      pathKind: "",
      courseIds: [],
      modules: templateModules(template),
      status: "Draft",
      accessLevel: "Free",
    };
    updatePayload((draft) => {
      draft.items.unshift(course);
    });
    setSelectedCourseId(course.id);
    setCourseTab("overview");
    setNewCourseTitle("");
    setTemplate("blank");
  }

  function deleteCourse(courseId: string) {
    if (!window.confirm("Archive/delete this course from the studio?")) return;
    updatePayload((draft) => {
      draft.items = draft.items.filter((item) => item.id !== courseId);
    });
    setSelectedCourseId(payload?.items.find((item) => item.id !== courseId)?.id ?? null);
  }

  function duplicateCourse(course: StudioCourse) {
    const copy = structuredClone(course);
    copy.id = makeId("course");
    copy.title = `${course.title} Copy`;
    copy.draft = true;
    Object.assign(copy, { status: "Draft" });
    updatePayload((draft) => {
      draft.items.unshift(copy);
    });
    setSelectedCourseId(copy.id);
    setCourseTab("overview");
  }

  function clearCourseFilters() {
    setQuery("");
    setSoftwareFilter("All");
    setPathFilter("All");
    setLevelFilter("All");
    setCategoryFilter("All");
    setStatusFilter("All");
    setAccessFilter("All");
    setHealthFilter("All");
    setActiveView("all");
  }

  function addModule(courseId: string) {
    const title = newModuleTitle.trim() || "New Module";
    const courseModule: StudioModule = { id: makeId("module"), title, lessons: [] };
    updatePayload((draft) => {
      draft.items.find((item) => item.id === courseId)?.modules.push(courseModule);
    });
    setNewModuleTitle("");
  }

  function addLesson(courseId: string, moduleId: string) {
    const lesson: StudioLesson = {
      id: makeId("lesson"),
      title: "New Lesson",
      video: "",
      videoId: "",
      image: "",
      content: "",
      durationMin: null,
      resources: [],
      status: "Idea",
      accessLevel: "Free",
    };
    updatePayload((draft) => {
      draft.items.find((item) => item.id === courseId)?.modules.find((item) => item.id === moduleId)?.lessons.push(lesson);
    });
    setLessonSelection({ courseId, moduleId, lessonId: lesson.id });
    setLessonTab("plan");
  }

  function deleteLesson(courseId: string, moduleId: string, lessonId: string) {
    if (!window.confirm("Delete this lesson?")) return;
    updatePayload((draft) => {
      const courseModule = draft.items.find((item) => item.id === courseId)?.modules.find((item) => item.id === moduleId);
      if (courseModule) courseModule.lessons = courseModule.lessons.filter((lesson) => lesson.id !== lessonId);
    });
    setLessonSelection(null);
  }

  function moveModule(courseId: string, moduleId: string, direction: -1 | 1) {
    updatePayload((draft) => {
      const course = draft.items.find((item) => item.id === courseId);
      if (!course) return;
      const index = course.modules.findIndex((module) => module.id === moduleId);
      course.modules = moveItem(course.modules, index, index + direction);
    });
  }

  function moveLesson(courseId: string, moduleId: string, lessonId: string, direction: -1 | 1) {
    updatePayload((draft) => {
      const courseModule = draft.items.find((item) => item.id === courseId)?.modules.find((item) => item.id === moduleId);
      if (!courseModule) return;
      const index = courseModule.lessons.findIndex((lesson) => lesson.id === lessonId);
      courseModule.lessons = moveItem(courseModule.lessons, index, index + direction);
    });
  }

  function reorderModules(courseId: string, newModules: StudioModule[]) {
    updatePayload((draft) => {
      const course = draft.items.find((item) => item.id === courseId);
      if (course) course.modules = newModules;
    });
  }

  function reorderLessons(courseId: string, moduleId: string, newLessons: StudioLesson[]) {
    updatePayload((draft) => {
      const courseModule = draft.items
        .find((item) => item.id === courseId)
        ?.modules.find((item) => item.id === moduleId);
      if (courseModule) courseModule.lessons = newLessons;
    });
  }

  const courses = payload?.items ?? [];
  const softwareOptions = ["All", ...LAUNCH_SOFTWARE];
  const pathOptions = ["All", ...Array.from(new Set(courses.map((course) => getString(course, "pathKind")).filter(Boolean))).sort()];
  const levelOptions = ["All", ...Array.from(new Set(courses.map((course) => course.level).filter(Boolean))).sort()];
  const categoryOptions = ["All", ...Array.from(new Set(courses.map((course) => course.category).filter(Boolean))).sort()];
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? null;
  const selectedLesson = selectedLessonFrom(payload, lessonSelection);

  const filteredCourses = courses.filter((course) => {
    const haystack = [course.title, course.summary, course.software, course.level, course.category].join(" ").toLowerCase();
    if (query.trim() && !haystack.includes(query.toLowerCase())) return false;
    if (softwareFilter !== "All" && course.software !== softwareFilter) return false;
    if (pathFilter !== "All" && getString(course, "pathKind") !== pathFilter) return false;
    if (levelFilter !== "All" && course.level !== levelFilter) return false;
    if (categoryFilter !== "All" && course.category !== categoryFilter) return false;
    if (statusFilter !== "All" && courseStatus(course) !== statusFilter) return false;
    if (accessFilter !== "All" && getAccess(course) !== accessFilter) return false;
    if (healthFilter === "missing-video" && !courseHasMissingVideo(course)) return false;
    if (healthFilter === "missing-script" && !courseHasMissingScript(course)) return false;
    if (healthFilter === "missing-practice" && !courseHasMissingPractice(course)) return false;
    if (healthFilter === "no-commands" && courseCommandCount(course) > 0) return false;
    const health = courseHealth(course);
    const score = healthScore(health);
    if (activeView === "attention" && score >= 85) return false;
    if (activeView === "drafts" && courseStatus(course) !== "Draft") return false;
    if (activeView === "published" && courseStatus(course) !== "Published") return false;
    if (activeView === "ready" && (score < 85 || courseStatus(course) === "Published")) return false;
    if (activeView === "rhino" && course.software !== "Rhino") return false;
    if (activeView === "grasshopper" && course.software !== "Grasshopper") return false;
    if (activeView === "revit" && course.software !== "Revit") return false;
    if (activeView === "dynamo" && course.software !== "Dynamo") return false;
    if (activeView === "twinmotion" && course.software !== "Twinmotion") return false;
    if (activeView === "unreal" && course.software !== "Unreal Engine") return false;
    if (activeView === "photoshop" && course.software !== "Photoshop") return false;
    if (activeView === "illustrator" && course.software !== "Illustrator") return false;
    if (activeView === "indesign" && course.software !== "InDesign") return false;
    if (activeView === "ai" && course.software !== "AI") return false;
    if (activeView === "missing-videos" && !courseHasMissingVideo(course)) return false;
    if (activeView === "missing-practice" && !courseHasMissingPractice(course)) return false;
    return true;
  });
  const publishedCount = courses.filter((course) => courseStatus(course) === "Published").length;
  const draftCount = courses.filter((course) => courseStatus(course) !== "Published").length;
  const attentionCount = courses.filter((course) => healthScore(courseHealth(course)) < 85).length;
  const readyCount = courses.filter((course) => healthScore(courseHealth(course)) >= 85 && courseStatus(course) !== "Published").length;

  function showColumn(columnId: string) {
    const presets: Record<CourseColumnPreset, string[]> = {
      overview: ["title", "software", "path", "level", "category", "lessons", "status", "access", "health", "updated", "actions"],
      production: ["title", "missingVideo", "missingScript", "missingPractice", "commands", "health", "status", "actions"],
      curriculum: ["title", "path", "modules", "lessons", "commands", "combos", "level", "actions"],
      publishing: ["title", "status", "access", "health", "updated", "actions"],
      audit: ["title", "software", "path", "level", "category", "modules", "lessons", "commands", "combos", "status", "access", "health", "updated", "actions"],
    };
    return presets[courseColumnPreset].includes(columnId);
  }

  const courseColumns: TableColumn<StudioCourse>[] = [
    {
      id: "title",
      label: "Course Title",
      sortValue: (course) => course.title,
      render: (course) => (
        <span className="aa-table-title">
          <strong>{course.title}</strong>
          <span>{course.type || "Core course"} / {lessonCount(course)} lessons</span>
        </span>
      ),
      defaultVisible: showColumn("title"),
    },
    { id: "software", label: "Software", sortValue: (course) => course.software, render: (course) => course.software || <span className="aa-table-muted">None</span>, defaultVisible: showColumn("software") },
    { id: "path", label: "Path", sortValue: (course) => getString(course, "pathKind"), render: (course) => getString(course, "pathKind") || <span className="aa-table-muted">Unassigned</span>, defaultVisible: showColumn("path") },
    { id: "level", label: "Level", sortValue: (course) => course.level ?? "", render: (course) => course.level || <span className="aa-table-muted">None</span>, defaultVisible: showColumn("level") },
    { id: "category", label: "Category", sortValue: (course) => course.category ?? "", render: (course) => course.category || <span className="aa-table-muted">None</span>, defaultVisible: showColumn("category") },
    { id: "modules", label: "Modules", sortValue: (course) => course.modules.length, render: (course) => course.modules.length, defaultVisible: showColumn("modules") },
    { id: "lessons", label: "Lessons", sortValue: lessonCount, render: (course) => lessonCount(course), defaultVisible: showColumn("lessons") },
    { id: "commands", label: "Commands", sortValue: courseCommandCount, render: (course) => courseCommandCount(course), defaultVisible: showColumn("commands") },
    { id: "combos", label: "Combos", sortValue: courseComboCount, render: (course) => courseComboCount(course), defaultVisible: showColumn("combos") },
    { id: "missingVideo", label: "Missing Video", sortValue: (course) => courseHasMissingVideo(course) ? 1 : 0, render: (course) => courseHasMissingVideo(course) ? "Yes" : <span className="aa-table-muted">No</span>, defaultVisible: showColumn("missingVideo") },
    { id: "missingScript", label: "Missing Script", sortValue: (course) => courseHasMissingScript(course) ? 1 : 0, render: (course) => courseHasMissingScript(course) ? "Yes" : <span className="aa-table-muted">No</span>, defaultVisible: showColumn("missingScript") },
    { id: "missingPractice", label: "Missing Practice", sortValue: (course) => courseHasMissingPractice(course) ? 1 : 0, render: (course) => courseHasMissingPractice(course) ? "Yes" : <span className="aa-table-muted">No</span>, defaultVisible: showColumn("missingPractice") },
    { id: "status", label: "Status", sortValue: (course) => courseStatus(course), render: (course) => <StatusBadge status={courseStatus(course)} />, defaultVisible: showColumn("status") },
    { id: "access", label: "Access", sortValue: (course) => getAccess(course), render: (course) => <AccessBadge access={getAccess(course)} />, defaultVisible: showColumn("access") },
    {
      id: "health",
      label: "Health",
      sortValue: (course) => healthScore(courseHealth(course)),
      render: (course) => {
        const health = courseHealth(course);
        const score = healthScore(health);
        return <span className={`aa-health-pill${score >= 85 ? " good" : score >= 55 ? " warn" : " bad"}`}>{courseHealthLabel(course)}</span>;
      },
      defaultVisible: showColumn("health"),
    },
    { id: "updated", label: "Updated", sortValue: courseUpdatedAt, render: (course) => courseUpdatedAt(course) ? new Date(courseUpdatedAt(course)).toLocaleDateString() : <span className="aa-table-muted">Not tracked</span>, defaultVisible: showColumn("updated") },
    {
      id: "actions",
      label: "Actions",
      render: (course) => (
        <span className="aa-row-action-set" onClick={(event) => event.stopPropagation()}>
          <button type="button" onClick={() => setSelectedCourseId(course.id)}>Edit</button>
          <MoreMenu>
            <button type="button" onClick={() => window.open("/catalog", "_blank")}>Preview</button>
            <button type="button" onClick={() => duplicateCourse(course)}>Duplicate</button>
            <button type="button" onClick={() => updateCourse(course.id, { status: "Archived", draft: true })}>Archive</button>
            <button type="button" className="danger" onClick={() => deleteCourse(course.id)}>Delete</button>
          </MoreMenu>
        </span>
      ),
      defaultVisible: showColumn("actions"),
    },
  ];

  if (loading) return <div className="st-loading">Loading course studio...</div>;

  return (
    <div className="aa-courses-page">
      <PageHeader
        eyebrow="Create"
        title="Courses"
        description="Create and manage the course catalogue without editing database records directly."
        action={(
          <div className="aa-action-cluster">
            <button type="button" className="aa-primary-button" onClick={createCourse}>+ New Course</button>
            <CsvBulkActions entity="courses" accessToken={accessToken} />
          </div>
        )}
      />

      <div className="aa-course-summary-strip">
        <span>{courses.length} courses</span>
        <span>{publishedCount} published</span>
        <span>{draftCount} drafts</span>
        <span>{attentionCount} need attention</span>
        <span>{readyCount} ready to publish</span>
      </div>

      {error && <div className="st-notice st-notice--err">{error} <button type="button" onClick={() => setError("")}>x</button></div>}

      <div className="aa-course-views">
        <label>
          <span>View</span>
          <select value={activeView} onChange={(event) => setActiveView(event.target.value as CourseView)}>
            {COURSE_VIEWS.map((view) => <option key={view.id} value={view.id}>{view.label}</option>)}
          </select>
        </label>
      </div>

      <div className="aa-course-filter-bar">
        <label className="aa-compact-search">
          <span>Search</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Course title, software, category..." />
        </label>
        <label>
          <span>Software</span>
          <select value={softwareFilter} onChange={(event) => setSoftwareFilter(event.target.value)}>{softwareOptions.map((option) => <option key={option}>{option}</option>)}</select>
        </label>
        <label>
          <span>Path</span>
          <select value={pathFilter} onChange={(event) => setPathFilter(event.target.value)}>{pathOptions.map((option) => <option key={option}>{option}</option>)}</select>
        </label>
        <label>
          <span>Level</span>
          <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>{levelOptions.map((option) => <option key={option}>{option}</option>)}</select>
        </label>
        <label>
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All</option>{STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select>
        </label>
        <label>
          <span>Access</span>
          <select value={accessFilter} onChange={(event) => setAccessFilter(event.target.value)}><option>All</option>{ACCESS_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select>
        </label>
        <label>
          <span>Health</span>
          <select value={healthFilter} onChange={(event) => setHealthFilter(event.target.value)}>
            <option value="All">All</option>
            <option value="missing-video">Missing video</option>
            <option value="missing-script">Missing script</option>
            <option value="missing-practice">Missing practice</option>
            <option value="no-commands">No commands</option>
          </select>
        </label>
        <details className="aa-more-filters">
          <summary>More Filters</summary>
          <div>
            <label><span>Category</span><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>{categoryOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label><span>New title</span><input value={newCourseTitle} onChange={(event) => setNewCourseTitle(event.target.value)} placeholder="New course title..." /></label>
            <label><span>Template</span><select value={template} onChange={(event) => setTemplate(event.target.value as CourseTemplate)}><option value="blank">Blank</option><option value="beginner">Beginner Software Course</option><option value="command">Command-Based Course</option><option value="workflow">Workflow Combo Course</option></select></label>
            <button type="button" onClick={createCourse}>Create from template</button>
          </div>
        </details>
        <button type="button" className="aa-clear-filters" onClick={clearCourseFilters}>Clear Filters</button>
      </div>

      <div className="aa-course-table-controls">
        <div className="aa-course-column-presets">
          <label>
            <span>Columns</span>
            <select value={courseColumnPreset} onChange={(event) => setCourseColumnPreset(event.target.value as CourseColumnPreset)}>
              {COURSE_COLUMN_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      <AdminDataTable
        key={courseColumnPreset}
        rows={filteredCourses}
        columns={courseColumns}
        selectedIds={selectedCourseIds}
        onSelectedIdsChange={setSelectedCourseIds}
        onRowClick={(course) => setSelectedCourseId(course.id)}
        getRowLabel={(course) => course.title}
        bulkActions={(
          <>
            <button type="button" onClick={() => selectedCourseIds.forEach((id) => updateCourse(id, { status: "Draft", draft: true }))}>Make Draft</button>
            <button type="button" onClick={() => selectedCourseIds.forEach((id) => updateCourse(id, { status: "Published", draft: false }))}>Publish</button>
            <button type="button" onClick={() => selectedCourseIds.forEach((id) => updateCourse(id, { status: "Archived", draft: true }))}>Archive</button>
          </>
        )}
        empty={(
          <EmptyState
            title="No courses match this view"
            description="Courses are the main creation area. Clear filters or start a new course from a template."
            action={<button type="button" className="aa-primary-button" onClick={createCourse}>+ Add Course</button>}
          />
        )}
      />

      {selectedCourse && (
        <div className="aa-drawer-backdrop" role="presentation">
          <aside className="aa-editor-drawer" aria-label="Course editor">
            <section className="aa-course-editor">
          {selectedCourse ? (
            <>
              <CourseHeader
                course={selectedCourse}
                saveState={saveState}
                onSave={saveNow}
                onPatch={(patch) => updateCourse(selectedCourse.id, patch)}
                onDelete={() => deleteCourse(selectedCourse.id)}
                onClose={() => setSelectedCourseId(null)}
              />

              <div className="aa-tabs" role="tablist" aria-label="Course editor">
                {COURSE_TABS.map((tab) => (
                  <button key={tab.id} type="button" className={courseTab === tab.id ? "active" : ""} onClick={() => setCourseTab(tab.id)}>{tab.label}</button>
                ))}
              </div>

              <div className="aa-editor-body">
                {courseTab === "overview" && (
                  <CourseOverview
                    accessToken={accessToken}
                    course={selectedCourse}
                    payload={payload}
                    aiBusy={aiBusy === "course-overview"}
                    onGenerate={() => void generateCourseCopy(selectedCourse)}
                    onPatch={(patch) => updateCourse(selectedCourse.id, patch)}
                  />
                )}
                {courseTab === "curriculum" && (
                  <CurriculumBuilder
                    course={selectedCourse}
                    newModuleTitle={newModuleTitle}
                    onNewModuleTitle={setNewModuleTitle}
                    onAddModule={() => addModule(selectedCourse.id)}
                    onPatchModule={(moduleId, patch) => updateModule(selectedCourse.id, moduleId, patch)}
                    onReorderModules={(newModules) => reorderModules(selectedCourse.id, newModules)}
                    onReorderLessons={(moduleId, newLessons) => reorderLessons(selectedCourse.id, moduleId, newLessons)}
                    onAddLesson={(moduleId) => addLesson(selectedCourse.id, moduleId)}
                    onOpenLesson={(moduleId, lessonId) => setLessonSelection({ courseId: selectedCourse.id, moduleId, lessonId })}
                  />
                )}
                {courseTab === "lessons" && <LessonProductionList course={selectedCourse} onOpenLesson={(moduleId, lessonId) => setLessonSelection({ courseId: selectedCourse.id, moduleId, lessonId })} />}
                {courseTab === "commands" && <RelationshipPanel title="Linked Commands" description="Connect reusable command cards to lessons from the lesson drawer. This keeps commands reusable across the platform." />}
                {courseTab === "combos" && <RelationshipPanel title="Linked Workflow Combos" description="Workflow combos are reusable recipes. Link them where a lesson teaches a repeatable sequence." />}
                {courseTab === "resources" && <RelationshipPanel title="Resources" description="Exercise files, templates, reference images and links can be attached to lessons from the lesson drawer." />}
                {courseTab === "access" && (
                  <AccessPanel course={selectedCourse} onPatch={(patch) => updateCourse(selectedCourse.id, patch)} />
                )}
                {courseTab === "publish" && (
                  <PublishPanel course={selectedCourse} onPatch={(patch) => updateCourse(selectedCourse.id, patch)} />
                )}
              </div>
            </>
          ) : (
            <EmptyState
              title="Select a course"
              description="Choose a course from the list or create a new one to start planning the curriculum."
              action={<button type="button" className="st-create-btn" onClick={createCourse}>+ New Course</button>}
            />
          )}
            </section>
          </aside>
        </div>
      )}

      {selectedLesson && (
        <LessonEditorDrawer
          accessToken={accessToken}
          course={selectedLesson.course}
          module={selectedLesson.module}
          lesson={selectedLesson.lesson}
          activeTab={lessonTab}
          onTabChange={setLessonTab}
          onClose={() => setLessonSelection(null)}
          onDelete={() => deleteLesson(selectedLesson.course.id, selectedLesson.module.id, selectedLesson.lesson.id)}
          onPatch={(patch) => updateLesson(selectedLesson.course.id, selectedLesson.module.id, selectedLesson.lesson.id, patch)}
          aiBusy={aiBusy}
          onGenerate={(task) => void generateLessonContent(task, selectedLesson.course, selectedLesson.module, selectedLesson.lesson)}
        />
      )}
    </div>
  );
}

function CourseHeader({
  course,
  saveState,
  onSave,
  onPatch,
  onDelete,
  onClose,
}: {
  course: StudioCourse;
  saveState: SaveState;
  onSave: () => void;
  onPatch: (patch: Partial<StudioCourse> & Record<string, unknown>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const publishReady = courseIsPublishReady(course);
  return (
    <header className="aa-course-header">
      <div>
        <span className="aa-breadcrumb">Courses / {course.title}</span>
        <h2>{course.title}</h2>
        <div className="aa-meta-line">
          <span>{course.software || "No software"}</span>
          <span>{course.level || "No level"}</span>
          <span>{course.modules.length} modules</span>
          <span>{lessonCount(course)} lessons</span>
          <span>{minutesForCourse(course) || 0} min</span>
        </div>
      </div>
      <div className="aa-course-actions">
        <StatusBadge status={courseStatus(course)} />
        <AccessBadge access={getAccess(course)} />
        <SaveStatusIndicator state={saveState} />
        <button type="button" className="aa-secondary-button" onClick={onClose}>Close</button>
        <button type="button" className="st-save-btn" onClick={onSave}>Save</button>
        <button
          type="button"
          className="st-publish-btn"
          disabled={!publishReady}
          title={publishReady ? "Publish this course" : "Complete required publish checks first"}
          onClick={() => onPatch({ draft: false, status: "Published" })}
        >
          {publishReady ? "Publish Changes" : "Not Ready"}
        </button>
        <MoreMenu>
          <button type="button">Duplicate course</button>
          <button type="button" onClick={() => onPatch({ status: "Archived", draft: true })}>Archive course</button>
          <button type="button">View public page</button>
          <button type="button" className="danger" onClick={onDelete}>Delete course</button>
        </MoreMenu>
      </div>
    </header>
  );
}

function CourseOverview({
  accessToken,
  course,
  payload,
  aiBusy,
  onGenerate,
  onPatch,
}: {
  accessToken: string;
  course: StudioCourse;
  payload: StudioPayload | null;
  aiBusy: boolean;
  onGenerate: () => void;
  onPatch: (patch: Partial<StudioCourse> & Record<string, unknown>) => void;
}) {
  const health = courseHealth(course);
  return (
    <div className="aa-overview-grid">
      <section className="aa-panel">
        <div className="aa-panel-head aa-panel-head-actions">
          <div>
            <h3>Course Promise</h3>
            <p>What the learner gets from this course.</p>
          </div>
          <button type="button" className="aa-secondary-button" onClick={onGenerate} disabled={aiBusy}>
            {aiBusy ? "Generating..." : "AI draft copy"}
          </button>
        </div>
        <div className="aa-form-grid">
          <label><span>Course title</span><input value={course.title} onChange={(event) => onPatch({ title: event.target.value })} /></label>
          <label><span>Slug / ID</span><input value={course.id} disabled /></label>
          <label className="span-2"><span>Short description</span><textarea rows={3} value={course.summary ?? ""} onChange={(event) => onPatch({ summary: event.target.value })} /></label>
          <label className="span-2"><span>Course promise</span><textarea rows={3} value={getString(course, "coursePromise")} onChange={(event) => onPatch({ coursePromise: event.target.value })} /></label>
          <label className="span-2"><span>Learning outcome</span><textarea rows={3} value={getString(course, "learningOutcome")} onChange={(event) => onPatch({ learningOutcome: event.target.value })} /></label>
          <label><span>Software</span><select value={course.software} onChange={(event) => onPatch({ software: event.target.value })}><option value="">No software</option>{LAUNCH_SOFTWARE.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Level</span><select value={course.level ?? ""} onChange={(event) => onPatch({ level: event.target.value })}><option value="">No level</option>{LEVEL_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Category</span><select value={course.category ?? ""} onChange={(event) => onPatch({ category: event.target.value })}><option value="">No category</option>{payload?.categories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Status</span><select value={courseStatus(course)} onChange={(event) => onPatch({ status: event.target.value, draft: event.target.value !== "Published" })}>{STATUS_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Access level</span><select value={getAccess(course)} onChange={(event) => onPatch({ accessLevel: event.target.value })}>{ACCESS_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Estimated duration</span><input value={`${minutesForCourse(course)} min`} disabled /></label>
          <div className="span-2"><ImageUploadField accessToken={accessToken} label="Thumbnail" folder="course-images" value={course.image ?? ""} onChange={(value) => onPatch({ image: value })} /></div>
        </div>
      </section>
      <section className="aa-panel">
        <div className="aa-panel-head"><h3>Course Health</h3><p>Missing content before publishing.</p></div>
        <ContentHealthSummary items={health} />
        <HealthChecklist items={health} />
      </section>
    </div>
  );
}

// CurriculumBuilder is now in ./curriculum-builder.tsx (with drag-and-drop)

function LessonProductionList({ course, onOpenLesson }: { course: StudioCourse; onOpenLesson: (moduleId: string, lessonId: string) => void }) {
  const lessons = course.modules.flatMap((module) => module.lessons.map((lesson) => ({ module, lesson })));
  return (
    <section className="aa-panel">
      <div className="aa-panel-head"><h3>Lesson Production</h3><p>Scan video, script and duration gaps across the course.</p></div>
      <div className="aa-production-list">
        {lessons.map(({ module, lesson }) => (
          <button key={lesson.id} type="button" onClick={() => onOpenLesson(module.id, lesson.id)}>
            <strong>{lesson.title}</strong>
            <span>{module.title}</span>
            <StatusBadge status={getStatus(lesson, lessonHasVideo(lesson) ? "Draft" : "Needs Video")} />
            <small>{missingHealth(lessonHealth(lesson)).map((item) => item.label).join(", ") || "Ready"}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function RelationshipPanel({ title, description }: { title: string; description: string }) {
  return (
    <EmptyState
      title={title}
      description={description}
      action={<button type="button" className="st-create-btn">Connect from Lesson Editor</button>}
    />
  );
}

function AccessPanel({ course, onPatch }: { course: StudioCourse; onPatch: (patch: Record<string, unknown>) => void }) {
  return (
    <section className="aa-panel aa-narrow-panel">
      <div className="aa-panel-head"><h3>Pricing / Access</h3><p>Make it clear who can see this course.</p></div>
      <div className="aa-form-grid single">
        <label><span>Access level</span><select value={getAccess(course)} onChange={(event) => onPatch({ accessLevel: event.target.value })}>{ACCESS_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Certificate enabled</span><select value={getString(course, "certificateEnabled", "No")} onChange={(event) => onPatch({ certificateEnabled: event.target.value })}><option>No</option><option>Yes</option></select></label>
      </div>
    </section>
  );
}

function PublishPanel({ course, onPatch }: { course: StudioCourse; onPatch: (patch: Record<string, unknown>) => void }) {
  const health = courseHealth(course);
  const missing = missingHealth(health);
  const publishReady = courseIsPublishReady(course);
  return (
    <section className="aa-panel aa-publish-panel">
      <div className="aa-panel-head"><h3>Publish</h3><p>Review required fields before learners see this course.</p></div>
      <ContentHealthSummary items={health} />
      {missing.length > 0 ? (
        <div className="aa-publish-warning">
          <strong>This course is not ready to publish.</strong>
          <ul>{missing.map((item) => <li key={item.label}>{item.label}</li>)}</ul>
        </div>
      ) : (
        <div className="aa-publish-ready">This course is ready to publish.</div>
      )}
      <HealthChecklist items={health} />
      <div className="aa-publish-actions">
        <select value={courseStatus(course)} onChange={(event) => onPatch({ status: event.target.value, draft: event.target.value !== "Published" })}>{STATUS_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select>
        <button
          type="button"
          className="st-publish-btn"
          disabled={!publishReady}
          title={publishReady ? "Publish this course" : "Complete required publish checks first"}
          onClick={() => onPatch({ status: "Published", draft: false })}
        >
          Publish Course
        </button>
      </div>
    </section>
  );
}

// LessonEditorDrawer is now in ./lesson-editor-drawer.tsx
