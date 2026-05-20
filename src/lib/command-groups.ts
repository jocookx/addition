/**
 * Pre-defined command groups for the intent-based finder.
 * Key format: "software:intent:objectType"
 * Each group has a human label and a list of command name terms (lowercase).
 */

export type CommandGroup = {
  label: string;
  terms: string[];
};

export const COMMAND_GROUPS: Record<string, CommandGroup[]> = {
  "rhino:create:curve": [
    { label: "Drawn in viewport",
      terms: ["line","polyline","rectangle","polygon","arc","circle","ellipse","parabola","hyperbola","catenary","conic","helix","spiral"] },
    { label: "Free-form",
      terms: ["curve","interpcrv","continuecurve","continueinterpcrv","curvethroughpt","curvethroughpolyline","curvethroughsrfcontrolpt","sketch","fitcrv"] },
    { label: "From surface / solid",
      terms: ["extractisocurve","dupedge","dupfaceborder","dupborder","silhouette","projectcurve","pull","contour","csec","crv2view","createuvcrv","intersect","intersecttwosets"] },
    { label: "From curves",
      terms: ["offset","offsetcrvonsrf","blend","blendcrv","arcblend","filletcurves","filletcorners","chamfercurves","connect","extendcrv","extendcrvonsrf","extenddynamic","tweencurves"] },
  ],

  "rhino:edit:curve": [
    { label: "Select curves",
      terms: ["selcrv","selclosedcrv","selopencrv","selchain","selcircular"] },
    { label: "Control points",
      terms: ["pointson","editpton","pointsoff","removekink","insertknot","removeknot","weight","crvseam","crvstart","crvend"] },
    { label: "Trim / Split",
      terms: ["trim","split","deletesubcrv"] },
    { label: "Curve edit tools",
      terms: ["matchcrv","fair","makesubdfriendly","curveboolean","simplify","softeditcrv","closecrv","crvdeviation"] },
    { label: "Rebuild / Refine",
      terms: ["rebuild","refit","changedegree","smooth","makeperiodic","endbulge","converttobeziers","converttosinglespans"] },
    { label: "Join / Explode",
      terms: ["join","joincopy","explode"] },
  ],

  "rhino:create:surface": [
    { label: "From curves",
      terms: ["loft","networksrf","edgesrf","planarsrf","patch"] },
    { label: "Sweep",
      terms: ["sweep1","sweep2","railrevolve","revolve"] },
    { label: "Extruded",
      terms: ["extrudecrv","extrudesrf","extrudesrfalongcrv"] },
    { label: "Primitives / Plane",
      terms: ["plane","srfgrid","cutplane"] },
    { label: "Patched / Draped",
      terms: ["drape","drapept","heightfield"] },
    { label: "Blended / Filleted",
      terms: ["blendsrf","blendedge","filletsrf","chamfersrf","connectsrf","variablefilletsrf","tweensurfaces"] },
    { label: "Offset",
      terms: ["offsetsrf","offsetsrfoncrv","thickensrf"] },
  ],

  "rhino:edit:surface": [
    { label: "Control points",
      terms: ["pointson","editpton","pointsoff","insertknot","removeknot","removemultiknot","setpt","weight"] },
    { label: "Trim / Extend / Split",
      terms: ["trim","split","untrim","extendsrf","joinedge"] },
    { label: "Fillet / Chamfer / Blend",
      terms: ["filletsrf","chamfersrf","connectsrf","variablefilletsrf","blendsrf","blendedge","variableblendedge"] },
    { label: "Offset / Shell",
      terms: ["offsetsrf","offsetsrfoncrv","thickensrf","shell"] },
    { label: "Rebuild / Refine",
      terms: ["rebuildsrf","changedegree","shrinktrimedsrf","matchsrf","makeuniform","fair","smooth","alignprofiles"] },
    { label: "Join / Explode",
      terms: ["join","joincopy","explode","mergefaces","mergeallfaces"] },
  ],

  "rhino:create:solid": [
    { label: "Primitives",
      terms: ["box","sphere","cylinder","cone","torus","ellipsoid","truncatedcone","pyramid"] },
    { label: "From curves / surfaces",
      terms: ["extrudecrv","extrudesrf","cap","pipe","createsolid","boss"] },
    { label: "Boolean",
      terms: ["booleanunion","booleandifference","booleanintersection","booleansplit","boolean2objects"] },
  ],

  "rhino:edit:solid": [
    { label: "Fillet / Chamfer",
      terms: ["filletedge","chamferedge","variablefilletedge","variablechamferedge","blendedge","variableblendedge"] },
    { label: "Shell / Offset",
      terms: ["shell","offsetsrf","thickensrf"] },
    { label: "Boolean",
      terms: ["booleanunion","booleandifference","booleanintersection","booleansplit","boolean2objects"] },
    { label: "Extract / Split",
      terms: ["extractsrf","extractsrfbyobject","mergefaces","mergeallfaces","explode","trim","split"] },
    { label: "Add / Remove holes",
      terms: ["cap","createhole","drillhole","boss","punchhole"] },
  ],

  "rhino:create:mesh": [
    { label: "From geometry",
      terms: ["mesh","meshfromlines","meshpatch"] },
    { label: "Primitives",
      terms: ["meshbox","meshsphere","meshcylinder","meshcone","meshplane","meshtorusshape"] },
    { label: "3D Face",
      terms: ["3dface","addngonstomesh","appendface","appendpolygon"] },
  ],

  "rhino:edit:mesh": [
    { label: "Fix / Clean",
      terms: ["meshrepair","fillmeshholes","fillallmeshholes","unifycrease","createmeshfacegroups","rebuildmeshnormals","culldegenratefaces","collapsemeshface","collapsemeshedge","collapsemeshvertex","welmmeshverts","unweldmesh","removecreases"] },
    { label: "Weld / Unweld",
      terms: ["weld","unweld","welvertices","unweldvertex"] },
    { label: "Reduce / Rebuild",
      terms: ["reducemesh","rebuildmesh","rebuildsrfmesh","quadremesh","extractmeshfaces","divideface"] },
    { label: "Boolean",
      terms: ["meshbooleanunion","meshbooleandifference","meshbooleanintersection","meshbooleansplit"] },
  ],

  "rhino:create:subd": [
    { label: "Primitives",
      terms: ["subdbox","subdsphere","subdcylinder","subdcone","subdtorus","subdplane"] },
    { label: "From mesh / surface",
      terms: ["tosubd","automeshtosubd","automaticsubdfrommesh"] },
    { label: "Draw faces",
      terms: ["3dface","appendface"] },
  ],

  "rhino:edit:subd": [
    { label: "Control points",
      terms: ["pointson","pointsoff","insertpoint","deleteedge","creaseEdge","removecreases","slideEdge"] },
    { label: "Extrude / Bridge",
      terms: ["extrudesubdedge","extrudesubdface","bridge","filletedge"] },
    { label: "Convert",
      terms: ["tosubd","tonurbs","quadremesh","subd","toMesh"] },
  ],

  "rhino:transform:curve": [
    { label: "Move / Copy",
      terms: ["move","copy","nudge"] },
    { label: "Rotate",
      terms: ["rotate","rotate3d"] },
    { label: "Scale",
      terms: ["scale","scale1d","scale2d","scalenu"] },
    { label: "Mirror / Symmetry",
      terms: ["mirror","mirror3d"] },
    { label: "Array",
      terms: ["array","arraypolar","arraycrv","arraysrf","arrayhole"] },
    { label: "Deform",
      terms: ["flow","flowalongsrf","bend","twist","taper","shear","maelstrom","stretch","sporph"] },
    { label: "Orient",
      terms: ["orient","orient3pt","orientonsrf"] },
  ],

  "rhino:transform:surface": [
    { label: "Move / Copy",
      terms: ["move","copy","nudge"] },
    { label: "Rotate",
      terms: ["rotate","rotate3d"] },
    { label: "Scale",
      terms: ["scale","scale1d","scale2d","scalenu"] },
    { label: "Mirror / Symmetry",
      terms: ["mirror","mirror3d"] },
    { label: "Array",
      terms: ["array","arraypolar","arraycrv","arraysrf"] },
    { label: "Deform / Flow",
      terms: ["flow","flowalongsrf","bend","twist","taper","shear","sporph","stretch"] },
  ],

  "rhino:transform:solid": [
    { label: "Move / Copy",
      terms: ["move","copy","nudge"] },
    { label: "Rotate",
      terms: ["rotate","rotate3d","orient"] },
    { label: "Scale",
      terms: ["scale","scale1d","scale2d","scalenu"] },
    { label: "Mirror / Symmetry",
      terms: ["mirror","mirror3d"] },
    { label: "Array",
      terms: ["array","arraypolar","arraycrv","arraysrf","arrayhole"] },
    { label: "Deform",
      terms: ["bend","twist","taper","shear","cage","editcage","cageedit","flow","flowalongsrf"] },
  ],

  "rhino:analyse:curve": [
    { label: "Measure",
      terms: ["length","angle","distance","pointdeviations","crvdeviation"] },
    { label: "Curvature",
      terms: ["curvaturegraph","evaluatept","what","dir"] },
    { label: "Check",
      terms: ["selbadobjects","selshortcrv","checknewobjects","audit","explode"] },
  ],

  "rhino:analyse:surface": [
    { label: "Measure",
      terms: ["area","volume","massprop","centroid","areacentroid","surfacearea"] },
    { label: "Curvature / Continuity",
      terms: ["zebranalysis","curvatureanalysis","gaussiancurvatureanalysis","meancurvatureanalysis","radiusgraph","edgecontinuity","geometrycontinuity"] },
    { label: "Draft / Thickness",
      terms: ["draftangleanalysis","thicknessanalysis","environmentmap"] },
    { label: "Check",
      terms: ["showedges","shownakededges","selbadobjects","check","checknewtobjects"] },
  ],

  "rhino:document:view": [
    { label: "Layout / Print",
      terms: ["layout","newlayout","pagesetup","print","detail","newdetail","detailscale"] },
    { label: "Make 2D",
      terms: ["make2d","silhouette","contour","section","csec"] },
    { label: "Dimensions",
      terms: ["dim","dimaligned","dimangle","dimarea","dimdiameter","dimhorizontal","dimradius","dimvertical","leader","dot","text","annresize"] },
    { label: "Hatch",
      terms: ["hatch","hatchedit"] },
  ],
};

/** Look up the group key for a given software/intent/objectType combination */
export function getCommandGroups(software: string, intent: string, objectType: string): CommandGroup[] | null {
  const key = `${software.toLowerCase()}:${intent}:${objectType}`;
  return COMMAND_GROUPS[key] ?? null;
}
