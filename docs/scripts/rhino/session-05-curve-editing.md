# Session 5 — Curve editing · Recording scripts
Setup: open `demo-plan-editing.3dm` — a messy work-in-progress ground-floor plan: overlapping wall lines, a curved façade curve, a few closed room outlines and a stray grid of setting-out lines; Top maximised, Wireframe display; osnaps End, Mid, Int on; keep one untouched copy of the plan on a hidden layer to reset between takes.

## 1. Trim — 1:15
**Command:** `Trim` · **Related:** Split, Untrim, Extend, MeshTrim
**Demo geometry:** two wall lines crossing a gridline, plus a circle overlapping a room outline — classic overshoot clutter.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:06 | Title card: Trim + icon (0.5s fade). Cluttered crossing lines snap to a clean junction in one cut. | Trim cuts away the bits you click, using other geometry as the knife. |
| 0:06–0:18 | Keystroke overlay: type `Trim`, Enter. Prompt: "Select cutting objects". Click the gridline; it highlights. Enter. Overlay label: "cutters first". | Type Trim. First it wants cutters — the geometry doing the cutting. Click the gridline, then Enter to confirm. |
| 0:18–0:33 | Prompt: "Select object to trim". Click the overshooting end of a wall line — it vanishes up to the gridline. Click the second overshoot; gone too. | Now click what you want gone. Each click deletes that piece back to the cutter — the overshoots disappear one by one. |
| 0:33–0:48 | Click inside the circle's overlap with the room outline; the arc inside the room disappears, leaving a neat notch. Cursor position highlighted before each click. | Where you click is what dies — click the part inside the room, and only that arc goes. The click is the decision. |
| 0:48–1:02 | Enter finishes. Rerun: select nothing at the cutter prompt, just Enter — overlay note: "Enter = everything is a cutter". Trim three junctions rapidly. | Power move: press Enter without picking cutters, and everything cuts everything. Then just click away the scraps — junction clean-up at speed. |
| 1:02–1:15 | Clean wall junctions across the plan. Overlay note: "need both halves kept? that's Split". End card: Trim + "Try it now" (app practice nudge). | Tidying wall junctions and construction lines is half of drafting. When you need both pieces kept, that's Split — next. Mark it Got it, or watch again. |

## 2. Split — 1:10
**Command:** `Split` · **Related:** Trim, Join, BooleanSplit, MeshSplit
**Demo geometry:** the curved façade curve crossed by two gridlines; a site boundary crossing a road centreline.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:06 | Title card: Split + icon (0.5s fade). One façade curve becomes three selectable pieces, each flashing a different highlight. | Split cuts at the crossing — but keeps every piece. |
| 0:06–0:18 | Keystroke overlay: type `Split`, Enter. Prompt: "Select objects to split". Click the façade curve; Enter. Overlay label: "object first this time". | Type Split. Note the reversed order: first the object being split — the façade curve — then Enter. |
| 0:18–0:32 | Prompt: "Select cutting objects". Click both gridlines; Enter. The curve looks unchanged — then click each piece: three separate segments highlight. | Then the cutters — the two gridlines. Nothing seems to happen, but click along the curve: it's now three independent pieces. |
| 0:32–0:47 | Move the middle segment onto a "façade-glazed" layer, recolouring it; the outer pieces stay put. Overlay: "keep both sides = Split; delete one side = Trim". | That's the whole point over Trim: nothing is deleted. The glazed bay goes to its own layer; the flanks stay. |
| 0:47–1:00 | Rerun on the boundary with the road centreline as cutter; command line shows Point option — split the curve at a picked point instead. | Split a boundary at the road to measure each frontage — and the Point option cuts at any picked spot, no cutter needed. |
| 1:00–1:10 | Segments recoloured by use. End card: Split + "Try it now" (app practice nudge). | Different materials, ownerships or phases along one line? Split it and treat each piece separately. Mark it Got it, or watch again. |

