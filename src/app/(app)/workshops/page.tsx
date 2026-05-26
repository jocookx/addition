"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import { AppFrame } from "@/components/legacy/AppFrame";
import type { WorkshopListItem } from "@/domain/workshop";
import { getWorkshops } from "@/lib/api/workshops";
import { type Cohort, buildCohorts, cohortDisplayTitle } from "@/lib/workshop-cohorts";
import { addWorkshopToCart, workshopToCartItem } from "@/lib/workshop-cart";

// ── Countdown ────────────────────────────────────────────────────────────────

function Countdown({ iso }: { iso: string }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, Date.parse(iso) - now);
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return (
    <div className="wsc-countdown">
      {[{ v: d, l: "Days" }, { v: h, l: "Hrs" }, { v: m, l: "Min" }].map(({ v, l }) => (
        <div key={l} className="wsc-countdown-unit">
          {String(v).padStart(2, "0").split("").map((digit, i) => (
            <span key={i} className="wsc-countdown-digit">{digit}</span>
          ))}
          <span className="wsc-countdown-label">{l}</span>
        </div>
      ))}
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_TRACKS = ["Architecture", "Interiors", "Computational"];
const DEFAULT_LEVELS = ["Foundations", "Applied", "Advanced"];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function daysUntil(iso: string): number {
  return Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000);
}

function isFutureOrToday(iso: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(iso);
  date.setHours(0, 0, 0, 0);
  return date >= today;
}

// ── Cohort card ───────────────────────────────────────────────────────────────

