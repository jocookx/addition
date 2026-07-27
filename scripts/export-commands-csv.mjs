/**
 * Export src/data/commands/*.json to admin-importable CSVs.
 *
 * Output CSVs match the "commands" entity in src/server/cms/csv-bulk.ts
 * (columns + "|" list separator), so they can be uploaded straight through
 * Admin → CSV → Command Library.
 *
 * Usage (repo root):
 *   node scripts/export-commands-csv.mjs            # all softwares → src/data/commands/csv/
 *   node scripts/export-commands-csv.mjs rhino maya # selected softwares
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dir, "../src/data/commands");
const CSV_DIR = resolve(DATA_DIR, "csv");

const COLUMNS = ["id", "name", "software", "menu", "description", "shortcut", "addon", "difficulty", "tags", "intent_categories", "object_types", "outcomes", "icon", "gif", "source"];

const only = process.argv.slice(2).map((a) => a.toLowerCase());

function cell(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const files = readdirSync(DATA_DIR)
  .filter((f) => f.endsWith(".json"))
  .filter((f) => only.length === 0 || only.includes(basename(f, ".json")));

mkdirSync(CSV_DIR, { recursive: true });

for (const file of files) {
  const raw = JSON.parse(readFileSync(resolve(DATA_DIR, file), "utf8"));
  if (!raw.meta?.software || !Array.isArray(raw.commands)) continue;

  const rows = raw.commands
    .filter((c) => c.name?.trim() && c.description?.trim() && !c.needsExplanation)
    .map((c) => COLUMNS.map((col) => {
      switch (col) {
        case "id": return "";
        case "software": return raw.meta.software;
        case "tags": return (c.tags || []).join("|");
        case "intent_categories": return (c.intent_categories || []).join("|");
        case "object_types": return (c.object_types || []).join("|");
        case "outcomes": return (c.outcomes || []).join("|");
        case "difficulty": return c.difficulty || "beginner";
        case "source": return c.source || raw.meta.source || "";
        default: return c[col] ?? "";
      }
    }).map(cell).join(","));

  const out = resolve(CSV_DIR, `${basename(file, ".json")}.csv`);
  writeFileSync(out, [COLUMNS.join(","), ...rows].join("\n") + "\n", "utf8");
  console.log(`${out}: ${rows.length} rows`);
}
