import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund Policy | ADDITION",
  description: "Refund and cancellation policy for ADDITION memberships and workshops.",
};

export default function RefundsPage() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link className="legal-back" href="/">Back to ADDITION</Link>
        <p className="eyebrow">Refunds</p>
        <h1>Refund Policy</h1>
        <p className="legal-updated">Last updated: 14 May 2026</p>

        <section>
          <h2>Subscriptions</h2>
          <p>
            You can cancel a paid subscription before the next billing period. Access
            normally continues until the end of the period already paid for. Partial
            refunds are not guaranteed unless required by law.
          </p>
        </section>

        <section>
          <h2>Workshops</h2>
          <p>
            Workshop bookings include live attendance, replay access and related resources
            where available. If a workshop is cancelled by ADDITION, you will be offered a
            refund or transfer to another session.
          </p>
        </section>

        <section>
          <h2>Digital Content</h2>
          <p>
            Because ADDITION provides immediate access to digital learning content, refund
            requests are reviewed case by case. We may decline refunds where substantial
            access has already been used.
          </p>
        </section>
      </div>
    </main>
  );
}
