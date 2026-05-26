"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { AppFrame } from "@/components/legacy/AppFrame";
import { ToolActionDetailModal } from "@/components/tool-action/ToolActionDetailModal";
import type { CommandListItem } from "@/domain/command";
import { getCommands } from "@/lib/api/commands";
import { getToolkit } from "@/lib/api/toolkit";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { SOFTWARE_LIST, useSoftwareContext } from "@/lib/software-context";
import { getSoftwareTerms } from "@/lib/software-terminology";
import { rankBySmartMatch } from "@/lib/search/smart-match";
import { getCommandGroups } from "@/lib/command-groups";

const LEARNED_STORAGE_KEY = "addition.learned-commands";

function cleanCommandName(name: string) {
  return name.split(/\s*\|/)[0]?.trim() || name;
}

function decodeHtml(str: string): string {
  return str
    .replace(/&gt;/g, "›")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&#8209;/g, "-");
}

function getTopCategory(command: CommandListItem): string {
  if (command.software === "Grasshopper") return command.addon || "General";
  const first = command.menu.split(/[>/|]/)[0]?.trim();
  return first || "General";
}

function getSubCategory(command: CommandListItem): string {
  if (command.software === "Grasshopper") return command.addon || "General";
  const parts = command.menu.split(/[>/|]/).map((p) => p.trim()).filter(Boolean);
  return parts[1] || parts[0] || "General";
}

function commandSkeletonCard(key: string) {
  return (
    <div key={key} className="skeleton-card">
      <div className="skeleton-thumb" />
      <div className="skeleton-line h-lg w-60" />
      <div className="skeleton-line w-80" />
      <div className="skeleton-line w-40" />
    </div>
  );
}

