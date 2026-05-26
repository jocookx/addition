export type AccessPlan = "free" | "pro" | "team" | "student";

export type AccessLevel = "Free" | "Pro" | "Student" | "Workshop" | "Purchased" | "Locked";

export type AccessReason =
  | "free"
  | "included_in_plan"
  | "student_pending"
  | "requires_upgrade"
  | "requires_workshop_booking"
  | "purchased";

export type AccessCta =
  | "Start"
  | "Open"
  | "Upgrade"
  | "Verify student status"
  | "Book workshop"
  | "Manage subscription";

export type StudentVerificationState = "not_started" | "pending" | "approved" | "rejected";

export type AccessSubject = {
  accessLevel?: string | null;
  requiresWorkshopBooking?: boolean;
  purchased?: boolean;
};

export type AccessViewer = {
  plan?: AccessPlan | string | null;
  subscriptionStatus?: string | null;
  studentVerificationStatus?: StudentVerificationState | string | null;
};

export type AccessDecision = {
  canAccess: boolean;
  reason: AccessReason;
  label: AccessLevel;
  cta: AccessCta;
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export function hasActiveSubscription(viewer?: AccessViewer | null): boolean {
  const status = String(viewer?.subscriptionStatus || "").toLowerCase();
  if (!status) return viewer?.plan === "pro" || viewer?.plan === "team" || viewer?.plan === "student";
  return ACTIVE_SUBSCRIPTION_STATUSES.has(status);
}

export function normalizeAccessLevel(value?: string | null): AccessLevel {
  const normalized = String(value || "Free").trim().toLowerCase();
  if (normalized === "pro") return "Pro";
  if (normalized === "student") return "Student";
  if (normalized === "workshop") return "Workshop";
  if (normalized === "purchased") return "Purchased";
  if (normalized === "locked") return "Locked";
  return "Free";
}

export function getAccessDecision(subject: AccessSubject, viewer?: AccessViewer | null): AccessDecision {
  if (subject.purchased) {
    return { canAccess: true, reason: "purchased", label: "Purchased", cta: "Open" };
  }

  if (subject.requiresWorkshopBooking) {
    return {
      canAccess: false,
      reason: "requires_workshop_booking",
      label: "Workshop",
      cta: "Book workshop",
    };
  }

  const label = normalizeAccessLevel(subject.accessLevel);
  const plan = String(viewer?.plan || "free").toLowerCase();
  const studentStatus = String(viewer?.studentVerificationStatus || "not_started").toLowerCase();
  const activeSubscription = hasActiveSubscription(viewer);

  if (label === "Free") {
    return { canAccess: true, reason: "free", label, cta: "Start" };
  }

  if (label === "Purchased") {
    return { canAccess: false, reason: "requires_upgrade", label, cta: "Upgrade" };
  }

  if (label === "Workshop") {
    return { canAccess: false, reason: "requires_workshop_booking", label, cta: "Book workshop" };
  }

  if (label === "Student") {
    if (plan === "student" && activeSubscription) {
      return { canAccess: true, reason: "included_in_plan", label, cta: "Open" };
    }
    if (studentStatus === "pending" || studentStatus === "not_started" || studentStatus === "rejected") {
      return { canAccess: false, reason: "student_pending", label, cta: "Verify student status" };
    }
    return { canAccess: false, reason: "requires_upgrade", label, cta: "Upgrade" };
  }

  if (label === "Pro") {
    if ((plan === "pro" || plan === "team" || plan === "student") && activeSubscription) {
      return { canAccess: true, reason: "included_in_plan", label, cta: "Open" };
    }
    return { canAccess: false, reason: "requires_upgrade", label: "Locked", cta: "Upgrade" };
  }

  return { canAccess: false, reason: "requires_upgrade", label: "Locked", cta: "Upgrade" };
}
