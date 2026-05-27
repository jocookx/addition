"use client";

import { useEffect, useLayoutEffect, useState } from "react";

const STORAGE_PREFIX = "addition_tip_v1_";

export type TipDef = {
  /** Section key — also used as localStorage key suffix */
  accent: string;
  /** href of the nav / segment-tab link to anchor the arrow to */
  navHref: string;
  icon: React.ReactNode;
  title: string;
  body: string;
};

type Pos = {
  top: number;
  left: number;
  arrowDir: "left" | "up" | "down";
  arrowOffset: number; // px from left (up/down) or top (left) for the arrow tip
};

/** Resolves the popup position relative to the given nav anchor element. */
function resolvePos(anchor: HTMLElement, popupW = 288, popupH = 148): Pos {
  const r = anchor.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Sidebar items live in the left ~260 px
  if (r.left < 260 && r.right < 280) {
    // Arrow points LEFT, popup sits to the right of the sidebar.
    // Clamp left so the card never starts inside the sidebar column (260px wide).
    const SIDEBAR_W = 260;
    const top = Math.min(
      Math.max(r.top + r.height / 2 - popupH / 2, 12),
      vh - popupH - 12,
    );
    const left = Math.max(r.right + 16, SIDEBAR_W + 16);
    const arrowOffset = r.top + r.height / 2 - top;
    return { top, left, arrowDir: "left", arrowOffset };
  }

  // Bottom mobile nav (below 80% of screen height)
  if (r.top > vh * 0.8) {
    const left = Math.min(
      Math.max(r.left + r.width / 2 - popupW / 2, 12),
      vw - popupW - 12,
    );
    const top = r.top - popupH - 16;
    const arrowOffset = r.left + r.width / 2 - left;
    return { top, left, arrowDir: "down", arrowOffset };
  }

  // Top toolbar tabs — arrow points UP, popup sits below
  const left = Math.min(
    Math.max(r.left + r.width / 2 - popupW / 2, 12),
    vw - popupW - 12,
  );
  const top = r.bottom + 14;
  const arrowOffset = r.left + r.width / 2 - left;
  return { top, left, arrowDir: "up", arrowOffset };
}

export function FirstVisitTip({ section, tip }: { section: string; tip: TipDef }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);

  // Gate on localStorage — client only
  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_PREFIX + section)) {
        window.setTimeout(() => setVisible(true), 0);
      }
    } catch {
      // localStorage blocked — skip tip
    }
  }, [section]);

  // Measure anchor AFTER paint so layout is complete
  useLayoutEffect(() => {
    if (!visible) return;

    function measure() {
      const anchor = document.querySelector<HTMLElement>(`a[href="${tip.navHref}"]`);
      if (anchor) setPos(resolvePos(anchor));
    }

    measure();
    // Re-measure if sidebar expands / collapses or window resizes
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [visible, tip.navHref]);

  function dismiss() {
    setLeaving(true);
    try { localStorage.setItem(STORAGE_PREFIX + section, "1"); } catch { /* ignore */ }
    setTimeout(() => setVisible(false), 280);
  }

  if (!visible) return null;

  // While measuring, render off-screen so we can measure without a flash
  const style: React.CSSProperties = pos
    ? { top: pos.top, left: pos.left }
    : { top: -9999, left: -9999, pointerEvents: "none" };

  return (
    <>
      {/* Soft backdrop — dimly highlights the popup area */}
      {pos && (
        <div
          className={`fvt-scrim${leaving ? " fvt-scrim--out" : ""}`}
          onClick={dismiss}
          aria-hidden="true"
        />
      )}

      <div
        className={`fvt fvt--${tip.accent}${pos ? ` fvt--arrow-${pos.arrowDir}` : ""}${leaving ? " fvt--out" : " fvt--in"}`}
        style={{
          ...style,
          ...(pos?.arrowDir !== "left"
            ? { "--fvt-arrow-x": `${pos?.arrowOffset ?? 40}px` } as React.CSSProperties
            : { "--fvt-arrow-y": `${pos?.arrowOffset ?? 40}px` } as React.CSSProperties),
        }}
        role="dialog"
        aria-modal="false"
        aria-label={tip.title}
      >
        {/* Step pip + icon row */}
        <div className="fvt-header">
          <span className="fvt-icon-wrap" aria-hidden="true">{tip.icon}</span>
          <span className="fvt-label">Quick tip</span>
        </div>

        <strong className="fvt-title">{tip.title}</strong>
        <p className="fvt-body">{tip.body}</p>

        <div className="fvt-foot">
          <button type="button" className="fvt-got-it" onClick={dismiss}>
            Got it
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          <button type="button" className="fvt-skip" onClick={dismiss} aria-label="Dismiss">
            ✕
          </button>
        </div>
      </div>
    </>
  );
}
