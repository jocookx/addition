"use client";

import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

export type ContentStatus =
  | "Idea"
  | "Draft"
  | "Needs Script"
  | "Needs Video"
  | "Needs Resources"
  | "Ready to Review"
  | "Published"
  | "Archived";

export type AccessLevel = "Free" | "Pro" | "Student" | "Workshop" | "Admin only";

export type HealthItem = {
  label: string;
  ok: boolean;
  severity?: "required" | "recommended";
};

export function statusFromDraft(draft?: boolean): ContentStatus {
  return draft ? "Draft" : "Published";
}

const STATUS_VARIANTS: Record<string, "published" | "draft" | "archived" | "warning" | "neutral"> = {
  active: "published",
  published: "published",
  live: "published",
  ready: "published",
  "ready to review": "published",
  draft: "draft",
  idea: "draft",
  inactive: "draft",
  archived: "archived",
  "needs script": "warning",
  "needs video": "warning",
  "needs resources": "warning",
  "needs review": "warning",
  "missing data": "warning",
};

export function StatusBadge({ status }: { status: ContentStatus | string }) {
  const normalized = status.trim().toLowerCase();
  const key = normalized.replace(/\s+/g, "-");
  const variant = STATUS_VARIANTS[normalized] ?? "neutral";
  return <span className={`aa-status aa-status--${variant} aa-status--${key}`}>{status}</span>;
}

export function AccessBadge({ access = "Free" }: { access?: AccessLevel | string }) {
  const key = access.trim().toLowerCase().replace(/\s+/g, "-");
  return <span className={`aa-access aa-access--${key}`}>{access}</span>;
}

export function SaveStatusIndicator({ state }: { state: string }) {
  return <span className={`aa-save-state aa-save-state--${state.replace(/\s+/g, "-").toLowerCase()}`}>{state}</span>;
}

export function healthScore(items: HealthItem[]): number {
  if (!items.length) return 100;
  return Math.round((items.filter((item) => item.ok).length / items.length) * 100);
}

export function missingHealth(items: HealthItem[]): HealthItem[] {
  return items.filter((item) => !item.ok);
}

export function ContentHealthSummary({ items }: { items: HealthItem[] }) {
  const score = healthScore(items);
  const missing = missingHealth(items);
  return (
    <div className="aa-health-summary">
      <div className="aa-health-ring" style={{ "--score": `${score}%` } as CSSProperties}>
        <span>{score}</span>
      </div>
      <div>
        <strong>{score >= 85 ? "Ready to review" : score >= 55 ? "Needs a few fixes" : "Needs structure"}</strong>
        <p>{missing.length ? `${missing.length} items missing` : "All key checks are complete"}</p>
      </div>
    </div>
  );
}

