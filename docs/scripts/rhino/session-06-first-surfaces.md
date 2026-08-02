# Session 6 — First surfaces · Recording scripts
Setup: open `session-06-first-surfaces.3dm` — prepared curves on the Profiles layer (plan outline with courtyard, three canopy sections, column profile, stair rail with circle section, twin canopy rails, gridshell curve network, site contours, a curved roof sheet), Shaded display mode, Perspective maximised, Osnap on with End, Mid and Cen ticked.

## 1. ExtrudeCrv — 1:30
**Command:** `ExtrudeCrv` · **Related:** ExtrudeSrf, ExtrudeCrvTapered, PlanarSrf, Box, Cap
**Demo geometry:** a closed plan outline and one open wavy façade curve sitting flat on the ground plane, with a finished extruded massing block parked off to the right.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: ExtrudeCrv + icon (0.5s fade) | Flat drawing to standing walls in one move — meet ExtrudeCrv. |
| 0:05–0:15 | Slow orbit around the finished massing block, its flat source outline still visible on the ground | Everything solid here began life as that flat outline on the ground. One command pushed the plan straight up into a building. |
| 0:15–0:25 | Click the closed plan curve; type `ExtrudeCrv`, press Enter; command line lists BothSides, Solid, DeleteInput, Direction | Select the plan curve, type ExtrudeCrv and press Enter. Keep one eye on the command line — every option lives there. |
| 0:25–0:35 | Cursor drags upwards; live extrusion preview grows and shrinks; click `Solid=Yes` in the command line | Drag upwards and the extrusion previews live. Click Solid equals Yes, so a closed curve gains its top and bottom automatically. |
| 0:35–0:45 | Type `3.2`, press Enter; a capped storey-height solid appears; brief orbit | Then type three point two for a storey height and press Enter. That is one accurate floor of massing, finished. |
| 0:45–1:00 | Select the open façade curve; repeat the command; extrude tall; result is an open single surface, no caps | Open curves work just as well. This wavy line extrudes into a façade fin — no caps this time, simply one clean surface. Try BothSides when you need it centred. |
| 1:00–1:15 | Split view: storey outlines in plan on the left, the assembled massing study on the right | This is how site massing actually gets made: draw each storey outline in plan, extrude to its height, and test alternatives in minutes rather than hours. |
| 1:15–1:25 | Zoom back to the finished block; command line replays `ExtrudeCrv`, `Solid=Yes`, `3.2` | Curve, ExtrudeCrv, Solid Yes, type the height. Once that sequence feels natural, mark it Got it — or watch again. |
| 1:25–1:30 | End card: ExtrudeCrv + "Try it now" | Now open the practice file and raise some walls yourself. |

## 2. Loft — 1:45
**Command:** `Loft` · **Related:** Sweep2, NetworkSrf, TweenCurves, CrvSeam, Sweep1
**Demo geometry:** three canopy section curves standing in a row at different heights and widths, with a finished lofted canopy parked behind them.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Loft + icon (0.5s fade) | Three simple sections, one flowing canopy. This is Loft. |
| 0:05–0:20 | Slow orbit of the finished canopy, then camera drops to show the three bare section curves in a row | Boat hulls, station canopies, sweeping roofs — forms like this are rarely modelled directly. You draw a few cross-sections, and Loft stretches a single skin through all of them. |
| 0:20–0:30 | Type `Loft`, Enter; prompt reads "Select curves to loft"; click the three sections left to right | Type Loft, press Enter, then pick your sections in order, left to right. Picking order matters — it sets the flow. |
| 0:30–0:45 | Press Enter; seam arrows appear at each curve with the seam point highlighted; press Enter again; Loft options dialogue opens | Press Enter and Rhino shows seam arrows. If they all point the same way, accept them. Twisted arrows mean a twisted surface, so click any stray one to flip it first. |
| 0:45–1:00 | Style dropdown reads Normal; click OK; the canopy surface builds through the sections; slow orbit | Leave the style on Normal and click OK. The surface glides through every section exactly — and your three curves have become a canopy. |
| 1:00–1:15 | Undo; repeat Loft; flick the Style dropdown between Loose and Straight sections, previews updating | Worth knowing: the style dropdown changes the character. Loose relaxes the surface for smoother reflections; Straight sections gives you ruled, facet-friendly geometry between profiles. |
| 1:15–1:30 | Cut to an architectural example: a lofted roof shell over a plan, sections ghosted beneath it | Reach for Loft whenever the design is defined by cross-sections — a roof that swells over an atrium, a bridge soffit, a sculpted reception desk. |
| 1:30–1:40 | Return to the canopy; the three sections flash in pick order | Sections in order, check the seams, choose a style. Mark it Got it, or watch again. |
| 1:40–1:45 | End card: Loft + "Try it now" | Loft the practice sections and see what skin appears. |

