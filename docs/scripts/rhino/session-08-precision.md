# Session 8 — Precision · Recording scripts
Setup: open `session-08-precision.3dm` — a small pavilion model with a mono-pitched roof, a curved handrail, splayed entrance walls and a layer of imported survey linework floating above Z0; four-viewport layout with Perspective active, Shaded display mode, status bar visible at the bottom of the screen, Osnap panel initially switched off.

## 1. Osnap — 1:10
**Command:** `Osnap` · **Related:** Ortho, Grid, CPlane
**Demo geometry:** the pavilion in Perspective with a stray line deliberately drawn just short of a wall corner, the near-miss circled in red.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Osnap + icon (0.5s fade) | Precision in Rhino starts with one panel: Osnap. |
| 0:05–0:15 | Zoom hard into the red-circled near-miss: a line ending a few millimetres from the corner it should touch | Zoomed out, this line looks fine. Zoomed in, it misses the corner — and tiny misses like this break joins, trims and Booleans later. |
| 0:15–0:30 | Type `Osnap`, Enter; the snap toolbar appears on the status bar; tick End, Mid, Cen, Int, Perp one by one | Type Osnap, or click the status bar, and the snap controls appear. Tick the working set: End, Mid, Cen, Int and Perp cover most days in practice. |
| 0:30–0:45 | Redraw the line: cursor approaches the corner, an "End" tooltip and marker appear, the pick locks on exactly | Now draw again. Near the corner, the marker and tooltip appear — End — and the click lands exactly on it. Not close. Exact. |
| 0:45–1:00 | Demo Mid snapping to a wall's midpoint, Cen finding a column centre; Alt key press briefly suspends all snaps | Mid centres a door on a wall; Cen finds a column's heart. And when snaps grab things you do not want, hold Alt to silence them for a moment. |
| 1:00–1:05 | Return to the corrected corner; snap markers flash at each tick | Snaps on, always. Mark it Got it, or watch again. |
| 1:05–1:10 | End card: Osnap + "Try it now" | Set your snaps and hit the practice corners. |

## 2. Grid — 1:00
**Command:** `Grid` · **Related:** CPlane, DocumentProperties, Osnap
**Demo geometry:** empty Top viewport showing the default metric grid, with the pavilion's 600mm planning module drawn as a ghosted overlay that does not line up.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Grid + icon (0.5s fade) | Make the grid speak your project's module. Command: Grid. |
| 0:05–0:15 | The ghosted 600mm module overlay slides across the mismatched default grid; intersections visibly disagree | Rhino's default grid means nothing to your project. But set it to your planning module, and every square becomes useful information. |
| 0:15–0:30 | Type `Grid`, Enter; command line shows options; set MinorSpacing to `0.6`, MajorLines every `5`, Extents to `30`; grid redraws | Type Grid and the settings appear in the command line. Set minor spacing to point six for a six-hundred module, major lines every five, and widen the extents to cover the site. |
| 0:30–0:45 | Toggle SnapSize to match; draw a partition run that clicks from grid point to grid point in Top view | Match the snap spacing too, and drawing changes character — partitions and furniture click along the module without typing a single coordinate. |
| 0:45–0:55 | Zoom out: the module grid underlays the whole pavilion plan neatly | Set it once, first thing in a new file, and the grid quietly disciplines everything after. Mark it Got it, or watch again. |
| 0:55–1:00 | End card: Grid + "Try it now" | Tune the practice grid to its module. |

## 3. CPlane — 1:45
**Command:** `CPlane` · **Related:** NamedCPlane, AutoCPlane, Plan, RemapCPlane
**Demo geometry:** the pavilion with its mono-pitched roof plane prominent; a rooflight rectangle drawn flat on the world grid, hovering wrongly beneath the sloped roof.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: CPlane + icon (0.5s fade) | Draw on the roof itself. CPlane moves your drawing board. |
| 0:05–0:20 | Orbit shows the flat rooflight rectangle floating horizontally under the sloped roof, clearly on the wrong plane | Every drawing command lands on the construction plane — that grid. Which is why this rooflight drew flat while the roof slopes above it. The fix is to move the plane, not fight it. |
| 0:20–0:35 | Type `CPlane`, Enter; command line lists options; click `Object`; cursor hovers the sloped roof face, click; the grid leaps onto the roof slope | Type CPlane and read the options. The quickest is Object: click the sloped roof face, and the whole grid leaps up to lie on the slope. |
| 0:35–0:50 | Draw a rectangle directly on the tilted grid; it sits perfectly in the roof plane; add a circle beside it | Now draw. The rectangle lands flat on the roof itself — true dimensions, true position. Circles, text, arrays: everything now works in roof coordinates. |
| 0:50–1:05 | Type `CPlane`, click `3Point`; snap origin and two points onto the splayed entrance wall; grid re-seats on the splay | For faces with no single surface, use 3Point: origin, X direction, Y direction. Three snaps put the plane on this splayed wall just as easily. |
| 1:05–1:20 | Type `CPlane` then `World` then `Top`; the grid drops home to the floor; a `Plan` call squares the view to it | When you finish, come home: CPlane World Top restores the default. Pair it with Plan and the view squares up to whatever plane is current. |
| 1:20–1:35 | Split screen: drawing a skylight the hard way with Rotate3D versus directly on a roof CPlane | Sloped roofs, angled façades, raked soffits — modelling on them is miserable until the plane moves. This is the single biggest habit upgrade in Rhino. |
| 1:35–1:40 | Return to the rooflight sitting correctly on the slope | Move the plane, then draw. Mark it Got it, or watch again. |
| 1:40–1:45 | End card: CPlane + "Try it now" | Put the practice grid on that roof. |

