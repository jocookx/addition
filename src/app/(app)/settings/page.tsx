"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "@/domain/user-profile";
import { getAuthProfile, updateAuthProfile } from "@/lib/api/auth-profile";
import { getBillingPortalUrl } from "@/lib/api/billing";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { AppFrame } from "@/components/legacy/AppFrame";

type StudentVerification = {
  status: "not_started" | "pending" | "approved" | "rejected";
  email?: string;
  institution?: string;
  reviewNotes?: string;
  submittedAt?: string | null;
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  team: "Team",
  student: "Student",
};

const LEVELS = [
  { value: "explorer", label: "Explorer" },
  { value: "improver", label: "Improver" },
  { value: "refiner", label: "Refiner" },
];

const GOALS = [
  { value: "", label: "Not set" },
  { value: "learn_rhino", label: "Learn Rhino" },
  { value: "learn_revit", label: "Learn Revit" },
  { value: "learn_grasshopper", label: "Learn Grasshopper" },
  { value: "ai_digital_design", label: "AI digital design" },
  { value: "workshop_training", label: "Workshop training" },
  { value: "career_development", label: "Career development" },
];

const SOFTWARE = ["Rhino", "Grasshopper", "Revit", "Blender", "AI"];

const ROLES = [
  "Architecture student",
  "Interior design student",
  "Architect",
  "Interior designer",
  "Product designer",
  "Fashion designer",
  "Other",
];

function parseError(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error.";
}

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="panel settings-section">
      <h3 className="settings-section-title">{title}</h3>
      {children}
    </article>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsPageInner />
    </Suspense>
  );
}

function SettingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState<SupabaseClient | null>(() => getBrowserSupabaseClient());
  const [session, setSession] = useState<Session | null>(null);
  const [booted, setBooted] = useState(() => !getBrowserSupabaseClient());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [verification, setVerification] = useState<StudentVerification>({ status: "not_started" });
  const [form, setForm] = useState({
    name: "",
    phone: "",
    organisation: "",
    role: "",
    timezone: "Europe/London",
    softwarePreferences: [] as string[],
    level: "explorer" as UserProfile["level"],
    primaryGoal: "" as UserProfile["primaryGoal"],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [billingBusy, setBillingBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setBooted(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!booted) return;
    if (!session) router.replace("/auth?next=/settings");
  }, [booted, session, router]);

  useEffect(() => {
    const token = session?.access_token;
    if (!token) return;
    let canceled = false;
    setLoading(true);
    Promise.all([
      getAuthProfile(token),
      fetch("/api/v1/auth/student-verify", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.ok ? res.json() as Promise<{ verification: StudentVerification }> : { verification: { status: "not_started" as const } }),
    ])
      .then(([nextProfile, student]) => {
        if (canceled) return;
        setProfile(nextProfile);
        setVerification(student.verification);
        setForm({
          name: nextProfile.name,
          phone: nextProfile.phone,
          organisation: nextProfile.organisation,
          role: nextProfile.role,
          timezone: nextProfile.timezone || "Europe/London",
          softwarePreferences: nextProfile.softwarePreferences,
          level: nextProfile.level,
          primaryGoal: nextProfile.primaryGoal,
        });
        setError("");
      })
      .catch((err) => {
        if (!canceled) setError(parseError(err));
      })
      .finally(() => {
        if (!canceled) setLoading(false);
      });
    return () => { canceled = true; };
  }, [session?.access_token]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") setMessage("Subscription updated.");
    if (checkout === "cancelled") setMessage("Checkout cancelled. No changes were made.");
  }, [searchParams]);

  const plan = profile?.plan ?? "free";
  const isPaid = plan === "pro" || plan === "team" || plan === "student";
  const subscriptionStatus = profile?.subscriptionStatus ?? "inactive";
  const userName = profile?.name || session?.user.email?.split("@")[0] || "Learner";

  const profileValid = useMemo(() => form.name.trim().length >= 2, [form.name]);

  async function saveProfile() {
    const token = session?.access_token;
    if (!token || !profileValid) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const next = await updateAuthProfile(token, form);
      setProfile(next);
      setMessage("Account updated.");
    } catch (err) {
      setError(parseError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordReset() {
    if (!supabase || !session?.user.email) return;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(session.user.email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
    });
    setResetMsg(resetError ? parseError(resetError) : "Reset link sent. Check your email.");
  }

  async function openBillingPortal() {
    const token = session?.access_token;
    if (!token) return;
    setBillingBusy(true);
    setError("");
    try {
      const url = await getBillingPortalUrl(token, "/settings");
      window.location.href = url;
    } catch (err) {
      setError(parseError(err));
    } finally {
      setBillingBusy(false);
    }
  }

  function toggleSoftware(value: string) {
    setForm((current) => ({
      ...current,
      softwarePreferences: current.softwarePreferences.includes(value)
        ? current.softwarePreferences.filter((item) => item !== value)
        : [...current.softwarePreferences, value],
    }));
  }

  if (!booted || (!session && booted)) return null;

  return (
    <AppFrame
      title="Settings"
      subtitle="Account, access and learning preferences."
      userName={userName}
      userEmail={profile?.email ?? session?.user.email}
      isPro={isPaid}
      topTabs={[]}
    >
      {error ? <p className="meta" style={{ color: "var(--danger)", paddingBottom: 12 }}>{error}</p> : null}
      {message ? <p className="meta" style={{ color: "var(--success)", paddingBottom: 12 }}>{message}</p> : null}

      <div className="settings-layout">
        <SettingsCard title="Profile">
          <div className="aa-form-grid">
            <label><span>Name</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} disabled={loading} /></label>
            <label><span>Email</span><input value={profile?.email ?? session?.user.email ?? ""} disabled readOnly /></label>
            <label><span>Phone</span><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} disabled={loading} /></label>
            <label><span>Organisation / school / company</span><input value={form.organisation} onChange={(event) => setForm({ ...form, organisation: event.target.value })} disabled={loading} /></label>
            <label style={{ gridColumn: "1 / -1" }}>
              <span>Role</span>
              <div className="aa-chip-list" style={{ marginTop: 8 }}>
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`ghost-btn${form.role === r ? " active" : ""}`}
                    onClick={() => setForm({ ...form, role: r })}
                    disabled={loading}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </label>
            <label><span>Timezone</span><input value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} disabled={loading} /></label>
          </div>
          <div className="settings-action-row" style={{ marginTop: 16 }}>
            <button type="button" className="primary-button" disabled={saving || !profileValid || loading} onClick={() => void saveProfile()}>
              {saving ? "Saving..." : "Save profile"}
            </button>
            <button type="button" className="ghost-btn" onClick={() => void handlePasswordReset()}>Change password</button>
            {resetMsg ? <span className="meta">{resetMsg}</span> : null}
          </div>
        </SettingsCard>

        <SettingsCard title="Learning Preferences">
          <div className="aa-form-grid">
            <label><span>Skill level</span><select value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value as UserProfile["level"] })}>{LEVELS.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}</select></label>
            <label><span>Primary goal</span><select value={form.primaryGoal} onChange={(event) => setForm({ ...form, primaryGoal: event.target.value as UserProfile["primaryGoal"] })}>{GOALS.map((goal) => <option key={goal.value || "none"} value={goal.value}>{goal.label}</option>)}</select></label>
          </div>
          <div className="aa-chip-list" style={{ marginTop: 14 }}>
            {SOFTWARE.map((item) => (
              <button key={item} type="button" className={`ghost-btn${form.softwarePreferences.includes(item) ? " active" : ""}`} onClick={() => toggleSoftware(item)}>
                {item}
              </button>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard title="Plan & Billing">
          <div className="settings-plan-row">
            <span className={`plan-badge plan-badge--${plan}`}>{PLAN_LABELS[plan] ?? "Free"}</span>
            <span className="meta">{subscriptionStatus === "active" || subscriptionStatus === "trialing" ? `Subscription ${subscriptionStatus}` : isPaid ? `Subscription ${subscriptionStatus}` : "Free access"}</span>
          </div>
          <div className="settings-action-row" style={{ marginTop: 16 }}>
            {isPaid ? (
              <button type="button" className="primary-button" disabled={billingBusy} onClick={() => void openBillingPortal()}>
                {billingBusy ? "Opening..." : "Manage subscription"}
              </button>
            ) : (
              <Link href="/auth?mode=signup&plan=pro&next=/settings" className="primary-button">Upgrade</Link>
            )}
          </div>
        </SettingsCard>

        <SettingsCard title="Student Verification">
          <div className="settings-plan-row">
            <span className={`plan-badge plan-badge--${verification.status === "approved" ? "student" : "free"}`}>{verification.status.replace("_", " ")}</span>
            <span className="meta">
              {verification.status === "approved"
                ? "Student status approved."
                : verification.status === "pending"
                  ? "Your evidence is under review."
                  : verification.status === "rejected"
                    ? verification.reviewNotes || "Verification was rejected. Upload clearer evidence."
                    : "Verify student status to unlock the student plan."}
            </span>
          </div>
          <div className="settings-action-row" style={{ marginTop: 16 }}>
            {verification.status === "approved" ? (
              <Link href="/auth?mode=signup&plan=student&next=/settings" className="ghost-btn">Open student checkout</Link>
            ) : (
              <Link href="/auth?verify=student&next=/settings" className="primary-button">
                {verification.status === "pending" ? "View verification" : "Verify student status"}
              </Link>
            )}
          </div>
        </SettingsCard>
      </div>
    </AppFrame>
  );
}
