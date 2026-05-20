"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "@/lib/api/fetch-json";
import { ImageUploadField } from "./image-upload-field";
import { AdminDataTable, EmptyState, MoreMenu, PageHeader, type TableColumn } from "./studio-ui";

export type Instructor = {
  id: string;
  name: string;
  title: string;
  studio: string;
  bio: string;
  expertise: string[];
  image: string;
  created_at?: string;
};

function splitCsv(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function InstructorsTab({ accessToken }: { accessToken: string }) {
  const headers = useMemo(() => ({ "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }), [accessToken]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selected, setSelected] = useState<Instructor | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJson<{ instructors: Instructor[] }>("/api/v1/admin/instructors", { headers })
      .then((data) => setInstructors(data.instructors))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Instructors failed to load."));
  }, [headers]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  }

  async function createInstructor() {
    const name = newName.trim() || "New Instructor";
    const created = await fetchJson<Instructor>("/api/v1/admin/instructors", {
      method: "POST",
      headers,
      body: JSON.stringify({ name, title: "Instructor" }),
    });
    setInstructors((current) => [created, ...current]);
    setSelected(created);
    setNewName("");
    flash("Instructor created.");
  }

  async function saveInstructor(instructor = selected) {
    if (!instructor) return;
    const updated = await fetchJson<Instructor>(`/api/v1/admin/instructors/${encodeURIComponent(instructor.id)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(instructor),
    });
    setInstructors((current) => current.map((item) => item.id === updated.id ? updated : item));
    setSelected(updated);
    flash("Instructor saved.");
  }

  async function deleteInstructor(instructor: Instructor) {
    if (!window.confirm("Delete this instructor? Linked workshops will lose their instructor.")) return;
    await fetchJson(`/api/v1/admin/instructors/${encodeURIComponent(instructor.id)}`, { method: "DELETE", headers });
    setInstructors((current) => current.filter((item) => item.id !== instructor.id));
    if (selected?.id === instructor.id) setSelected(null);
    flash("Instructor deleted.");
  }

  function patch(patchBody: Partial<Instructor>) {
    if (!selected) return;
    const updated = { ...selected, ...patchBody };
    setSelected(updated);
    setInstructors((current) => current.map((item) => item.id === updated.id ? updated : item));
  }

  const filtered = instructors.filter((instructor) => {
    const haystack = `${instructor.name} ${instructor.title} ${instructor.studio} ${instructor.bio} ${instructor.expertise.join(" ")}`.toLowerCase();
    return !query || haystack.includes(query.toLowerCase());
  });

  const columns: TableColumn<Instructor>[] = [
    { id: "name", label: "Instructor", sortValue: (row) => row.name, render: (row) => <span className="aa-table-title"><strong>{row.name}</strong><span>{row.title || row.studio || "No title"}</span></span> },
    { id: "studio", label: "Studio", sortValue: (row) => row.studio, render: (row) => row.studio || <span className="aa-table-muted">Not set</span> },
    { id: "expertise", label: "Expertise", sortValue: (row) => row.expertise.length, render: (row) => row.expertise.slice(0, 3).join(", ") || <span className="aa-table-muted">None</span> },
    { id: "bio", label: "Bio", sortValue: (row) => row.bio, render: (row) => row.bio ? `${row.bio.slice(0, 90)}${row.bio.length > 90 ? "..." : ""}` : <span className="aa-table-muted">Missing</span> },
    { id: "actions", label: "Actions", render: (row) => <span onClick={(event) => event.stopPropagation()}><MoreMenu><button type="button" onClick={() => setSelected(row)}>Edit</button><button type="button" className="danger" onClick={() => void deleteInstructor(row)}>Delete</button></MoreMenu></span> },
  ];

  return (
    <div className="aa-library-page">
      <PageHeader
        eyebrow="People"
        title="Instructors"
        description="Manage workshop instructors, profile photos, biographies and expertise."
        action={<button className="aa-primary-button" type="button" onClick={() => void createInstructor()}>+ New Instructor</button>}
      />
      {notice && <div className="st-notice st-notice--ok">{notice}</div>}
      {error && <div className="st-notice st-notice--err">{error}<button type="button" onClick={() => setError("")}>x</button></div>}
      <div className="aa-course-filter-bar">
        <label className="aa-compact-search"><span>Search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search instructors..." /></label>
        <label><span>New instructor</span><input value={newName} onChange={(event) => setNewName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void createInstructor(); }} placeholder="Name..." /></label>
      </div>
      <AdminDataTable rows={filtered} columns={columns} selectedIds={selectedIds} onSelectedIdsChange={setSelectedIds} onRowClick={setSelected} getRowLabel={(row) => row.name} empty={<EmptyState title="No instructors yet" description="Create instructor profiles, then assign them to workshops." />} />
      {selected && (
        <div className="aa-drawer-backdrop" role="presentation">
          <aside className="aa-editor-drawer" aria-label="Instructor editor">
            <main className="aa-detail-panel">
              <header className="aa-editor-header"><div><h2>{selected.name}</h2><p>{selected.title || "Instructor profile"}</p></div><div className="aa-editor-actions"><button className="aa-secondary-button" type="button" onClick={() => setSelected(null)}>Close</button><button className="aa-primary-button" type="button" onClick={() => void saveInstructor()}>Save</button></div></header>
              <section className="aa-panel aa-editor-body instructor-profile-editor">
                <div className="instructor-profile-grid">
                  <aside className="instructor-profile-card">
                    <div className="instructor-profile-photo">
                      {selected.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={selected.image} alt="" />
                      ) : (
                        <span>{selected.name.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="instructor-profile-summary">
                      <strong>{selected.name || "Instructor"}</strong>
                      <span>{selected.title || "Instructor profile"}</span>
                    </div>
                    <div className="instructor-photo-field">
                      <ImageUploadField accessToken={accessToken} label="Photo" folder="instructors" value={selected.image} onChange={(value) => patch({ image: value })} />
                    </div>
                  </aside>

                  <div className="instructor-profile-fields">
                    <div className="aa-form-grid">
                      <label><span>Name</span><input value={selected.name} onChange={(event) => patch({ name: event.target.value })} /></label>
                      <label><span>Title</span><input value={selected.title} onChange={(event) => patch({ title: event.target.value })} placeholder="Instructor, Designer, Founder..." /></label>
                      <label className="span-2"><span>Studio / organisation</span><input value={selected.studio} onChange={(event) => patch({ studio: event.target.value })} /></label>
                      <label className="span-2"><span>Bio</span><textarea rows={8} value={selected.bio} onChange={(event) => patch({ bio: event.target.value })} /></label>
                      <label className="span-2"><span>Expertise</span><input value={selected.expertise.join(", ")} onChange={(event) => patch({ expertise: splitCsv(event.target.value) })} placeholder="Rhino, Prompting, App building..." /></label>
                    </div>
                  </div>
                </div>
              </section>
            </main>
          </aside>
        </div>
      )}
    </div>
  );
}
