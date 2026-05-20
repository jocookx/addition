"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Box,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Layers,
  MousePointer,
  PlayCircle,
  Plus,
  Route,
  Search,
  Workflow,
} from "lucide-react";
import { WorkshopCartButton } from "@/components/workshop-cart/WorkshopCartDrawer";
import type { WorkshopDetail, WorkshopListItem } from "@/domain/workshop";
import { getWorkshopDetail, getWorkshopCartCheckoutUrl, getWorkshops } from "@/lib/api/workshops";
import { type Cohort, buildCohorts, cohortDisplayTitle } from "@/lib/workshop-cohorts";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { addWorkshopToCart, workshopToCartItem } from "@/lib/workshop-cart";

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

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

function briefOverview(value: string | null | undefined, maxLength = 150) {
  const clean = value?.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const firstSentence = clean.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  const base = firstSentence && firstSentence.length <= maxLength ? firstSentence : clean;
  return base.length > maxLength ? `${base.slice(0, maxLength).trimEnd()}...` : base;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const learnSlides = [
  {
    eyebrow: "AI + Computation",
    title: "AI and Computational Design",
    copy: "Learn to use AI tools and parametric thinking to generate ideas, automate decisions and build design systems.",
    points: [
      "AI ideation and image generation",
      "Parametric and generative design",
      "Grasshopper workflows from scratch",
      "Automating repetitive design tasks",
    ],
    tone: "violet",
    icon: Workflow,
  },
  {
    eyebrow: "3D + Digital Making",
    title: "3D Modelling and Digital Making",
    copy: "Build spatial, product and form-based design workflows using modern 3D tools used across architecture and design.",
    points: [
      "Rhino from beginner to advanced",
      "Surface and solid modelling",
      "Blender for architecture",
      "Fabrication-ready 3D outputs",
    ],
    tone: "ocean",
    icon: Box,
  },
  {
    eyebrow: "Visualisation",
    title: "Visualisation and Presentation",
    copy: "Produce renders, animations, diagrams, boards and portfolio-ready outputs for any design project.",
    points: [
      "Real-time rendering with Twinmotion",
      "Unreal Engine for immersive design",
      "Adobe workflow for boards and portfolios",
      "Lighting, materials and post-production",
    ],
    tone: "lime",
    icon: Layers,
  },
];

const platformFeatures = [
  {
    icon: BookOpen,
    label: "Commands Library",
    desc: "Search any software command — what it does, when to use it, and the mistakes to avoid.",
    tone: "lime",
  },
  {
    icon: Calendar,
    label: "Live Workshops",
    desc: "Expert-led sessions with full recordings, resources and follow-up access inside your account.",
    tone: "amber",
  },
  {
    icon: Route,
    label: "Learning Paths",
    desc: "Structured routes from beginner to advanced across tools and creative disciplines.",
    tone: "violet",
  },
  {
    icon: PlayCircle,
    label: "Course Library",
    desc: "Short guided video lessons you can follow and revisit at your own pace.",
    tone: "cyan",
  },
];

const toolItems = [
  "AI Tools", "Rhino", "Grasshopper", "Blender", "Revit",
  "Twinmotion", "Unreal Engine", "Adobe", "Creative Coding", "D5 Render",
];

const learningRoutes = [
  {
    num: "01",
    icon: Calendar,
    title: "Live Workshops",
    copy: "Join expert-led live sessions built around practical creative workflows. Ask questions, follow along, keep the recording.",
    cta: "View Workshops",
    href: "#workshops",
    tone: "amber",
    badge: "Live",
  },
  {
    num: "02",
    icon: PlayCircle,
    title: "Structured Courses",
    copy: "Build confidence through short guided lessons, recordings and project-based learning at your own pace.",
    cta: "Browse Courses",
    href: "/catalog",
    tone: "violet",
    badge: null,
  },
  {
    num: "03",
    icon: Search,
    title: "Workflow Library",
    copy: "Find tools, commands, methods and repeatable design systems you can use directly in your own projects.",
    cta: "Explore Library",
    href: "/commands",
    tone: "cyan",
    badge: null,
  },
  {
    num: "04",
    icon: BookOpen,
    title: "Commands Library",
    copy: "Search any software command — understand what it does, when to use it and the common mistakes to avoid.",
    cta: "Browse Commands",
    href: "/commands",
    tone: "lime",
    badge: null,
  },
];

const audiences = [
  {
    title: "Architecture",
    copy: "AI, parametric design, BIM, modelling, rendering and portfolio workflows.",
    theme: "arch",
    featured: true,
  },
  {
    title: "Interiors",
    copy: "Spatial concepts, material palettes, 3D visualisation and presentation workflows.",
    theme: "int",
    featured: false,
  },
  {
    title: "Spatial Design",
    copy: "Installations, exhibitions, environments and immersive design workflows.",
    theme: "spatial",
    featured: false,
  },
  {
    title: "Product Design",
    copy: "Form generation, prototyping, modelling and fabrication-ready workflows.",
    theme: "product",
    featured: false,
  },
  {
    title: "Fashion",
    copy: "AI concepts, digital form, pattern thinking, visualisation and future design tools.",
    theme: "fashion",
    featured: false,
  },
];

const faqs = [
  {
    q: "What is Addition?",
    a: "Addition is a learning platform for architects, interior designers and creative professionals who want to build digital skills. It combines live workshops, recorded courses, a commands library and structured learning paths — all focused on the tools and workflows used in modern creative practice.",
  },
  {
    q: "Who is it for?",
    a: "Addition is built for architects, interior designers, spatial designers, product designers and anyone in creative practice who wants to get better at digital tools — from Rhino and Grasshopper to AI workflows, Blender, Unreal Engine and the Adobe suite.",
  },
  {
    q: "How do live workshops work?",
    a: "Workshops are expert-led sessions you join live online. Each workshop is focused on a specific tool or workflow and typically runs 2–3 hours. You get full recording access plus any resources inside your Addition account afterwards — so you can revisit everything at your own pace.",
  },
  {
    q: "What's included with a Pro membership?",
    a: "Pro gives you full access to the course library, workshop replay library, learning paths and progress tracking. Workshops are booked separately, but Pro members get 20% off every booking. It's £20/month or £192/year (equivalent to £16/month).",
  },
  {
    q: "Is there a student discount?",
    a: "Yes — verified students get discounted Pro access at £10/month. You'll be asked to verify your student status when you apply. Same full platform, lower price.",
  },
  {
    q: "What software and tools do you cover?",
    a: "Addition covers the tools used across architecture and design practice: Rhino, Grasshopper, Blender, Revit, Twinmotion, Unreal Engine, the Adobe suite, AI tools and creative coding. New content is added regularly as tools and workflows evolve.",
  },
  {
    q: "Can I try it before committing?",
    a: "Yes — you can join for free and access starter lessons and a preview of the platform before deciding whether to go Pro. You can also book a single workshop without any membership.",
  },
];

const freeFeatures = ["Starter lessons", "Platform preview", "Workflow library previews"];

const proFeatures = [
  "Full platform access",
  "Course library",
  "Workshop replay library",
  "Learning paths",
  "Progress tracking",
  "Student discount available",
];

// ─── Small reusable pieces ─────────────────────────────────────────────────────

function Logo() {
  return (
    <Link className="brand-wordmark" href="/" aria-label="ADDITION home">
      <span className="wordmark-plus" aria-hidden="true">+</span>
      <span>addition</span>
    </Link>
  );
}

function ArrowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link className="btn btn-primary" href={href}>
      {children}
      <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}

