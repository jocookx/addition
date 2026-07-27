"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

type FailedSearch = {
  id: string;
  raw_query: string;
  normalised_query: string;
  reason: string;
  reviewed: boolean;
  admin_notes: string | null;
  suggested_synonym: string | null;
  created_at: string;
};

type SearchLog = {
  id: string;
  raw_query: string;
  detected_intent: string | null;
  detected_software: string | null;
  confidence_score: number;
  result_count: number;
  clicked_item_id: string | null;
  no_result: boolean;
  created_at: string;
};

type Analytics = {
  totalSearches: number;
  noResultCount: number;
  avgConfidence: number;
  topQueries: { query: string; count: number }[];
  topFailed: { query: string; count: number }[];
};

// ── API helpers ────────────────────────────────────────────────

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

async function fetchFailed(token: string): Promise<FailedSearch[]> {
  const res = await fetch("/api/v1/admin/search/failed", { headers: authHeaders(token) });
  return res.ok ? res.json() : [];
}
async function fetchRecent(token: string): Promise<SearchLog[]> {
  const res = await fetch("/api/v1/admin/search/recent", { headers: authHeaders(token) });
  return res.ok ? res.json() : [];
}
async function fetchAnalytics(token: string): Promise<Analytics | null> {
  const res = await fetch("/api/v1/admin/search/analytics", { headers: authHeaders(token) });
  return res.ok ? res.json() : null;
}
async function markReviewed(token: string, id: string, notes: string, synonym?: string) {
  return fetch("/api/v1/admin/search/review", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ id, reviewed: true, admin_notes: notes, suggested_synonym: synonym }),
  });
}
async function addSynonym(token: string, phrase: string, commandName: string) {
  return fetch("/api/v1/admin/search/synonyms", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ user_phrase: phrase, command_name: commandName }),
  });
}

// ── Components ─────────────────────────────────────────────────

const REASON_LABELS: Record<string, string> = {
  no_match:        "No match found",
  low_confidence:  "Low confidence",
  ambiguous:       "Ambiguous query",
  user_abandoned:  "User abandoned",
  no_click:        "No click",
};

