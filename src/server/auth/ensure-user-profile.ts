import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "@/domain/user-profile";

type EnsureUserArgs = {
  id: string;
  email: string | null;
  name: string | null;
};

type UserRow = {
  id: string;
  email: string;
  name: string;
  plan: "free" | "pro" | "team" | "student";
  level: "explorer" | "improver" | "refiner";
  profile_image: string;
  phone: string | null;
  organisation: string | null;
  role: string | null;
  timezone: string | null;
  software_preferences: unknown;
  primary_goal: UserProfile["primaryGoal"] | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: UserProfile["subscriptionStatus"] | null;
  billing_interval: UserProfile["billingInterval"] | null;
  created_at: string;
};

function fallbackName(email: string): string {
  const local = email.split("@")[0] || "learner";
  return local.slice(0, 80);
}

function mapRow(row: UserRow): UserProfile {
  const softwarePreferences = Array.isArray(row.software_preferences)
    ? row.software_preferences.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    plan: row.plan,
    level: row.level,
    profileImage: row.profile_image,
    phone: row.phone ?? "",
    organisation: row.organisation ?? "",
    role: row.role ?? "",
    timezone: row.timezone ?? "Europe/London",
    softwarePreferences,
    primaryGoal: row.primary_goal ?? "",
    stripeCustomerId: row.stripe_customer_id ?? "",
    stripeSubscriptionId: row.stripe_subscription_id ?? "",
    subscriptionStatus: row.subscription_status ?? "inactive",
    billingInterval: row.billing_interval ?? "",
    createdAt: row.created_at,
  };
}

export async function ensureUserProfile(db: SupabaseClient, user: EnsureUserArgs): Promise<UserProfile> {
  const safeEmail = (user.email || "").trim().toLowerCase();
  if (!safeEmail) {
    throw new Error("Authenticated user is missing an email.");
  }

  const safeName = (user.name || "").trim() || fallbackName(safeEmail);

  const { error: upsertError } = await db.from("addition_users").upsert(
    {
      id: user.id,
      email: safeEmail,
      name: safeName,
    },
    {
      onConflict: "id",
      ignoreDuplicates: false,
    },
  );

  if (upsertError) throw new Error(`Failed ensuring user profile: ${upsertError.message}`);

  const { data, error } = await db
    .from("addition_users")
    .select("id,email,name,plan,level,profile_image,phone,organisation,role,timezone,software_preferences,primary_goal,stripe_customer_id,stripe_subscription_id,subscription_status,billing_interval,created_at")
    .eq("id", user.id)
    .single();
  if (error) throw new Error(`Failed loading user profile: ${error.message}`);
  return mapRow(data as UserRow);
}
