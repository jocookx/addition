/**
 * Maya shortcut + command-index scraper.
 *
 * Sources:
 *   - https://www.autodesk.com/shortcuts/maya           (current default hotkeys)
 *   - https://help.autodesk.com/cloudhelp/2016/ENU/Maya-Tech-Docs/Commands/index.html
 *     (MEL command index — harvested as an alias/reference list only)
 *
 * What it harvests (factual data only): shortcut keys, command/tool names,
 * MEL command names and their doc URLs. Documentation prose is never
 * imported — descriptions in src/data/commands/maya.json are our own and
 * are preserved on merge.
 *
 * Usage:
 *   node scripts/command-scrapers/scrape-maya.mjs           # → output/maya-shortcuts.json, output/maya-mel-commands.json
 *   node scripts/command-scrapers/scrape-maya.mjs --merge   # merge shortcut facts into src/data/commands/maya.json
 */

import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { fetchText, stripTags, writeJson, mergeFactsIntoDataset, nameKey, readJson } from "./lib.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dir, "output");
const SHORTCUTS_URL = "https://www.autodesk.com/shortcuts/maya";
const MEL_INDEX_BASE = "https://help.autodesk.com/cloudhelp/2016/ENU/Maya-Tech-Docs/Commands/";

const args = new Set(process.argv.slice(2));

async function scrapeShortcuts() {
  const html = await fetchText(SHORTCUTS_URL);
  const results = [];

  // 1) Preferred: JSON payload embedded by the shortcuts SPA.
  //    Look for arrays of {command/name, keys/shortcut} shaped objects.
  const jsonBlobRe = /\{"[^"]*(?:command|shortcut|hotkey)[^"]*":[\s\S]{0,200000}?\}(?=\s*[,\]<])/gi;
  const candidates = html.match(jsonBlobRe) || [];
  for (const blob of candidates) {
    try {
      const obj = JSON.parse(blob);
      const name = obj.command || obj.name || obj.title;
      const keys = obj.keys || obj.shortcut || obj.hotkey || obj.windows;
      if (name && keys) results.push({ name: stripTags(String(name)), shortcut: String(keys).trim() });
    } catch {
      // not a clean JSON fragment — ignore
    }
  }

  // 2) Fallback: server-rendered tables (th/td rows of action → keys).
  if (results.length === 0) {
    const rowRe = /<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/gi;
    let m;
    while ((m = rowRe.exec(html))) {
      const name = stripTags(m[1]);
      const shortcut = stripTags(m[2]);
      if (name && shortcut && shortcut.length <= 40) results.push({ name, shortcut });
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

async function scrapeMelIndex() {
  // The 2016 command reference index is frame-based; index_all.html carries
  // the complete alphabetical list of MEL commands.
  const candidates = ["index_all.html", "index.html"];
  for (const page of candidates) {
    try {
      const html = await fetchText(MEL_INDEX_BASE + page);
      const linkRe = /<a[^>]+href="([a-zA-Z0-9_]+\.html)"[^>]*>([\s\S]*?)<\/a>/gi;
      const out = [];
      const seen = new Set();
      let m;
      while ((m = linkRe.exec(html))) {
        const name = stripTags(m[2]);
        if (!name || /^index/i.test(m[1]) || seen.has(name)) continue;
        seen.add(name);
        out.push({ mel: name, url: MEL_INDEX_BASE + m[1] });
      }
      if (out.length > 100) return out;
    } catch {
      // try next candidate page
    }
  }
  return [];
}

async function main() {
  console.log(`Fetching Maya shortcuts: ${SHORTCUTS_URL}`);
  const shortcuts = await scrapeShortcuts();
  writeJson(resolve(OUT, "maya-shortcuts.json"), shortcuts);
  console.log(`${shortcuts.length} shortcuts harvested.`);

  console.log(`Fetching MEL command index…`);
  const mel = await scrapeMelIndex();
  writeJson(resolve(OUT, "maya-mel-commands.json"), mel);
  console.log(`${mel.length} MEL command names harvested (reference/alias list — not auto-added to the app).`);

  if (args.has("--merge")) {
    const datasetPath = resolve(__dir, "../../src/data/commands/maya.json");

    // Shortcuts: fill missing shortcut fields on records we already teach.
    mergeFactsIntoDataset(
      datasetPath,
      shortcuts.map((s) => ({ name: s.name, shortcut: s.shortcut, source: SHORTCUTS_URL })),
      { softwareLabel: "Maya", fields: ["shortcut", "source"] },
    );

    // MEL names: attach doc URL as an alias reference where names line up.
    const dataset = readJson(datasetPath);
    const melByKey = new Map(mel.map((m) => [nameKey(m.mel), m]));
    let aliased = 0;
    for (const c of dataset.commands) {
      for (const alias of [c.name, ...(c.aliases || [])]) {
        const hit = melByKey.get(nameKey(alias));
        if (hit && !(c.aliases || []).includes(hit.mel)) {
          c.aliases = [...(c.aliases || []), hit.mel];
          aliased++;
          break;
        }
      }
    }
    writeJson(datasetPath, dataset);
    console.log(`${aliased} records gained MEL aliases.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