## 3. Revolve — 1:15
**Command:** `Revolve` · **Related:** RailRevolve, ExtrudeCrv, Loft
**Demo geometry:** a column profile curve standing beside a vertical axis line, with a finished revolved column and a dome parked nearby.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Revolve + icon (0.5s fade) | Anything round starts here. Revolve spins a profile into form. |
| 0:05–0:15 | Orbit the finished column and dome; camera settles on the flat profile curve and axis line | This column and that dome share one secret: each is a single flat curve, spun around an axis like clay on a wheel. |
| 0:15–0:30 | Select the profile; type `Revolve`, Enter; prompt asks for start of revolve axis; snap End at the axis base, then End at the top | Select the profile, type Revolve and press Enter. Now define the axis with two points — snap the ends of your centreline so the spin is dead true. |
| 0:30–0:45 | Prompt reads "Start angle"; click `FullCircle` in the command line; the profile sweeps into a complete column; orbit | For the angle, click FullCircle in the command line. The profile whirls through three hundred and sixty degrees, and the column simply appears. |
| 0:45–1:00 | Quick montage: dome from a quarter-arc, bowl-shaped rooflight from a shallow curve, angles typed as `180` | Any rotational form works the same way — a dome from a quarter arc, a light cowl, a fountain bowl. Type a partial angle like one eighty for half-forms. |
| 1:00–1:10 | Return to the column; profile and axis flash once | Profile, two axis points, full circle. That is Revolve. Mark it Got it, or watch again. |
| 1:10–1:15 | End card: Revolve + "Try it now" | Spin the practice profile and make it yours. |

## 4. PlanarSrf — 1:00
**Command:** `PlanarSrf` · **Related:** CloseCrv, ExtrudeCrv, Cap, Loft
**Demo geometry:** a closed floor-plate outline containing a smaller closed courtyard curve, both flat on the ground plane.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: PlanarSrf + icon (0.5s fade) | Closed outline to solid floor plate — that is PlanarSrf. |
| 0:05–0:15 | Camera looks down at the two nested closed curves; a ghosted preview of the finished plate with courtyard hole fades in | You have drawn the floor plate outline and the courtyard within it. Now you need an actual surface — with the hole already cut. |
| 0:15–0:30 | Window-select both curves; type `PlanarSrf`, Enter; a flat surface appears with the courtyard void; brief orbit in Shaded | Select both curves together, type PlanarSrf and press Enter. Rhino reads the nesting: outer curve becomes the plate, inner curve becomes the void. Done in one hit. |
| 0:30–0:45 | Deliberately pick an open curve; command line reports it cannot make a surface; run `CloseCrv` on it, retry successfully | One rule: every curve must be closed and planar. If nothing appears, that is why — run CloseCrv, flatten stray points, and try again. |
| 0:45–0:55 | Montage: stacked floor plates in a tower, a shading panel with a pattern of holes | Floor plates, ceilings, perforated façade panels — this is your everyday flat-surface maker. Mark it Got it, or watch again. |
| 0:55–1:00 | End card: PlanarSrf + "Try it now" | Fill the practice outlines and check that courtyard. |

## 5. Sweep1 — 1:30
**Command:** `Sweep1` · **Related:** Sweep2, Pipe, ExtrudeCrvAlongCrv, Loft
**Demo geometry:** a curving stair rail line climbing through space, with a small circle profile snapped to its lower end.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Sweep1 + icon (0.5s fade) | One rail, one profile, and a handrail builds itself. |
| 0:05–0:15 | Orbit a finished swept handrail on a stair, then fade back to the bare rail curve and circle | This handrail follows every rise and turn of the stair perfectly — because it was grown along the stair's own curve. |
| 0:15–0:25 | Type `Sweep1`, Enter; prompt reads "Select rail"; click the long stair curve, which highlights | Type Sweep1 and press Enter. The first prompt asks for the rail — that is the path. Pick the long stair curve. |
| 0:25–0:40 | Prompt reads "Select cross section curves"; click the circle; press Enter; the Sweep 1 Rail options dialogue opens with Freeform style | Next it wants cross-sections. Click the little circle at the end and press Enter. The options dialogue appears — Freeform style suits almost everything, so leave it be. |
| 0:40–0:55 | Click OK; the circle travels the rail and the handrail surface appears; slow orbit along its length | Click OK and watch the profile ride the rail from end to end. One continuous handrail, banking naturally through every bend. |
| 0:55–1:10 | Quick montage: a gutter profile swept along an eaves line, a moulding along a curved wall, two different sections morphing along one rail | The same trick makes gutters, skirtings, cornices and edge beams. And you can add several different sections along one rail — the sweep morphs smoothly between them. |
| 1:10–1:25 | Return to the handrail; rail then profile flash in pick order; command line replays `Sweep1` | Remember the order: rail first, sections second, then OK. If that is settled, mark it Got it — or watch again. |
| 1:25–1:30 | End card: Sweep1 + "Try it now" | Sweep the practice rail and ride the curve. |

