"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/api/fetch-json";
import type { AdminLearner } from "@/app/api/v1/admin/learners/route";

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
  const [busyUserId, setBusyUserId] = useState("");

  const LIMIT = 50;

  const headers = { Authorization: `Bearer ${accessToken}` };

  async function load() {
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
  }

  useEffect(() => { void load(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.ceil(total / LIMIT);
  const proCount   = learners.filter((l) => l.plan !== "free").length;
  const activeCount = learners.filter((l) => l.enrollments > 0).length;
  const pendingStudentCount = learners.filter((l) => l.studentVerificationStatus === "pending").length;

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
    <div className="st-list-panel">
      {/* ── Toolbar ── */}
      <div className="st-toolbar">
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

      {error && <div className="st-notice st-notice--err">{error}</div>}

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
        <div className="st-loading">Loading learners…</div>
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
              {learners.map((l) => (
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
              {learners.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "rgba(236,236,242,0.3)" }}>
                    No learners found.
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
  );
}
