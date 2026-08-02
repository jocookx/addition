/**
 * Admin: seed the command library from the datasets shipped in the repo.
 *
 * The JSON datasets in src/data/commands are bundled with the deploy, and
 * production already holds the Supabase service credentials — so this
 * route lets an admin publish the library from the studio with no extra
 * secrets or local tooling.
 *
 *   GET  → manifest: [{ dataset, software, ready }]  (ready = publishable records)
 *   POST { dataset } → upserts that dataset's publishable records
 *
 * Upserts on (name, software): updates and inserts only, never deletes.
 * The client seeds one dataset per request to stay well inside serverless
 * time limits.
 */
import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

import afterEffects from "@/data/commands/after-effects.json";
import autocad from "@/data/commands/autocad.json";
import blender from "@/data/commands/blender.json";
import dynamo from "@/data/commands/dynamo.json";
import grasshopper from "@/data/commands/grasshopper.json";
import illustrator from "@/data/commands/illustrator.json";
import indesign from "@/data/commands/indesign.json";
import maya from "@/data/commands/maya.json";
import photoshop from "@/data/commands/photoshop.json";
import premierePro from "@/data/commands/premiere-pro.json";
import revit from "@/data/commands/revit.json";
import rhino from "@/data/commands/rhino.json";
import sketchup from "@/data/commands/sketchup.json";
import twinmotion from "@/data/commands/twinmotion.json";
import unrealEngine from "@/data/commands/unreal-engine.json";

export const maxDuration = 60;

type DatasetCommand = {
  name?: string;
  description?: string;
  needsExplanation?: boolean;
  menu?: string;
  shortcut?: string;
  addon?: string;
  icon?: string;
  gif?: string;
  source?: string;
  video?: string;
  tags?: string[];
  intent_categories?: string[];
  object_types?: string[];
  outcomes?: string[];
  difficulty?: string;
  aliases?: string[];
  related_commands?: string[];
};

type Dataset = {
  meta?: { software?: string; source?: string };
  commands: DatasetCommand[];
};

const DATASETS: Record<string, Dataset> = {
  "after-effects": afterEffects,
  autocad,
  blender,
  dynamo,
  grasshopper,
  illustrator,
  indesign,
  maya,
  photoshop,
  "premiere-pro": premierePro,
  revit,
  rhino,
  sketchup,
  twinmotion,
  "unreal-engine": unrealEngine,
};

const INTENTS = new Set(["create", "edit", "transform", "organise", "document", "analyse", "visualise"]);
const OBJECT_TYPES = new Set(["curve", "surface", "solid", "subd", "mesh", "point", "annotation", "layout", "layer", "view"]);
const OUTCOMES = new Set(["move", "copy", "scale", "rotate", "cut", "join", "offset", "thicken", "split", "smooth", "mirror", "array", "annotate", "measure", "navigate"]);
const DIFFICULTIES = new Set(["beginner", "intermediate", "advanced"]);

function publishable(dataset: Dataset): DatasetCommand[] {
  const seen = new Set<string>();
  return dataset.commands.filter((c) => {
    if (!c.name?.trim() || c.needsExplanation || !c.description?.trim()) return false;
    const key = c.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toRecord(c: DatasetCommand, software: string, fallbackSource: string) {
  return {
    name: c.name!.trim(),
    software,
    menu: c.menu ?? "",
    description: c.description!.trim(),
    shortcut: c.shortcut ?? "",
    addon: c.addon ?? "",
    icon: c.icon ?? "",
    gif: c.gif ?? "",
    source: c.source || fallbackSource,
    video: c.video ?? "",
    tags: (c.tags ?? []).filter(Boolean),
    intent_categories: (c.intent_categories ?? []).filter((i) => INTENTS.has(i)),
    object_types: (c.object_types ?? []).filter((o) => OBJECT_TYPES.has(o)),
    outcomes: (c.outcomes ?? []).filter((o) => OUTCOMES.has(o)),
    difficulty: DIFFICULTIES.has(c.difficulty ?? "") ? c.difficulty : "beginner",
    aliases: (c.aliases ?? []).filter(Boolean),
    related_commands: (c.related_commands ?? []).filter(Boolean),
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  const manifest = Object.entries(DATASETS).map(([dataset, data]) => ({
    dataset,
    software: data.meta?.software ?? dataset,
    ready: publishable(data).length,
  }));
  return okResponse({ datasets: manifest, total: manifest.reduce((sum, d) => sum + d.ready, 0) });
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  let body: { dataset?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  const datasetName = typeof body.dataset === "string" ? body.dataset : "";
  const dataset = DATASETS[datasetName];
  if (!dataset) return errorResponse(`Unknown dataset "${datasetName}".`, 400);

  const software = dataset.meta?.software ?? datasetName;
  const fallbackSource = dataset.meta?.source ?? "";
  const records = publishable(dataset).map((c) => toRecord(c, software, fallbackSource));

  const db = createSupabaseServiceClient();
  const BATCH = 100;
  let upserted = 0;

  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    let { error } = await db.from("addition_commands").upsert(batch, { onConflict: "name,software" });

    // Legacy schema fallback (pre-shortcut/addon/video columns)
    if (error && /column .* does not exist/i.test(error.message)) {
      const slim = batch.map(({ shortcut, addon, video, aliases, related_commands, ...rest }) => rest);
      ({ error } = await db.from("addition_commands").upsert(slim, { onConflict: "name,software" }));
    }
    if (error) {
      return errorResponse(`Seeded ${upserted}/${records.length} before a database error: ${error.message}`, 500);
    }
    upserted += batch.length;
  }

  return okResponse({ dataset: datasetName, software, upserted });
}