## 3. Join — 1:00
**Command:** `Join` · **Related:** Explode, Split, Cap, CreateSolid
**Demo geometry:** a room outline drawn as four separate lines with touching ends; nearby, the three façade segments from the Split video.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:06 | Title card: Join + icon (0.5s fade). Four loose lines flash, then select as one closed outline. | Join glues touching curves into one — the step everything else depends on. |
| 0:06–0:18 | Window-select the four wall lines. Keystroke overlay: type `Join`, Enter. Command line reports: "4 curves joined into one closed curve". Overlay circles the word "closed". | Select the four lines and type Join. Read the command line — one closed curve. That word closed is the prize. |
| 0:18–0:32 | Click the outline — selects as one. Quick Perspective cut: `ExtrudeCrv` pulls it into walls; then a gap version fails to close, report says "open". | Closed curves extrude into walls, hatch cleanly, and report areas. If the report says open, hunt the gap. |
| 0:32–0:46 | Back in Top: run `CrvStart` marker gag skipped; instead zoom on a near-miss corner, 2mm gap shown; Join refuses to merge it; osnap-corrected, rejoined successfully. | Join only merges ends that genuinely touch — a two-millimetre miss stays open. Draw with osnaps and it never happens. |
| 0:46–1:00 | Join the three façade segments back into one curve. Overlay note: "works on surfaces too → polysurfaces and solids". End card: Join + "Try it now" (app practice nudge). | The same command glues surfaces into polysurfaces and closed solids — one verb across all of Rhino. Mark it Got it, or watch again. |

## 4. Explode — 1:00
**Command:** `Explode` · **Related:** Join, ExtractSrf, Ungroup
**Demo geometry:** the joined closed room outline; plus an imported title-block block instance in the sheet corner.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:06 | Title card: Explode + icon (0.5s fade). One outline bursts into four individually highlighted lines. | Explode is Join in reverse — break compounds into parts. |
| 0:06–0:18 | Select the outline. Keystroke overlay: type `Explode`, Enter. Command line: "1 curve exploded into 4 segments". Click one wall line — it selects alone. | Select the room outline, type Explode. Four segments again — now each wall edits on its own. |
| 0:18–0:32 | Offset one exploded segment to thicken a single wall while others stay; then rejoin the outline. Overlay: "explode → edit part → Join back". | That's the rhythm: explode, edit the one segment — here thickening a single wall — then Join it all back. |
| 0:32–0:46 | Select the title-block; Explode; it dissolves into editable lines and text. Overlay caution: "explodes block instances — edits stop updating with the block". | Explode also breaks blocks apart into raw geometry — useful for one-offs, but the copy stops updating with its block. |
| 0:46–1:00 | Brief shot of a polysurface exploding into faces in Perspective. End card: Explode + "Try it now" (app practice nudge). | Polylines, polysurfaces, blocks, hatches — when something won't edit part-by-part, Explode is the first move. Mark it Got it, or watch again. |

## 5. Extend — 1:00
**Command:** `Extend` · **Related:** Connect, Trim, ExtendSrf
**Demo geometry:** three wall lines stopping short of a gridline; a curved path falling short of the site boundary.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:06 | Title card: Extend + icon (0.5s fade). Short wall lines grow to meet the gridline exactly. | Extend stretches curves until they reach something. |
| 0:06–0:18 | Keystroke overlay: type `Extend`, Enter. Prompt: "Select boundary objects". Click the gridline; Enter. Prompt: "Select curve to extend". | Type Extend. Like Trim, boundaries first — click the gridline, Enter — then pick the curves to grow. |
| 0:18–0:32 | Click near the short end of each wall line; each grows to touch the gridline exactly. Overlay: "click the end you want extended". | Click near the end that should grow, and it runs on until it hits the boundary. Three short walls, three clicks. |
| 0:32–0:46 | Click the curved path's end: it continues along its own curvature to the boundary, smoothly. Command line Type option shown: Natural, Line, Arc, Smooth. | Curves keep their character — the path carries on along its own curvature. The Type option controls how: line, arc, or smooth. |
| 0:46–1:00 | Rerun with no boundary, Enter, type `2.5` as extension length on a line. Overlay note: "partner of Trim". End card: Extend + "Try it now" (app practice nudge). | Skip the boundary and type a distance to lengthen by a set amount. Extend to reach, Trim to cut back — partners. Mark it Got it, or watch again. |

