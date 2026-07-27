# Command repository pipeline

The app's command library lives in **`src/data/commands/*.json`** — one dataset
per software, seeded into the `addition_commands` Supabase table.

```
src/data/commands/*.json      ← the repository (our explanations + factual data)
scripts/command-scrapers/     ← keep factual fields in sync with official refs
scripts/seed-commands.mjs     ← upsert datasets into Supabase
scripts/export-commands-csv.mjs ← emit Admin → CSV importable files
```

## Content policy

- **Explanations are ours.** Every `description` is original Addition copy —
  what the command does and when a designer reaches for it. The scrapers never
  import documentation prose, and `--merge` never overwrites a description.
- **Facts are synced.** Command names, keyboard shortcuts, menu locations and
  icon URLs are factual data, harvested from the official references.
- **Icons.** Rhino icons are Rhino 9 artwork referenced from McNeel's Rhino 9
  help; we mirror them in our own Supabase assets bucket (served via
  `/api/v1/rhino-asset/rhino9/…`), same as the existing Rhino 8 set. Autodesk
  and Adobe icon artwork is proprietary — the UI falls back to the software
  chip for those until licensed artwork is sourced. Blender's icon set ships
  under GPL with Blender; chip fallback there too.
- The Blender Manual's text is CC-BY-SA 4.0 — we harvest key bindings only.

## Scrapers

Run from a machine with normal outbound network access (Claude Code on the
web with a restricted network policy will get 403s from the proxy — either
run these locally or allow `docs.mcneel.com`, `www.autodesk.com`,
`help.autodesk.com` and `docs.blender.org` in the environment's network
policy).

```bash
# Rhino 9 — full command list + Rhino 9 toolbar icons
node scripts/command-scrapers/scrape-rhino9.mjs             # harvest
node scripts/command-scrapers/scrape-rhino9.mjs --download  # + icon files for bucket upload
node scripts/command-scrapers/scrape-rhino9.mjs --merge     # fill icons/menus, stub new commands

# Maya — current hotkeys + MEL command index (aliases)
node scripts/command-scrapers/scrape-maya.mjs
node scripts/command-scrapers/scrape-maya.mjs --merge

# Blender — default keymap from the manual
node scripts/command-scrapers/scrape-blender.mjs
node scripts/command-scrapers/scrape-blender.mjs --merge

# Grasshopper — complete component index (native + add-ons)
# https://grasshopperdocs.com/completeIndex.html
node scripts/command-scrapers/scrape-grasshopper.mjs
node scripts/command-scrapers/scrape-grasshopper.mjs --merge

# AutoCAD — current command aliases and key combinations
node scripts/command-scrapers/scrape-autocad.mjs
node scripts/command-scrapers/scrape-autocad.mjs --merge
```

SketchUp has no scraper: Trimble publishes its shortcut reference as PDF
quick-reference cards rather than parseable HTML, so the SketchUp dataset is
maintained by hand against those cards.

Known limitation — Autodesk shortcut pages: `autodesk.com/shortcuts/maya`
and `/autocad` are JavaScript-rendered apps, so a static fetch returns no
shortcut rows (run 30276230749 confirmed: page reachable with a browser UA,
zero harvestable entries). The Maya and AutoCAD datasets carry their
shortcuts as authored data instead, and the Maya MEL command index (1,457
commands) is harvested for aliases. A headless-browser step (Playwright)
would be the upgrade path if automated Autodesk shortcut sync becomes
worth it.

The Grasshopper scraper matches on **name + add-on** (same-named components
exist across libraries) and records component icon URLs as `iconRef` only —
add-on icon artwork belongs to its authors, so review licensing per add-on
before mirroring anything into the assets bucket (`grasshopperdocs.com` also
needs allowing in the network policy to run it from a web session).

Merging adds unknown scraped commands as **stubs** with
`"needsExplanation": true` and an empty description. Stubs are excluded from
seeding and CSV export until an explanation is written (by hand, or via
Admin → AI generate), so half-finished records never reach learners.

## Seeding

```bash
node scripts/seed-commands.mjs --dry-run     # validate + count, no writes
node scripts/seed-commands.mjs               # seed every software
node scripts/seed-commands.mjs rhino maya    # seed a subset
```

Requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY`. Upserts on `(name, software)` and degrades
gracefully if the table is on the legacy column set.

## CSV route (alternative to seeding)

```bash
node scripts/export-commands-csv.mjs         # → src/data/commands/csv/<software>.csv
```

Output matches the Command Library CSV importer (`|` list separators), so the
files can be uploaded in Admin → CSV without touching the service key.

## Refresh cadence

1. Re-run the three scrapers with `--merge` after each Rhino/Maya/Blender
   release.
2. Write explanations for any new stubs (`git grep needsExplanation src/data/commands`).
3. `node scripts/seed-commands.mjs --dry-run`, then seed or export CSVs.
