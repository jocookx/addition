"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppFrame } from "@/components/legacy/AppFrame";
import type { LearningPathListItem, PathLevel } from "@/domain/learning-path";
import { getPaths, getMyEnrolments } from "@/lib/api/paths";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

const LEVEL_LABELS: Record<PathLevel, string> = {
  explorer: "Beginner",
  improver: "Intermediate",
  refiner:  "Advanced",
};

function PathCard({
  path,
  enrolled,
}: {
  path: LearningPathListItem;
  enrolled: boolean;
}) {
  return (
    <Link href={`/paths/${path.id}`} className={`pl-card${enrolled ? " pl-card--enrolled" : ""}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div className="pl-card-head">
        <span className={`pl-level-badge pl-level-badge--${path.level}`}>{LEVEL_LABELS[path.level]}</span>
        <div className="pl-card-head-right">
          {enrolled && <span className="pl-enrolled-badge">Enrolled</span>}
          <span className="pl-card-stat">{path.courseCount} course{path.courseCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <h2 className="pl-card-title">{path.title}</h2>

      {path.software.length > 0 && (
        <div className="pl-card-software">
          {path.software.map((sw) => <span key={sw} className="pl-sw-tag">{sw}</span>)}
        </div>
      )}

      <div className="pl-card-foot">
        <span className="pl-card-cta">{enrolled ? "Continue →" : "Start path →"}</span>
      </div>
    </Link>
  );
}

export default function PathsPage() {
  const router = useRouter();
  const [paths, setPaths]           = useState<LearningPathListItem[]>([]);
  const [enrolments, setEnrolments] = useState<Set<string>>(new Set());
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [filter, setFilter]         = useState<PathLevel | "all">("all");

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setError("Learning paths need the app connection to finish loading.");
      setLoading(false);
      return;
    }
    let canceled = false;
    supabase.auth.getSession().then(async ({ data }) => {
      try {
        const t = data.session?.access_token ?? null;
        if (canceled) return;
        if (!t) { router.replace("/auth?next=/paths"); return; }
        const [fetchedPaths, fetchedEnrolments] = await Promise.all([
          getPaths(),
          getMyEnrolments(t).catch(() => []),
        ]);
        if (canceled) return;
        setPaths(fetchedPaths);
        setEnrolments(new Set(fetchedEnrolments.map((e) => e.pathId)));
        setError("");
      } catch (err) {
        if (!canceled) setError(err instanceof Error ? err.message : "Learning paths failed to load.");
      } finally {
        if (!canceled) setLoading(false);
      }
    });
    return () => { canceled = true; };
  }, [router]);

  const filtered = filter === "all" ? paths : paths.filter((p) => p.level === filter);

  return (
    <AppFrame title="Learning Paths" subtitle="Structured routes from beginner to expert.">
      <div className="pl-filter-row">
        {(["all", "explorer", "improver", "refiner"] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={`ws-filter-pill${filter === f ? " active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All levels" : LEVEL_LABELS[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="pl-grid">
          {[1, 2, 3].map((i) => <div key={i} className="pl-card pl-card--skeleton" />)}
        </div>
      ) : error ? (
        <div className="ws-empty-state">
          <div className="ws-empty-icon">!</div>
          <h3>Learning paths could not load</h3>
          <p className="meta">{error}</p>
          <div className="legacy-card-actions">
            <button type="button" className="primary-button" onClick={() => window.location.reload()}>Try again</button>
            <Link className="ghost-btn" href="/learn">Browse courses</Link>
          </div>
        </div>
      ) : paths.length === 0 ? (
        <div className="ws-empty-state">
          <div className="ws-empty-icon">o</div>
          <h3>Paths coming soon</h3>
          <p className="meta">We&apos;re assembling the first learning paths. Browse courses while paths are being prepared.</p>
          <Link className="primary-button" href="/learn">Browse courses</Link>
        </div>
      ) : (
        <>
          <div className="pl-grid">
            {filtered.map((p) => (
              <PathCard key={p.id} path={p} enrolled={enrolments.has(p.id)} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="ws-empty-state">
              <div className="ws-empty-icon">o</div>
              <h3>No paths at this level yet</h3>
              <p className="meta">Try another level or browse all courses.</p>
              <div className="legacy-card-actions">
                <button type="button" className="ghost-btn" onClick={() => setFilter("all")}>Show all levels</button>
                <Link className="primary-button" href="/learn">Browse courses</Link>
              </div>
            </div>
          )}
        </>
      )}
    </AppFrame>
  );
}
