"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

type AdminTab =
  | "dashboard"
  | "courses"
  | "paths"
  | "workshops"
  | "instructors"
  | "commands"
  | "combos"
  | "practice"
  | "resources"
  | "problem-solver"
  | "learners"
  | "progress"
  | "certificates"
  | "analytics"
  | "search-insights"
  | "settings";

// ── Nav icons ─────────────────────────────────────────────────────────────────
const S = { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, width: 16, height: 16, "aria-hidden": true };

const Icons = {
  // Overview — speedometer-style dashboard
  dashboard:      <svg {...S}><path d="M2.5 11a6 6 0 1 1 11 0"/><path d="M8 5v2.5"/><path d="M5.5 8.5l1.7 1.7"/></svg>,
  // Courses — screen with play triangle (video learning)
  courses:        <svg {...S}><rect x="1.5" y="3" width="13" height="8.5" rx="1.5"/><path d="M6.5 5.8l3.5 1.95-3.5 1.95V5.8z" strokeWidth="1.2"/><path d="M5.5 14h5M8 11.5V14"/></svg>,
  // Paths — stepping stones / waypoint route
  paths:          <svg {...S}><circle cx="3.5" cy="12.5" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="12.5" cy="3.5" r="1.5"/><path d="M4.6 11.4 6.9 9.1M9.1 6.9l2.3-2.3"/></svg>,
  // Workshops — calendar with a live broadcast dot
  workshops:      <svg {...S}><rect x="2" y="4" width="12" height="10" rx="1.5"/><path d="M5 4V2.5M11 4V2.5M2 7h12"/><circle cx="11.5" cy="11" r="1.5" fill="currentColor" strokeWidth="0"/><circle cx="11.5" cy="11" r="2.5" strokeWidth="1" opacity=".4"/></svg>,
  // Instructors — person with a small teaching board behind them
  instructors:    <svg {...S}><circle cx="7.5" cy="5.5" r="2.5"/><path d="M2 14c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5"/><path d="M11.5 2h3v3.5h-3zM13 5.5v1.5"/></svg>,
  // Commands — keyboard (it's literally keyboard shortcuts)
  commands:       <svg {...S}><rect x="1.5" y="5" width="13" height="8" rx="1.5"/><rect x="3" y="7" width="2" height="1.5" rx=".4"/><rect x="7" y="7" width="2" height="1.5" rx=".4"/><rect x="11" y="7" width="2" height="1.5" rx=".4"/><rect x="5" y="9.5" width="2" height="1.5" rx=".4"/><rect x="9" y="9.5" width="2" height="1.5" rx=".4"/><rect x="4.5" y="2" width="7" height="1.5" rx=".4"/></svg>,
  // Combos — two inputs merging into one output (recipe/combination)
  combos:         <svg {...S}><circle cx="3.5" cy="5" r="1.5"/><circle cx="3.5" cy="11" r="1.5"/><circle cx="12.5" cy="8" r="1.5"/><path d="M5 5c2.5 0 3 3 5.5 3M5 11c2.5 0 3-3 5.5-3"/></svg>,
  // Practice — flashcard being flipped
  practice:       <svg {...S}><rect x="2" y="4" width="12" height="9" rx="1.5"/><path d="M8 2v2M6.5 6.5h3M6.5 9h2"/><path d="M12 2.5l1 1-1 1" strokeWidth="1.2"/></svg>,
  // Resources — folder with a download arrow
  resources:      <svg {...S}><path d="M2 5.5A1.5 1.5 0 0 1 3.5 4H6l1.5 1.5H13A1.5 1.5 0 0 1 14.5 7v5A1.5 1.5 0 0 1 13 13.5H3A1.5 1.5 0 0 1 1.5 12V5.5z"/><path d="M8 7.5v3.5M6.5 9.5 8 11l1.5-1.5"/></svg>,
  // Problem Solver — lightbulb (insight / solution)
  problemSolver:  <svg {...S}><path d="M8 2a4 4 0 0 1 2.5 7.1c-.4.4-.5.7-.5 1v.9H6v-.9c0-.3-.1-.6-.5-1A4 4 0 0 1 8 2z"/><path d="M6.5 12.5h3M7.5 14h1"/></svg>,
  // Learners — graduation cap
  learners:       <svg {...S}><path d="M8 3.5 1.5 7 8 10.5 14.5 7 8 3.5z"/><path d="M5 8.5v3.5c0 1 1.3 1.5 3 1.5s3-.5 3-1.5V8.5"/><path d="M14.5 7v4"/></svg>,
  // Progress — upward trend with a finishing flag
  progress:       <svg {...S}><path d="M2 13l3-3.5 2.5 2 3.5-5.5L14 9"/><path d="M2 15h12"/></svg>,
  // Certificates — ribbon / rosette award
  certificates:   <svg {...S}><circle cx="8" cy="6.5" r="3.5"/><path d="M5.5 9 4 14l4-1.5L12 14l-1.5-5"/><path d="M6.5 6.5l1 1 2-2"/></svg>,
  // Analytics — ascending bar chart
  analytics:      <svg {...S}><rect x="2" y="9" width="3" height="5" rx=".5"/><rect x="6.5" y="6" width="3" height="8" rx=".5"/><rect x="11" y="3" width="3" height="11" rx=".5"/><path d="M2 2.5h12" strokeWidth="1" opacity=".3"/></svg>,
  // Search Insights — magnifying glass with a trend line inside
  searchInsights: <svg {...S}><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14 14"/><path d="M4.5 8.5l1.5-2 1.5 1 2-2.5" strokeWidth="1.2"/></svg>,
  // Settings — gear / cog
  settings:       <svg {...S}><circle cx="8" cy="8" r="2.2"/><path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"/></svg>,
};

