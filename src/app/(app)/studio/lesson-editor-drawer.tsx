"use client";

import type { StudioCourse, StudioLesson, StudioModule } from "@/domain/content-studio";
import { AccessBadge, StatusBadge, ContentHealthSummary, HealthChecklist, MoreMenu } from "./studio-ui";
import { ImageUploadField } from "./image-upload-field";
import { VideoUploadField } from "./video-upload-field";
import { lessonHealth } from "./dashboard-tab";

// ── shared helpers (duplicated from courses-tab to keep this file standalone) ─

const STATUS_OPTIONS = ["Idea", "Draft", "Needs Script", "Needs Video", "Needs Resources", "Ready to Review", "Published", "Archived"] as const;
const ACCESS_OPTIONS = ["Free", "Pro", "Student", "Workshop", "Admin only"] as const;

function getString(record: unknown, key: string, fallback = ""): string {
  if (!record || typeof record !== "object") return fallback;
  const value = (record as Record<string, unknown>)[key];
  return typeof value === "string" ? value : fallback;
}

function getStatus(record: unknown): string {
  const v = getString(record, "status");
  return v || "Draft";
}

function getAccess(record: unknown): string {
  const v = getString(record, "accessLevel", "Free");
  return ACCESS_OPTIONS.includes(v as typeof ACCESS_OPTIONS[number]) ? v : "Free";
}

function lessonHasVideo(lesson: StudioLesson): boolean {
  return Boolean((lesson as unknown as Record<string, unknown>).videoId || lesson.video);
}

// ── types ─────────────────────────────────────────────────────────────────────

type LessonTab =
  | "plan" | "script" | "video" | "steps"
  | "commands" | "combos" | "practice" | "resources" | "publish";

type AiTask = "course-overview" | "lesson-plan" | "lesson-script" | "lesson-steps" | "practice-task";

const LESSON_TABS: { id: LessonTab; label: string }[] = [
  { id: "plan",      label: "Plan" },
  { id: "script",    label: "Script" },
  { id: "video",     label: "Video" },
  { id: "steps",     label: "Steps" },
  { id: "commands",  label: "Commands" },
  { id: "combos",    label: "Combos" },
  { id: "practice",  label: "Practice" },
  { id: "resources", label: "Resources" },
  { id: "publish",   label: "Publish" },
];

// ── sub-components ────────────────────────────────────────────────────────────

function AiActionBar({
  busy,
  label,
  onClick,
}: {
  busy: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="aa-ai-action-bar">
      <div>
        <strong>AI assistant</strong>
        <span>Generate a draft, then review and edit before publishing.</span>
      </div>
      <button
        type="button"
        className="aa-secondary-button"
        onClick={onClick}
        disabled={busy}
      >
        {busy ? "Generating…" : label}
      </button>
    </div>
  );
}

