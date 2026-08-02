# Session 9 — Advanced transforms · Recording scripts
Setup: open `session-09-advanced-transforms.3dm` — a mixed scene: a flat roof panel with a hinge edge, a furnished gallery bay, a curved promenade path, a doubly curved canopy surface, a sloped façade face, a 2D window detail drawn flat at world origin, and untidy survey linework floating at random heights; Shaded display mode, Perspective maximised, Osnap on with End, Mid, Cen and Int ticked.

## 1. Rotate3D — 1:30
**Command:** `Rotate3D` · **Related:** Rotate, Orient3Pt, RemapCPlane
**Demo geometry:** a flat roof panel lying horizontal, its long hinge edge shared with a ridge beam it must tilt up from.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Rotate3D + icon (0.5s fade) | When the spin leaves the ground plane — Rotate3D. |
| 0:05–0:20 | Attempt with ordinary `Rotate` in Perspective: the panel spins flat like a record, never tilting; undo | Ordinary Rotate spins objects flat, parallel to the construction plane — like a record on a turntable. Tilting this roof panel up from its ridge needs a different axis entirely. |
| 0:20–0:35 | Select the panel; type `Rotate3D`, Enter; prompt reads "Start of rotation axis"; snap End at one end of the hinge edge, then End at the other | Select the panel and type Rotate3D. Now define the axis yourself, with two points — snap both ends of the hinge edge. That edge is now the hinge. |
| 0:35–0:50 | Prompt reads "Angle or first reference point"; type `22.5`, Enter; the panel tilts up around the edge in one clean motion | For the angle, type it — twenty-two point five — and press Enter. The panel swings up around its own edge, exactly like the real roof would. |
| 0:50–1:05 | Second demo: a brise-soleil blade rotated about its sloping support arm; axis snapped along the arm | Any line in space can be the axis: a raking strut, a mullion, a fold line. Snap two points along it, and the rotation obeys. |
| 1:05–1:20 | Copy=Yes clicked in the command line; three tilted variants of the panel fan out at different angles | Notice Copy in the command line — switch it on and each angle becomes a saved option. Perfect for testing roof pitches side by side. |
| 1:20–1:25 | Return to the tilted roof panel; the hinge edge flashes | Two points make the axis, then the angle. Mark it Got it, or watch again. |
| 1:25–1:30 | End card: Rotate3D + "Try it now" | Tilt the practice panel off its ridge. |

## 2. Scale1D — 1:00
**Command:** `Scale1D` · **Related:** Scale, Scale2D, Stretch
**Demo geometry:** a gallery bay four metres long — walls, bench and skirting grouped — that must stretch to six metres without growing taller or deeper.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Scale1D + icon (0.5s fade) | Stretch one direction, protect the rest — Scale1D. |
| 0:05–0:15 | Ordinary `Scale` demo balloons the whole bay — ceiling height grows too; undo with a red cross overlay | Uniform Scale would swell everything — the ceiling would rise with the plan. What you want is length only: one direction, the others untouched. |
| 0:15–0:30 | Select the bay; type `Scale1D`, Enter; snap the origin at one end wall; prompt asks for first reference point; snap the far end wall | Select the bay and type Scale1D. Set the origin at the fixed end, then pick the far wall as the reference — that four-metre length is what will change. |
| 0:30–0:45 | Type `6`, Enter; the bay stretches to six metres along its length; height and depth visibly unchanged; dimension overlays confirm | Type six and press Enter. The bay stretches to six metres — and check the overlays: height and depth have not moved a millimetre. |
| 0:45–0:55 | Montage: a corridor lengthened, a table extended, a façade bay widened between gridlines | Corridors, tables, façade bays between grids — whenever the brief says longer, not bigger, this is the tool. Mark it Got it, or watch again. |
| 0:55–1:00 | End card: Scale1D + "Try it now" | Stretch the practice bay to length. |

