# Session 11 — Curve intelligence · Recording scripts
Setup for all ten videos: open `demo-curve-intelligence.3dm` — a small gallery massing (polysurface roof, curved façade surface) sitting on a terrain surface, Shaded mode, osnaps End + Int + Near on, layers colour-coded (terrain green, massing grey, curves red).

## 1. Project — 1:00
**Command:** `Project` · **Related:** Pull, Section, Intersect, Contour
**Demo geometry:** Terrain surface with a red site-plan polyline floating 20 m above it in Perspective.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Project + icon (0.5s fade) | Your plan is flat. Your site is not. Project fixes that. |
| 0:05–0:15 | Orbit finished example: path outline draped perfectly over rolling terrain, red on green | Here's a footpath boundary, drawn flat in plan, now sitting exactly on the terrain — every rise and dip followed automatically. |
| 0:15–0:28 | Type `Project` at command line; click the floating polyline, Enter; click the terrain surface, Enter | Type Project. First select the curves to push down — our plan polyline — press Enter. Then pick the target: the terrain surface. Enter again. |
| 0:28–0:40 | Curve drops onto terrain; zoom to command-line options, highlight Direction and DeleteInput | The curve lands straight down onto the surface. Watch the options: Direction lets you fire along the view instead, and DeleteInput clears the flat original. |
| 0:40–0:52 | Split-screen: flat masterplan linework left, same linework draped on site model right | Any time survey linework, road edges or building outlines need to meet a site model, Project is the one-command answer. |
| 0:52–1:00 | End card: Project + "Try it now" | Drop a curve onto a surface yourself — then mark it Got it, or watch again. |

## 2. Pull — 1:00
**Command:** `Pull` · **Related:** Project, InterpCrvOnSrf, OffsetCrvOnSrf, Intersect
**Demo geometry:** Doubly curved façade surface, steep near the top, with a red panel-joint curve hovering beside it.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Pull + icon (0.5s fade) | When Project distorts your curve, Pull is the smarter sibling. |
| 0:05–0:15 | Side-by-side: projected curve stretched thin on a steep façade versus pulled curve sitting evenly | On this steep, doubly curved façade, projecting smears the joint line. Pulling finds the shortest path to the surface instead — no stretching. |
| 0:15–0:28 | Type `Pull`; select the red curve, Enter; click the façade surface, Enter | Type Pull. Select the curve to pull — Enter. Then choose the surface that should receive it, and press Enter to finish. |
| 0:28–0:40 | Curve snaps onto surface; rotate to show it hugging the curvature evenly; toggle DeleteInput option | Each point travels the shortest distance to the surface, so spacing stays honest even where the façade leans right over. DeleteInput tidies the original. |
| 0:40–0:52 | Zoom on panelised tower façade with joint lines pulled onto the skin | Reach for Pull on steep or double-curved skins — panel joints, glazing lines, anything where straight-down projection would lie to you. |
| 0:52–1:00 | End card: Pull + "Try it now" | Pull a curve onto a curved surface now — mark it Got it, or watch again. |

## 3. Intersect — 0:55
**Command:** `Intersect` · **Related:** Section, Trim, Split, Project
**Demo geometry:** Barrel-vault roof surface passing through a straight parapet wall polysurface, overlapping visibly.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Intersect + icon (0.5s fade) | Where exactly does the roof meet the wall? Ask Intersect. |
| 0:05–0:15 | Orbit finished example: crisp yellow junction curve glowing where vault meets parapet | This yellow curve is the true junction line between a curved roof and a parapet — computed, not guessed, accurate to a fraction of a millimetre. |
| 0:15–0:27 | Type `Intersect`; window-select roof and wall together; press Enter; curve appears instantly | Type Intersect, select both objects — the vault and the wall — and press Enter. Rhino calculates every place they cross and leaves real curves behind. |
| 0:27–0:38 | Select the new curve, drag it aside; show it as a clean joined polycurve in Properties | The result is ordinary geometry: use it as a trimming edge, a flashing line, or the setting-out curve for a junction detail. |
| 0:38–0:48 | Montage: roof-to-roof valley, stair stringer meeting ramp, services duct crossing beam | Every awkward 3D junction in a building — valleys, stringers, clashes — Intersect hands you the line to work from. |
| 0:48–0:55 | End card: Intersect + "Try it now" | Find a junction in your own model — mark it Got it, or watch again. |