## 6. Sweep2 — 1:45
**Command:** `Sweep2` · **Related:** Sweep1, Loft, NetworkSrf
**Demo geometry:** two long canopy edge curves diverging in plan and rising unevenly, with two arched section curves spanning between them.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Sweep2 + icon (0.5s fade) | When a surface must hit two edges exactly — Sweep2. |
| 0:05–0:20 | Orbit a finished canopy whose two edges land precisely on two beam lines; edges pulse to highlight the fit | Look at the edges of this canopy. Both sit exactly on their supporting beam lines — no gap, no overshoot. Loft cannot promise that. Sweep2 can, because both edges are inputs. |
| 0:20–0:35 | Type `Sweep2`, Enter; prompt reads "Select first rail" then "Select second rail"; click each long edge curve in turn, both highlight | Type Sweep2 and press Enter. It asks for two rails — pick the first edge curve, then the second. These become the finished surface's actual boundaries. |
| 0:35–0:50 | Prompt reads "Select cross section curves"; click the two arches; press Enter; Sweep 2 Rails dialogue opens | Now the cross-sections: click each arch spanning between the rails, then press Enter. The dialogue opens — the defaults are sensible, so glance and move on. |
| 0:50–1:05 | Click OK; the canopy surface builds between the rails; slow orbit showing edges glued to both rails | Click OK. The arches are carried along both rails at once, and the canopy lands exactly on its supports. Both edges, fully under control. |
| 1:05–1:20 | Side-by-side: Loft result drifting off one beam line versus Sweep2 result locked to both | This is the tool for surfaces stretched between known boundaries — a roof between two edge beams, a ramp between two walls, cladding between floor edges. |
| 1:20–1:35 | Return to the model; rails flash, then sections, then the finished surface | Two rails, then sections, then OK. When the edges must obey, sweep with two. Mark it Got it, or watch again. |
| 1:35–1:45 | End card: Sweep2 + "Try it now" | Try the practice rails — and check those edges land. |

## 7. NetworkSrf — 1:45
**Command:** `NetworkSrf` · **Related:** Loft, Sweep2, Patch, EdgeSrf
**Demo geometry:** a woven grid of curves — five running one way, four crossing them — describing a doubly curved gridshell roof, all intersections closing to near-touching.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: NetworkSrf + icon (0.5s fade) | A cage of curves becomes one surface. NetworkSrf. |
| 0:05–0:20 | Slow orbit of the bare curve network, then the finished gridshell skin fades on over it | Some roofs are too sculptural for a loft and too controlled for a sweep. When you can describe the shape as curves in two directions — a network — this command skins the lot. |
| 0:20–0:35 | Type `NetworkSrf`, Enter; prompt reads "Select curves in network"; window-select all nine curves, which highlight in two colours by direction | Type NetworkSrf, press Enter, and simply window-select the whole network. Rhino sorts the curves into the two directions itself — watch them highlight in different colours. |
| 0:35–0:50 | Press Enter; the Surface From Curve Network dialogue opens showing edge tolerance fields and curvature options | Press Enter and the dialogue appears. The tolerance fields control how tightly the surface grips your curves; the defaults are fine for design work. |
| 0:50–1:05 | Click OK; the gridshell surface materialises through every curve; slow orbit with curves still ghosted underneath | Click OK. One continuous surface now runs through every single curve, in both directions — the whole roof geometry captured in one object. |
| 1:05–1:20 | Failure demo: drag one curve so it no longer crosses the others; rerun; error message in the command line; snap it back | The one demand: curves in one direction must cross every curve in the other. If the command refuses, hunt for the curve that misses — and close the gap. |
| 1:20–1:35 | Architectural montage: freeform museum roof, a doubly curved façade bay, curves ghosted within each | This is the freeform workhorse — gridshells, sculpted façade bays, any patch that lofts and sweeps cannot capture. Sketch the cage, skin it. |
| 1:35–1:45 | End card: NetworkSrf + "Try it now" | Skin the practice network. Mark it Got it, or watch again. |

