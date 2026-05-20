import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";

const AiTaskSchema = z.enum([
  "course-overview",
  "lesson-plan",
  "lesson-script",
  "lesson-steps",
  "practice-task",
  "flashcard-deck",
  "quiz-question",
  "certificate",
]);

const GenerateSchema = z.object({
  task: AiTaskSchema,
  context: z.record(z.string(), z.unknown()).default({}),
  notes: z.string().default(""),
});

type AiTask = z.infer<typeof AiTaskSchema>;

const FIELD_GUIDANCE: Record<AiTask, string> = {
  "course-overview": `
Return JSON with:
summary: concise course description for learners.
coursePromise: what the course helps learners achieve.
learningOutcome: practical outcome by the end.
category: short content category.
level: Beginner, Intermediate, or Advanced.
`,
  "lesson-plan": `
Return JSON with:
title: improved lesson title.
learningOutcome: one practical learner outcome.
content: short lesson summary.
durationMin: realistic integer duration in minutes.
commonMistakeSummary: concise note on likely learner mistakes.
`,
  "lesson-script": `
Return JSON with:
voiceover: clear spoken script for a short teaching video.
screenAction: matching screen actions, step by step.
shortSafeEnding: ending that works when reused as a short clip.
courseCta: separate course-specific CTA.
transcript: clean transcript version.
`,
  "lesson-steps": `
Return JSON with:
steps: ordered lesson steps with key concepts, software actions, common mistakes and troubleshooting.
linkedCommands: comma-separated likely command names.
linkedCombos: comma-separated likely workflow combos.
resourceNotes: suggested supporting resources.
`,
  "practice-task": `
Return JSON with:
practiceTask: reusable practice task instructions.
successCriteria: bullet-style success criteria.
optionalChallenge: stretch challenge.
commonMistakes: likely mistakes and fixes.
`,
  "flashcard-deck": `
Return JSON with:
title: clear deck title.
software: software name if known.
topic: focused practice topic.
description: short explanation of what the deck trains.
cards: array of objects with front, back, and hint. Create 8 to 12 high-quality cards.
`,
  "quiz-question": `
Return JSON with:
software: software name if known.
topic: focused quiz topic.
question_text: one clear learner question.
question_type: mc, tf, or short. Prefer mc unless context asks otherwise.
options: array of 4 options for mc, or 2 options for tf.
correct_answer: exact correct answer.
explanation: why the answer is correct.
difficulty: beginner, intermediate, or advanced.
tags: array of short tags.
`,
  certificate: `
Return JSON with:
title: certificate title.
software: software name if known.
description: short description of what the certificate validates.
passing_score: integer between 70 and 90.
`,
};

function instructionsFor(task: AiTask): string {
  return `
You are Addition Academy's senior course producer for architecture, design and computational software education.
Generate calm, practical, accurate LMS/CMS content for microlearning.
Write for learners using the Addition Academy launch stack: Rhino, Grasshopper, Revit, Dynamo, Twinmotion, Unreal Engine, Adobe and AI.

Rules:
- Return JSON only. No markdown fences.
- Keep copy specific, practical and easy to scan.
- Do not invent URLs, prices, dates, tutors or certification claims.
- Keep course CTAs separate from reusable voiceover.
- Prefer concrete design/software actions over marketing language.
- If context is missing, make a conservative draft and avoid pretending it is final.

${FIELD_GUIDANCE[task]}
`;
}

function extractOutputText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  if (typeof record.output_text === "string") return record.output_text;
  const output = Array.isArray(record.output) ? record.output : [];
  return output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const content = (item as Record<string, unknown>).content;
      return Array.isArray(content) ? content : [];
    })
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const value = (item as Record<string, unknown>).text;
      return typeof value === "string" ? value : "";
    })
    .join("\n")
    .trim();
}

function parseGeneratedFields(text: string): Record<string, unknown> {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(trimmed) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("AI response was not a JSON object.");
  }

  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === "string" || typeof value === "number") fields[key] = value;
    if (typeof value === "boolean" || Array.isArray(value)) fields[key] = value;
  }
  return fields;
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return errorResponse("OPENAI_API_KEY is not configured on the server.", 503);
  }

  try {
    const parsed = GenerateSchema.parse(await request.json());
    const model = process.env.OPENAI_MODEL || "gpt-5.2";
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        instructions: instructionsFor(parsed.task),
        input: JSON.stringify({
          task: parsed.task,
          notes: parsed.notes,
          context: parsed.context,
        }),
        max_output_tokens: 1800,
      }),
    });

    const json = await response.json() as unknown;
    if (!response.ok) {
      const message = json && typeof json === "object" && "error" in json
        ? JSON.stringify((json as { error: unknown }).error)
        : "OpenAI request failed.";
      return errorResponse(message, response.status);
    }

    const outputText = extractOutputText(json);
    if (!outputText) return errorResponse("OpenAI returned no text output.", 502);

    return okResponse({
      task: parsed.task,
      model,
      fields: parseGeneratedFields(outputText),
      raw: outputText,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "AI generation failed.", 400);
  }
}
