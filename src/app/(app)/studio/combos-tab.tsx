"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "@/lib/api/fetch-json";
import type { CommandListItem } from "@/domain/command";
import { LAUNCH_SOFTWARE } from "@/config/taxonomy";
import { ImageUploadField } from "./image-upload-field";
import { AdminDataTable, CsvBulkActions, EmptyState, HealthChecklist, MoreMenu, PageHeader, StatusBadge, healthScore, type HealthItem, type SavedView, type TableColumn } from "./studio-ui";

type ComboStep = { name: string; note: string };

type AdminCombo = {
  id: string;
  title: string;
  software: string;
  difficulty: string;
  description: string;
  image: string;
  commands: ComboStep[];
  tags: string[];
  draft: boolean;
};

type RawAdminCombo = Partial<Omit<AdminCombo, "commands" | "tags">> & {
  commands?: unknown;
  tags?: unknown;
};

type ComboTab = "overview" | "sequence" | "steps" | "troubleshooting" | "relationships" | "publish";
type ComboView = "all" | "rhino" | "grasshopper" | "beginner" | "unused" | "missing-steps" | "attention";

const SW_OPTIONS = [...LAUNCH_SOFTWARE];
const DIFFICULTY_OPTIONS = ["beginner", "intermediate", "advanced"];
const TABS: { id: ComboTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "sequence", label: "Command Sequence" },
  { id: "steps", label: "Steps" },
  { id: "troubleshooting", label: "Troubleshooting" },
  { id: "relationships", label: "Relationships" },
  { id: "publish", label: "Publish" },
];
const COMBO_VIEWS: SavedView[] = [
  { id: "all", label: "All Combos" },
  { id: "rhino", label: "Rhino Combos" },
  { id: "grasshopper", label: "Grasshopper Combos" },
  { id: "beginner", label: "Beginner Combos" },
  { id: "unused", label: "Unused Combos" },
  { id: "missing-steps", label: "Missing Steps" },
  { id: "attention", label: "Needs Attention" },
];

function comboHealth(combo: AdminCombo): HealthItem[] {
  return [
    { label: "Title", ok: Boolean(combo.title.trim()), severity: "required" },
    { label: "Software", ok: Boolean(combo.software.trim()), severity: "required" },
    { label: "Problem solved / description", ok: Boolean(combo.description.trim()), severity: "required" },
    { label: "Command sequence", ok: combo.commands.length > 0, severity: "required" },
    { label: "Named command steps", ok: combo.commands.length > 0 && combo.commands.every((step) => step.name.trim()), severity: "required" },
    { label: "Tags", ok: combo.tags.length > 0, severity: "recommended" },
    { label: "Preview image", ok: Boolean(combo.image.trim()), severity: "recommended" },
  ];
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function normalizeComboSteps(value: unknown): ComboStep[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === "string") return { name: item.trim(), note: "" };
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      return {
        name: String(record.name ?? "").trim(),
        note: String(record.note ?? "").trim(),
      };
    }
    return { name: "", note: "" };
  }).filter((step) => step.name);
}

function normalizeCombo(row: RawAdminCombo): AdminCombo {
  return {
    id: String(row.id ?? `combo-${Date.now()}`),
    title: String(row.title ?? "Untitled Workflow Combo"),
    software: String(row.software ?? ""),
    difficulty: String(row.difficulty ?? "beginner"),
    description: String(row.description ?? ""),
    image: String(row.image ?? ""),
    commands: normalizeComboSteps(row.commands),
    tags: toStringArray(row.tags),
    draft: typeof row.draft === "boolean" ? row.draft : true,
  };
}

function TagEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [value, setValue] = useState("");
  function add() {
    const tag = value.trim().toLowerCase();
    if (tag && !tags.includes(tag)) onChange([...tags, tag]);
    setValue("");
  }
  return (
    <div className="st-tag-editor">
      <div className="st-tag-chips">
        {tags.map((tag) => (
          <span key={tag} className="st-tag-chip">{tag}<button type="button" onClick={() => onChange(tags.filter((item) => item !== tag))}>x</button></span>
        ))}
      </div>
      <div className="st-tag-input-row">
        <input value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }} placeholder="Add tag..." />
        <button type="button" className="st-create-btn" onClick={add}>Add</button>
      </div>
    </div>
  );
}