export function HealthChecklist({ items }: { items: HealthItem[] }) {
  return (
    <div className="aa-health-list">
      {items.map((item) => (
        <div key={item.label} className={`aa-health-row${item.ok ? " complete" : ""}`}>
          <span className="aa-health-check">{item.ok ? "OK" : "!"}</span>
          <span>{item.label}</span>
          {!item.ok && <small>{item.severity === "required" ? "Required" : "Recommended"}</small>}
        </div>
      ))}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  action,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  meta?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <>
      <header className="aa-page-header">
        <div>
          {eyebrow && <span className="aa-eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          <p>{description}</p>
          {meta && <div className="aa-page-meta">{meta}</div>}
        </div>
        {action && <div className="aa-page-action">{action}</div>}
      </header>
      {children && <AdminToolbar>{children}</AdminToolbar>}
    </>
  );
}

export function AdminToolbar({ children, trailing }: { children: ReactNode; trailing?: ReactNode }) {
  return (
    <div className="aa-admin-toolbar">
      <div className="aa-admin-toolbar-main">{children}</div>
      {trailing && <div className="aa-admin-toolbar-trailing">{trailing}</div>}
    </div>
  );
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="aa-admin-search">
      <span>Search</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

export function AdminFilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="aa-admin-filter">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

export function AdminLoadingState({ title = "Loading", description = "Fetching the latest data..." }: { title?: string; description?: string }) {
  return (
    <div className="aa-state aa-state--loading">
      <div className="aa-loading-bars" aria-hidden="true"><span /><span /><span /></div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export function AdminErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="aa-state aa-state--error">
      <h3>Something went wrong</h3>
      <p>{message}</p>
      {onRetry && <button type="button" className="aa-secondary-button" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="aa-empty-state">
      <div className="aa-empty-mark">+</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function MoreMenu({ children }: { children: ReactNode }) {
  return (
    <details className="aa-more-menu">
      <summary>Actions</summary>
      <div className="aa-more-menu-panel">{children}</div>
    </details>
  );
}

export function CsvBulkActions({
  entity,
  accessToken,
  onImported,
  templateLabel = "Template",
  importLabel = "Import",
}: {
  entity: string;
  accessToken: string;
  onImported?: () => void;
  templateLabel?: string;
  importLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function readError(response: Response): Promise<string> {
    const text = await response.text();
    if (!text.trim()) return `Request failed (${response.status})`;
    try {
      const payload = JSON.parse(text) as { error?: unknown; message?: unknown };
      const candidate = payload.error ?? payload.message;
      if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    } catch {
      // Fall through to raw response text.
    }
    return text.trim();
  }

  async function downloadTemplate() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/v1/admin/csv/${entity}/template`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error(await readError(response));
      const blob = await response.blob();
      if (!blob.size) throw new Error("Template download was empty.");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const disposition = response.headers.get("Content-Disposition") || "";
      const fileNameMatch = disposition.match(/filename="([^"]+)"/i);
      link.href = url;
      link.download = fileNameMatch?.[1] || `addition-${entity}-template.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage("Template downloaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Template download failed.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadCsv(file: File) {
    setBusy(true);
    setMessage("");
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch(`/api/v1/admin/csv/${entity}/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });
      const payload = await response.json().catch(() => ({})) as { imported?: number; totalRows?: number; error?: string };
      if (!response.ok) throw new Error(payload.error || "CSV import failed.");
      const imported = payload.imported ?? 0;
      const totalRows = payload.totalRows ?? imported;
      setMessage(`${imported} of ${totalRows} rows imported.`);
      window.dispatchEvent(new CustomEvent("addition:admin-imported", { detail: { entity } }));
      onImported?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "CSV import failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="aa-csv-actions">
      <button type="button" className="aa-secondary-button" disabled={busy} onClick={() => void downloadTemplate()}>
        {busy ? "Working..." : templateLabel}
      </button>
      <button type="button" className="aa-secondary-button" disabled={busy} onClick={() => inputRef.current?.click()}>
        {importLabel}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadCsv(file);
        }}
      />
      {message && <span>{message}</span>}
    </div>
  );
}

export type TableColumn<T> = {
  id: string;
  label: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  defaultVisible?: boolean;
};

export type SavedView = {
  id: string;
  label: string;
};

export function AdminDataTable<T extends { id: string }>({
  rows,
  columns,
  savedViews,
  activeView,
  onViewChange,
  selectedIds,
  onSelectedIdsChange,
  onRowClick,
  getRowLabel,
  bulkActions,
  empty,
}: {
  rows: T[];
  columns: TableColumn<T>[];
  savedViews?: SavedView[];
  activeView?: string;
  onViewChange?: (view: string) => void;
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  onRowClick: (row: T) => void;
  getRowLabel: (row: T) => string;
  bulkActions?: ReactNode;
  empty: ReactNode;
}) {
  const [sortId, setSortId] = useState(columns[0]?.id ?? "");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [visible, setVisible] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(columns.map((column) => [column.id, column.defaultVisible !== false && column.id !== "actions"])),
  );
  const pageSize = 25;

  const visibleColumns = columns.filter((column) => visible[column.id] || column.id === "actions");
  const sortedRows = useMemo(() => {
    const column = columns.find((item) => item.id === sortId);
    if (!column?.sortValue) return rows;
    const next = [...rows].sort((a, b) => {
      const aValue = column.sortValue?.(a) ?? "";
      const bValue = column.sortValue?.(b) ?? "";
      if (typeof aValue === "number" && typeof bValue === "number") return aValue - bValue;
      return String(aValue).localeCompare(String(bValue));
    });
    return sortDir === "asc" ? next : next.reverse();
  }, [columns, rows, sortDir, sortId]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const allPageSelected = pagedRows.length > 0 && pagedRows.every((row) => selectedIds.includes(row.id));

  function toggleSort(column: TableColumn<T>) {
    if (!column.sortValue) return;
    if (sortId === column.id) {
      setSortDir((current) => current === "asc" ? "desc" : "asc");
    } else {
      setSortId(column.id);
      setSortDir("asc");
    }
  }

  function togglePageSelection() {
    if (allPageSelected) {
      onSelectedIdsChange(selectedIds.filter((id) => !pagedRows.some((row) => row.id === id)));
    } else {
      onSelectedIdsChange(Array.from(new Set([...selectedIds, ...pagedRows.map((row) => row.id)])));
    }
  }

  if (!rows.length) return <>{empty}</>;

  return (
    <section className="aa-table-section">
      <div className="aa-table-topbar">
        {savedViews && savedViews.length > 0 && savedViews.length <= 5 && (
          <div className="aa-saved-views" aria-label="Saved views">
            {savedViews.map((view) => (
              <button
                key={view.id}
                type="button"
                className={activeView === view.id ? "active" : ""}
                onClick={() => {
                  setPage(1);
                  onViewChange?.(view.id);
                }}
              >
                {view.label}
              </button>
            ))}
          </div>
        )}
        {savedViews && savedViews.length > 5 && (
          <label className="aa-saved-view-select">
            <span>View</span>
            <select
              value={activeView ?? savedViews[0]?.id ?? ""}
              onChange={(event) => {
                setPage(1);
                onViewChange?.(event.target.value);
              }}
            >
              {savedViews.map((view) => <option key={view.id} value={view.id}>{view.label}</option>)}
            </select>
          </label>
        )}
        <div className="aa-table-tools">
          {selectedIds.length > 0 && (
            <div className="aa-bulk-bar">
              <span>{selectedIds.length} selected</span>
              {bulkActions}
            </div>
          )}
          <details className="aa-columns-menu">
            <summary>Columns</summary>
            <div>
              {columns.filter((column) => column.id !== "actions").map((column) => (
                <label key={column.id}>
                  <input
                    type="checkbox"
                    checked={visible[column.id]}
                    onChange={(event) => setVisible((current) => ({ ...current, [column.id]: event.target.checked }))}
                  />
                  <span>{column.label}</span>
                </label>
              ))}
            </div>
          </details>
        </div>
      </div>

      <div className="aa-table-wrap">
        <table className="aa-data-table">
          <thead>
            <tr>
              <th className="aa-select-col">
                <input type="checkbox" checked={allPageSelected} onChange={togglePageSelection} aria-label="Select visible rows" />
              </th>
              {visibleColumns.map((column) => (
                <th key={column.id}>
                  <button type="button" onClick={() => toggleSort(column)} disabled={!column.sortValue} aria-label={column.sortValue ? `Sort by ${column.label}` : column.label}>
                    {column.label}
                    {sortId === column.id && <span aria-hidden="true">{sortDir === "asc" ? "↑" : "↓"}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row) => (
              <tr key={row.id} onClick={() => onRowClick(row)}>
                <td className="aa-select-col" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.id)}
                    onChange={(event) => {
                      onSelectedIdsChange(event.target.checked
                        ? [...selectedIds, row.id]
                        : selectedIds.filter((id) => id !== row.id));
                    }}
                    aria-label={`Select ${getRowLabel(row)}`}
                  />
                </td>
                {visibleColumns.map((column) => (
                  <td key={column.id}>{column.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="aa-table-footer">
        <span>{sortedRows.length} rows</span>
        <div className="aa-pagination">
          <button type="button" disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
          <span>{safePage} / {totalPages}</span>
          <button type="button" disabled={safePage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button>
        </div>
      </div>
    </section>
  );
}