type NavGroup = {
  label: string;
  items: { id: AdminTab; label: string; icon: React.ReactNode; description: string }[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ id: "dashboard", label: "Dashboard", icon: Icons.dashboard, description: "What needs attention" }],
  },
  {
    label: "Build",
    items: [
      { id: "courses",     label: "Courses",        icon: Icons.courses,     description: "Modules and lessons" },
      { id: "paths",       label: "Learning Paths", icon: Icons.paths,       description: "Learner journeys" },
      { id: "workshops",   label: "Live Workshops", icon: Icons.workshops,   description: "Events and bookings" },
      { id: "instructors", label: "Instructors",    icon: Icons.instructors, description: "Tutor profiles" },
    ],
  },
  {
    label: "Reusable Content",
    items: [
      { id: "commands",       label: "Command Library", icon: Icons.commands,      description: "Reusable actions" },
      { id: "combos",         label: "Workflow Combos", icon: Icons.combos,        description: "Reusable recipes" },
      { id: "practice",       label: "Practice Tasks",  icon: Icons.practice,      description: "Tasks and quizzes" },
      { id: "resources",      label: "Resources",       icon: Icons.resources,     description: "Files and links" },
      { id: "problem-solver", label: "Problem Solver",  icon: Icons.problemSolver, description: "Learner questions" },
    ],
  },
  {
    label: "Support",
    items: [
      { id: "learners",     label: "Learners",      icon: Icons.learners,     description: "Accounts and access" },
      { id: "progress",     label: "Progress",      icon: Icons.progress,     description: "Completion data" },
      { id: "certificates", label: "Certificates",  icon: Icons.certificates, description: "Awards and eligibility" },
    ],
  },
  {
    label: "Improve",
    items: [
      { id: "analytics",       label: "Analytics",       icon: Icons.analytics,       description: "Platform metrics" },
      { id: "search-insights", label: "Search Insights", icon: Icons.searchInsights,  description: "Learner demand" },
    ],
  },
  {
    label: "System",
    items: [{ id: "settings", label: "Settings", icon: Icons.settings, description: "Platform setup" }],
  },
];

