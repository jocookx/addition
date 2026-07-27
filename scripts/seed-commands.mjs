/**
 * Seed addition_commands from the in-repo command repository:
 *   src/data/commands/*.json  →  Supabase table addition_commands
 *
 * Every software the app teaches has one dataset file. Records carry our
 * own explanations plus factual data (shortcuts, menus, icons) that the
 * scrapers in scripts/command-scrapers/ keep in sync with the official
 * references.
 *
 * Usage (repo root):
 *   node scripts/seed-commands.mjs                 # seed everything
 *   node scripts/seed-commands.mjs rhino maya      # seed selected softwares
 *   node scripts/seed-commands.mjs --dry-run       # validate + count only
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";
import { resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dir, "../src/data/commands");

const cliArgs = process.argv.slice(2);
const dryRun = cliArgs.includes("--dry-run");
const only = cliArgs.filter((a) => !a.startsWith("--")).map((a) => a.toLowerCase());

// ── Env ──────────────────────────────────────────────────────────────────────
let supabase = null;
if (!dryRun) {
  const envPath = resolve(__dir, "../.env.local");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] ??= m[2].trim();
  }
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

// ── Fallback taggers (used only when a record's arrays are empty) ────────────
const INTENTS = ["create", "edit", "transform", "organise", "document", "analyse", "visualise"];
const OBJECT_TYPES = ["curve", "surface", "solid", "subd", "mesh", "point", "annotation", "layout", "layer", "view"];
const OUTCOMES = ["move", "copy", "scale", "rotate", "cut", "join", "offset", "thicken", "split", "smooth", "mirror", "array", "annotate", "measure", "navigate"];
const DIFFICULTIES = new Set(["beginner", "intermediate", "advanced"]);

function fallbackIntents(name) {
  const n = name.toLowerCase();
  const out = [];
  if (/create|make|build|draw|add|insert|place|new/.test(n)) out.push("create");
  if (/edit|modify|adjust|fillet|blend|rebuild|convert|delete|remove|undo|redo/.test(n)) out.push("edit");
  if (/move|rotate|scale|mirror|array|copy|orient|align|flow|bend|twist/.test(n)) out.push("transform");
  if (/layer|group|hide|show|lock|select|filter|rename/.test(n)) out.push("organise");
  if (/dim|text|leader|hatch|print|layout|sheet|annotat/.test(n)) out.push("document");
  if (/measure|length|area|volume|angle|distance|check|analys|analyz/.test(n)) out.push("analyse");
  if (/display|render|shade|view|camera|zoom|pan|mode/.test(n)) out.push("visualise");
  return out.length ? out : ["create"];
}

// ── Load + validate datasets ─────────────────────────────────────────────────
const files = readdirSync(DATA_DIR)
  .filter((f) => f.endsWith(".json"))
  .filter((f) => only.length === 0 || only.includes(basename(f, ".json")));

if (files.length === 0) {
  console.error(`No dataset files matched in ${DATA_DIR}`);
  process.exit(1);
}

const records = [];
const problems = [];
const seen = new Set();

for (const file of files) {
  const raw = JSON.parse(readFileSync(resolve(DATA_DIR, file), "utf8"));
  const software = raw.meta?.software;
  if (!software || !Array.isArray(raw.commands)) {
    problems.push(`${file}: missing meta.software or commands[]`);
    continue;
  }

  let count = 0;
  for (const c of raw.commands) {
    if (!c.name?.trim()) {
      problems.push(`${file}: record with empty name skipped`);
      continue;
    }
    if (c.needsExplanation || !c.description?.trim()) {
      problems.push(`${file}: "${c.name}" has no explanation yet — skipped (write ours, then reseed)`);
      continue;
    }
    const key = `${software}::${c.name.toLowerCase()}`;
    if (seen.has(key)) {
      problems.push(`${file}: duplicate "${c.name}" skipped`);
      continue;
    }
    seen.add(key);

    records.push({
      name: c.name.trim(),
      software,
      menu: c.menu || "",
      description: c.description.trim(),
      shortcut: c.shortcut || "",
      addon: c.addon || "",
      icon: c.icon || "",
      gif: c.gif || "",
      source: c.source || raw.meta?.source || "",
      video: c.video || "",
      tags: (c.tags || []).filter(Boolean),
      intent_categories: (c.intent_categories || []).filter((i) => INTENTS.includes(i)).length
        ? c.intent_categories.filter((i) => INTENTS.includes(i))
        : fallbackIntents(c.name),
      object_types: (c.object_types || []).filter((o) => OBJECT_TYPES.includes(o)),
      outcomes: (c.outcomes || []).filter((o) => OUTCOMES.includes(o)),
      difficulty: DIFFICULTIES.has(c.difficulty) ? c.difficulty : "beginner",
      aliases: (c.aliases || []).filter(Boolean),
      related_commands: (c.related_commands || []).filter(Boolean),
    });
    count++;
  }
  console.log(`${file}: ${count} records ready (${software})`);
}

if (problems.length) {
  console.log(`\n${problems.length} notes:`);
  for (const p of problems.slice(0, 40)) console.log(`  - ${p}`);
  if (problems.length > 40) console.log(`  … and ${problems.length - 40} more`);
}

console.log(`\nTotal: ${records.length} commands across ${files.length} dataset files.`);
if (dryRun) process.exit(0);

// ── Upsert ───────────────────────────────────────────────────────────────────
const BATCH = 100;
let upserted = 0;

async function upsertBatch(batch) {
  let { error } = await supabase
    .from("addition_commands")
    .upsert(batch, { onConflict: "name,software" });

  // Legacy schema fallback (pre-shortcut/addon/video columns)
  if (error && /column .* does not exist/i.test(error.message)) {
    const slim = batch.map(({ shortcut, addon, video, aliases, related_commands, ...rest }) => rest);
    ({ error } = await supabase
      .from("addition_commands")
      .upsert(slim, { onConflict: "name,software" }));
  }
  return error;
}

for (let i = 0; i < records.length; i += BATCH) {
  const batch = records.slice(i, i + BATCH);
  const error = await upsertBatch(batch);
  if (error) {
    console.error(`\nBatch ${i}–${i + batch.length} failed: ${error.message}`);
  } else {
    upserted += batch.length;
    process.stdout.write(`\r${upserted}/${records.length}…`);
  }
}

console.log(`\nDone. ${upserted} commands upserted.`);
