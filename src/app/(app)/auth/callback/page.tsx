"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ensureAuthProfile } from "@/lib/api/auth-profile";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

function parseError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unexpected error.";
}

function getWorkshopCheckoutPath(path: string) {
  return path.includes("/checkout") ? path : `${path.replace(/\/$/, "")}/checkout`;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  // Initialise synchronously so we never need to call setErrorMsg inside an effect body
  const [errorMsg, setErrorMsg] = useState(() =>
    typeof window !== "undefined" && !getBrowserSupabaseClient()
      ? "Supabase is not configured."
      : ""
  );

  useEffect(() => {
    if (errorMsg) return; // already in an error state, nothing to do
    const supabase = getBrowserSupabaseClient()!;

    const params = new URLSearchParams(window.location.search);
    const next = params.get("next")?.trim();
    const plan = params.get("plan");
    const billingInterval = params.get("billing") === "yearly" ? "yearly" : "monthly";
    const nextPath = next && next.startsWith("/") ? next : "/dashboard";

    let canceled = false;
    let proceeded = false;

    async function proceed(token: string) {
      if (canceled || proceeded) return;
      proceeded = true;
      try {
        if (nextPath.includes("/workshops/")) {
          router.replace(getWorkshopCheckoutPath(nextPath));
          return;
        }
        await ensureAuthProfile(token);
        if (nextPath === "/workshops/cart") {
          router.replace(nextPath);
          return;
        }
        if (plan === "pro") {
          router.replace(`/dashboard?gateway=pro&billing=${billingInterval}`);
          return;
        }
        if (plan === "student") {
          router.replace(`/dashboard?gateway=student&billing=${billingInterval}`);
          return;
        }
        router.replace("/dashboard?gateway=welcome");
      } catch (err) {
        if (!canceled) setErrorMsg(parseError(err));
      }
    }

    // With flowType:"pkce" + detectSessionInUrl:true, the Supabase client
    // automatically exchanges the ?code= for a session on initialisation.
    // We must NOT call exchangeCodeForSession manually — doing so consumes the
    // code verifier a second time and causes "PKCE code verifier not found".
    // Instead, listen for SIGNED_IN which fires once the auto-exchange completes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        subscription.unsubscribe();
        void proceed(session.access_token);
      }
    });

    // Also check immediately — detectSessionInUrl may have already resolved
    // before our listener was registered.
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) void proceed(data.session.access_token);
    });

    // Timeout safety net
    const timeout = setTimeout(() => {
      if (!proceeded && !canceled) setErrorMsg("Sign-in timed out — please try again.");
    }, 12000);

    return () => {
      canceled = true;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router, errorMsg]);

  return (
    <main className="auth">
      <div className="auth-card">
        <div className="auth-form">
          <div className="auth-simple-intro">
            <div className="auth-simple-logo auth-simple-logo--loading" aria-hidden="true">
              <span className="auth-hourglass" />
            </div>
            <h1>Signing you in…</h1>
          </div>
          {errorMsg && <p className="auth-msg auth-msg--error">{errorMsg}</p>}
        </div>
      </div>
    </main>
  );
}
