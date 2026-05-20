"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "@/lib/api/fetch-json";
import { LAUNCH_SOFTWARE } from "@/config/taxonomy";
import { AdminDataTable, CsvBulkActions, EmptyState, MoreMenu, PageHeader, StatusBadge, type TableColumn } from "./studio-ui";

type ProblemEntry = {
  id: string;
  question: string;
  alternative_phrasings: string[];
  software: string;
  intent: string;
  difficulty: string;
  short_answer: string;
  detailed_answer: string;
  linked_commands: string[];
  linked_combos: string[];
  linked_lessons: string[];
  linked_courses: string[];
  common_mistakes: string;
  tags: string[];
  frequency: number;
  status: string;
  updated_at: string;
};

const SOFTWARE = ["", ...LAUNCH_SOFTWARE];
const STATUS = ["Draft", "Ready to Review", "Published", "Archived"];
const DIFFICULTY = ["beginner", "intermediate", "advanced"];
function splitCsv(value: string) { return value.split(",").map((item) => item.trim()).filter(Boolean); }

export function ProblemSolverTab({ accessToken }: { accessToken: string }) {
  const headers = useMemo(() => ({ "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }), [accessToken]);
  const [entries, setEntries] = useState<ProblemEntry[]>([]);
  const [selected, setSelected] = useState<ProblemEntry | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetchJson<{ entries: ProblemEntry[] }>("/api/v1/admin/problem-solver", { headers })
      .then((data) => setEntries(data.entries))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Problem Solver failed to load."));
  }, [headers]);

  function flash(message: string) { setNotice(message); window.setTimeout(() => setNotice(""), 2500); }

  async function createEntry() {
    const question = newQuestion.trim() || "Untitled learner question";
    const created = await fetchJson<ProblemEntry>("/api/v1/admin/problem-solver", { method: "POST", headers, body: JSON.stringify({ question }) });
    setEntries((current) => [created, ...current]);
    setSelected(created);
    setNewQuestion("");
    flash("Problem Solver entry created.");
  }

  async function saveEntry(entry = selected) {
    if (!entry) return;
    const updated = await fetchJson<ProblemEntry>(`/api/v1/admin/problem-solver/${entry.id}`, { method: "PATCH", headers, body: JSON.stringify(entry) });
    setEntries((current) => current.map((item) => item.id === updated.id ? updated : item));
    setSelected(updated);
    flash("Entry saved.");
  }

  async function deleteEntry(entry: ProblemEntry) {
    if (!window.confirm("Delete this Problem Solver entry?")) return;
    await fetchJson(`/api/v1/admin/problem-solver/${entry.id}`, { method: "DELETE", headers });
    setEntries((current) => current.filter((item) => item.id !== entry.id));
    if (selected?.id === entry.id) setSelected(null);
    flash("Entry deleted.");
  }

  function patch(patchBody: Partial<ProblemEntry>) {
    if (!selected) return;
    const updated = { ...selected, ...patchBody };
    setSelected(updated);
    setEntries((current) => current.map((item) => item.id === updated.id ? updated : item));
  }

  const filtered = entries.filter((entry) => `${entry.question} ${entry.software} ${entry.intent} ${entry.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const columns: TableColumn<ProblemEntry>[] = [
    { id: "question", label: "Question", sortValue: (row) => row.question, render: (row) => <span className="aa-table-title"><strong>{row.question}</strong><span>{row.short_answer || "Missing answer"}</span></span> },
    { id: "software", label: "Software", sortValue: (row) => row.software, render: (row) => row.software || <span className="aa-table-muted">General</span> },
    { id: "intent", label: "Intent", sortValue: (row) => row.intent, render: (row) => row.intent || <span className="aa-table-muted">Missing</span> },
    { id: "difficulty", label: "Difficulty", sortValue: (row) => row.difficulty, render: (row) => row.difficulty },
    { id: "commands", label: "Linked Commands", sortValue: (row) => row.linked_commands.length, render: (row) => row.linked_commands.length },
    { id: "combos", label: "Linked Combos", sortValue: (row) => row.linked_combos.length, render: (row) => row.linked_combos.length },
    { id: "lessons", label: "Linked Lessons", sortValue: (row) => row.linked_lessons.length, render: (row) => row.linked_lessons.length },
    { id: "frequency", label: "Frequency", sortValue: (row) => row.frequency, render: (row) => row.frequency },
    { id: "status", label: "Status", sortValue: (row) => row.status, render: (row) => <StatusBadge status={row.status} /> },
    { id: "health", label: "Health", render: (row) => row.short_answer && row.linked_commands.length + row.linked_combos.length + row.linked_lessons.length > 0 ? <span className="aa-health-pill good">Ready</span> : <span className="aa-health-pill warn">Needs links</span> },
    { id: "updated", label: "Updated", sortValue: (row) => row.updated_at || "", render: (row) => row.updated_at ? new Date(row.updated_at).toLocaleDateString() : <span className="aa-table-muted">Not tracked</span> },
    { id: "actions", label: "Actions", render: (row) => <span onClick={(event) => event.stopPropagation()}><MoreMenu><button type="button" onClick={() => setSelected(row)}>Edit</button><button type="button" className="danger" onClick={() => void deleteEntry(row)}>Delete</button></MoreMenu></span> },
  ];

  return (
    <div className="aa-library-page">
      <PageHeader
        eyebrow="Library"
        title="Problem Solver"
        description="Map learner questions to commands, combos, lessons and courses."
        action={<div className="aa-action-cluster"><button className="aa-primary-button" type="button" onClick={() => void createEntry()}>+ New Entry</button><CsvBulkActions entity="problem-solver" accessToken={accessToken} /></div>}
      />
      {notice && <div className="st-notice st-notice--ok">{notice}</div>}
      {error && <div className="st-notice st-notice--err">{error}<button type="button" onClick={() => setError("")}>x</button></div>}
      <div className="aa-course-filter-bar">
        <label className="aa-compact-search"><span>Search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions..." /></label>
        <label><span>New question</span><input value={newQuestion} onChange={(event) => setNewQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void createEntry(); }} placeholder="How do I..." /></label>
      </div>
      <AdminDataTable rows={filtered} columns={columns} selectedIds={selectedIds} onSelectedIdsChange={setSelectedIds} onRowClick={setSelected} getRowLabel={(row) => row.question} empty={<EmptyState title="No Problem Solver entries yet" description="Add common learner questions, then connect them to existing commands, combos and lessons." />} />
      {selected && (
        <div className="aa-drawer-backdrop" role="presentation">
          <aside className="aa-editor-drawer" aria-label="Problem Solver editor">
            <main className="aa-detail-panel">
              <header className="aa-editor-header"><div><h2>{selected.question}</h2><p>{selected.software || "General"} / {selected.intent || "No intent"}</p></div><div className="aa-editor-actions"><button className="aa-secondary-button" type="button" onClick={() => setSelected(null)}>Close</button><button className="aa-primary-button" type="button" onClick={() => void saveEntry()}>Save</button></div></header>
              <section className="aa-panel aa-editor-body">
                <div className="aa-form-grid">
                  <label className="span-2"><span>User question</span><textarea rows={3} value={selected.question} onChange={(event) => patch({ question: event.target.value })} /></label>
                  <label><span>Software</span><select value={selected.software} onChange={(event) => patch({ software: event.target.value })}>{SOFTWARE.map((item) => <option key={item} value={item}>{item || "General"}</option>)}</select></label>
                  <label><span>Intent</span><input value={selected.intent} onChange={(event) => patch({ intent: event.target.value })} /></label>
                  <label><span>Difficulty</span><select value={selected.difficulty} onChange={(event) => patch({ difficulty: event.target.value })}>{DIFFICULTY.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label><span>Status</span><select value={selected.status} onChange={(event) => patch({ status: event.target.value })}>{STATUS.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label className="span-2"><span>Short answer</span><textarea rows={3} value={selected.short_answer} onChange={(event) => patch({ short_answer: event.target.value })} /></label>
                  <label className="span-2"><span>Detailed answer</span><textarea rows={6} value={selected.detailed_answer} onChange={(event) => patch({ detailed_answer: event.target.value })} /></label>
                  <label><span>Linked commands</span><input value={selected.linked_commands.join(", ")} onChange={(event) => patch({ linked_commands: splitCsv(event.target.value) })} /></label>
                  <label><span>Linked combos</span><input value={selected.linked_combos.join(", ")} onChange={(event) => patch({ linked_combos: splitCsv(event.target.value) })} /></label>
                  <label><span>Linked lessons</span><input value={selected.linked_lessons.join(", ")} onChange={(event) => patch({ linked_lessons: splitCsv(event.target.value) })} /></label>
                  <label><span>Linked courses</span><input value={selected.linked_courses.join(", ")} onChange={(event) => patch({ linked_courses: splitCsv(event.target.value) })} /></label>
                  <label className="span-2"><span>Alternative phrasings</span><input value={selected.alternative_phrasings.join(", ")} onChange={(event) => patch({ alternative_phrasings: splitCsv(event.target.value) })} /></label>
                  <label className="span-2"><span>Common mistakes</span><textarea rows={4} value={selected.common_mistakes} onChange={(event) => patch({ common_mistakes: event.target.value })} /></label>
                </div>
              </section>
            </main>
          </aside>
        </div>
      )}
    </div>
  );
}