const TAB_TEXT: Record<AdminTab, { title: string; description: string }> = {
  dashboard: { title: "Dashboard", description: "What needs attention across the CMS." },
  courses: { title: "Courses", description: "Create the course catalogue, curriculum and lessons." },
  paths: { title: "Learning Paths", description: "Build high-level learner journeys." },
  workshops: { title: "Live Workshops", description: "Plan, publish and manage live sessions." },
  instructors: { title: "Instructors", description: "Manage instructor profiles, photos and expertise." },
  commands: { title: "Command Library", description: "Reusable software knowledge blocks." },
  combos: { title: "Workflow Combos", description: "Reusable problem-solving recipes." },
  practice: { title: "Practice Tasks", description: "Flashcards, quizzes and certificates." },
  resources: { title: "Resources", description: "Reusable files, templates, links and downloads." },
  "problem-solver": { title: "Problem Solver", description: "Map learner questions to useful content." },
  learners: { title: "Learners", description: "Learner accounts, plans and enrolments." },
  progress: { title: "Progress", description: "Aggregate learning progress and completion." },
  certificates: { title: "Certificates", description: "Templates, issued certificates and eligibility." },
  analytics: { title: "Analytics", description: "Platform metrics and content performance." },
  "search-insights": { title: "Search Insights", description: "Searches, gaps and unmatched learner needs." },
  settings: { title: "Settings", description: "Platform configuration and admin setup." },
};

const PLACEHOLDER_TABS: AdminTab[] = ["progress", "analytics", "search-insights", "settings"];

const WORKFLOWS: Array<{
  id: string;
  title: string;
  body: string;
  tab: AdminTab;
  tabs: AdminTab[];
}> = [
  {
    id: "build",
    title: "Build curriculum",
    body: "Paths, courses, lessons and reusable content",
    tab: "courses",
    tabs: ["courses", "paths", "commands", "combos", "resources", "problem-solver"],
  },
  {
    id: "deliver",
    title: "Deliver live",
    body: "Workshops, instructors, joining links and recordings",
    tab: "workshops",
    tabs: ["workshops", "instructors"],
  },
  {
    id: "support",
    title: "Support learners",
    body: "Accounts, access, progress and certificates",
    tab: "learners",
    tabs: ["learners", "progress", "practice", "certificates"],
  },
  {
    id: "improve",
    title: "Improve platform",
    body: "Analytics, learner searches and setup",
    tab: "dashboard",
    tabs: ["dashboard", "analytics", "search-insights", "settings"],
  },
];

function workflowForTab(tab: AdminTab) {
  return WORKFLOWS.find((workflow) => workflow.tabs.includes(tab)) ?? WORKFLOWS[0];
}

