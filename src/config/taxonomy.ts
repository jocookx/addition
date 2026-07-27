export const LAUNCH_SOFTWARE = [
  "Rhino",
  "Grasshopper",
  "Blender",
  "Revit",
  "Dynamo",
  "Twinmotion",
  "Unreal Engine",
  "Photoshop",
  "Illustrator",
  "InDesign",
  "After Effects",
  "Premiere Pro",
  "Maya",
  "AI",
] as const;

export type LaunchSoftware = (typeof LAUNCH_SOFTWARE)[number];

export const WORKFLOW_CATEGORIES = [
  "Model",
  "Automate",
  "Analyse",
  "Document",
  "Render",
  "Present",
  "Experience",
  "Animate",
  "AR / VR / XR",
  "Optimise",
] as const;

export const CONTENT_TYPES = [
  "Commands",
  "Components",
  "Workflows",
  "Courses",
  "Paths",
  "Projects",
  "Assets",
  "Templates",
  "Scripts",
  "Definitions",
  "Prompts",
  "Presentations",
  "Animations",
  "Interactive Experiences",
  "VR Scenes",
  "XR Workflows",
  "Digital Twins",
] as const;

export const GRASSHOPPER_PLUGINS = [
  "Native",
  "Ladybug",
  "Honeybee",
  "Kangaroo",
  "Karamba3D",
  "LunchBox",
  "Pufferfish",
  "Weaverbird",
  "Elefront",
  "Human",
  "OpenNest",
  "Galapagos",
  "Wallacei",
  "Octopus",
  "Speckle",
  "ShapeDiver",
] as const;

export const ADOBE_APPS = [
  "Photoshop",
  "Illustrator",
  "InDesign",
  "After Effects",
  "Premiere Pro",
] as const;

export const UNREAL_ENGINE_SUBCATEGORIES = [
  "Twinmotion to Unreal",
  "Datasmith",
  "Interactive architecture",
  "VR walkthroughs",
  "AR presentations",
  "XR environments",
  "Real-time configurators",
  "Digital twins",
  "Immersive client presentations",
  "Real-time lighting",
  "Materials",
  "Blueprint basics",
  "Navigation",
  "Packaging experiences",
] as const;

export const AI_CATEGORIES = [
  "Research",
  "Concept",
  "Prompting",
  "Troubleshooting",
  "Scripting",
  "Render critique",
  "Portfolio writing",
  "Presentation optimisation",
  "Workflow automation",
  "Unreal workflow support",
  "Dynamo support",
  "Grasshopper support",
] as const;

export const FUTURE_SOFTWARE = [
  "SketchUp",
  "D5 Render",
  "Enscape",
  "V-Ray",
  "Lumion",
  "Archicad",
  "Vectorworks",
  "3ds Max",
  "Cinema 4D",
  "AutoCAD",
] as const;

export const SOFTWARE_WORKFLOW_MAP: Record<LaunchSoftware, string[]> = {
  Rhino: ["Model"],
  Grasshopper: ["Automate", "Analyse"],
  Blender: ["Model", "Render", "Animate"],
  Revit: ["Document"],
  Dynamo: ["Automate", "Document"],
  Twinmotion: ["Render", "Present", "Experience", "Animate"],
  "Unreal Engine": ["Experience", "AR / VR / XR", "Animate"],
  Photoshop: ["Present"],
  Illustrator: ["Present"],
  InDesign: ["Present"],
  "After Effects": ["Present", "Animate"],
  "Premiere Pro": ["Present", "Animate"],
  Maya: ["Model", "Animate", "Render"],
  AI: ["Optimise"],
};

export function isLaunchSoftware(value: string | null | undefined): value is LaunchSoftware {
  return Boolean(normaliseLaunchSoftware(value) || value?.trim().toLowerCase() === "adobe");
}

export function normaliseLaunchSoftware(value: string | null | undefined): LaunchSoftware | null {
  const raw = value?.trim().toLowerCase();
  if (!raw) return null;
  if (raw === "unreal") return "Unreal Engine";
  if (raw === "unreal engine") return "Unreal Engine";
  if (raw === "adobe creative suite") return null;
  if (raw === "adobe") return null;
  if (raw === "artificial intelligence") return "AI";
  return LAUNCH_SOFTWARE.find((item) => item.toLowerCase() === raw) ?? null;
}

export function getSubcategoryOptions(software: string | null | undefined): readonly string[] {
  const normalised = normaliseLaunchSoftware(software);
  if (normalised === "Grasshopper") return GRASSHOPPER_PLUGINS;
  if (normalised && ADOBE_APPS.includes(normalised as (typeof ADOBE_APPS)[number])) return ADOBE_APPS;
  if (normalised === "Unreal Engine") return UNREAL_ENGINE_SUBCATEGORIES;
  if (normalised === "AI") return AI_CATEGORIES;
  return [];
}
