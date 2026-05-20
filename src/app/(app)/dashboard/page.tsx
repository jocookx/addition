"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import type { LearningSummary } from "@/domain/learning-summary";
import type { LearningPathListItem, PathEnrolment } from "@/domain/learning-path";
import type { UserProfile } from "@/domain/user-profile";
import { ensureAuthProfile } from "@/lib/api/auth-profile";
import { getBillingCheckoutUrl } from "@/lib/api/billing";
import { getLearningSummary } from "@/lib/api/learning-summary";
import { getPaths, getMyEnrolments } from "@/lib/api/paths";
import { getMyRegisteredWorkshops } from "@/lib/api/workshops";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { AppFrame } from "@/components/legacy/AppFrame";

// ── Types & helpers ─────────────────────────────────────────────────────────

type DashTab = "home" | "progress" | "path" | "assets" | "workshops";
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
};

type ActivePathSummary = {
  title: string;
  percent: number;
  milestone?: string;
};

const QUICK_SEARCHES = ["Offset walls", "Array windows", "Clean curves", "Export drawings"];

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

function ContinueHero({ course, onContinue }: {
  course: LearningSummary["nextUp"];
  onContinue: (courseId: string, lessonId: string | null) => void;
}) {
  if (!course) {
    return (
      <div className="home-hero home-hero--empty glass-panel">
        <div className="home-hero-body">
          <span className="home-hero-eyebrow">Start Learning</span>
          <h2 className="home-hero-course">Ready when you are</h2>
          <p className="home-hero-why">Choose a course and start building real skills — one lesson at a time, at your own pace.</p>
          <Link href="/learn" className="primary-button home-hero-cta" style={{ textDecoration: "none" }}>
            Browse Courses →
          </Link>
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

function SolveSection() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const submit = useCallback((q: string) => {
    const t = q.trim();
    if (t) router.push(`/search?q=${encodeURIComponent(t)}`);
  }, [router]);
  return (
    <div className="home-solve glass-panel">
      <div className="home-solve-head">
        <h3 className="home-solve-title">Solve a Problem</h3>
        <p className="home-solve-sub">Search across commands, combos, lessons, and courses.</p>
      </div>
      <div className="home-solve-bar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input className="home-solve-input" type="text" placeholder="Search commands, combos, lessons…"
          value={value} onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit(value)} autoComplete="off" />
      </div>
      <div className="home-solve-chips">
        <span className="home-solve-chips-label">Try:</span>
        {QUICK_SEARCHES.map(q => (
          <button key={q} type="button" className="home-solve-chip" onClick={() => submit(q)}>{q}</button>
        ))}
      </div>
    </div>
  );
}

function TinyGoal({ onStart }: { onStart: () => void }) {
  return (
    <div className="home-tiny glass-panel">
      <div className="home-tiny-dot" />
      <div className="home-tiny-content">
        <span className="home-tiny-label">Today&apos;s Tiny Goal</span>
        <p className="home-tiny-body">Complete one short lesson today. You don&apos;t need to finish the whole course.</p>
        <button type="button" className="home-tiny-cta ghost-btn" onClick={onStart}>Start Tiny Goal →</button>
      </div>
    </div>
  );
}

function PathCard({ activePath }: { activePath: { title: string; percent: number; milestone?: string } | null }) {
  if (!activePath) {
    return (
      <Link href="/paths" className="home-chip glass-panel" style={{ textDecoration: "none", color: "inherit" }}>
        <span className="home-chip-label">Path</span>
        <span className="home-chip-action">Choose one →</span>
      </Link>
    );
  }
  return (
    <Link href="/paths" className="home-chip home-chip--path glass-panel" style={{ textDecoration: "none", color: "inherit" }}>
      <span className="home-chip-label">Path</span>
      <span className="home-chip-name">{activePath.title}</span>
      <span className="home-chip-pct">{activePath.percent}%</span>
    </Link>
  );
}

function WorkshopCard({ ws }: { ws: UpcomingWorkshop | null }) {
  if (!ws) {
    return (
      <Link href="/workshops" className="home-chip glass-panel" style={{ textDecoration: "none", color: "inherit" }}>
        <span className="home-chip-label">Workshop</span>
        <span className="home-chip-action">Book a session →</span>
      </Link>
    );
  }
  const date = new Date(ws.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const format = ws.format === "in-person" ? "In person" : "Online";
  return (
    <Link href={getWorkshopHref(ws.id)} className="home-workshop-card glass-panel" style={{ textDecoration: "none", color: "inherit" }}>
      {ws.image ? (
        <img className="home-workshop-img" src={ws.image} alt="" aria-hidden="true" />
      ) : (
        <span className="home-workshop-img home-workshop-img--empty" aria-hidden="true" />
      )}
      <span className="home-workshop-shade" aria-hidden="true" />
      <span className="home-workshop-tag">Workshop</span>
      <span className="home-workshop-hover">
        <span className="home-workshop-title">{ws.title}</span>
        <span className="home-workshop-meta">
          {date}
          {ws.time ? ` · ${ws.time}` : ""}
          {ws.duration ? ` · ${ws.duration}` : ""}
        </span>
        <span className="home-workshop-foot">
          <span>{format}</span>
          {ws.price ? <span>{ws.price}</span> : null}
        </span>
      </span>
    </Link>
  );
}

// ── Tab content stubs ──────────────────────────────────────────────────────

function ProgressTab() {
  return <div className="dash-tab-empty glass-panel">My Progress — coming next.</div>;
}

const LEVEL_LABELS: Record<string, string> = {
  explorer: "Beginner",
  improver: "Intermediate",
  refiner:  "Advanced",
};

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
      title: "Finish student verification",
      body: "Your account is ready. Complete the student access step so discounted Pro can be reviewed.",
      action: "Continue",
    },
    workshop: {
      kicker: "Workshop booking",
      title: "Reserve your workshop place",
      body: "Your account is ready. Continue to the workshop booking step to complete your place.",
      action: "Continue to workshop",
    },
    welcome: {
      kicker: "Welcome",
      title: "Start with a quick tour",
      body: "Your dashboard is ready. Learn the layout, find commands, and see where workshops and practice live.",
      action: "Start tour",
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
  { id: "path",      label: "My Path",      Icon: PathTabIcon },
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
        })));
        setLoading(false);
      })
      .catch((e) => { if (!canceled) { setError(e instanceof Error ? e.message : "Failed to load"); setLoading(false); } });

    Promise.all([getPaths(), getMyEnrolments(token)])
      .then(([paths, enrolments]) => {
        if (canceled) return;
        const enrolledPathIds = new Set(enrolments.map((enrolment) => enrolment.pathId));
        const firstPath = paths.find((path) => enrolledPathIds.has(path.id)) ?? null;
        setActivePath(firstPath ? {
          title: firstPath.title,
          percent: 0,
          milestone: firstPath.outcome,
        } : null);
      })
      .catch(() => {
        if (!canceled) setActivePath(null);
      });
    return () => { canceled = true; };
  }, [session?.access_token]);

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

  const [upgradeError, setUpgradeError] = useState("");
  const [upgradeBusy, setUpgradeBusy] = useState(false);

  const handleUpgrade = useCallback(async () => {
    const token = session?.access_token;
    if (!token) return;
    setUpgradeError("");
    setUpgradeBusy(true);
    try {
      const url = await getBillingCheckoutUrl("pro", token, "/dashboard");
      window.location.href = url;
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : "Could not open checkout. Please try again.");
    } finally {
      setUpgradeBusy(false);
    }
  }, [session?.access_token]);

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
        router.push("/settings");
        return;
      }
      if (gatewayIntent === "welcome") {
        clearGateway();
        router.push("/learn");
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
  const visibleWorkshops = upcomingWorkshops.filter(isFutureWorkshop);
  const workshopCount = visibleWorkshops.length;
  const upcomingWorkshop = visibleWorkshops[0] ?? upcomingWorkshops[0] ?? null;

  // Tab badges
  const badges: Partial<Record<DashTab, number>> = {
    path: activePath ? 1 : 0,
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
              <p className="dash-header-plan">{formatPlan(userPlan, userBilling)}</p>
            </div>
          </div>
          {(practiseCount > 0 || workshopCount > 0) && (
            <div className="dash-header-nudge">
              {practiseCount > 0 && (
                <Link href="/practice" className="dash-nudge-pill" style={{ textDecoration: "none" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  {practiseCount} to practise
                </Link>
              )}
              {workshopCount > 0 && (
                <Link href="/workshops" className="dash-nudge-pill dash-nudge-pill--ws" style={{ textDecoration: "none" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                  {workshopCount} workshop{workshopCount === 1 ? "" : "s"}
                </Link>
              )}
            </div>
          )}
          {!isPro && (
            <div className="dash-upgrade-wrap">
              <button
                type="button"
                className="primary-button dash-upgrade-btn"
                onClick={() => void handleUpgrade()}
                disabled={upgradeBusy}
              >
                {upgradeBusy ? "Opening…" : "Upgrade to Pro"}
              </button>
              {upgradeError && (
                <p className="dash-upgrade-error">{upgradeError}</p>
              )}
            </div>
          )}
        </header>

        {/* ── Inner tabs ── */}
        <TabBar active={tab} badges={badges} onChange={handleTabChange} />

        {error && <p className="meta" style={{ color: "var(--danger)" }}>{error}</p>}

        {/* ── Tab content ── */}
        <div className="dash-tab-panel">
          {loading && tab === "home" ? (
            <p className="meta">Loading…</p>
          ) : tab === "home" ? (
            <div className="home-layout">
              <div className="home-main">
                <ContinueHero course={nextUp} onContinue={handleContinue} />
                <SolveSection />
              </div>
              <div className="home-side">
                <TinyGoal onStart={() => nextUp ? handleContinue(nextUp.courseId, nextUp.nextLessonId) : router.push("/learn")} />
                <PathCard activePath={activePath} />
                <WorkshopCard ws={upcomingWorkshop} />
              </div>
            </div>
          ) : tab === "progress"  ? <ProgressTab />
            : tab === "path"      ? <PathTab token={session?.access_token ?? ""} />
            : tab === "assets"    ? <AssetsTab />
            : tab === "workshops" ? <WorkshopsTabPanel workshops={visibleWorkshops} />
            : null}
        </div>
      </section>
      {gatewayIntent && (
        <GatewayModal
          intent={gatewayIntent}
          billing={searchParams.get("billing") === "yearly" ? "yearly" : "monthly"}
          nextPath={searchParams.get("next")}
          busy={gatewayBusy}
          onClose={clearGateway}
          onContinue={() => void handleGatewayContinue()}
        />
      )}
    </AppFrame>
  );
}
