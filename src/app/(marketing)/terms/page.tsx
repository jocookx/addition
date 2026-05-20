import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | ADDITION",
  description: "Terms for using ADDITION courses, command libraries and workshops.",
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link className="legal-back" href="/">Back to ADDITION</Link>
        <p className="eyebrow">Terms</p>
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: 14 May 2026</p>

        <section>
          <h2>Using ADDITION</h2>
          <p>
            ADDITION provides digital learning content, command libraries, courses,
            learning paths, practice materials and live workshops for architecture and
            design software education.
          </p>
        </section>

        <section>
          <h2>Accounts</h2>
          <p>
            You are responsible for keeping your account secure and for providing accurate
            information. Admin and CMS access is restricted to authorised ADDITION team
            members only.
          </p>
        </section>

        <section>
          <h2>Content Access</h2>
          <p>
            Free accounts include access to the command library and free learning
            resources. Paid plans, student plans and workshops may unlock additional
            courses, paths, files, replays and certificates.
          </p>
        </section>

        <section>
          <h2>Intellectual Property</h2>
          <p>
            Course videos, scripts, resources, command explanations, workshop material and
            platform content remain owned by ADDITION or its licensors. You may use the
            material for your own learning, but you may not resell, redistribute or
            republish it without permission.
          </p>
        </section>
      </div>
    </main>
  );
}