// ─── Tool Marquee (V2 style) ──────────────────────────────────────────────────

function ToolMarquee() {
  const repeated = [...toolItems, ...toolItems, ...toolItems];
  return (
    <div className="tool-marquee-wrap" aria-hidden="true">
      <div className="tool-marquee-track">
        <div className="tool-marquee-inner">
          {repeated.map((tool, i) => (
            <span key={i} className="tool-marquee-item">
              {tool}
              <span className="tool-marquee-sep">·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Feature Slider (V2 style) ────────────────────────────────────────────────

function LearnSlider() {
  const [active, setActive] = useState(0);
  const prev = () => setActive((i) => (i - 1 + learnSlides.length) % learnSlides.length);
  const next = () => setActive((i) => (i + 1) % learnSlides.length);
  const slide = learnSlides[active]!;
  const Icon = slide.icon;

  return (
    <section className="section-pad learn-slider-section" aria-labelledby="learn-slider-heading">
      <div className="container">
        <div className="learn-slider-header">
          <div>
            <p className="eyebrow">What you&apos;ll learn</p>
            <h2 id="learn-slider-heading">Build the skills behind modern creative practice.</h2>
            <p>Addition connects idea generation, technical workflows and final presentation.</p>
          </div>
          <div className="learn-slider-arrows">
            <button type="button" onClick={prev} aria-label="Previous slide">
              <ChevronLeft size={20} />
            </button>
            <span>{active + 1} / {learnSlides.length}</span>
            <button type="button" onClick={next} aria-label="Next slide">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="learn-slide">
          <div className="learn-slide-copy">
            <p className="eyebrow">{slide.eyebrow}</p>
            <h3>{slide.title}</h3>
            <p>{slide.copy}</p>
            <ul className="learn-slide-points">
              {slide.points.map((point) => (
                <li key={point}>
                  <CheckCircle size={15} aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
            <Link className="btn btn-secondary" href="/catalog" style={{ marginTop: "8px", width: "fit-content" }}>
              Explore courses <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          <div className={`learn-slide-visual learn-slide-visual--${slide.tone}`} aria-hidden="true">
            <div className="learn-slide-icon-wrap">
              <Icon size={56} />
            </div>
            <div className="learn-slide-dots-nav">
              {learnSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`learn-dot${i === active ? " is-active" : ""}`}
                  onClick={() => setActive(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Platform Section ─────────────────────────────────────────────────────────

function PlatformSection() {
  return (
    <section className="section-pad platform-section" id="platform" aria-labelledby="platform-heading">
      <div className="container">
        <div className="platform-layout">

          {/* LEFT: copy + feature list */}
          <div className="platform-copy">
            <p className="eyebrow">The Platform</p>
            <h2 id="platform-heading">Everything you need to keep building.</h2>
            <p className="platform-copy-lede">
              Live workshops, courses, a commands library and structured learning paths —
              all in one place, built around how creative designers actually work.
            </p>
            <div className="platform-features">
              {platformFeatures.map(({ icon: Icon, label, desc, tone }) => (
                <div className={`platform-feature platform-feature--${tone}`} key={label}>
                  <div className="platform-feature-icon" aria-hidden="true">
                    <Icon size={17} />
                  </div>
                  <div className="platform-feature-text">
                    <strong>{label}</strong>
                    <span>{desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link className="btn btn-secondary" href="/auth?mode=signup" style={{ marginTop: "32px", width: "fit-content" }}>
              Explore the platform <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          {/* RIGHT: CSS product mock */}
          <div className="platform-mock" aria-hidden="true">

            {/* Card 1 — Command search */}
            <div className="platform-mock-card platform-mock-card--cmd">
              <div className="platform-mock-cmd-bar">
                <Search size={13} />
                <span>loft</span>
                <kbd>⌘K</kbd>
              </div>
              <div className="platform-mock-cmd-item platform-mock-cmd-item--active">
                <span className="platform-mock-cmd-tag">Rhino</span>
                <div className="platform-mock-cmd-text">
                  <strong>Loft</strong>
                  <span>Create smooth surfaces between two or more curves</span>
                </div>
              </div>
              <div className="platform-mock-cmd-item platform-mock-cmd-item--dim">
                <span className="platform-mock-cmd-tag">Rhino</span>
                <div className="platform-mock-cmd-text">
                  <strong>Loft Options</strong>
                  <span>Configure rebuild count and surface style</span>
                </div>
              </div>
              <div className="platform-mock-cmd-item platform-mock-cmd-item--dim">
                <span className="platform-mock-cmd-tag">GH</span>
                <div className="platform-mock-cmd-text">
                  <strong>Loft (Grasshopper)</strong>
                  <span>Surface component · inputs: curves, options</span>
                </div>
              </div>
            </div>

            {/* Card 2 — Workshop booking */}
            <div className="platform-mock-card platform-mock-card--workshop">
              <span className="platform-mock-ws-eyebrow">Live Workshop · £35</span>
              <strong className="platform-mock-ws-title">AI for Architecture</strong>
              <span className="platform-mock-ws-meta">Wed 22 Jan · 6:00pm GMT · 2 hrs</span>
              <div className="platform-mock-ws-instructor">
                <span className="platform-mock-ws-avatar">SC</span>
                <div>
                  <small>Instructor</small>
                  <strong>Sam Clarke</strong>
                </div>
              </div>
              <button type="button" className="platform-mock-ws-btn">Book now</button>
            </div>

            {/* Card 3 — Learning path progress */}
            <div className="platform-mock-card platform-mock-card--path">
              <div className="platform-mock-path-head">
                <span>Learning Path</span>
                <strong>62%</strong>
              </div>
              <strong className="platform-mock-path-title">Rhino: Beginner to Advanced</strong>
              <div className="platform-mock-path-bar">
                <div className="platform-mock-path-fill" />
              </div>
              <div className="platform-mock-path-footer">
                <span>8 of 13 lessons complete</span>
                <span className="platform-mock-path-resume">Resume →</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ Section ─────────────────────────────────────────────────────────────

function FaqSection() {
  return (
    <section className="section-pad faq-section" aria-labelledby="faq-heading">
      <div className="container">
        <div className="faq-header">
          <p className="eyebrow">Common questions</p>
          <h2 id="faq-heading">Everything you need to know.</h2>
        </div>
        <div className="faq-list">
          {faqs.map(({ q, a }, i) => (
            <details key={q} className="faq-item">
              <summary className="faq-summary">
                <span className="faq-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="faq-question">{q}</span>
                <span className="faq-toggle" aria-hidden="true">
                  <span className="faq-toggle-open">Open</span>
                  <span className="faq-toggle-close">Close</span>
                  <span className="faq-toggle-icon" />
                </span>
              </summary>
              <div className="faq-body">
                <p>{a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Band (V2 "Discover the new era" adapted) ────────────────────────────

function CtaBand() {
  return (
    <section className="cta-band" aria-labelledby="cta-band-heading">
      <div className="cta-band-inner">
        <p className="eyebrow">Start today</p>
        <h2 id="cta-band-heading">Join a live workshop.<br />Keep building inside Addition.</h2>
        <p>
          Book a single workshop and access recordings, resources and learning paths
          inside your Addition account.
        </p>
        <div className="cta-band-actions">
          <ArrowLink href="#workshops">View Workshops</ArrowLink>
          <Link className="btn btn-secondary" href="/auth?mode=signup">Join Free</Link>
        </div>
      </div>
    </section>
  );
}

// ─── EnrolModal ───────────────────────────────────────────────────────────────

function EnrolModal({
  workshop,
  onClose,
  onProceedWithoutAccount,
}: {
  workshop: WorkshopListItem;
  onClose: () => void;
  onProceedWithoutAccount: () => Promise<void>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.body.classList.add("modal-open");
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const numericPrice = workshop.price ? parseInt(workshop.price.replace(/[^0-9]/g, ""), 10) : NaN;
  const saving = !isNaN(numericPrice) ? `£${Math.round(numericPrice * 0.2)}` : "20%";
  const memberPrice = !isNaN(numericPrice) ? `£${Math.round(numericPrice * 0.8)}` : null;

  function addThisToCart() {
    addWorkshopToCart(workshopToCartItem(workshop));
  }

  async function handleContinue() {
    setBusy(true);
    try { await onProceedWithoutAccount(); } finally { setBusy(false); }
  }

  const metaLine = [
    formatShortDate(workshop.date),
    workshop.time ? `${workshop.time}${workshop.timezone ? ` ${workshop.timezone}` : ""}` : null,
    workshop.price ?? null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="enrol-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="enrol-modal-title">
      <button className="enrol-modal-backdrop" type="button" onClick={onClose} aria-label="Close" />
      <div className="enrol-modal-card">
        <button type="button" className="enrol-modal-close" onClick={onClose} aria-label="Close">&#x2715;</button>

        <div className="enrol-modal-workshop">
          {workshop.image && (
            <img className="enrol-modal-img" src={workshop.image} alt="" aria-hidden="true"
              onError={(e) => { e.currentTarget.style.display = "none"; }} />
          )}
          <div className="enrol-modal-workshop-info">
            <h2 id="enrol-modal-title" className="enrol-modal-title">{workshop.title}</h2>
            <p className="enrol-modal-meta">{metaLine}</p>
          </div>
        </div>

        <div className="enrol-modal-offer">
          <span className="enrol-modal-offer-badge">Pro Member</span>
          <h3 className="enrol-modal-offer-heading">Save {saving} with a Pro membership</h3>
          <p className="enrol-modal-offer-body">
            {memberPrice
              ? `Members pay ${memberPrice} instead of ${workshop.price ?? "full price"}.`
              : "Members save 20% on every workshop."}
            {" "}Sign up for full platform access, courses, workshop replays and learning paths.
          </p>
        </div>

        <div className="enrol-modal-actions">
          <button type="button" className="btn btn-primary enrol-modal-primary"
            onClick={() => { addThisToCart(); router.push("/auth?mode=signup&plan=pro&next=/workshops/cart"); }}>
            Sign up &amp; save {saving}
          </button>
          <button type="button" className="btn btn-secondary enrol-modal-secondary"
            onClick={() => { addThisToCart(); router.push("/auth?next=/workshops/cart"); }}>
            Sign in
          </button>
          <button type="button" className="enrol-modal-skip"
            onClick={() => void handleContinue()} disabled={busy}>
            {busy ? "Loading…" : "Continue without an account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── WorkshopModal ────────────────────────────────────────────────────────────

function WorkshopModal({ cohort, onClose }: { cohort: Cohort; onClose: () => void }) {
  const router = useRouter();
  const [detail, setDetail] = useState<WorkshopDetail | null>(null);
  const [buyBusy, setBuyBusy] = useState(false);

  // Always fetch detail for the first session — same strategy as the portal
  const firstSession = cohort.sessions[0];

  useEffect(() => {
    document.body.classList.add("modal-open");
    let canceled = false;
    void getWorkshopDetail(firstSession.id).then((d) => { if (!canceled) setDetail(d); }).catch(() => {});
    return () => { canceled = true; document.body.classList.remove("modal-open"); };
  }, [firstSession.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const title = cohortDisplayTitle(cohort);
  // Prefer richer detail data, fall back to merged cohort list data — same as portal
  const learnItems = detail?.learn ?? cohort.learn;
  const includedItems = detail?.included ?? [];
  const principles = detail?.principles ?? [];
  const description = detail?.description ?? "";
  const tutorName = detail?.tutorName ?? cohort.tutorName;
  const tutorInitials = tutorName.split(" ").map((p) => p[0] ?? "").join("").slice(0, 2).toUpperCase();
  const tutorOverview = briefOverview(detail?.tutorBio);

  // Date/time: show range for multi-session cohorts, single date otherwise
  const dateLabel = cohort.firstDate === cohort.lastDate
    ? formatShortDate(cohort.firstDate)
    : `${formatShortDate(cohort.firstDate)} – ${formatShortDate(cohort.lastDate)}`;
  const timeLabel = firstSession.time
    ? `${firstSession.time}${firstSession.timezone ? ` ${firstSession.timezone}` : ""}`
    : "Time TBC";
  const metaLine = [dateLabel, timeLabel, firstSession.duration].filter(Boolean).join(" · ");

  const priceStr = cohort.minPrice > 0 ? `£${cohort.minPrice}` : (firstSession.price ?? "Free");
  const modalNumericPrice = cohort.minPrice > 0 ? cohort.minPrice : NaN;
  const modalSaving = !isNaN(modalNumericPrice) ? `£${Math.round(modalNumericPrice * 0.2)}` : "20%";
  const modalMemberPrice = !isNaN(modalNumericPrice) ? `£${Math.round(modalNumericPrice * 0.8)}` : null;

  function addToCart() { addWorkshopToCart(workshopToCartItem(firstSession)); }

  async function buyNow() {
    setBuyBusy(true);
    try {
      const supabase = getBrowserSupabaseClient();
      const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
      const url = await getWorkshopCartCheckoutUrl([firstSession.id], data.session?.access_token);
      window.location.href = url;
    } catch {
      addToCart();
      router.push("/workshops/cart");
    } finally { setBuyBusy(false); }
  }

  return (
    <div className="workshop-modal-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <button className="workshop-modal-backdrop" type="button" onClick={onClose} aria-label="Close workshop details" />
      <div className="workshop-modal-card">
        <button type="button" className="workshop-modal-close" onClick={onClose} aria-label="Close">Close ×</button>
        <div className="workshop-detail-layout">
          <div className="workshop-detail-main">
            <div className="workshop-detail-media">
              {cohort.image
                ? <Image src={cohort.image} alt={title} fill unoptimized style={{ objectFit: "cover" }} />
                : <div className="landing-workshop-placeholder" aria-hidden="true" />}
              <div className="landing-workshop-badges">
                <span>{cohort.format === "online" ? "Live online" : "In person"}</span>
                <span>{cohort.level}</span>
              </div>
              <div className="workshop-detail-media-footer">
                <small>{metaLine}</small>
                <h2>{title}</h2>
              </div>
            </div>
            <div className="workshop-detail-content">
              {description && <p>{description}</p>}
            </div>
            <div className="workshop-detail-accordions">
              {learnItems.length > 0 && (
                <details open className="accordion--learn">
                  <summary><span>What you&apos;ll learn</span><small>{learnItems.length} outcomes</small></summary>
                  <ul>{learnItems.map((l, i) => <li key={`${l}-${i}`}>{l}</li>)}</ul>
                </details>
              )}
              {includedItems.length > 0 && (
                <details open className="accordion--included">
                  <summary><span>What&apos;s included</span><small>{includedItems.length} items</small></summary>
                  <ul>{includedItems.map((inc, i) => <li key={`${inc}-${i}`}>{inc}</li>)}</ul>
                </details>
              )}
              {principles.length > 0 && (
                <details open>
                  <summary><span>What you&apos;ll work on</span></summary>
                  <ul>{principles.map((p, i) => <li key={`${p}-${i}`}>{p}</li>)}</ul>
                </details>
              )}
              {tutorName && (
                <details open>
                  <summary><span>Instructor</span></summary>
                  <div className="workshop-detail-accordion-instructor">
                    {detail?.tutorImage
                      ? <Image className="workshop-detail-instructor-photo" src={detail.tutorImage} alt={tutorName} width={52} height={52} unoptimized />
                      : <span className="workshop-detail-instructor-initials">{tutorInitials}</span>}
                    <div>
                      <strong>{tutorName}</strong>
                      {tutorOverview && <p>{tutorOverview}</p>}
                    </div>
                  </div>
                </details>
              )}
            </div>
          </div>
          <aside className="workshop-detail-sidebar">
            <div className="workshop-detail-price-card">
              <span>Workshop access</span>
              <strong>{priceStr}</strong>
              <dl>
                <div><dt>Date</dt><dd>{dateLabel}</dd></div>
                <div><dt>Time</dt><dd>{timeLabel}</dd></div>
                {firstSession.duration && <div><dt>Duration</dt><dd>{firstSession.duration}</dd></div>}
                <div><dt>Format</dt><dd>{cohort.format === "online" ? "Live online" : "In person"}</dd></div>
                <div><dt>Level</dt><dd>{cohort.level}</dd></div>
                {cohort.sessions.length > 1 && (
                  <div><dt>Sessions</dt><dd>{cohort.sessions.length}</dd></div>
                )}
              </dl>
              <button type="button" className="btn btn-primary" onClick={() => void buyNow()} disabled={buyBusy}>
                {buyBusy ? "Opening checkout..." : "Buy now"}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button type="button" className="btn btn-secondary" onClick={addToCart}>Add to cart</button>
            </div>
            <div className="workshop-cart-promo-card">
              <span className="workshop-cart-promo-badge">Pro Member</span>
              <strong className="workshop-cart-promo-heading">Save {modalSaving} with a membership</strong>
              <p className="workshop-cart-promo-body">
                {modalMemberPrice
                  ? `Members pay ${modalMemberPrice} instead of ${priceStr}.`
                  : "Members save 20% on every workshop."}
                {" "}Plus full platform access, courses and workshop replays.
              </p>
              <Link href="/auth?mode=signup&plan=pro" className="workshop-cart-promo-cta">
                Become a member &rarr;
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ─── LandingPage ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const headerRef = useRef<HTMLElement>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [workshops, setWorkshops] = useState<Cohort[]>([]);
  const [modalItem, setModalItem] = useState<Cohort | null>(null);
  const [enrollWorkshop, setEnrollWorkshop] = useState<Cohort | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  function addLandingWorkshopToCart(cohort: Cohort) {
    addWorkshopToCart(workshopToCartItem(cohort.sessions[0]));
  }

  async function buyLandingWorkshopNow(cohort: Cohort) {
    try {
      const supabase = getBrowserSupabaseClient();
      const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
      const url = await getWorkshopCartCheckoutUrl([cohort.sessions[0].id], data.session?.access_token);
      window.location.href = url;
    } catch {
      addLandingWorkshopToCart(cohort);
      router.push("/workshops/cart");
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "1") return;
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
  }, [router]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const onScroll = () => el.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(".scroll-reveal"));
    if (!items.length) return;
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("is-visible"); }); },
      { threshold: 0.12, rootMargin: "0px 0px -8%" },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let canceled = false;
    void getWorkshops({ upcoming: true }).then((data) => { if (!canceled) setWorkshops(buildCohorts(data)); });
    return () => { canceled = true; };
  }, []);

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="site-header" ref={headerRef}>
        <nav className="nav-shell" aria-label="Primary navigation">
          <Logo />
          <button className="nav-toggle" type="button" aria-expanded={navOpen} aria-label="Toggle navigation"
            onClick={() => setNavOpen((o) => !o)}>
            {navOpen ? "Close" : "Menu"}
          </button>
          <div className={`nav-menu${navOpen ? " is-open" : ""}`}>
            <a href="#platform" onClick={() => setNavOpen(false)}>Platform</a>
            <a href="#workshops" onClick={() => setNavOpen(false)}>Workshops</a>
            <a href="#pricing" onClick={() => setNavOpen(false)}>Pricing</a>
          </div>
          <div className="nav-actions">
            <WorkshopCartButton compact />
            <Link className="nav-link" href="/auth">Sign in</Link>
            <Link className="btn btn-primary btn-small" href="/auth?mode=signup">Start free</Link>
          </div>
        </nav>
      </header>

      <main className="site-main">

        {/* ── 1. Hero (V1 split layout + V2 social proof) ─────────────────── */}
        <section className="hero-section" aria-labelledby="hero-headline">
          <div className="hero-inner container">
            <div className="hero-left">
              <p className="eyebrow">Addition</p>
              <h1 id="hero-headline">Learn AI and Digital Design for Architecture and Design</h1>
              <p className="hero-lede">
                Live workshops, courses and tools built for architects, designers and creative professionals.
              </p>
              <div className="hero-actions">
                <ArrowLink href="#workshops">View Live Workshops</ArrowLink>
                <Link className="btn btn-secondary" href="/auth?mode=signup">Join Free</Link>
              </div>
              <div className="hero-social-proof">
                <div className="hero-avatars" aria-hidden="true">
                  <span>JD</span>
                  <span>MR</span>
                  <span>SK</span>
                </div>
                <span>Join designers learning with Addition</span>
              </div>
            </div>

            <div className="hero-right" aria-hidden="true">
              <div className="hero-visual">
                <div className="hero-visual-grid" />
                <div className="hero-visual-card hero-visual-card--1">
                  <small>Learning Path</small>
                  <strong>Rhino Beginner</strong>
                  <span>12 lessons · In progress</span>
                  <div className="hero-visual-progress">
                    <div className="hero-visual-progress-fill" style={{ width: "62%" }} />
                  </div>
                </div>
                <div className="hero-visual-card hero-visual-card--2">
                  <small>Live Workshop</small>
                  <strong>AI for Architecture</strong>
                  <span>Book now · 2 hrs</span>
                </div>
                <div className="hero-visual-card hero-visual-card--3">
                  <small>Command</small>
                  <strong>Loft</strong>
                  <span>Create surfaces between curves</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Tool Marquee (V2 style) ──────────────────────────────────── */}
        <ToolMarquee />

        {/* ── 3. Feature Slider (V2 key features adapted) ─────────────────── */}
        <LearnSlider />

        {/* ── 4. Platform Section ──────────────────────────────────────────── */}
        <PlatformSection />

        {/* ── 5. Workshops (existing card grid) ───────────────────────────── */}
        <section className="section-pad workshops-section add-workshops-section" id="workshops" aria-labelledby="workshops-heading">
          <div className="container">
            <div className="section-heading scroll-reveal">
              <p className="eyebrow">Workshops</p>
              <h2 id="workshops-heading">Our upcoming workshops.</h2>
              <p>Live expert-led sessions. Start with one workshop and keep building inside Addition.</p>
            </div>

            {workshops.length > 0 ? (
              <div className="ws-cohort-grid add-landing-ws-grid" aria-label="Upcoming workshops">
                {workshops.map((cohort) => {
                  const title = cohortDisplayTitle(cohort);
                  const priceFrom = cohort.minPrice === 0 ? "Free" : `£${cohort.minPrice}`;
                  const dateLabel = cohort.firstDate === cohort.lastDate
                    ? fmtDate(cohort.firstDate)
                    : `${fmtDate(cohort.firstDate)} – ${fmtDate(cohort.lastDate)}`;
                  const tutorInitials = cohort.tutorName
                    .split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
                  return (
                    <div key={cohort.id} className="ws-cohort-card" role="button" tabIndex={0}
                      aria-label={`View ${title}`}
                      onClick={() => setModalItem(cohort)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setModalItem(cohort); } }}>
                      {cohort.image
                        ? <img className="ws-cohort-card-img" src={cohort.image} alt="" aria-hidden="true" />
                        : <span className="ws-cohort-card-img ws-cohort-card-img--empty" aria-hidden="true" />}
                      <span className="ws-cohort-card-shade" aria-hidden="true" />

                      {/* Default view */}
                      <div className="ws-cohort-head">
                        <span className="ws-cohort-level-badge">{cohort.level || "Live"}</span>
                        <Countdown iso={cohort.firstDate} />
                      </div>

                      <h3 className="ws-cohort-title">{title}</h3>

                      <div className="ws-cohort-info-row">
                        <span>{dateLabel}</span>
                        <span className="ws-cohort-dot">·</span>
                        <span>{cohort.sessions.length} session{cohort.sessions.length !== 1 ? "s" : ""}</span>
                        <span className="ws-cohort-dot">·</span>
                        <span>From {priceFrom}</span>
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

                      <span className="primary-button ws-cohort-cta">View &amp; register</span>
                      <button type="button" className="ghost-btn ws-cohort-cart-btn"
                        onClick={(e) => { e.stopPropagation(); addLandingWorkshopToCart(cohort); }}>
                        Add to cart
                      </button>

                      {/* Hover overlay */}
                      <div className="ws-cohort-overlay">
                        <div className="ws-cohort-overlay-head">
                          <span className="ws-cohort-level-badge">{cohort.level || "Live"}</span>
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
                            <span>{tutorInitials}</span>
                            <div>
                              <small>Instructor</small>
                              <strong>{cohort.tutorName}</strong>
                            </div>
                          </div>
                        )}

                        <span className="primary-button ws-cohort-cta">View &amp; register</span>
                        <button type="button" className="ghost-btn ws-cohort-cart-btn"
                          onClick={(e) => { e.stopPropagation(); addLandingWorkshopToCart(cohort); }}>
                          Add to cart
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <article className="landing-workshop-empty glass-panel">
                <Calendar size={28} aria-hidden="true" />
                <div>
                  <h3>Workshops are being scheduled.</h3>
                  <p>New live sessions will appear here as soon as they are published.</p>
                </div>
                <Link className="btn btn-secondary" href="/auth?mode=signup">Get updates</Link>
              </article>
            )}
          </div>
        </section>

        {/* ── 6. How You Learn — improved route cards ──────────────────────── */}
        <section className="section-pad" aria-labelledby="routes-heading">
          <div className="container">
            <div className="section-heading scroll-reveal">
              <p className="eyebrow">How you learn</p>
              <h2 id="routes-heading">Four clear ways to build skill.</h2>
              <p>Choose the learning route that matches the job you need to do next.</p>
            </div>
            <div className="routes-grid">
              {learningRoutes.map(({ num, icon: Icon, title, copy, cta, href, tone, badge }) => (
                <article className={`route-card route-card--${tone}`} key={title}>
                  <div className="route-card-visual" aria-hidden="true">
                    <div className="route-card-bg" />
                    <div className="route-card-pattern" />
                    <div className="route-card-icon-ring">
                      <Icon size={30} />
                    </div>
                    {badge && (
                      <span className="route-card-badge">
                        <span className="route-card-badge-dot" />
                        {badge}
                      </span>
                    )}
                  </div>
                  <div className="route-card-body">
                    <div className="route-card-meta">
                      <span className="route-card-num">{num}</span>
                      <ArrowRight size={14} className="route-card-arrow" aria-hidden="true" />
                    </div>
                    <h3>{title}</h3>
                    <p>{copy}</p>
                    <Link className="route-card-cta" href={href}>
                      {cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. Who It's For — bento grid ─────────────────────────────────── */}
        <section className="section-pad" aria-labelledby="audience-heading">
          <div className="container">
            <div className="section-heading scroll-reveal">
              <p className="eyebrow">Who it&apos;s for</p>
              <h2 id="audience-heading">Built for creative designers.</h2>
              <p>Addition starts with architecture, interiors and spatial design, with workflows that extend across creative practice.</p>
            </div>
            <div className="bento-grid">
              {audiences.map(({ title, copy, theme, featured }) => (
                <article
                  key={title}
                  className={`bento-card bento-card--${theme}${featured ? " bento-card--featured" : ""}`}
                >
                  <div className="bento-card-visual" aria-hidden="true">
                    <div className="bento-card-pattern" />
                    <div className="bento-card-overlay" />
                    <span className="bento-card-discipline">{title}</span>
                  </div>
                  <div className="bento-card-body">
                    <h3>{title}</h3>
                    <p>{copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── 8. CTA Band (V2 "Discover the new era") ─────────────────────── */}
        <CtaBand />

        {/* ── 9. Pricing ──────────────────────────────────────────────────── */}
        <section className="section-pad pricing-section" id="pricing" aria-labelledby="pricing-heading">
          <div className="container">
            <div className="section-heading scroll-reveal">
              <p className="eyebrow">Pricing</p>
              <h2 id="pricing-heading">Simple, flexible access.</h2>
              <p>Start free or go Pro for full platform access. Workshops are booked separately.</p>
            </div>

            <div className="add-billing-toggle-row">
              <div className="billing-toggle">
                <button type="button" className={billingCycle === "monthly" ? "is-active" : ""}
                  onClick={() => setBillingCycle("monthly")}>Monthly</button>
                <button type="button" className="billing-switch" aria-label="Toggle billing cycle"
                  onClick={() => setBillingCycle((c) => c === "monthly" ? "yearly" : "monthly")}>
                  <span />
                </button>
                <button type="button" className={billingCycle === "yearly" ? "is-active" : ""}
                  onClick={() => setBillingCycle("yearly")}>Yearly</button>
                {billingCycle === "yearly" && <span>2 months free</span>}
              </div>
            </div>

            <div className="add-pricing-grid add-pricing-grid--two">
              <article className="price-card glass-panel">
                <h3>Free</h3>
                <strong>£0</strong>
                <p>Best for trying Addition.</p>
                <ul>
                  {freeFeatures.map((f) => <li key={f}><CheckCircle size={16} aria-hidden="true" />{f}</li>)}
                </ul>
                <Link className="btn btn-secondary" href="/auth?mode=signup">Start Free</Link>
              </article>
              <article className="price-card recommended glass-panel">
                <span className="recommend-badge">Recommended</span>
                <h3>Pro</h3>
                <strong>
                  {billingCycle === "yearly" ? "£16" : "£20"}
                  <span>/month</span>
                </strong>
                {billingCycle === "yearly" && <p className="price-billed-note">Billed £192 annually</p>}
                <p>Best for ongoing learning.</p>
                <ul>
                  {proFeatures.map((f) => <li key={f}><CheckCircle size={16} aria-hidden="true" />{f}</li>)}
                </ul>
                <Link className="btn btn-primary"
                  href={`/auth?mode=signup&plan=pro${billingCycle === "yearly" ? "&billing=yearly" : ""}`}>
                  Join Pro
                </Link>
              </article>
              <article className="student-card glass-panel">
                <GraduationCap size={26} aria-hidden="true" />
                <div>
                  <h3>Student</h3>
                  <p>Verified students get discounted Pro access — same full platform at a lower price.</p>
                </div>
                <strong>£10<span>/month</span></strong>
                <Link className="btn btn-secondary" href="/auth?mode=signup&plan=student">Apply for discount</Link>
              </article>
            </div>

          </div>
        </section>

        {/* ── 10. FAQ ─────────────────────────────────────────────────────── */}
        <FaqSection />

      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <Logo />
            <p>AI and Digital Design learning for architecture.</p>
          </div>
          <nav aria-label="Footer links">
            <a href="#platform">Platform</a>
            <Link href="/commands">Library</Link>
            <Link href="/catalog">Courses</Link>
            <a href="#workshops">Workshops</a>
            <a href="#pricing">Pricing</a>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/refunds">Refunds</Link>
          </nav>
          <span className="footer-copy">© 2026 ADDITION</span>
        </div>
      </footer>

      <Link className="mobile-sticky-cta" href="/auth?mode=signup">
        Start free <ArrowRight size={16} aria-hidden="true" />
      </Link>

      {modalItem && <WorkshopModal cohort={modalItem} onClose={() => setModalItem(null)} />}
      {enrollWorkshop && (
        <EnrolModal
          workshop={enrollWorkshop.sessions[0]}
          onClose={() => setEnrollWorkshop(null)}
          onProceedWithoutAccount={async () => {
            await buyLandingWorkshopNow(enrollWorkshop);
            setEnrollWorkshop(null);
          }}
        />
      )}
    </>
  );
}
