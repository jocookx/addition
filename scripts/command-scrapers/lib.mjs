/**
 * Shared helpers for the command scrapers.
 *
 * These scripts harvest FACTUAL data only — command names, keyboard
 * shortcuts, menu locations and icon URLs. They never import documentation
 * prose into our datasets: explanations in src/data/commands/*.json are
 * written by us and are preserved on every merge.
 *
 * Run from a machine with normal outbound network access. Claude Code on
 * the web environments with a restricted network policy will fail to fetch
 * (403 from the gateway) — run locally instead, or allow the doc domains
 * in the environment's network policy.
 */

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";

// A current browser UA — some doc hosts (notably autodesk.com) refuse
// non-browser agents outright. We still fetch politely: bounded
// concurrency, inter-request delays and honest, factual-data-only harvest.
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export async function fetchText(url, { retries = 3, timeoutMs = 30000 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        headers: {
          "user-agent": UA,
          accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
          "accept-language": "en-GB,en;q=0.9",
        },
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.text();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      }
    }
  }
  throw lastError;
}

/** Map items through fn with bounded concurrency; polite delay between starts. */
export async function mapConcurrent(items, fn, { concurrency = 6, delayMs = 150 } = {}) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
      try {
        results[i] = await fn(items[i], i);
      } catch (err) {
        results[i] = { error: String(err?.message || err), item: items[i] };
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

export function decodeEntities(s) {
  return (s || "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim();
}

export function stripTags(s) {
  return decodeEntities((s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " "));
}

export function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`wrote ${path}`);
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

/** Case/space-insensitive key used to match scraped names to dataset names. */
export function nameKey(name) {
  return (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Merge scraped facts into a dataset file (src/data/commands/<software>.json).
 *
 * - Existing records: fills ONLY the given fact fields (icon, shortcut, menu,
 *   source) when the scraper found a value. Our descriptions are never touched.
 * - Unknown scraped commands: appended as stubs with an empty description and
 *   needsExplanation:true so an author (or the admin AI generator) writes ours.
 */
export function mergeFactsIntoDataset(datasetPath, scraped, { softwareLabel, fields }) {
  const dataset = readJson(datasetPath);
  const byKey = new Map(dataset.commands.map((c) => [nameKey(c.name), c]));
  let updated = 0;
  let added = 0;

  for (const s of scraped) {
    if (!s?.name) continue;
    const existing = byKey.get(nameKey(s.name));
    if (existing) {
      for (const f of fields) {
        if (s[f] && !existing[f]) {
          existing[f] = s[f];
          updated++;
        }
      }
      // icon is authoritative from the scraper (Rhino 9 icon refresh)
      if (fields.includes("icon") && s.icon && existing.icon !== s.icon) {
        existing.icon = s.icon;
        updated++;
      }
    } else {
      byKey.set(nameKey(s.name), s);
      dataset.commands.push({
        name: s.name,
        software: softwareLabel,
        menu: s.menu || "",
        shortcut: s.shortcut || "",
        addon: "",
        description: "",
        needsExplanation: true,
        icon: s.icon || "",
        gif: "",
        source: s.source || dataset.meta?.source || "",
        tags: s.tags || [],
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

  dataset.commands.sort((a, b) => a.name.localeCompare(b.name));
  dataset.meta = {
    ...dataset.meta,
    lastScrapeMerge: new Date().toISOString(),
  };
  writeJson(datasetPath, dataset);
  console.log(`${softwareLabel}: ${updated} fact fields filled, ${added} new stubs (write our explanation before publishing).`);
}