## 3. Scale2D — 1:00
**Command:** `Scale2D` · **Related:** Scale, Scale1D, ScaleNU
**Demo geometry:** a small pavilion massing whose footprint must grow by a fifth while every storey height stays fixed.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Scale2D + icon (0.5s fade) | Grow the plan, hold the heights — Scale2D. |
| 0:05–0:15 | The pavilion beside a ghosted target footprint 20% larger; a padlock icon sits on its height dimension | Planning wants a bigger footprint; the section is signed off. So the plan must grow in both directions while the heights stay locked. |
| 0:15–0:30 | Select the massing; type `Scale2D`, Enter; snap the origin at the plan's centre; prompt asks for scale factor | Select the massing, type Scale2D, and pick the origin — the centre of the plan, so growth spreads evenly. Now it wants a factor. |
| 0:30–0:45 | Type `1.2`, Enter; the footprint expands both ways in plan; a side-by-side section overlay shows identical heights | Type one point two, press Enter. The footprint grows by a fifth in plan — and the section overlay proves the storey heights never flinched. |
| 0:45–0:55 | Montage: furniture layout rescaled within a room, a site block plan resized; Z arrows crossed out on each | Remember the family: Scale is all three directions, Scale1D is one, Scale2D is two. Plan work lives here. Mark it Got it, or watch again. |
| 0:55–1:00 | End card: Scale2D + "Try it now" | Resize the practice footprint yourself. |

## 4. ArrayCrv — 1:30
**Command:** `ArrayCrv` · **Related:** ArrayLinear, Divide, OrientOnCrv, Flow
**Demo geometry:** a single balustrade post standing at the start of a long S-curved promenade edge.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: ArrayCrv + icon (0.5s fade) | One post, one curve, a whole balustrade — ArrayCrv. |
| 0:05–0:20 | Camera tracks the empty S-curved promenade edge; the lone post pulses at its start; a ghosted full run of posts fades in | This promenade needs a post every metre and a half, each one turning with the curve. Copying them by hand would take an afternoon and still drift. |
| 0:20–0:35 | Select the post; type `ArrayCrv`, Enter; prompt reads "Select path curve"; click the promenade edge; the Array Along Curve dialogue opens | Select the post, type ArrayCrv, then click the path curve. The dialogue appears with the two decisions that matter: how many, and how they turn. |
| 0:35–0:50 | Set Distance between items to `1.5`; Orientation set to Roadlike; live preview shows posts sprouting along the whole curve | Choose spacing — one point five metres — rather than a count, so the rhythm holds if the curve changes. Set orientation to Roadlike: each post stays vertical but follows the bends. |
| 0:50–1:05 | Click OK; the full balustrade populates; camera glides along it, posts turning smoothly through the S-bend | Click OK and the balustrade builds itself — every post spaced exactly, every post facing along the path. An afternoon's work in eight seconds. |
| 1:05–1:20 | Montage: ribs arrayed along a vaulted spine curve, streetlights along a road centreline, Freeform orientation shown tilting objects with the curve | The same move arrays roof ribs, streetlights and fence panels. Try Freeform orientation when objects should bank and tilt with the curve in 3D. |
| 1:20–1:25 | Return to the finished run; the path curve flashes beneath the posts | Object, path, spacing, orientation. Mark it Got it, or watch again. |
| 1:25–1:30 | End card: ArrayCrv + "Try it now" | Populate the practice promenade yourself. |

## 5. ArraySrf — 1:30
**Command:** `ArraySrf` · **Related:** ArrayCrv, OrientOnSrf, FlowAlongSrf
**Demo geometry:** a doubly curved canopy surface with a single shading-panel component modelled flat at the origin, its base point marked.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: ArraySrf + icon (0.5s fade) | Panelise a curved canopy in one pass — ArraySrf. |
| 0:05–0:20 | Orbit the bare doubly curved canopy; a ghosted preview shows it covered in a neat grid of shading panels, each tilted to the surface | Cladding studies live or die on speed. This canopy wants a grid of panels, each one turned to sit flush with the local curvature — and that is exactly what ArraySrf does. |
| 0:20–0:35 | Select the panel component; type `ArraySrf`, Enter; prompt asks for base point; snap the marked point; prompt asks for the surface; click the canopy | Select the panel, type ArraySrf, and pick its base point — the spot that will touch the surface. Then click the canopy as the target. |
| 0:35–0:50 | Prompt asks number in U direction: type `12`, Enter; number in V: type `8`, Enter; live preview scatters panels in a grid | Now the grid: twelve in the U direction, eight in V. The preview scatters the panels across the surface in both directions at once. |
| 0:50–1:05 | Press Enter; the array builds; camera skims low across the canopy showing every panel normal to the surface | Confirm, and look closely: every single panel has rotated to its own patch of surface — normal to the canopy, exactly as a fixing bracket would demand. |
| 1:05–1:20 | Montage: façade fins arrayed across a curved elevation, acoustic baffles across a ceiling wave; U/V direction arrows overlaid | Use it for façade components, baffles and rooflight grids. The U and V counts follow the surface's own directions — check them with the arrows if the grid runs the wrong way. |
| 1:20–1:25 | Return to the panelised canopy; base point and surface flash in pick order | Component, base point, surface, counts. Mark it Got it, or watch again. |
| 1:25–1:30 | End card: ArraySrf + "Try it now" | Panelise the practice canopy yourself. |