## 4. Contour — 1:10
**Command:** `Contour` · **Related:** Section, Make2D, ClippingPlane, Intersect
**Demo geometry:** Terrain surface plus the gallery massing, Perspective view, nothing selected.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Contour + icon (0.5s fade) | One command, a whole stack of sections. Meet Contour. |
| 0:05–0:15 | Finished example: terrain sliced into 500 mm contour lines, massing sliced into floor lines | Site contours at half-metre intervals, floor lines through the massing — all generated in a single pass, evenly spaced, perfectly parallel. |
| 0:15–0:28 | Type `Contour`; select terrain and massing, Enter; click a base point at ground level | Type Contour and select your objects. Rhino then asks for a contour-plane base point — click at ground level to anchor the first slice. |
| 0:28–0:40 | Drag vertically and click to set direction; type `0.5`, Enter; curve stack generates | Now pick the direction the stack marches in — straight up for site contours. Type the spacing, half a metre here, and Enter. Done. |
| 0:40–0:52 | Isolate contour curves on their own layer; quick shot of laser-cut waffle model and stepped site model | Contours arrive as selectable curves: send them to the laser cutter for a sectional site model, or build a waffle structure straight from them. |
| 0:52–1:02 | Overlay tip: GroupObjectsBy option set to Contour Plane | One habit worth keeping — group the output by contour plane, so each level lifts out as one piece. |
| 1:02–1:10 | End card: Contour + "Try it now" | Slice something in the practice file — mark it Got it, or watch again. |

## 5. Section — 0:55
**Command:** `Section` · **Related:** Contour, ClippingPlane, Make2D, CutPlane
**Demo geometry:** Gallery massing in Front view, Perspective inset visible.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Section + icon (0.5s fade) | Need one clean cut, not a whole stack? That's Section. |
| 0:05–0:15 | Finished example: single red section curve wrapping through the massing where a plane sliced it | One picked line, one slice: a true section profile through walls, roof and floor, ready to become a drawing. |
| 0:15–0:27 | Type `Section`; select the massing, Enter; in Front view click two points across the building | Type Section, select the objects, Enter. Then draw the cutting line — two clicks across the building in a side view — and the curves appear. |
| 0:27–0:38 | Section curves highlighted; move them clear of the model; show closed profiles ready for hatching | You get real curves at the cut, not just a display trick — drag them aside, close them up, hatch them for a working section. |
| 0:38–0:48 | Split-screen: quick profile study through a stair versus Contour's full stack | Use Section for the fast one-off — testing a stair headroom, checking a roof profile — and Contour when you need the series. |
| 0:48–0:55 | End card: Section + "Try it now" | Cut a quick section of your own — mark it Got it, or watch again. |

## 6. DupBorder — 0:50
**Command:** `DupBorder` · **Related:** DupEdge, DupFaceBorder, ShowEdges, ExtractIsocurve
**Demo geometry:** A trimmed freeform canopy surface with an irregular scalloped boundary, Shaded mode.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: DupBorder + icon (0.5s fade) | The outline you need already exists — steal it back. |
| 0:05–0:14 | Finished example: canopy with its full scalloped border duplicated as a red curve, lifted above it | This canopy's entire outer edge, recovered as one clean curve in a single command — no tracing, no snapping around corners. |
| 0:14–0:26 | Type `DupBorder`; click the canopy surface; press Enter; border curve appears highlighted | Type DupBorder, select the surface or polysurface, Enter. Rhino duplicates every naked edge — the open boundary — as joined curves. |
| 0:26–0:36 | Offset the recovered border inward 300 mm to set out a gutter line | Now that outline is yours: offset it for a gutter, extrude it for an edge beam, or drop it into a plan drawing. |
| 0:36–0:44 | Quick shot: floor-plate polysurface giving up its slab-edge outline | Slab edges, canopy fascias, hatch boundaries — whenever geometry already knows its outline, DupBorder hands it over. |
| 0:44–0:50 | End card: DupBorder + "Try it now" | Recover a border yourself — mark it Got it, or watch again. |

## 7. DupEdge — 0:50
**Command:** `DupEdge` · **Related:** DupBorder, DupFaceBorder, ExtractIsocurve
**Demo geometry:** The gallery massing polysurface, zoomed to a roof-to-wall arris in Perspective.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: DupEdge + icon (0.5s fade) | Don't redraw an edge you can simply copy out. |
| 0:05–0:14 | Finished example: single ridge edge duplicated as a red curve, dragged clear of the roof | One click on this ridge and it's a free-standing curve — exact length, exact curvature, ready to reuse. |
| 0:14–0:26 | Type `DupEdge`; click two edges along the parapet; edges highlight; press Enter | Type DupEdge, then click the individual edges you want — they highlight as you pick — and press Enter to duplicate them as curves. |
| 0:26–0:36 | Use the duplicated parapet curve as a Sweep1 rail for a coping profile | Typical move: pull the parapet edge, then sweep a coping profile along it. The rail is guaranteed to match the wall. |
| 0:36–0:44 | Quick shot: dimensioning from a duplicated edge in Top view | Where DupBorder grabs the whole outline, DupEdge is surgical — one edge at a time, for rails, guides and dimensions. |
| 0:44–0:50 | End card: DupEdge + "Try it now" | Copy an edge from your model — mark it Got it, or watch again. |

