"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppFrame } from "@/components/legacy/AppFrame";
import type { LearningPathDetail, PathLevel } from "@/domain/learning-path";
import type { LearningSummaryCourse } from "@/domain/learning-summary";
import { getPathDetail, enrolInPath, getMyEnrolments } from "@/lib/api/paths";
import { getLearningSummary } from "@/lib/api/learning-summary";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { useToast } from "@/components/toast/ToastContext";

const LEVEL_LABELS: Record<PathLevel, string> = {
  explorer: "Beginner",
  improver: "Intermediate",
  refiner:  "Advanced",
};

export default function PathDetailPage() {
  const { pathId } = useParams<{ pathId: string }>();
  const router = useRouter();
  const toast = useToast();
  const [path, setPath]           = useState<LearningPathDetail | null>(null);
  const [enrolled, setEnrolled]   = useState(false);
  const [token, setToken]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError]         = useState("");
  const [courseProgress, setCourseProgress] = useState<Map<string, LearningSummaryCourse>>(new Map());

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    supabase.auth.getSession().then(async ({ data }) => {
      const t = data.session?.access_token ?? null;
      setToken(t);
      if (!t) { router.replace(`/auth?next=/paths/${pathId}`); return; }
      const [detail, enrolments, summary] = await Promise.all([
        getPathDetail(pathId).catch((e: unknown) => {
          setError(e instanceof Error ? e.message : "Failed to load");
          return null;
        }),
        getMyEnrolments(t).catch(() => []),
        getLearningSummary(t).catch(() => null),
      ]);
      setPath(detail);
      const isEnrolled = enrolments.some((e) => e.pathId === pathId);
      setEnrolled(isEnrolled);
      if (summary) {
        const map = new Map(summary.courses.map((c) => [c.courseId, c]));
        setCourseProgress(map);
      }
      setLoading(false);
    });
  }, [pathId, router]);

  async function handleEnrol() {
    if (!token) return;
    setEnrolling(true);
    try {
      await enrolInPath(pathId, token);
      setEnrolled(true);
      toast({
        type: "success",
        title: "Path started!",
        body: path?.title ?? "You're enrolled — let's get learning.",
      });
    } catch {
      toast({ type: "error", title: "Couldn't enrol", body: "Please try again." });
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <AppFrame title="" subtitle="" topTabs={[]}>
        <div className="ws-det-loading">
          <div className="ws-loading-pulse" style={{ height: 200 }} />
          <div className="ws-loading-pulse" style={{ height: 320, marginTop: 16 }} />
        </div>
      </AppFrame>
    );
  }

  if (error || !path) {
    return (
      <AppFrame title="" subtitle="" topTabs={[]}>
        <Link href="/paths" className="ws-det-back">← All paths</Link>
        <div className="ws-empty-state">
          <p className="meta">{error || "Path not found"}</p>
        </div>
      </AppFrame>
    );
  }

  const totalMinutes = path.courses.reduce((s, c) => s + c.estimatedMinutes, 0);
  const totalHours = totalMinutes > 0 ? Math.round(totalMinutes / 60 * 10) / 10 : 0;

  // Progress-aware helpers (only meaningful when enrolled)
  const completedCourseIds = new Set(
    path.courses.filter((c) => courseProgress.get(c.id)?.status === "completed").map((c) => c.id)
  );
  const nextCourse = path.courses.find((c) => courseProgress.get(c.id)?.status !== "completed") ?? path.courses[0] ?? null;
  const pathPercent = path.courses.length > 0 ? Math.round((completedCourseIds.size / path.courses.length) * 100) : 0;

  return (
    <AppFrame title="" subtitle="" topTabs={[]}>
      <div className="pdet-page">

        {/* ── Hero image ── */}
        {path.image && (
          <div className="pdet-hero">
            <Image src={path.image} alt={path.title} fill unoptimized style={{ objectFit: "cover" }} />
            <div className="pdet-hero-shade" />
            <div className="pdet-hero-content">
              <Link href="/paths" className="ws-det-back pdet-back">← All paths</Link>
              <div className="pdet-hero-badges">
                <span className={`pl-level-badge pl-level-badge--${path.level}`}>{LEVEL_LABELS[path.level]}</span>
                {path.software.map((sw) => <span key={sw} className="pl-sw-tag pl-sw-tag--hero">{sw}</span>)}
              </div>
              <h1 className="pdet-hero-title">{path.title}</h1>
              {path.audience && <p className="pdet-hero-audience">{path.audience}</p>}
              <div className="pdet-hero-metrics">
                <span>{path.courseCount} course{path.courseCount !== 1 ? "s" : ""}</span>
                {totalHours > 0 && <span>~{totalHours}h of content</span>}
              </div>
            </div>
          </div>
        )}

        {/* ── No image: flat header ── */}
        {!path.image && (
          <div className="pdet-header">
            <Link href="/paths" className="ws-det-back">← All paths</Link>
            <div className="pdet-header-badges">
              <span className={`pl-level-badge pl-level-badge--${path.level}`}>{LEVEL_LABELS[path.level]}</span>
              {path.software.map((sw) => <span key={sw} className="pl-sw-tag">{sw}</span>)}
            </div>
            <h1 className="pdet-header-title">{path.title}</h1>
            {path.audience && <p className="pdet-header-audience">{path.audience}</p>}
            <div className="pdet-hero-metrics">
              <span>{path.courseCount} course{path.courseCount !== 1 ? "s" : ""}</span>
              {totalHours > 0 && <span>~{totalHours}h of content</span>}
            </div>
          </div>
        )}

        {/* ── Body: main + sidebar ── */}
        <div className="pdet-body">

          {/* Main */}
          <div className="pdet-main">

            {path.description && (
              <p className="pdet-desc">{path.description}</p>
            )}

            {path.outcome && (
              <div className="pdet-outcome">
                <p className="pdet-outcome-label">By the end you will be able to</p>
                <p className="pdet-outcome-text">{path.outcome}</p>
              </div>
            )}

            {/* Course sequence */}
            <div className="pdet-courses">
              <h2 className="pdet-section-title">Course sequence</h2>
              {path.courses.length === 0 ? (
                <p className="meta">Courses being added — check back soon.</p>
              ) : (
                path.courses.map((course, idx) => {
                  const prog = courseProgress.get(course.id);
                  const isDone = prog?.status === "completed";
                  const isActive = prog?.status === "active" || (!isDone && course.id === nextCourse?.id && enrolled && (prog?.percentComplete ?? 0) > 0);
                  const pct = prog?.percentComplete ?? 0;
                  return (
                    <div key={course.id} className={`pdet-course-row${isDone ? " is-done" : isActive ? " is-active" : ""}`}>
                      <div className={`pdet-course-step${isDone ? " is-done" : isActive ? " is-active" : ""}`}>
                        {isDone ? (
                          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" aria-hidden="true"><polyline points="17 5 8 14 3 10"/></svg>
                        ) : idx + 1}
                      </div>
                      <div className="pdet-course-info">
                        <div className="pdet-course-type">{course.type} · {course.software}</div>
                        <strong className="pdet-course-title">{course.title}</strong>
                        <div className="pdet-course-meta">
                          {course.lessonCount} lessons · ~{course.estimatedMinutes} min
                          {enrolled && pct > 0 && !isDone && (
                            <span className="pdet-course-pct"> · {pct}% done</span>
                          )}
                        </div>
                        {enrolled && isActive && pct > 0 && (
                          <div className="pdet-course-bar">
                            <div className="pdet-course-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                        )}
                      </div>
                      <Link
                        href={`/learn?course=${encodeURIComponent(course.id)}&path=${encodeURIComponent(pathId)}`}
                        className={`ghost-btn pdet-course-btn${isDone ? " is-done" : ""}`}
                      >
                        {!enrolled ? "Preview →" : isDone ? "Review ✓" : isActive ? "Continue →" : "Start →"}
                      </Link>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Sidebar */}
          <aside className="pdet-sidebar">

            {/* Enrol card */}
            <div className="pdet-sidebar-card">
              <h2 className="pdet-sidebar-card-title">
                {enrolled ? "You're on this path" : "Start this path"}
              </h2>
              {enrolled && path.courses.length > 0 && (
                <div className="pdet-sidebar-progress">
                  <div className="pdet-sidebar-progress-bar">
                    <div className="pdet-sidebar-progress-fill" style={{ width: `${pathPercent}%` }} />
                  </div>
                  <span className="pdet-sidebar-progress-label">
                    {completedCourseIds.size} of {path.courses.length} courses complete
                  </span>
                </div>
              )}
              <p className="pdet-sidebar-card-sub">
                {enrolled
                  ? pathPercent === 100 ? "Path complete! Explore another path to keep growing." : "Continue where you left off. Each course builds on the last."
                  : "Enrol to track your progress through every course in order."}
              </p>
              {enrolled ? (
                nextCourse && (
                  <Link href={`/learn?course=${encodeURIComponent(nextCourse.id)}&path=${encodeURIComponent(pathId)}`} className="primary-button pdet-enrol-btn">
                    {pathPercent === 100 ? "Review path →" : completedCourseIds.size === 0 ? "Start learning →" : "Continue learning →"}
                  </Link>
                )
              ) : (
                <button type="button" className="primary-button pdet-enrol-btn" onClick={() => void handleEnrol()} disabled={enrolling}>
                  {enrolling ? "Enrolling…" : "Enrol — it's free →"}
                </button>
              )}
            </div>

            {/* Facts */}
            <dl className="pdet-facts">
              <div className="pdet-fact-row">
                <dt>Level</dt>
                <dd>{LEVEL_LABELS[path.level]}</dd>
              </div>
              <div className="pdet-fact-row">
                <dt>Courses</dt>
                <dd>{path.courseCount}</dd>
              </div>
              {totalHours > 0 && (
                <div className="pdet-fact-row">
                  <dt>Content</dt>
                  <dd>~{totalHours} hours</dd>
                </div>
              )}
              {path.software.length > 0 && (
                <div className="pdet-fact-row">
                  <dt>Software</dt>
                  <dd>{path.software.join(", ")}</dd>
                </div>
              )}
              {path.audience && (
                <div className="pdet-fact-row">
                  <dt>For</dt>
                  <dd>{path.audience}</dd>
                </div>
              )}
            </dl>

          </aside>
        </div>
      </div>
    </AppFrame>
  );
}
