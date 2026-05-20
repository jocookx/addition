"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppFrame } from "@/components/legacy/AppFrame";
import { LAUNCH_SOFTWARE } from "@/config/taxonomy";
import type { SearchResponse, SearchResultItem, ClarificationQuestion } from "@/lib/search/types";

// ── API helper ────────────────────────────────────────────────────────────

async function fetchSearch(q: string, software?: string): Promise<SearchResponse> {
  const params = new URLSearchParams({ q });
  if (software) params.set("software", software);
  const res = await fetch(`/api/v1/search?${params}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json() as Promise<SearchResponse>;
}

async function logClick(logId: string, id: string, type: string) {
  await fetch("/api/v1/search/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ logId, clickedItemId: id, clickedItemType: type }),
  }).catch(() => {});
}

// ── Subcomponents ──────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  command: "Command",
  combo:   "Combo",
  course:  "Course",
  fix:     "Fix",
  problem: "Diagnostic",
};

const TYPE_COLOURS: Record<string, string> = {
  command: "#7c5cff",
  combo:   "#30c7f9",
  course:  "#a7f070",
  fix:     "#ff7070",
  problem: "#ffb03b",
};

const REASON_LABELS: Record<string, string> = {
  exact_command_name: "Exact command match",
  exact_title:        "Exact title match",
  synonym_match:      "Matched your phrase",
  problem_phrase:     "Matched your problem",
  intent_type:        "Matches your intent",
  software_match:     "Your software",
  tag_match:          "Matched a tag",
  keyword_match:      "Contains your keywords",
  transcript_match:   "Found in description",
};

const INTENT_COPY: Record<string, string> = {
  troubleshooting:  "Looks like you're stuck — fixes and commands first.",
  create_workflow:  "You're building something — showing combos and commands first.",
  learning:         "Ready to learn — courses and lessons first.",
  command_reference:"Showing the exact command you need.",
  interoperability: "Export / import workflow — showing relevant guides.",
  exploring:        "Exploring ideas — showing visual outcomes first.",
};

function ResultCard({
  item, onClickItem,
}: {
  item: SearchResultItem;
  onClickItem: (id: string, type: string) => void;
}) {
  const colour = TYPE_COLOURS[item.type] ?? "#888";
  const topReason = item.matchReasons[0];

  return (
    <article
      className="sr-card glass-panel"
      onClick={() => onClickItem(item.id, item.type)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onClickItem(item.id, item.type)}
    >
      <div className="sr-card-top">
        <span className="sr-type-badge" style={{ background: `${colour}22`, color: colour, borderColor: `${colour}44` }}>
          {TYPE_LABELS[item.type] ?? item.type}
        </span>
        {item.software && <span className="sr-software">{item.software}</span>}
        {item.estimatedMinutes && (
          <span className="sr-time">{item.estimatedMinutes} min</span>
        )}
      </div>

      <h3 className="sr-title">{item.title}</h3>

      {item.description && (
        <p className="sr-desc">{item.description.slice(0, 150)}{item.description.length > 150 ? "…" : ""}</p>
      )}

      {item.relatedCommands && item.relatedCommands.length > 0 && (
        <div className="sr-commands">
          <span className="sr-commands-label">Commands:</span>
          {item.relatedCommands.slice(0, 5).map(cmd => (
            <code key={cmd} className="sr-cmd-chip">{cmd}</code>
          ))}
        </div>
      )}

      {topReason && (
        <div className="sr-match-reason">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {REASON_LABELS[topReason] ?? topReason}
        </div>
      )}
    </article>
  );
}

function ClarificationPanel({
  questions,
  onAnswer,
}: {
  questions: ClarificationQuestion[];
  onAnswer: (field: string, value: string) => void;
}) {
  const q = questions[0];
  if (!q) return null;
  return (
    <div className="sr-clarify glass-panel">
      <div className="sr-clarify-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
        </svg>
      </div>
      <div className="sr-clarify-body">
        <p className="sr-clarify-q">{q.question}</p>
        <div className="sr-clarify-options">
          {q.options.map(opt => (
            <button
              key={opt.value}
              type="button"
              className="sr-clarify-btn"
              onClick={() => onAnswer(q.field, opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfidenceBadge({ score, band }: { score: number; band: string }) {
  const colour = band === "high" ? "#a7f070" : band === "medium" ? "#ffb03b" : "#ff7070";
  return (
    <span className="sr-confidence" style={{ color: colour, borderColor: `${colour}44`, background: `${colour}11` }}>
      {band === "high" ? "High match" : band === "medium" ? "Likely match" : "Low match"} · {score}
    </span>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

const QUICK_SEARCHES = [
  "Copy along curve", "Boolean not working", "Make holes in facade",
  "Surfaces won't join", "Model too slow", "Learn Grasshopper",
];

function SearchPageInner() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const currentQuery  = searchParams.get("q") ?? "";

  const [input, setInput]           = useState(currentQuery);
  const [data, setData]             = useState<SearchResponse | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [software, setSoftware]     = useState<string>("");
  // Track which query the results belong to so stale results don't flash
  const [resultFor, setResultFor]   = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const trimmedQuery = currentQuery.trim();
    if (!trimmedQuery) return;
    let canceled = false;
    fetchSearch(trimmedQuery, software || undefined)
      .then(res => { if (!canceled) { setData(res); setResultFor(trimmedQuery); setError(null); setLoading(false); } })
      .catch(e  => { if (!canceled) { setError(e instanceof Error ? e.message : "Search error"); setLoading(false); } });
    return () => { canceled = true; };
  }, [currentQuery, software]);

  const handleSubmit = useCallback(() => {
    const q = input.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }, [input, router]);

  const handleClickItem = useCallback((id: string, type: string) => {
    if (data?.logId) logClick(data.logId, id, type);
    // Navigate based on type
    if (type === "command") router.push(`/commands?q=${encodeURIComponent(id)}`);
    else if (type === "combo") router.push(`/combos?q=${encodeURIComponent(id)}`);
    else if (type === "course") router.push(`/learn?course=${encodeURIComponent(id)}`);
    // fix and problem stay on search page for now — could open a modal later
  }, [data, router]);

  const handleClarification = useCallback((field: string, value: string) => {
    if (field === "software") setSoftware(value);
  }, []);

  const handleQuickSearch = (q: string) => {
    setInput(q);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const showResults = resultFor === currentQuery && data && !loading;
  const noResults = showResults && data!.total === 0;

  // Separate results by group for display
  const fixes    = data?.fixes ?? [];
  const problems = data?.problems ?? [];
  const commands = (data?.results ?? []).filter(r => r.type === "command");
  const combos   = (data?.results ?? []).filter(r => r.type === "combo");
  const courses  = (data?.results ?? []).filter(r => r.type === "course");

  return (
    <AppFrame
      title="Search"
      subtitle="Find the right command, combo, lesson, or fix."
    >
      <div className="search-page">

        {/* ── Search bar ── */}
        <div className="sr-bar-wrap glass-panel">
          <div className="sr-bar">
            <svg className="sr-bar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref={inputRef}
              className="sr-input"
              type="text"
              placeholder="What are you trying to create, fix, or learn?"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
            {input && (
              <button className="sr-clear" type="button" onClick={() => { setInput(""); inputRef.current?.focus(); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            )}
            <button className="primary-button sr-submit" type="button" onClick={handleSubmit}>Search</button>
          </div>

          {/* Software filter */}
          <div className="sr-sw-filter">
            <span className="sr-sw-label">Filter by:</span>
            {["", ...LAUNCH_SOFTWARE].map(sw => (
              <button
                key={sw}
                type="button"
                className={`sr-sw-pill${software === sw ? " active" : ""}`}
                onClick={() => setSoftware(sw)}
              >
                {sw || "All software"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Empty state: quick searches ── */}
        {!currentQuery && (
          <div className="sr-empty-state">
            <p className="sr-empty-heading">Not sure where to start? Try one of these:</p>
            <div className="sr-quick-searches">
              {QUICK_SEARCHES.map(q => (
                <button key={q} type="button" className="sr-quick-chip" onClick={() => handleQuickSearch(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="sr-status">
            <div className="sr-spinner" />
            <span>Searching…</span>
          </div>
        )}

        {/* ── Error ── */}
        {error && <div className="sr-status sr-status--error">{error}</div>}

        {/* ── Results ── */}
        {showResults && (
          <>
            {/* Intent banner + confidence */}
            {data && data.total > 0 && (
              <div className="sr-meta-row">
                <span className="sr-intent-tag">
                  {INTENT_COPY[data.intent] ?? `Intent: ${data.intent}`}
                </span>
                <ConfidenceBadge score={data.confidenceScore} band={data.confidence} />
              </div>
            )}

            {/* Clarification panel — always show if questions exist, above results for low confidence */}
            {data?.clarificationQuestions.length > 0 && (
              <ClarificationPanel
                questions={data.clarificationQuestions}
                onAnswer={handleClarification}
              />
            )}

            {noResults ? (
              <div className="sr-no-results glass-panel">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <h3>No results found</h3>
                <p>Try a different phrase, check the spelling, or broaden your search.</p>
                <div className="sr-quick-searches">
                  {QUICK_SEARCHES.slice(0, 3).map(q => (
                    <button key={q} type="button" className="sr-quick-chip" onClick={() => handleQuickSearch(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="sr-results">

                {/* Best match — top-scored item */}
                {data!.results.length > 0 && (
                  <section className="sr-section">
                    <h2 className="sr-section-title">Best Match</h2>
                    <div className="sr-grid sr-grid--featured">
                      <ResultCard item={data!.results[0]} onClickItem={handleClickItem} />
                    </div>
                  </section>
                )}

                {/* Fixes */}
                {fixes.length > 0 && (
                  <section className="sr-section">
                    <h2 className="sr-section-title">Quick Fixes</h2>
                    <div className="sr-grid">
                      {fixes.map(item => (
                        <ResultCard key={item.id} item={item} onClickItem={handleClickItem} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Commands */}
                {commands.length > 0 && (
                  <section className="sr-section">
                    <h2 className="sr-section-title">Commands</h2>
                    <div className="sr-grid">
                      {commands.map(item => (
                        <ResultCard key={item.id} item={item} onClickItem={handleClickItem} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Combos */}
                {combos.length > 0 && (
                  <section className="sr-section">
                    <h2 className="sr-section-title">Combos</h2>
                    <div className="sr-grid">
                      {combos.map(item => (
                        <ResultCard key={item.id} item={item} onClickItem={handleClickItem} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Courses */}
                {courses.length > 0 && (
                  <section className="sr-section">
                    <h2 className="sr-section-title">Courses</h2>
                    <div className="sr-grid">
                      {courses.map(item => (
                        <ResultCard key={item.id} item={item} onClickItem={handleClickItem} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Related problems */}
                {problems.length > 0 && (
                  <section className="sr-section">
                    <h2 className="sr-section-title">Related Problems</h2>
                    <div className="sr-grid">
                      {problems.map(item => (
                        <ResultCard key={item.id} item={item} onClickItem={handleClickItem} />
                      ))}
                    </div>
                  </section>
                )}

              </div>
            )}
          </>
        )}
      </div>
    </AppFrame>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  );
}