function SequenceEditor({
  steps,
  commandOptions,
  onChange,
}: {
  steps: ComboStep[];
  commandOptions: CommandListItem[];
  onChange: (steps: ComboStep[]) => void;
}) {
  function patch(index: number, next: Partial<ComboStep>) {
    onChange(steps.map((step, idx) => idx === index ? { ...step, ...next } : step));
  }
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  }
  return (
    <div className="aa-sequence-list">
      <datalist id="aa-combo-command-options">
        {commandOptions.map((command) => (
          <option key={command.id} value={command.name}>{command.software} / {command.menu || command.shortcut || command.description}</option>
        ))}
      </datalist>
      {steps.map((step, index) => (
        <div key={`${step.name}-${index}`} className="aa-sequence-row">
          <span>{index + 1}</span>
          <input list="aa-combo-command-options" value={step.name} onChange={(event) => patch(index, { name: event.target.value })} placeholder="Command name..." />
          <input value={step.note} onChange={(event) => patch(index, { note: event.target.value })} placeholder="Teaching note or option..." />
          <button type="button" onClick={() => move(index, -1)}>Up</button>
          <button type="button" onClick={() => move(index, 1)}>Down</button>
          <button type="button" onClick={() => onChange(steps.filter((_, idx) => idx !== index))}>Remove</button>
        </div>
      ))}
      <button type="button" className="st-create-btn" onClick={() => onChange([...steps, { name: "", note: "" }])}>+ Add command</button>
    </div>
  );
}

