"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Provider, Session, SupabaseClient } from "@supabase/supabase-js";
import { ensureAuthProfile } from "@/lib/api/auth-profile";
import type { BillingInterval, BillingPlan } from "@/lib/api/billing";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

function parseError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unexpected error.";
}

function hasLikelyStudentEmail(value: string): boolean {
  const domain = value.trim().toLowerCase().split("@")[1] || "";
  return domain.endsWith(".edu") || domain.includes(".ac.") || domain.includes("student.");
}

function getWorkshopCheckoutPath(path: string) {
  return path.includes("/checkout") ? path : `${path.replace(/\/$/, "")}/checkout`;
}

export default function AuthPage() {
  const router = useRouter();
  const [supabase] = useState<SupabaseClient | null>(() => getBrowserSupabaseClient());
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [courseOfStudy, setCourseOfStudy] = useState("");
  const [expectedGraduationDate, setExpectedGraduationDate] = useState("");
  const [evidencePath, setEvidencePath] = useState("");
  const [evidenceFilename, setEvidenceFilename] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [showEmailFallback, setShowEmailFallback] = useState(false);
  const [showBookingFallback, setShowBookingFallback] = useState(false);
  const [nextPath, setNextPath] = useState("/dashboard");
  const [planIntent, setPlanIntent] = useState<"free" | BillingPlan>("free");
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");

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
  }, []);

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

  useEffect(() => {
    const token = session?.access_token;
    if (!token || !nextPath.includes("/workshops/")) return;
    const checkoutPath = getWorkshopCheckoutPath(nextPath);
    const fallbackTimer = window.setTimeout(() => setShowBookingFallback(true), 2500);
    setStatus("Opening workshop booking...");
    router.replace(checkoutPath);
    return () => window.clearTimeout(fallbackTimer);
  }, [nextPath, router, session?.access_token]);

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

  async function signInWithProvider(provider: Provider, label: string) {
    if (!supabase) {
      setStatus("Supabase is not configured.");
      return;
    }
    setBusy(true);
    setStatus(`Redirecting to ${label}...`);
    try {
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", nextPath);
      if (planIntent === "pro" || planIntent === "student") callback.searchParams.set("plan", planIntent);
      if (billingInterval === "yearly") callback.searchParams.set("billing", "yearly");
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callback.toString(),
          queryParams: provider === "google"
            ? {
                access_type: "offline",
                prompt: "select_account",
              }
            : undefined,
        },
      });
      if (error) throw new Error(error.message);
    } catch (err) {
      setStatus(parseError(err));
      setBusy(false);
    }
  }

  async function uploadStudentEvidence(file: File) {
    if (!email.trim()) {
      setStatus("Enter your email before uploading evidence.");
      return;
    }
    setUploadBusy(true);
    setStatus("Uploading student evidence...");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("email", email.trim());
      const response = await fetch("/api/v1/auth/student-evidence", {
        method: "POST",
        body: form,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload.error === "string" ? payload.error : "Upload failed.");
      }
      setEvidencePath(typeof payload.path === "string" ? payload.path : "");
      setEvidenceFilename(typeof payload.filename === "string" ? payload.filename : file.name);
      setStatus("Evidence uploaded. Continue creating your account.");
    } catch (err) {
      setEvidencePath("");
      setEvidenceFilename("");
      setStatus(parseError(err));
    } finally {
      setUploadBusy(false);
    }
  }

  async function signIn() {
    if (!supabase) {
      setStatus("Supabase is not configured.");
      return;
    }
    setBusy(true);
    setStatus("Signing in...");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      const token = data.session?.access_token;
      if (!token) throw new Error("No session returned.");
      await postLoginBootstrap(token);
    } catch (err) {
      setStatus(parseError(err));
    } finally {
      setBusy(false);
    }
  }

  async function signUp() {
    if (!supabase) {
      setStatus("Supabase is not configured.");
      return;
    }

    const isStudentSignup = planIntent === "student";
    const studentEmail = hasLikelyStudentEmail(email);
    if (isStudentSignup) {
      if (!institution.trim()) {
        setStatus("Enter your institution.");
        return;
      }
      if (!courseOfStudy.trim()) {
        setStatus("Enter what you study.");
        return;
      }
      if (!expectedGraduationDate) {
        setStatus("Enter your expected graduation date.");
        return;
      }
      if (!studentEmail && !evidencePath) {
        setStatus("Upload a student card or enrolment evidence if you are not using a student email.");
        return;
      }
    }

    setBusy(true);
    setStatus("Creating account...");
    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            ...(name.trim() ? { name: name.trim() } : {}),
            plan: isStudentSignup ? "student" : "free",
            ...(isStudentSignup
              ? {
                  student: {
                    institution: institution.trim(),
                    courseOfStudy: courseOfStudy.trim(),
                    expectedGraduationDate,
                    verificationMethod: studentEmail ? "student_email" : "evidence_upload",
                    evidencePath,
                    evidenceFilename,
                  },
                }
              : {}),
          },
        },
      });
      if (error) throw new Error(error.message);
      if (data.session?.access_token) {
        await postLoginBootstrap(data.session.access_token);
      } else {
        setStatus(
          isStudentSignup
            ? "Student application created. Check your email to confirm your account."
            : "Account created. Check your email to confirm, then sign in.",
        );
      }
    } catch (err) {
      setStatus(parseError(err));
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!supabase) {
      setStatus("Supabase is not configured.");
      return;
    }
    if (!email.trim()) {
      setStatus("Enter your email address.");
      return;
    }
    setBusy(true);
    setStatus("Sending reset link...");
    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw new Error(error.message);
      setStatus("Check your email. A reset link has been sent.");
    } catch (err) {
      setStatus(parseError(err));
    } finally {
      setBusy(false);
    }
  }

  const isSignup = mode === "signup";
  const isStudentSignup = isSignup && planIntent === "student";
  const studentEmail = hasLikelyStudentEmail(email);
  const planLabel = planIntent === "student" ? "Student Pro" : planIntent === "pro" ? "Pro" : "Free";
  const isOpeningWorkshop = Boolean(session && nextPath.includes("/workshops/"));
  const workshopCheckoutPath = isOpeningWorkshop ? getWorkshopCheckoutPath(nextPath) : "";
  const introTitle = isOpeningWorkshop ? "Preparing checkout." : isSignup ? "Welcome to addition." : mode === "forgot" ? "Reset your access." : "Welcome back.";
  const authIntro = (
    <div className="auth-simple-intro">
      <div className={`auth-simple-logo${isOpeningWorkshop ? " auth-simple-logo--loading" : ""}`} aria-hidden="true">
        {isOpeningWorkshop ? <span className="auth-hourglass" /> : "+"}
      </div>
      <h1>{introTitle}</h1>
    </div>
  );

  return (
    <main className="auth">
      <div className="auth-card">
        {session && nextPath.includes("/workshops/") ? (
          <div className="auth-form">
            {authIntro}
            <p className="auth-form-sub">Opening your workshop booking.</p>
            {showBookingFallback && (
              <Link className="primary-button auth-submit-btn" href={workshopCheckoutPath}>
                Continue to checkout
              </Link>
            )}
          </div>
        ) : session ? (
          <div className="auth-form">
            {authIntro}
            <h2>You&apos;re in</h2>
            <p className="auth-form-sub">Signed in as {session.user.email ?? session.user.id}</p>
            <button type="button" className="primary-button auth-submit-btn" onClick={() => void postLoginBootstrap(session.access_token)}>
              Continue
            </button>
          </div>
        ) : isSignup ? (
          <form className="auth-form" onSubmit={(e) => { e.preventDefault(); void signUp(); }}>
            {authIntro}
            <div>
              <h2>{isStudentSignup ? "Apply for Student Pro" : "Create account"}</h2>
              <p className="auth-form-sub">
                <button type="button" className="auth-inline-link" onClick={() => setMode("signin")}>Sign in</button>
              </p>
            </div>

            <button
              type="button"
              className="auth-google-btn"
              onClick={() => void signInWithProvider("google", "Google")}
              disabled={busy}
            >
              <span aria-hidden="true">G</span>
              Sign up with Google
            </button>
            <p className="auth-gateway-note">Recommended. You will continue to the app gateway after Google confirms your account.</p>
            <div className="auth-divider"><span>or</span></div>
            <button type="button" className="auth-email-toggle" onClick={() => setShowEmailFallback((value) => !value)}>
              {showEmailFallback ? "Hide email signup" : "Use email instead"}
            </button>

            {showEmailFallback && (
              <>
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

                <div>
                  <label htmlFor="signup-email">{isStudentSignup ? "Student email" : "Email"}</label>
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isStudentSignup ? "you@university.ac.uk" : "you@example.com"}
                    autoComplete="email"
                    required
                  />
                </div>

                {isStudentSignup && (
                  <div className="auth-student-fields">
                    <div>
                      <label htmlFor="student-institution">Institution</label>
                      <input
                        id="student-institution"
                        type="text"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="University or college"
                        autoComplete="organization"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="student-course">What do you study?</label>
                      <input
                        id="student-course"
                        type="text"
                        value={courseOfStudy}
                        onChange={(e) => setCourseOfStudy(e.target.value)}
                        placeholder="Architecture, interior design, computational design..."
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="student-graduation">Expected graduation date</label>
                      <input
                        id="student-graduation"
                        type="date"
                        value={expectedGraduationDate}
                        onChange={(e) => setExpectedGraduationDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className={`auth-student-verification ${studentEmail ? "is-ok" : ""}`}>
                      <strong>{studentEmail ? "Student email detected." : "No student email?"}</strong>
                      <span>
                        {studentEmail
                          ? "Confirm your account from the link in your student email."
                          : "Upload a student card or enrolment evidence for manual review."}
                      </span>
                      {!studentEmail && (
                        <label className="auth-file-upload" htmlFor="student-evidence">
                          {uploadBusy ? "Uploading..." : evidenceFilename ? `Uploaded: ${evidenceFilename}` : "Upload evidence"}
                          <input
                            id="student-evidence"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            disabled={uploadBusy}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) void uploadStudentEvidence(file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="signup-password">Password</label>
                  <input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>

                <div className="auth-signup-note">
                  <strong>{planIntent === "free" ? "Start with a free account." : `Create your ${planLabel} account.`}</strong>
                  <span>
                    {planIntent === "free"
                      ? "Free includes the full command library for every supported software."
                      : planIntent === "student"
                        ? "Use a student email or upload evidence. The dashboard gateway will guide the review step."
                        : "Create your learner account first. The dashboard gateway will open the payment step."}
                  </span>
                  {planIntent !== "free" && (
                    <button type="button" className="auth-inline-link" onClick={() => setPlanIntent("free")}>
                      Start free instead
                    </button>
                  )}
                </div>

                <button type="submit" className="primary-button auth-submit-btn" disabled={busy || uploadBusy}>
                  {busy ? "Working..." : isStudentSignup ? "Apply for student access" : "Create account"}
                </button>
              </>
            )}

            {status && (
              <div className="meta" style={{ color: status.includes("uploaded") || status.includes("created") ? "var(--success)" : "var(--danger)", fontSize: 13 }}>
                {status}
              </div>
            )}
          </form>
        ) : mode === "forgot" ? (
          <form className="auth-form" onSubmit={(e) => { e.preventDefault(); void resetPassword(); }}>
            {authIntro}
            <div>
              <h2>Reset password</h2>
            </div>

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
              {busy ? "Working..." : "Send reset link"}
            </button>

            {status && <div className="meta" style={{ color: "var(--rf-sub)", fontSize: 13 }}>{status}</div>}

            <div className="auth-extras">
              <button type="button" className="auth-inline-link" onClick={() => setMode("signin")}>
                Back to sign in
              </button>
            </div>
          </form>
        ) : (
          <form className="auth-form" onSubmit={(e) => { e.preventDefault(); void signIn(); }}>
            {authIntro}
            <div>
              <h2>Sign in</h2>
              <p className="auth-form-sub">
                <button type="button" className="auth-inline-link" onClick={() => setMode("signup")}>Create an account</button>
              </p>
            </div>

            <button
              type="button"
              className="auth-google-btn"
              onClick={() => void signInWithProvider("google", "Google")}
              disabled={busy}
            >
              <span aria-hidden="true">G</span>
              Sign in with Google
            </button>
            <p className="auth-gateway-note">Recommended. You will continue to the app gateway after Google confirms your account.</p>
            <div className="auth-divider"><span>or</span></div>
            <button type="button" className="auth-email-toggle" onClick={() => setShowEmailFallback((value) => !value)}>
              {showEmailFallback ? "Hide email sign in" : "Use email instead"}
            </button>

            {showEmailFallback && (
              <>
                <div>
                  <label htmlFor="login-email">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="username"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="login-password">
                    Password
                    <button
                      type="button"
                      className="auth-inline-link"
                      style={{ float: "right", fontWeight: 600 }}
                      onClick={() => setMode("forgot")}
                    >
                      Forgot?
                    </button>
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    autoComplete="current-password"
                    required
                  />
                </div>

                <button type="submit" className="primary-button auth-submit-btn" disabled={busy}>
                  {busy ? "Working..." : "Sign in"}
                </button>
              </>
            )}

            {status && <div className="meta" style={{ color: "var(--danger)", fontSize: 13 }}>{status}</div>}

            <div className="auth-extras">
              <Link href="/admin" className="auth-admin-link">Admin sign in</Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
