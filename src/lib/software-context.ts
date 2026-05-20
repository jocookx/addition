/**
 * Persistent software context — shared across Commands, Combos, Courses.
 * Stored in localStorage and broadcast across tabs via storage events.
 */

import { useEffect, useState } from "react";
import { LAUNCH_SOFTWARE, normaliseLaunchSoftware, type LaunchSoftware } from "@/config/taxonomy";

const KEY = "addition-software";

export type SoftwareId =
  LaunchSoftware;

export type SoftwareMeta = {
  id: SoftwareId;
  label: string;
  abbr: string;       // 2–3 char shown in pill
  color: string;      // accent color for active state
  category: "3d" | "render" | "bim" | "ai" | "parametric" | "present" | "experience";
};

export const SOFTWARE_LIST: SoftwareMeta[] = [
  { id: "Rhino",      label: "Rhino",             abbr: "Rh", color: "#6b9fff", category: "3d" },
  { id: "Grasshopper",label: "Grasshopper",        abbr: "GH", color: "#66d98e", category: "parametric" },
  { id: "Blender",    label: "Blender",            abbr: "Bl", color: "#e87d0d", category: "3d" },
  { id: "Revit",      label: "Revit",              abbr: "Rv", color: "#4cc9f0", category: "bim" },
  { id: "Dynamo",     label: "Dynamo",             abbr: "Dy", color: "#457b9d", category: "bim" },
  { id: "Twinmotion", label: "Twinmotion",         abbr: "Tw", color: "#00b4d8", category: "render" },
  { id: "Unreal Engine", label: "Unreal Engine",   abbr: "UE", color: "#9146ff", category: "experience" },
  { id: "Photoshop",  label: "Adobe Photoshop",    abbr: "Ps", color: "#31a8ff", category: "present" },
  { id: "Illustrator",label: "Adobe Illustrator",  abbr: "Ai", color: "#ff9a00", category: "present" },
  { id: "InDesign",   label: "Adobe InDesign",     abbr: "Id", color: "#ff3366", category: "present" },
  { id: "After Effects", label: "Adobe After Effects", abbr: "Ae", color: "#9999ff", category: "present" },
  { id: "Premiere Pro", label: "Adobe Premiere Pro", abbr: "Pr", color: "#b47cff", category: "present" },
  { id: "AI",         label: "AI",                 abbr: "AI", color: "#a8dadc", category: "ai" },
];

// Map label variants from CSV data to canonical IDs
const LABEL_MAP: Record<string, SoftwareId> = {
  "rhino":             "Rhino",
  "rhinoceros":        "Rhino",
  "grasshopper":       "Grasshopper",
  "grasshopper 3d":    "Grasshopper",
  "blender":           "Blender",
  "twinmotion":        "Twinmotion",
  "unreal":            "Unreal Engine",
  "unreal engine":     "Unreal Engine",
  "revit":             "Revit",
  "dynamo":            "Dynamo",
  "photoshop":         "Photoshop",
  "adobe photoshop":   "Photoshop",
  "ps":                "Photoshop",
  "illustrator":       "Illustrator",
  "adobe illustrator": "Illustrator",
  "indesign":          "InDesign",
  "in design":         "InDesign",
  "adobe indesign":    "InDesign",
  "after effects":     "After Effects",
  "adobe after effects": "After Effects",
  "premiere pro":      "Premiere Pro",
  "adobe premiere pro": "Premiere Pro",
  "ai":                "AI",
  "artificial intelligence": "AI",
};

export function normalizeSoftwareLabel(raw: string): SoftwareId | null {
  return LABEL_MAP[raw.toLowerCase().trim()] ?? normaliseLaunchSoftware(raw);
}

function read(): SoftwareId | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  const normalised = normaliseLaunchSoftware(v);
  return normalised && LAUNCH_SOFTWARE.includes(normalised) ? normalised : null;
}

// Module-level listeners — all hook instances subscribe here so they all
// update when any one of them calls set(), within the same tab.
const listeners = new Set<(id: SoftwareId | null) => void>();

function write(id: SoftwareId | null) {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(KEY, id);
  else window.localStorage.removeItem(KEY);
  // Notify every mounted hook instance in this tab
  for (const fn of listeners) fn(id);
}

export function useSoftwareContext(): [SoftwareId | null, (id: SoftwareId | null) => void] {
  // Always null on first render so server and client HTML match
  const [software, setSoftware] = useState<SoftwareId | null>(null);

  useEffect(() => {
    // Hydrate from localStorage after mount (client only)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSoftware(read());

    // Subscribe to in-page broadcasts
    listeners.add(setSoftware);

    // Also sync when the user changes software in another tab
    function onStorage(e: StorageEvent) {
      if (e.key === KEY) setSoftware(read());
    }
    window.addEventListener("storage", onStorage);

    return () => {
      listeners.delete(setSoftware);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  function set(id: SoftwareId | null) {
    write(id);  // write() already calls all listeners including this one
  }

  return [software, set];
}

export function getSoftwareMeta(id: SoftwareId | null): SoftwareMeta | null {
  return SOFTWARE_LIST.find((s) => s.id === id) ?? null;
}
