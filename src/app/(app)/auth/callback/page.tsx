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
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const maybeClient = getBrowserSupabaseClient();
    if (!maybeClient) {
      setErrorMsg("Supabase is not configured.");
      return;
    }
    const supabase = maybeClient;

    let canceled = false;
    async function run() {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const next = params.get("next")?.trim();
        const plan = params.get("plan");
        const billingInterval = params.get("billing") === "yearly" ? "yearly" : "monthly";
        const nextPath = next && next.startsWith("/") ? next : "/dashboard";

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw new Error(error.message);
        }

        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) throw new Error("No active session found.");

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
        if (!canceled) router.replace("/dashboard?gateway=welcome");
      } catch (error) {
        if (!canceled) setErrorMsg(parseError(error));
      }
    }
    void run();

    return () => { canceled = true; };
  }, [router]);

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