function CohortCard({ cohort }: { cohort: Cohort }) {
  const title = cohortDisplayTitle(cohort);
  const isPast = cohort.sessions.every((session) => !session.upcoming);
  const priceFrom = cohort.minPrice === 0 ? "Free" : `£${cohort.minPrice}`;
  const dateLabel = cohort.firstDate === cohort.lastDate
    ? fmtDate(cohort.firstDate)
    : `${fmtDate(cohort.firstDate)} – ${fmtDate(cohort.lastDate)}`;
  const initials = cohort.tutorName
    ? cohort.tutorName.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase()
    : "";
  const cartSession = cohort.sessions.find((session) => session.upcoming && isFutureOrToday(session.date)) ?? cohort.sessions[0];

  function addToCart(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (cartSession) addWorkshopToCart(workshopToCartItem(cartSession));
  }

  return (
    <Link href={`/workshops/${cohort.id}`} className="ws-cohort-card" aria-label={`View ${title}`}>
      {cohort.image ? (
        <img className="ws-cohort-card-img" src={cohort.image} alt="" aria-hidden="true" />
      ) : (
        <span className="ws-cohort-card-img ws-cohort-card-img--empty" aria-hidden="true" />
      )}
      <span className="ws-cohort-card-shade" aria-hidden="true" />

      {/* Default view */}
      <div className="ws-cohort-head">
        <span className="ws-cohort-level-badge">{isPast ? "Recorded" : cohort.level || "Live"}</span>
        <Countdown iso={cohort.firstDate} />
      </div>

      <h3 className="ws-cohort-title">{title}</h3>

      <div className="ws-cohort-info-row">
        <span>{dateLabel}</span>
        <span className="ws-cohort-dot">·</span>
        <span>{cohort.sessions.length} session{cohort.sessions.length !== 1 ? "s" : ""}</span>
        <span className="ws-cohort-dot">·</span>
        <span>{isPast ? "Watch back" : `From ${priceFrom}`}</span>
      </div>

      <div className="ws-cohort-foot">
        {cohort.software.length > 0 && (
          <div className="ws-cohort-sw-tags">
            {cohort.software.slice(0, 3).map((s) => (
              <span key={s} className="pl-sw-tag">{s}</span>
            ))}
          </div>
        )}
        <span className="ws-cohort-format-tag">{cohort.format === "in-person" ? "In Person" : "Online"}</span>
      </div>

      {cohort.learn.length > 0 && (
        <ul className="ws-cohort-learn-list">
          {cohort.learn.slice(0, 2).map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )}

      <span className="primary-button ws-cohort-cta">
        {isPast ? "View content" : "View & register"}
      </span>
      {!isPast && (
        <button type="button" className="ghost-btn ws-cohort-cart-btn" onClick={addToCart}>
          Add to cart
        </button>
      )}

      {/* Hover overlay — full detail */}
      <div className="ws-cohort-overlay">
        <div className="ws-cohort-overlay-head">
          <span className="ws-cohort-level-badge">{isPast ? "Recorded" : cohort.level || "Live"}</span>
          <h3>{title}</h3>
          <p>{dateLabel} · {cohort.sessions.length} session{cohort.sessions.length !== 1 ? "s" : ""} · From {priceFrom}</p>
        </div>

        {cohort.learn.length > 0 && (
          <div className="ws-cohort-hover-section ws-cohort-hover-section--compact">
            <span>What you&apos;ll learn</span>
            <ul>{cohort.learn.slice(0, 3).map((item, i) => <li key={i}>{item}</li>)}</ul>
          </div>
        )}

        {cohort.tutorName && (
          <div className="ws-cohort-instructor">
            <span>{initials}</span>
            <div>
              <small>Instructor</small>
              <strong>{cohort.tutorName}</strong>
            </div>
          </div>
        )}

        <span className="primary-button ws-cohort-cta">
          {isPast ? "View content" : "View & register"}
        </span>
        {!isPast && (
          <button type="button" className="ghost-btn ws-cohort-cart-btn" onClick={addToCart}>
            Add to cart
          </button>
        )}
      </div>

    </Link>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<WorkshopListItem[]>([]);
  const [track, setTrack] = useState("All");
  const [level, setLevel] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let canceled = false;
    // Fetch all workshops (upcoming + past)
    getWorkshops({ upcoming: false })
      .then((data) => { if (!canceled) { setWorkshops(data); setLoading(false); } })
      .catch((err) => { if (!canceled) { setError(err instanceof Error ? err.message : "Failed to load."); setLoading(false); } });
    return () => { canceled = true; };
  }, []);

  const allUpcoming = useMemo(() => workshops.filter((w) => w.upcoming && isFutureOrToday(w.date)), [workshops]);
  const allPast = useMemo(() => workshops.filter((w) => !w.upcoming || !isFutureOrToday(w.date)), [workshops]);

  const upcomingCohorts = useMemo(() => buildCohorts(allUpcoming), [allUpcoming]);
  const pastCohorts     = useMemo(() => buildCohorts(allPast).reverse(), [allPast]);

  const filterCohorts = useMemo(() => (cohorts: Cohort[]) => {
    return cohorts.filter((c) => {
      if (track !== "All" && c.track !== track) return false;
      if (level !== "All" && c.level !== level) return false;
      return true;
    });
  }, [track, level]);

  const trackFilters = useMemo(
    () => ["All", ...Array.from(new Set([...DEFAULT_TRACKS, ...upcomingCohorts.map((c) => c.track).filter(Boolean)]))],
    [upcomingCohorts],
  );
  const levelFilters = useMemo(
    () => ["All", ...Array.from(new Set([...DEFAULT_LEVELS, ...upcomingCohorts.map((c) => c.level).filter(Boolean)]))],
    [upcomingCohorts],
  );

  const filteredUpcoming = useMemo(() => filterCohorts(upcomingCohorts), [filterCohorts, upcomingCohorts]);
  const filteredPast = useMemo(
    () => filterCohorts(pastCohorts).filter((c) => c.title.trim() && c.title.trim().toLowerCase() !== "untitled workshop"),
    [filterCohorts, pastCohorts],
  );

  const next = upcomingCohorts[0] ?? null;
  const nextDays = next ? daysUntil(next.firstDate) : null;

  return (
    <AppFrame title="" subtitle="" topTabs={[]}>

      {/* ── Page hero ── */}
      <header className="ws-page-hero">
        <div className="ws-page-hero-text">
          <h1 className="ws-page-hero-title">Live Workshops</h1>
          <p className="ws-page-hero-sub">
            Focused live sessions for architectural digital design. Work through practical workflows with direct feedback.
          </p>
          {next && nextDays !== null && nextDays >= 0 && (
            <div className="ws-page-next-pill">
              <span className="ws-page-next-dot" />
              Next cohort starts {nextDays === 0 ? "today" : nextDays === 1 ? "tomorrow" : `in ${nextDays} days`}
              &nbsp;·&nbsp;{fmtDate(next.firstDate)}
            </div>
          )}
        </div>
        <div className="ws-page-hero-stats">
          <div className="ws-stat">
            <strong>{upcomingCohorts.length}</strong>
            <span>Cohorts available</span>
          </div>
          <div className="ws-stat">
            <strong>{Math.max(trackFilters.length - 1, 0)}</strong>
            <span>Tracks</span>
          </div>
          <div className="ws-stat">
            <strong>&lt;12</strong>
            <span>Per session</span>
          </div>
        </div>
      </header>

      {/* ── Filters ── */}
      <div className="ws-filter-row">
        <div className="ws-filter-group">
          {trackFilters.map((t) => (
            <button key={t} type="button" className={`ws-filter-pill${track === t ? " active" : ""}`} onClick={() => setTrack(t)}>
              {t}
            </button>
          ))}
        </div>
        <div className="ws-filter-divider" />
        <div className="ws-filter-group">
          {levelFilters.map((l) => (
            <button key={l} type="button" className={`ws-filter-pill${level === l ? " active" : ""}`} onClick={() => setLevel(l)}>
              {l}
            </button>
          ))}
        </div>
        {(track !== "All" || level !== "All") && (
          <button type="button" className="ws-filter-clear" onClick={() => { setTrack("All"); setLevel("All"); }}>
            Clear
          </button>
        )}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="ws-loading">
          <div className="ws-loading-pulse" />
          <div className="ws-loading-pulse" />
          <div className="ws-loading-pulse" />
        </div>
      ) : error ? (
        <p className="meta" style={{ color: "var(--danger)", padding: "24px 0" }}>{error}</p>
      ) : (
        <>
          {/* Upcoming */}
          {filteredUpcoming.length === 0 ? (
            <div className="ws-empty-state">
              <div className="ws-empty-icon">◎</div>
              <h3>No upcoming workshops match your filters</h3>
              <p className="meta">Try a different track or level, or check back soon for new cohorts.</p>
              <button type="button" className="ghost-btn" onClick={() => { setTrack("All"); setLevel("All"); }}>
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="ws-cohort-grid">
                {filteredUpcoming.map((c) => <CohortCard key={c.id} cohort={c} />)}
              </div>
              <p className="meta ws-result-count">{filteredUpcoming.length} cohort{filteredUpcoming.length !== 1 ? "s" : ""} upcoming</p>
            </>
          )}

          {/* Past */}
          {filteredPast.length > 0 && (
            <div className="ws-past-section">
              <div className="ws-cal-head"><h3>Past Workshops</h3></div>
              <div className="ws-cohort-grid ws-cohort-grid--past">
                {filteredPast.map((c) => <CohortCard key={c.id} cohort={c} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Trust bar ── */}
      <div className="ws-trust-bar">
        <div className="ws-trust-item"><span className="ws-trust-icon">◆</span><span>Max 12 students per session</span></div>
        <div className="ws-trust-item"><span className="ws-trust-icon">◆</span><span>Recording access included</span></div>
        <div className="ws-trust-item"><span className="ws-trust-icon">◆</span><span>Secure checkout via Stripe</span></div>
        <div className="ws-trust-item"><span className="ws-trust-icon">◆</span><span>Session notes &amp; resources</span></div>
      </div>
    </AppFrame>
  );
}
