/**
 * Smart course/content search match — ported from vanilla app.js
 * (smartCourseSearchMatch + tokenizeSearchQuery + buildMatchSnippet).
 *
 * Returns a score and the best matching label/snippet for a content item
 * given a query. Score = 0 means "doesn't match"; > 0 means "matches".
 */

export type SmartMatchResult = {
  score: number;
  matchLabel: string;
  matchSnippet: string;
  matchLessonId: string | null;
};

export type SmartMatchTarget = {
  id: string;
  title: string;
  summary?: string;
  software?: string;
  commands?: Array<string | { name?: string; id?: string }>;
  modules?: Array<{
    title?: string;
    lessons?: Array<{ id?: string; title?: string; content?: string; module?: string }>;
  }>;
  // Pre-flattened lessons (alternative to modules)
  lessons?: Array<{ id?: string; title?: string; content?: string; module?: string }>;
};

// ── Tokenisation & snippet helpers ────────────────────────────────────────

export function tokenizeSearchQuery(query: string): string[] {
  return String(query || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export function buildMatchSnippet(text: string, query: string): string {
  const raw = String(text || "").trim();
  const q = String(query || "").trim().toLowerCase();
  if (!raw) return "";
  if (!q) return raw.slice(0, 120);
  const idx = raw.toLowerCase().indexOf(q);
  if (idx === -1) return raw.slice(0, 120);
  const start = Math.max(0, idx - 40);
  const end = Math.min(raw.length, idx + q.length + 50);
  return `${start > 0 ? "…" : ""}${raw.slice(start, end)}${end < raw.length ? "…" : ""}`;
}

// ── Core match scorer ─────────────────────────────────────────────────────

function flatLessons(target: SmartMatchTarget) {
  if (Array.isArray(target.lessons)) return target.lessons;
  if (Array.isArray(target.modules)) {
    return target.modules.flatMap((m) =>
      (m.lessons || []).map((l) => ({ ...l, module: l.module || m.title || "" })),
    );
  }
  return [];
}

export function smartCourseSearchMatch(
  target: SmartMatchTarget,
  query: string,
  boostCommandLike = false,
): SmartMatchResult {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return { score: 1, matchLabel: "", matchSnippet: "", matchLessonId: null };
  const terms = tokenizeSearchQuery(q);
  if (!terms.length) return { score: 0, matchLabel: "", matchSnippet: "", matchLessonId: null };

  const title    = String(target.title || "").toLowerCase();
  const summary  = String(target.summary || "").toLowerCase();
  const software = String(target.software || "").toLowerCase();
  const commands = (target.commands || [])
    .map((c) => (typeof c === "string" ? c : String(c?.name || c?.id || "")))
    .join(" ").toLowerCase();
  const modules  = (target.modules || []).map((m) => String(m?.title || "")).join(" ").toLowerCase();
  const lessonItems = flatLessons(target);
  const lessons  = lessonItems
    .map((l) => `${String(l.title || "")} ${String(l.content || "")} ${String(l.module || "")}`)
    .join(" ").toLowerCase();

  let score = 0;
  let best: SmartMatchResult = { score: 0, matchLabel: "", matchSnippet: "", matchLessonId: null };
  const pick = (c: SmartMatchResult) => { if (c.score > best.score) best = c; };

  if (title.includes(q)) {
    score += 140;
    pick({ score: 140, matchLabel: `Course: ${target.title}`, matchSnippet: buildMatchSnippet(target.title, q), matchLessonId: null });
  }
  if (summary.includes(q)) {
    score += 70;
    pick({ score: 70, matchLabel: "Course summary", matchSnippet: buildMatchSnippet(target.summary || "", q), matchLessonId: null });
  }
  if (commands.includes(q)) {
    score += 120;
    pick({ score: 120, matchLabel: "Command reference", matchSnippet: buildMatchSnippet(commands, q), matchLessonId: null });
  }
  if (modules.includes(q)) score += 90;
  if (lessons.includes(q)) score += 110;
  if (software.includes(q)) score += 45;

  for (const lesson of lessonItems) {
    const lessonText = `${lesson.module || ""} ${lesson.title || ""} ${lesson.content || ""}`.trim();
    if (!lessonText || !lessonText.toLowerCase().includes(q)) continue;
    pick({
      score: 170,
      matchLabel: `${lesson.module || "Module"} · ${lesson.title || "Lesson"}`,
      matchSnippet: buildMatchSnippet(lesson.content || lesson.title || "", q),
      matchLessonId: lesson.id || null,
    });
  }

  for (const term of terms) {
    if (term.length < 2) continue;
    if (title.includes(term))    score += 28;
    if (summary.includes(term))  score += 12;
    if (commands.includes(term)) score += 20;
    if (modules.includes(term))  score += 16;
    if (lessons.includes(term))  score += 18;
    if (software.includes(term)) score += 8;
  }

  if (boostCommandLike) {
    if (commands.includes(q)) score += 60;
    if (lessons.includes(q))  score += 35;
    if (modules.includes(q))  score += 20;
  }

  return { score, matchLabel: best.matchLabel, matchSnippet: best.matchSnippet, matchLessonId: best.matchLessonId };
}

// ── Convenience: rank a list ─────────────────────────────────────────────

export type SmartMatchMeta = Pick<SmartMatchResult, "matchLabel" | "matchSnippet" | "matchLessonId">;

/**
 * Like rankBySmartMatch but also returns match metadata (label + snippet)
 * alongside each item so callers can show "matched in Lesson X".
 */
export function rankBySmartMatchWithMeta<T>(
  items: T[],
  query: string,
  opts: {
    boostCommandLike?: boolean;
    target?: (item: T) => SmartMatchTarget;
  } = {},
): Array<{ item: T } & SmartMatchMeta> {
  const q = query.trim();
  const adapt = opts.target ?? ((item: T) => item as unknown as SmartMatchTarget);
  if (!q) {
    return items.map((item) => ({ item, matchLabel: "", matchSnippet: "", matchLessonId: null }));
  }
  return items
    .map((item) => {
      const { score, matchLabel, matchSnippet, matchLessonId } = smartCourseSearchMatch(
        adapt(item), q, opts.boostCommandLike,
      );
      return { item, score, matchLabel, matchSnippet, matchLessonId };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ score, ...rest }) => rest);
}

/**
 * Rank items by smart-match relevance. Returns the original items in score
 * order (no shape changes). Empty query → returns input as-is.
 *
 * Accepts an optional `target` function so callers with a different item
 * shape can adapt to SmartMatchTarget without losing their type.
 */
export function rankBySmartMatch<T>(
  items: T[],
  query: string,
  opts: {
    boostCommandLike?: boolean;
    /** Adapt the item to a SmartMatchTarget. Defaults to item-as-target. */
    target?: (item: T) => SmartMatchTarget;
  } = {},
): T[] {
  const q = query.trim();
  if (!q) return items;
  const adapt = opts.target ?? ((item: T) => item as unknown as SmartMatchTarget);
  return items
    .map((item) => ({ item, ...smartCourseSearchMatch(adapt(item), q, opts.boostCommandLike) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}

// ── Vanilla helper: filterBySoftwareAndSearch ────────────────────────────
// Original `state.software === "All" || item.software === state.software`
// then `mapper(item).toLowerCase().includes(query)`.

export function filterBySoftwareAndSearch<T>(
  items: T[],
  query: string,
  _software: string | null,
  mapper: (item: T) => string,
): T[] {
  // Note: software filtering must be done by the caller before passing items in.
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => mapper(item).toLowerCase().includes(q));
}
