import { errorResponse } from "@/lib/http";
import { requireUserFromRequest } from "@/server/auth/require-user";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

function getAllowedAdminEmails(): Set<string> {
  const envEmails = String(process.env.CONTENT_STUDIO_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const bootstrapAdmin = String(process.env.ADMIN_EMAIL || "")
    .trim()
    .toLowerCase();

  return new Set([...envEmails, ...(bootstrapAdmin ? [bootstrapAdmin] : [])]);
}

type AdminResult =
  | { ok: true; user: { id: string; email: string; name: string | null } }
  | { ok: false; response: ReturnType<typeof errorResponse> };

export async function requireAdminFromRequest(request: Request): Promise<AdminResult> {
  const auth = await requireUserFromRequest(request);
  if (!auth.ok) return auth;

  const email = (auth.user.email || "").trim().toLowerCase();
  if (!email) {
    return { ok: false, response: errorResponse("Authenticated user is missing an email.", 403) };
  }

  if (!getAllowedAdminEmails().has(email)) {
    try {
      const db = createSupabaseServiceClient();
      const { data, error } = await db
        .from("addition_admins")
        .select("email,active")
        .eq("email", email)
        .eq("active", true)
        .maybeSingle();

      if (!error && data) {
        return {
          ok: true,
          user: {
            id: auth.user.id,
            email,
            name: auth.user.name,
          },
        };
      }
    } catch {
      // Fall back to environment allow-list if the launch admin table
      // has not been migrated yet.
    }

    return { ok: false, response: errorResponse("Admin access required.", 403) };
  }

  return {
    ok: true,
    user: {
      id: auth.user.id,
      email,
      name: auth.user.name,
    },
  };
}