## 4. NamedCPlane — 1:00
**Command:** `NamedCPlane` · **Related:** CPlane, NamedView
**Demo geometry:** the pavilion with the roof CPlane from the previous demo still active; the Named CPlanes panel closed.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: NamedCPlane + icon (0.5s fade) | Set a plane once, reuse it forever — NamedCPlane. |
| 0:05–0:15 | The tilted roof CPlane on screen; a hand-drawn annotation reads "don't rebuild this every morning" | You just spent a minute setting this roof plane perfectly. Tomorrow you will need it again — and the north façade, and the splay. Stop rebuilding them. |
| 0:15–0:30 | Type `NamedCPlane`, Enter; the panel opens; click Save, type `roof-pitch`, Enter; the name appears in the list | Type NamedCPlane and the panel opens. Click Save, name it something honest — roof-pitch — and it joins your library, stored in the file. |
| 0:30–0:45 | Set two more planes and save `north-facade` and `entrance-splay`; then double-click between them; the grid jumps instantly each time | Save one for each working face: façades, pitches, datums. Then restoring is a double-click — the grid leaps from roof to façade to splay in a heartbeat. |
| 0:45–0:55 | The panel shows the tidy three-plane library beside the pavilion | A named plane per façade is how professionals keep angled projects sane. Mark it Got it, or watch again. |
| 0:55–1:00 | End card: NamedCPlane + "Try it now" | Build your practice plane library now. |

## 5. Distance — 0:45
**Command:** `Distance` · **Related:** Length, Angle, Dim
**Demo geometry:** the pavilion interior with a doorway and a facing column, the clearance between them in question.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Distance + icon (0.5s fade) | How far is that, really? Distance answers instantly. |
| 0:05–0:15 | Camera frames the doorway and column; a question mark hovers in the gap between them | Does the door clear the column? Guessing costs redesign later. Measuring costs five seconds. |
| 0:15–0:30 | Type `Distance`, Enter; snap End on the door jamb, then Perp on the column face; the command line prints the value | Type Distance, press Enter, and pick two points — snap the jamb, then the column face. The command line prints the exact figure. |
| 0:30–0:40 | Zoom on the command line readout; quick second measurement checks a corridor width | Read it, note it, move on. Clearances, corridor widths, furniture gaps — sanity-check them constantly as you model. Mark it Got it, or watch again. |
| 0:40–0:45 | End card: Distance + "Try it now" | Measure the practice clearances yourself. |

## 6. Length — 0:50
**Command:** `Length` · **Related:** Distance, DimCurveLength, Divide
**Demo geometry:** the curved handrail sweeping along the pavilion ramp, selected and highlighted.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Length + icon (0.5s fade) | Curves lie to the eye. Length tells the truth. |
| 0:05–0:15 | Camera tracks along the curved ramp handrail; a straight-line ghost between its ends shows how much shorter the chord is | You need to order this handrail. The straight distance between its ends is useless — the metal follows the curve, and the curve is longer. |
| 0:15–0:30 | Type `Length`, Enter; click the handrail curve; the command line prints the true developed length | Type Length, press Enter, click the curve. The command line reports the true developed length — the figure the fabricator actually needs. |
| 0:30–0:40 | Select several skirting curves together; Length reports the combined total | Select several curves at once and it totals them — skirting runs, cable routes, gutter lengths, straight off the model. |
| 0:40–0:45 | Zoom on the readout beside the highlighted rail | Real lengths, not chords. Mark it Got it, or watch again. |
| 0:45–0:50 | End card: Length + "Try it now" | Measure the practice handrail run. |

