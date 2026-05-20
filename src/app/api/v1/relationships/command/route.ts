import { errorResponse, okResponse } from "@/lib/http";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

type CourseRow = {
  id: string;
  title: string;
  software: string | null;
  type: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const commandName = cleanString(searchParams.get("name")).slice(0, 200);

  if (!commandName) {
    return okResponse({ combos: [], courses: [] });
  }

  try {
    const db = createSupabaseServiceClient();

    // Fetch combos and courses that reference this command by name in their commands array
    // addition_courses.commands is text[] — check if commandName is contained
    const { data, error } = await db
      .from("addition_courses")
      .select("id,title,software,type")
      .in("type", ["combo", "course"])
      .contains("commands", [commandName]);

    if (error) return errorResponse(error.message, 500);

    const rows = (data || []) as CourseRow[];
    const combos = rows
      .filter((row) => row.type === "combo")
      .map((row) => ({ id: row.id, title: cleanString(row.title), software: cleanString(row.software), type: "combo" }));
    const courses = rows
      .filter((row) => row.type === "course")
      .map((row) => ({ id: row.id, title: cleanString(row.title), software: cleanString(row.software), type: "course" }));

    return okResponse({ combos, courses });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown server error.", 500);
  }
}
