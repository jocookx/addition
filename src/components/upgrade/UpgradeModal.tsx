"use client";

import { useState, useCallback, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import {
  getBillingClientSecret,
  getBillingCheckoutUrl,
  getPlanPrices,
  type BillingPlan,
  type BillingInterval,
  type PlanPrice,
} from "@/lib/api/billing";

// ── Stripe singleton ─────────────────────────────────────────────────────────

let _stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripePromise() {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return null;
  if (!_stripePromise) _stripePromise = loadStripe(key);
  return _stripePromise;
}

// ── Price formatting ─────────────────────────────────────────────────────────

function formatPrice(amount: number, currency: string, decimals = false): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(amount / 100);
}

// ── Plan features ────────────────────────────────────────────────────────────

const PRO_FEATURES = [
  "Full access to all courses",
  "All keyboard combo shortcuts",
  "Structured learning paths",
  "Practice & quiz mode",
  "Priority workshop booking",
];

const STUDENT_FEATURES = [
  "Everything in Pro",
  "Discounted student rate",
  "Verified student accounts only",
];

// ── Sub-components ───────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PlanCard({
  plan,
  selected,
  interval,
  prices,
  features,
  badge,
  note,
  onSelect,
}: {
  plan: BillingPlan;
  selected: boolean;
  interval: BillingInterval;
  prices: PlanPrice[];
  features: string[];
  badge?: string;
  note?: string;
  onSelect: () => void;
}) {
  const monthly = prices.find((p) => p.plan === plan && p.interval === "monthly");
  const yearly = prices.find((p) => p.plan === plan && p.interval === "yearly");
  const shown = interval === "monthly" ? monthly : yearly;

  const savingsPct =
    monthly && yearly
      ? Math.round(100 - (yearly.amount / (monthly.amount * 12)) * 100)
      : null;

  const perMonthIfYearly =
    interval === "yearly" && yearly
      ? formatPrice(Math.round(yearly.amount / 12), yearly.currency)
      : null;

  return (
    <button
      type="button"
      className={`upgrade-plan-card${selected ? " selected" : ""}${plan === "student" ? " upgrade-plan-card--student" : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      {/* Card header */}
      <div className="upgrade-plan-card-head">
        <div className="upgrade-plan-card-title-row">
          <span className="upgrade-plan-name">{plan === "pro" ? "Pro" : "Student"}</span>
          {badge && <span className="upgrade-plan-badge">{badge}</span>}
        </div>
        <span className={`upgrade-plan-radio${selected ? " upgrade-plan-radio--on" : ""}`} aria-hidden="true" />
      </div>

      {/* Price */}
      <div className="upgrade-plan-price-row">
        {shown ? (
          <>
            <span className="upgrade-plan-amount">
              {interval === "yearly" && perMonthIfYearly ? perMonthIfYearly : formatPrice(shown.amount, shown.currency)}
            </span>
            <span className="upgrade-plan-per">/{interval === "yearly" ? "mo" : "mo"}</span>
            {interval === "yearly" && (
              <span className="upgrade-plan-billed-note">billed yearly</span>
            )}
          </>
        ) : (
          <span className="upgrade-plan-amount upgrade-plan-amount--unknown">—</span>
        )}
      </div>

      {/* Yearly savings pill */}
      {interval === "yearly" && savingsPct && savingsPct > 0 ? (
        <div className="upgrade-plan-savings">Save {savingsPct}% vs monthly</div>
      ) : null}

      {/* Features */}
      <ul className="upgrade-plan-features">
        {features.map((f) => (
          <li key={f}>
            <CheckIcon />
            {f}
          </li>
        ))}
      </ul>

      {/* Student-only note */}
      {note && <p className="upgrade-plan-note">{note}</p>}
    </button>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

type Props = {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  returnTo?: string;
};

export function UpgradeModal({ isOpen, onClose, accessToken, returnTo = "/dashboard" }: Props) {
  const [step, setStep] = useState<"select" | "checkout">("select");
  const [plan, setPlan] = useState<BillingPlan>("pro");
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [prices, setPrices] = useState<PlanPrice[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialise when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setStep("select");
    setClientSecret(null);
    setError(null);
    setBusy(false);
    setStripePromise(getStripePromise());
    void getPlanPrices().then(setPrices);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleContinue = useCallback(async () => {
    if (!accessToken) return;
    setBusy(true);
    setError(null);

    try {
      if (stripePromise) {
        // Embedded checkout
        const secret = await getBillingClientSecret(plan, interval, accessToken, returnTo);
        setClientSecret(secret);
        setStep("checkout");
      } else {
        // Fallback: redirect to hosted checkout
        const url = await getBillingCheckoutUrl(plan, accessToken, returnTo, interval);
        window.location.href = url;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not open checkout";
      if (msg.includes("403") || msg.toLowerCase().includes("approved") || msg.toLowerCase().includes("student")) {
        setError(
          "Your student status hasn't been approved yet. Go to Settings → Student Verification to apply.",
        );
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }, [accessToken, interval, plan, returnTo, stripePromise]);

  if (!isOpen) return null;

  return (
    <div
      className="upgrade-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className={`upgrade-modal${step === "checkout" ? " upgrade-modal--checkout" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Choose a plan"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button type="button" className="upgrade-modal-close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* ── Step 1: Plan selection ── */}
        {step === "select" && (
          <div className="upgrade-select">
            <div className="upgrade-select-head">
              <h2 className="upgrade-select-title">Upgrade your plan</h2>
              <p className="upgrade-select-sub">
                Get full access to every course, combo shortcut, and learning path.
              </p>
            </div>

            {/* Billing interval toggle */}
            <div className="upgrade-billing-toggle" role="group" aria-label="Billing interval">
              <button
                type="button"
                className={`upgrade-toggle-btn${interval === "monthly" ? " active" : ""}`}
                onClick={() => setInterval("monthly")}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`upgrade-toggle-btn${interval === "yearly" ? " active" : ""}`}
                onClick={() => setInterval("yearly")}
              >
                Yearly
                <span className="upgrade-toggle-save">save ~20%</span>
              </button>
            </div>

            {/* Plan cards */}
            <div className="upgrade-plan-cards">
              <PlanCard
                plan="pro"
                selected={plan === "pro"}
                interval={interval}
                prices={prices}
                features={PRO_FEATURES}
                badge="Most popular"
                onSelect={() => setPlan("pro")}
              />
              <PlanCard
                plan="student"
                selected={plan === "student"}
                interval={interval}
                prices={prices}
                features={STUDENT_FEATURES}
                note="Requires approved student verification in Settings."
                onSelect={() => setPlan("student")}
              />
            </div>

            {error && <p className="upgrade-modal-error">{error}</p>}

            <div className="upgrade-select-actions">
              <button
                type="button"
                className="primary-button upgrade-continue-btn"
                onClick={() => void handleContinue()}
                disabled={busy || !accessToken}
              >
                {busy
                  ? "Loading…"
                  : `Continue with ${plan === "pro" ? "Pro" : "Student"} →`}
              </button>
              <button type="button" className="ghost-btn" onClick={onClose}>
                Not now
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Embedded checkout ── */}
        {step === "checkout" && clientSecret && stripePromise && (
          <div className="upgrade-checkout-wrap">
            <button
              type="button"
              className="upgrade-back-btn"
              onClick={() => {
                setStep("select");
                setClientSecret(null);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to plans
            </button>
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ clientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}
      </div>
    </div>
  );
}
