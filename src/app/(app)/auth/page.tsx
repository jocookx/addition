"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Provider, Session, SupabaseClient } from "@supabase/supabase-js";
import { ensureAuthProfile } from "@/lib/api/auth-profile";
import type { BillingInterval, BillingPlan } from "@/lib/api/billing";
import { getBillingCheckoutUrl } from "@/lib/api/billing";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

// ─── Student email domain lists ───────────────────────────────────────────────
const STUDENT_DOMAIN_ENDINGS = [
  ".edu", ".ac.uk", ".ac.au", ".ac.nz", ".ac.jp", ".ac.in", ".ac.za",
  ".edu.au", ".edu.sg", ".edu.hk", ".edu.cn", ".edu.my", ".edu.br",
  ".ac.kr", ".ac.th", ".ac.id", ".ac.tz", ".ac.ug", ".ac.ke",
];
const STUDENT_DOMAIN_PREFIXES = ["student.", "students.", "mymail.", "mail.student.", "webmail.student."];

function isStudentDomain(email: string): boolean {
  const domain = email.toLowerCase().split("@")[1] ?? "";
  if (!domain || !domain.includes(".")) return false;
  if (STUDENT_DOMAIN_ENDINGS.some(d => domain.endsWith(d))) return true;
  if (STUDENT_DOMAIN_PREFIXES.some(p => domain.startsWith(p))) return true;
  return false;
}

function parseError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unexpected error.";
}

function getWorkshopCheckoutPath(path: string) {
  return path.includes("/checkout") ? path : `${path.replace(/\/$/, "")}/checkout`;
}

type VerifyStep = "idle" | "email" | "upload" | "reviewing" | "approved" | "pending";

