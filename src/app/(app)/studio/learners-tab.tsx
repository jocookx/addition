"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchJson } from "@/lib/api/fetch-json";
import type { AdminLearner } from "@/app/api/v1/admin/learners/route";
import { AdminErrorState, AdminLoadingState, EmptyState, PageHeader } from "./studio-ui";

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeDate(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - Date.parse(iso);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

const PLAN_COLORS: Record<string, string> = {
  pro:     "st-badge--live",
  team:    "st-badge--live",
  ai:      "st-badge--live",
  student: "st-badge--ok",
  free:    "st-badge--muted",
};

const LEVEL_LABELS: Record<string, string> = {
  explorer: "Explorer",
  improver: "Improver",
  refiner:  "Refiner",
};

// ── Main Component ────────────────────────────────────────────────────────────

export function LearnersTab({ accessToken }: { accessToken: string }) {
  const [learners, setLearners] = useState<AdminLearner[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [q, setQ]               = useState("");
  const [planFilter, setPlanFilter] = useState("All");
  const [studentFilter, setStudentFilter] = useState("All");
  const [busyUserId, setBusyUserId] = useState("");

  const LIMIT = 50;

  const headers = useMemo(() => ({ Authorization: `Bearer ${accessToken}` }), [accessToken]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetchJson<{ learners: AdminLearner[]; total: number }>(
        `/api/v1/admin/learners?${params}`,
        { headers },
      );
      setLearners(res.learners);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [headers, page, q]);

  useEffect(() => { void load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);
  const filteredLearners = learners.filter((learner) => {
    if (planFilter !== "All" && learner.plan !== planFilter) return false;
    if (studentFilter !== "All" && learner.studentVerificationStatus !== studentFilter) return false;
    return true;
  });
  const proCount   = learners.filter((learner) => learner.plan !== "free").length;
  const activeCount = learners.filter((learner) => learner.enrollments > 0).length;
  const pendingStudentCount = learners.filter((learner) => learner.studentVerificationStatus === "pending").length;
  const planOptions = ["All", ...Array.from(new Set(learners.map((learner) => learner.plan).filter(Boolean))).sort()];
  const studentOptions = ["All", "not_started", "pending", "approved", "rejected"];

  async function reviewStudent(userId: string, status: "approved" | "rejected") {
    setBusyUserId(userId);
    setError("");
    try {
      await fetchJson(`/api/v1/admin/student-verifications/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNotes: status === "approved" ? "Approved in Studio." : "Rejected in Studio." }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed.");
    } finally {
      setBusyUserId("");
    }
  }

  return (
    <div className="aa-learners-page">
      <PageHeader
        eyebrow="People"
        title="Learners"
        description="Manage learner access, student verification and support signals from one place."
        meta={<span>{loading ? "Loading..." : `${total} learner accounts`}</span>}
      />
      <div className="aa-course-filter-bar">
        <label className="aa-compact-search">
          <span>Search</span>
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setPage(1);
                void load();
              }
            }}
            placeholder="Search email or name..."
          />
        </label>
        <label>
          <span>Plan</span>
          <select value={planFilter} onChange={(event) => setPlanFilter(event.target.value)}>
            {planOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          <span>Student</span>
          <select value={studentFilter} onChange={(event) => setStudentFilter(event.target.value)}>
            {studentOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <button type="button" className="st-save-btn" onClick={() => { setPage(1); void load(); }}>Search</button>
      </div>
      {error && <AdminErrorState message={error} onRetry={() => void load()} />}
      <div className="st-list-panel">
      {/* ── Toolbar ── */}
      <div className="st-toolbar" hidden>
        <input
          className="st-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void load()}
          placeholder="Search email or name… (Enter)"
          style={{ flex: 1, maxWidth: 320 }}
        />
        <button type="button" className="st-save-btn" onClick={() => void load()}>Search</button>
        <span className="st-muted" style={{ marginLeft: "auto" }}>
          {loading ? "…" : `${total} learners`}
        </span>
      </div>

      {/* ── KPI strip ── */}
      {!loading && (
        <div className="st-learner-stats">
          <div className="st-learner-kpi">
            <strong>{total}</strong>
            <span>Total users</span>
          </div>
          <div className="st-learner-kpi">
            <strong>{proCount}</strong>
            <span>Paid ({Math.round((proCount / Math.max(1, learners.length)) * 100)}%)</span>
          </div>
          <div className="st-learner-kpi">
            <strong>{activeCount}</strong>
            <span>Enrolled</span>
          </div>
          <div className="st-learner-kpi">
            <strong>{pendingStudentCount}</strong>
            <span>Student review</span>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <AdminLoadingState title="Loading learners" description="Checking accounts, plans and verification state..." />
      ) : (
        <div className="st-learner-table-wrap">
          <table className="st-learner-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Level</th>
                <th>Enrolled</th>
                <th>Lessons done</th>
                <th>Last seen</th>
                <th>Student</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredLearners.map((l) => (
                <tr key={l.id} className="st-learner-row">
                  <td>
                    <div className="st-learner-user">
                      <strong className="st-learner-name">{l.name || "—"}</strong>
                      <span className="st-learner-email">{l.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`st-badge ${PLAN_COLORS[l.plan] ?? "st-badge--muted"}`}>{l.plan}</span>
                  </td>
                  <td>
                    <span className="st-muted">{LEVEL_LABELS[l.level] ?? l.level}</span>
                  </td>
                  <td>{l.enrollments}</td>
                  <td>{l.completedLessons}</td>
                  <td className="st-muted">{relativeDate(l.lastSeen)}</td>
                  <td>
                    <span className={`st-badge ${l.studentVerificationStatus === "approved" ? "st-badge--ok" : l.studentVerificationStatus === "pending" ? "st-badge--warn" : "st-badge--muted"}`}>{l.studentVerificationStatus}</span>
                    {l.studentVerificationStatus === "pending" && (
                      <span style={{ display: "inline-flex", gap: 6, marginLeft: 8 }}>
                        <button type="button" className="st-save-btn" disabled={busyUserId === l.id} onClick={() => void reviewStudent(l.id, "approved")}>Approve</button>
                        <button type="button" className="ghost-btn" disabled={busyUserId === l.id} onClick={() => void reviewStudent(l.id, "rejected")}>Reject</button>
                      </span>
                    )}
                  </td>
                  <td className="st-muted">{new Date(l.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {filteredLearners.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <EmptyState title="No learners match this view" description="Clear filters or search for a different learner." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="st-pagination-row">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
          <span className="st-muted">Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next ›</button>
        </div>
      )}
    </div>
    </div>
  );
}
