import { errorResponse, okResponse } from "@/lib/http";
import { ensureUserProfile } from "@/server/auth/ensure-user-profile";
import { readBearerToken, requireUserFromRequest } from "@/server/auth/require-user";
import { createSupabaseUserClient } from "@/server/supabase/clients";

export async function GET(request: Request) {
  const auth = await requireUserFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const token = readBearerToken(request);
    if (!token) return errorResponse("Missing bearer token.", 401);
    const db = createSupabaseUserClient(token);
    const profile = await ensureUserProfile(db, auth.user);
    return okResponse({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return errorResponse(message, 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireUserFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const token = readBearerToken(request);
    if (!token) return errorResponse("Missing bearer token.", 401);
    const db = createSupabaseUserClient(token);
    const profile = await ensureUserProfile(db, auth.user);
    return okResponse({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return errorResponse(message, 500);
  }
}

const VALID_LEVELS = new Set(["explorer", "improver", "refiner"]);
const VALID_GOALS = new Set([
  "",
  "learn_rhino",
  "learn_revit",
  "learn_grasshopper",
  "ai_digital_design",
  "workshop_training",
  "career_development",
]);

function cleanText(value: unknown, max = 120): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function PATCH(request: Request) {
  const auth = await requireUserFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const token = readBearerToken(request);
    if (!token) return errorResponse("Missing bearer token.", 401);

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body.", 400);
    }

    const updates: Record<string, unknown> = {};

    if ("level" in body) {
      const level = typeof body.level === "string" ? body.level.trim() : "";
      if (!VALID_LEVELS.has(level)) {
        return errorResponse("level must be 'explorer', 'improver', or 'refiner'.", 400);
      }
      updates.level = level;
    }

    if ("name" in body) {
      const name = cleanText(body.name, 80);
      if (name) updates.name = name;
    }

    if ("phone" in body) updates.phone = cleanText(body.phone, 40);
    if ("organisation" in body) updates.organisation = cleanText(body.organisation, 120);
    if ("role" in body) updates.role = cleanText(body.role, 80);
    if ("timezone" in body) updates.timezone = cleanText(body.timezone, 80) || "Europe/London";

    if ("softwarePreferences" in body) {
      const values = Array.isArray(body.softwarePreferences)
        ? body.softwarePreferences
          .map((item) => cleanText(item, 40))
          .filter(Boolean)
          .slice(0, 8)
        : [];
      updates.software_preferences = Array.from(new Set(values));
    }

    if ("primaryGoal" in body) {
      const primaryGoal = cleanText(body.primaryGoal, 60);
      if (!VALID_GOALS.has(primaryGoal)) return errorResponse("Invalid primary goal.", 400);
      updates.primary_goal = primaryGoal;
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse("No valid fields to update.", 400);
    }

    const db = createSupabaseUserClient(token);
    const { error: updateError } = await db
      .from("addition_users")
      .update(updates)
      .eq("id", auth.user.id);

    if (updateError) return errorResponse(updateError.message, 500);

    const profile = await ensureUserProfile(db, auth.user);
    return okResponse({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return errorResponse(message, 500);
  }
}
