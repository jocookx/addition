import { promises as fs } from "node:fs";
import path from "node:path";
import { isLaunchSoftware, normaliseLaunchSoftware } from "@/config/taxonomy";
import type { CommandListItem } from "@/domain/command";
import { errorResponse, okResponse } from "@/lib/http";
import { createSupabaseServiceClient } from "@/server/supabase/clients";

type CommandRow = {
  id: string;
  name: string;
  software: string | null;
  menu: string | null;
  description: string | null;
  source: string | null;
  icon: string | null;
  gif: string | null;
  tags: string[] | null;
  intent_categories: string[] | null;
  object_types: string[] | null;
  outcomes: string[] | null;
  difficulty: string | null;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    if (ch !== "\r") field += ch;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  const headers = rows[0]?.map((item) => item.trim()) || [];
  return rows.slice(1).filter((items) => items.some((item) => item.trim())).map((items) => {
    const out: Record<string, string> = {};
    headers.forEach((header, index) => {
      out[header] = cleanString(items[index]);
    });
    return out;
  });
}

async function loadFallbackCommands(): Promise<CommandListItem[]> {
  const root = path.resolve(process.cwd(), "..", "..");
  const dataDir = path.join(root, "data");
  const entries = await fs.readdir(dataDir);
  const commandCsvs = entries.filter((item) => item.startsWith("commands_") && item.endsWith(".csv"));
  const commands: CommandListItem[] = [];

  for (const file of commandCsvs) {
    const text = await fs.readFile(path.join(dataDir, file), "utf8");
    for (const row of parseCsv(text)) {
      commands.push({
        id: cleanString(row.id) || `${cleanString(row.software)}-${cleanString(row.name)}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name: cleanString(row.name),
        software: normaliseLaunchSoftware(cleanString(row.software)) ?? cleanString(row.software),
        menu: cleanString(row.menu),
        description: cleanString(row.description),
        source: cleanString(row.source),
        icon: cleanString(row.icon),
        gif: cleanString(row.gif),
        shortcut: cleanString(row.shortcut),
        addon: cleanString(row.addon),
        tags: row.tags ? row.tags.split(",").map((tag) => cleanString(tag)).filter(Boolean) : [],
        intentCategories: [],
        objectTypes: [],
        outcomes: [],
        difficulty: "beginner",
      });
    }
  }

  // Grasshopper components (JS file with window.GRASSHOPPER_COMPONENTS = [...])
  try {
    const ghJs = await fs.readFile(path.join(dataDir, "grasshopper_components.js"), "utf8");
    const match = ghJs.match(/=\s*(\[[\s\S]*\])\s*;?\s*$/);
    if (match) {
      const ghRaw = JSON.parse(match[1]) as Array<Record<string, string>>;
      for (const row of ghRaw) {
        const name = cleanString(row.name);
        if (!name) continue;
        commands.push({
          id: `gh-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          name,
        software: "Grasshopper",
          menu: cleanString(row.menu) || "",
          description: cleanString(row.description) || "",
          source: cleanString(row.source) || "",
          icon: cleanString(row.icon) || "",
          gif: cleanString(row.gif) || "",
          shortcut: "",
          addon: cleanString(row.addon) || "",
          tags: [],
          intentCategories: [],
          objectTypes: [],
          outcomes: [],
          difficulty: "beginner",
        });
      }
    }
  } catch { /* grasshopper JS optional */ }

  // Rhino (enriched JS file in data/)
  try {
    const rhinoJs = await fs.readFile(path.join(root, "data", "rhino_commands_enriched.js"), "utf8");
    const rhinoMatch = rhinoJs.match(/=\s*(\[[\s\S]*\])\s*;?\s*$/);
    if (rhinoMatch) {
      type RhinoEnrichedRow = {
        name?: string;
        software?: string;
        description?: string;
        gif?: string;
        icon?: string;
        menu?: string;
        source?: string;
        toolbars?: string[];
        menuPath?: string;
        steps?: string[];
        images?: Array<{ type: string; url: string }>;
      };

      function decodeHtmlEntities(s: string): string {
        return s
          .replace(/&#160;/g, " ")
          .replace(/&#8209;/g, "-")
          .replace(/&amp;/g, "&")
          .replace(/&nbsp;/g, " ");
      }

      function rhinoAssetUrl(localPath: string): string {
        // Convert "./data/images/icons/foo.png" → "/api/v1/rhino-asset/icons/foo.png"
        const relative = localPath.replace(/^\.\/data\/images\//, "");
        return `/api/v1/rhino-asset/${relative}`;
      }

      const rhinoRaw = JSON.parse(rhinoMatch[1]) as RhinoEnrichedRow[];
      for (const row of rhinoRaw) {
        const rawName = cleanString(row.name);
        // Strip trailing " | Rhino 3-D modeling" suffixes
        const name = rawName.replace(/\s*\|\s*Rhino 3-D modeling\s*$/i, "").trim();
        if (!name) continue;
        // Skip toolbar placeholder entries like "Arc toolbar", "Array toolbar"
        if (/\btoolbar\b$/i.test(name)) continue;

        // Derive menu/category from first toolbar (decoded), fallback to empty
        const firstToolbar = row.toolbars?.[0] ? decodeHtmlEntities(row.toolbars[0]) : "";
        const menu = firstToolbar === "Not on toolbars." ? "" : firstToolbar;

        const rawIcon = cleanString(row.icon);
        const rawGif  = cleanString(row.gif);
        const icon = rawIcon && rawIcon !== "nan" ? rhinoAssetUrl(rawIcon) : "";
        const gif  = rawGif  && rawGif  !== "nan" ? rhinoAssetUrl(rawGif)  : "";
        const desc = cleanString(row.description) === "nan" ? "" : cleanString(row.description);

        commands.push({
          id: `rhino-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          name,
          software: "Rhino",
          menu,
          description: desc,
          source: cleanString(row.source),
          icon,
          gif,
          shortcut: "",
          addon: "",
          tags: row.toolbars
            ? row.toolbars
                .map(decodeHtmlEntities)
                .filter((t) => t && t !== "Not on toolbars.")
            : [],
          intentCategories: [],
          objectTypes: [],
          outcomes: [],
          difficulty: "beginner",
        });
      }
    }
  } catch { /* rhino enriched JS optional */ }

  return commands.filter((item) => item.name && isLaunchSoftware(item.software));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const software = normaliseLaunchSoftware(cleanString(searchParams.get("software"))) ?? "";

  try {
    let commands: CommandListItem[] = [];
    try {
      const db = createSupabaseServiceClient();
      let query = db
        .from("addition_commands")
        .select("id,name,software,menu,description,source,icon,gif,tags,intent_categories,object_types,outcomes,difficulty")
        .order("software", { ascending: true })
        .order("name", { ascending: true })
        .limit(5000);

      if (software) query = query.eq("software", software);

      const { data, error } = await query;
      if (error) throw new Error(`DB error: ${error.message}`);

      commands = ((data || []) as CommandRow[]).map((row) => ({
        id: cleanString(row.id),
        name: cleanString(row.name),
        software: normaliseLaunchSoftware(cleanString(row.software)) ?? cleanString(row.software),
        menu: cleanString(row.menu),
        description: cleanString(row.description),
        source: cleanString(row.source),
        icon: cleanString(row.icon),
        gif: cleanString(row.gif),
        shortcut: "",
        addon: "",
        tags: Array.isArray(row.tags) ? row.tags.map((tag) => cleanString(tag)).filter(Boolean) : [],
        intentCategories: Array.isArray(row.intent_categories) ? row.intent_categories : [],
        objectTypes: Array.isArray(row.object_types) ? row.object_types : [],
        outcomes: Array.isArray(row.outcomes) ? row.outcomes : [],
        difficulty: cleanString(row.difficulty) || "beginner",
      }));
    } catch {
      commands = await loadFallbackCommands();
    }

    commands = commands.filter((item) => isLaunchSoftware(item.software));
    if (software) commands = commands.filter((item) => item.software === software);
    commands.sort((a, b) => a.software.localeCompare(b.software) || a.name.localeCompare(b.name));

    return okResponse({ commands, total: commands.length });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error", 500);
  }
}
