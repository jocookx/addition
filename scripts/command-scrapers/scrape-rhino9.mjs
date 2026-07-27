/**
 * Rhino 9 command + icon scraper.
 *
 * Source: https://docs.mcneel.com/rhino/9/help/en-us/commandlist/command_list.htm
 *
 * What it harvests (factual data only):
 *   - the full Rhino 9 command name list
 *   - each command's help-page URL
 *   - each command's toolbar icon URL (Rhino 9 artwork)
 *   - menu / toolbar location lines where present
 *
 * It does NOT copy documentation prose. Descriptions in
 * src/data/commands/rhino.json are our own and are preserved on merge.
 *
 * Usage:
 *   node scripts/command-scrapers/scrape-rhino9.mjs             # scrape → output/rhino9-commands.json + rhino9-icons.json
 *   node scripts/command-scrapers/scrape-rhino9.mjs --download  # also download icon files to output/icons/rhino9/
 *   node scripts/command-scrapers/scrape-rhino9.mjs --merge     # merge names/icons/menus into src/data/commands/rhino.json
 *
 * Icon hosting: upload output/icons/rhino9/ to the app's Supabase assets
 * bucket under rhino9/ — records then resolve via /api/v1/rhino-asset/rhino9/<file>.
 * The icon artwork is McNeel's; we host it solely to teach Rhino itself,
 * mirroring how the existing Rhino 8 icons are served. Keep attribution in
 * the admin notes and honour any takedown request.
 */

import { mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { fetchText, mapConcurrent, stripTags, decodeEntities, writeJson, mergeFactsIntoDataset } from "./lib.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dir, "output");
const BASE = "https://docs.mcneel.com/rhino/9/help/en-us/";
const LIST_URL = `${BASE}commandlist/command_list.htm`;

const args = new Set(process.argv.slice(2));

function absolute(base, href) {
  try {
    return new URL(href, base).href;
  } catch {
    return "";
  }
}

async function scrapeList() {
  const html = await fetchText(LIST_URL);
  // Command list is a series of anchors pointing into ../commands/<slug>.htm
  const seen = new Map();
  const linkRe = /<a[^>]+href="([^"#]+\.htm)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = linkRe.exec(html))) {
    const href = m[1];
    const label = stripTags(m[2]);
    if (!label || !/command|\/commands\//i.test(href)) continue;
    if (/^(home|index|what|copyright)/i.test(label)) continue;
    const url = absolute(LIST_URL, href);
    if (!seen.has(label)) seen.set(label, { name: label, url });
  }
  return [...seen.values()];
}

async function scrapeCommandPage(entry) {
  const html = await fetchText(entry.url);

  // Toolbar icon: first image in the header region that isn't a nav sprite.
  let icon = "";
  const imgRe = /<img[^>]+src="([^"]+\.(?:png|gif))"[^>]*>/gi;
  let im;
  while ((im = imgRe.exec(html))) {
    const src = im[1];
    if (/(nav|arrow|logo|banner|spacer|bullet)/i.test(src)) continue;
    icon = absolute(entry.url, src);
    break;
  }

  // Menu / toolbar location lines ("Menu: Surface > Loft" style rows).
  const menuMatch = html.match(/Menu[^<:]*:?\s*<\/(?:b|strong|span|td)>\s*([\s\S]{0,300}?)<\/(?:tr|p|div|td)>/i);
  const menu = menuMatch ? stripTags(menuMatch[1]).replace(/\s+/g, " ").slice(0, 120) : "";

  return {
    name: decodeEntities(entry.name),
    source: entry.url,
    icon,
    menu,
  };
}

async function main() {
  console.log(`Fetching Rhino 9 command list: ${LIST_URL}`);
  const list = await scrapeList();
  console.log(`Found ${list.length} command links. Fetching command pages…`);

  const scraped = (await mapConcurrent(list, scrapeCommandPage, { concurrency: 6, delayMs: 200 }))
    .filter((r) => r && !r.error);
  const failures = list.length - scraped.length;
  if (failures) console.warn(`${failures} pages failed — rerun to retry (results are re-fetched each run).`);

  writeJson(resolve(OUT, "rhino9-commands.json"), scraped);

  const icons = scraped
    .filter((c) => c.icon && !/_no_toolbar_button/i.test(c.icon))
    .map((c) => {
      const file = c.icon.split("/").pop();
      return {
        name: c.name,
        mcneelUrl: c.icon,
        suggestedAssetPath: `rhino9/${file}`,
        appIconPath: `/api/v1/rhino-asset/rhino9/${file}`,
      };
    });
  writeJson(resolve(OUT, "rhino9-icons.json"), icons);
  console.log(`${icons.length} commands have Rhino 9 toolbar icons.`);

  if (args.has("--download")) {
    const dir = resolve(OUT, "icons/rhino9");
    mkdirSync(dir, { recursive: true });
    let ok = 0;
    await mapConcurrent(icons, async (i) => {
      const res = await fetch(i.mcneelUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(resolve(dir, i.suggestedAssetPath.split("/").pop()), buf);
      ok++;
    }, { concurrency: 6, delayMs: 150 });
    console.log(`Downloaded ${ok}/${icons.length} icons → ${dir} (upload to Supabase assets bucket under rhino9/).`);
  }

  if (args.has("--merge")) {
    const iconByName = new Map(icons.map((i) => [i.name, i.appIconPath]));
    const merged = scraped.map((c) => ({
      name: c.name,
      menu: c.menu,
      icon: iconByName.get(c.name) || "",
      source: c.source,
    }));
    mergeFactsIntoDataset(
      resolve(__dir, "../../src/data/commands/rhino.json"),
      merged,
      { softwareLabel: "Rhino", fields: ["icon", "menu", "source"] },
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
