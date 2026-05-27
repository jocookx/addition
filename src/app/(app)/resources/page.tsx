"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import type { ResourceListItem } from "@/domain/resource";
import { getResources } from "@/lib/api/resources";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { AppFrame } from "@/components/legacy/AppFrame";
import { SaveButton } from "@/components/legacy/SaveButton";

const ACCESS_FILTERS = ["All", "Free", "Pro", "Student", "Workshop", "Purchased", "Locked"];

export default function ResourcesPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [booted, setBooted] = useState(false);
  const [resources, setResources] = useState<ResourceListItem[]>([]);
  const [search, setSearch] = useState("");
  const [software, setSoftware] = useState("All");
  const [type, setType] = useState("All");
  const [access, setAccess] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      queueMicrotask(() => setBooted(true));
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setBooted(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!booted) return;
    let canceled = false;
    async function loadResources() {
      setLoading(true);
      try {
        const items = await getResources(session?.access_token, { search, software, type, access });
        if (!canceled) {
          setResources(items);
          setError("");
        }
      } catch (err) {
        if (!canceled) setError(err instanceof Error ? err.message : "Resources failed to load.");
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    void loadResources();
    return () => { canceled = true; };
  }, [access, booted, search, session?.access_token, software, type]);

  const softwareOptions = useMemo(() => ["All", ...Array.from(new Set(resources.map((item) => item.software).filter(Boolean))).sort()], [resources]);
  const typeOptions = useMemo(() => ["All", ...Array.from(new Set(resources.map((item) => item.type).filter(Boolean))).sort()], [resources]);
  const hasActiveFilters = Boolean(search.trim() || software !== "All" || type !== "All" || access !== "All");

  function clearFilters() {
    setSearch("");
    setSoftware("All");
    setType("All");
    setAccess("All");
  }

  return (
    <AppFrame title="Resources" subtitle="Short files, templates and references for digital design work." topTabs={[]}>
      <section className="panel">
        <div className="legacy-panel-head">
          <div>
            <h3>Resources</h3>
            <p className="meta">{loading ? "Loading..." : `${resources.length} published resources`}</p>
          </div>
        </div>

        <div className="aa-form-grid" style={{ marginBottom: 18 }}>
          <label className="span-2"><span>Search</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search resources..." /></label>
          <label><span>Software</span><select value={software} onChange={(event) => setSoftware(event.target.value)}>{softwareOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Type</span><select value={type} onChange={(event) => setType(event.target.value)}>{typeOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Access</span><select value={access} onChange={(event) => setAccess(event.target.value)}>{ACCESS_FILTERS.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>

        {error ? (
          <div className="ws-empty-state">
            <div className="ws-empty-icon">!</div>
            <h3>Resources could not load</h3>
            <p className="meta">{error}</p>
            <button type="button" className="primary-button" onClick={() => window.location.reload()}>Try again</button>
          </div>
        ) : null}

        {!error && !loading && resources.length === 0 ? (
          <div className="ws-empty-state">
            <div className="ws-empty-icon">o</div>
            <h3>{hasActiveFilters ? "No resources match this view" : "Resources are being prepared"}</h3>
            <p className="meta">
              {hasActiveFilters
                ? "Clear your filters or try a broader search."
                : "Published files, templates and references will appear here when they are ready."}
            </p>
            <div className="legacy-card-actions">
              {hasActiveFilters ? <button type="button" className="primary-button" onClick={clearFilters}>Clear filters</button> : null}
              <Link href="/toolkit" className="ghost-btn">Open toolkit</Link>
              <Link href="/learn" className="ghost-btn">Browse courses</Link>
            </div>
          </div>
        ) : !error ? (
          <div className="toolkit-grid">
            {resources.map((resource) => (
              <article key={resource.id} className="panel toolkit-card">
                <div className="legacy-tag-row">
                  <span className="legacy-tag primary">{resource.access.label}</span>
                  <span className="legacy-tag muted">{resource.software || "General"}</span>
                  <span className="legacy-tag muted">{resource.type}</span>
                </div>
                <h3>{resource.title}</h3>
                <div className="legacy-card-actions">
                  {resource.access.canAccess && resource.url ? (
                    <a href={resource.url} className="primary-button" target="_blank" rel="noreferrer">{resource.access.cta === "Start" ? "Open" : resource.access.cta}</a>
                  ) : resource.access.cta === "Verify student status" ? (
                    <Link href="/auth?verify=student&next=/resources" className="primary-button">{resource.access.cta}</Link>
                  ) : (
                    <Link href="/auth?mode=signup&plan=pro&next=/resources" className="primary-button">{resource.access.cta}</Link>
                  )}
                  <SaveButton
                    contentId={resource.id}
                    contentType="resource"
                    accessToken={session?.access_token}
                    saved={Boolean(resource.saved)}
                    onSavedChange={(next) => setResources((current) => current.map((item) => item.id === resource.id ? { ...item, saved: next } : item))}
                  />
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </AppFrame>
  );
}
