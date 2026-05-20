/**
 * Addition Search Engine — v1 (no AI)
 *
 * Scoring weights (additive per result):
 *   exact command name   +70
 *   exact title          +60
 *   problem phrase       +50
 *   synonym match        +35
 *   intent type match    +20
 *   software match       +20
 *   keyword/ilike        +15
 *   tag match            +10
 *   transcript           + 5
 *
 * Confidence bands:
 *   high   ≥ 80  → show results directly
 *   medium 50–79 → show results + optional clarification question
 *   low    < 50  → show clarification first, then results
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { normaliseQuery, tokenise, containsAny } from "./normalise";
import type {
  SearchIntent,
  ConfidenceBand,
  MatchReason,
  SearchResultItem,
  SearchResponse,
  ClarificationQuestion,
} from "./types";

// ── Intent classification ──────────────────────────────────────────────────

const INTENT_SIGNALS: Record<SearchIntent, string[]> = {
  troubleshooting: [
    "not working","won't","wont","broken","error","why","fix","problem",
    "issue","failed","disappear","nothing happens","can't","cannot","doesn't",
    "doesnt","keeps","why is","wrong",
  ],
  create_workflow: [
    "how do i make","how to make","make","create","model","build","generate",
    "draw","design","how do i create","how to create",
  ],
  learning: [
    "learn","beginner","start","course","basics","fundamentals","tutorial",
    "introduction","guide","how does",
  ],
  command_reference: [],  // detected by exact command name match, not keywords
  interoperability: [
    "export","import","send to","file type","dwg","fbx","obj","skp",
    "rhino inside","from rhino to","to revit","to blender","ifc",
  ],
  exploring: [
    "examples","what can","inspiration","ideas","what is possible","show me",
    "showcase","generative","parametric","gallery","portfolio",
  ],
};

function classifyIntent(raw: string, hasExactCommandMatch: boolean): SearchIntent {
  if (hasExactCommandMatch) return "command_reference";
  const q = raw.toLowerCase();
  for (const [intent, signals] of Object.entries(INTENT_SIGNALS) as [SearchIntent, string[]][]) {
    if (signals.length && signals.some(s => q.includes(s))) return intent;
  }
  return "learning";
}

// ── Confidence ─────────────────────────────────────────────────────────────

function band(score: number): ConfidenceBand {
  if (score >= 80) return "high";
  if (score >= 50) return "medium";
  return "low";
}

// ── Database row shapes ────────────────────────────────────────────────────

type CommandRow = {
  id: string; name: string; software: string | null;
  description: string | null; tags: string[] | null;
};
type ContentRow = {
  id: string; title: string; software: string | null;
  summary: string | null; tags: string[] | null; type: string;
};
type SynonymRow = {
  user_phrase: string; command_name: string | null;
  content_id: string | null; problem_slug: string | null; weight: number;
};
type ProblemRow = {
  slug: string; title: string; software: string | null;
  problem_type: string; user_phrases: string[];
  solution_summary: string | null; confidence_keywords: string[];
  clarification_questions: ClarificationQuestion[];
  related_command_names: string[];
};
type FixRow = {
  id: string; slug: string; title: string; software: string | null;
  symptoms: string[]; solution_steps: unknown;
  related_command_names: string[]; estimated_minutes: number;
};

// ── Main search function ───────────────────────────────────────────────────

export async function runSearch(
  db: SupabaseClient,
  rawQuery: string,
  opts: { userId?: string; software?: string } = {},
): Promise<SearchResponse> {

  const normQ   = normaliseQuery(rawQuery);
  const tokens  = tokenise(normQ);
  // Escape SQL LIKE special chars so user input can't inject wildcard patterns
  const ilike   = `%${rawQuery.replace(/[%_\\]/g, "\\$&")}%`;
  const softwareFilter = opts.software?.toLowerCase() ?? null;

  // ── 1. Fetch synonyms matching any token ────────────────────────────────
  // Pre-filter server-side using ilike on user_phrase — avoids fetching all rows.
  const { data: synonymRows } = await db
    .from("search_synonyms")
    .select("user_phrase,command_name,content_id,problem_slug,weight")
    .ilike("user_phrase", ilike)
    .limit(50) as { data: SynonymRow[] | null };

  const matchedSynonyms = (synonymRows ?? []).filter(s =>
    containsAny(rawQuery, [s.user_phrase])
  );
  const synonymCommandNames = new Set(
    matchedSynonyms.map(s => s.command_name).filter(Boolean) as string[]
  );
  const synonymContentIds = new Set(
    matchedSynonyms.map(s => s.content_id).filter(Boolean) as string[]
  );

  // ── 2. Fetch matching problems ──────────────────────────────────────────
  // Pre-filter server-side by title ilike — row-level phrase/keyword matching
  // still happens client-side since those are stored in array columns.
  const { data: problemRows } = await db
    .from("search_problems")
    .select("slug,title,software,problem_type,user_phrases,solution_summary,confidence_keywords,clarification_questions,related_command_names")
    .ilike("title", ilike)
    .limit(20) as { data: ProblemRow[] | null };

  const matchedProblems = (problemRows ?? []).filter(p => {
    const phrases = p.user_phrases ?? [];
    const keywords = p.confidence_keywords ?? [];
    return (
      containsAny(rawQuery, phrases) ||
      keywords.some(k => normQ.includes(k.toLowerCase()))
    );
  });

  // ── 3. Fetch matching fixes ─────────────────────────────────────────────
  // Pre-filter server-side by title ilike.
  const { data: fixRows } = await db
    .from("search_fixes")
    .select("id,slug,title,software,symptoms,solution_steps,related_command_names,estimated_minutes")
    .ilike("title", ilike)
    .limit(20) as { data: FixRow[] | null };

  const matchedFixes = (fixRows ?? []).filter(f => {
    const syms = f.symptoms ?? [];
    return (
      f.title.toLowerCase().includes(normQ) ||
      containsAny(rawQuery, syms)
    );
  });

  // ── 4. Fetch commands ───────────────────────────────────────────────────
  const { data: commandRows } = await db
    .from("addition_commands")
    .select("id,name,software,description,tags")
    .or(`name.ilike.${ilike},description.ilike.${ilike}`)
    .limit(40) as { data: CommandRow[] | null };

  // Pull synonym-matched commands that might not appear in the ilike query
  const synonymCommandsExtra: CommandRow[] = [];
  if (synonymCommandNames.size > 0) {
    const { data } = await db
      .from("addition_commands")
      .select("id,name,software,description,tags")
      .in("name", [...synonymCommandNames])
      .limit(10) as { data: CommandRow[] | null };
    (data ?? []).forEach(r => {
      if (!(commandRows ?? []).some(c => c.id === r.id)) synonymCommandsExtra.push(r);
    });
  }
  const allCommands = [...(commandRows ?? []), ...synonymCommandsExtra];

  // ── 5. Fetch combos + courses ───────────────────────────────────────────
  const { data: contentRows } = await db
    .from("addition_courses")
    .select("id,title,software,summary,tags,type")
    .or(`title.ilike.${ilike},summary.ilike.${ilike}`)
    .in("type", ["combo","course"])
    .limit(40) as { data: ContentRow[] | null };

  const allContent = contentRows ?? [];

  // ── 6. Detect exact command name match ─────────────────────────────────
  const exactCmd = allCommands.find(
    c => c.name.toLowerCase() === rawQuery.toLowerCase().trim()
  );
  const hasExactCommandMatch = Boolean(exactCmd);

  // ── 7. Classify intent ─────────────────────────────────────────────────
  const intent = classifyIntent(rawQuery, hasExactCommandMatch);

  // ── 8. Score every command ─────────────────────────────────────────────
  function scoreCommand(row: CommandRow): { score: number; reasons: MatchReason[] } {
    let score = 0;
    const reasons: MatchReason[] = [];
    const name = row.name.toLowerCase();
    const q    = rawQuery.toLowerCase();

    if (name === q) { score += 70; reasons.push("exact_command_name"); }
    else if (name.includes(q) || q.includes(name)) { score += 40; reasons.push("keyword_match"); }

    if (synonymCommandNames.has(row.name)) { score += 35; reasons.push("synonym_match"); }

    const swLower = (row.software ?? "").toLowerCase();
    if (softwareFilter && swLower === softwareFilter) { score += 20; reasons.push("software_match"); }

    const tags = row.tags ?? [];
    if (tokens.some(t => tags.some(tag => tag.toLowerCase().includes(t)))) {
      score += 10; reasons.push("tag_match");
    }

    const desc = (row.description ?? "").toLowerCase();
    if (tokens.some(t => desc.includes(t))) { score += 5; reasons.push("transcript_match"); }

    if (intent === "command_reference" || intent === "create_workflow") { score += 10; }

    return { score, reasons };
  }

  // ── 9. Score combos and courses ────────────────────────────────────────
  const INTENT_CONTENT_BOOST: Partial<Record<SearchIntent, Record<string, number>>> = {
    create_workflow:  { combo: 15, course: 5 },
    learning:         { course: 15, combo: 5 },
    troubleshooting:  { combo: 10, course: -5 },
    command_reference:{ combo: 10, course: 0 },
    exploring:        { combo: 10, course: 10 },
    interoperability: { combo: 10, course: 5 },
  };

  function scoreContent(row: ContentRow): { score: number; reasons: MatchReason[] } {
    let score = 0;
    const reasons: MatchReason[] = [];
    const title   = row.title.toLowerCase();
    const q       = rawQuery.toLowerCase();
    const summary = (row.summary ?? "").toLowerCase();

    if (title === q) { score += 60; reasons.push("exact_title"); }
    else if (title.startsWith(q)) { score += 40; reasons.push("keyword_match"); }
    else if (title.includes(q) || tokens.some(t => title.includes(t))) {
      score += 15; reasons.push("keyword_match");
    }

    if (synonymContentIds.has(row.id)) { score += 35; reasons.push("synonym_match"); }

    const swLower = (row.software ?? "").toLowerCase();
    if (softwareFilter && swLower === softwareFilter) { score += 20; reasons.push("software_match"); }

    const tags = row.tags ?? [];
    if (tokens.some(t => tags.some(tag => tag.toLowerCase().includes(t)))) {
      score += 10; reasons.push("tag_match");
    }

    if (tokens.some(t => summary.includes(t))) { score += 5; reasons.push("transcript_match"); }

    const boost = INTENT_CONTENT_BOOST[intent]?.[row.type] ?? 0;
    score += boost;
    if (boost > 0) reasons.push("intent_type");

    return { score, reasons };
  }

  // ── 10. Build result lists ─────────────────────────────────────────────
  const commandResults: SearchResultItem[] = allCommands
    .map(row => {
      const { score, reasons } = scoreCommand(row);
      return {
        id: row.id, type: "command" as const,
        title: row.name, software: row.software ?? "",
        description: row.description ?? "", tags: row.tags ?? [],
        score, matchReasons: reasons,
      };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const contentResults: SearchResultItem[] = allContent
    .map(row => {
      const { score, reasons } = scoreContent(row);
      return {
        id: row.id,
        type: row.type === "combo" ? "combo" as const : "course" as const,
        title: row.title, software: row.software ?? "",
        description: row.summary ?? "", tags: row.tags ?? [],
        score, matchReasons: reasons,
      };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  const fixResults: SearchResultItem[] = matchedFixes.map(f => ({
    id: f.slug, type: "fix" as const,
    title: f.title, software: f.software ?? "",
    description: f.symptoms.slice(0, 2).join(". "),
    tags: [], score: 50,
    matchReasons: ["problem_phrase" as MatchReason],
    estimatedMinutes: f.estimated_minutes,
    relatedCommands: f.related_command_names,
  }));

  const problemResults: SearchResultItem[] = matchedProblems.map(p => ({
    id: p.slug, type: "problem" as const,
    title: p.title, software: p.software ?? "",
    description: p.solution_summary ?? "",
    tags: [], score: 45,
    matchReasons: ["problem_phrase" as MatchReason],
    relatedCommands: p.related_command_names,
  }));

  // ── 11. Overall confidence score ───────────────────────────────────────
  const allScores = [
    ...commandResults.map(r => r.score),
    ...contentResults.map(r => r.score),
    ...fixResults.map(r => r.score),
    ...problemResults.map(r => r.score),
  ];
  const topScore = allScores.length ? Math.max(...allScores) : 0;
  const confidenceScore = Math.min(100, topScore);
  const confidence = band(confidenceScore);

  // ── 12. Clarification questions ────────────────────────────────────────
  // Pull from matched problems; show at most 2 questions
  const clarificationQuestions: ClarificationQuestion[] = [];
  if (confidence !== "high") {
    for (const p of matchedProblems) {
      const qs = (p.clarification_questions ?? []) as ClarificationQuestion[];
      for (const q of qs) {
        if (clarificationQuestions.length < 2) clarificationQuestions.push(q);
      }
    }
    // Generic software clarification if no software detected and multiple software in results
    if (!softwareFilter && clarificationQuestions.length === 0) {
      const softwares = [...new Set([
        ...commandResults.map(r => r.software),
        ...contentResults.map(r => r.software),
      ].filter(Boolean))];
      if (softwares.length > 1) {
        clarificationQuestions.push({
          question: "Which software are you using?",
          field: "software",
          options: softwares.slice(0, 5).map(sw => ({
            label: sw, value: sw.toLowerCase(), routes_to: "",
          })),
        });
      }
    }
  }

  const needsClarification = confidence === "low" && clarificationQuestions.length > 0;

  // ── 13. Write search log ───────────────────────────────────────────────
  const allResultsForLog = [
    ...commandResults,
    ...contentResults,
    ...fixResults,
    ...problemResults,
  ];
  let logId: string | null = null;
  const noResult = allResultsForLog.length === 0;

  try {
    const { data: logRow } = await db.from("search_logs").insert({
      user_id:              opts.userId ?? null,
      raw_query:            rawQuery,
      normalised_query:     normQ,
      detected_intent:      intent,
      detected_software:    softwareFilter ?? null,
      confidence_score:     confidenceScore,
      result_count:         allResultsForLog.length,
      results_returned:     allResultsForLog.slice(0, 20).map(r => ({ id: r.id, type: r.type, score: r.score })),
      clarification_needed: needsClarification,
      clarification_shown:  clarificationQuestions,
      no_result:            noResult,
    }).select("id").single();
    logId = logRow?.id ?? null;

    // Log failed searches
    if (noResult || confidence === "low") {
      await db.from("search_failed_searches").insert({
        search_log_id:    logId,
        raw_query:        rawQuery,
        normalised_query: normQ,
        reason:           noResult ? "no_match" : "low_confidence",
      });
    }
  } catch {
    // Logging failure is non-fatal
  }

  const total = commandResults.length + contentResults.length + fixResults.length + problemResults.length;

  return {
    query: rawQuery,
    normalisedQuery: normQ,
    intent,
    confidence,
    confidenceScore,
    results: [...commandResults, ...contentResults].sort((a, b) => b.score - a.score),
    fixes: fixResults,
    problems: problemResults,
    needsClarification,
    clarificationQuestions,
    logId,
    total,
  };
}
