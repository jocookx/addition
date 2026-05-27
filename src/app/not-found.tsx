import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="notfound-shell">
      <div className="notfound-card">
        <span className="notfound-code" aria-hidden="true">404</span>
        <h1 className="notfound-title">Page not found</h1>
        <p className="notfound-body">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <div className="notfound-actions">
          <Link href="/dashboard" className="primary-button" style={{ textDecoration: "none" }}>
            Go to Dashboard
          </Link>
          <Link href="/learn" className="ghost-btn" style={{ textDecoration: "none" }}>
            Browse courses
          </Link>
        </div>
      </div>
    </main>
  );
}
