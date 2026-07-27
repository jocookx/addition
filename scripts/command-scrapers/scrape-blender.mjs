/**
 * Blender keymap scraper.
 *
 * Source: https://docs.blender.org/manual/en/latest/ (Blender Manual)
 *
 * What it harvests (factual data only): operator/tool names and their
 * default keyboard shortcuts from the manual's keymap reference pages.
 * The manual's prose is CC-BY-SA 4.0 — we do NOT import it. Descriptions
 * in src/data/commands/blender.json are our own and are preserved on merge.
 *
 * Usage:
 *   node scripts/command-scrapers/scrape-blender.mjs           # → output/blender-shortcuts.json
 *   node scripts/command-scrapers/scrape-blender.mjs --merge   # merge shortcut facts into src/data/commands/blender.json
 */

import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { fetchText, mapConcurrent, stripTags, writeJson, mergeFactsIntoDataset, nameKey } from "./lib.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dir, "output");
const BASE = "https://docs.blender.org/manual/en/latest/";

// Keymap-bearing reference pages. Extend as the manual grows.
const PAGES = [
  "interface/keymap/blender_default.html",
  "interface/window_system/introduction.html",
  "editors/3dview/navigate/navigation.html",
  "editors/3dview/modeling/meshes/editing/introduction.html",
  "modeling/meshes/editing/mesh_tools.html",
  "modeling/meshes/editing/vertex_tools.html",
  "modeling/meshes/editing/edge_tools.html",
  "modeling/meshes/editing/face_tools.html",
  "modeling/curves/editing/introduction.html",
  "sculpt_paint/sculpting/introduction.html",
  "editors/uv/editing.html",
  "animation/keyframes/editing.html",
  "editors/graph_editor/introduction.html",
  "video_editing/edit/montage/editing.html",
];

const args = new Set(process.argv.slice(2));

/**
 * The manual marks shortcuts with <kbd> elements; the operator/tool name is
 * the nearest preceding heading or definition term. We walk each page with a
 * tolerant regex pass: capture (heading|dt) → following <kbd> keys.
 */
function extractFromPage(html, pageUrl) {
  const out = [];
  const blockRe = /<(h[1-4]|dt)[^>]*>([\s\S]*?)<\/\1>([\s\S]*?)(?=<(?:h[1-4]|dt)[^>]*>|$)/gi;
  let m;
  while ((m = blockRe.exec(html))) {
    const name = stripTags(m[2]).replace(/[¶#]+$/, "").trim();
    if (!name || name.length > 60) continue;
    const kbdMatches = [...m[3].matchAll(/<kbd[^>]*>([\s\S]*?)<\/kbd>/gi)].map((k) => stripTags(k[1]));
    if (kbdMatches.length === 0) continue;
    // The manual nests key parts in separate kbd tags; the first run of
    // parts up to 4 forms the primary binding.
    const shortcut = kbdMatches.slice(0, 4).join("-").replace(/-(?=[+-])/g, "");
    if (!shortcut || shortcut.length > 30) continue;
    out.push({ name, shortcut, source: pageUrl });
  }
  return out;
}

async function main() {
  console.log(`Fetching ${PAGES.length} Blender manual keymap pages…`);
  const perPage = await mapConcurrent(
    PAGES,
    async (p) => extractFromPage(await fetchText(BASE + p), BASE + p),
    { concurrency: 4, delayMs: 250 },
  );

  const seen = new Set();
  const shortcuts = [];
  for (const page of perPage) {
    if (!Array.isArray(page)) continue; // fetch error already logged into results
    for (const s of page) {
      const k = nameKey(s.name);
      if (seen.has(k)) continue;
      seen.add(k);
      shortcuts.push(s);
    }
  }

  writeJson(resolve(OUT, "blender-shortcuts.json"), shortcuts);
  console.log(`${shortcuts.length} named shortcuts harvested.`);

  if (args.has("--merge")) {
    mergeFactsIntoDataset(
      resolve(__dir, "../../src/data/commands/blender.json"),
      shortcuts,
      { softwareLabel: "Blender", fields: ["shortcut", "source"] },
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
