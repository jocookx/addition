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
  const comboTitle = cleanString(searchParams.get("title")).slice(0, 200);

  if (!comboTitle) {
    return okResponse({ courses: [] });
  }

  try {
    const db = createSupabaseServiceClient();

    // Fetch courses that reference this combo by title in their combos array
    // addition_courses.combos is text[] — check if comboTitle is contained
    const { data, error } = await db
      .from("addition_courses")
      .select("id,title,software,type")
      .eq("type", "course")
      .contains("combos", [comboTitle]);

    if (error) return errorResponse(error.message, 500);

    const courses = ((data || []) as CourseRow[]).map((row) => ({
      id: row.id,
      title: cleanString(row.title),
      software: cleanString(row.software),
      type: "course",
    }));

    return okResponse({ courses });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown server error.", 500);
  }
}
