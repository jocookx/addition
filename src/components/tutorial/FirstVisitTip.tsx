"use client";

import { useEffect, useState } from "react";

const STORAGE_PREFIX = "addition_tip_v1_";

export type TipDef = {
  /** Accent colour class: "accent-learn" | "accent-paths" | "accent-workshops" | "accent-commands" | "accent-combos" | "accent-practice" */
  accent: string;
  icon: React.ReactNode;
  title: string;
  body: string;
};

export function FirstVisitTip({ section, tip }: { section: string; tip: TipDef }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Check localStorage only on the client — avoids SSR mismatch
  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_PREFIX + section)) {
        setVisible(true);
      }
    } catch {
      // localStorage blocked (private browsing, etc.) — just don't show
    }
  }, [section]);

  function dismiss() {
    setLeaving(true);
    try { localStorage.setItem(STORAGE_PREFIX + section, "1"); } catch { /* ignore */ }
    setTimeout(() => setVisible(false), 300);
  }

  if (!visible) return null;

  return (
    <div
      className={`fvt fvt--${tip.accent}${leaving ? " fvt--leaving" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="fvt-icon" aria-hidden="true">{tip.icon}</span>
      <div className="fvt-body">
        <strong className="fvt-title">{tip.title}</strong>
        <p className="fvt-text">{tip.body}</p>
      </div>
      <button
        type="button"
        className="fvt-dismiss"
        onClick={dismiss}
        aria-label="Dismiss tip"
      >
        Got it
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