## 7. Angle — 0:50
**Command:** `Angle` · **Related:** Distance, DimAngle, CPlane
**Demo geometry:** the splayed entrance walls meeting the main façade in plan, viewed in the Top viewport.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Angle + icon (0.5s fade) | Splays and slopes have numbers. Angle finds them. |
| 0:05–0:15 | Top view frames the splayed entrance walls; the angle between them marked with a question | The entrance walls splay away from the façade — but by how much? The planner's drawing says thirty degrees. Let us check the model. |
| 0:15–0:30 | Type `Angle`, Enter; snap two points along the first wall, then two along the splayed wall; the command line prints the angle | Type Angle and press Enter. Define the first direction with two snapped points along one wall, then two along the other. The command line prints the answer. |
| 0:30–0:40 | Front viewport: the same measurement checks the roof pitch against a horizontal line | It works in section too — pitch a line along the roof against a horizontal, and you have your roof slope in degrees. |
| 0:40–0:45 | Zoom on the readout beside the splay | Two directions in, one angle out. Mark it Got it, or watch again. |
| 0:45–0:50 | End card: Angle + "Try it now" | Check the practice splay yourself. |

## 8. Area — 1:00
**Command:** `Area` · **Related:** AreaCentroid, Volume, Hatch, PlanarSrf
**Demo geometry:** the pavilion floor plan as closed room-outline curves, one per room, colour-coded by use.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Area + icon (0.5s fade) | Schedules of accommodation start here. Command: Area. |
| 0:05–0:15 | Top view of the colour-coded room outlines; a blank schedule table slides in beside the plan | Every project answers to areas — briefed, planning, lettable. Your model already knows them all; you just have to ask. |
| 0:15–0:30 | Type `Area`, Enter; click the largest room outline; the command line prints the area in square metres | Type Area, press Enter, and click a closed room outline. The command line returns the figure in square metres, straight from the geometry. |
| 0:30–0:45 | Select all room curves at once; Area prints the combined total; a surface and a hatch are measured too | Select every room at once for the running total. Closed curves, surfaces, hatches, even meshes — Area reads them all the same way. |
| 0:45–0:55 | The schedule table fills in beside the plan, figures matching the readouts | Model tidily, with one closed curve per room, and your schedule of accommodation is always one command away. Mark it Got it, or watch again. |
| 0:55–1:00 | End card: Area + "Try it now" | Total the practice rooms yourself. |

## 9. Volume — 0:55
**Command:** `Volume` · **Related:** Area, VolumeCentroid, Cap, What
**Demo geometry:** the pavilion's solid concrete plinth and a closed excavation solid beneath it, both watertight.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Volume + icon (0.5s fade) | How much concrete? Volume reads it off the solid. |
| 0:05–0:15 | Orbit the plinth and the excavation solid below it; a concrete lorry icon appears with a question mark | The engineer wants the pour quantity; the contractor wants the dig. Both numbers are sitting inside these solids already. |
| 0:15–0:30 | Type `Volume`, Enter; click the plinth; the command line prints cubic metres; repeat on the excavation solid | Type Volume, press Enter, click the plinth. Cubic metres, printed instantly. Click the excavation solid and you have the cut figure too. |
| 0:30–0:45 | Deliberately click an open surface shell; command line warns it is not closed; `Cap` seals it and Volume succeeds | One condition: the object must be closed. If Volume complains, your solid leaks — Cap or fix the gap, then ask again. |
| 0:45–0:50 | Both readouts shown beside the plinth and dig | Closed solid in, quantity out. Mark it Got it, or watch again. |
| 0:50–0:55 | End card: Volume + "Try it now" | Quantify the practice plinth yourself. |

## 10. What — 1:00
**Command:** `What` · **Related:** List, Check, Properties, Volume
**Demo geometry:** a cluttered inherited-model corner: a suspicious roof object of unknown type among meshes, blocks and stray curves.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: What + icon (0.5s fade) | Mystery geometry? Interrogate it. The command is What. |
| 0:05–0:15 | Camera pushes into the cluttered inherited corner; the suspicious roof object pulses with a "?" label | Files from consultants arrive full of strangers. Is that roof a surface, a mesh, a block? Is it even closed? Do not guess — ask. |
| 0:15–0:30 | Select the roof object; type `What`, Enter; a report window opens: object type, closed or open, valid or not | Select the object, type What, press Enter. A full report opens: exactly what it is, whether it is closed, whether it is valid. |
| 0:30–0:45 | Highlight key report lines: "open polysurface", edge counts; cut to a second object reporting "closed solid polysurface" | Read the vital lines first. Open polysurface explains why your Booleans keep failing; closed solid means you are safe to quantify and cut. |
| 0:45–0:55 | The report beside the now-labelled roof; a checklist ticks: type, closed, valid | Make What your first move in any inherited file — diagnosis before surgery. Mark it Got it, or watch again. |
| 0:55–1:00 | End card: What + "Try it now" | Interrogate the practice mystery objects. |