## 6. Fillet — 1:10
**Command:** `Fillet` · **Related:** Chamfer, FilletCorners, BlendCrv, FilletEdge
**Demo geometry:** two wall lines meeting at a sharp corner; a rectangular path outline around a lawn.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:06 | Title card: Fillet + icon (0.5s fade). A sharp corner rounds into a neat tangent arc. | Fillet rounds a corner with an arc of exactly the radius you name. |
| 0:06–0:18 | Keystroke overlay: type `Fillet`, Enter. Command line shows "Radius=1". Click Radius, type `0.5`, Enter. Overlay circles the radius readout. | Type Fillet, and set the radius first — click the Radius option, type nought-point-five. It remembers for next time. |
| 0:18–0:32 | Prompt: "Select first curve to fillet". Click one wall line, then the other. An arc appears, both lines trimmed back tangent to it. | Then click the two curves. Rhino draws the arc tangent to both and trims them back to meet it — a clean rounded corner. |
| 0:32–0:47 | Zoom on the tangency — no kink. Command line options highlighted: Join=Yes rerun leaves corner as one curve; Trim=No leaves originals full length. | Tangent means no kink — an offset runs through it smoothly. Join keeps the result as one curve; Trim-off keeps the originals. |
| 0:47–1:00 | Run `FilletCorners` on the path rectangle: all four corners round at once with one radius. | For a whole outline, FilletCorners rounds every corner of a polyline in a single pass — path layouts in seconds. |
| 1:00–1:10 | Plan with rounded path and wall corner. End card: Fillet + "Try it now" (app practice nudge). | Kerbs, path edges, joinery profiles, and prepping curves for clean offsets. Mark it Got it, or watch again. |

## 7. Chamfer — 1:00
**Command:** `Chamfer` · **Related:** Fillet, ChamferEdge, Trim
**Demo geometry:** a rectangular column-casing profile and a door-frame profile, both with square corners.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:06 | Title card: Chamfer + icon (0.5s fade). Square corner cuts to a crisp 45° bevel. | Chamfer bevels a corner with a straight cut — Fillet's angular sibling. |
| 0:06–0:18 | Keystroke overlay: type `Chamfer`, Enter. Command line shows "Distances=1,1". Click Distances, type `0.02`, Enter, `0.02`, Enter. | Type Chamfer and set the two distances — twenty millimetres back along each curve. Equal distances give forty-five degrees. |
| 0:18–0:32 | Prompt: "Select first curve to chamfer". Click the two edges of the casing corner; a bevel lands, edges trimmed back. Repeat on the remaining corners. | Click the two curves either side of the corner. A straight bevel replaces it, both edges trimmed neatly to suit. |
| 0:32–0:46 | Rerun with Distances `0.04, 0.02` on the door frame; an asymmetric bevel appears. Overlay compares equal vs unequal setbacks. | Unequal distances tilt the cut — forty by twenty for a splayed reveal. Handy where light or sightlines drive the angle. |
| 0:46–1:00 | Profiles extruded briefly in Perspective showing bevelled arrises. End card: Chamfer + "Try it now" (app practice nudge). | Bevelled arrises on joinery, splayed reveals, eased plate edges — anywhere a rounded corner would look wrong. Mark it Got it, or watch again. |

## 8. Offset — 1:15
**Command:** `Offset` · **Related:** OffsetSrf, OffsetCrvOnSrf, Pipe, Fillet
**Demo geometry:** a single-line wall layout for two rooms plus the curved façade curve; hook shows the same plan with wall thicknesses complete.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:06 | Title card: Offset + icon (0.5s fade). Single-line plan becomes double-line walls in a fast montage. | Offset draws a parallel copy at a set distance — wall thickness in one command. |
| 0:06–0:18 | Keystroke overlay: type `Offset`, Enter. Command line shows "Distance=1". Click Distance, type `0.1`, Enter. Prompt: "Select curve to offset". Click a wall line. | Type Offset and set the distance — a hundred millimetres for a stud wall. Then pick the curve to copy. |
| 0:18–0:33 | Prompt: "Side to offset". Cursor hovers either side, dashed preview flipping; click the room side; the parallel line lands 100mm away. | Now the crucial click: which side. The preview flips as you hover — click the inner side and the parallel line lands there. |
| 0:33–0:48 | Offset the curved façade outward 0.15; the copy stays perfectly parallel around the curve, ends square. Overlay: "true parallel, not a scaled copy". | Curves offset properly too — every point exactly a hundred and fifty out. That's a true parallel, which scaling can never give you. |
| 0:48–1:03 | Offset the closed room outline inward; whole outline shrinks concentrically. Command line options highlighted: Corner=Sharp/Round, BothSides, Cap. | Closed outlines offset entirely — instant inner wall face or clearance zone. Corner and Cap options tune how ends and corners resolve. |
| 1:03–1:15 | Finished double-line plan. End card: Offset + "Try it now" (app practice nudge). | Wall thicknesses, maintenance zones, handrail setouts, path edges — Offset is drafting's workhorse. Mark it Got it, or watch again. |

