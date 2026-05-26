#!/usr/bin/env node
/**
 * build-mobile.mjs
 *
 * Helper script for building the Addition mobile app.
 *
 * Usage:
 *   node scripts/build-mobile.mjs [--platform ios|android] [--dev]
 *
 * What it does:
 *   1. Runs `next build` (creates the /out static export if output:'export'
 *      is set, or simply builds the app — Capacitor will use the live URL
 *      in production)
 *   2. Runs `npx cap sync` to copy web assets into the native projects and
 *      update Capacitor plugins
 *   3. Optionally opens Xcode or Android Studio
 *
 * Prerequisites:
 *   npx cap add ios      (first time only)
 *   npx cap add android  (first time only)
 */

import { execSync } from "child_process";
import { parseArgs } from "util";

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    platform: { type: "string", short: "p", default: "" },
    dev:      { type: "boolean", short: "d", default: false },
    open:     { type: "boolean", short: "o", default: false },
  },
  strict: false,
});

const env = {
  ...process.env,
  ...(values.dev ? { CAPACITOR_ENV: "dev" } : {}),
};

function run(cmd, label) {
  console.log(`\n▸ ${label ?? cmd}`);
  execSync(cmd, { stdio: "inherit", env });
}

// ── 1. Sync ───────────────────────────────────────────────────────────────────
// In production remote-shell mode we don't need a static export; just sync.
// If you add `output: 'export'` to next.config.ts for a fully-offline build,
// uncomment the next line:
//   run("next build", "Building Next.js static export…");

run("npx cap sync", "Syncing Capacitor plugins + web assets…");

// ── 2. Open IDE (optional) ────────────────────────────────────────────────────
if (values.open) {
  const platform = values.platform || "ios";
  if (platform === "ios") {
    run("npx cap open ios", "Opening Xcode…");
  } else if (platform === "android") {
    run("npx cap open android", "Opening Android Studio…");
  }
}

console.log("\n✓ Mobile build ready.");
console.log("  iOS:     npx cap open ios");
console.log("  Android: npx cap open android");
console.log("  Run on device: npx cap run ios --target=<DEVICE_ID>");