export function CombosTab({ accessToken }: { accessToken: string }) {
  const [combos, setCombos] = useState<AdminCombo[]>([]);
  const [commands, setCommands] = useState<CommandListItem[]>([]);
  const [selected, setSelected] = useState<AdminCombo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [softwareFilter, setSoftwareFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");
  const [activeView, setActiveView] = useState<ComboView>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [activeTab, setActiveTab] = useState<ComboTab>("overview");

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  }), [accessToken]);

  useEffect(() => {
    Promise.all([
      fetchJson<{ combos: RawAdminCombo[] }>("/api/v1/admin/combos", { headers }),
      fetchJson<{ commands: CommandListItem[] }>("/api/v1/admin/commands?limit=200", { headers }).catch(() => ({ commands: [] })),
    ])
      .then(([comboRes, commandRes]) => {
        setCombos((comboRes.combos ?? []).map(normalizeCombo));
        setCommands(commandRes.commands ?? []);
        setSelected(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Workflow combos failed to load.");
        setLoading(false);
      });
  }, [headers]);

  function flash(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(""), 2500);
  }

  function patch(field: keyof AdminCombo, value: unknown) {
    if (!selected) return;
    const updated = { ...selected, [field]: value };
    setSelected(updated);
    setCombos((prev) => prev.map((combo) => combo.id === updated.id ? updated : combo));
  }

  async function createCombo() {
    const title = newTitle.trim() || "Untitled Workflow Combo";
    try {
      const created = await fetchJson<RawAdminCombo>("/api/v1/admin/combos", {
        method: "POST",
        headers,
        body: JSON.stringify({ title, software: softwareFilter !== "All" ? softwareFilter : "", commands: [], draft: true }),
      });
      const normalized = normalizeCombo(created);
      setCombos((prev) => [normalized, ...prev]);
      setSelected(normalized);
      setNewTitle("");
      setActiveTab("overview");
      flash("Workflow combo created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed.");
    }
  }

  async function saveCombo(combo: AdminCombo) {
    setSaving(true);
    try {
      const updated = await fetchJson<RawAdminCombo>(`/api/v1/admin/combos/${combo.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(combo),
      });
      const normalized = normalizeCombo(updated);
      setCombos((prev) => prev.map((item) => item.id === normalized.id ? normalized : item));
      setSelected(normalized);
      flash("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCombo(combo: AdminCombo) {
    if (!window.confirm("Delete this workflow combo?")) return;
    try {
      await fetchJson(`/api/v1/admin/combos/${combo.id}`, { method: "DELETE", headers });
      setCombos((prev) => prev.filter((item) => item.id !== combo.id));
      setSelected(null);
      flash("Deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  const filtered = combos.filter((combo) => {
    if (softwareFilter !== "All" && combo.software !== softwareFilter) return false;
    if (levelFilter !== "All" && combo.difficulty !== levelFilter) return false;
    if (query.trim() && !`${combo.title} ${combo.description} ${combo.software}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (activeView === "rhino" && combo.software !== "Rhino") return false;
    if (activeView === "grasshopper" && combo.software !== "Grasshopper") return false;
    if (activeView === "beginner" && combo.difficulty !== "beginner") return false;
    if (activeView === "missing-steps" && combo.commands.length > 0) return false;
    if (activeView === "attention" && comboHealth(combo).every((item) => item.ok)) return false;
    return true;
  });
  const comboColumns: TableColumn<AdminCombo>[] = [
    { id: "title", label: "Combo Title", sortValue: (combo) => combo.title, render: (combo) => <span className="aa-table-title"><strong>{combo.title}</strong><span>{combo.description || "Missing problem solved"}</span></span> },
    { id: "software", label: "Software", sortValue: (combo) => combo.software, render: (combo) => combo.software || <span className="aa-table-muted">None</span> },
    { id: "skill", label: "Skill Area", sortValue: (combo) => combo.tags[0] ?? "", render: (combo) => combo.tags[0] || <span className="aa-table-muted">Missing</span> },
    { id: "problem", label: "Problem Solved", sortValue: (combo) => combo.description, render: (combo) => combo.description || <span className="aa-table-muted">Missing</span> },
    { id: "level", label: "Level", sortValue: (combo) => combo.difficulty, render: (combo) => combo.difficulty || "beginner" },
    { id: "commands", label: "Number of Commands", sortValue: (combo) => combo.commands.length, render: (combo) => combo.commands.length },
    { id: "lessons", label: "Used In Lessons", render: () => <span className="aa-table-muted">Not tracked</span> },
    { id: "courses", label: "Used In Courses", render: () => <span className="aa-table-muted">Not tracked</span>, defaultVisible: false },
    { id: "status", label: "Status", sortValue: (combo) => combo.draft ? "Draft" : "Published", render: (combo) => <StatusBadge status={combo.draft ? "Draft" : "Published"} /> },
    { id: "health", label: "Health", sortValue: (combo) => healthScore(comboHealth(combo)), render: (combo) => {
      const score = healthScore(comboHealth(combo));
      const missing = comboHealth(combo).filter((item) => !item.ok);
      return <span className={`aa-health-pill${score >= 85 ? " good" : score >= 55 ? " warn" : " bad"}`}>{score}% / {missing[0]?.label ?? "Ready"}</span>;
    } },
    { id: "updated", label: "Updated", render: () => <span className="aa-table-muted">Not tracked</span>, defaultVisible: false },
    { id: "actions", label: "Actions", render: (combo) => <span onClick={(event) => event.stopPropagation()}><MoreMenu><button type="button" onClick={() => setSelected(combo)}>Edit</button><button type="button" onClick={() => void saveCombo({ ...combo, draft: true })}>Archive</button><button type="button" className="danger" onClick={() => void deleteCombo(combo)}>Delete</button></MoreMenu></span> },
  ];

  if (loading) return <div className="st-loading">Loading workflow combos...</div>;

  return (
    <div className="aa-library-page">
      <PageHeader
        eyebrow="Library"
        title="Workflow Combos"
        description="Build reusable problem-solving recipes from existing commands."
        action={<button type="button" className="aa-primary-button" onClick={createCombo}>Manual Combo</button>}
      >
        <input className="aa-search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search combos..." />
        <select className="aa-search-input" value={softwareFilter} onChange={(event) => setSoftwareFilter(event.target.value)}>
          <option>All</option>
          {SW_OPTIONS.map((option) => <option key={option}>{option}</option>)}
        </select>
        <select className="aa-search-input" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
          <option>All</option>
          {DIFFICULTY_OPTIONS.map((option) => <option key={option}>{option}</option>)}
        </select>
      </PageHeader>

      <section className="aa-curriculum-import-panel">
        <div>
          <span className="aa-eyebrow">CSV-first workflow combos</span>
          <h2>Import repeatable command recipes as a batch</h2>
          <p>Use the combo sheet for title, software, difficulty, tags and ordered command steps. Enter steps as Command:Teaching note separated with pipes.</p>
        </div>
        <div className="aa-curriculum-import-actions">
          <CsvBulkActions entity="combos" accessToken={accessToken} templateLabel="Download Combos CSV" importLabel="Import Combos CSV" />
        </div>
      </section>

      {notice && <div className="st-notice st-notice--ok">{notice}</div>}
      {error && <div className="st-notice st-notice--err">{error} <button type="button" onClick={() => setError("")}>x</button></div>}

      <AdminDataTable
        rows={filtered}
        columns={comboColumns}
        savedViews={COMBO_VIEWS}
        activeView={activeView}
        onViewChange={(view) => setActiveView(view as ComboView)}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        onRowClick={(combo) => setSelected(combo)}
        getRowLabel={(combo) => combo.title}
        bulkActions={(
          <>
            <button type="button" onClick={() => selectedIds.forEach((id) => {
              const combo = combos.find((item) => item.id === id);
              if (combo) void saveCombo({ ...combo, draft: false });
            })}>Publish</button>
            <button type="button" onClick={() => selectedIds.forEach((id) => {
              const combo = combos.find((item) => item.id === id);
              if (combo) void saveCombo({ ...combo, draft: true });
            })}>Draft</button>
          </>
        )}
        empty={(
          <EmptyState
            title="No workflow combos match this view"
            description="Combos are reusable recipes like clean lofted surface, fix open polysurface, or make drawings from a model."
            action={<button type="button" className="aa-primary-button" onClick={() => void createCombo()}>+ Add Combo</button>}
          />
        )}
      />

      {selected && (
        <div className="aa-drawer-backdrop" role="presentation">
          <aside className="aa-editor-drawer" aria-label="Workflow combo editor">
            <main className="aa-detail-panel">
          {selected ? (
            <>
              <header className="aa-course-header">
                <div>
                  <span className="aa-breadcrumb">Workflow Combos / {selected.software || "No software"}</span>
                  <h2>{selected.title}</h2>
                  <div className="aa-meta-line">
                    <StatusBadge status={selected.draft ? "Draft" : "Published"} />
                    <span>{selected.commands.length} commands</span>
                    <span>{selected.difficulty}</span>
                  </div>
                </div>
                <div className="aa-course-actions">
                  <button type="button" className="aa-secondary-button" onClick={() => setSelected(null)}>Close</button>
                  <button type="button" className="st-save-btn" disabled={saving} onClick={() => void saveCombo(selected)}>{saving ? "Saving..." : "Save"}</button>
                  <button type="button" className="st-publish-btn" onClick={() => void saveCombo({ ...selected, draft: false })}>Publish</button>
                  <MoreMenu><button type="button" className="danger" onClick={() => void deleteCombo(selected)}>Delete combo</button></MoreMenu>
                </div>
              </header>

              <div className="aa-tabs">
                {TABS.map((tab) => <button key={tab.id} type="button" className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
              </div>

              <div className="aa-editor-body">
                {activeTab === "overview" && (
                  <section className="aa-panel aa-narrow-panel">
                    <div className="aa-panel-head"><h3>Problem Solved</h3><p>Make the reusable workflow easy to understand.</p></div>
                    <div className="aa-form-grid">
                      <label><span>Title</span><input value={selected.title} onChange={(event) => patch("title", event.target.value)} /></label>
                      <label><span>Software</span><select value={selected.software} onChange={(event) => patch("software", event.target.value)}><option value="">No software</option>{SW_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label><span>Level</span><select value={selected.difficulty} onChange={(event) => patch("difficulty", event.target.value)}>{DIFFICULTY_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label><span>Status</span><select value={selected.draft ? "Draft" : "Published"} onChange={(event) => patch("draft", event.target.value !== "Published")}><option>Draft</option><option>Published</option></select></label>
                      <label className="span-2"><span>Problem solved</span><textarea rows={5} value={selected.description} onChange={(event) => patch("description", event.target.value)} /></label>
                      <div className="span-2"><ImageUploadField accessToken={accessToken} label="GIF / Image" folder="combos" value={selected.image} onChange={(value) => patch("image", value)} /></div>
                      <div className="span-2"><span className="aa-field-label">Tags</span><TagEditor tags={selected.tags} onChange={(tags) => patch("tags", tags)} /></div>
                    </div>
                  </section>
                )}
                {activeTab === "sequence" && (
                  <section className="aa-panel">
                    <div className="aa-panel-head"><h3>Command Sequence</h3><p>Show the ordered recipe learners should follow.</p></div>
                    <SequenceEditor steps={selected.commands} commandOptions={commands} onChange={(steps) => patch("commands", steps)} />
                  </section>
                )}
                {activeTab === "steps" && <TextPanel title="Steps" value={selected.commands.map((step, index) => `${index + 1}. ${step.name}${step.note ? ` - ${step.note}` : ""}`).join("\n")} />}
                {activeTab === "troubleshooting" && <TextPanel title="Troubleshooting" value="Add common mistakes, fixes and variations in the next data model pass." />}
                {activeTab === "relationships" && <TextPanel title="Relationships" value="Use this workflow combo inside lesson production when a repeatable sequence appears." />}
                {activeTab === "publish" && (
                  <section className="aa-panel aa-publish-panel">
                    <div className="aa-panel-head"><h3>Publish Checklist</h3><p>Check the recipe before learners see it.</p></div>
                    <HealthChecklist items={comboHealth(selected)} />
                    <div className="aa-publish-actions">
                      <button type="button" className="st-publish-btn" onClick={() => void saveCombo({ ...selected, draft: false })}>Publish combo</button>
                    </div>
                  </section>
                )}
              </div>
            </>
          ) : (
            <EmptyState title="Select a workflow combo" description="Choose a combo or create a new reusable recipe from the left panel." />
          )}
            </main>
          </aside>
        </div>
      )}
    </div>
  );
}

function TextPanel({ title, value }: { title: string; value: string }) {
  return (
    <section className="aa-panel">
      <div className="aa-panel-head"><h3>{title}</h3><p>This area is prepared for richer structured content.</p></div>
      <textarea rows={14} value={value} readOnly />
    </section>
  );
}
