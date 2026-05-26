import type { UserProfile } from "@/domain/user-profile";
import type { ResourceListItem } from "@/domain/resource";
import { getAccessDecision } from "@/domain/access";
import { errorResponse, okResponse } from "@/lib/http";
import { readBearerToken, requireUserFromRequest } from "@/server/auth/require-user";
import { ensureUserProfile } from "@/server/auth/ensure-user-profile";
import { createSupabaseServiceClient, createSupabaseUserClient } from "@/server/supabase/clients";

type ResourceRow = {
  id: string;
  title: string | null;
  type: string | null;
  software: string | null;
  file_url: string | null;
  external_url: string | null;
  access_level: string | null;
  tags: unknown;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const software = (searchParams.get("software") || "").trim();
    const type = (searchParams.get("type") || "").trim();
    const access = (searchParams.get("access") || "").trim();

    const token = readBearerToken(request);
    let profile: UserProfile | null = null;
    let savedIds = new Set<string>();
    if (token) {
      const auth = await requireUserFromRequest(request);
      if (auth.ok) {
        const userDb = createSupabaseUserClient(token);
        profile = await ensureUserProfile(userDb, auth.user).catch(() => null);
        const { data: saved } = await userDb
          .from("addition_toolkit")
          .select("content_id")
          .eq("content_type", "resource");
        savedIds = new Set((saved ?? []).map((item) => String(item.content_id)));
      }
    }

    const db = createSupabaseServiceClient();
    let query = db
      .from("addition_resources")
      .select("id,title,type,software,file_url,external_url,access_level,tags")
      .eq("status", "Published")
      .order("updated_at", { ascending: false })
      .limit(500);

    if (software && software !== "All") query = query.eq("software", software);
    if (type && type !== "All") query = query.eq("type", type);
    if (access && access !== "All") query = query.eq("access_level", access);

    const { data, error } = await query;
    if (error) return errorResponse(error.message, 500);

    const resources: ResourceListItem[] = ((data ?? []) as ResourceRow[])
      .filter((row) => {
        if (!search) return true;
        return `${row.title ?? ""} ${row.software ?? ""} ${row.type ?? ""}`.toLowerCase().includes(search);
      })
      .map((row) => {
        const decision = getAccessDecision(
          { accessLevel: row.access_level || "Free" },
          profile ? {
            plan: profile.plan,
            subscriptionStatus: profile.subscriptionStatus,
          } : null,
        );
        const url = row.file_url || row.external_url || "";
        return {
          id: row.id,
          title: row.title || "Untitled resource",
          type: row.type || "Link",
          software: row.software || "",
          accessLevel: row.access_level || "Free",
          tags: Array.isArray(row.tags) ? row.tags.filter((item): item is string => typeof item === "string") : [],
          saved: savedIds.has(row.id),
          url: decision.canAccess ? url : "",
          access: decision,
        };
      });

    return okResponse({ resources });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Could not load resources.", 500);
  }
}
