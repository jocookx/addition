import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecommendedCommand } from "@/domain/command-recommendation";
import type { CourseType } from "@/domain/catalog";
import type { CommandProgressRecord } from "@/domain/learning-progress";
import { SupabaseLearningProgressRepository } from "@/server/repositories/supabase-learning-progress-repository";
import { LearningProgressService } from "@/server/services/learning-progress-service";

type CourseRow = {
  id: string;
  type: CourseType;
  title: string;
  software: string;
  commands: unknown;
  combos: unknown;
};

type CommandRow = {
  id: string;
  name: string;
  software: string;
  menu: string | null;
  description: string | null;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    const s = cleanString(item);
    if (!s) continue;
    if (!out.includes(s)) out.push(s);
  }
  return out;
}

function buildService(db: SupabaseClient) {
  const repository = new SupabaseLearningProgressRepository(db);
  return new LearningProgressService(repository);
}

async function getCourseRowsForComboTitles(db: SupabaseClient, comboTitles: string[]): Promise<CourseRow[]> {
  if (!comboTitles.length) return [];
  const { data, error } = await db
    .from("addition_courses")
    .select("id,type,title,software,commands,combos")
    .eq("type", "combo")
    .in("title", comboTitles);
  if (error) throw new Error(`Failed loading combo courses: ${error.message}`);
  return (data || []) as CourseRow[];
}

async function getCommandsByNames(db: SupabaseClient, names: string[], software: string): Promise<CommandRow[]> {
  if (!names.length) return [];
  const uniqueNames = Array.from(new Set(names));
  const { data, error } = await db
    .from("addition_commands")
    .select("id,name,software,menu,description")
    .eq("software", software)
    .in("name", uniqueNames);

  if (error) throw new Error(`Failed loading commands: ${error.message}`);
  return (data || []) as CommandRow[];
}

export async function getRecommendedCommands(
  db: SupabaseClient,
  userId: string,
  courseId: string,
): Promise<RecommendedCommand[] | null> {
  const { data: courseData, error: courseError } = await db
    .from("addition_courses")
    .select("id,type,title,software,commands,combos")
    .eq("id", courseId)
    .maybeSingle();

  if (courseError) throw new Error(`Failed loading course: ${courseError.message}`);
  if (!courseData) return null;

  const course = courseData as CourseRow;
  const directCommandNames = toStringList(course.commands);
  const comboTitles = toStringList(course.combos);
  const comboRows = await getCourseRowsForComboTitles(db, comboTitles);
  const comboCommandNames = comboRows.flatMap((row) => toStringList(row.commands));

  const lookupNames = Array.from(new Set([...directCommandNames, ...comboCommandNames]));
  const commandRows = await getCommandsByNames(db, lookupNames, course.software);

  const service = buildService(db);
  const snapshot = await service.getSnapshot(userId);
  const commandProgressMap = new Map<string, CommandProgressRecord>();
  for (const item of snapshot.commands) commandProgressMap.set(item.commandId, item);

  const directSet = new Set(directCommandNames.map((name) => name.toLowerCase()));

  const recommended = commandRows.map<RecommendedCommand>((row) => {
    const progress = commandProgressMap.get(row.id);
    const status = progress?.status || "new";
    const proficiency = progress?.proficiency || 0;
    const repetitions = progress?.repetitions || 0;
    const lastPracticedAt = progress?.lastPracticedAt || null;

    return {
      id: row.id,
      name: row.name,
      software: row.software,
      menu: cleanString(row.menu),
      description: cleanString(row.description),
      status,
      proficiency,
      repetitions,
      lastPracticedAt,
      reason: directSet.has(row.name.toLowerCase()) ? "course_direct" : "combo_expanded",
    };
  });

  recommended.sort((a, b) => {
    if (a.status !== b.status) {
      const order = { new: 0, learning: 1, mastered: 2 } as const;
      return order[a.status] - order[b.status];
    }
    if (a.proficiency !== b.proficiency) return a.proficiency - b.proficiency;
    return a.name.localeCompare(b.name);
  });

  return recommended;
}