## 6. OrientOnSrf — 1:30
**Command:** `OrientOnSrf` · **Related:** ArraySrf, OrientOnCrv, Orient
**Demo geometry:** a curved roof surface and a single rooflight cone component modelled at world origin with a marked base point.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: OrientOnSrf + icon (0.5s fade) | Place objects on curved surfaces by eye — OrientOnSrf. |
| 0:05–0:20 | Orbit the curved roof scattered with a ghosted, irregular constellation of rooflights, each sitting flush with the slope | Not every layout is a grid. These rooflights are scattered where the plan below needs light — yet each one still sits perfectly flush with the curving roof. |
| 0:20–0:35 | Select the rooflight; type `OrientOnSrf`, Enter; prompt asks for base point, snap it; prompt asks for reference for scaling and rotation; click a second point | Select the rooflight and type OrientOnSrf. Pick its base point, then a reference point for rotation. Then click the roof surface as the target. |
| 0:35–0:50 | The options dialogue appears: Copy=Yes ticked, Rigid unticked; click OK; cursor now glides over the roof with a live oriented preview | In the options, tick Copy so the original stays put. Now the magic: the cursor carries a live preview that tilts and turns as it rides across the surface. |
| 0:50–1:05 | Click five scattered positions; a rooflight lands flush at each; camera skims the roof past them | Click wherever a rooflight is wanted. Each copy lands aligned to the surface normal at that exact spot — five placements, five perfect seats. |
| 1:05–1:20 | Montage: fixings scattered on a shell structure, trees placed on a terrain model, ventilation cowls on a barrel roof | Think of it as the freehand sibling of ArraySrf: fixings on shells, cowls on vaults, even trees on terrain — placed by judgement, aligned by geometry. |
| 1:20–1:25 | Return to the scattered rooflights; the surface normals flash briefly at each | Base point, reference, surface, click to place. Mark it Got it, or watch again. |
| 1:25–1:30 | End card: OrientOnSrf + "Try it now" | Scatter the practice rooflights yourself. |

## 7. RemapCPlane — 1:30
**Command:** `RemapCPlane` · **Related:** CPlane, Orient3Pt, ProjectToCPlane, NamedCPlane
**Demo geometry:** a 2D window detail drawn flat on the world Top plane, beside a building volume with a steeply sloped roof face; a named CPlane already saved on that slope.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: RemapCPlane + icon (0.5s fade) | Drew it flat, need it on the slope? RemapCPlane. |
| 0:05–0:20 | Split view: the crisp 2D window detail flat on the ground in Top view; the empty sloped roof face waiting in Perspective | Drawing detail is easiest flat, in plan — so you drew the rooflight surround at world zero. Now it must live on a thirty-degree roof, without redrawing a line. |
| 0:20–0:35 | Select the 2D detail; type `RemapCPlane`, Enter; prompt reads "CPlane to remap to"; the roof viewport with its sloped CPlane is clicked | Select the detail and type RemapCPlane. Rhino asks which construction plane to send it to — click into the viewport whose CPlane sits on the roof slope. |
| 0:35–0:50 | The detail leaps from the ground onto the sloped roof face, keeping its own proportions; orbit to confirm it lies in the slope | The geometry leaps across — redrawn, in effect, on the new plane. Same shapes, same dimensions, now lying in the slope as though drawn there from the start. |
| 0:50–1:05 | Diagram overlay: geometry carried from plane A to plane B, axes shown mapping origin-to-origin, X-to-X | The logic: whatever related your object to the old plane now relates it to the new one — origin to origin, axis to axis. Set your CPlanes deliberately and the landing is exact. |
| 1:05–1:20 | Montage: a paving pattern remapped onto a ramp, a mullion grid sent from ground onto a leaning façade plane | Paving onto ramps, grids onto leaning façades, any 2D work onto any angled face — draw flat, remap once. This pairs beautifully with NamedCPlane. |
| 1:20–1:25 | Return to the detail sitting on the roof; the two CPlanes flash in sequence | Select, RemapCPlane, click the target viewport. Mark it Got it, or watch again. |
| 1:25–1:30 | End card: RemapCPlane + "Try it now" | Send the practice detail up the slope. |