## 8. Patch — 1:30
**Command:** `Patch` · **Related:** NetworkSrf, Drape, Heightfield, Loft
**Demo geometry:** a loose set of surveyed site contours at stepped levels, plus a scatter of spot-level points — deliberately untidy, gaps included.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Patch + icon (0.5s fade) | Messy survey in, workable terrain out. That is Patch. |
| 0:05–0:20 | Orbit the untidy contours and stray points; zoom on a gap in one contour; a ghosted terrain surface fades over the lot | Real site data is never tidy — broken contours, stray spot levels, gaps everywhere. Patch does not need perfection. It fits an approximate surface over whatever you feed it. |
| 0:20–0:35 | Window-select contours and points; type `Patch`, Enter; the Patch options dialogue opens showing sample point and span counts | Select everything — curves and points together — then type Patch and press Enter. The dialogue offers sample points and spans: more of each means a closer, heavier fit. |
| 0:35–0:50 | Nudge spans up to 20; click OK; a smooth terrain surface drapes across the data; slow orbit | Raise the spans a touch for terrain, then click OK. A single relaxed sheet settles over the contours — close enough everywhere, obedient nowhere. |
| 0:50–1:05 | Split screen: Patch terrain labelled "approximate" beside a NetworkSrf roof labelled "exact"; stiffness value tweaked live | Be clear: Patch approximates. Where NetworkSrf obeys every curve, Patch averages between them — the stiffness setting decides how much it relaxes. Perfect for ground; wrong for precision panels. |
| 1:05–1:20 | Second use: a trimmed hole in a freeform surface; Patch fills it from the surrounding edges | Its other party trick: hole-filling. Pick the naked edges around a gap and Patch conjures a filler surface — a pragmatic rescue for inherited models. |
| 1:20–1:30 | End card: Patch + "Try it now" | Patch the practice site into terrain. Mark it Got it, or watch again. |

## 9. OffsetSrf — 1:30
**Command:** `OffsetSrf` · **Related:** Offset, Shell, VariableOffsetSrf, OffsetSubD, Cap
**Demo geometry:** a single doubly curved concrete roof shell surface, zero thickness, floating over a ghosted plan.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: OffsetSrf + icon (0.5s fade) | Paper-thin surface to buildable shell — OffsetSrf adds the thickness. |
| 0:05–0:20 | Orbit the zero-thickness roof; camera tilts to show its knife edge; a ghosted 200mm-thick version fades in | Every surface you have modelled so far is infinitely thin — fine for form, useless for building. This roof needs two hundred millimetres of concrete, and this command pours it. |
| 0:20–0:35 | Select the roof; type `OffsetSrf`, Enter; normal-direction arrows sprout across the surface; command line shows Distance, Solid, FlipAll | Select the roof and type OffsetSrf. Arrows appear showing the offset direction — the surface normals. Click FlipAll if they point the wrong way; you want them heading down. |
| 0:35–0:50 | Type `0.2`, click `Solid=Yes`, press Enter; the shell thickens into a closed solid with side walls; orbit the edge | Type the thickness — point two — and set Solid equals Yes. Rhino builds the second skin, closes the edges, and hands you one watertight solid shell. |
| 0:50–1:05 | Run `What` on the result: report reads closed solid polysurface; camera lingers on the clean edge return | Check the prize: a closed solid, ready for sections, Booleans and quantity take-offs. Solid Yes is the difference between a picture and a component. |
| 1:05–1:20 | Montage: thickened façade panel, a vaulted canopy gaining depth, timber shell build-up | Use it everywhere surfaces become material — concrete shells, CLT panels, glazing build-ups. Model the design face, then offset towards the structure. |
| 1:20–1:30 | End card: OffsetSrf + "Try it now" | Give the practice shell its thickness. Mark it Got it, or watch again. |

## 10. Cap — 0:50
**Command:** `Cap` · **Related:** PlanarSrf, ExtrudeCrv, CreateSolid, OffsetSrf
**Demo geometry:** an extruded tube-like massing volume with its top and bottom open, naked edges glowing in the display.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Cap + icon (0.5s fade) | Open ends, closed solid — Cap seals the gaps. |
| 0:05–0:15 | Camera dives to look down into the open-topped extrusion; naked top and bottom edges highlighted | This massing looks solid until you peer inside — the top and bottom are missing, and open objects will not Boolean or report a volume. |
| 0:15–0:25 | Select the object; type `Cap`, Enter; flat faces snap across both openings; orbit shows a sealed volume | Select it, type Cap, press Enter. Flat faces snap across both openings instantly, and the shell becomes a genuine closed solid. |
| 0:25–0:35 | Attempt Cap on a wavy-edged opening; command line reports the hole cannot be capped; edge highlighted | One catch: Cap only fills planar openings. A wavy edge will refuse — patch or loft those instead. |
| 0:35–0:45 | Quick montage: capped cores, capped extruded plinths; `Volume` reports a figure on the sealed mass | Cap is the standard finisher after extruding or trimming — sealing cores and plinths so volumes actually compute. Mark it Got it, or watch again. |
| 0:45–0:50 | End card: Cap + "Try it now" | Seal the practice volume yourself. |
