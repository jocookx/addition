"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { CourseCatalogDetail, CourseCatalogListItem, CourseLesson, CourseModule } from "@/domain/catalog";
import type { CourseLessonProgressItem, CourseModuleProgressItem, CourseProgressOverview } from "@/domain/course-progress";
import { getCourseCatalog, getCourseDetail } from "@/lib/api/catalog";
import { getCourseProgressOverview } from "@/lib/api/course-progress";
import { completeLesson, startLesson } from "@/lib/api/lesson-actions";
import { patchLearningProgress } from "@/lib/api/learning-progress";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { AppFrame } from "@/components/legacy/AppFrame";
import { normalizeSoftwareLabel, useSoftwareContext, SOFTWARE_LIST } from "@/lib/software-context";
import { rankBySmartMatchWithMeta, type SmartMatchMeta } from "@/lib/search/smart-match";

// ── helpers ──────────────────────────────────────────────────────────────────

function ytEmbedSrc(url: string): string {
  if (!url) return "";
  const m = url.match(/(?:youtu\.be\/|[?&]v=|embed\/)([A-Za-z0-9_-]{11})/);
  const id = m ? m[1] : url.length === 11 ? url : "";
  return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : "";
}

function parseError(e: unknown): string {
  return e instanceof Error ? e.message : "Unexpected error.";
}

function flatLessons(course: CourseCatalogDetail): CourseLesson[] {
  return course.modules.flatMap((m) => m.lessons);
}

function mergeModules(
  course: CourseCatalogDetail | null,
  progress: CourseProgressOverview | null,
): CourseModuleProgressItem[] {
  if (!course) return [];
  const statusMap = new Map<string, CourseLessonProgressItem>();
  for (const m of progress?.modules ?? []) {
    for (const l of m.lessons) statusMap.set(l.id, l);
  }
  return course.modules.map((m: CourseModule) => ({
    id: m.id,
    title: m.title,
    lessons: m.lessons.map((l: CourseLesson) => ({
      id: l.id,
      title: l.title,
      durationMin: l.durationMin,
      status: statusMap.get(l.id)?.status ?? "not_started",
      elapsedSeconds: statusMap.get(l.id)?.elapsedSeconds ?? 0,
    })),
  }));
}

// ── Catalog view ──────────────────────────────────────────────────────────────

