"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { SOFTWARE_LIST, useSoftwareContext, type SoftwareId } from "@/lib/software-context";
import { WorkshopCartButton } from "@/components/workshop-cart/WorkshopCartDrawer";
import { UpgradeModal } from "@/components/upgrade/UpgradeModal";
import { FirstVisitTip, type TipDef } from "@/components/tutorial/FirstVisitTip";

type AppFrameProps = {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  userName?: string;
  userEmail?: string;
  isPro?: boolean;
  topTabs?: Array<{ href: string; label: string }>;
  workshopCount?: number;
  quizDueCount?: number;
  hideTopbar?: boolean;
  hideSoftwareSwitcher?: boolean;
  /** Search box rendered in the directory toolbar (between software switcher and tabs) */
  toolbarQuery?: string;
  onToolbarQueryChange?: (value: string) => void;
  search?: {
    placeholder: string;
    value: string;
    onChange: (next: string) => void;
    onSubmit?: () => void;
  };
};

function initialsFromName(name?: string, email?: string): string {
  const basis = (name || email || "AD").trim();
  const parts = basis.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  return basis.slice(0, 2).toUpperCase();
}

function isActivePath(currentPath: string, href: string): boolean {
  return currentPath === href || currentPath.startsWith(`${href}/`) || currentPath.startsWith(`${href}?`);
}

// Ordered free-first and by granularity: commands are the free daily-use
// anchor, combos chain commands, courses teach the whole craft. The order
// mirrors the upgrade path left to right.
const topLevelTabs = [
  { href: "/commands", label: "Commands" },
  { href: "/combos",   label: "Combos"   },
  { href: "/learn",    label: "Courses"  },
];


function PathsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <path d="M12 7v4M9.5 17.5L12 11M14.5 17.5L12 11" />
    </svg>
  );
}

function CoursesIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function CombosIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function CommandsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function WorkshopsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function PracticeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M9 9h6M9 12h4" />
      <circle cx="17" cy="16" r="2.5" />
      <path d="M19.5 18.5L22 21" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// Pages that show the software switcher in the topbar
const SOFTWARE_AWARE_PATHS = ["/commands", "/combos", "/learn", "/paths", "/search"];

const CAT_LABELS: Record<string, string> = {
  "3d": "3D Modelling",
  parametric: "Parametric",
  render: "Render & Viz",
  bim: "BIM & CAD",
  present: "Present",
  experience: "Experience",
  ai: "AI & Generative",
};

