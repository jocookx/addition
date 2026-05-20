"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "@/lib/api/fetch-json";
import type { StudioPayload } from "@/domain/content-studio";
import { ContentHealthSummary, PageHeader, StatusBadge, type HealthItem } from "./studio-ui";

function hasPlaceholderVideo(video?: string) {
  return Boolean(video?.includes("dQw4w9WgXcQ"));
}

export function lessonHealth(lesson: { title?: string; video?: string; durationMin?: number | null; content?: string }): HealthItem[] {
  return [
    { label: "Lesson title", ok: Boolean(lesson.title?.trim()), severity: "required" },
    { label: "Duration", ok: Boolean(lesson.durationMin), severity: "required" },
    { label: "Real video URL", ok: Boolean(lesson.video?.trim()) && !hasPlaceholderVideo(lesson.video), severity: "required" },
    { label: "Script or notes", ok: Boolean(lesson.content?.trim()), severity: "recommended" },
  ];
}

export function courseHealth(course: StudioPayload["items"][number]): HealthItem[] {
  const lessons = course.modules.flatMap((module) => module.lessons);
  const commands = Array.isArray((course as unknown as { commands?: unknown }).commands)
    ? ((course as unknown as { commands: unknown[] }).commands)
    : [];
  return [
    { label: "Course title", ok: Boolean(course.title?.trim()), severity: "required" },
    { label: "Short description", ok: Boolean(course.summary?.trim()), severity: "required" },
    { label: "Learning outcome", ok: Boolean((course as unknown as { learningOutcome?: string; learning_outcome?: string }).learningOutcome?.trim() || (course as unknown as { learning_outcome?: string }).learning_outcome?.trim()), severity: "required" },
    { label: "Software", ok: Boolean(course.software?.trim()), severity: "required" },
    { label: "Level", ok: Boolean(course.level?.trim()), severity: "recommended" },
    { label: "Thumbnail", ok: Boolean(course.image?.trim()), severity: "recommended" },
    { label: "Modules", ok: course.modules.length > 0, severity: "required" },
    { label: "Lessons", ok: lessons.length > 0, severity: "required" },
    { label: "Real lesson videos", ok: lessons.length > 0 && lessons.every((lesson) => Boolean(lesson.video?.trim()) && !hasPlaceholderVideo(lesson.video)), severity: "required" },
    { label: "Lesson durations", ok: lessons.length > 0 && lessons.every((lesson) => Boolean(lesson.durationMin)), severity: "required" },
    { label: "Linked commands", ok: commands.length > 0, severity: "required" },
  ];
}

export function courseIsPublishReady(course: StudioPayload["items"][number]) {
  return courseHealth(course)
    .filter((item) => item.severity === "required")
    .every((item) => item.ok);
}

export function DashboardTab({ accessToken, onOpenCourses }: { accessToken: string; onOpenCourses: () => void }) {
  const [payload, setPayload] = useState<StudioPayload | null>(null);
  const [error, setError] = useState("");

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  }), [accessToken]);

  useEffect(() => {
    fetchJson<StudioPayload>("/api/v1/admin/content-studio", { headers })
      .then(setPayload)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Dashboard failed to load."));
  }, [headers]);

  const stats = useMemo(() => {
    const courses = payload?.items ?? [];
    const lessons = courses.flatMap((course) => course.modules.flatMap((module) => module.lessons));
    const missingVideos = lessons.filter((lesson) => !lesson.video?.trim() || hasPlaceholderVideo(lesson.video)).length;
    const missingScripts = lessons.filter((lesson) => !lesson.content?.trim()).length;
    const draftCourses = courses.filter((course) => course.draft).length;
    const readyCourses = courses.filter(courseIsPublishReady).length;
    return { courses, lessons, missingVideos, missingScripts, draftCourses, readyCourses };
  }, [payload]);

  const recent = stats.courses.slice(0, 4);
  const pipeline = [
    ["Ideas", 0],
    ["Drafts", stats.draftCourses],
    ["Needs Script", stats.missingScripts],
    ["Needs Video", stats.missingVideos],
    ["Ready to Review", stats.readyCourses],
    ["Published", stats.courses.length - stats.draftCourses],
  ] as const;

  if (error) return <div className="st-notice st-notice--err">{error}</div>;

  return (
    <div className="aa-dashboard">
      <PageHeader
        eyebrow="Overview"
        title="CMS Studio"
        description="Plan, create, connect, review, publish and improve Addition Academy content."
        action={<button type="button" className="st-create-btn" onClick={onOpenCourses}>Continue editing</button>}
      />

      <section className="aa-hero-panel">
        <div>
          <span className="aa-eyebrow">Welcome back</span>
          <h2>Build the next useful learning block.</h2>
          <p>The studio highlights missing videos, missing scripts, drafts and courses that are close to publish-ready.</p>
        </div>
        <button type="button" className="st-save-btn" onClick={onOpenCourses}>Open Courses</button>
      </section>

      <section className="aa-quick-grid">
        {["Plan a Course", "Write a Lesson Script", "Add Command Card", "Create Workflow Combo", "Create Workshop", "Review Learner Searches"].map((label) => (
          <button key={label} type="button" className="aa-quick-card" onClick={label.includes("Course") || label.includes("Lesson") ? onOpenCourses : undefined}>
            <strong>{label}</strong>
            <span>{label.includes("Search") ? "Use learner demand to plan content" : "Start from the studio workflow"}</span>
          </button>
        ))}
      </section>

      <section className="aa-dashboard-grid">
        <div className="aa-panel">
          <div className="aa-panel-head">
            <h3>Production Pipeline</h3>
            <p>Status across the content studio</p>
          </div>
          <div className="aa-pipeline">
            {pipeline.map(([label, count]) => (
              <div key={label} className="aa-pipeline-row">
                <span>{label}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="aa-panel">
          <div className="aa-panel-head">
            <h3>Priority Fixes</h3>
            <p>Clear next actions before publishing</p>
          </div>
          <div className="aa-fix-list">
            <div><strong>{stats.missingVideos}</strong><span>lessons missing videos</span></div>
            <div><strong>{stats.missingScripts}</strong><span>lessons missing scripts or notes</span></div>
            <div><strong>{stats.draftCourses}</strong><span>courses still in draft</span></div>
            <div><strong>{stats.readyCourses}</strong><span>courses close to publish-ready</span></div>
          </div>
        </div>

        <div className="aa-panel aa-panel-wide">
          <div className="aa-panel-head">
            <h3>Recent Courses</h3>
            <p>Open the course editor to continue production</p>
          </div>
          <div className="aa-course-card-grid">
            {recent.map((course) => (
              <button key={course.id} type="button" className="aa-course-card" onClick={onOpenCourses}>
                <div>
                  <StatusBadge status={course.draft ? "Draft" : "Published"} />
                  <strong>{course.title}</strong>
                  <span>{course.software || "No software"} / {course.modules.length} modules / {course.modules.flatMap((module) => module.lessons).length} lessons</span>
                </div>
                <ContentHealthSummary items={courseHealth(course)} />
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
