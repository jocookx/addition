/**
 * Software-aware terminology — maps each software to its own native vocabulary.
 * Language is taken directly from each software's own documentation; no invented terms.
 */

import type { SoftwareId } from "@/lib/software-context";

export type AccessType = "command-line" | "shortcut" | "library" | "none";

export type SoftwareTerms = {
  /** Singular noun for one item. E.g. "Command", "Component", "Shortcut", "Node" */
  itemSingular: string;
  /** Plural noun for a collection. E.g. "Commands", "Components", "Shortcuts", "Nodes" */
  itemPlural: string;
  /** Section / page heading. E.g. "Commands", "Components", "Shortcuts" */
  pageTitle: string;
  /** Label for the access / invocation field in the modal. E.g. "Command line", "Keyboard shortcut" */
  accessLabel: string;
  /** Determines which chip variant to render on cards and in the modal */
  accessType: AccessType;
  /** Top-level grouping label used in filter controls. E.g. "Toolbar", "Ribbon", "Library" */
  menuGroupLabel: string;
  /** Secondary grouping label. E.g. "Group", "Panel", "Tab", "Category" */
  menuSubLabel: string;
  /** What extra libraries / plug-ins are called, or null when not applicable */
  addonLabel: string | null;
  /** Search input placeholder */
  searchPlaceholder: string;
  /** Lowercase plural used after a count: "commands", "components", "shortcuts" */
  countLabel: string;
};

// ── Per-software terminology ─────────────────────────────────────────────────

