import type { WorkshopListItem } from "@/domain/workshop";

export type Cohort = {
  id: string;
  title: string;
  track: string;
  level: string;
  sessions: WorkshopListItem[];
  firstDate: string;
  lastDate: string;
  minPrice: number;
  maxPrice: number;
  software: string[];
  image: string;
  format: string;
  tutorName: string;
  learn: string[];
};

export const TRACK_LABELS: Record<string, string> = {
  Architecture: "Rhino for Architecture",
  Interiors: "Rhino for Interior Design",
  Computational: "Computational Design",
};

export function getCohortId(wsId: string): string {
  return wsId.replace(/^ws-/, "").replace(/-w\d+[a-z]$/, "");
}

export function buildCohorts(workshops: WorkshopListItem[]): Cohort[] {
  const map = new Map<string, WorkshopListItem[]>();
  for (const ws of workshops) {
    const cid = getCohortId(ws.id);
    const group = map.get(cid) ?? [];
    group.push(ws);
    map.set(cid, group);
  }
  const cohorts: Cohort[] = [];
  for (const [id, sessions] of map) {
    const sorted = sessions.slice().sort((a, b) => a.date.localeCompare(b.date));
    const prices = sessions.map((s) => s.pricePence).filter((p) => p > 0);
    const allLearn = Array.from(new Set(sessions.flatMap((s) => s.learn ?? [])));
    cohorts.push({
      id,
      title: sorted[0].title,
      track: sorted[0].track,
      level: sorted[0].level,
      sessions: sorted,
      firstDate: sorted[0].date,
      lastDate: sorted[sorted.length - 1].date,
      minPrice: prices.length ? Math.min(...prices) / 100 : 0,
      maxPrice: prices.length ? Math.max(...prices) / 100 : 0,
      software: Array.from(new Set(sessions.flatMap((s) => s.software))),
      image: sorted[0].image || "",
      format: sorted[0].format,
      tutorName: sorted[0].tutorName || "",
      learn: allLearn,
    });
  }
  return cohorts.sort((a, b) => a.firstDate.localeCompare(b.firstDate));
}

export function cohortDisplayTitle(cohort: Pick<Cohort, "track" | "level" | "title">): string {
  const trackLabel = TRACK_LABELS[cohort.track] ?? cohort.track;
  const levelSuffix = cohort.level && cohort.level !== "Foundations" ? ` - ${cohort.level}` : "";
  return trackLabel ? `${trackLabel}${levelSuffix}` : cohort.title || "Workshop";
}
