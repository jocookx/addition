"use client";

/* eslint-disable @typescript-eslint/no-unused-vars --
   Placeholder remains available for the next workshop content panels while the
   live-delivery and recording forms are being finished. */

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { fetchJson } from "@/lib/api/fetch-json";
import type { WorkshopListItem } from "@/domain/workshop";
import { ImageUploadField } from "./image-upload-field";
import { AdminDataTable, CsvBulkActions, EmptyState, HealthChecklist, MoreMenu, PageHeader, StatusBadge, healthScore, type HealthItem, type SavedView, type TableColumn } from "./studio-ui";

type AdminWorkshop = WorkshopListItem & {
  description: string;
  learn: string[];
  included: string[];
  principles?: string[];
  tutorId?: string | null;
  tutorBio?: string | null;
  tutorImage?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  liveProvider?: "zoom" | "youtube" | "vimeo" | "custom" | "other";
  joinUrl?: string;
  hostUrl?: string;
  meetingId?: string;
  passcode?: string;
  liveEmbedUrl?: string;
  calendarUrl?: string;
  preWork?: string[];
  resources?: string[];
  recordingStatus?: "none" | "processing" | "available" | "failed";
  recordingUrl?: string;
  recordingEmbedUrl?: string;
  recordingDuration?: string;
  recordingThumbnail?: string;
  recordingAccessLevel?: "booked_users" | "pro" | "student" | "purchased" | "free";
  _dirty?: boolean;
};

type AdminWorkshopRow = Partial<AdminWorkshop> & {
  price_pence?: number | null;
  stripe_payment_link?: string | null;
  tutor_id?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  live_provider?: "zoom" | "youtube" | "vimeo" | "custom" | "other";
  join_url?: string | null;
  host_url?: string | null;
  meeting_id?: string | null;
  passcode?: string | null;
  live_embed_url?: string | null;
  calendar_url?: string | null;
  pre_work?: string[] | null;
  resources?: string[] | null;
  recording_status?: "none" | "processing" | "available" | "failed";
  recording_url?: string | null;
  recording_embed_url?: string | null;
  recording_duration?: string | null;
  recording_thumbnail?: string | null;
  recording_access_level?: "booked_users" | "pro" | "student" | "purchased" | "free";
  addition_tutors?: { id?: string | null; name?: string | null; bio?: string | null; image?: string | null } | null;
};

type InstructorOption = {
  id: string;
  name: string;
  title?: string;
  studio?: string;
  bio?: string;
  image?: string;
};

type WorkshopTab = "overview" | "schedule" | "content" | "booking" | "resources" | "recording" | "publish";
type WorkshopView = "all" | "upcoming" | "draft" | "complete" | "cancelled" | "attention";

const TABS: { id: WorkshopTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "schedule", label: "Schedule" },
  { id: "content", label: "Content" },
  { id: "booking", label: "Booking" },
  { id: "resources", label: "Resources" },
  { id: "recording", label: "Recording" },
  { id: "publish", label: "Publish" },
];
const WORKSHOP_VIEWS: SavedView[] = [
  { id: "all", label: "All Workshops" },
  { id: "upcoming", label: "Upcoming" },
  { id: "draft", label: "Draft" },
  { id: "complete", label: "Complete" },
  { id: "cancelled", label: "Cancelled" },
  { id: "attention", label: "Needs Attention" },
];

function daysUntil(dateStr: string): number {
  return Math.ceil((Date.parse(dateStr) - Date.now()) / 86_400_000);
}

function blankWorkshop(title: string): AdminWorkshop {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `new-${Date.now()}`,
    title,
    date: today,
    time: "09:00",
    timezone: "Europe/London",
    duration: "3 hours",
    format: "online",
    location: "",
    price: "GBP 85",
    pricePence: 8500,
    capacity: 12,
    upcoming: false,
    track: "",
    level: "",
    week: 1,
    software: [],
    image: "",
    description: "",
    learn: [],
    included: [],
    stripePaymentLink: null,
    tutorName: null,
    liveProvider: "zoom",
    joinUrl: "",
    hostUrl: "",
    meetingId: "",
    passcode: "",
    liveEmbedUrl: "",
    calendarUrl: "",
    preWork: [],
    resources: [],
    recordingStatus: "none",
    recordingUrl: "",
    recordingEmbedUrl: "",
    recordingDuration: "",
    recordingThumbnail: "",
    recordingAccessLevel: "booked_users",
    _dirty: true,
  };
}

