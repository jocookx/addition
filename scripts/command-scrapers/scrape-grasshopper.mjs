/**
 * Grasshopper component index scraper.
 *
 * Source: https://grasshopperdocs.com/completeIndex.html
 *   (community index of native Grasshopper components and add-on libraries)
 *
 * What it harvests (factual data only): component names, the add-on/library
 * each belongs to, category — panel placement, per-component page URLs and
 * icon URLs. Site prose is never imported — descriptions in
 * src/data/commands/grasshopper.json are our own and are preserved on merge.
 *
 * Usage:
 *   node scripts/command-scrapers/scrape-grasshopper.mjs           # → output/grasshopper-components.json
 *   node scripts/command-scrapers/scrape-grasshopper.mjs --merge   # merge facts into src/data/commands/grasshopper.json
 *
 * Icon note: component icons on grasshopperdocs.com belong to the respective
 * add-on authors. We record the URLs as references; review licensing per
 * add-on before mirroring any artwork into our assets bucket. The app's
 * existing Grasshopper sprite sheet remains the default.
 */

import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { fetchText, mapConcurrent, stripTags, writeJson, mergeFactsIntoDataset, nameKey, readJson } from "./lib.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dir, "output");
const BASE = "https://grasshopperdocs.com/";
const INDEX_URL = `${BASE}completeIndex.html`;

// Map grasshopperdocs add-on labels to the app's addon vocabulary
// (src/config/taxonomy.ts GRASSHOPPER_PLUGINS). Anything unmapped keeps the
// site's label so nothing is silently dropped.
const ADDON_MAP = new Map([
  ["grasshopper", "Native"],
  ["ladybug", "Ladybug"],
  ["honeybee", "Honeybee"],
  ["kangaroo", "Kangaroo"],
  ["kangaroo2", "Kangaroo"],
  ["karamba", "Karamba3D"],
  ["karamba3d", "Karamba3D"],
  ["lunchbox", "LunchBox"],
  ["pufferfish", "Pufferfish"],
  ["weaverbird", "Weaverbird"],
  ["elefront", "Elefront"],
  ["human", "Human"],
  ["opennest", "OpenNest"],
  ["galapagos", "Galapagos"],
  ["wallacei", "Wallacei"],
  ["octopus", "Octopus"],
  ["speckle", "Speckle"],
  ["shapediver", "ShapeDiver"],
]);

const args = new Set(process.argv.slice(2));

function absolute(href) {
  try {
    return new URL(href, INDEX_URL).href;
  } catch {
    return "";
  }
}

async function scrapeIndex() {
  const html = await fetchText(INDEX_URL);
  const out = [];
  const seen = new Set();

  // Index rows link to addons/<addon>/components/<addon>-<component>.html.
  // Tolerant pass: harvest every component-page anchor, then derive the
  // add-on and category from the surrounding markup where present.
  const linkRe = /<a[^>]+href="([^"]*components\/[^"]+\.html)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = linkRe.exec(html))) {
    const url = absolute(m[1]);
    const name = stripTags(m[2]);
    if (!name || !url) continue;

    // Add-on slug is the path segment before /components/
    const addonSlug = (url.match(/addons\/([^/]+)\/components\//i) || [])[1] || "grasshopper";
    const addon = ADDON_MAP.get(addonSlug.toLowerCase()) || addonSlug;

    const key = `${addon}::${nameKey(name)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({ name, addon, url });
  }
  return out;
}

async function scrapeComponentPage(entry) {
  const html = await fetchText(entry.url);

  // Category — panel line, e.g. "Curve > Division" / breadcrumbs.
  const catMatch =
    html.match(/(?:Category|Tab)[^<:]*:?\s*<\/(?:b|strong|span|td|dt)>\s*([\s\S]{0,200}?)<\/(?:tr|p|div|td|dd)>/i) ||
    html.match(/<(?:nav|ol)[^>]*breadcrumb[^>]*>([\s\S]*?)<\/(?:nav|ol)>/i);
  const menu = catMatch
    ? stripTags(catMatch[1]).replace(/\s*[>»]\s*/g, " — ").replace(/\s+/g, " ").slice(0, 120)
    : "";

  // Component icon (24×24 png next to the title).
  let icon = "";
  const imgRe = /<img[^>]+src="([^"]+\.(?:png|gif|svg))"[^>]*>/gi;
  let im;
  while ((im = imgRe.exec(html))) {
    const src = im[1];
    if (/(logo|banner|screenshot|example|header)/i.test(src)) continue;
    icon = absolute(src);
    break;
  }

  return { ...entry, menu, iconRef: icon };
}

async function main() {
  console.log(`Fetching Grasshopper component index: ${INDEX_URL}`);
  const index = await scrapeIndex();
  console.log(`Found ${index.length} components across add-ons. Fetching component pages…`);

  const scraped = (await mapConcurrent(index, scrapeComponentPage, { concurrency: 6, delayMs: 200 }))
    .filter((r) => r && !r.error);
  const failures = index.length - scraped.length;
  if (failures) console.warn(`${failures} pages failed — rerun to retry.`);

  writeJson(resolve(OUT, "grasshopper-components.json"), scraped);

  const byAddon = {};
  for (const c of scraped) byAddon[c.addon] = (byAddon[c.addon] || 0) + 1;
  console.log("Per add-on:", JSON.stringify(byAddon, null, 2));

  if (args.has("--merge")) {
    const datasetPath = resolve(__dir, "../../src/data/commands/grasshopper.json");

    // Match on name+addon so same-named components in different libraries
    // don't collide (mergeFactsIntoDataset matches name only, so we merge
    // per add-on subset against the matching records ourselves).
    const dataset = readJson(datasetPath);
    const byKey = new Map(dataset.commands.map((c) => [`${c.addon}::${nameKey(c.name)}`, c]));
    let updated = 0;
    let added = 0;

    for (const s of scraped) {
      const existing = byKey.get(`${s.addon}::${nameKey(s.name)}`);
      if (existing) {
        if (s.menu && !existing.menu) { existing.menu = s.menu; updated++; }
        if (s.url && (!existing.source || existing.source === dataset.meta?.source)) { existing.source = s.url; updated++; }
        if (s.iconRef && !existing.iconRef) { existing.iconRef = s.iconRef; updated++; }
      } else {
        byKey.set(`${s.addon}::${nameKey(s.name)}`, s);
        dataset.commands.push({
          name: s.name,
          software: "Grasshopper",
          menu: s.menu || "",
          shortcut: "",
          addon: s.addon,
          description: "",
          needsExplanation: true,
          icon: "",
          iconRef: s.iconRef || "",
          gif: "",
          source: s.url,
          tags: [],
          intent_categories: [],
          object_types: [],
          outcomes: [],
          difficulty: "beginner",
          aliases: [],
          related_commands: [],
        });
        added++;
      }
    }

    dataset.commands.sort((a, b) => (a.addon + a.name).localeCompare(b.addon + b.name));
    dataset.meta = { ...dataset.meta, lastScrapeMerge: new Date().toISOString(), scrapeIndex: INDEX_URL };
    writeJson(datasetPath, dataset);
    console.log(`Grasshopper: ${updated} fact fields filled, ${added} new stubs (write our explanation before publishing).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
