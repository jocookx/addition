"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "@/lib/api/fetch-json";
import { LAUNCH_SOFTWARE } from "@/config/taxonomy";
import { ImageUploadField } from "./image-upload-field";
import { AdminDataTable, CsvBulkActions, EmptyState, MoreMenu, PageHeader, StatusBadge, AccessBadge, type TableColumn } from "./studio-ui";

type Resource = {
  id: string;
  title: string;
  type: string;
  software: string;
  file_url: string;
  external_url: string;
  description: string;
  access_level: string;
  linked_lessons: string[];
  linked_courses: string[];
  status: string;
  tags: string[];
  updated_at: string;
};

type RawResource = Partial<Omit<Resource, "linked_lessons" | "linked_courses" | "tags">> & {
  linked_lessons?: unknown;
  linked_courses?: unknown;
  tags?: unknown;
};

const RESOURCE_TYPES = ["Exercise file", "Template", "PDF", "Image", "Video", "Link", "Dataset", "Model file", "Script", "Reference"];
const SOFTWARE = ["", ...LAUNCH_SOFTWARE];
const ACCESS = ["Free", "Pro", "Student", "Workshop", "Admin only"];
const STATUS = ["Draft", "Ready to Review", "Published", "Archived"];

function splitCsv(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function normalizeResource(resource: RawResource): Resource {
  return {
    id: String(resource.id ?? `resource-${Date.now()}`),
    title: String(resource.title ?? "Untitled Resource"),
    type: String(resource.type ?? "Link"),
    software: String(resource.software ?? ""),
    file_url: String(resource.file_url ?? ""),
    external_url: String(resource.external_url ?? ""),
    description: String(resource.description ?? ""),
    access_level: String(resource.access_level ?? "Free"),
    linked_lessons: toStringArray(resource.linked_lessons),
    linked_courses: toStringArray(resource.linked_courses),
    status: String(resource.status ?? "Draft"),
    tags: toStringArray(resource.tags),
    updated_at: String(resource.updated_at ?? ""),
  };
}

export function ResourcesTab({ accessToken }: { accessToken: string }) {
  const headers = useMemo(() => ({ "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }), [accessToken]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selected, setSelected] = useState<Resource | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [softwareFilter, setSoftwareFilter] = useState("All");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    fetchJson<{ resources: RawResource[] }>("/api/v1/admin/resources", { headers })
      .then((data) => setResources((data.resources ?? []).map(normalizeResource)))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Resources failed to load."));
  }, [headers]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  }

  async function createResource() {
    const title = newTitle.trim() || "Untitled Resource";
    const created = await fetchJson<RawResource>("/api/v1/admin/resources", {
      method: "POST",
      headers,
      body: JSON.stringify({ title, type: "Link", status: "Draft", access_level: "Free" }),
    });
    const normalized = normalizeResource(created);
    setResources((current) => [normalized, ...current]);
    setSelected(normalized);
    setNewTitle("");
    flash("Resource created.");
  }

  async function saveResource(resource = selected) {
    if (!resource) return;
    const updated = await fetchJson<RawResource>(`/api/v1/admin/resources/${resource.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(resource),
    });
    const normalized = normalizeResource(updated);
    setResources((current) => current.map((item) => item.id === normalized.id ? normalized : item));
    setSelected(normalized);
    flash("Resource saved.");
  }

  async function deleteResource(resource: Resource) {
    if (!window.confirm("Delete this resource?")) return;
    await fetchJson(`/api/v1/admin/resources/${resource.id}`, { method: "DELETE", headers });
    setResources((current) => current.filter((item) => item.id !== resource.id));
    if (selected?.id === resource.id) setSelected(null);
    flash("Resource deleted.");
  }

  function patch(patchBody: Partial<Resource>) {
    if (!selected) return;
    const updated = { ...selected, ...patchBody };
    setSelected(updated);
    setResources((current) => current.map((item) => item.id === updated.id ? updated : item));
  }

  const filtered = resources.filter((resource) => {
    const haystack = `${resource.title} ${resource.description} ${resource.software} ${resource.type}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    if (typeFilter !== "All" && resource.type !== typeFilter) return false;
    if (softwareFilter !== "All" && resource.software !== softwareFilter) return false;
    return true;
  });

  const columns: TableColumn<Resource>[] = [
    { id: "title", label: "Resource Title", sortValue: (row) => row.title, render: (row) => <span className="aa-table-title"><strong>{row.title}</strong><span>{row.description || row.file_url || row.external_url || "No description"}</span></span> },
    { id: "type", label: "Type", sortValue: (row) => row.type, render: (row) => row.type },
    { id: "software", label: "Software", sortValue: (row) => row.software, render: (row) => row.software || <span className="aa-table-muted">General</span> },
    { id: "access", label: "Access", sortValue: (row) => row.access_level, render: (row) => <AccessBadge access={row.access_level} /> },
    { id: "lessons", label: "Used In Lessons", sortValue: (row) => row.linked_lessons.length, render: (row) => row.linked_lessons.length },
    { id: "courses", label: "Used In Courses", sortValue: (row) => row.linked_courses.length, render: (row) => row.linked_courses.length },
    { id: "status", label: "Status", sortValue: (row) => row.status, render: (row) => <StatusBadge status={row.status} /> },
    { id: "updated", label: "Updated", sortValue: (row) => row.updated_at || "", render: (row) => row.updated_at ? new Date(row.updated_at).toLocaleDateString() : <span className="aa-table-muted">Not tracked</span> },
    { id: "actions", label: "Actions", render: (row) => <span onClick={(event) => event.stopPropagation()}><MoreMenu><button type="button" onClick={() => setSelected(row)}>Edit</button><button type="button" className="danger" onClick={() => void deleteResource(row)}>Delete</button></MoreMenu></span> },
  ];

  return (
    <div className="aa-library-page">
      <PageHeader
        eyebrow="Library"
        title="Resources"
        description="Reusable files, templates, links and reference materials."
        action={<div className="aa-action-cluster"><button className="aa-primary-button" type="button" onClick={() => void createResource()}>+ New Resource</button><CsvBulkActions entity="resources" accessToken={accessToken} /></div>}
      />
      {notice && <div className="st-notice st-notice--ok">{notice}</div>}
      {error && <div className="st-notice st-notice--err">{error}<button type="button" onClick={() => setError("")}>x</button></div>}
      <div className="aa-course-filter-bar">
        <label className="aa-compact-search"><span>Search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search resources..." /></label>
        <label><span>Type</span><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>All</option>{RESOURCE_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
        <label><span>Software</span><select value={softwareFilter} onChange={(event) => setSoftwareFilter(event.target.value)}><option>All</option>{SOFTWARE.filter(Boolean).map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>New title</span><input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void createResource(); }} placeholder="New resource..." /></label>
      </div>
      <AdminDataTable rows={filtered} columns={columns} selectedIds={selectedIds} onSelectedIdsChange={setSelectedIds} onRowClick={setSelected} getRowLabel={(row) => row.title} empty={<EmptyState title="No resources yet" description="Create reusable resources once, then link them to courses and lessons." />} />
      {selected && (
        <div className="aa-drawer-backdrop" role="presentation">
          <aside className="aa-editor-drawer" aria-label="Resource editor">
            <main className="aa-detail-panel">
              <header className="aa-editor-header"><div><h2>{selected.title}</h2><p>{selected.type} / {selected.software || "General"}</p></div><div className="aa-editor-actions"><button className="aa-secondary-button" type="button" onClick={() => setSelected(null)}>Close</button><button className="aa-primary-button" type="button" onClick={() => void saveResource()}>Save</button></div></header>
              <section className="aa-panel aa-editor-body">
                <div className="aa-form-grid">
                  <label><span>Title</span><input value={selected.title} onChange={(event) => patch({ title: event.target.value })} /></label>
                  <label><span>Type</span><select value={selected.type} onChange={(event) => patch({ type: event.target.value })}>{RESOURCE_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
                  <label><span>Software</span><select value={selected.software} onChange={(event) => patch({ software: event.target.value })}>{SOFTWARE.map((item) => <option key={item} value={item}>{item || "General"}</option>)}</select></label>
                  <label><span>Access</span><select value={selected.access_level} onChange={(event) => patch({ access_level: event.target.value })}>{ACCESS.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label><span>Status</span><select value={selected.status} onChange={(event) => patch({ status: event.target.value })}>{STATUS.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label><span>External URL</span><input value={selected.external_url} onChange={(event) => patch({ external_url: event.target.value })} /></label>
                  <div className="span-2"><ImageUploadField accessToken={accessToken} label="Upload file / image" folder="resources" value={selected.file_url} onChange={(value) => patch({ file_url: value })} /></div>
                  <label className="span-2"><span>Description</span><textarea rows={4} value={selected.description} onChange={(event) => patch({ description: event.target.value })} /></label>
                  <label><span>Linked lessons</span><input value={selected.linked_lessons.join(", ")} onChange={(event) => patch({ linked_lessons: splitCsv(event.target.value) })} /></label>
                  <label><span>Linked courses</span><input value={selected.linked_courses.join(", ")} onChange={(event) => patch({ linked_courses: splitCsv(event.target.value) })} /></label>
                  <label className="span-2"><span>Tags</span><input value={selected.tags.join(", ")} onChange={(event) => patch({ tags: splitCsv(event.target.value) })} /></label>
                </div>
              </section>
            </main>
          </aside>
        </div>
      )}
    </div>
  );
}