## 8. ExtractIsocurve — 0:55
**Command:** `ExtractIsocurve` · **Related:** ExtractWireframe, DupEdge, InterpCrvOnSrf, Pull
**Demo geometry:** Doubly curved façade surface with isocurves visible, Shaded mode with wires on.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: ExtractIsocurve + icon (0.5s fade) | Every surface hides a grid of perfect curves. Harvest one. |
| 0:05–0:15 | Finished example: single U-direction isocurve extracted from the façade, glowing red along its flow | This curve wasn't drawn — it was lifted straight from the surface, following its natural grain exactly. |
| 0:15–0:28 | Type `ExtractIsocurve`; click the façade; cursor shows live isocurve preview sliding as mouse moves | Type ExtractIsocurve and pick the surface. Now the isocurve previews live under your cursor — slide it to where you want and click to extract. |
| 0:28–0:40 | Toggle Direction option: U, V, Both; extract one of each; press Enter to finish | The Direction option flips between U and V — or Both for a crosshair. Keep clicking to harvest several, Enter when you're done. |
| 0:40–0:48 | Extracted isocurves used as mullion setting-out lines on the façade | These become mullion lines, rib centrelines, panel joints — construction curves that genuinely belong to the surface. |
| 0:48–0:55 | End card: ExtractIsocurve + "Try it now" | Harvest a curve from a surface — mark it Got it, or watch again. |

## 9. ExtractWireframe — 0:50
**Command:** `ExtractWireframe` · **Related:** ExtractIsocurve, Make2D, DupEdge
**Demo geometry:** The full curved façade plus canopy shown in Wireframe mode, dense isocurve display.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: ExtractWireframe + icon (0.5s fade) | Want every wire on screen as real curves? One command. |
| 0:05–0:14 | Finished example: entire façade wireframe extracted, moved aside as a red curve network | The complete displayed wireframe — every isocurve and edge — now lives as actual curves you can select and edit. |
| 0:14–0:26 | Type `ExtractWireframe`; select façade and canopy, Enter; curve network appears, drag it clear | Type ExtractWireframe, select your surfaces or polysurfaces, Enter. Whatever the display draws, you now own as geometry. |
| 0:26–0:36 | Overlay tip: density follows the isocurve display setting in Properties; change wires from 2 to 6 and re-run | Curve density matches the isocurve count in object Properties — raise the wire count first if you want a finer net. |
| 0:36–0:44 | Curve network flattened into a façade pattern study diagram | Perfect for pattern studies, gridshell diagrams and quick façade drawings where the surface's own grid tells the story. |
| 0:44–0:50 | End card: ExtractWireframe + "Try it now" | Extract a wireframe now — mark it Got it, or watch again. |

## 10. CurveBoolean — 1:10
**Command:** `CurveBoolean` · **Related:** Trim, BooleanUnion, PlanarSrf, DupBorder
**Demo geometry:** Top view: five overlapping closed plan outlines — rectangles and an arc-sided hall — in red on white.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: CurveBoolean + icon (0.5s fade) | Messy overlapping outlines into one clean boundary — instantly. |
| 0:05–0:15 | Finished example: the five overlapping shapes resolved into a single crisp building footprint | Five sketched plan shapes, one finished footprint. No trimming segment by segment, no joining fragments afterwards. |
| 0:15–0:28 | Type `CurveBoolean`; window-select all the overlapping curves; press Enter; regions shade faintly | Type CurveBoolean and select every curve involved — Enter. Rhino now sees your linework as regions, like a 2D solid modeller. |
| 0:28–0:42 | Click inside each region to keep; clicked regions highlight; courtyard region left unclicked | Click inside the regions you want to keep — each one lights up. Skip the courtyard and it becomes a hole. Enter to build the result. |
| 0:42–0:54 | Show options on command line: DeleteInput=All, CombineRegions=Yes; toggle each briefly | Two options matter: DeleteInput clears the original tangle, and CombineRegions merges your picks into one joined boundary. |
| 0:54–1:04 | Footprint extruded into massing; second shot: tidied outline hatched in a plan drawing | This is the plan-cleaning workhorse — unioned footprints for massing, tidy boundaries for hatching, site areas from overlapping parcels. |
| 1:04–1:10 | End card: CurveBoolean + "Try it now" | Untangle some overlaps yourself — mark it Got it, or watch again. |