const TERMINOLOGY: Record<SoftwareId, SoftwareTerms> = {

  // ── Rhino ──────────────────────────────────────────────────────────────────
  // Source: McNeel docs — all operations are invoked as typed commands
  Rhino: {
    itemSingular:     "Command",
    itemPlural:       "Commands",
    pageTitle:        "Commands",
    accessLabel:      "Command line",
    accessType:       "command-line",
    menuGroupLabel:   "Toolbar",
    menuSubLabel:     "Group",
    addonLabel:       null,
    searchPlaceholder: "Search commands…",
    countLabel:       "commands",
  },

  // ── Grasshopper ────────────────────────────────────────────────────────────
  // Source: Grasshopper Primer — items are "components" found in the component library
  Grasshopper: {
    itemSingular:     "Component",
    itemPlural:       "Components",
    pageTitle:        "Components",
    accessLabel:      "Component panel",
    accessType:       "library",
    menuGroupLabel:   "Library",
    menuSubLabel:     "Category",
    addonLabel:       "Library",
    searchPlaceholder: "Search components…",
    countLabel:       "components",
  },

  // ── Blender ────────────────────────────────────────────────────────────────
  // Source: Blender Manual — keyboard shortcuts are the primary invocation method
  Blender: {
    itemSingular:     "Shortcut",
    itemPlural:       "Shortcuts",
    pageTitle:        "Shortcuts",
    accessLabel:      "Shortcut",
    accessType:       "shortcut",
    menuGroupLabel:   "Menu",
    menuSubLabel:     "Sub-menu",
    addonLabel:       "Add-on",
    searchPlaceholder: "Search shortcuts…",
    countLabel:       "shortcuts",
  },

  // ── Revit ──────────────────────────────────────────────────────────────────
  // Source: autodesk.com/shortcuts/revit — all items are keyboard shortcuts
  Revit: {
    itemSingular:     "Shortcut",
    itemPlural:       "Shortcuts",
    pageTitle:        "Shortcuts",
    accessLabel:      "Keyboard shortcut",
    accessType:       "shortcut",
    menuGroupLabel:   "Ribbon",
    menuSubLabel:     "Tab",
    addonLabel:       null,
    searchPlaceholder: "Search shortcuts…",
    countLabel:       "shortcuts",
  },

  // ── Dynamo ────────────────────────────────────────────────────────────────
  // Source: Dynamo Primer — items are "nodes" accessed through the node library
  Dynamo: {
    itemSingular:     "Node",
    itemPlural:       "Nodes",
    pageTitle:        "Nodes",
    accessLabel:      "Library path",
    accessType:       "library",
    menuGroupLabel:   "Library",
    menuSubLabel:     "Category",
    addonLabel:       "Package",
    searchPlaceholder: "Search nodes…",
    countLabel:       "nodes",
  },

  // ── Twinmotion ───────────────────────────────────────────────────────────
  Twinmotion: {
    itemSingular:     "Shortcut",
    itemPlural:       "Shortcuts",
    pageTitle:        "Shortcuts",
    accessLabel:      "Shortcut",
    accessType:       "shortcut",
    menuGroupLabel:   "Menu",
    menuSubLabel:     "Panel",
    addonLabel:       null,
    searchPlaceholder: "Search shortcuts…",
    countLabel:       "shortcuts",
  },

  // ── Unreal Engine ────────────────────────────────────────────────────────
  // Source: Unreal Engine Designer's Guide to keyboard shortcuts
  "Unreal Engine": {
    itemSingular:     "Shortcut",
    itemPlural:       "Shortcuts",
    pageTitle:        "Shortcuts",
    accessLabel:      "Keyboard shortcut",
    accessType:       "shortcut",
    menuGroupLabel:   "Menu",
    menuSubLabel:     "Category",
    addonLabel:       null,
    searchPlaceholder: "Search shortcuts…",
    countLabel:       "shortcuts",
  },

  // ── Adobe apps ───────────────────────────────────────────────────────────
  // All Adobe CC apps surface their operations as keyboard shortcuts
  Photoshop: {
    itemSingular:     "Shortcut",
    itemPlural:       "Shortcuts",
    pageTitle:        "Shortcuts",
    accessLabel:      "Keyboard shortcut",
    accessType:       "shortcut",
    menuGroupLabel:   "Menu",
    menuSubLabel:     "Panel",
    addonLabel:       null,
    searchPlaceholder: "Search shortcuts…",
    countLabel:       "shortcuts",
  },

  Illustrator: {
    itemSingular:     "Shortcut",
    itemPlural:       "Shortcuts",
    pageTitle:        "Shortcuts",
    accessLabel:      "Keyboard shortcut",
    accessType:       "shortcut",
    menuGroupLabel:   "Menu",
    menuSubLabel:     "Panel",
    addonLabel:       null,
    searchPlaceholder: "Search shortcuts…",
    countLabel:       "shortcuts",
  },

  InDesign: {
    itemSingular:     "Shortcut",
    itemPlural:       "Shortcuts",
    pageTitle:        "Shortcuts",
    accessLabel:      "Keyboard shortcut",
    accessType:       "shortcut",
    menuGroupLabel:   "Menu",
    menuSubLabel:     "Panel",
    addonLabel:       null,
    searchPlaceholder: "Search shortcuts…",
    countLabel:       "shortcuts",
  },

  "After Effects": {
    itemSingular:     "Shortcut",
    itemPlural:       "Shortcuts",
    pageTitle:        "Shortcuts",
    accessLabel:      "Keyboard shortcut",
    accessType:       "shortcut",
    menuGroupLabel:   "Menu",
    menuSubLabel:     "Panel",
    addonLabel:       null,
    searchPlaceholder: "Search shortcuts…",
    countLabel:       "shortcuts",
  },

  "Premiere Pro": {
    itemSingular:     "Shortcut",
    itemPlural:       "Shortcuts",
    pageTitle:        "Shortcuts",
    accessLabel:      "Keyboard shortcut",
    accessType:       "shortcut",
    menuGroupLabel:   "Menu",
    menuSubLabel:     "Panel",
    addonLabel:       null,
    searchPlaceholder: "Search shortcuts…",
    countLabel:       "shortcuts",
  },

  // ── Maya ─────────────────────────────────────────────────────────────────
  // Source: Autodesk Maya docs — menu tools invoked via hotkeys / marking menus
  Maya: {
    itemSingular:     "Command",
    itemPlural:       "Commands",
    pageTitle:        "Commands",
    accessLabel:      "Hotkey",
    accessType:       "shortcut",
    menuGroupLabel:   "Menu",
    menuSubLabel:     "Menu set",
    addonLabel:       null,
    searchPlaceholder: "Search commands…",
    countLabel:       "commands",
  },

  // ── AI ───────────────────────────────────────────────────────────────────
  AI: {
    itemSingular:     "Tool",
    itemPlural:       "Tools",
    pageTitle:        "AI Tools",
    accessLabel:      "Prompt",
    accessType:       "none",
    menuGroupLabel:   "Category",
    menuSubLabel:     "Type",
    addonLabel:       null,
    searchPlaceholder: "Search tools…",
    countLabel:       "tools",
  },
};

// ── Fallback ─────────────────────────────────────────────────────────────────

const DEFAULT_TERMS: SoftwareTerms = TERMINOLOGY.Rhino;

// ── Public API ───────────────────────────────────────────────────────────────

export function getSoftwareTerms(software: string | null | undefined): SoftwareTerms {
  if (!software) return DEFAULT_TERMS;
  return (TERMINOLOGY as Record<string, SoftwareTerms>)[software] ?? DEFAULT_TERMS;
}
