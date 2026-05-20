"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "@/domain/user-profile";
import { getAuthProfile } from "@/lib/api/auth-profile";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { AppFrame } from "@/components/legacy/AppFrame";

// ── helpers ──────────────────────────────────────────────────────────────────

function parseError(e: unknown): string {
  return e instanceof Error ? e.message : "Unexpected error.";
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  team: "Team",
};

// ── sub-components ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="panel settings-section">
      <h3 className="settings-section-title">{title}</h3>
      {children}
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="settings-field">
      <span className="settings-field-label">{label}</span>
      <span className="settings-field-value">{value || "—"}</span>
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();

  const [supabase] = useState<SupabaseClient | null>(() => getBrowserSupabaseClient());
  const [session, setSession] = useState<Session | null>(null);
  const [booted, setBooted] = useState(() => !getBrowserSupabaseClient());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadError, setLoadError] = useState("");
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetMsg, setResetMsg] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [signOutBusy, setSignOutBusy] = useState(false);

  // Auth
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setBooted(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  // Redirect if not authed
  useEffect(() => {
    if (!booted) return;
    if (!session) router.replace("/auth?next=/settings");
  }, [booted, session, router]);

  // Load profile
  useEffect(() => {
    const token = session?.access_token;
    if (!token) return;
    let canceled = false;
    getAuthProfile(token)
      .then((p) => { if (!canceled) setProfile(p); })
      .catch((e) => { if (!canceled) setLoadError(parseError(e)); });
    return () => { canceled = true; };
  }, [session?.access_token]);

  async function handleSignOut() {
    if (!supabase || signOutBusy) return;
    setSignOutBusy(true);
    await supabase.auth.signOut();
    router.replace("/");
  }

  async function handlePasswordReset() {
    if (!supabase || !session?.user.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(session.user.email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
    });
    setResetMsg(error ? parseError(error) : "Reset link sent — check your email.");
  }

  if (!booted || (!session && booted)) return null;

  const plan = profile?.plan ?? "free";
  const isPro = plan === "pro" || plan === "team";
  const userName = profile?.name || (session?.user.user_metadata?.name as string | undefined) || session?.user.email?.split("@")[0];

  return (
    <AppFrame
      title="Settings"
      subtitle="Manage your account and preferences."
      userName={userName}
      userEmail={profile?.email ?? session?.user.email}
      isPro={isPro}
      topTabs={[]}
    >
      {loadError && (
        <p className="meta" style={{ color: "var(--danger)", padding: "0 0 16px" }}>{loadError}</p>
      )}

      <div className="settings-layout">

        {/* Profile */}
        <Section title="Profile">
          <Field label="Name" value={profile?.name ?? (session?.user.user_metadata?.name as string | undefined) ?? ""} />
          <Field label="Email" value={profile?.email ?? session?.user.email ?? ""} />
          <Field label="Member since" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ""} />
          <div className="settings-action-row" style={{ marginTop: 16 }}>
            <button type="button" className="ghost-btn" onClick={() => void handlePasswordReset()}>
              Change password
            </button>
            {resetMsg && <span className="meta">{resetMsg}</span>}
          </div>
        </Section>

        {/* Subscription */}
        <Section title="Subscription">
          <div className="settings-plan-row">
            <span className={`plan-badge plan-badge--${plan}`}>{PLAN_LABELS[plan] ?? plan}</span>
            <span className="meta">
              {plan === "free"
                ? "Free plan — limited to core courses."
                : plan === "pro"
                ? "Pro plan — full access to all courses and commands."
                : "Team plan — full access + team features."}
            </span>
          </div>
          {!isPro && (
            <div style={{ marginTop: 16 }}>
              <Link href="/auth?mode=signup" className="primary-button" style={{ fontSize: 13, padding: "10px 20px" }}>
                Upgrade to Pro →
              </Link>
            </div>
          )}
        </Section>

        {/* Quick links */}
        <Section title="Quick access">
          <div className="settings-links">
            {[
              { href: "/dashboard", label: "Dashboard" },
              { href: "/learn",     label: "Course player" },
              { href: "/catalog",   label: "Course catalog" },
              { href: "/commands",  label: "Commands library" },
              { href: "/workshops", label: "Workshops" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="ghost-btn"
                style={{ display: "block", textAlign: "left", fontSize: 13, padding: "10px 14px" }}
              >
                {label} →
              </Link>
            ))}
          </div>
        </Section>

        {/* Danger zone */}
        <Section title="Account">
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
            {!resetConfirm ? (
              <button
                type="button"
                className="ghost-btn"
                style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                onClick={() => setResetConfirm(true)}
              >
                Reset all progress
              </button>
            ) : (
              <div className="settings-confirm-row">
                <span className="meta" style={{ color: "var(--danger)" }}>
                  This will erase all lesson progress and enrollments. Are you sure?
                </span>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    type="button"
                    className="primary-button"
                    style={{ background: "var(--danger)", borderColor: "var(--danger)" }}
                    disabled={resetBusy}
                    onClick={async () => {
                      if (!session?.access_token) return;
                      setResetBusy(true);
                      try {
                        const res = await fetch("/api/v1/user/reset-progress", {
                          method: "DELETE",
                          headers: { Authorization: `Bearer ${session.access_token}` },
                        });
                        setResetConfirm(false);
                        setResetMsg(res.ok ? "Progress reset. Your account is now clean." : "Reset failed — try again.");
                      } catch {
                        setResetMsg("Reset failed — try again.");
                      } finally {
                        setResetBusy(false);
                      }
                    }}
                  >
                    {resetBusy ? "Resetting…" : "Yes, reset"}
                  </button>
                  <button type="button" className="ghost-btn" onClick={() => setResetConfirm(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {resetMsg && <span className="meta" style={{ color: resetMsg.includes("failed") ? "var(--danger)" : "var(--success)" }}>{resetMsg}</span>}

            <button
              type="button"
              className="ghost-btn"
              onClick={() => void handleSignOut()}
              disabled={signOutBusy}
            >
              {signOutBusy ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </Section>

      </div>
    </AppFrame>
  );
}