export default function CommandsPage() {
  const router = useRouter();
  const [supabase] = useState<SupabaseClient | null>(() => getBrowserSupabaseClient());
  const [session, setSession] = useState<Session | null>(null);
  const [authBootstrapped, setAuthBootstrapped] = useState(false);
  const [allCommands, setAllCommands] = useState<CommandListItem[]>([]);
  const [activeSoftware, setActiveSoftware] = useSoftwareContext();
  const terms = getSoftwareTerms(activeSoftware);
  const [topCat, setTopCat] = useState("All");
  const [subCat, setSubCat] = useState("All");
  const [prevSoftware, setPrevSoftware] = useState<string | null>(activeSoftware);
  // Derive reset inline — when software changes, treat cats as "All" without an effect
  const effectiveTopCat = prevSoftware === activeSoftware ? topCat : "All";
  const effectiveSubCat = prevSoftware === activeSoftware ? subCat : "All";
  if (prevSoftware !== activeSoftware) { setPrevSoftware(activeSoftware); }
  const [intent, setIntent]         = useState("All");
  const [objectType, setObjectType] = useState("All");
  const [viewMode, setViewMode]     = useState<"grid" | "row">("grid");
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<CommandListItem | null>(null);
  const [status, setStatus] = useState("Loading commands...");
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [learned, setLearned] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(LEARNED_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as string[];
      return Object.fromEntries(parsed.map((v) => [v, true]));
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const keys = Object.keys(learned).filter((k) => learned[k]);
    window.localStorage.setItem(LEARNED_STORAGE_KEY, JSON.stringify(keys));
  }, [learned]);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let alive = true;
    void client.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session ?? null);
      setAuthBootstrapped(true);
    });
    const { data } = client.auth.onAuthStateChange((_evt, next) => {
      setSession(next);
      setAuthBootstrapped(true);
    });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, [supabase]);

  useEffect(() => {
    if (!session?.access_token) return;
    let canceled = false;
    getToolkit(session.access_token)
      .then((items) => {
        if (canceled) return;
        setSavedIds(Object.fromEntries(items.map((item) => [item.contentId, true])));
      })
      .catch(() => { if (canceled) return; });
    return () => { canceled = true; };
  }, [session?.access_token]);

  useEffect(() => {
    if (!authBootstrapped || session?.access_token || typeof window === "undefined") return;
    const next = `${window.location.pathname}${window.location.search}`;
    router.replace(`/auth?next=${encodeURIComponent(next)}`);
  }, [authBootstrapped, router, session?.access_token]);

  useEffect(() => {
    let canceled = false;
    async function load() {
      try {
        const data = await getCommands(activeSoftware ?? undefined);
        if (canceled) return;
        setAllCommands(data);
        setStatus(`${data.length} commands loaded.`);
      } catch (error) {
        if (canceled) return;
        setStatus(error instanceof Error ? error.message : "Failed to load commands.");
      }
    }
    void load();
    return () => { canceled = true; };
  }, [activeSoftware]);

  const softwareCommands = allCommands;


  /** Top-level category options for selected software */
  const topCatOptions = useMemo(() => {
    const values = new Set(softwareCommands.map(getTopCategory).filter((v) => v !== "General"));
    const sorted = Array.from(values).sort((a, b) => a.localeCompare(b));
    return sorted.length > 0 ? ["All", ...sorted] : [];
  }, [softwareCommands]);

  /** Sub-category options based on selected topCat */
  const subCatOptions = useMemo(() => {
    const base = effectiveTopCat !== "All"
      ? softwareCommands.filter((c) => getTopCategory(c) === effectiveTopCat)
      : softwareCommands;
    const values = new Set(base.map(getSubCategory).filter((v) => v !== "General" && v !== effectiveTopCat));
    const sorted = Array.from(values).sort((a, b) => a.localeCompare(b));
    return sorted.length > 0 ? ["All", ...sorted] : [];
  }, [softwareCommands, effectiveTopCat]);

  /**
   * Intent verbs available given the current objectType selection.
   * Cascades: pick a noun first → only relevant verbs are shown.
   */
  const intentOptions = useMemo(() => {
    const pool = objectType !== "All"
      ? softwareCommands.filter((c) => c.objectTypes?.includes(objectType))
      : softwareCommands;
    const values = new Set<string>();
    pool.forEach((c) => (c.intentCategories ?? []).forEach((v) => values.add(v)));
    return Array.from(values).sort();
  }, [softwareCommands, objectType]);

  /**
   * Object types available given the current intent selection.
   * Cascades: pick a verb first → only objects that verb can act on are shown.
   */
  const objectTypeOptions = useMemo(() => {
    const pool = intent !== "All"
      ? softwareCommands.filter((c) => c.intentCategories?.includes(intent))
      : softwareCommands;
    const values = new Set<string>();
    pool.forEach((c) => (c.objectTypes ?? []).forEach((v) => values.add(v)));
    return Array.from(values).sort();
  }, [softwareCommands, intent]);

  /**
   * "From / with" input sources — derived from outcomes of the currently filtered pool.
   * Only shown when both intent and objectType are selected and there are multiple distinct
   * outcome values (meaning there IS a meaningful input concept for this combination).
   *
   * NOTE: this uses `outcomes` as proxy for input type. When the DB has a dedicated
   * `inputTypes` column this can be swapped in directly.
   */
  const [inputType, setInputType] = useState("All");

  const inputTypeOptions = useMemo(() => {
    if (intent === "All" || objectType === "All") return [];
    const pool = softwareCommands
      .filter((c) => c.intentCategories?.includes(intent) && c.objectTypes?.includes(objectType));
    const values = new Set<string>();
    pool.forEach((c) => (c.outcomes ?? []).forEach((v) => values.add(v)));
    // Only surface the dropdown when there are 2+ distinct input sources
    return values.size >= 2 ? Array.from(values).sort() : [];
  }, [softwareCommands, intent, objectType]);

  const filteredCommands = useMemo(() => {
    // Non-text filters first
    let pool = softwareCommands;
    if (effectiveTopCat !== "All") pool = pool.filter((c) => getTopCategory(c) === effectiveTopCat);
    if (effectiveSubCat !== "All") pool = pool.filter((c) => getSubCategory(c) === effectiveSubCat);
    if (intent !== "All")      pool = pool.filter((c) => c.intentCategories?.includes(intent));
    if (objectType !== "All") pool = pool.filter((c) => c.objectTypes?.includes(objectType));
    if (inputType !== "All")  pool = pool.filter((c) => c.outcomes?.includes(inputType));

    // Smart text search: rank by relevance, with command-name boost (commands ARE their own title)
    if (query.trim()) {
      return rankBySmartMatch(pool, query, {
        boostCommandLike: true,
        target: (c) => ({
          id: c.name,
          title: c.name,
          software: c.software,
          summary: `${c.description ?? ""} ${c.menu ?? ""} ${c.shortcut ?? ""} ${c.addon ?? ""} ${(c.tags ?? []).join(" ")}`,
        }),
      });
    }
    // No query: alphabetical
    return pool.slice().sort((a, b) => cleanCommandName(a.name).localeCompare(cleanCommandName(b.name)));
  }, [softwareCommands, effectiveTopCat, effectiveSubCat, intent, objectType, query]);

  function toggleLearned(command: CommandListItem) {
    setLearned((cur) => ({ ...cur, [command.name]: !cur[command.name] }));
  }

  function copyCommand(e: React.MouseEvent, command: CommandListItem) {
    e.stopPropagation();
    const text = cleanCommandName(command.name);
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedId(command.id);
      setTimeout(() => setCopiedId((cur) => (cur === command.id ? null : cur)), 1500);
    });
  }

  function renderCommandCard(command: CommandListItem) {
    const cleanName = cleanCommandName(command.name);
    const isLearned = Boolean(learned[command.name]);
    const media = command.icon || command.gif;

    return (
      <article
        key={command.id}
        className="card cmd-card"
        role="button"
        tabIndex={0}
        onClick={() => setSelected(command)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(command); }
        }}
      >
        <button
          type="button"
          className={`cmd-check ${isLearned ? "checked" : ""}`}
          aria-label={isLearned ? `Mark ${cleanName} as not learned` : `Mark ${cleanName} as learned`}
          aria-pressed={isLearned}
          onClick={(e) => { e.stopPropagation(); toggleLearned(command); }}
        />
        <div className="cmd-card-icon-wrap">
          {media?.startsWith("sprite:") ? (() => {
            const parts = media.slice(7).split("|");
            const [url, x, y] = parts;
            return (
              <span
                className="cmd-card-icon-sprite"
                style={{ backgroundImage: `url(${url})`, backgroundPosition: `${x} ${y}` }}
                aria-hidden="true"
              />
            );
          })() : media
            ? <Image className="cmd-card-icon" src={media} alt={cleanName} width={220} height={220} unoptimized />
            : <span className="cmd-card-icon-placeholder">{cleanName.slice(0, 2)}</span>}
        </div>
        <div className="card-body">
          <h3>{cleanName}</h3>
          <div className="meta">
            {command.software}
            {command.menu ? ` | ${command.menu}` : ""}
          </div>
          {(() => {
            const cardTerms = getSoftwareTerms(command.software);
            if (cardTerms.accessType === "library") {
              // Grasshopper components, Dynamo nodes — show library chip
              return (
                <div className="cmd-line-chip cmd-gh-chip">
                  <span className="cmd-gh-chip-icon" aria-hidden="true">⬡</span>
                  {command.addon || command.software}
                </div>
              );
            }
            if (cardTerms.accessType === "shortcut") {
              // Shortcuts — show shortcut keys or a "No shortcut" placeholder
              if (!command.shortcut) return null;
              const keys = command.shortcut.split(/\s*\+\s*/).filter(Boolean);
              return (
                <div className="tool-key-combo" style={{ marginTop: 6 }}>
                  {keys.map((key, i) => (
                    <span key={`${key}-${i}`} className="tool-key-wrap">
                      {i > 0 && <span className="tool-key-sep" aria-hidden="true">+</span>}
                      <kbd className="tool-key">{key}</kbd>
                    </span>
                  ))}
                </div>
              );
            }
            // Default: command-line chip (Rhino)
            return (
              <div className="cmd-line-chip">
                <span className="cmd-line-prompt">_</span>
                <span className="cmd-line-name">{cleanName}</span>
                <button
                  type="button"
                  className={`cmd-copy-btn${copiedId === command.id ? " copied" : ""}`}
                  aria-label={`Copy ${cleanName} command`}
                  onClick={(e) => copyCommand(e, command)}
                >
                  {copiedId === command.id ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <rect x="4" y="1" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M1 4h2v6a1 1 0 001 1h5v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
              </div>
            );
          })()}
        </div>
      </article>
    );
  }

  function renderCommandRow(command: CommandListItem) {
    const name = cleanCommandName(command.name);
    const isLearned = Boolean(learned[command.name]);
    const cardTerms = getSoftwareTerms(command.software);
    const menuPath = decodeHtml(command.menu || "");

    function AccessChipRow() {
      if (cardTerms.accessType === "library") {
        return (
          <span className="cmd-row-access cmd-row-access--lib">
            <span aria-hidden="true">⬡</span>
            {command.addon || command.software}
          </span>
        );
      }
      if (cardTerms.accessType === "shortcut" && command.shortcut) {
        const keys = command.shortcut.split(/\s*\+\s*/).filter(Boolean);
        return (
          <span className="cmd-row-access cmd-row-access--keys">
            {keys.map((key, i) => (
              <span key={`${key}-${i}`} className="tool-key-wrap">
                {i > 0 && <span className="tool-key-sep" aria-hidden="true">+</span>}
                <kbd className="tool-key tool-key--sm">{key}</kbd>
              </span>
            ))}
          </span>
        );
      }
      if (cardTerms.accessType === "command-line") {
        return (
          <span className="cmd-row-access cmd-row-access--cmd">
            <span className="cmd-line-prompt">_</span>{name}
          </span>
        );
      }
      return null;
    }

    const media = command.icon || command.gif;

    function ListIcon() {
      if (media?.startsWith("sprite:")) {
        const parts = media.slice(7).split("|");
        const [url, x, y] = parts;
        return (
          <span
            className="cmd-list-icon-sprite"
            style={{ backgroundImage: `url(${url})`, backgroundPosition: `${x} ${y}` }}
            aria-hidden="true"
          />
        );
      }
      if (media) {
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="cmd-list-icon-img" src={media} alt="" aria-hidden="true" />
        );
      }
      return (
        <span className="cmd-list-icon-placeholder" aria-hidden="true">
          {name.slice(0, 2)}
        </span>
      );
    }

    return (
      <div
        key={command.id}
        className="cmd-list-row"
        role="button"
        tabIndex={0}
        onClick={() => setSelected(command)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(command); }
        }}
      >
        <div className="cmd-list-icon-wrap"><ListIcon /></div>
        <button
          type="button"
          className={`cmd-check ${isLearned ? "checked" : ""}`}
          aria-label={isLearned ? `Mark ${name} as not learned` : `Mark ${name} as learned`}
          aria-pressed={isLearned}
          onClick={(e) => { e.stopPropagation(); toggleLearned(command); }}
        />
        <span className="cmd-list-name">{name}</span>
        {menuPath && <span className="cmd-list-meta">{menuPath}</span>}
        <AccessChipRow />
      </div>
    );
  }

  const noSoftwareSelected = !activeSoftware && !query.trim();

  return (
    <AppFrame
      title={activeSoftware ? `${activeSoftware} ${terms.pageTitle}` : terms.pageTitle}
      subtitle={activeSoftware ? `Search and browse ${terms.countLabel} for ${activeSoftware}.` : "Search and browse commands across every software."}
      toolbarQuery={query}
      onToolbarQueryChange={setQuery}
    >
      <div className="reference-view">

        {/* Toolbar */}
        <div className="commands-toolbar">
          <div className="commands-toolbar-right">
            <span className="meta">
              {allCommands.length ? `${filteredCommands.length} ${terms.countLabel}` : status}
            </span>
            <div className="view-toggle" role="group" aria-label="View mode">
              <button
                type="button"
                className={`view-toggle-btn${viewMode === "grid" ? " active" : ""}`}
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                  <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                  <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                  <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                </svg>
              </button>
              <button
                type="button"
                className={`view-toggle-btn${viewMode === "row" ? " active" : ""}`}
                aria-label="List view"
                aria-pressed={viewMode === "row"}
                onClick={() => setViewMode("row")}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="1" y="2" width="14" height="3" rx="1" stroke="currentColor" strokeWidth="1.4"/>
                  <rect x="1" y="7" width="14" height="3" rx="1" stroke="currentColor" strokeWidth="1.4"/>
                  <rect x="1" y="12" width="14" height="3" rx="1" stroke="currentColor" strokeWidth="1.4"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Intent sentence filter — "I want to [verb] [object] from [input]" */}
        {activeSoftware && !!allCommands.length && (intentOptions.length > 0 || objectTypeOptions.length > 0) && (
          <div className="cmd-sentence-filter">
            <span className="cmd-sentence-word">I want to</span>

            {/* Verb — cascades based on objectType */}
            <select
              id="cmd-intent-select"
              className="cmd-sentence-select"
              value={intent}
              onChange={(e) => {
                setIntent(e.target.value);
                setInputType("All");
                setTopCat("All"); setSubCat("All"); setPrevSoftware(activeSoftware);
              }}
            >
              <option value="All">— anything —</option>
              {intentOptions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>

            {/* Object/output — cascades based on intent */}
            {objectTypeOptions.length > 0 && (
              <select
                id="cmd-object-select"
                className="cmd-sentence-select"
                value={objectType}
                onChange={(e) => {
                  setObjectType(e.target.value);
                  setInputType("All");
                  setTopCat("All"); setSubCat("All"); setPrevSoftware(activeSoftware);
                }}
              >
                <option value="All">— any object —</option>
                {objectTypeOptions.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            )}

            {/* Input/source — only shown when the verb+object combination has distinct input sources */}
            {inputTypeOptions.length > 0 && (
              <>
                <span className="cmd-sentence-word">from</span>
                <select
                  id="cmd-input-select"
                  className="cmd-sentence-select"
                  value={inputType}
                  onChange={(e) => { setInputType(e.target.value); }}
                >
                  <option value="All">— anything —</option>
                  {inputTypeOptions.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </>
            )}

            {/* Reset — shown when any filter is active */}
            {(intent !== "All" || objectType !== "All" || inputType !== "All") && (
              <button
                type="button"
                className="cmd-sentence-reset"
                onClick={() => { setIntent("All"); setObjectType("All"); setInputType("All"); }}
              >
                ✕ clear
              </button>
            )}
          </div>
        )}

        {/* Category filters */}
        {activeSoftware && topCatOptions.length > 1 && (
          <div className="cmd-filter-strip">
            <div className="cmd-filter-row">
              <label className="cmd-intent-label" htmlFor="cmd-topcat-select">{terms.menuGroupLabel}</label>
              <select
                id="cmd-topcat-select"
                className="cmd-intent-select"
                value={effectiveTopCat}
                onChange={(e) => { setTopCat(e.target.value); setSubCat("All"); setPrevSoftware(activeSoftware); setIntent("All"); setObjectType("All"); }}
              >
                {topCatOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              {subCatOptions.length > 1 && effectiveTopCat !== "All" && (
                <>
                  <label className="cmd-intent-label" htmlFor="cmd-subcat-select">Group</label>
                  <select
                    id="cmd-subcat-select"
                    className="cmd-intent-select"
                    value={effectiveSubCat}
                    onChange={(e) => { setSubCat(e.target.value); setPrevSoftware(activeSoftware); }}
                  >
                    {subCatOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </>
              )}
            </div>
          </div>
        )}

        {/* Loading skeletons */}
        {!allCommands.length && (
          <div className="commands-grid">
            {Array.from({ length: 8 }, (_, i) => commandSkeletonCard(`cmd-skeleton-${i}`))}
          </div>
        )}

        {/* No software selected — prompt */}
        {!!allCommands.length && noSoftwareSelected && (
          <div className="sw-context-prompt">
            <p className="sw-context-prompt-eyebrow">Command library</p>
            <p className="sw-context-prompt-title">Which software are you using?</p>
            <p className="meta">Select your tool to browse its full command library.</p>
            <div className="sw-context-prompt-actions">
              {SOFTWARE_LIST.slice(0, 8).map((sw) => (
                <button key={sw.id} type="button" className="sw-quick-btn" onClick={() => setActiveSoftware(sw.id)}>
                  <span className="sw-quick-abbr" style={{ background: sw.color + "22", color: sw.color }}>{sw.abbr}</span>
                  {sw.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Commands grid — grouped when intent+objectType selected, flat otherwise */}
        {!!allCommands.length && (!noSoftwareSelected) && (() => {
          if (!filteredCommands.length) {
            return <p className="meta">No commands found{query.trim() ? ` for "${query}"` : ""}.</p>;
          }
          const groups = (intent !== "All" && objectType !== "All" && activeSoftware)
            ? getCommandGroups(activeSoftware, intent, objectType)
            : null;

          const renderItems = (cmds: CommandListItem[]) =>
            viewMode === "row"
              ? <div className="commands-list">{cmds.map(renderCommandRow)}</div>
              : <div className="commands-grid">{cmds.map(renderCommandCard)}</div>;

          if (groups) {
            const byName = new Map(filteredCommands.map((c) => [c.name.toLowerCase(), c]));
            const rendered: React.ReactNode[] = [];
            const used = new Set<string>();

            for (const group of groups) {
              const groupCmds = group.terms
                .map((t) => byName.get(t.toLowerCase()))
                .filter((c): c is CommandListItem => !!c);
              if (groupCmds.length === 0) continue;
              groupCmds.forEach((c) => used.add(c.name.toLowerCase()));
              rendered.push(
                <div key={`${group.label}-${rendered.length}`} className="cmd-group-section">
                  <p className="cmd-group-label">{group.label}</p>
                  {renderItems(groupCmds)}
                </div>
              );
            }
            const remainder = filteredCommands.filter((c) => !used.has(c.name.toLowerCase()));
            if (remainder.length > 0) {
              rendered.push(
                <div key="other" className="cmd-group-section">
                  <p className="cmd-group-label">Other</p>
                  {renderItems(remainder)}
                </div>
              );
            }
            return <>{rendered}</>;
          }

          return renderItems(filteredCommands);
        })()}

      </div>

      {selected ? (
        <ToolActionDetailModal
          command={selected}
          commands={allCommands}
          learned={Boolean(learned[selected.name])}
          saved={Boolean(savedIds[selected.id])}
          accessToken={session?.access_token ?? undefined}
          onClose={() => setSelected(null)}
          onOpenCommand={(command) => setSelected(command)}
          onToggleLearned={toggleLearned}
          onToggleSaved={(command, next) => setSavedIds((cur) => ({ ...cur, [command.id]: next }))}
        />
      ) : null}
    </AppFrame>
  );
}