function buildBody(ws: AdminWorkshop) {
  return {
    title: ws.title,
    date: ws.date,
    time: ws.time,
    timezone: ws.timezone,
    duration: ws.duration,
    format: ws.format,
    location: ws.location,
    price: ws.price,
    price_pence: ws.pricePence,
    capacity: ws.capacity,
    upcoming: ws.upcoming,
    track: ws.track,
    level: ws.level,
    week: ws.week,
    software: ws.software,
    image: ws.image,
    description: ws.description,
    learn: ws.learn,
    included: ws.included,
    principles: ws.principles ?? [],
    stripe_payment_link: ws.stripePaymentLink,
    tutor_id: ws.tutorId ?? null,
    start_time: ws.startTime ?? null,
    end_time: ws.endTime ?? null,
    live_provider: ws.liveProvider ?? "zoom",
    join_url: ws.joinUrl ?? "",
    host_url: ws.hostUrl ?? "",
    meeting_id: ws.meetingId ?? "",
    passcode: ws.passcode ?? "",
    live_embed_url: ws.liveEmbedUrl ?? "",
    calendar_url: ws.calendarUrl ?? "",
    pre_work: ws.preWork ?? [],
    resources: ws.resources ?? [],
    recording_status: ws.recordingStatus ?? "none",
    recording_url: ws.recordingUrl ?? "",
    recording_embed_url: ws.recordingEmbedUrl ?? "",
    recording_duration: ws.recordingDuration ?? "",
    recording_thumbnail: ws.recordingThumbnail ?? "",
    recording_access_level: ws.recordingAccessLevel ?? "booked_users",
  };
}

function normalizeWorkshop(row: AdminWorkshopRow): AdminWorkshop {
  const tutor = row.addition_tutors ?? null;
  return {
    id: row.id ?? `new-${Date.now()}`,
    title: row.title ?? "",
    date: row.date ?? "",
    time: row.time ?? "09:00",
    timezone: row.timezone ?? "Europe/London",
    duration: row.duration ?? "",
    format: row.format === "in-person" ? "in-person" : "online",
    location: row.location ?? "",
    price: row.price ?? "GBP 0",
    pricePence: Number(row.pricePence ?? row.price_pence ?? 0),
    capacity: Number(row.capacity ?? 0),
    upcoming: Boolean(row.upcoming),
    track: row.track ?? "",
    level: row.level ?? "",
    week: Number(row.week ?? 0),
    software: Array.isArray(row.software) ? row.software : [],
    image: row.image ?? "",
    description: row.description ?? "",
    learn: Array.isArray(row.learn) ? row.learn : [],
    included: Array.isArray(row.included) ? row.included : [],
    principles: Array.isArray(row.principles) ? row.principles : [],
    stripePaymentLink: row.stripePaymentLink ?? row.stripe_payment_link ?? null,
    tutorId: row.tutorId ?? row.tutor_id ?? tutor?.id ?? null,
    tutorName: row.tutorName ?? tutor?.name ?? null,
    tutorBio: row.tutorBio ?? tutor?.bio ?? null,
    tutorImage: row.tutorImage ?? tutor?.image ?? null,
    startTime: row.startTime ?? row.start_time ?? null,
    endTime: row.endTime ?? row.end_time ?? null,
    liveProvider: row.liveProvider ?? row.live_provider ?? "zoom",
    joinUrl: row.joinUrl ?? row.join_url ?? "",
    hostUrl: row.hostUrl ?? row.host_url ?? "",
    meetingId: row.meetingId ?? row.meeting_id ?? "",
    passcode: row.passcode ?? row.passcode ?? "",
    liveEmbedUrl: row.liveEmbedUrl ?? row.live_embed_url ?? "",
    calendarUrl: row.calendarUrl ?? row.calendar_url ?? "",
    preWork: Array.isArray(row.preWork) ? row.preWork : Array.isArray(row.pre_work) ? row.pre_work : [],
    resources: Array.isArray(row.resources) ? row.resources : [],
    recordingStatus: row.recordingStatus ?? row.recording_status ?? "none",
    recordingUrl: row.recordingUrl ?? row.recording_url ?? "",
    recordingEmbedUrl: row.recordingEmbedUrl ?? row.recording_embed_url ?? "",
    recordingDuration: row.recordingDuration ?? row.recording_duration ?? "",
    recordingThumbnail: row.recordingThumbnail ?? row.recording_thumbnail ?? "",
    recordingAccessLevel: row.recordingAccessLevel ?? row.recording_access_level ?? "booked_users",
    _dirty: Boolean(row._dirty),
  };
}

