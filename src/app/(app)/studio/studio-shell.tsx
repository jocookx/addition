"use client";

import { useEffect, useState } from "react";
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

type NavGroup = {
  label: string;
  items: { id: AdminTab; label: string; icon: string; description: string }[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ id: "dashboard", label: "Dashboard", icon: "D", description: "What needs attention" }],
  },
  {
    label: "Create",
    items: [
      { id: "courses", label: "Courses", icon: "C", description: "Modules and lessons" },
      { id: "paths", label: "Learning Paths", icon: "P", description: "Learner journeys" },
      { id: "workshops", label: "Live Workshops", icon: "W", description: "Events and bookings" },
      { id: "instructors", label: "Instructors", icon: "I", description: "Tutor profiles" },
    ],
  },
  {
    label: "Library",
    items: [
      { id: "commands", label: "Command Library", icon: "K", description: "Reusable actions" },
      { id: "combos", label: "Workflow Combos", icon: "F", description: "Reusable recipes" },
      { id: "practice", label: "Practice Tasks", icon: "T", description: "Tasks and quizzes" },
      { id: "resources", label: "Resources", icon: "R", description: "Files and links" },
      { id: "problem-solver", label: "Problem Solver", icon: "Q", description: "Learner questions" },
    ],
  },
  {
    label: "People",
    items: [
      { id: "learners", label: "Learners", icon: "L", description: "Accounts and access" },
      { id: "progress", label: "Progress", icon: "G", description: "Completion data" },
      { id: "certificates", label: "Certificates", icon: "A", description: "Awards and eligibility" },
    ],
  },
  {
    label: "Insights",
    items: [
      { id: "analytics", label: "Analytics", icon: "N", description: "Platform metrics" },
      { id: "search-insights", label: "Search Insights", icon: "S", description: "Learner demand" },
    ],
  },
  {
    label: "System",
    items: [{ id: "settings", label: "Settings", icon: "O", description: "Platform setup" }],
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
        {activeTab === "dashboard" && <DashboardTab accessToken={token} onOpenCourses={() => openTab("courses")} />}
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
          <div className="aa-placeholder-page">
            <header className="aa-page-header">
              <div>
                <span className="aa-eyebrow">Studio area</span>
                <h1>{TAB_TEXT[activeTab].title}</h1>
                <p>{TAB_TEXT[activeTab].description}</p>
              </div>
            </header>
            <div className="aa-empty-state">
              <div className="aa-empty-mark">+</div>
              <h3>{TAB_TEXT[activeTab].title} workspace</h3>
              <p>This section now has a clear place in the CMS. It can be connected to its dedicated data model without changing the existing working routes.</p>
              {activeTab === "search-insights" && <Link className="st-create-btn" href="/admin/search-review">Open current Search Review</Link>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
