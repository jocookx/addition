"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to your error reporting service here if needed
    console.error(error);
  }, [error]);

  return (
    <main className="notfound-shell">
      <div className="notfound-card">
        <span className="notfound-code" aria-hidden="true">!</span>
        <h1 className="notfound-title">Something went wrong</h1>
        <p className="notfound-body">
          An unexpected error occurred. Try refreshing the page. If the problem
          persists, please contact support.
        </p>
        <div className="notfound-actions">
          <button type="button" className="primary-button" onClick={reset}>
            Try again
          </button>
          <Link href="/dashboard" className="ghost-btn" style={{ textDecoration: "none" }}>
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
