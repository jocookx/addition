import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | ADDITION",
  description: "How ADDITION handles account, learning and payment data.",
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link className="legal-back" href="/">Back to ADDITION</Link>
        <p className="eyebrow">Privacy</p>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: 14 May 2026</p>

        <section>
          <h2>What We Collect</h2>
          <p>
            We collect the information needed to run your account, provide learning content,
            track progress, manage workshop bookings and support your use of ADDITION.
            This can include your name, email address, plan status, learning activity,
            saved content, workshop registrations and support messages.
          </p>
        </section>

        <section>
          <h2>Payments</h2>
          <p>
            Payments are processed by Stripe. ADDITION does not store full card details.
            We store payment and subscription references needed to confirm access, bookings,
            invoices and plan status.
          </p>
        </section>

        <section>
          <h2>How We Use Data</h2>
          <p>
            We use data to provide the platform, show relevant courses and resources,
            improve content, manage accounts, process payments, prevent abuse and respond
            to support requests.
          </p>
        </section>

        <section>
          <h2>Your Choices</h2>
          <p>
            You can request access, correction or deletion of your personal data by
            contacting support. Some records may need to be retained for legal, tax,
            security or payment reconciliation reasons.
          </p>
        </section>
      </div>
    </main>
  );
}