export default function AuthPage() {
  const router = useRouter();
  const [supabase] = useState<SupabaseClient | null>(() => getBrowserSupabaseClient());
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [showEmailFallback, setShowEmailFallback] = useState(false);
  const [showBookingFallback, setShowBookingFallback] = useState(false);
  const [nextPath, setNextPath] = useState("/dashboard");
  const [planIntent, setPlanIntent] = useState<"free" | BillingPlan>("free");
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");

  // ── Student verification wizard state ─────────────────────────────────────
  const [verifyStep, setVerifyStep] = useState<VerifyStep>("idle");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyOnLoad, setVerifyOnLoad] = useState(false);
  const [studentVerifyEmail, setStudentVerifyEmail] = useState("");
  const [domainChecked, setDomainChecked] = useState(false);
  const [domainValid, setDomainValid] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [verifyResult, setVerifyResult] = useState<{ institution: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearMsgs() { setInfoMsg(""); setErrorMsg(""); }

  // ── URL params ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const rawNext = params.get("next")?.trim();
    const rawPlan = params.get("plan");
    if (rawNext && rawNext.startsWith("/")) setNextPath(rawNext);
    if (params.get("mode") === "signup") setMode("signup");
    if (rawPlan === "pro" || rawPlan === "student") {
      setMode("signup");
      setPlanIntent(rawPlan);
    }
    if (params.get("billing") === "yearly") setBillingInterval("yearly");
    if (params.get("verify") === "student") setVerifyOnLoad(true);
  }, []);

  // ── Auth session listener ──────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let alive = true;
    void client.auth.getSession().then(({ data }) => {
      if (alive) setSession(data.session ?? null);
    });
    const { data } = client.auth.onAuthStateChange((_evt, s) => setSession(s));
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  // ── Auto-redirect when session detected (no "Continue" button) ────────────
  useEffect(() => {
    const token = session?.access_token;
    if (!token) return;
    if (verifyStep !== "idle") return; // wizard is open — don't redirect
    if (nextPath.includes("/workshops/")) return; // handled separately

    // Student returning via ?verify=student — launch wizard immediately
    if (verifyOnLoad && session.user) {
      setVerifyEmail(session.user.email ?? "");
      setVerifyStep("email");
      return;
    }

    setInfoMsg("Signing you in…");
    void postLoginBootstrap(token);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token, verifyStep, verifyOnLoad]);

  // ── Workshop redirect ──────────────────────────────────────────────────────
  useEffect(() => {
    const token = session?.access_token;
    if (!token || !nextPath.includes("/workshops/")) return;
    const checkoutPath = getWorkshopCheckoutPath(nextPath);
    const fallbackTimer = window.setTimeout(() => setShowBookingFallback(true), 2500);
    setInfoMsg("Opening workshop booking…");
    router.replace(checkoutPath);
    return () => window.clearTimeout(fallbackTimer);
  }, [nextPath, router, session?.access_token]);

  // ── Student email domain check (debounced 300ms) ──────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const hasAt  = studentVerifyEmail.includes("@");
    const hasDot = studentVerifyEmail.split("@")[1]?.includes(".");
    if (!hasAt || !hasDot) {
      setDomainChecked(false);
      setDomainValid(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setDomainChecked(true);
      setDomainValid(isStudentDomain(studentVerifyEmail));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [studentVerifyEmail]);

  // ── Bootstrap after login ──────────────────────────────────────────────────
  async function postLoginBootstrap(token: string) {
    if (nextPath.includes("/workshops/")) {
      router.replace(getWorkshopCheckoutPath(nextPath));
      return;
    }
    await ensureAuthProfile(token);
    if (nextPath === "/workshops/cart") {
      router.replace(nextPath);
      return;
    }
    if (planIntent === "pro") {
      router.replace(`/dashboard?gateway=pro&billing=${billingInterval}`);
      return;
    }
    if (planIntent === "student") {
      router.replace(`/dashboard?gateway=student&billing=${billingInterval}`);
      return;
    }
    router.replace("/dashboard?gateway=welcome");
  }

  // ── OAuth ──────────────────────────────────────────────────────────────────
  async function signInWithProvider(provider: Provider, label: string) {
    if (!supabase) { setErrorMsg("Supabase is not configured."); return; }
    clearMsgs();
    setBusy(true);
    setInfoMsg(`Redirecting to ${label}…`);
    try {
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", nextPath);
      if (planIntent === "pro") callback.searchParams.set("plan", "pro");
      if (planIntent === "student") callback.searchParams.set("plan", "student");
      if (billingInterval === "yearly") callback.searchParams.set("billing", "yearly");
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callback.toString(),
          queryParams: provider === "google"
            ? { access_type: "offline", prompt: "select_account" }
            : undefined,
        },
      });
      if (error) throw new Error(error.message);
    } catch (err) {
      setInfoMsg("");
      setErrorMsg(parseError(err));
      setBusy(false);
    }
  }

  // ── Email sign in ──────────────────────────────────────────────────────────
  async function signIn() {
    if (!supabase) { setErrorMsg("Supabase is not configured."); return; }
    clearMsgs();
    setBusy(true);
    setInfoMsg("Signing in…");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      const token = data.session?.access_token;
      if (!token) throw new Error("No session returned.");
      await postLoginBootstrap(token);
    } catch (err) {
      setInfoMsg("");
      setErrorMsg(parseError(err));
    } finally {
      setBusy(false);
    }
  }

  // ── Email sign up ──────────────────────────────────────────────────────────
  async function signUp() {
    if (!supabase) { setErrorMsg("Supabase is not configured."); return; }
    clearMsgs();
    setBusy(true);
    setInfoMsg("Creating account…");
    try {
      const redirectTo = typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            ...(name.trim() ? { name: name.trim() } : {}),
            plan: planIntent === "student" ? "student" : "free",
          },
        },
      });
      if (error) throw new Error(error.message);

      const userId = data.user?.id ?? "";
      if (planIntent === "student" && userId) {
        // Student signup — launch inline verification wizard
        setVerifyEmail(email.trim());
        setVerifyStep("email");
        setInfoMsg("");
        setBusy(false);
        return;
      }

      if (data.session?.access_token) {
        await postLoginBootstrap(data.session.access_token);
      } else {
        setInfoMsg("Account created. Check your email to confirm, then sign in.");
      }
    } catch (err) {
      setInfoMsg("");
      setErrorMsg(parseError(err));
    } finally {
      setBusy(false);
    }
  }

  // ── Password reset ─────────────────────────────────────────────────────────
  async function resetPassword() {
    if (!supabase) { setErrorMsg("Supabase is not configured."); return; }
    if (!email.trim()) { setErrorMsg("Enter your email address."); return; }
    clearMsgs();
    setBusy(true);
    setInfoMsg("Sending reset link…");
    try {
      const redirectTo = typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw new Error(error.message);
      setInfoMsg("Check your email — a reset link has been sent.");
    } catch (err) {
      setInfoMsg("");
      setErrorMsg(parseError(err));
    } finally {
      setBusy(false);
    }
  }

  // ── Student wizard: verify by email domain ─────────────────────────────────
  async function verifyStudentEmail() {
    if (!domainValid) return;
    clearMsgs();
    setBusy(true);
    setInfoMsg("Confirming student status…");
    try {
      const response = await fetch("/api/v1/auth/student-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ email: studentVerifyEmail.trim(), method: "email_domain" }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Verification failed.");
      setVerifyResult({ institution: "" });
      setInfoMsg("");
      // Email domain verified — go straight to checkout
      await proceedAfterVerify(true);
      return;
    } catch (err) {
      setInfoMsg("");
      setErrorMsg(parseError(err));
    } finally {
      setBusy(false);
    }
  }

  // ── Student wizard: upload document ───────────────────────────────────────
  async function uploadVerifyDocument(file: File) {
    clearMsgs();
    setVerifyStep("reviewing");
    setUploadProgress(0);

    const tick = setInterval(() => {
      setUploadProgress(p => Math.min(p + 7, 72));
    }, 180);

    try {
      const form = new FormData();
      form.set("file", file);
      form.set("email", verifyEmail);

      const response = await fetch("/api/v1/auth/student-verify", {
        method: "POST",
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        body: form,
      });

      clearInterval(tick);
      setUploadProgress(96);

      const payload = await response.json().catch(() => ({})) as {
        error?: string; approved?: boolean; institution?: string; documentType?: string;
      };
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Verification failed.");

      setUploadProgress(100);
      setVerifyResult({ institution: typeof payload.institution === "string" ? payload.institution : "" });
      setVerifyStep(payload.approved ? "approved" : "pending");
    } catch (err) {
      clearInterval(tick);
      setUploadProgress(0);
      setVerifyStep("upload");
      setErrorMsg(parseError(err));
    }
  }

  async function proceedAfterVerify(verified: boolean) {
    // If approved → go to student checkout; pending → welcome dashboard
    if (verified && supabase) {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        try {
          const url = await getBillingCheckoutUrl("student", token, "/dashboard");
          window.location.href = url;
          return;
        } catch {
          // Fall through to dashboard if checkout URL fails
        }
      }
    }
    router.replace("/dashboard?gateway=welcome");
  }

  // ─── Shared logo mark ─────────────────────────────────────────────────────
  const logoMark = (
    <div className="auth-simple-intro">
      <div className="auth-simple-logo" aria-hidden="true">+</div>
    </div>
  );

  // ─── Student Verification Wizard ──────────────────────────────────────────
  if (verifyStep !== "idle") {
    return (
      <main className="auth">
        <div className="auth-card">
          <div className="auth-form auth-verify-wizard">
            {logoMark}

            <div>
              <h1 style={{ fontSize: 22, margin: "0 0 4px" }}>Verify your student status</h1>
              <p className="auth-form-sub" style={{ margin: 0 }}>
                {verifyStep === "email"     && "Enter your university or college email address."}
                {verifyStep === "upload"    && "Upload a student ID card, enrollment letter, or university card."}
                {verifyStep === "reviewing" && "Checking your document…"}
                {verifyStep === "approved"  && "Student status confirmed."}
                {verifyStep === "pending"   && "Your document is under review."}
              </p>
            </div>

            {/* ── Step: email domain ── */}
            {verifyStep === "email" && (
              <>
                <div>
                  <label htmlFor="verify-email">Student email address</label>
                  <input
                    id="verify-email"
                    type="email"
                    value={studentVerifyEmail}
                    onChange={(e) => setStudentVerifyEmail(e.target.value)}
                    placeholder="you@university.ac.uk"
                    autoComplete="email"
                    autoFocus
                  />
                  {domainChecked && domainValid  && <p className="auth-domain-ok">✓ Student email recognised</p>}
                  {domainChecked && !domainValid && <p className="auth-domain-err">This doesn&apos;t look like a student email address</p>}
                </div>

                {domainValid && (
                  <button
                    type="button"
                    className="primary-button auth-submit-btn"
                    onClick={() => void verifyStudentEmail()}
                    disabled={busy}
                  >
                    {busy ? "Verifying…" : "Verify & continue →"}
                  </button>
                )}

                <div className="auth-divider"><span>or upload proof instead</span></div>

                <label className="auth-file-upload" htmlFor="verify-doc-email">
                  Upload student ID or enrollment letter
                  <input
                    id="verify-doc-email"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadVerifyDocument(f); }}
                  />
                </label>
                <p className="auth-form-sub" style={{ fontSize: 12, marginTop: -8 }}>
                  JPG, PNG, WebP or PDF · Max 8 MB
                </p>

                {errorMsg && <p className="auth-msg auth-msg--error">{errorMsg}</p>}
                {infoMsg  && <p className="auth-msg auth-msg--info">{infoMsg}</p>}

                <button
                  type="button"
                  className="auth-inline-link"
                  onClick={() => void proceedAfterVerify(false)}
                  style={{ fontSize: 12, opacity: 0.45, marginTop: 4, textAlign: "center" }}
                >
                  Skip for now
                </button>
              </>
            )}

            {/* ── Step: upload ── */}
            {verifyStep === "upload" && (
              <>
                <label className="auth-file-upload" htmlFor="verify-doc-upload">
                  Choose file to upload
                  <input
                    id="verify-doc-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadVerifyDocument(f); }}
                  />
                </label>
                <p className="auth-form-sub" style={{ fontSize: 12 }}>JPG, PNG, WebP or PDF · Max 8 MB</p>
                {errorMsg && <p className="auth-msg auth-msg--error">{errorMsg}</p>}
                <button type="button" className="auth-inline-link" onClick={() => setVerifyStep("email")}>
                  ← Back
                </button>
              </>
            )}

            {/* ── Step: reviewing (progress bar) ── */}
            {verifyStep === "reviewing" && (
              <>
                <div className="auth-verify-progress">
                  <div className="auth-verify-progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="auth-form-sub" style={{ fontSize: 13 }}>
                  {uploadProgress < 100 ? `Analysing document… ${uploadProgress}%` : "Almost done…"}
                </p>
              </>
            )}

            {/* ── Step: approved ── */}
            {verifyStep === "approved" && (
              <>
                <div className="auth-verify-result auth-verify-result--ok">
                  <span aria-hidden="true">✓</span>
                  <div>
                    <strong>Student status confirmed</strong>
                    {verifyResult?.institution && (
                      <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>{verifyResult.institution}</p>
                    )}
                  </div>
                </div>
                <button type="button" className="primary-button auth-submit-btn" onClick={() => void proceedAfterVerify(true)}>
                  Continue to checkout →
                </button>
              </>
            )}

            {/* ── Step: pending (under review) ── */}
            {verifyStep === "pending" && (
              <>
                <div className="auth-verify-result auth-verify-result--pending">
                  <span aria-hidden="true">⏳</span>
                  <div>
                    <strong>Under review</strong>
                    <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>
                      You&apos;ll hear within 24 hours. Free access granted in the meantime.
                    </p>
                  </div>
                </div>
                <button type="button" className="primary-button auth-submit-btn" onClick={() => void proceedAfterVerify(false)}>
                  Continue to Addition →
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ─── Workshop loading state ───────────────────────────────────────────────
  if (session && nextPath.includes("/workshops/")) {
    return (
      <main className="auth">
        <div className="auth-card">
          <div className="auth-form">
            <div className="auth-simple-intro">
              <div className="auth-simple-logo auth-simple-logo--loading" aria-hidden="true">
                <span className="auth-hourglass" />
              </div>
            </div>
            <h1 style={{ fontSize: 22, margin: "0 0 6px" }}>Preparing checkout.</h1>
            <p className="auth-form-sub">Opening your workshop booking.</p>
            {showBookingFallback && (
              <a className="primary-button auth-submit-btn" href={getWorkshopCheckoutPath(nextPath)}>
                Continue to checkout
              </a>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ─── Main auth page ───────────────────────────────────────────────────────
  const isSignup = mode === "signup";

  return (
    <main className="auth">
      <div className="auth-card">
        {mode === "forgot" ? (
          /* ── Forgot password ── */
          <form className="auth-form" onSubmit={(e) => { e.preventDefault(); void resetPassword(); }}>
            {logoMark}
            <h1 style={{ fontSize: 22, margin: "0 0 20px" }}>Reset your access.</h1>

            <div>
              <label htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <button type="submit" className="primary-button auth-submit-btn" disabled={busy}>
              {busy ? "Working…" : "Send reset link"}
            </button>

            {errorMsg && <p className="auth-msg auth-msg--error">{errorMsg}</p>}
            {infoMsg  && <p className="auth-msg auth-msg--info">{infoMsg}</p>}

            <div className="auth-extras">
              <button type="button" className="auth-inline-link" onClick={() => { setMode("signin"); clearMsgs(); }}>
                ← Back to sign in
              </button>
            </div>
          </form>
        ) : (
          /* ── Sign in / Sign up ── */
          <form
            className="auth-form"
            onSubmit={(e) => { e.preventDefault(); void (isSignup ? signUp() : signIn()); }}
          >
            {logoMark}

            {/* Tabs — same segment-nav-tabs style as Commands / Combos / Courses */}
            <div className="segment-nav-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={!isSignup}
                className={`segment-btn${!isSignup ? " active" : ""}`}
                onClick={() => { setMode("signin"); clearMsgs(); setShowEmailFallback(false); }}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isSignup}
                className={`segment-btn${isSignup ? " active" : ""}`}
                onClick={() => { setMode("signup"); clearMsgs(); setShowEmailFallback(false); }}
              >
                Sign up
              </button>
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              className="auth-google-btn"
              onClick={() => void signInWithProvider("google", "Google")}
              disabled={busy}
            >
              <span aria-hidden="true">G</span>
              {isSignup ? "Sign up with Google" : "Sign in with Google"}
            </button>

            <div className="auth-divider"><span>or</span></div>

            <button
              type="button"
              className="auth-email-toggle"
              onClick={() => setShowEmailFallback((v) => !v)}
            >
              {showEmailFallback
                ? (isSignup ? "Hide email signup" : "Hide email sign in")
                : "Use email instead"}
            </button>

            {showEmailFallback && (
              <>
                {isSignup && (
                  <div>
                    <label htmlFor="signup-name">Full name</label>
                    <input
                      id="signup-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      autoComplete="name"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="auth-email">Email</label>
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete={isSignup ? "email" : "username"}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="auth-password">
                    Password
                    {!isSignup && (
                      <button
                        type="button"
                        className="auth-inline-link"
                        style={{ float: "right", fontWeight: 600 }}
                        onClick={() => { setMode("forgot"); clearMsgs(); }}
                      >
                        Forgot?
                      </button>
                    )}
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignup ? "Min 8 characters" : "Your password"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    minLength={isSignup ? 8 : undefined}
                    required
                  />
                </div>

                {isSignup && planIntent !== "free" && (
                  <div className="auth-signup-note">
                    <strong>{planIntent === "student" ? "Student Pro account" : "Pro account"}</strong>
                    <span>
                      {planIntent === "student"
                        ? "You'll verify your student status right after signup."
                        : "Create your learner account first — the payment step follows signup."}
                    </span>
                    <button
                      type="button"
                      className="auth-inline-link"
                      onClick={() => setPlanIntent("free")}
                    >
                      Start free instead
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  className="primary-button auth-submit-btn"
                  disabled={busy}
                >
                  {busy ? "Working…" : isSignup ? "Create account" : "Sign in"}
                </button>
              </>
            )}

            {errorMsg && <p className="auth-msg auth-msg--error">{errorMsg}</p>}
            {infoMsg  && <p className="auth-msg auth-msg--info">{infoMsg}</p>}
          </form>
        )}
      </div>
    </main>
  );
}
