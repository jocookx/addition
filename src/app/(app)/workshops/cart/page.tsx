"use client";

/* eslint-disable @next/next/no-img-element --
   Workshop artwork is CMS-provided and may use arbitrary remote hosts. */

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppFrame } from "@/components/legacy/AppFrame";
import { getWorkshopCartCheckoutUrl } from "@/lib/api/workshops";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import {
  formatCartPrice,
  readWorkshopCart,
  removeWorkshopFromCart,
  workshopCartSubtotal,
  type WorkshopCartItem,
} from "@/lib/workshop-cart";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function WorkshopCartPage() {
  const [items, setItems] = useState<WorkshopCartItem[]>(() => readWorkshopCart());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const subtotal = useMemo(() => workshopCartSubtotal(items), [items]);
  const memberSaving = Math.round(subtotal * 0.2);

  function remove(id: string) {
    setItems(removeWorkshopFromCart(id));
  }

  async function checkout() {
    setBusy(true);
    setMessage("");
    const supabase = getBrowserSupabaseClient();
    const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    const token = data.session?.access_token;
    try {
      const url = await getWorkshopCartCheckoutUrl(items.map((item) => item.id), token);
      window.location.href = url;
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not start checkout.");
      setBusy(false);
    }
  }

  return (
    <AppFrame title="" subtitle="" topTabs={[]} hideTopbar>
      <main className="workshop-cart-page">
        <div className="workshop-cart-page-head">
          <Link href="/workshops" className="ws-det-back">Back to workshops</Link>
          <h1>Workshop cart</h1>
          <p>Review your live sessions before checkout.</p>
        </div>

        {items.length ? (
          <div className="workshop-cart-page-grid">
            <section className="workshop-cart-page-list">
              {items.map((item) => (
                <article key={item.id} className="workshop-cart-page-item glass-panel">
                  {item.image ? <img src={item.image} alt="" aria-hidden="true" /> : <span className="workshop-cart-page-thumb" />}
                  <div>
                    <h2>{item.title}</h2>
                    <p>{formatDate(item.date)}{item.time ? ` · ${item.time}` : ""}{item.timezone ? ` ${item.timezone}` : ""}</p>
                    <p>{item.duration}{item.tutorName ? ` · With ${item.tutorName}` : ""}</p>
                  </div>
                  <div className="workshop-cart-page-item-side">
                    <strong>{formatCartPrice(item.pricePence)}</strong>
                    <button type="button" onClick={() => remove(item.id)}>Remove</button>
                  </div>
                </article>
              ))}
            </section>

            <div className="workshop-cart-sidebar">
              <div className="workshop-cart-promo-card">
                <span className="workshop-cart-promo-badge">Pro Member</span>
                <strong className="workshop-cart-promo-heading">
                  Save {memberSaving > 0 ? formatCartPrice(memberSaving) : "20%"} on this order
                </strong>
                <p className="workshop-cart-promo-body">
                  Members get 20% off every workshop, plus full platform access, courses, workshop replays and learning paths.
                </p>
                <Link href="/auth?mode=signup&plan=pro&next=/workshops/cart" className="workshop-cart-promo-cta">
                  Become a member &rarr;
                </Link>
              </div>

              <aside className="workshop-cart-summary glass-panel">
                <span>Order summary</span>
                <div><small>Subtotal</small><strong>{formatCartPrice(subtotal)}</strong></div>
                <div><small>Member saving</small><strong className="workshop-cart-saving">{formatCartPrice(memberSaving)}</strong></div>
                {message ? <p className="workshop-cart-error">{message}</p> : null}
                <button type="button" className="primary-button" onClick={() => void checkout()} disabled={busy || !items.length}>
                  {busy ? "Opening checkout..." : "Checkout"}
                </button>
              </aside>
            </div>
          </div>
        ) : (
          <section className="workshop-cart-page-empty glass-panel">
            <h2>Your cart is empty</h2>
            <p>Add a workshop to reserve a place.</p>
            <Link href="/workshops" className="primary-button">Browse workshops</Link>
          </section>
        )}
      </main>
    </AppFrame>
  );
}
