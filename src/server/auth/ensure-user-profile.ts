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
  created_at: string;
};

function fallbackName(email: string): string {
  const local = email.split("@")[0] || "learner";
  return local.slice(0, 80);
}

function mapRow(row: UserRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    plan: row.plan,
    level: row.level,
    profileImage: row.profile_image,
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
    .select("id,email,name,plan,level,profile_image,created_at")
    .eq("id", user.id)
    .single();
  if (error) throw new Error(`Failed loading user profile: ${error.message}`);
  return mapRow(data as UserRow);
}