function workshopHealth(ws: AdminWorkshop): HealthItem[] {
  return [
    { label: "Title", ok: Boolean(ws.title.trim()), severity: "required" },
    { label: "Description", ok: Boolean(ws.description.trim()), severity: "required" },
    { label: "Date and time", ok: Boolean(ws.date && ws.time), severity: "required" },
    { label: "Duration", ok: Boolean(ws.duration.trim()), severity: "required" },
    { label: "Capacity", ok: ws.capacity > 0, severity: "required" },
    { label: "Price", ok: Boolean(ws.price.trim()) && ws.pricePence >= 0, severity: "required" },
    { label: "Stripe readiness", ok: ws.pricePence === 0 || Boolean(ws.stripePaymentLink?.trim()), severity: "recommended" },
    { label: "Learning outcomes", ok: ws.learn.length > 0, severity: "recommended" },
    { label: "Included items", ok: ws.included.length > 0, severity: "recommended" },
    { label: "Hero image", ok: Boolean(ws.image.trim()), severity: "recommended" },
    { label: "Instructor", ok: Boolean(ws.tutorName?.trim()), severity: "recommended" },
    { label: "Live join link", ok: !ws.upcoming || Boolean(ws.joinUrl?.trim() || ws.location.trim()), severity: "recommended" },
    { label: "Recording access", ok: ws.recordingStatus !== "available" || Boolean(ws.recordingUrl?.trim()), severity: "recommended" },
  ];
}

function ListEditor({ label, items, onChange }: { label: string; items: string[]; onChange: (items: string[]) => void }) {
  const [value, setValue] = useState("");
  function add() {
    const item = value.trim();
    if (item) onChange([...items, item]);
    setValue("");
  }
  return (
    <div className="aa-list-editor">
      <span className="aa-field-label">{label}</span>
      <div className="aa-chip-list">
        {items.map((item) => (
          <span key={item} className="st-tag-chip">{item}<button type="button" onClick={() => onChange(items.filter((current) => current !== item))}>x</button></span>
        ))}
      </div>
      <div className="st-tag-input-row">
        <input value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }} placeholder={`Add ${label.toLowerCase()}...`} />
        <button type="button" className="st-create-btn" onClick={add}>Add</button>
      </div>
    </div>
  );
}

function WorkshopReadinessPanel({
  workshop,
  onOpenTab,
}: {
  workshop: AdminWorkshop;
  onOpenTab: (tab: WorkshopTab) => void;
}) {
  const deliveryReady = Boolean(workshop.joinUrl?.trim() || workshop.location.trim());
  const bookingReady = workshop.capacity > 0 && Boolean(workshop.price.trim()) && (workshop.pricePence === 0 || Boolean(workshop.stripePaymentLink?.trim()));
  const recordingReady = workshop.recordingStatus === "available" && Boolean(workshop.recordingUrl?.trim());
  const items: Array<{ tab: WorkshopTab; title: string; detail: string; ok: boolean }> = [
    { tab: "overview", title: "Promise", detail: workshop.description.trim() ? "Description set" : "Needs description", ok: Boolean(workshop.title.trim() && workshop.description.trim()) },
    { tab: "schedule", title: "Delivery", detail: deliveryReady ? "Join details ready" : "Add join/location", ok: deliveryReady },
    { tab: "booking", title: "Booking", detail: bookingReady ? "Checkout ready" : "Check capacity/payment", ok: bookingReady },
    { tab: "recording", title: "Replay", detail: recordingReady ? "Recording available" : workshop.recordingStatus ?? "None", ok: recordingReady },
  ];
  return (
    <div className="aa-editor-journey aa-workshop-readiness" aria-label="Workshop readiness">
      {items.map((item) => (
        <button key={item.tab} type="button" className={item.ok ? "complete" : ""} onClick={() => onOpenTab(item.tab)}>
          <span>{item.title}</span>
          <small>{item.detail}</small>
        </button>
      ))}
    </div>
  );
}

