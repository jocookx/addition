"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  formatCartPrice,
  readWorkshopCart,
  removeWorkshopFromCart,
  workshopCartSubtotal,
  WORKSHOP_CART_EVENT,
  type WorkshopCartItem,
} from "@/lib/workshop-cart";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function WorkshopCartButton({ compact = false, sidebar = false }: { compact?: boolean; sidebar?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<WorkshopCartItem[]>(() => readWorkshopCart());

  useEffect(() => {
    function sync() {
      setItems(readWorkshopCart());
    }
    window.addEventListener(WORKSHOP_CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WORKSHOP_CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const subtotal = useMemo(() => workshopCartSubtotal(items), [items]);
  const memberSaving = Math.round(subtotal * 0.2);

  function remove(id: string) {
    setItems(removeWorkshopFromCart(id));
  }

  function checkout() {
    setOpen(false);
    router.push("/workshops/cart");
  }

  const drawer = open ? (
    <div className="workshop-cart-layer">
      <button type="button" className="workshop-cart-backdrop" onClick={() => setOpen(false)} aria-label="Close cart" />
      <aside className="workshop-cart-panel" aria-label="Workshop cart">
        <header className="workshop-cart-head">
          <div>
            <span>Workshop cart</span>
            <h2>{items.length ? `${items.length} item${items.length === 1 ? "" : "s"}` : "Cart is empty"}</h2>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close cart">x</button>
        </header>

        {items.length ? (
          <>
            <div className="workshop-cart-list">
              {items.map((item) => (
                <article key={item.id} className="workshop-cart-item">
                  {item.image ? <img src={item.image} alt="" aria-hidden="true" /> : <span className="workshop-cart-thumb" aria-hidden="true" />}
                  <div>
                    <strong>{item.title}</strong>
                    <span>{formatDate(item.date)}{item.time ? ` - ${item.time}` : ""}{item.duration ? ` - ${item.duration}` : ""}</span>
                    {item.tutorName ? <small>With {item.tutorName}</small> : null}
                  </div>
                  <div className="workshop-cart-item-side">
                    <b>{formatCartPrice(item.pricePence)}</b>
                    <button type="button" onClick={() => remove(item.id)}>Remove</button>
                  </div>
                </article>
              ))}
            </div>

            <div className="workshop-cart-member">
              <span className="workshop-cart-member-badge">Pro Member</span>
              <strong className="workshop-cart-member-heading">
                Save {memberSaving > 0 ? formatCartPrice(memberSaving) : "20%"} on this order
              </strong>
              <p className="workshop-cart-member-body">
                {memberSaving > 0
                  ? `Members pay 20% less — you'd save ${formatCartPrice(memberSaving)} on this order.`
                  : "Members save 20% on every workshop."}
              </p>
              <Link href="/auth?mode=signup&plan=pro" className="workshop-cart-member-cta">
                Become a member &rarr;
              </Link>
            </div>

            <footer className="workshop-cart-foot">
              <div><span>Subtotal</span><strong>{formatCartPrice(subtotal)}</strong></div>
              <button type="button" className="primary-button" onClick={checkout}>Checkout</button>
            </footer>
          </>
        ) : (
          <div className="workshop-cart-empty">
            <p>Add a live workshop to reserve a place.</p>
            <Link className="ghost-btn" href="/workshops" onClick={() => setOpen(false)}>Browse workshops</Link>
          </div>
        )}
      </aside>
    </div>
  ) : null;

  const cartIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h8.8a2 2 0 0 0 1.96-1.6l1.38-7.45H5.12" />
    </svg>
  );

  return (
    <>
      <button
        type="button"
        className={sidebar ? "sidebar-nav-btn sidebar-nav-btn-sm workshop-cart-trigger" : "workshop-cart-trigger"}
        onClick={() => setOpen(true)}
        aria-label={`Workshop cart, ${items.length} item${items.length === 1 ? "" : "s"}`}
      >
        {sidebar ? (
          <>
            {cartIcon}
            <span>Cart</span>
          </>
        ) : compact ? (
          cartIcon
        ) : (
          <span aria-hidden="true">Cart</span>
        )}
        {items.length > 0 ? <strong>{items.length}</strong> : null}
      </button>

      {drawer && typeof document !== "undefined" ? createPortal(drawer, document.body) : null}
    </>
  );
}
