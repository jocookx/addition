"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppFrame } from "@/components/legacy/AppFrame";
import type { WorkshopDetail, WorkshopListItem } from "@/domain/workshop";
import { formatWorkshopCountdown, getWorkshopLifecycle } from "@/domain/workshop-lifecycle";
import { getWorkshopDetail, getWorkshops } from "@/lib/api/workshops";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { addWorkshopToCart, workshopToCartItem } from "@/lib/workshop-cart";

// ── helpers ──────────────────────────────────────────────────────────────────

type Tab = "learn" | "recording" | "about" | "schedule" | "instructor";

function getCohortId(wsId: string) {
  return wsId.replace(/^ws-/, "").replace(/-w\d+[a-z]$/, "");
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}


// ── SVG icons ─────────────────────────────────────────────────────────────────

function IcoCalendar() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function IcoClock() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function IcoHourglass() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 22h14M5 2h14M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/>
    </svg>
  );
}
function IcoUsers() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function IcoBack() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  );
}
function IcoChevron() {
  return (
    <svg className="ws-det-breadcrumb-sep" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
function IcoLock() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}
// ── Page ─────────────────────────────────────────────────────────────────────

export default function CohortDetailPage() {
  const params = useParams<{ cohortId: string }>();
  const router = useRouter();
  const cohortId = params.cohortId;

  const [sessions, setSessions] = useState<WorkshopListItem[]>([]);
  const [selected, setSelected] = useState<WorkshopListItem | null>(null);
  const [detail, setDetail] = useState<WorkshopDetail | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("learn");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load cohort sessions (upcoming + past so the URL works for past workshops too)
  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setAccessToken(data.session?.access_token ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setAccessToken(session?.access_token ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let canceled = false;
    getWorkshops({ upcoming: false })
      .then((all) => {
        if (canceled) return;
        const cohort = all
          .filter((item) => getCohortId(item.id) === cohortId)
          .sort((a, b) => a.date.localeCompare(b.date));
        if (!cohort.length) { setError("Cohort not found."); setLoading(false); return; }
        setSessions(cohort);
        setSelected(cohort[0]);
        setLoading(false);
      })
      .catch((err) => { if (!canceled) { setError(err instanceof Error ? err.message : "Failed to load."); setLoading(false); } });
    return () => { canceled = true; };
  }, [cohortId]);

  // Load detail for selected session
  const selectedId = selected?.id;
  useEffect(() => {
    if (!selectedId) return;
    let canceled = false;
    getWorkshopDetail(selectedId, accessToken ?? undefined)
      .then((v) => { if (!canceled) setDetail(v); })
      .catch(() => {});
    return () => { canceled = true; setDetail(null); };
  }, [accessToken, selectedId]);

  const first = sessions[0] ?? null;

  // Merged data — prefer detail, fall back to session list item
  const learnItems = useMemo(() => detail?.learn ?? selected?.learn ?? [], [detail, selected]);

  const softwareItems = useMemo(() => {
    const all = detail?.software?.length ? detail.software : (selected?.software ?? []);
    return Array.from(new Set(sessions.flatMap(s => s.software).concat(all)));
  }, [detail, selected, sessions]);
  const principles = detail?.principles ?? [];
  const recordings = detail?.recordings ?? [];
  const description = detail?.description ?? "";

  const isPastWorkshop = !!selected && !selected.upcoming;
  const hasRecordings = isPastWorkshop && recordings.length > 0;
  const hasCohortSchedule = sessions.length > 1;
  const hasInstructor = !!(detail?.tutorBio ?? selected?.tutorName);
  const lifecycle = getWorkshopLifecycle({
    startTime: detail?.startTime ?? selected?.startTime,
    endTime: detail?.endTime ?? selected?.endTime,
    date: selected?.date,
    time: selected?.time,
    duration: selected?.duration,
    upcoming: selected?.upcoming,
    recordingStatus: detail?.recordingStatus ?? selected?.recordingStatus,
  });
  const countdown = formatWorkshopCountdown({
    startTime: detail?.startTime ?? selected?.startTime,
    endTime: detail?.endTime ?? selected?.endTime,
    date: selected?.date,
    time: selected?.time,
    duration: selected?.duration,
    upcoming: selected?.upcoming,
    recordingStatus: detail?.recordingStatus ?? selected?.recordingStatus,
  });
  const isBooked = detail?.bookingStatus === "registered" || detail?.bookingStatus === "confirmed" || detail?.bookingStatus === "completed";

  const baseTitle = first?.track || first?.title || "Workshop";
  const titleStr = `${baseTitle}${first?.level && first.level !== "Foundations" ? ` - ${first.level}` : ""}`;
  const selectedPrice = selected?.pricePence ? `£${selected.pricePence / 100}` : "Free";
  const detailSaving = selected?.pricePence ? `£${Math.round(selected.pricePence / 100 * 0.2)}` : "20%";
  const detailMemberPrice = selected?.pricePence ? `£${Math.round(selected.pricePence / 100 * 0.8)}` : null;


  function handleRegister() {
    if (!selected) return;
    router.push(`/workshops/${cohortId}/checkout`);
  }

  function handleAddToCart() {
    if (!selected) return;
    addWorkshopToCart(workshopToCartItem(selected));
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppFrame title="" subtitle="" topTabs={[]} hideTopbar>
        <div className="ws-det-loading">
          <div className="ws-loading-pulse" style={{ height: 260 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14, marginTop: 14 }}>
            <div className="ws-loading-pulse" style={{ height: 280 }} />
            <div className="ws-loading-pulse" style={{ height: 280 }} />
          </div>
        </div>
      </AppFrame>
    );
  }

  if (error) {
    return (
      <AppFrame title="" subtitle="" topTabs={[]} hideTopbar>
        <div className="ws-det-breadcrumb">
          <Link href="/workshops" className="ws-det-back"><IcoBack /> Workshops</Link>
        </div>
        <div className="ws-empty-state">
          <p className="meta">{error}</p>
          <Link href="/workshops" className="ghost-btn" style={{ display: "inline-block", marginTop: 12 }}>Browse workshops</Link>
        </div>
      </AppFrame>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AppFrame title="" subtitle="" topTabs={[]} hideTopbar>
      <div className="ws-detail">

        {/* ── Breadcrumb ── */}
        <div className="ws-det-breadcrumb">
          <Link href="/workshops" className="ws-det-back">
            <IcoBack /> Workshops
          </Link>
          <IcoChevron />
          <span className="ws-det-breadcrumb-cur">{titleStr}</span>
        </div>

        {/* ── 3-part grid ── */}
        <div className="ws-det-columns">

          {/* TOP-LEFT: hero image */}
          <div className="ws-det-img-fill">
            {first?.image
              ? <Image src={first.image} alt={titleStr} fill unoptimized style={{ objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", background: "#080b11" }} />}

            <div className="ws-det-img-gradient" />

            {/* Top badges */}
            <div className="ws-det-img-top-row">
              <div className="ws-det-img-badges">
                <span className={`ws-badge${first?.format === "in-person" ? " ws-badge-inperson" : " ws-badge-online"}`}>
                  {first?.format === "in-person" ? "In Person" : "Online"}
                </span>
                {first?.level && <span className="ws-badge ws-badge-level">{first.level}</span>}
                {first && !first.upcoming && <span className="ws-badge ws-badge-recorded">Recorded</span>}
                <span className="ws-badge ws-badge-level">{countdown}</span>
              </div>
            </div>

            {/* Footer: software pills + title */}
            <div className="ws-det-img-footer">
              {softwareItems.length > 0 && (
                <div className="ws-det-sw-pills">
                  {softwareItems.map((s) => <span key={s} className="ws-det-sw-pill">{s}</span>)}
                </div>
              )}
              <h1 className="ws-det-title">{titleStr}</h1>
            </div>
          </div>

          {/* BOTTOM-LEFT: tabs */}
          <div className="ws-det-tabs">
            <div className="ws-det-tab-bar">
              <div className="ws-det-tab-pills">
                <button type="button" className={`ws-det-tab-btn${tab === "learn" ? " ws-det-tab-btn--active" : ""}`} onClick={() => setTab("learn")}>
                  Learn
                </button>
                {isPastWorkshop && (
                  <button type="button" className={`ws-det-tab-btn${tab === "recording" ? " ws-det-tab-btn--active" : ""}`} onClick={() => setTab("recording")}>
                    Recording{recordings.length > 0 ? <span className="ws-det-tab-count">{recordings.length}</span> : null}
                  </button>
                )}
                <button type="button" className={`ws-det-tab-btn${tab === "about" ? " ws-det-tab-btn--active" : ""}`} onClick={() => setTab("about")}>
                  About
                </button>
                {hasCohortSchedule && (
                  <button type="button" className={`ws-det-tab-btn${tab === "schedule" ? " ws-det-tab-btn--active" : ""}`} onClick={() => setTab("schedule")}>
                    Schedule{sessions.length > 1 ? <span className="ws-det-tab-count">{sessions.length}</span> : null}
                  </button>
                )}

                {hasInstructor && (
                  <button type="button" className={`ws-det-tab-btn${tab === "instructor" ? " ws-det-tab-btn--active" : ""}`} onClick={() => setTab("instructor")}>
                    Instructor
                  </button>
                )}
              </div>
            </div>

            <div className="ws-det-tab-panel">

              {/* ── Learn ── */}
              {tab === "learn" && (
                <>
                  {detail?.preWork?.length ? (
                    <div className="ws-det-about-section" style={{ marginBottom: 16 }}>
                      <div className="ws-det-about-section-hd">Pre-work</div>
                      <div className="ws-det-principles-tags">{detail.preWork.map((item) => <span key={item} className="ws-det-principle-tag">{item}</span>)}</div>
                    </div>
                  ) : null}
                  {learnItems.length > 0 ? (
                    <ul className="ws-det-learn-grid">
                      {learnItems.map((item, i) => (
                        <li key={i} className="ws-det-learn-item">
                          <span className="ws-det-learn-num">{String(i + 1).padStart(2, "0")}</span>
                          <span className="ws-det-learn-text">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="ws-det-empty">Learning outcomes coming soon.</p>
                  )}
                </>
              )}

              {/* ── About ── */}
              {tab === "recording" && (
                hasRecordings ? (
                  <div className="ws-det-recording-list">
                    {(detail?.recordingUrl ? [{ id: "main", title: "Workshop recording", video: detail.recordingUrl }] : recordings).map((recording) => (
                      <a
                        key={recording.id}
                        className="ws-det-recording-card"
                        href={recording.video}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="ws-det-recording-play" aria-hidden="true">Play</span>
                        <span>
                          <strong>{recording.title || "Watch workshop recording"}</strong>
                          <small>Open recording</small>
                        </span>
                      </a>
                    ))}
                  </div>
                ) : detail?.recordingStatus === "available" ? (
                  <div className="ws-det-recording-empty">
                    <h2>Recording available</h2>
                    <p>This recording is locked for your current access. Upgrade or use the account that booked the workshop.</p>
                    <Link href="/auth?mode=signup&plan=pro&next=/workshops" className="primary-button" style={{ display: "inline-flex", marginTop: 12 }}>Upgrade</Link>
                  </div>
                ) : (
                  <div className="ws-det-recording-empty">
                    <h2>{lifecycle === "recording_processing" ? "Recording processing" : "Recording coming soon"}</h2>
                    <p>The replay link will appear once the recording has been processed.</p>
                  </div>
                )
              )}

              {tab === "about" && (
                <div className="ws-det-about-block">
                  {description ? (
                    <>
                      <h2 className="ws-det-about-heading">About this workshop</h2>
                      <div className="ws-det-about-pills">
                        {first?.level && <span className="ws-det-about-pill ws-det-about-pill--level">{first.level}</span>}
                        {first?.format && <span className="ws-det-about-pill ws-det-about-pill--format">{first.format === "online" ? "Online" : "In Person"}</span>}
                        {selected?.duration && <span className="ws-det-about-pill">{selected.duration}</span>}
                        {first?.location && first.format !== "online" && <span className="ws-det-about-pill">{first.location}</span>}
                      </div>
                      <p className="ws-det-about-desc">{description}</p>
                    </>
                  ) : (
                    <p className="ws-det-empty">No description yet.</p>
                  )}

                  {principles.length > 0 && (
                    <div className="ws-det-about-section">
                      <div className="ws-det-about-section-hd">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                        </svg>
                        Principles covered
                      </div>
                      <div className="ws-det-principles-tags">
                        {principles.map((p, i) => <span key={i} className="ws-det-principle-tag">{p}</span>)}
                      </div>
                    </div>
                  )}

                  {softwareItems.length > 0 && (
                    <div className="ws-det-about-section">
                      <div className="ws-det-about-section-hd">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                        </svg>
                        Software used
                      </div>
                      <div className="ws-det-principles-tags">
                        {softwareItems.map((s, i) => <span key={i} className="ws-det-principle-tag ws-det-software-tag">{s}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Schedule ── */}
              {tab === "schedule" && (
                <div className="ws-det-cohort-schedule">
                  {sessions.map((item, idx) => {
                    const isCurrent = item.id === selected?.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`ws-det-cohort-row${isCurrent ? " ws-det-cohort-row--current" : ""}`}
                        onClick={() => setSelected(item)}
                        aria-pressed={isCurrent}
                      >
                        <div className="ws-det-cohort-date">
                          <strong>W{idx + 1}</strong>
                          <span>{fmtShort(item.date)}</span>
                        </div>
                        <div className="ws-det-cohort-info">
                          <span className="ws-det-cohort-title">{item.title}</span>
                          <span className="ws-det-cohort-meta">{item.time} {item.timezone} · {item.duration} · £{item.pricePence / 100}</span>
                        </div>
                        <div className="ws-det-cohort-status">
                          <span className={`ws-det-cohort-badge${isCurrent ? " ws-det-cohort-badge--current" : " ws-det-cohort-badge--open"}`}>
                            {isCurrent ? "Viewing" : "Book"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── Instructor ── */}
              {tab === "instructor" && (
                <div className="ws-det-instructor-tab">
                  <div className="ws-det-instructor-tab-hd">
                    {detail?.tutorImage ? (
                      <Image
                        className="ws-det-instructor-card-img ws-det-instructor-card-img--lg"
                        src={detail.tutorImage}
                        alt={selected?.tutorName ?? "Instructor"}
                        width={72}
                        height={72}
                        unoptimized
                      />
                    ) : (
                      <div className="ws-det-instructor-card-img ws-det-instructor-card-img--placeholder ws-det-instructor-card-img--lg">
                        {(selected?.tutorName ?? "??").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <strong className="ws-det-instructor-name">{selected?.tutorName ?? "Jo Cook"}</strong>
                      <span className="ws-det-instructor-role">Instructor</span>
                    </div>
                  </div>
                  {detail?.tutorBio && (
                    <p className="ws-det-instructor-tab-bio">{detail.tutorBio}</p>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* RIGHT: booking card (spans both rows) */}
          <div className="ws-det-col-right">
            <div className="ws-det-pay-card glass-panel">

              {/* Price section */}
              <div className="ws-det-card-section ws-det-card-section--price">
                <div className="ws-det-card-section-label">{isPastWorkshop ? "Workshop archive" : "Book a place"}</div>
                <div className="ws-det-price-row">
                  <span className="ws-det-price">{isPastWorkshop ? "Watch back" : selectedPrice}</span>
                  <span className="ws-det-price-per">{isPastWorkshop ? "recorded session" : "per person"}</span>
                </div>
                <p className="meta" style={{ marginTop: 8 }}>{countdown}</p>
              </div>

              {/* Facts grid */}
              <div className="ws-det-card-section">
                <div className="ws-det-facts-grid">
                  {selected?.date && (
                    <div className="ws-det-fg-item">
                      <IcoCalendar />
                      <div>
                        <span className="ws-det-fg-label">Date</span>
                        <span className="ws-det-fg-val">{fmtShort(selected.date)}</span>
                      </div>
                    </div>
                  )}
                  {selected?.time && (
                    <div className="ws-det-fg-item">
                      <IcoClock />
                      <div>
                        <span className="ws-det-fg-label">Time</span>
                        <span className="ws-det-fg-val">{selected.time}{selected.timezone ? ` ${selected.timezone}` : ""}</span>
                      </div>
                    </div>
                  )}
                  {selected?.duration && (
                    <div className="ws-det-fg-item">
                      <IcoHourglass />
                      <div>
                        <span className="ws-det-fg-label">Duration</span>
                        <span className="ws-det-fg-val">{selected.duration}</span>
                      </div>
                    </div>
                  )}
                  {selected?.capacity ? (
                    <div className="ws-det-fg-item">
                      <IcoUsers />
                      <div>
                        <span className="ws-det-fg-label">Capacity</span>
                        <span className="ws-det-fg-val">{selected.capacity} seats</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* CTA section */}
              <div className="ws-det-card-section ws-det-card-section--cta">
                <div className="ws-det-cta">
                  {isBooked && (lifecycle === "starting_soon" || lifecycle === "live") && detail?.joinUrl ? (
                    <a className="primary-button ws-det-register-btn" href={detail.joinUrl} target="_blank" rel="noreferrer">
                      {lifecycle === "live" ? "Join live session" : "Join room"}
                    </a>
                  ) : detail?.recordingUrl ? (
                    <a className="primary-button ws-det-register-btn" href={detail.recordingUrl} target="_blank" rel="noreferrer">
                      Watch recording
                    </a>
                  ) : selected?.upcoming ? (
                    <>
                      <button
                        type="button"
                        className="primary-button ws-det-register-btn"
                        onClick={handleRegister}
                        disabled={!selected}
                      >
                        {`Reserve your place - ${selectedPrice}`}
                      </button>
                      <button
                        type="button"
                        className="ghost-btn ws-det-cart-btn"
                        onClick={handleAddToCart}
                        disabled={!selected}
                      >
                        Add to cart
                      </button>
                    </>
                  ) : recordings[0]?.video ? (
                    <a className="primary-button ws-det-register-btn" href={recordings[0].video} target="_blank" rel="noreferrer">
                      Watch workshop back
                    </a>
                  ) : (
                    <button type="button" className="primary-button ws-det-register-btn" onClick={() => setTab("recording")}>
                      View workshop content
                    </button>
                  )}
                </div>
                {selected?.upcoming && (
                  <p className="ws-det-secure">
                    <IcoLock /> Secure checkout via Stripe
                  </p>
                )}
              </div>

              {/* Member promo — only for upcoming bookable workshops */}
              {selected?.upcoming && (
                <div className="ws-det-card-section">
                  <div className="workshop-cart-promo-card">
                    <span className="workshop-cart-promo-badge">Pro Member</span>
                    <strong className="workshop-cart-promo-heading">Save {detailSaving} with a membership</strong>
                    <p className="workshop-cart-promo-body">
                      {detailMemberPrice
                        ? `Members pay ${detailMemberPrice} instead of ${selectedPrice}.`
                        : "Members save 20% on every workshop."}
                    </p>
                    <Link href="/auth?mode=signup&plan=pro" className="workshop-cart-promo-cta">
                      Become a member &rarr;
                    </Link>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </AppFrame>
  );
}
