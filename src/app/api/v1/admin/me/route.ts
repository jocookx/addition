import { okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  return okResponse({ admin: auth.user });
}
