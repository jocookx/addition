"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import type { StudioCourse, StudioLesson, StudioModule } from "@/domain/content-studio";
import { EmptyState, StatusBadge, missingHealth } from "./studio-ui";
import { lessonHealth } from "./dashboard-tab";

// ── helpers ──────────────────────────────────────────────────────────────────

function getString(record: unknown, key: string, fallback = ""): string {
  if (!record || typeof record !== "object") return fallback;
  const value = (record as Record<string, unknown>)[key];
  return typeof value === "string" ? value : fallback;
}

function lessonHasVideo(lesson: StudioLesson): boolean {
  return Boolean(
    (lesson as unknown as Record<string, unknown>).videoId || lesson.video,
  );
}

function getStatus(record: unknown): string {
  return getString(record, "status") || (lessonHasVideo(record as StudioLesson) ? "Draft" : "Needs Video");
}

// ── drag handle icon ──────────────────────────────────────────────────────────

function GripIcon() {
  return (
    <svg className="aa-grip-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="4"  r="1.3" />
      <circle cx="5" cy="8"  r="1.3" />
      <circle cx="5" cy="12" r="1.3" />
      <circle cx="11" cy="4"  r="1.3" />
      <circle cx="11" cy="8"  r="1.3" />
      <circle cx="11" cy="12" r="1.3" />
    </svg>
  );
}

// ── sortable lesson row ───────────────────────────────────────────────────────

function SortableLesson({
  lesson,
  moduleIndex,
  lessonIndex,
  onOpen,
}: {
  lesson: StudioLesson;
  moduleIndex: number;
  lessonIndex: number;
  onOpen: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : undefined,
  };

  const health = lessonHealth(lesson);
  const missing = missingHealth(health);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`aa-lesson-row${isDragging ? " is-dragging" : ""}`}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpen(); }}
    >
      {/* Drag handle — stops the click from also opening the lesson */}
      <span
        className="aa-drag-handle"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        aria-label="Drag to reorder"
      >
        <GripIcon />
      </span>

      <span className="aa-lesson-number">{moduleIndex + 1}.{lessonIndex + 1}</span>
      <strong>{lesson.title}</strong>
      <span>{lesson.durationMin ? `${lesson.durationMin} min` : "No duration"}</span>
      <StatusBadge status={getStatus(lesson)} />
      {missing.length > 0 && <small>{missing[0].label}</small>}
    </div>
  );
}

// ── sortable module ───────────────────────────────────────────────────────────

function SortableModule({
  module,
  moduleIndex,
  onPatch,
  onAddLesson,
  onOpenLesson,
  onReorderLessons,
}: {
  module: StudioModule;
  moduleIndex: number;
  onPatch: (patch: Partial<StudioModule>) => void;
  onAddLesson: () => void;
  onOpenLesson: (lessonId: string) => void;
  onReorderLessons: (newLessons: StudioLesson[]) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : undefined,
  };

  const lessonIds = module.lessons.map((l) => l.id);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleLessonDragEnd(event: DragEndEvent) {
    setActiveLessonId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = module.lessons.findIndex((l) => l.id === active.id);
    const newIndex = module.lessons.findIndex((l) => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorderLessons(arrayMove(module.lessons, oldIndex, newIndex));
  }

  const activeLesson = activeLessonId ? module.lessons.find((l) => l.id === activeLessonId) : null;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`aa-module-section${isDragging ? " is-dragging" : ""}`}
    >
      <div className="aa-module-head">
        {/* Module drag handle */}
        <span
          className="aa-drag-handle aa-drag-handle--module"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder module"
        >
          <GripIcon />
        </span>

        <span className="aa-module-badge">Module {moduleIndex + 1}</span>
        <input
          value={module.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          onClick={(e) => e.stopPropagation()}
        />
        <button
          type="button"
          className="st-create-btn aa-add-lesson-btn"
          onClick={onAddLesson}
        >
          + Lesson
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e: DragStartEvent) => setActiveLessonId(e.active.id as string)}
        onDragEnd={handleLessonDragEnd}
      >
        <SortableContext items={lessonIds} strategy={verticalListSortingStrategy}>
          <div className="aa-lesson-rows">
            {module.lessons.length === 0 ? (
              <button
                type="button"
                className="aa-empty-row"
                onClick={onAddLesson}
              >
                No lessons yet — add the first one.
              </button>
            ) : (
              module.lessons.map((lesson, i) => (
                <SortableLesson
                  key={lesson.id}
                  lesson={lesson}
                  moduleIndex={moduleIndex}
                  lessonIndex={i}
                  onOpen={() => onOpenLesson(lesson.id)}
                />
              ))
            )}
          </div>
        </SortableContext>

        {/* Ghost while dragging a lesson */}
        <DragOverlay>
          {activeLesson && (
            <div className="aa-lesson-row is-overlay">
              <GripIcon />
              <strong>{activeLesson.title}</strong>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </article>
  );
}