export function WorkshopsTab({ accessToken }: { accessToken: string }) {
  const [workshops, setWorkshops] = useState<AdminWorkshop[]>([]);
  const [selected, setSelected] = useState<AdminWorkshop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPast, setShowPast] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [activeTab, setActiveTab] = useState<WorkshopTab>("overview");
  const [activeView, setActiveView] = useState<WorkshopView>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  }), [accessToken]);

  useEffect(() => {
    fetchJson<{ workshops: AdminWorkshopRow[] }>("/api/v1/admin/workshops", { headers })
      .then(({ workshops: data }) => {
        const normalized = data.map((item) => ({ ...normalizeWorkshop(item), _dirty: false }));
        setWorkshops(normalized);
        setSelected(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Workshops failed to load.");
        setLoading(false);
      });
  }, [headers]);

  useEffect(() => {
    fetchJson<{ instructors: InstructorOption[] }>("/api/v1/admin/instructors", { headers })
      .then((data) => setInstructors(data.instructors))
      .catch(() => setInstructors([]));
  }, [headers]);

  function flash(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(""), 2500);
  }

  function patch(field: keyof AdminWorkshop, value: unknown) {
    if (!selected) return;
    const updated = { ...selected, [field]: value, _dirty: true };
    setSelected(updated);
    setWorkshops((prev) => prev.map((item) => item.id === updated.id ? updated : item));
  }

  function assignInstructor(tutorId: string) {
    if (!selected) return;
    const tutor = instructors.find((item) => item.id === tutorId) ?? null;
    const updated = {
      ...selected,
      tutorId: tutor?.id ?? null,
      tutorName: tutor?.name ?? null,
      tutorBio: tutor?.bio ?? null,
      tutorImage: tutor?.image ?? null,
      _dirty: true,
    };
    setSelected(updated);
    setWorkshops((prev) => prev.map((item) => item.id === updated.id ? updated : item));
  }

  async function createWorkshop() {
    const title = newTitle.trim() || "Untitled Workshop";
    setCreating(true);
    try {
      const created = await fetchJson<AdminWorkshopRow>("/api/v1/admin/workshops", {
        method: "POST",
        headers,
        body: JSON.stringify(buildBody(blankWorkshop(title))),
      });
      const normalized = { ...normalizeWorkshop(created), _dirty: false };
      setWorkshops((prev) => [normalized, ...prev]);
      setSelected(normalized);
      setNewTitle("");
      setActiveTab("overview");
      flash("Workshop created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed.");
    } finally {
      setCreating(false);
    }
  }

  async function saveWorkshop(ws: AdminWorkshop) {
    setSaving(true);
    try {
      const updated = await fetchJson<AdminWorkshopRow>(`/api/v1/admin/workshops/${ws.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(buildBody(ws)),
      });
      const normalized = { ...normalizeWorkshop(updated), _dirty: false };
      setWorkshops((prev) => prev.map((item) => item.id === normalized.id ? normalized : item));
      setSelected(normalized);
      flash("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteWorkshop(ws: AdminWorkshop) {
    if (!window.confirm("Delete this workshop?")) return;
    try {
      await fetchJson(`/api/v1/admin/workshops/${ws.id}`, { method: "DELETE", headers });
      setWorkshops((prev) => prev.filter((item) => item.id !== ws.id));
      setSelected(null);
      flash("Deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  const visible = workshops.filter((item) => {
    const days = daysUntil(item.date);
    if (!showPast && days < -1) return false;
    if (activeView === "upcoming" && !item.upcoming) return false;
    if (activeView === "draft" && item.upcoming) return false;
    if (activeView === "complete" && days >= 0) return false;
    if (activeView === "attention" && workshopHealth(item).every((health) => health.ok)) return false;
    return true;
  });
  const pastCount = workshops.filter((item) => daysUntil(item.date) < -1).length;
  const upcomingCount = workshops.filter((item) => item.upcoming && daysUntil(item.date) >= -1).length;
  const draftCount = workshops.filter((item) => !item.upcoming && daysUntil(item.date) >= -1).length;
  const attentionCount = workshops.filter((item) => workshopHealth(item).some((health) => !health.ok)).length;
  const recordingReadyCount = workshops.filter((item) => item.recordingStatus === "available").length;
  const workshopColumns: TableColumn<AdminWorkshop>[] = [
    {
      id: "title",
      label: "Workshop Title",
      sortValue: (ws) => ws.title,
      render: (ws) => (
        <span className="aa-table-title aa-table-title-media">
          <span className="aa-table-thumb" aria-hidden="true">
            {ws.image ? <Image src={ws.image} alt="" width={40} height={40} unoptimized /> : <span>{(ws.title || "W").slice(0, 1).toUpperCase()}</span>}
          </span>
          <span className="aa-table-title-copy">
            <strong title={ws.title || "Untitled workshop"}>{ws.title || "Untitled workshop"}</strong>
            <span>{ws.track || ws.description || "Missing description"}</span>
          </span>
        </span>
      ),
    },
    { id: "date", label: "Date", sortValue: (ws) => ws.date, render: (ws) => `${ws.date} ${ws.time}` },
    { id: "software", label: "Software", sortValue: (ws) => ws.software.join(", "), render: (ws) => ws.software.join(", ") || <span className="aa-table-muted">None</span> },
    { id: "level", label: "Level", sortValue: (ws) => ws.level, render: (ws) => ws.level || <span className="aa-table-muted">Missing</span> },
    { id: "capacity", label: "Capacity", sortValue: (ws) => ws.capacity, render: (ws) => ws.capacity },
    { id: "bookings", label: "Bookings", render: () => <span className="aa-table-muted">Stripe</span> },
    { id: "status", label: "Status", sortValue: (ws) => ws.upcoming ? "Published" : "Draft", render: (ws) => <StatusBadge status={ws.upcoming ? "Published" : daysUntil(ws.date) < 0 ? "Archived" : "Draft"} /> },
    { id: "course", label: "Linked Course", render: (ws) => ws.track || <span className="aa-table-muted">Unlinked</span> },
    { id: "price", label: "Price / Access", sortValue: (ws) => ws.pricePence, render: (ws) => ws.price || <span className="aa-table-muted">Missing</span> },
    { id: "health", label: "Health", sortValue: (ws) => healthScore(workshopHealth(ws)), render: (ws) => {
      const score = healthScore(workshopHealth(ws));
      const missing = workshopHealth(ws).filter((item) => !item.ok);
      return <span className={`aa-health-pill${score >= 85 ? " good" : score >= 55 ? " warn" : " bad"}`}>{score}% / {missing[0]?.label ?? "Ready"}</span>;
    } },
    { id: "updated", label: "Updated", render: () => <span className="aa-table-muted">Not tracked</span>, defaultVisible: false },
    { id: "actions", label: "Actions", render: (ws) => <span onClick={(event) => event.stopPropagation()}><MoreMenu><button type="button" onClick={() => setSelected(ws)}>Edit</button><button type="button" onClick={() => void saveWorkshop({ ...ws, upcoming: false })}>Archive</button><button type="button" className="danger" onClick={() => void deleteWorkshop(ws)}>Delete</button></MoreMenu></span> },
  ];

  if (loading) return <div className="st-loading">Loading workshops...</div>;

  return (
    <div className="aa-library-page">
      <PageHeader
        eyebrow="Create"
        title="Live Workshops"
        description="Plan, publish and manage live learning sessions with clear booking readiness."
        action={<button type="button" className="aa-primary-button" disabled={creating} onClick={() => void createWorkshop()}>Manual Workshop</button>}
      >
        <label className="st-toggle-label"><input type="checkbox" checked={showPast} onChange={(event) => setShowPast(event.target.checked)} />Show {pastCount} past</label>
      </PageHeader>

      <section className="aa-curriculum-import-panel">
        <div>
          <span className="aa-eyebrow">CSV-first workshop schedule</span>
          <h2>Import workshops with booking, live and recording details</h2>
          <p>Use one sheet for schedule, capacity, Stripe links, Zoom/live links, pre-work, resources and recording access. Manual editing stays available for final delivery checks.</p>
        </div>
        <div className="aa-curriculum-import-actions">
          <CsvBulkActions entity="workshops" accessToken={accessToken} templateLabel="Download Workshops CSV" importLabel="Import Workshops CSV" />
        </div>
      </section>

      {notice && <div className="st-notice st-notice--ok">{notice}</div>}
      {error && <div className="st-notice st-notice--err">{error} <button type="button" onClick={() => setError("")}>x</button></div>}

      <div className="aa-course-summary-strip aa-workshop-summary-strip">
        <span>{workshops.length} workshops</span>
        <span>{upcomingCount} upcoming</span>
        <span>{draftCount} drafts</span>
        <span>{attentionCount} need attention</span>
        <span>{recordingReadyCount} recordings ready</span>
      </div>

      <AdminDataTable
        rows={visible}
        columns={workshopColumns}
        savedViews={WORKSHOP_VIEWS}
        activeView={activeView}
        onViewChange={(view) => setActiveView(view as WorkshopView)}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        onRowClick={(workshop) => setSelected(workshop)}
        getRowLabel={(workshop) => workshop.title || "Untitled workshop"}
        bulkActions={(
          <>
            <button type="button" onClick={() => selectedIds.forEach((id) => {
              const workshop = workshops.find((item) => item.id === id);
              if (workshop) void saveWorkshop({ ...workshop, upcoming: true });
            })}>Publish</button>
            <button type="button" onClick={() => selectedIds.forEach((id) => {
              const workshop = workshops.find((item) => item.id === id);
              if (workshop) void saveWorkshop({ ...workshop, upcoming: false });
            })}>Draft</button>
          </>
        )}
        empty={(
          <EmptyState
            title="No workshops match this view"
            description="Workshops are live learning sessions. Create one with a date, capacity, Stripe link and clear learning outcomes."
            action={<button type="button" className="aa-primary-button" onClick={() => void createWorkshop()}>+ Add Workshop</button>}
          />
        )}
      />

      {selected && (
        <div className="aa-drawer-backdrop" role="presentation">
          <aside className="aa-editor-drawer" aria-label="Workshop editor">
            <main className="aa-detail-panel">
          {selected ? (
            <>
              <header className="aa-course-header">
                <div>
                  <span className="aa-breadcrumb">Live Workshops / {selected.format}</span>
                  <h2>{selected.title || "Untitled workshop"}</h2>
                  <div className="aa-meta-line">
                    <StatusBadge status={selected.upcoming ? "Published" : "Draft"} />
                    <span>{selected.date}</span>
                    <span>{selected.time}</span>
                    <span>{selected.capacity} seats</span>
                  </div>
                </div>
                <div className="aa-course-actions">
                  <button type="button" className="aa-secondary-button" onClick={() => setSelected(null)}>Close</button>
                  <button type="button" className="st-save-btn" disabled={saving} onClick={() => void saveWorkshop(selected)}>{saving ? "Saving..." : "Save"}</button>
                  <button type="button" className="st-publish-btn" onClick={() => void saveWorkshop({ ...selected, upcoming: true })}>Publish</button>
                  <MoreMenu><button type="button" className="danger" onClick={() => void deleteWorkshop(selected)}>Delete workshop</button></MoreMenu>
                </div>
              </header>

              <div className="aa-tabs">
                {TABS.map((tab) => <button key={tab.id} type="button" className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
              </div>

              <WorkshopReadinessPanel workshop={selected} onOpenTab={setActiveTab} />

              <div className="aa-editor-body">
                {activeTab === "overview" && (
                  <section className="aa-panel aa-narrow-panel">
                    <div className="aa-panel-head"><h3>Workshop Overview</h3><p>The public promise and positioning for this live session.</p></div>
                    <div className="aa-form-grid">
                      <label><span>Title</span><input value={selected.title} onChange={(event) => patch("title", event.target.value)} /></label>
                      <label><span>Level</span><input value={selected.level} onChange={(event) => patch("level", event.target.value)} /></label>
                      <label><span>Track</span><input value={selected.track} onChange={(event) => patch("track", event.target.value)} /></label>
                      <label><span>Format</span><select value={selected.format} onChange={(event) => patch("format", event.target.value)}><option value="online">Online</option><option value="in-person">In-person</option></select></label>
                      <label className="span-2"><span>Instructor</span><select value={selected.tutorId ?? ""} onChange={(event) => assignInstructor(event.target.value)}><option value="">No instructor</option>{instructors.map((instructor) => <option key={instructor.id} value={instructor.id}>{instructor.name}{instructor.title ? ` - ${instructor.title}` : ""}</option>)}</select></label>
                      <label className="span-2"><span>Description</span><textarea rows={5} value={selected.description} onChange={(event) => patch("description", event.target.value)} /></label>
                      <div className="span-2"><ImageUploadField accessToken={accessToken} label="Hero image" folder="workshops" value={selected.image} onChange={(value) => patch("image", value)} /></div>
                    </div>
                  </section>
                )}
                {activeTab === "schedule" && (
                  <section className="aa-panel aa-narrow-panel">
                    <div className="aa-panel-head"><h3>Schedule</h3><p>Date, time and logistics.</p></div>
                    <div className="aa-form-grid">
                      <label><span>Date</span><input type="date" value={selected.date} onChange={(event) => patch("date", event.target.value)} /></label>
                      <label><span>Time</span><input type="time" value={selected.time} onChange={(event) => patch("time", event.target.value)} /></label>
                      <label><span>Timezone</span><input value={selected.timezone} onChange={(event) => patch("timezone", event.target.value)} /></label>
                      <label><span>Duration</span><input value={selected.duration} onChange={(event) => patch("duration", event.target.value)} /></label>
                      <label><span>Start time override</span><input type="datetime-local" value={selected.startTime?.slice(0, 16) ?? ""} onChange={(event) => patch("startTime", event.target.value ? new Date(event.target.value).toISOString() : null)} /></label>
                      <label><span>End time override</span><input type="datetime-local" value={selected.endTime?.slice(0, 16) ?? ""} onChange={(event) => patch("endTime", event.target.value ? new Date(event.target.value).toISOString() : null)} /></label>
                      <label className="span-2"><span>Location / meeting link</span><input value={selected.location} onChange={(event) => patch("location", event.target.value)} /></label>
                      <label><span>Live provider</span><select value={selected.liveProvider ?? "zoom"} onChange={(event) => patch("liveProvider", event.target.value)}><option value="zoom">Zoom</option><option value="youtube">YouTube</option><option value="vimeo">Vimeo</option><option value="custom">Custom</option><option value="other">Other</option></select></label>
                      <label><span>Meeting ID</span><input value={selected.meetingId ?? ""} onChange={(event) => patch("meetingId", event.target.value)} /></label>
                      <label className="span-2"><span>Join URL</span><input value={selected.joinUrl ?? ""} onChange={(event) => patch("joinUrl", event.target.value)} /></label>
                      <label className="span-2"><span>Host URL</span><input value={selected.hostUrl ?? ""} onChange={(event) => patch("hostUrl", event.target.value)} /></label>
                      <label><span>Passcode</span><input value={selected.passcode ?? ""} onChange={(event) => patch("passcode", event.target.value)} /></label>
                      <label><span>Calendar URL</span><input value={selected.calendarUrl ?? ""} onChange={(event) => patch("calendarUrl", event.target.value)} /></label>
                    </div>
                  </section>
                )}
                {activeTab === "content" && (
                  <section className="aa-panel aa-narrow-panel">
                    <div className="aa-panel-head"><h3>Content</h3><p>Learning outcomes and what is included.</p></div>
                    <ListEditor label="Learning outcomes" items={selected.learn} onChange={(items) => patch("learn", items)} />
                    <ListEditor label="Included items" items={selected.included} onChange={(items) => patch("included", items)} />
                  </section>
                )}
                {activeTab === "booking" && (
                  <section className="aa-panel aa-narrow-panel">
                    <div className="aa-panel-head"><h3>Booking</h3><p>Capacity, price and Stripe checkout readiness.</p></div>
                    <div className="aa-form-grid">
                      <label><span>Capacity</span><input type="number" value={selected.capacity} onChange={(event) => patch("capacity", Number(event.target.value))} /></label>
                      <label><span>Price display</span><input value={selected.price} onChange={(event) => patch("price", event.target.value)} /></label>
                      <label><span>Price pence</span><input type="number" value={selected.pricePence} onChange={(event) => patch("pricePence", Number(event.target.value))} /></label>
                      <label><span>Visibility</span><select value={selected.upcoming ? "Published" : "Draft"} onChange={(event) => patch("upcoming", event.target.value === "Published")}><option>Draft</option><option>Published</option></select></label>
                      <label className="span-2"><span>Stripe Payment Link</span><input value={selected.stripePaymentLink ?? ""} onChange={(event) => patch("stripePaymentLink", event.target.value || null)} /></label>
                    </div>
                  </section>
                )}
                {activeTab === "resources" && (
                  <section className="aa-panel aa-narrow-panel">
                    <div className="aa-panel-head"><h3>Resources</h3><p>Attach pre-work and resource IDs shown to booked learners.</p></div>
                    <ListEditor label="Pre-work" items={selected.preWork ?? []} onChange={(items) => patch("preWork", items)} />
                    <ListEditor label="Resource IDs" items={selected.resources ?? []} onChange={(items) => patch("resources", items)} />
                  </section>
                )}
                {activeTab === "recording" && (
                  <section className="aa-panel aa-narrow-panel">
                    <div className="aa-panel-head"><h3>Recording</h3><p>Make the replay available after the live session.</p></div>
                    <div className="aa-form-grid">
                      <label><span>Status</span><select value={selected.recordingStatus ?? "none"} onChange={(event) => patch("recordingStatus", event.target.value)}><option value="none">None</option><option value="processing">Processing</option><option value="available">Available</option><option value="failed">Failed</option></select></label>
                      <label><span>Access</span><select value={selected.recordingAccessLevel ?? "booked_users"} onChange={(event) => patch("recordingAccessLevel", event.target.value)}><option value="booked_users">Booked users</option><option value="pro">Pro</option><option value="student">Student</option><option value="purchased">Purchased</option><option value="free">Free</option></select></label>
                      <label className="span-2"><span>Recording URL</span><input value={selected.recordingUrl ?? ""} onChange={(event) => patch("recordingUrl", event.target.value)} /></label>
                      <label className="span-2"><span>Embed URL</span><input value={selected.recordingEmbedUrl ?? ""} onChange={(event) => patch("recordingEmbedUrl", event.target.value)} /></label>
                      <label><span>Duration</span><input value={selected.recordingDuration ?? ""} onChange={(event) => patch("recordingDuration", event.target.value)} /></label>
                      <label><span>Thumbnail</span><input value={selected.recordingThumbnail ?? ""} onChange={(event) => patch("recordingThumbnail", event.target.value)} /></label>
                    </div>
                    <div className="aa-publish-actions">
                      <button type="button" className="st-publish-btn" onClick={() => void saveWorkshop({ ...selected, upcoming: false, recordingStatus: "available" })}>Mark completed with recording</button>
                      <button type="button" className="aa-secondary-button" onClick={() => void saveWorkshop({ ...selected, upcoming: false, recordingStatus: "processing" })}>Mark recording processing</button>
                    </div>
                  </section>
                )}
                {activeTab === "publish" && (
                  <section className="aa-panel aa-publish-panel">
                    <div className="aa-panel-head"><h3>Publish Readiness</h3><p>Make sure booking and content details are complete.</p></div>
                    <HealthChecklist items={workshopHealth(selected)} />
                    <div className="aa-publish-actions">
                      <button type="button" className="st-publish-btn" onClick={() => void saveWorkshop({ ...selected, upcoming: true })}>Publish workshop</button>
                    </div>
                  </section>
                )}
              </div>
            </>
          ) : (
            <EmptyState title="Select a workshop" description="Choose a live session or create a new workshop to start planning." />
          )}
            </main>
          </aside>
        </div>
      )}
    </div>
  );
}

function Placeholder({ title, text }: { title: string; text: string }) {
  return (
    <section className="aa-panel aa-narrow-panel">
      <div className="aa-panel-head"><h3>{title}</h3><p>{text}</p></div>
      <textarea rows={12} readOnly value={text} />
    </section>
  );
}
