"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

export type ToastType = "success" | "info" | "streak" | "error";

export type Toast = {
  id: string;
  type: ToastType;
  title: string;
  body?: string;
  /** ms before auto-dismiss. Default 4000. */
  duration?: number;
};

type ShowToastFn = (toast: Omit<Toast, "id">) => void;

const ToastCtx = createContext<ShowToastFn>(() => {});

export function useToast(): ShowToastFn {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const show = useCallback<ShowToastFn>((toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const duration = toast.duration ?? 4000;
    setToasts((prev) => [...prev.slice(-2), { ...toast, id }]); // max 3 at once
    const timer = setTimeout(() => dismiss(id), duration);
    timers.current.set(id, timer);
  }, [dismiss]);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastCtx.Provider>
  );
}

// ── Toast container ──────────────────────────────────────────────────────────

const TYPE_ICONS: Record<ToastType, React.ReactNode> = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  streak: (
    <span aria-hidden="true" style={{ fontSize: 16, lineHeight: 1 }}>🔥</span>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
};

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" role="status" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`} onClick={() => onDismiss(t.id)}>
          <span className="toast-icon">{TYPE_ICONS[t.type]}</span>
          <div className="toast-body">
            <strong className="toast-title">{t.title}</strong>
            {t.body && <p className="toast-sub">{t.body}</p>}
          </div>
          <button
            type="button"
            className="toast-close"
            onClick={(e) => { e.stopPropagation(); onDismiss(t.id); }}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
