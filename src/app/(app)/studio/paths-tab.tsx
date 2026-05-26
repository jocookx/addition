"use client";

import { useEffect, useMemo, useState } from "react";
import { LAUNCH_SOFTWARE } from "@/config/taxonomy";
import { fetchJson } from "@/lib/api/fetch-json";
import type { CourseCatalogListItem } from "@/domain/catalog";
import { ImageUploadField } from "./image-upload-field";
import {
  AccessBadge,
  AdminDataTable,
  ContentHealthSummary,
  CsvBulkActions,
  EmptyState,
  HealthChecklist,
  MoreMenu,
  PageHeader,
  SaveStatusIndicator,
  StatusBadge,
  healthScore,
  type HealthItem,
  type SavedView,
  type TableColumn,
} from "./studio-ui";

type PathLevel = "explorer" | "improver" | "refiner";
type PathTabId = "overview" | "courses" | "outcomes" | "resources" | "publish";
type PathView = "all" | "attention" | "drafts" | "published" | "rhino" | "grasshopper" | "revit";

type AdminPath = {
  id: string;
  title: string;
  slug: string;
  description: string;
  outcome: string;
  level: PathLevel;
  audience: string;
  software: string[];
  image: string;
  course_ids: string[];
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const LEVELS: PathLevel[] = ["explorer", "improver", "refiner"];
const LEVEL_LABELS: Record<PathLevel, string> = {
  explorer: "Beginner",
  improver: "Intermediate",
  refiner: "Advanced",
};

const SOFTWARE_OPTIONS = [...LAUNCH_SOFTWARE];

const TABS: Array<{ id: PathTabId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "courses", label: "Courses" },
  { id: "outcomes", label: "Outcomes" },
  { id: "resources", label: "Resources" },
  { id: "publish", label: "Publish" },
];

const PATH_VIEWS: SavedView[] = [
  { id: "all", label: "All Paths" },
  { id: "attention", label: "Needs Attention" },
  { id: "drafts", label: "Drafts" },
  { id: "published", label: "Published" },
  { id: "rhino", label: "Rhino" },
  { id: "grasshopper", label: "Grasshopper" },
  { id: "revit", label: "Revit" },
];

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function pathHealth(path: AdminPath, assignedCourses: CourseCatalogListItem[]): HealthItem[] {
  const lessonCount = assignedCourses.reduce((total, course) => total + course.lessonCount, 0);
  return [
    { label: "Has title", ok: Boolean(path.title.trim()), severity: "required" },
    { label: "Has learner promise", ok: Boolean(path.description.trim()), severity: "required" },
    { label: "Has outcome", ok: Boolean(path.outcome.trim()), severity: "required" },
    { label: "Has target audience", ok: Boolean(path.audience.trim()), severity: "recommended" },
    { label: "Has software", ok: path.software.length > 0, severity: "required" },
    { label: "Has at least one course", ok: path.course_ids.length > 0, severity: "required" },
    { label: "Has lessons through linked courses", ok: lessonCount > 0, severity: "recommended" },
    { label: "Has thumbnail", ok: Boolean(path.image.trim()), severity: "recommended" },
    { label: "Has public slug", ok: Boolean(path.slug.trim()), severity: "required" },
    { label: "Publish status selected", ok: typeof path.published === "boolean", severity: "required" },
  ];
}

function newPath(title: string, sortOrder: number): AdminPath {
  const id = slugify(title.trim()) || `path-${Date.now()}`;
  return {
    id,
    title: title.trim(),
    slug: id,
    description: "",
    outcome: "",
    level: "explorer",
    audience: "",
    software: [],
    image: "",
    course_ids: [],
    published: false,
    sort_order: sortOrder,
    created_at: "",
    updated_at: "",
  };
}