function CourseCard({
  course,
  progress,
  match,
  onOpen,
  onOpenLesson,
}: {
  course: CourseCatalogListItem;
  progress?: number;
  match?: SmartMatchMeta;
  onOpen: () => void;
  onOpenLesson?: (lessonId: string) => void;
}) {
  const swId = normalizeSoftwareLabel(course.software ?? "");
  const swMeta = swId ? SOFTWARE_LIST.find((s) => s.id === swId) : null;
  const hasMatch = match && match.matchLabel;
  const canJump = hasMatch && match.matchLessonId && onOpenLesson;
  return (
    <article className="card" role="button" tabIndex={0} style={{ cursor: "pointer" }}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
    >
      <div className="card-thumb" style={{ background: "linear-gradient(135deg, #0d1a2a, #0a1520)" }}>
        {swMeta && (
          <span className="card-thumb-sw-badge" style={{ color: swMeta.color }}>
            {swMeta.abbr}
          </span>
        )}
      </div>
      <div className="card-body">
        {typeof progress === "number" && (
          <div className="card-progress subtle">
            <div className="card-progress-meta"><strong>{progress}%</strong></div>
            <div className="card-progress-bar"><span style={{ width: `${progress}%` }} /></div>
          </div>
        )}
        <h3>{course.title}</h3>
        <div className="meta">{course.software} · {course.lessonCount} lessons</div>
        <div className="course-meta-tags">
          <span className="course-meta-tag">{course.type === "core" ? "Core" : "Course"}</span>
        </div>
        {hasMatch && (
          <div
            className={`course-match-hint${canJump ? " course-match-hint--clickable" : ""}`}
            onClick={canJump ? (e) => { e.stopPropagation(); onOpenLesson!(match.matchLessonId!); } : undefined}
            role={canJump ? "button" : undefined}
            tabIndex={canJump ? 0 : undefined}
            onKeyDown={canJump ? (e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onOpenLesson!(match.matchLessonId!); } } : undefined}
            title={canJump ? "Jump to this lesson" : undefined}
          >
            <span className="course-match-label">↳ {match.matchLabel}</span>
            {match.matchSnippet && (
              <span className="course-match-snippet">&quot;{match.matchSnippet}&quot;</span>
            )}
            {canJump && <span className="course-match-jump">Go to lesson →</span>}
          </div>
        )}
        <div className="actions">
          <button type="button" className="primary-button" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
            {typeof progress === "number" && progress > 0 ? "Continue" : "Start course"}
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Player sidebar module ─────────────────────────────────────────────────────

function ModuleBlock({
  mod,
  modIndex,
  selectedLessonId,
  onSelect,
}: {
  mod: CourseModuleProgressItem;
  modIndex: number;
  selectedLessonId: string;
  onSelect: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useReducer((v: boolean) => !v, false);
  const doneCount = mod.lessons.filter((l) => l.status === "completed").length;

  return (
    <section className="module-block">
      <button type="button" className="module-head" onClick={setCollapsed}>
        <strong>Module {modIndex + 1}: {mod.title}</strong>
        <span className="module-head-right">
          <span className="module-count">{doneCount}/{mod.lessons.length}</span>
          <span className="module-chevron">{collapsed ? "›" : "⌄"}</span>
        </span>
      </button>
      {!collapsed && (
        <div className="module-lessons">
          {mod.lessons.map((lesson, li) => {
            const done = lesson.status === "completed";
            const active = lesson.id === selectedLessonId;
            return (
              <article
                key={lesson.id}
                className={`lesson-item${active ? " active" : ""}${done ? " done" : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(lesson.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(lesson.id); } }}
              >
                <div className="lesson-index">{modIndex + 1}.{li + 1}</div>
                <div className="lesson-row">
                  <strong>{lesson.title}</strong>
                  <div className="lesson-row-right">
                    <span className={`lesson-status${done ? " done" : " todo"}`} aria-label={done ? "Completed" : "Not completed"}>
                      {done ? "✓" : "○"}
                    </span>
                    {lesson.durationMin ? (
                      <span className="lesson-time">{lesson.durationMin}m</span>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LearnPage() {
  return (
    <Suspense>
      <LearnPageInner />
    </Suspense>
  );
}

function LearnPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [supabase] = useState<SupabaseClient | null>(() => getBrowserSupabaseClient());
  const [session, setSession] = useState<Session | null>(null);
  const [booted, setBooted] = useState(() => !getBrowserSupabaseClient());

  const [activeSoftware] = useSoftwareContext();
  const [catalog, setCatalog] = useState<CourseCatalogListItem[]>([]);
  const [catalogType, setCatalogType] = useState<"all" | "core" | "courses">("all");
  const [search, setSearch] = useState("");

  // Player state — null means catalog view
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [course, setCourse] = useState<CourseCatalogDetail | null>(null);
  const [progress, setProgress] = useState<CourseProgressOverview | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState("");
  // When opening from a search match, remember which lesson to jump to
  const pendingLessonId = useRef<string | null>(null);
  const [videoMax, toggleVideoMax] = useReducer((v: boolean) => !v, false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // ── auth ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setBooted(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!booted) return;
    if (!session) {
      const next = `/learn${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      router.replace(`/auth?next=${encodeURIComponent(next)}`);
    }
  }, [booted, session, router, searchParams]);

  // ── catalog ───────────────────────────────────────────────────────────────

  useEffect(() => {
    let canceled = false;
    getCourseCatalog()
      .then((courses) => {
        if (canceled) return;
        setCatalog(courses);
        // Deep-link: ?course=ID goes straight to player
        const urlCourse = searchParams.get("course");
        if (urlCourse && courses.some((c) => c.id === urlCourse)) {
          setActiveCourseId(urlCourse);
        }
      })
      .catch((e) => { if (!canceled) setError(parseError(e)); });
    return () => { canceled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── course detail + progress ──────────────────────────────────────────────

  useEffect(() => {
    if (!activeCourseId) { setCourse(null); setProgress(null); return; }
    let canceled = false;
    getCourseDetail(activeCourseId)
      .then((d) => {
        if (canceled) return;
        setCourse(d);
        // If opened from a search match, jump directly to the matched lesson
        const jump = pendingLessonId.current;
        pendingLessonId.current = null;
        const allIds = d.modules.flatMap((m) => m.lessons.map((l) => l.id));
        const startId = (jump && allIds.includes(jump))
          ? jump
          : (d.firstLessonId ?? allIds[0] ?? "");
        setSelectedLessonId(startId);
      })
      .catch((e) => { if (!canceled) setError(parseError(e)); });
    return () => { canceled = true; };
  }, [activeCourseId]);

  useEffect(() => {
    const token = session?.access_token;
    if (!token || !activeCourseId) { setProgress(null); return; }
    let canceled = false;
    getCourseProgressOverview(token, activeCourseId)
      .then((p) => { if (!canceled) setProgress(p); })
      .catch(() => { if (!canceled) setProgress(null); });
    return () => { canceled = true; };
  }, [session?.access_token, activeCourseId]);

  // ── auto-enroll ───────────────────────────────────────────────────────────

  useEffect(() => {
    const token = session?.access_token;
    if (!token || !activeCourseId || progress?.enrollment) return;
    patchLearningProgress(token, {
      enrollments: [{ courseId: activeCourseId, status: "active" }],
      event: { type: "learn_enrollment_upserted", payload: { courseId: activeCourseId } },
    }).catch(() => {});
  }, [session?.access_token, activeCourseId, progress?.enrollment]);

  // ── derived ───────────────────────────────────────────────────────────────

  const modules = useMemo(() => mergeModules(course, progress), [course, progress]);
  const allLessons = useMemo(() => (course ? flatLessons(course) : []), [course]);
  const lessonIndex = allLessons.findIndex((l) => l.id === selectedLessonId);
  const activeLesson = allLessons[lessonIndex] ?? null;
  const prevLesson = lessonIndex > 0 ? allLessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex >= 0 && lessonIndex < allLessons.length - 1 ? allLessons[lessonIndex + 1] : null;
  const lessonProgress = useMemo(() => {
    for (const m of modules) {
      const lp = m.lessons.find((l) => l.id === selectedLessonId);
      if (lp) return lp;
    }
    return null;
  }, [modules, selectedLessonId]);
  const isDone = lessonProgress?.status === "completed";
  const pct = progress?.percentComplete ?? 0;
  const completedCount = progress?.completedLessons ?? 0;

  // ── active lesson module numbers ──────────────────────────────────────────
  const activeMod = course?.modules.findIndex((m) => m.lessons.some((l) => l.id === selectedLessonId)) ?? -1;
  const activeLessonInMod = activeMod >= 0
    ? (course?.modules[activeMod].lessons.findIndex((l) => l.id === selectedLessonId) ?? -1)
    : -1;

  // ── catalog filter ────────────────────────────────────────────────────────
  const filteredCatalog = useMemo(() => {
    // Apply non-text filters first (catalog type + software)
    const prefiltered = catalog.filter((c) => {
      if (catalogType === "core"    && c.type !== "core") return false;
      if (catalogType === "courses" && c.type === "core") return false;
      if (activeSoftware) {
        const norm = normalizeSoftwareLabel(c.software ?? "");
        if (norm !== activeSoftware && c.software !== activeSoftware) return false;
      }
      return true;
    });
    return rankBySmartMatchWithMeta(prefiltered, search, {
      target: (c) => ({
        id: c.id,
        title: c.title,
        software: c.software,
        lessons: c.lessons.map((l) => ({
          id: l.id,
          // Format "Module Title · 2.3 Lesson Title" so the matchLabel shows the number
          module: l.module,
          title: `${l.moduleIndex + 1}.${l.lessonIndex + 1} ${l.title}`,
          content: l.content,
        })),
      }),
    });
  }, [catalog, catalogType, search, activeSoftware]);

  // ── actions ───────────────────────────────────────────────────────────────

  function openCourse(id: string, lessonId?: string | null) {
    pendingLessonId.current = lessonId ?? null;
    setActiveCourseId(id);
    setError("");
  }

  function backToCatalog() {
    setActiveCourseId(null);
    setCourse(null);
    setProgress(null);
    setSelectedLessonId("");
    if (videoMax) toggleVideoMax();
  }

  async function handleMarkComplete() {
    const token = session?.access_token;
    if (!token || !activeCourseId || !selectedLessonId || busy || isDone) return;
    setBusy(true);
    try {
      const updated = await completeLesson(token, activeCourseId, selectedLessonId);
      setProgress(updated);
      if (nextLesson) setSelectedLessonId(nextLesson.id);
    } catch (e) { setError(parseError(e)); }
    finally { setBusy(false); }
  }

  async function handleSelectLesson(id: string) {
    setSelectedLessonId(id);
    const token = session?.access_token;
    if (!token || !activeCourseId) return;
    const lp = modules.flatMap((m) => m.lessons).find((l) => l.id === id);
    if (!lp || lp.status !== "not_started") return;
    try {
      const updated = await startLesson(token, activeCourseId, id);
      setProgress(updated);
    } catch { /* non-critical */ }
  }

  // ── render guard ──────────────────────────────────────────────────────────

  if (!booted || (!session && booted)) return null;

  const userName = (session?.user.user_metadata?.name as string | undefined) || session?.user.email?.split("@")[0];

  // ── CATALOG VIEW ──────────────────────────────────────────────────────────

  if (!activeCourseId) {
    return (
      <AppFrame
        title="Courses"
        subtitle="Your full course library."
        userName={userName}
        userEmail={session?.user.email}
        toolbarQuery={search}
        onToolbarQueryChange={setSearch}
      >
        <div className="learn-view">
          <div className="commands-toolbar">
            <div className="commands-toolbar-left">
              <span className="meta">{filteredCatalog.length} shown · {catalog.length} total</span>

            </div>
            <div className="commands-toolbar-right">
              <select
                className="reference-search"
                style={{ width: "auto", minWidth: 120 }}
                value={catalogType}
                onChange={(e) => setCatalogType(e.target.value as "all" | "core" | "courses")}
              >
                <option value="all">All types</option>
                <option value="core">Core</option>
                <option value="courses">Courses</option>
              </select>
            </div>
          </div>

          {error && <p className="meta" style={{ color: "var(--danger)" }}>{error}</p>}
          {filteredCatalog.length ? (
            <div className="card-grid">
              {filteredCatalog.map(({ item: c, matchLabel, matchSnippet, matchLessonId }) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  match={search.trim() ? { matchLabel, matchSnippet, matchLessonId } : undefined}
                  onOpen={() => openCourse(c.id)}
                  onOpenLesson={(lessonId) => openCourse(c.id, lessonId)}
                />
              ))}
            </div>
          ) : (
            <div className="ws-empty-state">
              <div className="ws-empty-icon">○</div>
              <h3>Courses are being prepared</h3>
              <p className="meta">Published courses will appear here when they are ready. For now, use the free command library while course content is reviewed.</p>
              <Link className="primary-button" href="/commands">Browse command library</Link>
            </div>
          )}
        </div>
      </AppFrame>
    );
  }

  // ── PLAYER VIEW ───────────────────────────────────────────────────────────

  const videoSrc = ytEmbedSrc(activeLesson?.video ?? "");

  return (
    <AppFrame
      title=""
      subtitle=""
      userName={userName}
      userEmail={session?.user.email}
      topTabs={[]}
      hideSoftwareSwitcher
    >
      {error && <p className="meta" style={{ color: "var(--danger)", padding: "0 0 12px" }}>{error}</p>}
      <div className={`player${videoMax ? " video-maximized" : ""}`}>

        {/* ── Video column ── */}
        <div className="player-video-col">
          <div className="video-wrap">
            <button
              type="button"
              className="video-max-btn"
              onClick={toggleVideoMax}
              aria-label={videoMax ? "Exit fullscreen" : "Fullscreen video"}
              title={videoMax ? "Exit fullscreen" : "Fullscreen"}
            >
              {videoMax ? "⤡" : "⤢"}
            </button>
            {videoSrc ? (
              <iframe
                key={videoSrc}
                src={videoSrc}
                title={activeLesson?.title ?? "Lesson video"}
                allowFullScreen
              />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--rf-muted)", fontSize: 13 }}>
                No video for this lesson
              </div>
            )}
          </div>

          {/* Lesson bar */}
          <div className="player-lesson-bar">
            <div className="player-lesson-info">
              {activeMod >= 0 && activeLessonInMod >= 0 && (
                <span className="player-lesson-label">
                  Module {activeMod + 1}.{activeLessonInMod + 1}
                </span>
              )}
              <strong className="player-lesson-title">{activeLesson?.title ?? "Select a lesson"}</strong>
            </div>
            <div className="player-lesson-actions">
              <button
                type="button"
                className={`player-mark-btn${isDone ? " is-done" : ""}`}
                onClick={() => void handleMarkComplete()}
                disabled={busy || isDone || !activeLesson}
              >
                {isDone ? "✓ Completed" : busy ? "Saving…" : "Mark complete"}
              </button>
              <div className="player-lesson-actions-right">
                <button
                  type="button"
                  className="player-nav-btn"
                  disabled={!prevLesson}
                  onClick={() => prevLesson && void handleSelectLesson(prevLesson.id)}
                  title="Previous lesson"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="player-nav-btn"
                  disabled={!nextLesson}
                  onClick={() => nextLesson && void handleSelectLesson(nextLesson.id)}
                  title="Next lesson"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sidebar outline ── */}
        <aside className="lesson-panel course-outline">
          <div className="outline-head">
            <button type="button" className="outline-back-btn" onClick={backToCatalog}>
              ← Back to courses
            </button>
          </div>

          {course && (
            <div className="outline-course-card">
              <h3 className="course-title">{course.title}</h3>
              <div className="course-badges">
                <span className="course-pill">{course.software}</span>
                <span className="course-pill">{course.modules.length} modules</span>
                <span className="course-pill">{course.lessonCount} lessons</span>
              </div>
              {course.commands?.length > 0 && (
                <div className="card-related compact">
                  <div className="card-related-label">Commands used</div>
                  <div className="card-related-tags">
                    {course.commands.map((c) => <span key={c} className="card-related-tag">{c}</span>)}
                  </div>
                </div>
              )}
              {course.combos?.length > 0 && (
                <div className="card-related compact">
                  <div className="card-related-label">Combos used</div>
                  <div className="card-related-tags">
                    {course.combos.map((c) => <span key={c} className="card-related-tag">{c}</span>)}
                  </div>
                </div>
              )}
              <div className="course-progress-wrap">
                <div className="course-progress-meta">
                  <span>{completedCount} of {course.lessonCount} complete</span>
                  <span>{pct}%</span>
                </div>
                <div className="course-progress-bar"><span style={{ width: `${pct}%` }} /></div>
              </div>
            </div>
          )}

          <div className="outline-modules">
            {modules.map((m, i) => (
              <ModuleBlock
                key={m.id}
                mod={m}
                modIndex={i}
                selectedLessonId={selectedLessonId}
                onSelect={(id) => void handleSelectLesson(id)}
              />
            ))}
          </div>

          {/* Resources */}
          {activeLesson?.resources?.length ? (
            <div className="card-related" style={{ marginTop: 16 }}>
              <div className="card-related-label">Resources</div>
              {activeLesson.resources.map((r) => (
                <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: "block", fontSize: 13, color: "var(--accent)", padding: "4px 0" }}>
                  {r.name}
                </a>
              ))}
            </div>
          ) : null}
        </aside>
      </div>
    </AppFrame>
  );
}
