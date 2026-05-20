"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useMemo, useState } from "react";
import type { WorkshopListItem } from "@/domain/workshop";
import {
  getWorkshopEmbeddedCheckoutClientSecret,
  getWorkshopRegisterUrl,
  getWorkshops,
} from "@/lib/api/workshops";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

function getCohortId(wsId: string) {
  return wsId.replace(/^ws-/, "").replace(/-w\d+[a-z]$/, "");
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatPrice(pricePence: number | null | undefined) {
  const price = Number(pricePence ?? 0);
  return price > 0 ? `£${price / 100}` : "Free";
}

function IcoBack() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function IcoLock() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function WorkshopCheckoutPage() {
  const params = useParams<{ cohortId: string }>();
  const router = useRouter();
  const cohortId = params.cohortId;

  const [sessions, setSessions] = useState<WorkshopListItem[]>([]);
  const [selected, setSelected] = useState<WorkshopListItem | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [fallbackBusy, setFallbackBusy] = useState(false);

  useEffect(() => {
    let canceled = false;

    async function loadCheckout() {
      setLoading(true);
      setMessage("");

      const supabase = getBrowserSupabaseClient();
      if (!supabase) {
        setMessage("Unable to access the auth client.");
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        const params = new URLSearchParams({ next: `/workshops/${cohortId}/checkout` });
        router.push(`/auth?${params.toString()}`);
        return;
      }

      try {
        const all = await getWorkshops({ upcoming: false });
        if (canceled) return;
        const cohort = all
          .filter((item) => getCohortId(item.id) === cohortId)
          .sort((a, b) => a.date.localeCompare(b.date));
        const upcoming = cohort.find((item) => item.upcoming) ?? cohort[0] ?? null;
        if (!upcoming) {
          setMessage("Workshop not found.");
          setLoading(false);
          return;
        }

        setSessions(cohort);
        setSelected(upcoming);
        setAccessToken(token);

        if (Number(upcoming.pricePence ?? 0) <= 0) {
          setMessage("This workshop is free. Complete registration to reserve your place.");
          setLoading(false);
          return;
        }

        if (!stripePublishableKey) {
          setMessage("Embedded Stripe checkout needs NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.");
          setLoading(false);
          return;
        }

        const secret = await getWorkshopEmbeddedCheckoutClientSecret(upcoming.id, token);
        if (canceled) return;
        setClientSecret(secret);
      } catch (err) {
        if (!canceled) {
          setMessage(err instanceof Error ? err.message : "Could not start checkout.");
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    void loadCheckout();
    return () => { canceled = true; };
  }, [cohortId, router]);

  const title = selected?.track || selected?.title || "Workshop";
  const price = formatPrice(selected?.pricePence);
  const software = useMemo(() => Array.from(new Set(sessions.flatMap((item) => item.software))), [sessions]);
  const isFree = Number(selected?.pricePence ?? 0) <= 0;

  async function continueHostedCheckout() {
    if (!selected || !accessToken) return;
    setFallbackBusy(true);
    setMessage("");
    try {
      const url = await getWorkshopRegisterUrl(selected.id, accessToken);
      window.location.href = url;
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not start hosted checkout.");
      setFallbackBusy(false);
    }
  }

  return (
      <main className="ws-checkout ws-checkout-modal-screen">
        <div className="ws-det-breadcrumb">
          <Link href={`/workshops/${cohortId}`} className="ws-det-back">
            <IcoBack /> Workshop
          </Link>
        </div>

        <div className="ws-checkout-grid">
          <section className="ws-checkout-summary glass-panel">
            <div className="ws-checkout-image">
              {selected?.image ? (
                <Image src={selected.image} alt={title} fill unoptimized style={{ objectFit: "cover" }} />
              ) : (
                <div className="ws-checkout-image-fallback" />
              )}
              <div className="ws-checkout-image-shade" />
              <div className="ws-checkout-image-copy">
                <span className="ws-badge ws-badge-inperson">
                  {selected?.format === "online" ? "Online" : "In Person"}
                </span>
                <h1>{title}</h1>
              </div>
            </div>

            <div className="ws-checkout-summary-body">
              <div className="ws-checkout-price-row">
                <span>{price}</span>
                <small>per person</small>
              </div>

              <div className="ws-checkout-facts">
                {selected?.date && (
                  <div>
                    <small>Date</small>
                    <strong>{fmtShort(selected.date)}</strong>
                  </div>
                )}
                {selected?.time && (
                  <div>
                    <small>Time</small>
                    <strong>{selected.time}{selected.timezone ? ` ${selected.timezone}` : ""}</strong>
                  </div>
                )}
                {selected?.duration && (
                  <div>
                    <small>Duration</small>
                    <strong>{selected.duration}</strong>
                  </div>
                )}
                {selected?.capacity ? (
                  <div>
                    <small>Capacity</small>
                    <strong>{selected.capacity} seats</strong>
                  </div>
                ) : null}
              </div>

              {software.length > 0 && (
                <div className="ws-checkout-pills">
                  {software.map((item) => <span key={item}>{item}</span>)}
                </div>
              )}

              <p className="ws-checkout-secure"><IcoLock /> Payment details are handled securely by Stripe.</p>
            </div>
          </section>

          <section className="ws-checkout-payment glass-panel">
            <div className="ws-checkout-payment-head">
              <span>Secure checkout</span>
              <strong>{price}</strong>
            </div>

            {loading ? (
              <div className="ws-checkout-state">
                <div className="ws-loading-pulse" style={{ height: 420 }} />
              </div>
            ) : clientSecret && stripePromise ? (
              <div className="ws-checkout-embed">
                <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
            ) : (
              <div className="ws-checkout-state ws-checkout-state--notice">
                <h2>Embedded checkout is almost ready</h2>
                <p>{message || "Stripe needs to be configured before this page can show the embedded payment form."}</p>
                {selected && accessToken && (
                  <button
                    type="button"
                    className="primary-button ws-det-register-btn"
                    onClick={() => void continueHostedCheckout()}
                    disabled={fallbackBusy}
                  >
                    {fallbackBusy ? "Opening..." : isFree ? "Complete free registration" : "Continue with hosted Stripe checkout"}
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
  );
}
