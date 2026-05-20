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
    <Link href={`/paths/${path.id}`} className="pl-card" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="pl-card-head">
        <span className={`pl-level-badge pl-level-badge--${path.level}`}>{LEVEL_LABELS[path.level]}</span>
        <span className="pl-card-stat">{path.courseCount} course{path.courseCount !== 1 ? "s" : ""}</span>
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
  const [filter, setFilter]         = useState<PathLevel | "all">("all");

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    let canceled = false;
    supabase.auth.getSession().then(async ({ data }) => {
      const t = data.session?.access_token ?? null;
      if (canceled) return;
      if (!t) { router.replace("/auth?next=/paths"); return; }
      const [fetchedPaths, fetchedEnrolments] = await Promise.all([
        getPaths().catch(() => [] as LearningPathListItem[]),
        getMyEnrolments(t).catch(() => []),
      ]);
      if (canceled) return;
      setPaths(fetchedPaths);
      setEnrolments(new Set(fetchedEnrolments.map((e) => e.pathId)));
      setLoading(false);
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
      ) : paths.length === 0 ? (
        <div className="ws-empty-state">
          <div className="ws-empty-icon">◎</div>
          <h3>Paths coming soon</h3>
          <p className="meta">We&apos;re assembling the first learning paths — check back shortly.</p>
        </div>
      ) : (
        <>
          <div className="pl-grid">
            {filtered.map((p) => (
              <PathCard key={p.id} path={p} enrolled={enrolments.has(p.id)} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="meta" style={{ marginTop: 24 }}>No paths at this level yet.</p>
          )}
        </>
      )}
    </AppFrame>
  );
}
