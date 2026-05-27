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

type DashboardTabProps = {
  accessToken: string;
  onOpenCourses: () => void;
  onOpenPaths: () => void;
  onOpenWorkshops: () => void;
  onOpenLearners: () => void;
  onOpenResources: () => void;
  onOpenSearchInsights: () => void;
};

export function DashboardTab({
  accessToken,
  onOpenCourses,
  onOpenPaths,
  onOpenWorkshops,
  onOpenLearners,
  onOpenResources,
  onOpenSearchInsights,
}: DashboardTabProps) {
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
  const publishBlockers = stats.missingVideos + stats.missingScripts;
  const nextBestAction = publishBlockers > 0
    ? `${publishBlockers} content fixes before publishing`
    : stats.readyCourses > 0
      ? `${stats.readyCourses} courses ready for final review`
      : "Plan the next course, path or workshop";
  const pipeline = [
    ["Ideas", 0],
    ["Drafts", stats.draftCourses],
    ["Needs Script", stats.missingScripts],
    ["Needs Video", stats.missingVideos],
    ["Ready to Review", stats.readyCourses],
    ["Published", stats.courses.length - stats.draftCourses],
  ] as const;
  const operatingLanes = [
    {
      title: "Content Production",
      body: `${stats.draftCourses} drafts, ${stats.readyCourses} ready for review`,
      action: "Open Courses",
      onClick: onOpenCourses,
    },
    {
      title: "Learning Journeys",
      body: "Order courses into clear paths for learners",
      action: "Open Paths",
      onClick: onOpenPaths,
    },
    {
      title: "Live Delivery",
      body: "Check workshop schedule, joining links and recordings",
      action: "Open Workshops",
      onClick: onOpenWorkshops,
    },
    {
      title: "Learner Access",
      body: "Review plans, student verification and account issues",
      action: "Open Learners",
      onClick: onOpenLearners,
    },
  ];
  const supportActions = [
    { label: "Publish resources", body: "Files, templates and links", onClick: onOpenResources },
    { label: "Review learner searches", body: "Find demand and missing content", onClick: onOpenSearchInsights },
  ];

  if (error) return <div className="st-notice st-notice--err">{error}</div>;

  return (
    <div className="aa-dashboard">
      <PageHeader
        eyebrow="Overview"
        title="CMS Studio"
        description="Run the learning platform from one clear production queue."
        action={<button type="button" className="st-create-btn" onClick={onOpenCourses}>Continue editing</button>}
      />

      <section className="aa-hero-panel">
        <div>
          <span className="aa-eyebrow">Today&apos;s admin focus</span>
          <h2>{nextBestAction}</h2>
          <p>Use this dashboard as the operating room: production, journeys, live delivery, learner access and resources.</p>
        </div>
        <div className="aa-hero-actions">
          <button type="button" className="st-save-btn" onClick={onOpenCourses}>Open production queue</button>
          <button type="button" className="aa-secondary-button" onClick={onOpenWorkshops}>Check live delivery</button>
        </div>
      </section>

      <section className="aa-quick-grid aa-operating-lanes" aria-label="Admin operating lanes">
        {operatingLanes.map((lane) => (
          <button key={lane.title} type="button" className="aa-quick-card" onClick={lane.onClick}>
            <strong>{lane.title}</strong>
            <span>{lane.body}</span>
            <small>{lane.action}</small>
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

        <div className="aa-panel aa-admin-support-panel">
          <div className="aa-panel-head">
            <h3>Support Queue</h3>
            <p>Operational work that keeps the learner experience clean</p>
          </div>
          <div className="aa-support-actions">
            {supportActions.map((item) => (
              <button key={item.label} type="button" onClick={item.onClick}>
                <strong>{item.label}</strong>
                <span>{item.body}</span>
              </button>
            ))}
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