## 9. Rebuild — 1:30
**Command:** `Rebuild` · **Related:** RebuildUV, FitCrv, ChangeDegree, Fair
**Demo geometry:** a traced site-boundary curve bristling with control points (from InterpCrv over a survey), plus a lumpy hand-drawn façade curve.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:07 | Title card: Rebuild + icon (0.5s fade). Split screen: bristling control polygon versus the same curve rebuilt with eight tidy points. | Rebuild redraws a curve with the point count and degree you choose — same shape, cleaner bones. |
| 0:07–0:18 | Select the traced boundary; press F10 — dozens of control points crowd the curve. Overlay label: "heavy curves fight every later edit". | Here's the patient: a traced boundary. F-ten shows dozens of control points — heavy curves like this fight every later edit. |
| 0:18–0:32 | Keystroke overlay: type `Rebuild`, Enter. Dialog opens: Point count, Degree fields, preview tick. Set Degree `3`, Point count `12`; preview shows the new curve overlaid. | Type Rebuild. The dialogue asks for degree and point count — degree three, twelve points — with a live preview over the original. |
| 0:32–0:47 | Dialog's deviation readout highlighted: "Maximum deviation 0.014". Adjust points to 16; deviation drops. Overlay circles the number. | Watch the deviation readout — how far the new curve strays. Fourteen millimetres too much? Add points until it's tolerable. |
| 0:47–1:02 | Click OK. F10 on the result: sixteen evenly spaced points, curve visually identical. Drag one point; the curve reshapes smoothly and predictably. | Accept, and the curve looks identical but handles beautifully — evenly spaced points that edit smoothly instead of locally kinking. |
| 1:02–1:16 | Rebuild the lumpy façade curve down to 6 points; lumps fair out visibly. Quick `CurvatureGraph` flash: combs turn from spiky to smooth. | Rebuilding lighter also fairs a lumpy sketch — fewer points, smoother flow. The curvature graph goes from spiky to calm. |
| 1:16–1:30 | Overlay note: "rebuild before lofting, offsetting, exporting". End card: Rebuild + "Try it now" (app practice nudge). | Make it habit before lofting a façade, offsetting, or exporting to fabrication — clean input geometry, clean results downstream. Mark it Got it, or watch again. |

## 10. BlendCrv — 1:30
**Command:** `BlendCrv` · **Related:** ArcBlend, Fillet, BlendSrf, Match
**Demo geometry:** two disconnected façade curves that must merge into one flowing line — a straight run and a sweeping curve, ends apart; a filleted version shown for contrast.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:07 | Title card: BlendCrv + icon (0.5s fade). Split screen: fillet joint looking stiff versus a blend flowing seamlessly between the same two curves. | BlendCrv bridges two curves with an adjustable connection — for when a fillet looks too mechanical. |
| 0:07–0:18 | Keystroke overlay: type `BlendCrv`, Enter. Prompt: "Select curve to blend". Click near the end of the straight run, then near the end of the sweep. | Type BlendCrv and click each curve near the end you're bridging from. Which end you click matters. |
| 0:18–0:33 | The blend dialog opens with continuity columns per end: Position, Tangency, Curvature, G3, G4. A preview blend spans the gap with handle points shown on it. | Up pops the control panel: a live preview, plus continuity choices for each end — position, tangency, curvature and beyond. |
| 0:33–0:48 | Toggle end 1 from Tangency to Curvature; the blend relaxes visibly. `CurvatureGraph` overlay: comb now flows continuously across the joint. | Step up to Curvature and watch it relax. The curvature comb runs unbroken through the joint — that's what reads as seamless. |
| 0:48–1:03 | Drag one of the on-screen handle points; blend bulges and tightens live; the other end stays anchored. Overlay: "drag handles to art-direct the transition". | Now the fun part — drag the handles to art-direct it. Fuller, tighter, biased to one side: the continuity holds throughout. |
| 1:03–1:16 | Click OK; blend lands. `Join` all three into one curve; select — single flowing façade line. Quick Perspective cut: line extruded into a façade ribbon. | Accept, then Join the three into one line — a façade curve that extrudes into a ribbon with no visible seam. |
| 1:16–1:30 | Side-by-side replay: Fillet corner vs blend, curvature combs shown on both. End card: BlendCrv + "Try it now" (app practice nudge). | Fillets are for radii you can dimension; blends are for lines that must flow — canopies, ribbon façades, landscape edges. Mark it Got it, or watch again. |
