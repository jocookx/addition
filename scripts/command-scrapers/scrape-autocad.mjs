/**
 * AutoCAD shortcut/alias scraper.
 *
 * Source: https://www.autodesk.com/shortcuts/autocad (current default
 * command aliases and key combinations)
 *
 * What it harvests (factual data only): command names and their typed
 * aliases / key combinations. Documentation prose is never imported —
 * descriptions in src/data/commands/autocad.json are our own and are
 * preserved on merge.
 *
 * Usage:
 *   node scripts/command-scrapers/scrape-autocad.mjs           # → output/autocad-shortcuts.json
 *   node scripts/command-scrapers/scrape-autocad.mjs --merge   # merge alias facts into src/data/commands/autocad.json
 */

import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { fetchText, stripTags, writeJson, mergeFactsIntoDataset, nameKey } from "./lib.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dir, "output");
const SHORTCUTS_URL = "https://www.autodesk.com/shortcuts/autocad";

const args = new Set(process.argv.slice(2));

async function scrapeShortcuts() {
  const html = await fetchText(SHORTCUTS_URL);
  const results = [];

  // 1) Preferred: JSON payload embedded by the shortcuts SPA.
  const jsonBlobRe = /\{"[^"]*(?:command|shortcut|hotkey)[^"]*":[\s\S]{0,200000}?\}(?=\s*[,\]<])/gi;
  for (const blob of html.match(jsonBlobRe) || []) {
    try {
      const obj = JSON.parse(blob);
      const name = obj.command || obj.name || obj.title;
      const keys = obj.keys || obj.shortcut || obj.hotkey || obj.windows;
      if (name && keys) results.push({ name: stripTags(String(name)), shortcut: String(keys).trim() });
    } catch {
      // not a clean JSON fragment — ignore
    }
  }

  // 2) Fallback: server-rendered tables (alias → command rows).
  if (results.length === 0) {
    const rowRe = /<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/gi;
    let m;
    while ((m = rowRe.exec(html))) {
      const a = stripTags(m[1]);
      const b = stripTags(m[2]);
      if (!a || !b) continue;
      // Autodesk lists these as "SHORTCUT | COMMAND" — detect which column
      // is the alias (short, no spaces) and which the command name.
      const [shortcut, name] = a.length <= b.length ? [a, b] : [b, a];
      if (shortcut.length <= 20) results.push({ name, shortcut });
    }
  }

  const seen = new Set();
  return results.filter((r) => {
    const k = nameKey(r.name);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function main() {
  console.log(`Fetching AutoCAD shortcuts: ${SHORTCUTS_URL}`);
  const shortcuts = await scrapeShortcuts();
  writeJson(resolve(OUT, "autocad-shortcuts.json"), shortcuts);
  console.log(`${shortcuts.length} aliases/shortcuts harvested.`);

  if (args.has("--merge")) {
    mergeFactsIntoDataset(
      resolve(__dir, "../../src/data/commands/autocad.json"),
      shortcuts.map((s) => ({ name: s.name, shortcut: s.shortcut, source: SHORTCUTS_URL })),
      { softwareLabel: "AutoCAD", fields: ["shortcut", "source"] },
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
