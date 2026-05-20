import { errorResponse } from "@/lib/http";
import { createSupabaseAnonClient } from "@/server/supabase/clients";

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  name: string | null;
};

type AuthResult =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; response: ReturnType<typeof errorResponse> };

export function readBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!header) return null;
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

export async function requireUserFromRequest(request: Request): Promise<AuthResult> {
  const token = readBearerToken(request);
  if (!token) {
    return { ok: false, response: errorResponse("Missing bearer token.", 401) };
  }

  const anonClient = createSupabaseAnonClient();
  const { data, error } = await anonClient.auth.getUser(token);
  if (error || !data.user?.id) {
    return { ok: false, response: errorResponse("Invalid or expired token.", 401) };
  }

  const metadata = data.user.user_metadata && typeof data.user.user_metadata === "object" ? data.user.user_metadata : {};
  const nameCandidate = (metadata as Record<string, unknown>).name;
  const name = typeof nameCandidate === "string" && nameCandidate.trim() ? nameCandidate.trim() : null;

  return {
    ok: true,
    user: {
      id: data.user.id,
      email: data.user.email || null,
      name,
    },
  };
}

export async function requireUserIdFromRequest(
  request: Request,
): Promise<{ ok: true; userId: string } | { ok: false; response: ReturnType<typeof errorResponse> }> {
  const auth = await requireUserFromRequest(request);
  if (!auth.ok) return auth;
  return { ok: true, userId: auth.user.id };
}
