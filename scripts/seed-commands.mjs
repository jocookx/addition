/**
 * Seed addition_commands from rhino_commands_enriched.js (primary)
 * merged with rhino_commands_3dd.csv (icon URLs from McNeel docs)
 *
 * Usage (from apps/web/):
 *   node scripts/seed-commands.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../.env.local");
const envLines = readFileSync(envPath, "utf8").split("\n");
for (const line of envLines) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Helpers ──────────────────────────────────────────────────────────────────

function decode(s) {
  return (s || "")
    .replace(/&#160;/g, " ").replace(/&#8209;/g, "-")
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim();
}

function clean(name) {
  return (name || "").replace(/\s*\|\s*Rhino 3-D modeling\s*$/i, "").trim();
}

function tagIntents(name) {
  const n = name.toLowerCase();
  const out = [];
  if (/^(extrude|revolve|loft|sweep|patch|curve|line|circle|arc|polyline|box|sphere|cylinder|cone|torus|pipe|text|point|surface|plane|solid|mesh|subd|block|hatch|picture|leader|dim|clipping|section|contour|silhouette|duplicate)|create|make|build|draw|add|insert|place/i.test(n)) out.push("create");
  if (/edit|modify|change|adjust|chamfer|fillet|blend|fair|smooth|rebuild|refit|simplify|convert|cap|close|open|delete|remove|purge|undo|redo|replace|reconstruct/i.test(n)) out.push("edit");
  if (/move|rotate|scale|mirror|array|copy|orient|align|flow|bend|twist|taper|shear|project|pull|remap|stretch|smash|unroll|squish|makelength|setpt/i.test(n)) out.push("transform");
  if (/layer|group|block|hide|show|lock|unlock|select|deselect|invert|filter|sort|name|rename|organis|visibility/i.test(n)) out.push("organise");
  if (/dim|dimension|text|leader|hatch|print|layout|page|sheet|make2d|silhouette|detail|annotation/i.test(n)) out.push("document");
  if (/measure|length|area|volume|angle|distance|check|evaluate|analyse|analyze|audit|mass|centroid|bounding|dir|what|list|properties/i.test(n)) out.push("analyse");
  if (/display|render|shade|view|camera|zoom|pan|perspective|isometric|wireframe|shaded|ghosted|mode|background|environment|turntable/i.test(n)) out.push("visualise");
  if (out.length === 0) out.push("create");
  return out;
}

function tagObjectTypes(name, toolbars) {
  const n = name.toLowerCase();
  const t = (toolbars || []).join(" ").toLowerCase();
  const out = [];
  if (/curve|line|arc|circle|polyline|spline|helix|spiral|crv/.test(n) || /curve/.test(t)) out.push("curve");
  if (/surface|srf|patch|plane|loft|sweep|revolve|networksrf/.test(n) || /surface/.test(t)) out.push("surface");
  if (/solid|polysurface|box|sphere|cylinder|cone|torus|boolean|cap/.test(n) || /solid/.test(t)) out.push("solid");
  if (/subd|subdivision/.test(n) || /subd/.test(t)) out.push("subd");
  if (/mesh|ngon|facet|polygon/.test(n) || /mesh/.test(t)) out.push("mesh");
  if (/point|cloud|dot/.test(n)) out.push("point");
  if (/dim|dimension|text|leader|hatch|annotation|note/.test(n)) out.push("annotation");
  if (/layout|page|sheet|print|detail/.test(n)) out.push("layout");
  if (/layer|group|block|visibility/.test(n)) out.push("layer");
  if (/view|camera|display|shade|render|zoom|pan|perspective|viewport/.test(n)) out.push("view");
  return out;
}

function tagOutcomes(name) {
  const n = name.toLowerCase();
  const out = [];
  if (/move|relocate/.test(n)) out.push("move");
  if (/copy|duplicate|clone/.test(n)) out.push("copy");
  if (/scale|resize/.test(n)) out.push("scale");
  if (/rotate|spin|orient/.test(n)) out.push("rotate");
  if (/boolean.*diff|subtract|trim|split|cut|delete|remove|purge/.test(n)) out.push("cut");
  if (/join|merge|weld|connect|boolean.*union|boolean.*intersect|stitch/.test(n)) out.push("join");
  if (/offset|shell|inset|parallel/.test(n)) out.push("offset");
  if (/extrude|thicken|solidify|cap/.test(n)) out.push("thicken");
  if (/split|divide|explode|separate/.test(n)) out.push("split");
  if (/smooth|fair|blend|soften|relax/.test(n)) out.push("smooth");
  if (/mirror|flip|reflect|symmetr/.test(n)) out.push("mirror");
  if (/array|pattern|distribute|repeat/.test(n)) out.push("array");
  if (/dim|annotate|text|leader|note|label/.test(n)) out.push("annotate");
  if (/measure|length|area|volume|distance|angle|check|mass/.test(n)) out.push("measure");
  if (/zoom|pan|view|camera|navigate|perspective/.test(n)) out.push("navigate");
  return out;
}

function difficulty(name) {
  const adv = /boolean|networksrf|patch|cage|flow|twist|bend|taper|shear|squish|smash|unroll|remap|subd|pullback|make2d|contour|section|clipping|drape|heightfield|silhouette|loft|sweep2|blend|match|merge.*srf|cplane|orient.*on.*surface/i;
  const mid = /fillet|chamfer|offset|sweep|revolve|shell|extrude|trim|split|join|explode|group|block|layer|align|orient|mirror|array|dim|hatch|layout|detail/i;
  if (adv.test(name)) return "advanced";
  if (mid.test(name)) return "intermediate";
  return "beginner";
}

// ── Load enriched JS ─────────────────────────────────────────────────────────
const enrichedPath = resolve(__dir, "../../../../ADDITION/data/rhino_commands_enriched.js");
const enrichedText = readFileSync(enrichedPath, "utf8");
const enrichedMatch = enrichedText.match(/=\s*(\[[\s\S]*\])\s*;?\s*$/);
const enrichedRaw = JSON.parse(enrichedMatch[1]);

// ── Load CSV for McNeel icon URLs ────────────────────────────────────────────
const csvPath = resolve(__dir, "../../../../rhino_commands_3dd.csv");
const csvText = readFileSync(csvPath, "utf8");
const csvLines = csvText.split("\n").filter(Boolean);
const csvHeaders = csvLines[0].split(",");
const csvRows = csvLines.slice(1).map((line) => {
  const cols = [];
  let cur = "", inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === "," && !inQ) { cols.push(cur); cur = ""; }
    else cur += ch;
  }
  cols.push(cur);
  return Object.fromEntries(csvHeaders.map((h, i) => [h, (cols[i] ?? "").trim()]));
});

// Build icon map: name (lowercase) → McNeel icon URL
const csvIconMap = new Map();
for (const r of csvRows) {
  const name = r.command_title.replace(/\s*\|.*$/, "").trim().toLowerCase();
  if (r.icon_url && !r.icon_url.includes("_no_toolbar_button")) {
    csvIconMap.set(name, r.icon_url);
  }
}

console.log(`Enriched commands: ${enrichedRaw.length}`);
console.log(`CSV icon map: ${csvIconMap.size} icons`);

// ── Build records ─────────────────────────────────────────────────────────────
const seen = new Set();
const records = [];

for (const r of enrichedRaw) {
  const name = clean(r.name);
  if (!name) continue;
  if (/\btoolbar\b$/i.test(name)) continue; // skip "Arc toolbar" etc.

  const key = name.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);

  const toolbars = (r.toolbars || []).map(decode).filter((t) => t && t !== "Not on toolbars.");
  const menuPath = decode(r.menuPath || "");

  // Icon: prefer local path (served via /api/v1/rhino-asset/), fall back to McNeel CDN
  const rawIcon = (r.icon || "").trim();
  const localIcon = rawIcon && rawIcon !== "nan"
    ? rawIcon.replace(/^\.\/data\/images\//, "/api/v1/rhino-asset/")
    : "";
  const cdnIcon = csvIconMap.get(key) || "";
  const icon = localIcon || cdnIcon;

  const rawGif = (r.gif || "").trim();
  const gif = rawGif && rawGif !== "nan"
    ? rawGif.replace(/^\.\/data\/images\//, "/api/v1/rhino-asset/")
    : "";

  const desc = (r.description || "").trim() === "nan" ? "" : (r.description || "").trim();

  // menuPath format: "TopMenu SubGroup > CommandLabel"
  // e.g. "Curve Blend Curves > Arc Blend" → topMenu="Curve", group="Blend Curves"
  let topMenu = "";
  let menuGroup = "";
  if (menuPath && !menuPath.includes("Not on menus")) {
    const beforeArrow = menuPath.split(">")[0].trim();
    const parts = beforeArrow.split(" ");
    topMenu = parts[0] || "";
    menuGroup = parts.slice(1).join(" ").trim() || parts[0] || "";
  }

  records.push({
    name,
    software:          "Rhino",
    description:       desc,
    menu:              menuGroup || toolbars[0] || "",  // used as the sub-group header
    icon,
    gif,
    source:            r.source || "",
    video:             "",
    tags:              [topMenu, ...toolbars].filter(Boolean), // top menu + toolbar names
    intent_categories: tagIntents(name),
    object_types:      tagObjectTypes(name, toolbars),
    outcomes:          tagOutcomes(name),
    difficulty:        difficulty(name),
    aliases:           [],
    related_commands:  [],
  });
}

console.log(`${records.length} unique records to upsert`);

// ── Upsert ────────────────────────────────────────────────────────────────────
const BATCH = 100;
let inserted = 0;
for (let i = 0; i < records.length; i += BATCH) {
  const batch = records.slice(i, i + BATCH);
  const { error } = await supabase
    .from("addition_commands")
    .upsert(batch, { onConflict: "name,software" });

  if (error) {
    console.error(`Batch ${i}–${i + BATCH} failed:`, error.message);
  } else {
    inserted += batch.length;
    process.stdout.write(`\r${inserted}/${records.length}...`);
  }
}

console.log(`\nDone. ${inserted} commands upserted.`);