function SoftwarePicker({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  function toggle(software: string) {
    onChange(value.includes(software) ? value.filter((item) => item !== software) : [...value, software]);
  }

  return (
    <div className="aa-chip-list">
      {SOFTWARE_OPTIONS.map((software) => (
        <button
          key={software}
          type="button"
          className={value.includes(software) ? "active" : ""}
          onClick={() => toggle(software)}
        >
          {software}
        </button>
      ))}
    </div>
  );
}

export function PathsTab({ accessToken }: { accessToken: string }) {
  const [paths, setPaths] = useState<AdminPath[]>([]);
  const [courses, setCourses] = useState<CourseCatalogListItem[]>([]);
  const [selected, setSelected] = useState<AdminPath | null>(null);
  const [activeTab, setActiveTab] = useState<PathTabId>("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [courseQuery, setCourseQuery] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  // Track whether the slug has been manually edited so we stop auto-generating
  const [slugLocked, setSlugLocked] = useState(false);
  const [levelFilter, setLevelFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeView, setActiveView] = useState<PathView>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  }), [accessToken]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void Promise.all([
      fetchJson<{ paths: AdminPath[] }>("/api/v1/admin/paths", { headers }),
      fetchJson<{ courses: CourseCatalogListItem[] }>("/api/v1/catalog/courses"),
    ]).then(([pathData, courseData]) => {
      if (cancelled) return;
      setPaths(pathData.paths);
      setCourses(courseData.courses);
      setSelected(null);
      setLoading(false);
    }).catch((err: unknown) => {
      if (cancelled) return;
      setError(err instanceof Error ? err.message : "Failed to load learning paths");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [headers]);

  const filteredPaths = paths.filter((path) => {
    const search = `${path.title} ${path.software.join(" ")} ${path.audience}`.toLowerCase();
    if (query.trim() && !search.includes(query.toLowerCase())) return false;
    if (levelFilter !== "All" && LEVEL_LABELS[path.level] !== levelFilter) return false;
    if (statusFilter === "Draft" && path.published) return false;
    if (statusFilter === "Published" && !path.published) return false;
    const assigned = path.course_ids.map((id) => courses.find((course) => course.id === id)).filter(Boolean) as CourseCatalogListItem[];
    const score = healthScore(pathHealth(path, assigned));
    if (activeView === "attention" && score >= 85) return false;
    if (activeView === "drafts" && path.published) return false;
    if (activeView === "published" && !path.published) return false;
    if (activeView === "rhino" && !path.software.includes("Rhino")) return false;
    if (activeView === "grasshopper" && !path.software.includes("Grasshopper")) return false;
    if (activeView === "revit" && !path.software.includes("Revit")) return false;
    return true;
  });

  const assignedCourses = useMemo(() => {
    const ids = selected?.course_ids ?? [];
    return ids.map((id) => courses.find((course) => course.id === id)).filter(Boolean) as CourseCatalogListItem[];
  }, [selected?.course_ids, courses]);

  const availableCourses = courses.filter((course) => {
    const haystack = `${course.title} ${course.software} ${course.type}`.toLowerCase();
    return !courseQuery.trim() || haystack.includes(courseQuery.toLowerCase());
  });

  const selectedHealth = selected ? pathHealth(selected, assignedCourses) : [];
  const totalLessons = assignedCourses.reduce((total, course) => total + course.lessonCount, 0);
  const pathColumns: TableColumn<AdminPath>[] = [
    {
      id: "title",
      label: "Path Title",
      sortValue: (path) => path.title,
      render: (path) => (
        <span className="aa-table-title">
          <strong>{path.title}</strong>
          <span>{path.description || path.audience || path.id}</span>
        </span>
      ),
    },
    { id: "software", label: "Software", sortValue: (path) => path.software.join(", "), render: (path) => path.software.join(", ") || <span className="aa-table-muted">None</span> },
    { id: "level", label: "Level", sortValue: (path) => LEVEL_LABELS[path.level], render: (path) => LEVEL_LABELS[path.level] },
    { id: "courses", label: "Courses", sortValue: (path) => path.course_ids.length, render: (path) => path.course_ids.length },
    {
      id: "lessons",
      label: "Lessons",
      sortValue: (path) => path.course_ids.reduce((total, id) => total + (courses.find((course) => course.id === id)?.lessonCount ?? 0), 0),
      render: (path) => path.course_ids.reduce((total, id) => total + (courses.find((course) => course.id === id)?.lessonCount ?? 0), 0),
    },
    { id: "status", label: "Status", sortValue: (path) => path.published ? "Published" : "Draft", render: (path) => <StatusBadge status={path.published ? "Published" : "Draft"} /> },
    { id: "access", label: "Access", render: () => <AccessBadge access="Free" /> },
    {
      id: "health",
      label: "Health",
      sortValue: (path) => {
        const assigned = path.course_ids.map((id) => courses.find((course) => course.id === id)).filter(Boolean) as CourseCatalogListItem[];
        return healthScore(pathHealth(path, assigned));
      },
      render: (path) => {
        const assigned = path.course_ids.map((id) => courses.find((course) => course.id === id)).filter(Boolean) as CourseCatalogListItem[];
        const health = pathHealth(path, assigned);
        const score = healthScore(health);
        const missing = health.filter((item) => !item.ok);
        return <span className={`aa-health-pill${score >= 85 ? " good" : score >= 55 ? " warn" : " bad"}`}>{score}% / {missing[0]?.label ?? "Ready"}</span>;
      },
    },
    { id: "updated", label: "Updated", sortValue: (path) => path.updated_at || "", render: (path) => path.updated_at ? new Date(path.updated_at).toLocaleDateString() : <span className="aa-table-muted">Not tracked</span> },
    {
      id: "actions",
      label: "Actions",
      render: (path) => (
        <span onClick={(event) => event.stopPropagation()}>
          <MoreMenu>
            <button type="button" onClick={() => { setSelected(path); setSlugLocked(false); }}>Edit</button>
            <button type="button" onClick={() => void savePathFor(path, { published: false })}>Move to draft</button>
            <button type="button" className="danger" onClick={() => void deletePath(path.id)}>Delete</button>
          </MoreMenu>
        </span>
      ),
    },
  ];

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  }

  function patch(field: keyof AdminPath, value: unknown) {
    if (!selected) return;
    let updated = { ...selected, [field]: value };
    // Auto-generate slug from title unless the user has manually edited the slug
    if (field === "title" && !slugLocked) {
      updated = { ...updated, slug: slugify(String(value)) };
    }
    setSelected(updated);
    setPaths((current) => current.map((path) => path.id === updated.id ? updated : path));
  }

  function patchSlug(value: string) {
    if (!selected) return;
    setSlugLocked(true); // user is manually editing — stop auto-generating
    const updated = { ...selected, slug: value };
    setSelected(updated);
    setPaths((current) => current.map((path) => path.id === updated.id ? updated : path));
  }

  async function createPath() {
    const title = newTitle.trim() || `Untitled Learning Path ${paths.length + 1}`;
    setCreating(true);
    setError("");
    try {
      const body = newPath(title, paths.length * 10);
      const created = await fetchJson<AdminPath>("/api/v1/admin/paths", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      setPaths((current) => [...current, created]);
      setSelected(created);
      setActiveTab("overview");
      setNewTitle("");
      flash("Learning path created.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  async function savePath(patchBody?: Partial<AdminPath>) {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const updated = await fetchJson<AdminPath>(`/api/v1/admin/paths/${selected.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(patchBody ?? selected),
      });
      setPaths((current) => current.map((path) => path.id === updated.id ? updated : path));
      setSelected(updated);
      flash("Saved.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function savePathFor(path: AdminPath, patchBody: Partial<AdminPath>) {
    setSaving(true);
    setError("");
    try {
      const updated = await fetchJson<AdminPath>(`/api/v1/admin/paths/${path.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(patchBody),
      });
      setPaths((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSelected((current) => current?.id === updated.id ? updated : current);
      flash("Saved.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deletePath(id: string) {
    if (!window.confirm("Delete this learning path? This cannot be undone.")) return;
    setError("");
    try {
      await fetchJson(`/api/v1/admin/paths/${id}`, { method: "DELETE", headers });
      setPaths((current) => current.filter((path) => path.id !== id));
      setSelected((current) => current?.id === id ? null : current);
      flash("Learning path deleted.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function toggleCourse(courseId: string) {
    if (!selected) return;
    const next = selected.course_ids.includes(courseId)
      ? selected.course_ids.filter((id) => id !== courseId)
      : [...selected.course_ids, courseId];
    patch("course_ids", next);
  }

  function moveCourse(courseId: string, direction: -1 | 1) {
    if (!selected) return;
    const index = selected.course_ids.indexOf(courseId);
    patch("course_ids", moveItem(selected.course_ids, index, index + direction));
  }

  if (loading) {
    return <div className="aa-loading">Loading learning paths...</div>;
  }

  return (
    <div className="aa-library-page">
      <PageHeader
        eyebrow="Create"
        title="Learning Paths"
        description="Build high-level journeys that connect courses into clear learner outcomes."
        action={(
          <div className="aa-action-cluster">
            <button className="aa-primary-button" type="button" onClick={() => void createPath()} disabled={creating}>
              {creating ? "Creating..." : "+ New Path"}
            </button>
            <CsvBulkActions entity="paths" accessToken={accessToken} />
          </div>
        )}
      >
        <input
          className="aa-search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search paths..."
        />
        <select className="aa-search-input" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
          <option>All</option>
          {Object.values(LEVEL_LABELS).map((level) => <option key={level}>{level}</option>)}
        </select>
        <select className="aa-search-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option>All</option>
          <option>Draft</option>
          <option>Published</option>
        </select>
      </PageHeader>

      {notice && <div className="st-notice st-notice--ok">{notice}</div>}
      {error && (
        <div className="st-notice st-notice--err">
          {error}
          <button type="button" onClick={() => setError("")}>x</button>
        </div>
      )}

      <AdminDataTable
        rows={filteredPaths}
        columns={pathColumns}
        savedViews={PATH_VIEWS}
        activeView={activeView}
        onViewChange={(view) => setActiveView(view as PathView)}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        onRowClick={(path) => {
          setSelected(path);
          setActiveTab("overview");
          setSlugLocked(false);
        }}
        getRowLabel={(path) => path.title}
        bulkActions={(
          <>
            <button type="button" onClick={() => selectedIds.forEach((id) => {
              const path = paths.find((item) => item.id === id);
              if (path) void savePathFor(path, { published: true });
            })}>Publish</button>
            <button type="button" onClick={() => selectedIds.forEach((id) => {
              const path = paths.find((item) => item.id === id);
              if (path) void savePathFor(path, { published: false });
            })}>Draft</button>
          </>
        )}
        empty={(
          <EmptyState
            title="No learning paths match this view"
            description="Paths package courses into complete learner journeys, like Rhino Beginner or Revit Documentation."
            action={<button className="aa-secondary-button" type="button" onClick={() => setNewTitle("Rhino Beginner Path")}>Use starter title</button>}
          />
        )}
      />

      {selected && (
        <div className="aa-drawer-backdrop" role="presentation">
          <aside className="aa-editor-drawer" aria-label="Learning path editor">
            <main className="aa-detail-panel">
          {selected ? (
            <>
              <header className="aa-editor-header">
                <div>
                  <div className="aa-editor-kicker">
                    <StatusBadge status={selected.published ? "Published" : "Draft"} />
                    <AccessBadge access="Free" />
                    <span>{LEVEL_LABELS[selected.level]}</span>
                  </div>
                  <h2>{selected.title}</h2>
                  <p>{assignedCourses.length} courses | {totalLessons} lessons | {selected.updated_at ? `Updated ${new Date(selected.updated_at).toLocaleDateString()}` : "Not saved yet"}</p>
                </div>
                <div className="aa-editor-actions">
                  <SaveStatusIndicator state={saving ? "Saving..." : "Saved"} />
                  <button className="aa-secondary-button" type="button" onClick={() => setSelected(null)}>
                    Close
                  </button>
                  <button className="aa-secondary-button" type="button" onClick={() => window.open(`/paths/${selected.id}`, "_blank")}>
                    Preview Path
                  </button>
                  <button className="aa-primary-button" type="button" onClick={() => void savePath()} disabled={saving}>
                    Save Changes
                  </button>
                  <MoreMenu>
                    <button type="button" onClick={() => void savePath({ published: !selected.published })}>
                      {selected.published ? "Move to draft" : "Publish path"}
                    </button>
                    <button type="button" className="danger" onClick={() => void deletePath(selected.id)}>
                      Delete path
                    </button>
                  </MoreMenu>
                </div>
              </header>

              <nav className="aa-tabs" aria-label="Learning path sections">
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
                        <h3>Path Overview</h3>
                        <p>Set the promise, audience and public metadata.</p>
                      </div>
                    </div>
                    <div className="aa-form-grid">
                      <label className="aa-field">
                        <span>Path title</span>
                        <input value={selected.title} onChange={(event) => patch("title", event.target.value)} />
                      </label>
                      <label className="aa-field">
                        <span>
                          Slug
                          {!slugLocked && <small style={{ marginLeft: 6, opacity: 0.45, fontWeight: 400 }}>auto</small>}
                        </span>
                        <input
                          value={selected.slug}
                          onChange={(event) => patchSlug(event.target.value)}
                          placeholder="e.g. rhino-beginner-path"
                        />
                      </label>
                      <label className="aa-field">
                        <span>Level</span>
                        <select value={selected.level} onChange={(event) => patch("level", event.target.value)}>
                          {LEVELS.map((level) => (
                            <option key={level} value={level}>{LEVEL_LABELS[level]}</option>
                          ))}
                        </select>
                      </label>
                      <label className="aa-field">
                        <span>Audience</span>
                        <input
                          value={selected.audience}
                          onChange={(event) => patch("audience", event.target.value)}
                          placeholder="Architecture students, graduates, early-career designers"
                        />
                      </label>
                      <label className="aa-field aa-field-wide">
                        <span>Short description</span>
                        <textarea
                          rows={4}
                          value={selected.description}
                          onChange={(event) => patch("description", event.target.value)}
                          placeholder="What this path helps learners become confident doing."
                        />
                      </label>
                      <ImageUploadField
                        accessToken={accessToken}
                        label="Path thumbnail"
                        folder="paths"
                        value={selected.image}
                        onChange={(value) => patch("image", value)}
                      />
                      <label className="aa-field">
                        <span>Sort order</span>
                        <input type="number" value={selected.sort_order} onChange={(event) => patch("sort_order", Number(event.target.value))} />
                      </label>
                    </div>
                    <div className="aa-field-label">Software covered</div>
                    <SoftwarePicker value={selected.software} onChange={(value) => patch("software", value)} />
                  </section>

                  <aside className="aa-side-stack">
                    <section className="aa-panel">
                      <h3>Path Health</h3>
                      <ContentHealthSummary items={selectedHealth} />
                      <HealthChecklist items={selectedHealth} />
                    </section>
                  </aside>
                </div>
              )}

              {activeTab === "courses" && (
                <section className="aa-panel">
                  <div className="aa-panel-heading">
                    <div>
                      <h3>Course Journey</h3>
                      <p>Order existing courses into the path learners will follow.</p>
                    </div>
                    <span>{assignedCourses.length} assigned</span>
                  </div>

                  {assignedCourses.length ? (
                    <div className="aa-sequence-list">
                      {assignedCourses.map((course, index) => (
                        <div key={course.id} className="aa-sequence-row">
                          <span className="aa-sequence-number">{index + 1}</span>
                          <div>
                            <strong>{course.title}</strong>
                            <p>{course.software} | {course.moduleCount} modules | {course.lessonCount} lessons</p>
                          </div>
                          <div className="aa-row-actions">
                            <button type="button" disabled={index === 0} onClick={() => moveCourse(course.id, -1)}>Up</button>
                            <button type="button" disabled={index === assignedCourses.length - 1} onClick={() => moveCourse(course.id, 1)}>Down</button>
                            <button type="button" onClick={() => toggleCourse(course.id)}>Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No courses in this path"
                      description="A path needs ordered courses so learners understand what to take first and what comes next."
                    />
                  )}

                  <div className="aa-panel-subsection">
                    <div className="aa-panel-heading">
                      <div>
                        <h3>Add Existing Courses</h3>
                        <p>Reuse courses from the catalogue without duplicating content.</p>
                      </div>
                    </div>
                    <input
                      className="aa-search-input"
                      value={courseQuery}
                      onChange={(event) => setCourseQuery(event.target.value)}
                      placeholder="Search courses..."
                    />
                    <div className="aa-picker-list">
                      {availableCourses.slice(0, 80).map((course) => {
                        const assigned = selected.course_ids.includes(course.id);
                        return (
                          <button
                            key={course.id}
                            type="button"
                            className={`aa-picker-row${assigned ? " active" : ""}`}
                            onClick={() => toggleCourse(course.id)}
                          >
                            <div>
                              <strong>{course.title}</strong>
                              <p>{course.software} | {course.lessonCount} lessons</p>
                            </div>
                            <span>{assigned ? "Added" : "Add"}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}

              {activeTab === "outcomes" && (
                <section className="aa-panel">
                  <div className="aa-panel-heading">
                    <div>
                      <h3>Learner Outcomes</h3>
                      <p>Clarify what a learner can do after completing this journey.</p>
                    </div>
                  </div>
                  <label className="aa-field">
                    <span>Main outcome</span>
                    <textarea
                      rows={7}
                      value={selected.outcome}
                      onChange={(event) => patch("outcome", event.target.value)}
                      placeholder="By the end of this path, learners can..."
                    />
                  </label>
                  <div className="aa-callout">
                    <strong>Useful outcome structure</strong>
                    <p>Use one clear capability, the software context, and the kind of project or workflow the learner can complete.</p>
                  </div>
                </section>
              )}

              {activeTab === "resources" && (
                <section className="aa-panel">
                  <EmptyState
                    title="Reusable path resources"
                    description="Path-level resources can include starter files, templates, reading lists or project briefs. This database model does not store them yet, so course and lesson resources remain the source of truth."
                  />
                </section>
              )}

              {activeTab === "publish" && (
                <div className="aa-editor-grid">
                  <section className="aa-panel">
                    <div className="aa-panel-heading">
                      <div>
                        <h3>Publish Path</h3>
                        <p>Review missing content before learners see this journey.</p>
                      </div>
                    </div>
                    <ContentHealthSummary items={selectedHealth} />
                    <HealthChecklist items={selectedHealth} />
                    <div className="aa-publish-actions">
                      <button
                        className="aa-primary-button"
                        type="button"
                        onClick={() => void savePath({ published: true })}
                        disabled={saving}
                      >
                        Publish Path
                      </button>
                      <button
                        className="aa-secondary-button"
                        type="button"
                        onClick={() => void savePath({ published: false })}
                        disabled={saving}
                      >
                        Move to Draft
                      </button>
                    </div>
                  </section>
                  <aside className="aa-panel">
                    <h3>Public Preview</h3>
                    <p>{selected.description || "Add a description to explain the path."}</p>
                    <div className="aa-meta-grid">
                      <span>{LEVEL_LABELS[selected.level]}</span>
                      <span>{assignedCourses.length} courses</span>
                      <span>{totalLessons} lessons</span>
                      <span>{selected.software.join(", ") || "No software"}</span>
                    </div>
                  </aside>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title="Select or create a learning path"
              description="Learning paths help learners understand the order of courses and the outcome they are working toward."
              action={<button className="aa-primary-button" type="button" onClick={() => setNewTitle("Rhino Beginner Path")}>Start a path</button>}
            />
          )}
            </main>
          </aside>
        </div>
      )}
    </div>
  );
}