function TextAreaBlock({
  label,
  value,
  help,
  onChange,
}: {
  label: string;
  value: string;
  help?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="aa-panel">
      <div className="aa-panel-head">
        <h3>{label}</h3>
        {help && <p>{help}</p>}
      </div>
      <textarea rows={18} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// ── main export ───────────────────────────────────────────────────────────────

export function LessonEditorDrawer({
  accessToken,
  course,
  module,
  lesson,
  activeTab,
  onTabChange,
  onClose,
  onDelete,
  onPatch,
  aiBusy,
  onGenerate,
}: {
  accessToken: string;
  course: StudioCourse;
  module: StudioModule;
  lesson: StudioLesson;
  activeTab: LessonTab;
  onTabChange: (tab: LessonTab) => void;
  onClose: () => void;
  onDelete: () => void;
  onPatch: (patch: Partial<StudioLesson> & Record<string, unknown>) => void;
  aiBusy: AiTask | "";
  onGenerate: (task: Exclude<AiTask, "course-overview">) => void;
}) {
  const health = lessonHealth(lesson);
  const activeLessonAiTask = aiBusy !== "course-overview" ? aiBusy : "";

  return (
    <div className="aa-drawer-backdrop" role="presentation">
      <aside className="aa-lesson-drawer" aria-label="Lesson editor">

        {/* ── Header ── */}
        <header className="aa-lesson-drawer-head">
          <button type="button" className="aa-drawer-close" onClick={onClose} aria-label="Close">✕</button>
          <div>
            <span className="aa-breadcrumb">
              {course.title} / {module.title}
            </span>
            <h2>{lesson.title}</h2>
            <div className="aa-meta-line">
              <StatusBadge
                status={getStatus(lesson) as Parameters<typeof StatusBadge>[0]["status"]}
              />
              <AccessBadge access={getAccess(lesson) as Parameters<typeof AccessBadge>[0]["access"]} />
              <span>
                {lesson.durationMin ? `${lesson.durationMin} min` : "No duration"}
              </span>
            </div>
          </div>
          <div className="aa-course-actions">
            <MoreMenu>
              <button type="button">Preview Lesson</button>
              <button type="button" className="danger" onClick={onDelete}>
                Delete lesson
              </button>
            </MoreMenu>
          </div>
        </header>

        {/* ── Tabs ── */}
        <div className="aa-tabs aa-tabs-sticky">
          {LESSON_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="aa-lesson-drawer-body">

          {/* Plan */}
          {activeTab === "plan" && (
            <>
              <AiActionBar
                busy={activeLessonAiTask === "lesson-plan"}
                label="AI draft lesson plan"
                onClick={() => onGenerate("lesson-plan")}
              />
              <div className="aa-form-grid">
                <label>
                  <span>Lesson title</span>
                  <input
                    value={lesson.title}
                    onChange={(e) => onPatch({ title: e.target.value })}
                  />
                </label>
                <label>
                  <span>Duration (min)</span>
                  <input
                    type="number"
                    value={lesson.durationMin ?? ""}
                    onChange={(e) =>
                      onPatch({ durationMin: e.target.value ? Number(e.target.value) : null })
                    }
                  />
                </label>
                <label>
                  <span>Status</span>
                  <select
                    value={getStatus(lesson)}
                    onChange={(e) => onPatch({ status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
                <label>
                  <span>Access</span>
                  <select
                    value={getAccess(lesson)}
                    onChange={(e) => onPatch({ accessLevel: e.target.value })}
                  >
                    {ACCESS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
                <label className="span-2">
                  <span>Learning outcome</span>
                  <textarea
                    rows={3}
                    value={getString(lesson, "learningOutcome")}
                    onChange={(e) => onPatch({ learningOutcome: e.target.value })}
                  />
                </label>
                <label className="span-2">
                  <span>Short summary</span>
                  <textarea
                    rows={3}
                    value={lesson.content ?? ""}
                    onChange={(e) => onPatch({ content: e.target.value })}
                  />
                </label>
              </div>
            </>
          )}

          {/* Script */}
          {activeTab === "script" && (
            <>
              <AiActionBar
                busy={activeLessonAiTask === "lesson-script"}
                label="AI draft script"
                onClick={() => onGenerate("lesson-script")}
              />
              <div className="aa-script-grid">
                <label>
                  <span>Voiceover</span>
                  <textarea
                    rows={16}
                    value={getString(lesson, "voiceover", lesson.content ?? "")}
                    onChange={(e) =>
                      onPatch({ voiceover: e.target.value, content: e.target.value })
                    }
                  />
                </label>
                <label>
                  <span>Screen action</span>
                  <textarea
                    rows={16}
                    value={getString(lesson, "screenAction")}
                    onChange={(e) => onPatch({ screenAction: e.target.value })}
                  />
                </label>
                <label>
                  <span>Short-safe ending</span>
                  <textarea
                    rows={4}
                    value={getString(lesson, "shortSafeEnding")}
                    onChange={(e) => onPatch({ shortSafeEnding: e.target.value })}
                  />
                </label>
                <label>
                  <span>Course CTA</span>
                  <textarea
                    rows={4}
                    value={getString(lesson, "courseCta")}
                    onChange={(e) => onPatch({ courseCta: e.target.value })}
                  />
                </label>
              </div>
            </>
          )}

          {/* Video */}
          {activeTab === "video" && (
            <div className="aa-form-grid">
              <div className="span-2">
                <VideoUploadField
                  accessToken={accessToken}
                  videoId={getString(lesson, "videoId")}
                  videoUrl={lesson.video ?? ""}
                  onVideoId={(id) => onPatch({ videoId: id })}
                  onVideoUrl={(url) => onPatch({ video: url })}
                />
              </div>
              <div className="span-2">
                <ImageUploadField
                  accessToken={accessToken}
                  label="Thumbnail / poster image"
                  folder="lesson-images"
                  value={lesson.image ?? ""}
                  onChange={(value) => onPatch({ image: value })}
                />
              </div>
              <label className="span-2">
                <span>Captions / transcript</span>
                <textarea
                  rows={6}
                  value={getString(lesson, "transcript")}
                  onChange={(e) => onPatch({ transcript: e.target.value })}
                />
              </label>
            </div>
          )}

          {/* Steps */}
          {activeTab === "steps" && (
            <>
              <AiActionBar
                busy={activeLessonAiTask === "lesson-steps"}
                label="AI draft steps"
                onClick={() => onGenerate("lesson-steps")}
              />
              <TextAreaBlock
                label="Steps, key concepts & troubleshooting"
                value={getString(lesson, "steps")}
                onChange={(v) => onPatch({ steps: v })}
              />
            </>
          )}

          {/* Commands */}
          {activeTab === "commands" && (
            <TextAreaBlock
              label="Linked commands"
              value={getString(lesson, "linkedCommands")}
              onChange={(v) => onPatch({ linkedCommands: v })}
              help="Add command names. A command picker will replace this in the next iteration."
            />
          )}

          {/* Combos */}
          {activeTab === "combos" && (
            <TextAreaBlock
              label="Linked workflow combos"
              value={getString(lesson, "linkedCombos")}
              onChange={(v) => onPatch({ linkedCombos: v })}
            />
          )}

          {/* Practice */}
          {activeTab === "practice" && (
            <>
              <AiActionBar
                busy={activeLessonAiTask === "practice-task"}
                label="AI draft practice task"
                onClick={() => onGenerate("practice-task")}
              />
              <TextAreaBlock
                label="Practice task"
                value={getString(lesson, "practiceTask")}
                onChange={(v) => onPatch({ practiceTask: v })}
              />
            </>
          )}

          {/* Resources */}
          {activeTab === "resources" && (
            <TextAreaBlock
              label="Resources and downloads"
              value={getString(lesson, "resourceNotes")}
              onChange={(v) => onPatch({ resourceNotes: v })}
            />
          )}

          {/* Publish */}
          {activeTab === "publish" && (
            <div className="aa-panel">
              <div className="aa-panel-head">
                <h3>Lesson Health</h3>
                <p>Use this checklist before publishing the lesson.</p>
              </div>
              <ContentHealthSummary items={health} />
              <HealthChecklist items={health} />
              <button
                type="button"
                className="st-publish-btn"
                onClick={() => onPatch({ status: "Published" })}
              >
                Publish Lesson
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
