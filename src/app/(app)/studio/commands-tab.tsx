"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "@/lib/api/fetch-json";
import type { CommandListItem } from "@/domain/command";
import { LAUNCH_SOFTWARE, getSubcategoryOptions } from "@/config/taxonomy";
import { ImageUploadField } from "./image-upload-field";
import {
  AdminDataTable,
  ContentHealthSummary,
  CsvBulkActions,
  EmptyState,
  HealthChecklist,
  MoreMenu,
  PageHeader,
  SaveStatusIndicator,
  StatusBadge,
  type HealthItem,
  type SavedView,
  type TableColumn,
} from "./studio-ui";

type Row = CommandListItem & { _dirty?: boolean };
type RawCommand = Partial<Omit<CommandListItem, "tags" | "intentCategories" | "objectTypes" | "outcomes">> & {
  tags?: unknown;
  intentCategories?: unknown;
  objectTypes?: unknown;
  outcomes?: unknown;
};
type CommandTabId = "overview" | "usage" | "teaching" | "troubleshooting" | "relationships" | "publish";
type CommandView = "all" | "rhino" | "grasshopper" | "revit" | "beginner" | "surface" | "curve" | "unused" | "missing-troubleshooting" | "attention";

const SOFTWARE_OPTIONS = [...LAUNCH_SOFTWARE];
const DIFFICULTY_OPTIONS = ["beginner", "intermediate", "advanced"];
const LIMIT = 100;

const TABS: Array<{ id: CommandTabId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "usage", label: "Usage" },
  { id: "teaching", label: "Teaching Notes" },
  { id: "troubleshooting", label: "Troubleshooting" },
  { id: "relationships", label: "Relationships" },
  { id: "publish", label: "Publish" },
];

const COMMAND_VIEWS: SavedView[] = [
  { id: "all", label: "All Commands" },
  { id: "rhino", label: "Rhino Commands" },
  { id: "grasshopper", label: "Grasshopper Components" },
  { id: "revit", label: "Revit Tools" },
  { id: "beginner", label: "Beginner Commands" },
  { id: "surface", label: "Surface Modelling" },
  { id: "curve", label: "Curve Editing" },
  { id: "unused", label: "Unused Commands" },
  { id: "missing-troubleshooting", label: "Missing Troubleshooting" },
  { id: "attention", label: "Needs Attention" },
];

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function normalizeCommand(command: RawCommand): Row {
  return {
    id: String(command.id ?? `new-${Date.now()}`),
    name: String(command.name ?? ""),
    software: String(command.software ?? ""),
    menu: String(command.menu ?? ""),
    description: String(command.description ?? ""),
    source: String(command.source ?? ""),
    icon: String(command.icon ?? ""),
    gif: String(command.gif ?? ""),
    shortcut: String(command.shortcut ?? ""),
    addon: String(command.addon ?? ""),
    difficulty: String(command.difficulty ?? "beginner"),
    tags: toStringArray(command.tags),
    intentCategories: toStringArray(command.intentCategories),
    objectTypes: toStringArray(command.objectTypes),
    outcomes: toStringArray(command.outcomes),
    _dirty: false,
  };
}

function commandHealth(command: Row): HealthItem[] {
  return [
    { label: "Has command name", ok: Boolean(command.name.trim()), severity: "required" },
    { label: "Has software", ok: Boolean(command.software.trim()), severity: "required" },
    { label: "Has category or menu path", ok: Boolean(command.menu.trim()), severity: "recommended" },
    { label: "Has short definition", ok: Boolean(command.description.trim()), severity: "required" },
    { label: "Has shortcut or access method", ok: Boolean(command.shortcut.trim() || command.menu.trim()), severity: "recommended" },
    { label: "Has addon/plugin context", ok: Boolean(command.addon.trim()) || command.software !== "Grasshopper", severity: "recommended" },
    { label: "Has intent category", ok: command.intentCategories.length > 0, severity: "recommended" },
    { label: "Has object types", ok: command.objectTypes.length > 0, severity: "recommended" },
    { label: "Has outcomes", ok: command.outcomes.length > 0, severity: "recommended" },
    { label: "Has tags", ok: command.tags.length > 0, severity: "recommended" },
    { label: "Has icon or visual", ok: Boolean(command.icon.trim() || command.gif.trim()), severity: "recommended" },
  ];
}