## 8. ProjectToCPlane — 1:00
**Command:** `ProjectToCPlane` · **Related:** SetPt, Make2D, CPlane
**Demo geometry:** 3D building wireframe — roof edges, canopy curves, ramp rails — floating at many heights above the ground plane.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: ProjectToCPlane + icon (0.5s fade) | Squash the model flat — ProjectToCPlane makes plan underlays. |
| 0:05–0:15 | Orbit the wireframe at its many levels; switch to Top view where the linework looks flat but reads at mixed heights when rotated | From above this looks like a plan already — but rotate and every curve floats at its own height. A true underlay needs everything genuinely flat. |
| 0:15–0:30 | Select the wireframe; type `ProjectToCPlane`, Enter; command line asks DeleteInput Yes/No; click `No`; the flattened copy drops to the ground | Select it all and type ProjectToCPlane. One question: delete the input? Choose No to keep the 3D original — the flattened copy drops to the plane below. |
| 0:30–0:45 | Orbit: 3D wireframe above, perfectly flat linework at Z0 beneath it; the flat set moves to a Drafting layer | Now there are two: your model, and a true 2D shadow of it at zero. Move the flat set to a drafting layer and it becomes the plan underlay. |
| 0:45–0:55 | Split: flattened linework being dimensioned in Top view | Quick plan checks, area outlines, setting-out drawings — squash first, draught after. Mark it Got it, or watch again. |
| 0:55–1:00 | End card: ProjectToCPlane + "Try it now" | Flatten the practice wireframe yourself. |

## 9. SetPt — 1:15
**Command:** `SetPt` · **Related:** ProjectToCPlane, Align, Move
**Demo geometry:** imported survey linework — boundary, kerbs, building outlines — each curve floating at a slightly different random height above Z0.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: SetPt + icon (0.5s fade) | Level everything to a datum in one hit — SetPt. |
| 0:05–0:20 | Front view: the survey linework shown side-on, curves scattered at dozens of slightly different heights like static | Surveys arrive like this: viewed from the side, the "flat" linework is scattered across dozens of stray levels. Every one of those errors will infect your model. |
| 0:20–0:35 | Select all linework; type `SetPt`, Enter; the Set Points dialogue opens; untick Set X and Set Y, leave Set Z ticked | Select the lot and type SetPt. In the dialogue, untick X and Y — you only want to touch the levels — and leave Set Z ticked. |
| 0:35–0:50 | Prompt asks for location; type `0` for Z, Enter; in Front view every curve snaps onto a single razor-straight line at Z0 | Now give the target: type zero and press Enter. Watch the front view — every stray curve slams onto the datum in one clean strike. |
| 0:50–1:05 | Second use: the tops of a row of uneven columns SetPt to a shared Z; then window-selected control points levelled on a wavy curve | It levels more than curves: column tops to a soffit line, or selected control points along an edge — anything that must share a coordinate. |
| 1:05–1:10 | Return to the levelled survey; a "Z = 0.000" badge confirms | Tick one axis, type the datum. Mark it Got it, or watch again. |
| 1:10–1:15 | End card: SetPt + "Try it now" | Zero the practice survey yourself. |

## 10. Distribute — 1:00
**Command:** `Distribute` · **Related:** Align, ArrayLinear
**Demo geometry:** seven pendant lights hung along a gallery ceiling at uneven, eyeballed spacings; the end two are correctly positioned.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Distribute + icon (0.5s fade) | Even spacing without arithmetic — that is Distribute. |
| 0:05–0:15 | Elevation view of the seven pendants at ragged spacings; gap dimensions flash up, all different | Seven pendants, dropped in by eye — and every gap is different. You could measure and move each one. Or you could not. |
| 0:15–0:30 | Select all seven; type `Distribute`, Enter; command line offers X, Y, Z and Spacing options; click `X` | Select all seven and type Distribute. Choose the axis to spread along — X, along the gallery. The two end lights hold their positions. |
| 0:30–0:45 | The five middle pendants glide sideways; gap dimensions reappear, now all identical | Press Enter and the middle five glide into place. Every gap now identical, first and last exactly where you fixed them. |
| 0:45–0:55 | Montage: chairs evened along a wall, façade fins re-spaced in elevation; `Align` shown as its companion for the other axis | Pair it with Align — Align trues the row, Distribute evens the rhythm. Elevations love this duo. Mark it Got it, or watch again. |
| 0:55–1:00 | End card: Distribute + "Try it now" | Even out the practice pendants yourself. |
