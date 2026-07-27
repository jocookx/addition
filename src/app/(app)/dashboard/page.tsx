"use client";

/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-img-element --
   Dashboard is a launcher, not a report: Next Up hero, daily rep, this week's
   workshops, progress snapshot, quiet explore links. Ordered by how often the
   moment occurs (reference daily, practice near-daily, study weekly). */

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import type { LearningSummary } from "@/domain/learning-summary";
import type { LearningPathListItem, PathEnrolment, PathLevel } from "@/domain/learning-path";
import type { UserProfile } from "@/domain/user-profile";
import { formatWorkshopCountdown } from "@/domain/workshop-lifecycle";
import { ensureAuthProfile, updateAuthProfile } from "@/lib/api/auth-profile";
import { getBillingCheckoutUrl } from "@/lib/api/billing";
import { getLearningSummary } from "@/lib/api/learning-summary";
import { UpgradeModal } from "@/components/upgrade/UpgradeModal";
import { getPaths, getPathDetail, getMyEnrolments, enrolInPath } from "@/lib/api/paths";
import { getMyRegisteredWorkshops } from "@/lib/api/workshops";
import { getRecentlyViewed, type RecentItem } from "@/lib/recently-viewed";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { AppFrame } from "@/components/legacy/AppFrame";
import { useToast } from "@/components/toast/ToastContext";

// ── Types & helpers ─────────────────────────────────────────────────────────

type DashTab = "home" | "progress" | "assets" | "workshops";
type GatewayIntent = "welcome" | "pro" | "student" | "workshop";

type UpcomingWorkshop = {
  id: string;
  title: string;
  date: string;
  time?: string | null;
  timezone?: string | null;
  duration?: string | null;
  format?: "online" | "in-person";
  image?: string | null;
  price?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  recordingStatus?: "none" | "processing" | "available" | "failed";
  joinUrl?: string;
  recordingUrl?: string;
};

type NextPathCourse = {
  id: string;
  title: string;
  software: string;
  percentComplete: number;
  nextLessonId: string | null;
  courseIndex: number;
  totalCourses: number;
};

type ActivePathSummary = {
  pathId: string;
  title: string;
  level: PathLevel;
  percent: number;
  milestone?: string;
  completedCourses: number;
  totalCourses: number;
  nextCourse: NextPathCourse | null;
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function initials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "U";
  }
  return (email?.[0] || "U").toUpperCase();
}

function formatPlan(plan: string, billing?: string): string {
  const p = plan.charAt(0).toUpperCase() + plan.slice(1);
  if (!billing) return p;
  return `${p} · ${billing.charAt(0).toUpperCase() + billing.slice(1)}`;
}

// ── Sub-components ──────────────────────────────────────────────────────────

function getCohortId(wsId: string) {
  return wsId.replace(/^ws-/, "").replace(/-w\d+[a-z]$/, "");
}

function getWorkshopHref(wsId: string) {
  return `/workshops/${getCohortId(wsId)}`;
}

function isFutureWorkshop(ws: UpcomingWorkshop) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(ws.date);
  date.setHours(0, 0, 0, 0);
  return date >= today;
}

const LEVEL_LABELS: Record<PathLevel, string> = {
  explorer: "Beginner",
  improver: "Intermediate",
  refiner:  "Advanced",
};