function blankCommand(): Row {
  return {
    id: `new-${Date.now()}`,
    name: "",
    software: "",
    menu: "",
    description: "",
    source: "",
    icon: "",
    gif: "",
    shortcut: "",
    addon: "",
    tags: [],
    intentCategories: [],
    objectTypes: [],
    outcomes: [],
    difficulty: "beginner",
    _dirty: true,
  };
}

function cleanCommand(command: Row): CommandListItem {
  return {
    id: command.id,
    name: command.name,
    software: command.software,
    menu: command.menu,
    description: command.description,
    source: command.source,
    icon: command.icon,
    gif: command.gif,
    shortcut: command.shortcut,
    addon: command.addon,
    tags: command.tags,
    intentCategories: command.intentCategories,
    objectTypes: command.objectTypes,
    outcomes: command.outcomes,
    difficulty: command.difficulty,
  };
}

function ArrayEditor({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string[];
  placeholder: string;
  onChange: (next: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function add() {
    const next = input.trim();
    if (next && !value.includes(next)) onChange([...value, next]);
    setInput("");
  }

  return (
    <div className="aa-array-editor">
      <div className="aa-field-label">{label}</div>
      <div className="aa-chip-list">
        {value.map((item) => (
          <button key={item} type="button" className="active" onClick={() => onChange(value.filter((candidate) => candidate !== item))}>
            {item} x
          </button>
        ))}
      </div>
      <div className="aa-inline-create">
        <input
          className="aa-search-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <button className="aa-secondary-button" type="button" onClick={add}>Add</button>
      </div>
    </div>
  );
}

export function CommandsTab({ accessToken }: { accessToken: string }) {
  const [commands, setCommands] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const [activeTab, setActiveTab] = useState<CommandTabId>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState("");
  const [query, setQuery] = useState("");
  const [softwareFilter, setSoftwareFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");
  const [intentFilter, setIntentFilter] = useState("All");
  const [objectFilter, setObjectFilter] = useState("All");
  const [activeView, setActiveView] = useState<CommandView>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);

  const headers = useMemo(() => ({
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  }), [accessToken]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
        if (query.trim()) params.set("q", query.trim());
        if (softwareFilter !== "All") params.set("software", softwareFilter);
        const result = await fetchJson<{ commands: RawCommand[]; total: number }>(`/api/v1/admin/commands?${params}`, { headers });
        if (cancelled) return;
        const rows = (result.commands ?? []).map(normalizeCommand);
        setCommands(rows);
        setSelected((current) => current && rows.some((row) => row.id === current.id) ? current : null);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load commands");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [headers, page, query, softwareFilter]);

  const softwareOptions = ["All", ...SOFTWARE_OPTIONS];

  const intentOptions = ["All", ...Array.from(new Set(commands.flatMap((command) => command.intentCategories))).sort()];
  const objectOptions = ["All", ...Array.from(new Set(commands.flatMap((command) => command.objectTypes))).sort()];
  const filteredCommands = commands.filter((command) => {
    const haystack = `${command.name} ${command.description} ${command.menu} ${command.intentCategories.join(" ")} ${command.objectTypes.join(" ")} ${command.outcomes.join(" ")} ${command.tags.join(" ")}`.toLowerCase();
    if (levelFilter !== "All" && command.difficulty !== levelFilter) return false;
    if (intentFilter !== "All" && !command.intentCategories.includes(intentFilter)) return false;
    if (objectFilter !== "All" && !command.objectTypes.includes(objectFilter)) return false;
    if (activeView === "rhino" && command.software !== "Rhino") return false;
    if (activeView === "grasshopper" && command.software !== "Grasshopper") return false;
    if (activeView === "revit" && command.software !== "Revit") return false;
    if (activeView === "beginner" && command.difficulty !== "beginner") return false;
    if (activeView === "surface" && !haystack.includes("surface")) return false;
    if (activeView === "curve" && !haystack.includes("curve")) return false;
    if (activeView === "attention" && commandHealth(command).filter((item) => !item.ok).length === 0) return false;
    return true;
  });
  const selectedHealth = selected ? commandHealth(selected) : [];
  const commandColumns: TableColumn<Row>[] = [
    {
      id: "name",
      label: "Command Name",
      sortValue: (command) => command.name,
      render: (command) => (
        <span className="aa-table-title">
          <strong>{command.name || "Untitled command"}</strong>
          <span>{command.description || "Missing definition"}</span>
        </span>
      ),
    },
    { id: "software", label: "Software", sortValue: (command) => command.software, render: (command) => command.software || <span className="aa-table-muted">None</span> },
    { id: "category", label: "Category", sortValue: (command) => command.menu, render: (command) => command.menu || <span className="aa-table-muted">No category</span> },
    { id: "level", label: "Level", sortValue: (command) => command.difficulty, render: (command) => command.difficulty || "beginner" },
    { id: "intent", label: "Intent", sortValue: (command) => command.intentCategories[0] ?? "", render: (command) => command.intentCategories[0] || <span className="aa-table-muted">Missing</span> },
    { id: "object", label: "Object Type", sortValue: (command) => command.objectTypes[0] ?? "", render: (command) => command.objectTypes[0] || <span className="aa-table-muted">Missing</span> },
    { id: "input", label: "Input", render: (command) => command.tags[0] || <span className="aa-table-muted">Missing</span>, defaultVisible: false },
    { id: "output", label: "Output", sortValue: (command) => command.outcomes[0] ?? "", render: (command) => command.outcomes[0] || <span className="aa-table-muted">Missing</span> },
    { id: "lessons", label: "Used In Lessons", sortValue: () => 0, render: () => <span className="aa-table-muted">Not tracked</span> },
    { id: "combos", label: "Used In Combos", sortValue: () => 0, render: () => <span className="aa-table-muted">Not tracked</span> },
    { id: "status", label: "Status", sortValue: (command) => command._dirty ? "Draft" : "Published", render: (command) => <StatusBadge status={command._dirty ? "Draft" : "Published"} /> },
    {
      id: "health",
      label: "Health",
      sortValue: (command) => commandHealth(command).filter((item) => item.ok).length,
      render: (command) => {
        const missing = commandHealth(command).filter((item) => !item.ok);
        const score = Math.round(((commandHealth(command).length - missing.length) / commandHealth(command).length) * 100);
        return <span className={`aa-health-pill${score >= 85 ? " good" : score >= 55 ? " warn" : " bad"}`}>{score}% / {missing[0]?.label ?? "Ready"}</span>;
      },
    },
    { id: "updated", label: "Last Updated", render: () => <span className="aa-table-muted">Not tracked</span>, defaultVisible: false },
    {
      id: "actions",
      label: "Actions",
      render: (command) => (
        <span onClick={(event) => event.stopPropagation()}>
          <MoreMenu>
            <button type="button" onClick={() => setSelected(command)}>Edit</button>
            <button type="button" className="danger" onClick={() => void deleteCommand(command)}>Delete</button>
          </MoreMenu>
        </span>
      ),
    },
  ];

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  }

  function createCommand() {
    const command = blankCommand();
    setCommands((current) => [command, ...current]);
    setSelected(command);
    setActiveTab("overview");
  }

  function patchSelected(patch: Partial<CommandListItem>) {
    if (!selected) return;
    const updated = { ...selected, ...patch, _dirty: true };
    setSelected(updated);
    setCommands((current) => current.map((command) => command.id === selected.id ? updated : command));
  }

  function patchCommand(id: string, patch: Partial<CommandListItem>) {
    setCommands((current) => current.map((command) => command.id === id ? { ...command, ...patch, _dirty: true } : command));
    setSelected((current) => current?.id === id ? { ...current, ...patch, _dirty: true } : current);
  }

  async function saveCommand(command = selected) {
    if (!command) return;
    setSaving(true);
    setError("");
    try {
      const isNew = command.id.startsWith("new-");
      const payload = cleanCommand(command);
      const saved = isNew
        ? await fetchJson<CommandListItem>("/api/v1/admin/commands", { method: "POST", headers, body: JSON.stringify(payload) })
        : await fetchJson<CommandListItem>(`/api/v1/admin/commands/${command.id}`, { method: "PATCH", headers, body: JSON.stringify(payload) });
      const row = normalizeCommand(saved);
      setCommands((current) => current.map((item) => item.id === command.id ? row : item));
      setSelected(row);
      flash("Command saved.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCommand(command = selected) {
    if (!command) return;
    if (!window.confirm("Delete this command? This cannot be undone.")) return;
    if (command.id.startsWith("new-")) {
      setCommands((current) => current.filter((item) => item.id !== command.id));
      setSelected(null);
      return;
    }
    setError("");
    try {
      await fetchJson(`/api/v1/admin/commands/${command.id}`, { method: "DELETE", headers });
      setCommands((current) => current.filter((item) => item.id !== command.id));
      setSelected(null);
      flash("Command deleted.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function syncLibrary() {
    setSyncing(true);
    setError("");
    setSyncProgress("Preparing…");
    try {
      const manifest = await fetchJson<{ datasets: Array<{ dataset: string; software: string; ready: number }>; total: number }>(
        "/api/v1/admin/commands/seed",
        { headers },
      );
      let done = 0;
      let upserted = 0;
      for (const entry of manifest.datasets) {
        setSyncProgress(`${entry.software} (${done + 1}/${manifest.datasets.length})…`);
        const result = await fetchJson<{ upserted: number }>("/api/v1/admin/commands/seed", {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ dataset: entry.dataset }),
        });
        upserted += result.upserted;
        done += 1;
      }
      flash(`Library synced — ${upserted} commands published across ${done} softwares.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Library sync failed — safe to try again; already-synced softwares are simply re-checked.");
    } finally {
      setSyncing(false);
      setSyncProgress("");
    }
  }

  const activeCommandFilters = [
    softwareFilter !== "All",
    levelFilter !== "All",
    intentFilter !== "All",
    objectFilter !== "All",
  ].filter(Boolean).length;

  function clearCommandFilters() {
    setQuery("");
    setSoftwareFilter("All");
    setLevelFilter("All");
    setIntentFilter("All");
    setObjectFilter("All");
    setActiveView("all");
    setPage(1);
    setSelected(null);
  }

  return (
    <div className="aa-library-page">
      <PageHeader
        eyebrow="Library"
        title="Command Library"
        description="Create reusable software command cards once, then connect them to lessons, workflow combos and problem-solver answers."
        action={<button className="aa-primary-button" type="button" onClick={createCommand}>Manual Command</button>}
      >
        <label className="aa-admin-search aa-admin-search--wide">
          <span>Search</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
              setSelected(null);
            }}
            placeholder="Search commands, menus, tags..."
          />
        </label>
        <label className="aa-admin-filter aa-admin-filter--software">
          <span>Software</span>
          <select
            value={softwareFilter}
            onChange={(event) => {
              setSoftwareFilter(event.target.value);
              setPage(1);
              setSelected(null);
            }}
          >
            {softwareOptions.map((software) => <option key={software}>{software}</option>)}
          </select>
        </label>
        <details className="aa-filter-popover">
          <summary>Filters{activeCommandFilters > 0 ? ` (${activeCommandFilters})` : ""}</summary>
          <div className="aa-filter-popover-panel">
            <label>
              <span>Level</span>
              <select value={levelFilter} onChange={(event) => { setLevelFilter(event.target.value); setSelected(null); }}>
                <option>All</option>
                {DIFFICULTY_OPTIONS.map((level) => <option key={level}>{level}</option>)}
              </select>
            </label>
            <label>
              <span>Intent</span>
              <select value={intentFilter} onChange={(event) => { setIntentFilter(event.target.value); setSelected(null); }}>
                {intentOptions.map((intent) => <option key={intent}>{intent}</option>)}
              </select>
            </label>
            <label>
              <span>Object Type</span>
              <select value={objectFilter} onChange={(event) => { setObjectFilter(event.target.value); setSelected(null); }}>
                {objectOptions.map((objectType) => <option key={objectType}>{objectType}</option>)}
              </select>
            </label>
          </div>
        </details>
        {(query || activeCommandFilters > 0 || activeView !== "all") && (
          <button type="button" className="aa-clear-filters" onClick={clearCommandFilters}>Reset</button>
        )}
      </PageHeader>

      <section className="aa-curriculum-import-panel">
        <div>
          <span className="aa-eyebrow">CSV-first command library</span>
          <h2>Import command metadata before editing one-by-one</h2>
          <p>Use one sheet for command name, software, menu path, shortcut, action intent, object type, outcomes, tags and media URLs. Manual editing stays available for clean-up.</p>
        </div>
        <div className="aa-curriculum-import-actions">
          <CsvBulkActions entity="commands" accessToken={accessToken} templateLabel="Download Commands CSV" importLabel="Import Commands CSV" />
          <button
            type="button"
            className="st-create-btn"
            disabled={syncing}
            onClick={() => void syncLibrary()}
            title="Publish the command datasets shipped with this release into the live library"
          >
            {syncing ? syncProgress || "Syncing…" : "Sync library from repo"}
          </button>
        </div>
      </section>

      {notice && <div className="st-notice st-notice--ok">{notice}</div>}
      {error && (
        <div className="st-notice st-notice--err">
          {error}
          <button type="button" onClick={() => setError("")}>x</button>
        </div>
      )}

      <AdminDataTable
        rows={filteredCommands}
        columns={commandColumns}
        savedViews={COMMAND_VIEWS}
        activeView={activeView}
        onViewChange={(view) => { setActiveView(view as CommandView); setSelected(null); }}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        onRowClick={(command) => {
          setSelected(command);
          setActiveTab("overview");
        }}
        getRowLabel={(command) => command.name || "Untitled command"}
        bulkActions={(
          <>
            <button type="button" onClick={() => selectedIds.forEach((id) => patchCommand(id, { difficulty: "beginner" }))}>Beginner</button>
            <button type="button" onClick={() => selectedIds.forEach((id) => patchCommand(id, { software: "Rhino" }))}>Assign Rhino</button>
            <button type="button" onClick={() => selectedIds.forEach((id) => {
              const command = commands.find((item) => item.id === id);
              if (command) void deleteCommand(command);
            })}>Delete</button>
          </>
        )}
        empty={(
          <EmptyState
            title={loading ? "Loading commands..." : "No commands match this view"}
            description="Commands are reusable software actions like Loft, Join, Trim or Move. Create command cards once, then reuse them across the learning platform."
            action={<button className="aa-primary-button" type="button" onClick={createCommand}>Add Command</button>}
          />
        )}
      />

      {selected && (
        <div className="aa-drawer-backdrop" role="presentation">
          <aside className="aa-editor-drawer" aria-label="Command editor">
            <main className="aa-detail-panel">
          {selected ? (
            <>
              <header className="aa-editor-header">
                <div>
                  <div className="aa-editor-kicker">
                    <StatusBadge status={selected._dirty ? "Draft" : "Published"} />
                    <span>{selected.software || "No software"}</span>
                    <span>{selected.difficulty || "beginner"}</span>
                  </div>
                  <h2>{selected.name || "Untitled command"}</h2>
                  <p>{selected.description || "Add a concise definition so learners know when to use this command."}</p>
                </div>
                <div className="aa-editor-actions">
                  <SaveStatusIndicator state={saving ? "Saving..." : selected._dirty ? "Unsaved changes" : "Saved"} />
                  <button className="aa-secondary-button" type="button" onClick={() => setSelected(null)}>Close</button>
                  <button className="aa-primary-button" type="button" onClick={() => void saveCommand()} disabled={saving}>
                    Save Command
                  </button>
                  <MoreMenu>
                    <button type="button" onClick={() => createCommand()}>Create another command</button>
                    <button type="button" className="danger" onClick={() => void deleteCommand()}>Delete command</button>
                  </MoreMenu>
                </div>
              </header>

              <nav className="aa-tabs" aria-label="Command editor sections">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={activeTab === tab.id ? "active" : ""}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              {activeTab === "overview" && (
                <div className="aa-editor-grid">
                  <section className="aa-panel">
                    <div className="aa-panel-heading">
                      <div>
                        <h3>Command Basics</h3>
                        <p>Define what this command does and how learners find it in the software.</p>
                      </div>
                    </div>
                    <div className="aa-form-grid">
                      <label className="aa-field">
                        <span>Name</span>
                        <input value={selected.name} onChange={(event) => patchSelected({ name: event.target.value })} />
                      </label>
                      <label className="aa-field">
                        <span>Software</span>
                        <select value={selected.software} onChange={(event) => patchSelected({ software: event.target.value })}>
                          <option value="">Choose software</option>
                          {SOFTWARE_OPTIONS.map((software) => <option key={software}>{software}</option>)}
                        </select>
                      </label>
                      <label className="aa-field">
                        <span>Level</span>
                        <select value={selected.difficulty || "beginner"} onChange={(event) => patchSelected({ difficulty: event.target.value })}>
                          {DIFFICULTY_OPTIONS.map((level) => <option key={level}>{level}</option>)}
                        </select>
                      </label>
                      <label className="aa-field">
                        <span>Shortcut</span>
                        <input value={selected.shortcut} onChange={(event) => patchSelected({ shortcut: event.target.value })} placeholder="Ctrl + J, command line, toolbar..." />
                      </label>
                      <label className="aa-field">
                        <span>Menu path</span>
                        <input value={selected.menu} onChange={(event) => patchSelected({ menu: event.target.value })} placeholder="Surface > Loft" />
                      </label>
                      <label className="aa-field">
                        <span>Addon / plugin</span>
                        {getSubcategoryOptions(selected.software).length ? (
                          <select value={selected.addon} onChange={(event) => patchSelected({ addon: event.target.value })}>
                            <option value="">Choose subcategory</option>
                            {getSubcategoryOptions(selected.software).map((option) => <option key={option}>{option}</option>)}
                          </select>
                        ) : (
                          <input value={selected.addon} onChange={(event) => patchSelected({ addon: event.target.value })} placeholder="Native, Dynamo, Datasmith..." />
                        )}
                      </label>
                      <label className="aa-field aa-field-wide">
                        <span>Short definition</span>
                        <textarea rows={4} value={selected.description} onChange={(event) => patchSelected({ description: event.target.value })} />
                      </label>
                      <label className="aa-field aa-field-wide">
                        <span>Source URL</span>
                        <input value={selected.source} onChange={(event) => patchSelected({ source: event.target.value })} />
                      </label>
                      <ImageUploadField
                        accessToken={accessToken}
                        label="Icon"
                        folder="command-icons"
                        value={selected.icon}
                        onChange={(value) => patchSelected({ icon: value })}
                      />
                      <ImageUploadField
                        accessToken={accessToken}
                        label="GIF / image"
                        folder="command-media"
                        value={selected.gif}
                        onChange={(value) => patchSelected({ gif: value })}
                      />
                    </div>
                  </section>
                  <aside className="aa-side-stack">
                    <section className="aa-panel">
                      <h3>Command Health</h3>
                      <ContentHealthSummary items={selectedHealth} />
                      <HealthChecklist items={selectedHealth} />
                    </section>
                  </aside>
                </div>
              )}

              {activeTab === "usage" && (
                <section className="aa-panel aa-editor-body">
                  <div className="aa-panel-heading">
                    <div>
                      <h3>Usage Context</h3>
                      <p>Describe why this command exists and the kind of work it helps learners complete.</p>
                    </div>
                  </div>
                  <div className="aa-form-grid">
                    <ArrayEditor label="Intent categories" value={selected.intentCategories} placeholder="Create surface, edit geometry..." onChange={(value) => patchSelected({ intentCategories: value })} />
                    <ArrayEditor label="Object types" value={selected.objectTypes} placeholder="Curves, surfaces, walls..." onChange={(value) => patchSelected({ objectTypes: value })} />
                    <ArrayEditor label="Outcomes" value={selected.outcomes} placeholder="Clean loft, joined polysurface..." onChange={(value) => patchSelected({ outcomes: value })} />
                    <ArrayEditor label="Tags" value={selected.tags} placeholder="lofting, modelling, cleanup..." onChange={(value) => patchSelected({ tags: value })} />
                  </div>
                </section>
              )}

              {activeTab === "teaching" && (
                <section className="aa-panel aa-editor-body">
                  <EmptyState
                    title="Teaching notes are coming next"
                    description="The current database stores the command definition, access method, tags and usage categories. A future teaching-notes model can add when to use it, when not to use it, examples and common mistakes."
                  />
                </section>
              )}

              {activeTab === "troubleshooting" && (
                <section className="aa-panel aa-editor-body">
                  <EmptyState
                    title="Troubleshooting notes are not yet modelled"
                    description="This tab keeps the studio structure ready for command-specific mistakes, fixes and diagnostics without breaking the current API contract."
                  />
                </section>
              )}

              {activeTab === "relationships" && (
                <section className="aa-panel aa-editor-body">
                  <EmptyState
                    title="Relationships will connect this command"
                    description="Use this area for lessons, workflow combos, courses and problem-solver entries that reuse this command once relationship counts are exposed by the API."
                  />
                </section>
              )}

              {activeTab === "publish" && (
                <div className="aa-editor-grid">
                  <section className="aa-panel">
                    <div className="aa-panel-heading">
                      <div>
                        <h3>Publish Readiness</h3>
                        <p>Commands are reusable knowledge blocks. Complete the essentials before using them in lessons and combos.</p>
                      </div>
                    </div>
                    <ContentHealthSummary items={selectedHealth} />
                    <HealthChecklist items={selectedHealth} />
                    <div className="aa-publish-actions">
                      <button className="aa-primary-button" type="button" onClick={() => void saveCommand()} disabled={saving}>
                        Save Command
                      </button>
                    </div>
                  </section>
                  <aside className="aa-panel">
                    <h3>Learner Card Preview</h3>
                    <p>{selected.description || "Add a short definition to make this command useful in search and lessons."}</p>
                    <div className="aa-meta-grid">
                      <span>{selected.software || "No software"}</span>
                      <span>{selected.difficulty || "beginner"}</span>
                      <span>{selected.menu || "No menu path"}</span>
                      <span>{selected.shortcut || "No shortcut"}</span>
                    </div>
                  </aside>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title="Select or create a command"
              description="Commands are the reusable action cards that power lessons, workflow combos and learner search."
              action={<button className="aa-primary-button" type="button" onClick={createCommand}>Add Command</button>}
            />
          )}
            </main>
          </aside>
        </div>
      )}
    </div>
  );
}