function FailedSearchRow({ item, token, onReviewed }: { item: FailedSearch; token: string; onReviewed: () => void }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(item.admin_notes ?? "");
  const [synonym, setSynonym] = useState(item.suggested_synonym ?? "");
  const [commandName, setCommandName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleMarkReviewed = async () => {
    setSaving(true);
    await markReviewed(token, item.id, notes, synonym || undefined);
    if (synonym && commandName) await addSynonym(token, synonym, commandName);
    setSaving(false);
    onReviewed();
  };

  return (
    <div className={`sr-adm-row${item.reviewed ? " sr-adm-row--done" : ""}`}>
      <div className="sr-adm-row-top" onClick={() => setOpen(o => !o)}>
        <span className="sr-adm-reason">{REASON_LABELS[item.reason] ?? item.reason}</span>
        <code className="sr-adm-query">{item.raw_query}</code>
        <span className="sr-adm-date">{new Date(item.created_at).toLocaleDateString("en-GB")}</span>
        {item.reviewed && <span className="sr-adm-reviewed-badge">Reviewed</span>}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", marginLeft: "auto", flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {open && (
        <div className="sr-adm-detail">
          <div className="sr-adm-field">
            <label>Admin notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="sr-adm-synonym-row">
            <div className="sr-adm-field">
              <label>Add synonym (user phrase)</label>
              <input value={synonym} onChange={e => setSynonym(e.target.value)} placeholder={`e.g. "${item.raw_query}"`} />
            </div>
            <div className="sr-adm-field">
              <label>Maps to command name</label>
              <input value={commandName} onChange={e => setCommandName(e.target.value)} placeholder="e.g. ArrayCrv" />
            </div>
          </div>
          {!item.reviewed && (
            <button className="sr-adm-resolve-btn" type="button" disabled={saving} onClick={handleMarkReviewed}>
              {saving ? "Saving…" : "Mark as reviewed"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function SearchReviewPage() {
  const [tab, setTab]           = useState<"failed" | "recent" | "analytics">("failed");
  const [failed, setFailed]     = useState<FailedSearch[]>([]);
  const [recent, setRecent]     = useState<SearchLog[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading]   = useState(false);
  const [showReviewed, setShowReviewed] = useState(false);
  const [token, setToken]       = useState<string | null>(null);
  const [adminStatus, setAdminStatus] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setAdminStatus("denied");
      return;
    }
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      const accessToken = data.session?.access_token ?? null;
      setToken(accessToken);
      if (!accessToken) setAdminStatus("denied");
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setToken(nextSession?.access_token ?? null);
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    fetch("/api/v1/admin/me", { headers: authHeaders(token) })
      .then((res) => {
        if (alive) setAdminStatus(res.ok ? "allowed" : "denied");
      })
      .catch(() => {
        if (alive) setAdminStatus("denied");
      });
    return () => { alive = false; };
  }, [token]);

  const load = useCallback(async () => {
    if (!token || adminStatus !== "allowed") return;
    setLoading(true);
    try {
      if (tab === "failed")    setFailed(await fetchFailed(token));
      if (tab === "recent")    setRecent(await fetchRecent(token));
      if (tab === "analytics") setAnalytics(await fetchAnalytics(token));
    } finally { setLoading(false); }
  }, [tab, token, adminStatus]);

  useEffect(() => { load(); }, [load]);

  const displayFailed = showReviewed ? failed : failed.filter(f => !f.reviewed);

  if (adminStatus !== "allowed") {
    return (
      <div className="sr-adm-page">
        <div className="sr-adm-header">
          <div>
            <h1 className="sr-adm-title">Search Review</h1>
            <p className="sr-adm-sub">
              {adminStatus === "checking"
                ? "Verifying admin access…"
                : "Admin access is required for this page. Sign in with an admin account first."}
            </p>
          </div>
          <Link href="/admin" className="ghost-btn">← Admin</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sr-adm-page">
      <div className="sr-adm-header">
        <div>
          <h1 className="sr-adm-title">Search Review</h1>
          <p className="sr-adm-sub">Improve search quality by reviewing failed and low-confidence queries.</p>
        </div>
        <Link href="/admin" className="ghost-btn">← Admin</Link>
      </div>

      <nav className="sr-adm-tabs">
        {(["failed","recent","analytics"] as const).map(t => (
          <button
            key={t}
            type="button"
            className={`sr-adm-tab${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "failed" ? `Failed searches${failed.filter(f => !f.reviewed).length ? ` (${failed.filter(f => !f.reviewed).length})` : ""}` : t === "recent" ? "Recent searches" : "Analytics"}
          </button>
        ))}
      </nav>

      {loading && <div className="sr-adm-loading">Loading…</div>}

      {/* ── Failed tab ── */}
      {tab === "failed" && !loading && (
        <div className="sr-adm-content">
          <label className="sr-adm-toggle">
            <input type="checkbox" checked={showReviewed} onChange={e => setShowReviewed(e.target.checked)} />
            Show reviewed
          </label>
          {displayFailed.length === 0
            ? <div className="sr-adm-empty">Nothing to review — great work.</div>
            : displayFailed.map(item => (
                <FailedSearchRow key={item.id} item={item} token={token ?? ""} onReviewed={load} />
              ))
          }
        </div>
      )}

      {/* ── Recent tab ── */}
      {tab === "recent" && !loading && (
        <div className="sr-adm-content">
          <table className="sr-adm-table">
            <thead>
              <tr>
                <th>Query</th><th>Intent</th><th>Software</th>
                <th>Confidence</th><th>Results</th><th>Clicked</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(log => (
                <tr key={log.id} className={log.no_result ? "sr-adm-tr--fail" : ""}>
                  <td><code>{log.raw_query}</code></td>
                  <td>{log.detected_intent ?? "—"}</td>
                  <td>{log.detected_software ?? "—"}</td>
                  <td>
                    <span className={`sr-adm-conf sr-adm-conf--${log.confidence_score >= 80 ? "high" : log.confidence_score >= 50 ? "med" : "low"}`}>
                      {log.confidence_score}
                    </span>
                  </td>
                  <td>{log.result_count}</td>
                  <td>{log.clicked_item_id ? "✓" : "—"}</td>
                  <td>{new Date(log.created_at).toLocaleDateString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Analytics tab ── */}
      {tab === "analytics" && !loading && analytics && (
        <div className="sr-adm-content">
          <div className="sr-adm-stats-grid">
            <div className="sr-adm-stat-card">
              <span>{analytics.totalSearches}</span>
              <em>Total searches</em>
            </div>
            <div className="sr-adm-stat-card">
              <span>{analytics.noResultCount}</span>
              <em>No-result searches</em>
            </div>
            <div className="sr-adm-stat-card">
              <span>{analytics.avgConfidence}</span>
              <em>Avg confidence</em>
            </div>
          </div>

          <div className="sr-adm-two-col">
            <div>
              <h3 className="sr-adm-list-title">Top searches</h3>
              {analytics.topQueries.map((q, i) => (
                <div key={i} className="sr-adm-list-row">
                  <code>{q.query}</code>
                  <span>{q.count}×</span>
                </div>
              ))}
            </div>
            <div>
              <h3 className="sr-adm-list-title">Top failed searches</h3>
              {analytics.topFailed.map((q, i) => (
                <div key={i} className="sr-adm-list-row sr-adm-list-row--fail">
                  <code>{q.query}</code>
                  <span>{q.count}×</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