function StudioWorkflowSwitcher({
  activeTab,
  onOpen,
}: {
  activeTab: AdminTab;
  onOpen: (tab: AdminTab) => void;
}) {
  const activeWorkflow = workflowForTab(activeTab);
  return (
    <section className="aa-workflow-switcher" aria-label="Admin workflows">
      <div className="aa-workflow-current">
        <span>Current workflow</span>
        <strong>{activeWorkflow.title}</strong>
      </div>
      <div className="aa-workflow-options">
        {WORKFLOWS.map((workflow) => (
          <button
            key={workflow.id}
            type="button"
            className={activeWorkflow.id === workflow.id ? "active" : ""}
            onClick={() => onOpen(workflow.tab)}
          >
            <strong>{workflow.title}</strong>
            <span>{workflow.body}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function StudioPlaceholderPage({
  tab,
  onOpen,
}: {
  tab: AdminTab;
  onOpen: (tab: AdminTab) => void;
}) {
  const actions: Partial<Record<AdminTab, Array<{ title: string; body: string; tab?: AdminTab; href?: string }>>> = {
    progress: [
      { title: "Review learners", body: "Check enrolments, completions and student access.", tab: "learners" },
      { title: "Open practice", body: "Inspect practice decks, quizzes and certificates.", tab: "practice" },
      { title: "Improve courses", body: "Use course health to fix missing content.", tab: "courses" },
    ],
    analytics: [
      { title: "Production dashboard", body: "Start with publish blockers and ready courses.", tab: "dashboard" },
      { title: "Learner demand", body: "Use search gaps to decide what to create next.", tab: "search-insights" },
      { title: "Workshop performance", body: "Review live sessions, recordings and delivery state.", tab: "workshops" },
    ],
    "search-insights": [
      { title: "Open search review", body: "Inspect failed and recent learner searches.", href: "/admin/search-review" },
      { title: "Create missing content", body: "Turn repeated searches into lessons and commands.", tab: "courses" },
      { title: "Link answers", body: "Map questions to commands, combos and lessons.", tab: "problem-solver" },
    ],
    settings: [
      { title: "Learner settings", body: "Check account fields and access behaviour.", tab: "learners" },
      { title: "Billing setup", body: "Confirm plans, Stripe links and workshop payments.", tab: "workshops" },
      { title: "Resource access", body: "Audit free, pro, student and workshop resources.", tab: "resources" },
    ],
  };
  const items = actions[tab] ?? [];
  return (
    <div className="aa-placeholder-page">
      <header className="aa-page-header">
        <div>
          <span className="aa-eyebrow">Studio area</span>
          <h1>{TAB_TEXT[tab].title}</h1>
          <p>{TAB_TEXT[tab].description}</p>
        </div>
      </header>
      <section className="aa-placeholder-journey">
        <div className="aa-empty-state">
          <div className="aa-empty-mark">+</div>
          <h3>{TAB_TEXT[tab].title} workspace</h3>
          <p>This workspace has a clear place in the admin journey. Use the connected areas below while the dedicated reporting model is being filled out.</p>
        </div>
        <div className="aa-support-actions">
          {items.map((item) => item.href ? (
            <Link key={item.title} href={item.href}>
              <strong>{item.title}</strong>
              <span>{item.body}</span>
            </Link>
          ) : (
            <button key={item.title} type="button" onClick={() => item.tab && onOpen(item.tab)}>
              <strong>{item.title}</strong>
              <span>{item.body}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function StudioTabLoading({ label = "Loading section..." }: { label?: string }) {
  return <div className="aa-loading">{label}</div>;
}

const DashboardTab = dynamic(() => import("./dashboard-tab").then((mod) => mod.DashboardTab), {
  loading: () => <StudioTabLoading label="Loading dashboard..." />,
});
const CoursesTab = dynamic(() => import("./courses-tab").then((mod) => mod.CoursesTab), {
  loading: () => <StudioTabLoading label="Loading courses..." />,
});
const PathsTab = dynamic(() => import("./paths-tab").then((mod) => mod.PathsTab), {
  loading: () => <StudioTabLoading label="Loading learning paths..." />,
});
const CombosTab = dynamic(() => import("./combos-tab").then((mod) => mod.CombosTab), {
  loading: () => <StudioTabLoading label="Loading combos..." />,
});
const CommandsTab = dynamic(() => import("./commands-tab").then((mod) => mod.CommandsTab), {
  loading: () => <StudioTabLoading label="Loading commands..." />,
});
const WorkshopsTab = dynamic(() => import("./workshops-tab").then((mod) => mod.WorkshopsTab), {
  loading: () => <StudioTabLoading label="Loading workshops..." />,
});
const InstructorsTab = dynamic(() => import("./instructors-tab").then((mod) => mod.InstructorsTab), {
  loading: () => <StudioTabLoading label="Loading instructors..." />,
});
const PracticeTab = dynamic(() => import("./practice-tab").then((mod) => mod.PracticeTab), {
  loading: () => <StudioTabLoading label="Loading practice..." />,
});
const LearnersTab = dynamic(() => import("./learners-tab").then((mod) => mod.LearnersTab), {
  loading: () => <StudioTabLoading label="Loading learners..." />,
});
const ResourcesTab = dynamic(() => import("./resources-tab").then((mod) => mod.ResourcesTab), {
  loading: () => <StudioTabLoading label="Loading resources..." />,
});
const ProblemSolverTab = dynamic(() => import("./problem-solver-tab").then((mod) => mod.ProblemSolverTab), {
  loading: () => <StudioTabLoading label="Loading problem solver..." />,
});

export function StudioShell() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [adminStatus, setAdminStatus] = useState<"checking" | "allowed" | "denied">("checking");
  const [adminCheckMessage, setAdminCheckMessage] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    if (typeof window === "undefined") return "dashboard";
    const stored = window.localStorage.getItem("addition-admin-tab") as AdminTab | null;
    return stored && TAB_TEXT[stored] ? stored : "dashboard";
  });
  const [importRefreshKey, setImportRefreshKey] = useState(0);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session ?? null);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const token = session?.access_token;
    if (!token) return;
    let alive = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    fetch("/api/v1/admin/me", {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((res) => {
        if (!alive) return;
        setAdminStatus(res.ok ? "allowed" : "denied");
        if (!res.ok) setAdminCheckMessage(`Admin check failed with status ${res.status}.`);
      })
      .catch((error: unknown) => {
        if (!alive) return;
        setAdminStatus("denied");
        setAdminCheckMessage(error instanceof Error && error.name === "AbortError"
          ? "Admin check timed out. Try signing in again."
          : "Admin check failed. Try signing in again.");
      })
      .finally(() => {
        window.clearTimeout(timeout);
      });
    return () => {
      alive = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [session?.access_token]);

  async function signInAdmin() {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setAuthMessage("Admin authentication is not configured for this environment.");
      return;
    }
    const email = adminEmail.trim();
    if (!email || !adminPassword) {
      setAuthMessage("Enter the super admin email and password.");
      return;
    }
    setAuthBusy(true);
    setAuthMessage("Checking super admin credentials...");
    const { error } = await supabase.auth.signInWithPassword({ email, password: adminPassword });
    if (error) {
      setAuthMessage(error.message);
      setAuthBusy(false);
      return;
    }
    setAuthMessage("Credentials accepted. Verifying admin permissions...");
    setAdminPassword("");
    setAuthBusy(false);
  }

  async function resetAdminPassword() {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setAuthMessage("Admin authentication is not configured for this environment.");
      return;
    }
    const email = adminEmail.trim();
    if (!email) {
      setAuthMessage("Enter your super admin email first.");
      return;
    }
    setAuthBusy(true);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/admin` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setAuthMessage(error ? error.message : "Password reset email sent to the admin address.");
    setAuthBusy(false);
  }

  async function signOut() {
    const sb = getBrowserSupabaseClient();
    if (sb) await sb.auth.signOut();
    router.push("/admin");
  }

  useEffect(() => {
    function refreshAfterImport() {
      setImportRefreshKey((current) => current + 1);
    }
    window.addEventListener("addition:admin-imported", refreshAfterImport);
    return () => window.removeEventListener("addition:admin-imported", refreshAfterImport);
  }, []);

  function openTab(tab: AdminTab) {
    setActiveTab(tab);
    window.localStorage.setItem("addition-admin-tab", tab);
  }

  if (loading) {
    return (
      <div className="adm-boot">
        <div className="adm-boot-logo">ADDITION</div>
        <div className="adm-boot-sub">Loading studio...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="adm-gate">
        <form
          className="adm-gate-card adm-login-card"
          onSubmit={(event) => {
            event.preventDefault();
            void signInAdmin();
          }}
        >
          <div className="adm-gate-logo">ADDITION</div>
          <h1 className="adm-gate-title">Super Admin Portal</h1>
          <p className="adm-gate-sub">A separate CMS and LMS sign-in for approved content admins.</p>
          <div className="adm-login-fields">
            <label className="adm-login-field">
              <span>Admin email</span>
              <input type="email" autoComplete="username" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} placeholder="admin@example.com" />
            </label>
            <label className="adm-login-field">
              <span>Password</span>
              <input type="password" autoComplete="current-password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder="Super admin password" />
            </label>
          </div>
          {authMessage && <p className="adm-login-message">{authMessage}</p>}
          <button className="adm-gate-btn" type="submit" disabled={authBusy}>{authBusy ? "Signing in..." : "Sign in to admin"}</button>
          <button className="adm-login-reset" type="button" disabled={authBusy} onClick={() => void resetAdminPassword()}>Reset admin password</button>
        </form>
      </div>
    );
  }

  if (session && !session.access_token) {
    return (
      <div className="adm-gate">
        <div className="adm-gate-card">
          <div className="adm-gate-logo">ADDITION</div>
          <h1 className="adm-gate-title">Admin access required</h1>
          <p className="adm-gate-sub">No admin session token was found. Sign in again.</p>
          <button type="button" className="adm-gate-btn" onClick={() => void signOut()}>Sign in again</button>
        </div>
      </div>
    );
  }

  if (adminStatus === "checking") {
    return (
      <div className="adm-boot">
        <div className="adm-boot-logo">ADDITION</div>
        <div className="adm-boot-sub">Checking admin access...</div>
        <button type="button" className="adm-boot-action" onClick={() => void signOut()}>Sign in again</button>
      </div>
    );
  }

  if (adminStatus === "denied") {
    return (
      <div className="adm-gate">
        <div className="adm-gate-card">
          <div className="adm-gate-logo">ADDITION</div>
          <h1 className="adm-gate-title">Admin access required</h1>
          <p className="adm-gate-sub">{adminCheckMessage || "This CMS and LMS portal is restricted to approved super admins."}</p>
          <button type="button" className="adm-gate-btn" onClick={() => void signOut()}>Use another admin account</button>
        </div>
      </div>
    );
  }

  const token = session.access_token;

  return (
    <div className="adm-portal aa-studio-shell">
      <aside className="adm-portal-sidebar aa-studio-sidebar">
        <div className="adm-portal-brand">
          <span className="adm-portal-brand-name"><span className="adm-brand-mark">+</span> addition</span>
          <span className="adm-portal-brand-sub">CMS Studio</span>
        </div>

        <nav className="adm-portal-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="adm-nav-group">
              <div className="adm-nav-group-label">{group.label}</div>
              {group.items.map(({ id, label, icon, description }) => (
                <button key={id} type="button" className={`adm-portal-nav-btn${activeTab === id ? " active" : ""}`} onClick={() => openTab(id)}>
                  <span className="adm-portal-nav-icon">{icon}</span>
                  <span className="adm-nav-btn-label">
                    {label}
                    <small>{description}</small>
                  </span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="adm-portal-sidebar-footer">
          <div className="adm-portal-user">
            <div className="adm-user-avatar">{(session.user?.email?.[0] ?? "A").toUpperCase()}</div>
            <span className="adm-portal-user-email">{session.user?.email ?? "Admin"}</span>
          </div>
          <button type="button" className="adm-portal-signout" onClick={() => void signOut()}>Sign out</button>
        </div>
      </aside>

      <main className="adm-portal-main aa-studio-main">
        <StudioWorkflowSwitcher activeTab={activeTab} onOpen={openTab} />
        {activeTab === "dashboard" && (
          <DashboardTab
            accessToken={token}
            onOpenCourses={() => openTab("courses")}
            onOpenPaths={() => openTab("paths")}
            onOpenWorkshops={() => openTab("workshops")}
            onOpenLearners={() => openTab("learners")}
            onOpenResources={() => openTab("resources")}
            onOpenSearchInsights={() => openTab("search-insights")}
          />
        )}
        {activeTab === "courses" && <CoursesTab key={`courses-${importRefreshKey}`} accessToken={token} />}
        {activeTab === "paths" && <PathsTab key={`paths-${importRefreshKey}`} accessToken={token} />}
        {activeTab === "workshops" && <WorkshopsTab key={`workshops-${importRefreshKey}`} accessToken={token} />}
        {activeTab === "instructors" && <InstructorsTab key={`instructors-${importRefreshKey}`} accessToken={token} />}
        {activeTab === "commands" && <CommandsTab key={`commands-${importRefreshKey}`} accessToken={token} />}
        {activeTab === "combos" && <CombosTab key={`combos-${importRefreshKey}`} accessToken={token} />}
        {activeTab === "practice" && <PracticeTab key={`practice-${importRefreshKey}`} accessToken={token} />}
        {activeTab === "resources" && <ResourcesTab key={`resources-${importRefreshKey}`} accessToken={token} />}
        {activeTab === "problem-solver" && <ProblemSolverTab key={`problem-solver-${importRefreshKey}`} accessToken={token} />}
        {activeTab === "learners" && <LearnersTab accessToken={token} />}
        {activeTab === "certificates" && <PracticeTab key={`certificates-${importRefreshKey}`} accessToken={token} initialSection="certificates" />}
        {PLACEHOLDER_TABS.includes(activeTab) && (
          <StudioPlaceholderPage tab={activeTab} onOpen={openTab} />
        )}
      </main>
    </div>
  );
}
