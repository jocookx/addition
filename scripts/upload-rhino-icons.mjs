/**
 * Upload downloaded Rhino 9 icons to the Supabase assets bucket.
 *
 * Reads scripts/command-scrapers/output/icons/rhino9/*.png|gif and uploads
 * each to assets/rhino9/<file>, where the app serves them via
 * /api/v1/rhino-asset/rhino9/<file>.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * (environment or .env.local).
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ICON_DIR = resolve(__dir, "command-scrapers/output/icons/rhino9");

const envPath = resolve(__dir, "../.env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] ??= m[2].trim();
  }
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
if (!existsSync(ICON_DIR)) {
  console.error(`No icon directory at ${ICON_DIR} — run scrape-rhino9.mjs --download first.`);
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const files = readdirSync(ICON_DIR).filter((f) => /\.(png|gif)$/i.test(f));
console.log(`${files.length} icon files to upload…`);

let ok = 0;
let failed = 0;
for (const file of files) {
  const buf = readFileSync(resolve(ICON_DIR, file));
  const contentType = file.toLowerCase().endsWith(".gif") ? "image/gif" : "image/png";
  const { error } = await supabase.storage
    .from("assets")
    .upload(`rhino9/${file}`, buf, { contentType, upsert: true });
  if (error) {
    failed++;
    console.error(`  ${file}: ${error.message}`);
  } else {
    ok++;
    if (ok % 50 === 0) process.stdout.write(`\r${ok}/${files.length}…`);
  }
}
console.log(`\nDone. ${ok} uploaded, ${failed} failed.`);