function SoftwareSwitcher() {
  const [activeSoftware, setActiveSoftware] = useSoftwareContext();
  const [open, setOpen] = useState(false);

  const active = SOFTWARE_LIST.find((s) => s.id === activeSoftware);

  return (
    <div className="sw-switcher">
      <button
        type="button"
        className={`sw-switcher-pill${active ? " has-selection" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={active ? { "--sw-color": active.color } as React.CSSProperties : undefined}
      >
        {active ? (
          <span className="sw-switcher-abbr">{active.abbr}</span>
        ) : (
          <span className="sw-switcher-abbr sw-switcher-abbr--empty">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          </span>
        )}
        <span className={`sw-switcher-label${!active ? " sw-switcher-placeholder" : ""}`}>
          {active ? active.label : "All software"}
        </span>
        <svg className="sw-switcher-chevron-icon" width="12" height="12" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <>
          <div className="sw-switcher-backdrop" onClick={() => setOpen(false)} />
          <div className="sw-switcher-dropdown">
            <button
              type="button"
              className={`sw-switcher-option sw-switcher-option--all${!activeSoftware ? " active" : ""}`}
              onClick={() => { setActiveSoftware(null); setOpen(false); }}
            >
              <span className="sw-opt-abbr sw-opt-abbr--all">—</span>
              <span>All software</span>
              {!activeSoftware && <span className="sw-opt-check">✓</span>}
            </button>

            {(["3d", "parametric", "bim", "render", "present", "experience", "ai"] as const).map((cat) => {
              const items = SOFTWARE_LIST.filter((s) => s.category === cat);
              return (
                <div key={cat} className="sw-switcher-group">
                  <div className="sw-switcher-group-label">{CAT_LABELS[cat]}</div>
                  {items.map((sw) => (
                    <button
                      key={sw.id}
                      type="button"
                      className={`sw-switcher-option${activeSoftware === sw.id ? " active" : ""}`}
                      style={{ "--sw-color": sw.color } as React.CSSProperties}
                      onClick={() => { setActiveSoftware(sw.id as SoftwareId); setOpen(false); }}
                    >
                      <span className="sw-opt-abbr" style={{ background: sw.color + "22", color: sw.color }}>{sw.abbr}</span>
                      <span>{sw.label}</span>
                      {activeSoftware === sw.id && <span className="sw-opt-check">✓</span>}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── First-visit tips ────────────────────────────────────────────────────────

const PAGE_TIPS: Array<{ match: (p: string) => boolean; section: string; tip: TipDef }> = [
  {
    match: (p) => p === "/learn" || p.startsWith("/learn?") || (p.startsWith("/learn/") && !p.includes("?course=")),
    section: "learn",
    tip: {
      accent: "learn",
      navHref: "/learn",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      ),
      title: "Browse every course",
      body: "Filter by software, level, or topic. Click any course to open the lesson list — progress is saved automatically as you go.",
    },
  },
  {
    match: (p) => p === "/paths" || p.startsWith("/paths?"),
    section: "paths",
    tip: {
      accent: "paths",
      navHref: "/learn",  // sidebar Learn link is the closest anchor when on /paths
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>
          <path d="M12 7v4M9.5 17.5L12 11M14.5 17.5L12 11"/>
        </svg>
      ),
      title: "Structured learning paths",
      body: "Each path is a curated sequence of courses — beginner to expert. Enrol once and we track every step so you always know what's next.",
    },
  },
  {
    match: (p) => p === "/workshops" || p.startsWith("/workshops?"),
    section: "workshops",
    tip: {
      accent: "workshops",
      navHref: "/workshops",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      ),
      title: "Live instructor-led workshops",
      body: "Book a real-time session online or in person. Recordings are available after each session — so you never miss a technique.",
    },
  },
  {
    match: (p) => p === "/commands" || p.startsWith("/commands?"),
    section: "commands",
    tip: {
      accent: "commands",
      navHref: "/commands",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
        </svg>
      ),
      title: "Commands reference",
      body: "Every shortcut and command for Rhino, Grasshopper, Revit and more. Use the software switcher to filter — or search across all tools at once.",
    },
  },
  {
    match: (p) => p === "/combos" || p.startsWith("/combos?"),
    section: "combos",
    tip: {
      accent: "combos",
      navHref: "/combos",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
          <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        </svg>
      ),
      title: "Command combos",
      body: "Multi-step sequences that solve real problems fast. Each combo shows the exact key presses in order — switch software to see the right ones.",
    },
  },
  {
    match: (p) => p === "/practice" || p.startsWith("/practice?"),
    section: "practice",
    tip: {
      accent: "practice",
      navHref: "/practice",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <path d="M9 9h6M9 12h4"/>
          <circle cx="17" cy="16" r="2.5"/>
          <path d="M19.5 18.5L22 21"/>
        </svg>
      ),
      title: "Spaced-repetition practice",
      body: "Addition surfaces commands you're likely to forget before you forget them. Quick flashcard sessions keep your muscle memory sharp.",
    },
  },
];

function useCurrentTip(pathname: string): { section: string; tip: TipDef } | null {
  const match = PAGE_TIPS.find((entry) => entry.match(pathname));
  return match ? { section: match.section, tip: match.tip } : null;
}

export function AppFrame({
  children,
  userName,
  userEmail,
  isPro,
  topTabs = topLevelTabs,
  workshopCount = 0,
  quizDueCount = 0,
  hideSoftwareSwitcher = false,
  toolbarQuery,
  onToolbarQueryChange,
  search,
}: AppFrameProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem("addition-theme") === "light" ? "light" : "dark";
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("addition-theme", nextTheme);
  }

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeAccessToken, setUpgradeAccessToken] = useState<string | null>(null);

  async function handleSidebarUpgrade(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const supabase = getBrowserSupabaseClient();
    if (!supabase) { router.push("/auth?next=/dashboard"); return; }
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) { router.push("/auth?next=/dashboard"); return; }
    setUpgradeAccessToken(token);
    setUpgradeModalOpen(true);
  }

  async function handleLogout() {
    const supabase = getBrowserSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/auth");
  }

  const currentPath = useMemo(() => pathname || "/dashboard", [pathname]);
  const utilityView =
    isActivePath(currentPath, "/dashboard") ||
    isActivePath(currentPath, "/settings");

  const currentTip = useCurrentTip(currentPath);

  return (
    <div className={`app-shell${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-head">
          <div className="brand">
            <span className="brand-plus" aria-hidden="true">+</span>
            <span className="brand-name">addition</span>
          </div>
          <button
            type="button"
            className="sidebar-toggle-btn"
            aria-label={sidebarCollapsed ? "Show left bar" : "Hide left bar"}
            onClick={() => setSidebarCollapsed((value) => !value)}
          >
            {sidebarCollapsed ? "›" : "‹"}
          </button>
        </div>

        {search ? (
          <div className="sidebar-search">
            <input
              className="search-input"
              type="search"
              value={search.value}
              onChange={(event) => search.onChange(event.target.value)}
              placeholder={search.placeholder}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  search.onSubmit?.();
                }
              }}
            />
          </div>
        ) : null}

        <nav className="sidebar-nav">
          <Link href="/learn" className={`sidebar-nav-btn${
            ["/skills", "/learn", "/paths", "/combos", "/commands"].some(p => isActivePath(currentPath, p))
              ? " active" : ""
          }`}>
            <CoursesIcon />
            <span>Learn</span>
          </Link>
          <Link href="/practice" className={`sidebar-nav-btn${isActivePath(currentPath, "/practice") ? " active" : ""}`}>
            <PracticeIcon />
            <span>Practice</span>
            {quizDueCount > 0 ? <span className="sidebar-badge">{quizDueCount}</span> : null}
          </Link>
          <Link href="/workshops" className={`sidebar-nav-btn${isActivePath(currentPath, "/workshops") ? " active" : ""}`}>
            <WorkshopsIcon />
            <span>Workshops</span>
            {workshopCount > 0 ? <span className="sidebar-badge">{workshopCount}</span> : null}
          </Link>
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-user-wrap">
          <Link href="/dashboard" className={`sidebar-user${isActivePath(currentPath, "/dashboard") ? " sidebar-user--active" : ""}`}>
            <div className="user-avatar">{initialsFromName(userName, userEmail)}</div>
            <div className="sidebar-user-info">
              <strong>{userName || userEmail || "Learner"}</strong>
              <span className={`plan-pill ${isPro ? "pro" : "free"}`}>{isPro ? "Pro" : "Free"}</span>
            </div>
            <svg className="sidebar-user-home-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </Link>
          {!isPro && (
            <button
              type="button"
              className="sidebar-upgrade-btn"
              onClick={(e) => void handleSidebarUpgrade(e)}
            >
              Upgrade to Pro →
            </button>
          )}
        </div>

        <div className="side-nav side-nav-utility">
          <WorkshopCartButton sidebar />
          <button type="button" className="sidebar-nav-btn sidebar-nav-btn-sm theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <span>☼</span> : <span>◐</span>}
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
          <Link href="/settings" className={`sidebar-nav-btn sidebar-nav-btn-sm${isActivePath(currentPath, "/settings") ? " active" : ""}`}>
            <SettingsIcon />
            <span>Settings</span>
          </Link>
          <button type="button" className="sidebar-nav-btn sidebar-nav-btn-sm" onClick={() => void handleLogout()}>
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <nav className="mobile-bottom-nav" aria-label="Main navigation">
        <Link href="/dashboard" className={`mob-nav-btn${isActivePath(currentPath, "/dashboard") ? " active" : ""}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>Home</span>
        </Link>
        <Link href="/learn" className={`mob-nav-btn${
          ["/skills", "/learn", "/paths", "/combos", "/commands"].some(p => isActivePath(currentPath, p))
            ? " active" : ""
        }`}>
          <CoursesIcon size={20} />
          <span>Learn</span>
        </Link>
        <Link href="/practice" className={`mob-nav-btn${isActivePath(currentPath, "/practice") ? " active" : ""}`}>
          <PracticeIcon size={20} />
          <span>Practice</span>
          {quizDueCount > 0 ? <span className="mob-nav-badge">{quizDueCount}</span> : null}
        </Link>
        <Link href="/workshops" className={`mob-nav-btn${isActivePath(currentPath, "/workshops") ? " active" : ""}`}>
          <WorkshopsIcon size={20} />
          <span>Workshops</span>
          {workshopCount > 0 ? <span className="mob-nav-badge">{workshopCount}</span> : null}
        </Link>
      </nav>

      <main className="main">
        {sidebarCollapsed ? (
          <button type="button" className="sidebar-restore-btn" onClick={() => setSidebarCollapsed(false)} aria-label="Show left bar">
            ›
          </button>
        ) : null}

        {/* Directory toolbar: software filter (left) + segment nav (right) */}
        {topTabs.length > 0 ? (
          <div className={`directory-toolbar${utilityView ? " hidden" : ""}`}>
            {SOFTWARE_AWARE_PATHS.some((p) => isActivePath(currentPath, p)) ? (
              <div className="directory-toolbar-sw">
                <SoftwareSwitcher />
              </div>
            ) : <span />}
            {onToolbarQueryChange !== undefined ? (
              <div className="toolbar-search-wrap">
                <svg className="toolbar-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  className="toolbar-search-input"
                  type="search"
                  value={toolbarQuery ?? ""}
                  onChange={(e) => onToolbarQueryChange(e.target.value)}
                  placeholder="What do you want to learn?"
                />
                {toolbarQuery ? (
                  <button type="button" className="toolbar-search-clear" onClick={() => onToolbarQueryChange("")} aria-label="Clear search">✕</button>
                ) : null}
              </div>
            ) : null}
            <nav className="segment-nav" aria-label="Primary">
              <div className="segment-nav-tabs">
                {topTabs.map((item) => (
                  <Link key={item.href} href={item.href} className={`segment-btn${isActivePath(currentPath, item.href) ? " active" : ""}`}>
                    {item.href === "/learn"    ? <CoursesIcon size={15} />   : null}
                    {item.href === "/combos"   ? <CombosIcon size={15} />    : null}
                    {item.href === "/commands" ? <CommandsIcon size={15} />  : null}
                    {item.href === "/paths"    ? <PathsIcon size={15} />     : null}
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        ) : (
          // Software-aware pages without tabs — keep the switcher in its own row
          !hideSoftwareSwitcher && SOFTWARE_AWARE_PATHS.some((p) => isActivePath(currentPath, p)) && (
            <div className="sw-switcher-bar">
              <SoftwareSwitcher />
            </div>
          )
        )}

        {search ? (
          <div className={`content-search${utilityView ? " hidden" : ""}`}>
            <svg className="content-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="search-input"
              type="search"
              value={search.value}
              onChange={(event) => search.onChange(event.target.value)}
              placeholder={search.placeholder}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  search.onSubmit?.();
                }
              }}
            />
          </div>
        ) : null}

        <section id="content-slot">{children}</section>
      </main>

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        accessToken={upgradeAccessToken}
        returnTo="/dashboard"
      />

      {/* Tutorial tips — position:fixed, rendered outside main flow */}
      {currentTip && (
        <FirstVisitTip key={currentTip.section} section={currentTip.section} tip={currentTip.tip} />
      )}
    </div>
  );
}