// ── main CurriculumBuilder ────────────────────────────────────────────────────

export function CurriculumBuilder({
  course,
  newModuleTitle,
  onNewModuleTitle,
  onAddModule,
  onPatchModule,
  onReorderModules,
  onReorderLessons,
  onAddLesson,
  onOpenLesson,
}: {
  course: StudioCourse;
  newModuleTitle: string;
  onNewModuleTitle: (title: string) => void;
  onAddModule: () => void;
  onPatchModule: (moduleId: string, patch: Partial<StudioModule>) => void;
  onReorderModules: (newModules: StudioModule[]) => void;
  onReorderLessons: (moduleId: string, newLessons: StudioLesson[]) => void;
  onAddLesson: (moduleId: string) => void;
  onOpenLesson: (moduleId: string, lessonId: string) => void;
}) {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const moduleIds = course.modules.map((m) => m.id);

  function handleModuleDragEnd(event: DragEndEvent) {
    setActiveModuleId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = course.modules.findIndex((m) => m.id === active.id);
    const newIndex = course.modules.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorderModules(arrayMove(course.modules, oldIndex, newIndex));
  }

  const activeModule = activeModuleId
    ? course.modules.find((m) => m.id === activeModuleId)
    : null;

  return (
    <section className="aa-panel aa-curriculum-panel">
      <div className="aa-panel-head aa-panel-head-row">
        <div>
          <h3>Curriculum</h3>
          <p>Drag modules and lessons to reorder. Click a lesson to edit it.</p>
        </div>
        <div className="aa-inline-create">
          <input
            value={newModuleTitle}
            onChange={(e) => onNewModuleTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onAddModule(); }}
            placeholder="New module title…"
          />
          <button type="button" className="st-create-btn" onClick={onAddModule}>
            + Add Module
          </button>
        </div>
      </div>

      {course.modules.length === 0 ? (
        <EmptyState
          title="No modules yet"
          description="Modules group lessons into a clear course structure. Add your first module to get started."
          action={
            <button type="button" className="st-create-btn" onClick={onAddModule}>
              + Add Module
            </button>
          }
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(e: DragStartEvent) => setActiveModuleId(e.active.id as string)}
          onDragEnd={handleModuleDragEnd}
        >
          <SortableContext items={moduleIds} strategy={verticalListSortingStrategy}>
            <div className="aa-curriculum-tree">
              {course.modules.map((module, i) => (
                <SortableModule
                  key={module.id}
                  module={module}
                  moduleIndex={i}
                  onPatch={(patch) => onPatchModule(module.id, patch)}
                  onAddLesson={() => onAddLesson(module.id)}
                  onOpenLesson={(lessonId) => onOpenLesson(module.id, lessonId)}
                  onReorderLessons={(newLessons) => onReorderLessons(module.id, newLessons)}
                />
              ))}
            </div>
          </SortableContext>

          {/* Ghost while dragging a whole module */}
          <DragOverlay>
            {activeModule && (
              <div className="aa-module-section is-overlay">
                <div className="aa-module-head">
                  <GripIcon />
                  <span className="aa-module-badge">Module</span>
                  <strong>{activeModule.title}</strong>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </section>
  );
}