/** Hero when user has an active learning path — shows path + what's next course. */
function PathHero({ activePath, onContinue }: {
  activePath: ActivePathSummary;
  onContinue: (courseId: string, lessonId: string | null) => void;
}) {
  const { nextCourse } = activePath;
  const isStarted = (nextCourse?.percentComplete ?? 0) > 0;
  return (
    <div className="home-hero home-path-hero glass-panel">
      <div className="home-hero-body">
        {/* Path identity */}
        <div className="home-path-hero-identity">
          <span className={`pl-level-badge pl-level-badge--${activePath.level}`}>
            {LEVEL_LABELS[activePath.level]}
          </span>
          <span className="home-path-hero-name">{activePath.title}</span>
          <span className="home-path-hero-progress-label">
            {activePath.completedCourses} of {activePath.totalCourses} courses complete
          </span>
        </div>

        {nextCourse ? (
          <>
            <span className="home-hero-eyebrow">What&apos;s Next</span>
            <h2 className="home-hero-course">{nextCourse.title}</h2>
            {nextCourse.software && (
              <span className="home-hero-module">
                {nextCourse.software} · Course {nextCourse.courseIndex + 1} of {nextCourse.totalCourses}
              </span>
            )}
            <div className="home-hero-foot">
              <div className="home-hero-progress">
                <div className="home-hero-bar">
                  <span style={{ width: `${nextCourse.percentComplete}%` }} />
                </div>
                <span>{isStarted ? `${nextCourse.percentComplete}% complete` : "Not started yet"}</span>
              </div>
              <button
                className="primary-button home-hero-cta"
                type="button"
                onClick={() => onContinue(nextCourse.id, nextCourse.nextLessonId)}
              >
                {isStarted ? "Resume Course" : "Start Course"} →
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="home-hero-eyebrow">Path Complete</span>
            <h2 className="home-hero-course">You&apos;ve finished this path</h2>
            <p className="home-hero-why">All courses complete. Explore another path to keep growing.</p>
            <Link href="/paths" className="primary-button home-hero-cta" style={{ textDecoration: "none" }}>
              Explore Paths →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

/** Hero when no path is enrolled — shows last active course or browse prompt. */
function ContinueHero({ course, onContinue }: {
  course: LearningSummary["nextUp"];
  onContinue: (courseId: string, lessonId: string | null) => void;
}) {
  if (!course) {
    // Day-one / free user: lead with the free command library — value before
    // any paywall — with paths as the structured next step.
    return (
      <div className="home-hero home-hero--empty glass-panel">
        <div className="home-hero-body">
          <span className="home-hero-eyebrow">Start Here</span>
          <h2 className="home-hero-course">Learn the commands</h2>
          <p className="home-hero-why">The fastest way in: master the essential commands for your software — free, searchable by what you want to do.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
            <Link href="/commands" className="primary-button home-hero-cta" style={{ textDecoration: "none" }}>
              Browse commands →
            </Link>
            <Link href="/paths" className="ghost-btn home-hero-cta" style={{ textDecoration: "none" }}>
              Find a learning path
            </Link>
          </div>
        </div>
      </div>
    );
  }
  const isStarted = course.percentComplete > 0;
  return (
    <div className="home-hero home-hero--empty glass-panel">
      <div className="home-hero-body">
        <span className="home-hero-eyebrow">{isStarted ? "Continue Learning" : "Start Learning"}</span>
        <h2 className="home-hero-course">{course.title}</h2>
        {course.software && <span className="home-hero-module">{course.software}</span>}
        <div className="home-hero-foot">
          <div className="home-hero-progress">
            <div className="home-hero-bar"><span style={{ width: `${course.percentComplete}%` }} /></div>
            <span>{isStarted ? `${course.percentComplete}% complete` : "Not started yet"}</span>
          </div>
          <button className="primary-button home-hero-cta" type="button"
            onClick={() => onContinue(course.courseId, course.nextLessonId)}>
            {isStarted ? "Resume Lesson" : "Start Lesson"} →
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Daily rep row — the "on the bus" one-tap: streak + what's due, straight
 * into flashcards. Replaces the separate TinyGoal + RecommendedPractice cards.
 */
function DailyRep({ lessonsToday, streak, practiseCount }: {
  lessonsToday: number;
  streak: number;
  practiseCount: number;
}) {
  const goalMet = lessonsToday >= DAILY_GOAL;
  const mins = Math.max(1, Math.round((practiseCount * 15) / 60));
  return (
    <div className="home-rep glass-panel">
      <span className={`home-rep-streak${streak > 0 ? " is-lit" : ""}`} aria-label={`${streak} day streak`}>
        🔥 {streak}
      </span>
      <div className="home-rep-info">
        <span className="home-rep-label">{goalMet ? "Daily goal complete!" : "Daily practice"}</span>
        <span className="home-rep-sub">
          {practiseCount > 0
            ? `${practiseCount} command${practiseCount === 1 ? "" : "s"} due · ~${mins} min`
            : `${lessonsToday}/${DAILY_GOAL} lessons today`}
        </span>
      </div>
      <Link href="/practice" className="primary-button home-rep-cta" style={{ textDecoration: "none" }}>
        Practise →
      </Link>
    </div>
  );
}

/** One-line progress strip; tapping opens the My Progress tab. */
function ProgressSnapshot({ summary, onOpen }: { summary: LearningSummary | null; onOpen: () => void }) {
  if (!summary) return null;
  const t = summary.totals;
  return (
    <button type="button" className="home-snapshot glass-panel" onClick={onOpen}>
      <span className="home-snap-item"><strong>{t.eventsLast7Days}</strong> this week</span>
      <span className="home-snap-item"><strong>{t.completedLessons}</strong> lessons</span>
      <span className="home-snap-item"><strong>{t.masteredCommands}</strong> commands learned</span>
      <span className="home-snap-more">My Progress →</span>
    </button>
  );
}

/**
 * Jump back in — the last commands the user looked up, as one-tap chips.
 * This is what makes the dashboard useful in reference mode: the command
 * you needed at your desk yesterday is right here today.
 */
function JumpBackIn() {
  const [recents, setRecents] = useState<RecentItem[]>([]);
  useEffect(() => {
    // Deferred so the client-only localStorage read happens after hydration
    const t = window.setTimeout(() => setRecents(getRecentlyViewed().slice(0, 5)), 0);
    return () => window.clearTimeout(t);
  }, []);
  if (!recents.length) return null;
  return (
    <div className="home-recents">
      <h3 className="dash-section-title">Jump back in</h3>
      <div className="home-recents-chips">
        {recents.map((r) => (
          <Link
            key={r.id}
            href={`/commands?cmd=${encodeURIComponent(r.id)}`}
            className="home-recent-chip"
          >
            <span className="home-recent-chip-label">{r.label}</span>
            {r.software && <span className="home-recent-chip-sw">{r.software}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Quiet link row for the destinations that used to be full-height cards. */
function ExploreRow() {
  return (
    <nav className="home-explore" aria-label="Explore">
      <Link href="/paths" className="home-explore-link">Learning paths</Link>
      <Link href="/toolkit" className="home-explore-link">Saved toolkit</Link>
      <Link href="/workshops" className="home-explore-link">Workshops</Link>
    </nav>
  );
}

function DashSkeleton() {
  return (
    <div className="home-layout">
      {/* Hero shimmer */}
      <div className="skeleton-card dash-skel-hero">
        <div className="skeleton-line w-40 h-lg" style={{ marginBottom: 10 }} />
        <div className="skeleton-line w-80 h-lg" style={{ marginBottom: 18 }} />
        <div className="skeleton-line w-60" />
        <div className="skeleton-line w-40" style={{ marginTop: 20, height: 36, borderRadius: 8 }} />
      </div>
      {/* Daily rep shimmer */}
      <div className="skeleton-card" style={{ height: 72 }} />
      {/* Snapshot shimmer */}
      <div className="skeleton-card" style={{ height: 52 }} />
    </div>
  );
}

const DAILY_GOAL = 5;

// ── Onboarding wizard ──────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { id: "Architecture student",       label: "Architecture student" },
  { id: "Interior design student",    label: "Interior design student" },
  { id: "Architect",                  label: "Architect" },
  { id: "Interior designer",          label: "Interior designer" },
  { id: "Product designer",           label: "Product designer" },
  { id: "Fashion designer",           label: "Fashion designer" },
  { id: "Other",                      label: "Other" },
];

const SW_OPTIONS = [
  { id: "Rhino",       label: "Rhino 3D",     desc: "3D modelling & NURBS" },
  { id: "Grasshopper", label: "Grasshopper",   desc: "Visual programming" },
  { id: "Revit",       label: "Revit",         desc: "BIM & architecture" },
];

function OnboardingWizard({
  paths,
  token,
  onComplete,
}: {
  paths: LearningPathListItem[];
  token: string;
  onComplete: (enrolledPathId: string | null) => void;
}) {
  const toast = useToast();
  const [step, setStep]               = useState<"role" | "software" | "path">("role");
  const [role, setRole]               = useState("");
  const [software, setSoftware]       = useState("");
  const [pathId, setPathId]           = useState("");
  const [busy, setBusy]               = useState(false);

  const relevantPaths = software
    ? paths.filter((p) => p.software.includes(software))
    : paths;

  async function handleFinish() {
    setBusy(true);
    try {
      if (pathId) await enrolInPath(pathId, token);
      await updateAuthProfile(token, {
        ...(role ? { role } : {}),
        ...(software ? { softwarePreferences: [software] } : {}),
      }).catch(() => {});
    } catch { /* non-critical — proceed */ }
    setBusy(false);
    if (pathId) {
      const pathTitle = paths.find((p) => p.id === pathId)?.title ?? "your path";
      toast({ type: "success", title: "You're on the path!", body: `Starting: ${pathTitle}` });
    } else {
      toast({ type: "success", title: "Welcome to Addition!", body: "Your experience has been personalised." });
    }
    onComplete(pathId || null);
  }

  const stepNum = step === "role" ? 1 : step === "software" ? 2 : 3;

  return (
    <div className="gateway-modal-backdrop" role="presentation" onClick={(e) => e.stopPropagation()}>
      <section className="gateway-modal onboarding-wizard" role="dialog" aria-modal="true">

        {/* Step indicator */}
        <div className="onboarding-steps" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span key={n} className={`onboarding-step-dot${stepNum >= n ? " is-done" : ""}${stepNum === n ? " is-active" : ""}`} />
          ))}
        </div>

        {step === "role" && (
          <>
            <div className="onboarding-logo" aria-hidden="true">+</div>
            <h2>Welcome — let&apos;s personalise your experience</h2>
            <p>How would you describe yourself?</p>
            <div className="onboarding-role-grid">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`onboarding-role-btn${role === opt.id ? " is-selected" : ""}`}
                  onClick={() => setRole(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="gateway-modal-actions">
              <button
                type="button"
                className="primary-button"
                disabled={!role}
                onClick={() => setStep("software")}
              >
                Continue →
              </button>
              <button type="button" className="ghost-btn" onClick={() => onComplete(null)}>
                Skip for now
              </button>
            </div>
          </>
        )}

        {step === "software" && (
          <>
            <h2>What software do you want to learn?</h2>
            <p>We&apos;ll tailor your learning path to match.</p>
            <div className="onboarding-sw-grid">
              {SW_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`onboarding-sw-btn${software === opt.id ? " is-selected" : ""}`}
                  onClick={() => setSoftware(opt.id)}
                >
                  <strong>{opt.label}</strong>
                  <span>{opt.desc}</span>
                </button>
              ))}
            </div>
            <div className="gateway-modal-actions">
              <button
                type="button"
                className="primary-button"
                disabled={!software}
                onClick={() => setStep("path")}
              >
                Continue →
              </button>
              <button type="button" className="ghost-btn" onClick={() => setStep("role")}>
                ← Back
              </button>
            </div>
          </>
        )}

        {step === "path" && (
          <>
            <h2>Pick your starting path</h2>
            <p>You can add more paths any time from your dashboard.</p>
            <div className="onboarding-path-list">
              {relevantPaths.length === 0 ? (
                <p className="meta" style={{ padding: "12px 0" }}>No paths available yet for {software}.</p>
              ) : relevantPaths.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`onboarding-path-btn${pathId === p.id ? " is-selected" : ""}`}
                  onClick={() => setPathId(p.id)}
                >
                  <div className="onboarding-path-btn-body">
                    <span className={`pl-level-badge pl-level-badge--${p.level}`}>
                      {LEVEL_LABELS[p.level] ?? p.level}
                    </span>
                    <strong>{p.title}</strong>
                    <span className="meta">{p.courseCount} course{p.courseCount !== 1 ? "s" : ""}</span>
                  </div>
                  <span className="onboarding-radio" aria-hidden="true">
                    {pathId === p.id ? "●" : "○"}
                  </span>
                </button>
              ))}
            </div>
            <div className="gateway-modal-actions">
              <button
                type="button"
                className="primary-button"
                disabled={busy}
                onClick={() => void handleFinish()}
              >
                {busy ? "Setting up…" : pathId ? "Start learning →" : "Continue →"}
              </button>
              <button type="button" className="ghost-btn" onClick={() => setStep("software")}>
                ← Back
              </button>
            </div>
          </>
        )}

      </section>
    </div>
  );
}


// ── My Workshops section ───────────────────────────────────────────────────

function MyWorkshopsSection({ workshops }: { workshops: UpcomingWorkshop[] }) {
  const future = workshops.filter(isFutureWorkshop);
  // Nothing booked → no placeholder card; the Explore row links to /workshops.
  if (future.length === 0) return null;
  return (
    <div className="my-ws-section">
      <div className="my-ws-header">
        <h3 className="dash-section-title">This Week</h3>
        <Link href="/workshops" className="dash-section-more" style={{ textDecoration: "none" }}>
          View all →
        </Link>
      </div>
      <div className="my-ws-list">
        {future.slice(0, 3).map((ws) => {
          const date = new Date(ws.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
          return (
            <Link
              key={ws.id}
              href={getWorkshopHref(ws.id)}
              className="my-ws-row glass-panel"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              {ws.image
                ? <img className="my-ws-row-img" src={ws.image} alt="" aria-hidden="true" />
                : <span className="my-ws-row-img my-ws-row-img--empty" aria-hidden="true" />}
              <div className="my-ws-row-body">
                <strong className="my-ws-row-title">{ws.title}</strong>
                <span className="my-ws-row-meta">
                  {date}{ws.time ? ` · ${ws.time}` : ""}{ws.duration ? ` · ${ws.duration}` : ""}
                </span>
                <span className="my-ws-row-format">{ws.format === "in-person" ? "In person" : "Online"}</span>
              </div>
              <span className="my-ws-row-cta">View →</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Real progress tab ──────────────────────────────────────────────────────

function ProgressTab({ summary }: { summary: LearningSummary | null }) {
  if (!summary) {
    return <div className="dash-tab-empty glass-panel">Loading your progress…</div>;
  }
  const { totals, courses, activity } = summary;
  const activeCourses = courses.filter((c) => c.status === "active" || c.status === "completed");
  const maxDay = Math.max(...activity.days.map((d) => d.count), 1);

  return (
    <div className="dash-progress">
      {/* Stats */}
      <div className="progress-stats">
        {[
          { label: "Lessons done",    value: totals.completedLessons },
          { label: "Courses done",    value: totals.completedCourses },
          { label: "Day streak",      value: totals.streakDays },
          { label: "Commands practised", value: totals.practicedCommands },
        ].map(({ label, value }) => (
          <div key={label} className="progress-stat glass-panel">
            <span className="progress-stat-value">{value}</span>
            <span className="progress-stat-label">{label}</span>
          </div>
        ))}
      </div>

      {/* Activity bar chart (last 14 days) */}
      {activity.days.length > 0 && (
        <div className="progress-activity glass-panel">
          <h3 className="dash-section-title" style={{ marginBottom: 14 }}>Recent Activity</h3>
          <div className="progress-activity-bars">
            {activity.days.slice(-14).map((d) => (
              <div key={d.day} className="progress-activity-col" title={`${d.day}: ${d.count} actions`}>
                <div
                  className="progress-activity-bar"
                  style={{ height: `${Math.round((d.count / maxDay) * 100)}%` }}
                />
                <span className="progress-activity-label">
                  {new Date(d.day).toLocaleDateString("en-GB", { day: "numeric", month: "short" }).replace(" ", "\n")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course list */}
      {activeCourses.length > 0 && (
        <div className="progress-courses glass-panel">
          <h3 className="dash-section-title" style={{ marginBottom: 14 }}>Courses in progress</h3>
          <div className="progress-course-list">
            {activeCourses.map((c) => (
              <div key={c.courseId} className="progress-course-row">
                <div className="progress-course-info">
                  <strong className="progress-course-title">{c.title}</strong>
                  <span className="progress-course-meta">
                    {c.software} · {c.completedLessons}/{c.totalLessons} lessons
                    {c.status === "completed" && " · ✓ Complete"}
                  </span>
                </div>
                <div className="progress-course-bar-wrap">
                  <div className="progress-course-bar">
                    <span
                      className={`progress-course-fill${c.status === "completed" ? " is-done" : ""}`}
                      style={{ width: `${c.percentComplete}%` }}
                    />
                  </div>
                  <span className="progress-course-pct">{c.percentComplete}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeCourses.length === 0 && totals.completedLessons === 0 && (
        <div className="dash-tab-empty glass-panel">
          <p>Start a course to see your progress here.</p>
          <Link href="/learn" className="primary-button" style={{ textDecoration: "none", display: "inline-flex", marginTop: 12 }}>
            Browse Courses →
          </Link>
        </div>
      )}
    </div>
  );
}

function PathTab({ token }: { token: string }) {
  const router = useRouter();
  const [paths, setPaths]           = useState<LearningPathListItem[]>([]);
  const [enrolments, setEnrolments] = useState<PathEnrolment[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      getPaths().catch(() => [] as LearningPathListItem[]),
      getMyEnrolments(token).catch(() => [] as PathEnrolment[]),
    ]).then(([p, e]) => {
      setPaths(p);
      setEnrolments(e);
      setLoading(false);
    });
  }, [token]);

  if (loading) return <p className="meta">Loading…</p>;

  const enrolledIds = new Set(enrolments.map((e) => e.pathId));
  const myPaths = paths.filter((p) => enrolledIds.has(p.id));

  return (
    <div className="dash-tab-content">
      {myPaths.length === 0 ? (
        <div className="dash-path-empty glass-panel">
          <div className="dash-path-empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18"/><path d="M3 9h12"/><path d="M3 15h8"/><circle cx="19" cy="17" r="3"/><path d="M19 14v3l1.5 1.5"/></svg>
          </div>
          <h3>No paths yet</h3>
          <p>Choose a structured learning path to guide your progression from beginner to expert.</p>
          <Link href="/paths" className="primary-button" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
            Browse Paths →
          </Link>
        </div>
      ) : (
        <div className="dash-path-list">
          {myPaths.map((path) => (
            <div key={path.id} className="dash-path-card glass-panel">
              <div className="dash-path-card-left">
                <span className={`pl-level-badge pl-level-badge--${path.level}`}>
                  {LEVEL_LABELS[path.level] ?? path.level}
                </span>
                <h3 className="dash-path-card-title">{path.title}</h3>
                {path.audience && <p className="dash-path-card-sub">{path.audience}</p>}
                <div className="dash-path-card-meta">
                  {path.software.map((sw) => <span key={sw} className="pl-sw-tag">{sw}</span>)}
                  <span className="dash-path-card-courses">{path.courseCount} course{path.courseCount !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <button
                type="button"
                className="primary-button dash-path-card-cta"
                onClick={() => router.push(`/paths/${path.id}`)}
              >
                Continue →
              </button>
            </div>
          ))}
          <Link href="/paths" className="ghost-btn dash-path-browse" style={{ textDecoration: "none" }}>
            Browse all paths →
          </Link>
        </div>
      )}
    </div>
  );
}

function AssetsTab() {
  return <div className="dash-tab-empty glass-panel">My Assets — coming next.</div>;
}
function WorkshopsTabPanel({ workshops }: { workshops: UpcomingWorkshop[] }) {
  if (!workshops.length) {
    return (
      <div className="dash-tab-empty glass-panel">
        <p>No upcoming workshops yet.</p>
        <Link href="/workshops" className="primary-button" style={{ textDecoration: "none", display: "inline-flex", marginTop: 12 }}>
          Browse workshops →
        </Link>
      </div>
    );
  }

  return (
    <div className="dash-tab-content">
      <div className="dash-ws-list">
        {workshops.map((ws) => {
          const date = new Date(ws.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
          const cohortId = ws.id.replace(/^ws-/, "").replace(/-w\d+[a-z]$/, "");
          return (
            <Link key={ws.id} href={`/workshops/${cohortId}`} className="dash-ws-row glass-panel" style={{ textDecoration: "none", color: "inherit" }}>
              {ws.image
                ? <img className="dash-ws-row-img" src={ws.image} alt="" aria-hidden="true" />
                : <span className="dash-ws-row-img dash-ws-row-img--empty" aria-hidden="true" />}
              <div className="dash-ws-row-body">
                <strong className="dash-ws-row-title">{ws.title}</strong>
                <span className="dash-ws-row-meta">
                  {date}
                  {ws.time ? ` · ${ws.time}${ws.timezone ? ` ${ws.timezone}` : ""}` : ""}
                  {ws.duration ? ` · ${ws.duration}` : ""}
                  {ws.price ? ` · ${ws.price}` : ""}
                </span>
              </div>
              <span className="dash-ws-row-cta">View →</span>
            </Link>
          );
        })}
      </div>
      <Link href="/workshops" className="ghost-btn dash-path-browse" style={{ textDecoration: "none" }}>
        View all workshops →
      </Link>
    </div>
  );
}

function GatewayModal({
  intent,
  billing,
  nextPath,
  busy,
  onClose,
  onContinue,
}: {
  intent: GatewayIntent;
  billing: "monthly" | "yearly";
  nextPath: string | null;
  busy: boolean;
  onClose: () => void;
  onContinue: () => void;
}) {
  const copy = {
    pro: {
      kicker: "Upgrade",
      title: "Complete your Pro setup",
      body: billing === "yearly" ? "Continue to yearly Pro checkout." : "Continue to monthly Pro checkout.",
      action: "Continue to payment",
    },
    student: {
      kicker: "Student access",
      title: "Verify your student status",
      body: "Takes 30 seconds. Use your university email or upload a student ID — we'll confirm your access instantly.",
      action: "Verify now",
    },
    workshop: {
      kicker: "Workshop booking",
      title: "Reserve your workshop place",
      body: "Your account is ready. Continue to the workshop booking step to complete your place.",
      action: "Continue to workshop",
    },
    welcome: {
      kicker: "Welcome to Addition",
      title: "Where do you want to start?",
      body: "Pick a learning path to follow a structured programme, or browse individual courses to start anywhere.",
      action: "Explore Learning Paths",
    },
  }[intent];

  return (
    <div className="gateway-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="gateway-modal" role="dialog" aria-modal="true" aria-labelledby="gateway-modal-title" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="gateway-modal-close" onClick={onClose} aria-label="Close">x</button>
        <span className="gateway-modal-kicker">{copy.kicker}</span>
        <h2 id="gateway-modal-title">{copy.title}</h2>
        <p>{copy.body}</p>
        {nextPath && intent === "workshop" ? <span className="gateway-modal-path">{nextPath.replace("/checkout", "")}</span> : null}
        <div className="gateway-modal-actions">
          <button type="button" className="primary-button" onClick={onContinue} disabled={busy}>
            {busy ? "Opening..." : copy.action}
          </button>
          <button type="button" className="ghost-btn" onClick={onClose}>Not now</button>
        </div>
      </section>
    </div>
  );
}

// ── Tab icons ───────────────────────────────────────────────────────────────

function HomeTabIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function ProgressTabIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}
function PathTabIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3h18"/><path d="M3 9h12"/><path d="M3 15h8"/>
      <circle cx="19" cy="17" r="3"/>
      <path d="M19 14v3l1.5 1.5"/>
    </svg>
  );
}
function AssetsTabIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/>
    </svg>
  );
}
function WorkshopsTabIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );
}

// ── Inner tab bar ──────────────────────────────────────────────────────────

type TabDef = { id: DashTab; label: string; Icon: () => React.JSX.Element };

const TABS: TabDef[] = [
  { id: "home",      label: "Home",         Icon: HomeTabIcon },
  { id: "progress",  label: "My Progress",  Icon: ProgressTabIcon },
  { id: "assets",    label: "My Assets",    Icon: AssetsTabIcon },
  { id: "workshops", label: "My Workshops", Icon: WorkshopsTabIcon },
];

function TabBar({ active, badges, onChange }: {
  active: DashTab;
  badges: Partial<Record<DashTab, number>>;
  onChange: (t: DashTab) => void;
}) {
  return (
    <nav className="dash-tab-bar" aria-label="Dashboard tabs">
      {TABS.map(({ id, label, Icon }) => {
        const n = badges[id] ?? 0;
        return (
          <button
            key={id}
            type="button"
            className={`dash-tab-btn${active === id ? " active" : ""}`}
            onClick={() => onChange(id)}
          >
            <Icon />
            <span>{label}</span>
            {n > 0 && <span className="dash-tab-badge">{n}</span>}
          </button>
        );
      })}
    </nav>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardPageInner />
    </Suspense>
  );
}

function DashboardPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const initialTab = (searchParams.get("tab") as DashTab) || "home";
  const gatewayParam = searchParams.get("gateway");
  const initialGateway = gatewayParam === "welcome" || gatewayParam === "pro" || gatewayParam === "student" || gatewayParam === "workshop" ? gatewayParam : null;

  const [tab, setTab] = useState<DashTab>(initialTab);
  const [gatewayIntent, setGatewayIntent] = useState<GatewayIntent | null>(initialGateway);
  const [gatewayBusy, setGatewayBusy] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [booted, setBooted]   = useState(() => !getBrowserSupabaseClient());
  const [summary, setSummary] = useState<LearningSummary | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [upcomingWorkshops, setUpcomingWorkshops] = useState<UpcomingWorkshop[]>([]);
  const [activePath, setActivePath] = useState<ActivePathSummary | null>(null);
  const [allPaths, setAllPaths] = useState<LearningPathListItem[]>([]);
  const [enrolledPathIds, setEnrolledPathIds] = useState<Set<string>>(new Set());
  const [pathsVersion, setPathsVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setBooted(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!booted) return;
    if (!session) router.replace("/auth?next=/dashboard");
  }, [booted, session, router]);

  useEffect(() => {
    const token = session?.access_token;
    if (!token) return;
    let canceled = false;
    Promise.all([
      getLearningSummary(token),
      ensureAuthProfile(token),
      getMyRegisteredWorkshops(token).catch(() => []),
    ])
      .then(([s, p, workshops]) => {
        if (canceled) return;
        setSummary(s);
        setProfile(p);
        setUpcomingWorkshops(workshops.map((workshop) => ({
          id: workshop.id,
          title: workshop.title,
          date: workshop.date,
          time: workshop.time,
          timezone: workshop.timezone,
          duration: workshop.duration,
          format: workshop.format,
          image: workshop.image,
          price: workshop.price,
          startTime: workshop.startTime,
          endTime: workshop.endTime,
          recordingStatus: workshop.recordingStatus,
          joinUrl: workshop.joinUrl,
          recordingUrl: workshop.recordingUrl,
        })));
        setLoading(false);
      })
      .catch((e) => { if (!canceled) { setError(e instanceof Error ? e.message : "Failed to load"); setLoading(false); } });

    Promise.all([getPaths(), getMyEnrolments(token), getLearningSummary(token).catch(() => null)])
      .then(async ([paths, enrolments, earlySum]) => {
        if (canceled) return;
        const enrolledIds = new Set(enrolments.map((e) => e.pathId));
        setAllPaths(paths);
        setEnrolledPathIds(enrolledIds);
        const firstPath = paths.find((p) => enrolledIds.has(p.id)) ?? null;
        if (!firstPath) { setActivePath(null); return; }

        // Fetch path detail to get ordered course list
        const detail = await getPathDetail(firstPath.id).catch(() => null);
        if (canceled) return;

        // Build progress map from summary courses
        const sumCourses = earlySum?.courses ?? [];
        const progMap = new Map(sumCourses.map((c) => [c.courseId, c]));

        const totalCourses = detail?.courses.length ?? 0;
        const completedCourses = detail?.courses.filter((c) => progMap.get(c.id)?.status === "completed").length ?? 0;

        // Find first non-completed course in path order
        const nextRaw = detail?.courses.find((c) => progMap.get(c.id)?.status !== "completed") ?? null;
        const nextProg = nextRaw ? progMap.get(nextRaw.id) : null;

        // nextLessonId: use summary.nextUp if it matches, otherwise null (start from beginning)
        const nextLessonId = (earlySum?.nextUp?.courseId === nextRaw?.id)
          ? (earlySum?.nextUp?.nextLessonId ?? null)
          : null;

        const nextCourse: NextPathCourse | null = nextRaw ? {
          id: nextRaw.id,
          title: nextRaw.title,
          software: nextRaw.software,
          percentComplete: nextProg?.percentComplete ?? 0,
          nextLessonId,
          courseIndex: detail?.courses.indexOf(nextRaw) ?? 0,
          totalCourses,
        } : null;

        setActivePath({
          pathId: firstPath.id,
          title: firstPath.title,
          level: firstPath.level,
          percent: totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0,
          milestone: firstPath.outcome,
          completedCourses,
          totalCourses,
          nextCourse,
        });
      })
      .catch(() => {
        if (!canceled) setActivePath(null);
      });
    return () => { canceled = true; };
  }, [session?.access_token, pathsVersion]);

  // Fire streak toast once per session when streak ≥ 2
  useEffect(() => {
    if (!summary) return;
    const streak = summary.totals.streakDays;
    if (streak < 2) return;
    const key = `addition_streak_toast_${new Date().toDateString()}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    toast({
      type: "streak",
      title: `${streak} day streak! 🔥`,
      body: "You're on a roll — keep it going.",
      duration: 5000,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary?.totals.streakDays]);

  const handleTabChange = useCallback((t: DashTab) => {
    setTab(t);
    const params = new URLSearchParams(searchParams.toString());
    if (t === "home") params.delete("tab"); else params.set("tab", t);
    router.replace(`/dashboard${params.toString() ? `?${params}` : ""}`, { scroll: false });
  }, [router, searchParams]);

  const handleContinue = useCallback((courseId: string, lessonId: string | null) => {
    const params = new URLSearchParams({ course: courseId });
    if (lessonId) params.set("lesson", lessonId);
    router.push(`/learn?${params}`);
  }, [router]);

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const clearGateway = useCallback(() => {
    setGatewayIntent(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("gateway");
    params.delete("billing");
    params.delete("next");
    router.replace(`/dashboard${params.toString() ? `?${params}` : ""}`, { scroll: false });
  }, [router, searchParams]);

  const handleGatewayContinue = useCallback(async () => {
    if (!gatewayIntent) return;
    const token = session?.access_token;
    setGatewayBusy(true);
    try {
      if (gatewayIntent === "pro") {
        if (!token) return;
        const billing = searchParams.get("billing") === "yearly" ? "yearly" : "monthly";
        const url = await getBillingCheckoutUrl("pro", token, "/dashboard", billing);
        window.location.href = url;
        return;
      }
      const next = searchParams.get("next");
      if (gatewayIntent === "workshop" && next?.startsWith("/")) {
        router.push(next.includes("/checkout") ? next : `${next}/checkout`);
        return;
      }
      if (gatewayIntent === "student") {
        router.push("/auth?verify=student&next=/dashboard");
        return;
      }
      if (gatewayIntent === "welcome") {
        clearGateway();
        router.push("/paths");
        return;
      }
      clearGateway();
    } finally {
      setGatewayBusy(false);
    }
  }, [clearGateway, gatewayIntent, router, searchParams, session?.access_token]);

  if (!booted || (!session && booted)) return null;

  const userMeta = session?.user.user_metadata as { name?: string; billing?: string } | undefined;
  const userName = profile?.name || userMeta?.name || session?.user.email?.split("@")[0] || "Learner";
  const userEmail = session?.user.email;
  const userPlan = profile?.plan ?? "free";
  const userBilling = userMeta?.billing;
  const isPro = userPlan === "pro" || userPlan === "team" || userPlan === "student";

  const nextUp = summary?.nextUp ?? null;
  const practiseCount = summary?.totals.practicedCommands ?? 0;
  const streakDays = summary?.totals.streakDays ?? 0;
  const visibleWorkshops = upcomingWorkshops.filter(isFutureWorkshop);
  const workshopCount = visibleWorkshops.length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const lessonsToday = (summary?.activity.days ?? []).find((d) => d.day === todayStr)?.count ?? 0;

  // Tab badges
  const badges: Partial<Record<DashTab, number>> = {
    workshops: workshopCount,
  };

  return (
    <AppFrame
      title="" subtitle=""
      userName={userName} userEmail={userEmail} isPro={isPro}
      topTabs={[]} hideTopbar={true}
      workshopCount={workshopCount}
    >
      <section className="dash-shell user-dashboard">

        {/* ── Custom dashboard header ── */}
        <header className="dash-header glass-panel">
          <div className="dash-header-identity">
            <div className="dash-user-avatar">{initials(userName, userEmail)}</div>
            <div className="dash-header-name">
              <p className="dash-greeting">{greeting()}, {userName}</p>
              <p className="dash-header-plan">
                {formatPlan(userPlan, userBilling)}
                {!isPro && (
                  <button
                    type="button"
                    className="dash-upgrade-link"
                    onClick={() => setUpgradeModalOpen(true)}
                  >
                    Upgrade →
                  </button>
                )}
              </p>
            </div>
          </div>
        </header>

        {/* ── Section tabs ── */}
        <div className="dash-section-tabs">
          {(["home", "progress"] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`dash-section-tab${tab === t ? " is-active" : ""}`}
              onClick={() => handleTabChange(t)}
            >
              {t === "home" ? "Dashboard" : "My Progress"}
            </button>
          ))}
        </div>

        {error && <p className="meta" style={{ color: "var(--danger)" }}>{error}</p>}

        {/* ── Tab content ── */}
        <div className="dash-tab-panel">
          {loading ? (
            <DashSkeleton />
          ) : tab === "progress" ? (
            <ProgressTab summary={summary} />
          ) : (
            <div className="home-layout">
              {/* 1. Next Up — one tap back into the lesson */}
              {activePath
                ? <PathHero activePath={activePath} onContinue={handleContinue} />
                : <ContinueHero course={nextUp} onContinue={handleContinue} />
              }
              {/* 2. Daily rep — streak + what's due, one tap into flashcards */}
              <DailyRep lessonsToday={lessonsToday} streak={streakDays} practiseCount={practiseCount} />
              {/* 3. Jump back in — recently viewed commands (reference mode) */}
              <JumpBackIn />
              {/* 4. This week — only when something is actually booked */}
              <MyWorkshopsSection workshops={upcomingWorkshops} />
              {/* 4. Progress at a glance */}
              <ProgressSnapshot summary={summary} onOpen={() => handleTabChange("progress")} />
              {/* 5. Everything else as quiet links */}
              <ExploreRow />
            </div>
          )}
        </div>
      </section>
      {gatewayIntent === "welcome" && (
        <OnboardingWizard
          paths={allPaths}
          token={session?.access_token ?? ""}
          onComplete={(enrolledPathId) => {
            clearGateway();
            if (enrolledPathId) setPathsVersion((v) => v + 1);
          }}
        />
      )}
      {gatewayIntent && gatewayIntent !== "welcome" && (
        <GatewayModal
          intent={gatewayIntent}
          billing={searchParams.get("billing") === "yearly" ? "yearly" : "monthly"}
          nextPath={searchParams.get("next")}
          busy={gatewayBusy}
          onClose={clearGateway}
          onContinue={() => void handleGatewayContinue()}
        />
      )}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        accessToken={session?.access_token ?? null}
        returnTo="/dashboard"
      />
    </AppFrame>
  );
}
