# Session 7 — First solids · Recording scripts
Setup: open `session-07-first-solids.3dm` — an empty ground plane with a ghosted site plan underlay, plus a Staging layer holding two overlapping massing blocks, a tower with three window boxes pushed through it, a stair rail curve and a plain rectangular pavilion solid; Shaded display mode, Perspective maximised, Osnap on with End, Mid and Cen ticked.

## 1. Box — 0:55
**Command:** `Box` · **Related:** Rectangle, ExtrudeCrv, MeshBox, SubDBox, Cylinder
**Demo geometry:** empty ground plane over the ghosted site plan, ready for a first massing block.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Box + icon (0.5s fade) | The first move of every massing study: Box. |
| 0:05–0:15 | Quick orbit of a ghosted massing study built entirely from boxes, then back to the empty plane | Almost every scheme starts as a pile of boxes. Master this one command and you can block a site in minutes. |
| 0:15–0:30 | Type `Box`, Enter; prompt asks for first corner; click on the site; drag the base rectangle, second corner clicked; prompt asks for height | Type Box and press Enter. Click the first corner on the site, drag out the footprint, click the opposite corner. Now it wants a height. |
| 0:30–0:40 | Type `12`, Enter; the solid block appears; command line replay shows typed footprint values `20,15` as an alternative | Type twelve and press Enter — a clean four-storey block. For precision, you can type every dimension instead of clicking. |
| 0:40–0:50 | Three more boxes drop in quickly, completing a mini massing composition | Corner, corner, height — repeat. Wings, cores, plant rooms: blocked out before the coffee cools. Mark it Got it, or watch again. |
| 0:50–0:55 | End card: Box + "Try it now" | Block out the practice site yourself. |

## 2. Sphere — 0:45
**Command:** `Sphere` · **Related:** Ellipsoid, MeshSphere, SubDSphere, Box
**Demo geometry:** the massing study from the Box demo, with a gap on the plaza awaiting a domed pavilion placeholder.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Sphere + icon (0.5s fade) | Centre, radius, done — Sphere in one breath. |
| 0:05–0:15 | Camera settles on the plaza gap; a ghosted domed placeholder pulses once | The plaza needs a volumetric placeholder — a dome, a finial, a full-height void study. The sphere is the quickest stand-in there is. |
| 0:15–0:25 | Type `Sphere`, Enter; click a centre point on the plaza; drag the radius preview; type `6`, Enter; solid sphere appears | Type Sphere, press Enter, click the centre. Drag to feel the size, or type six for an exact radius. Press Enter — solid sphere. |
| 0:25–0:35 | Command line options flash: 2Point, 3Point, AroundCurve; sphere Boolean-trimmed to a hemisphere dome atop a drum | The command line offers other constructions — two points, three points. Slice one in half later and you have your dome. |
| 0:35–0:40 | The dome sits in the massing; brief orbit | Centre and radius — that is the whole lesson. Mark it Got it, or watch again. |
| 0:40–0:45 | End card: Sphere + "Try it now" | Drop a sphere into the practice plaza. |

## 3. Cylinder — 0:50
**Command:** `Cylinder` · **Related:** Circle, Tube, Cone, Pipe
**Demo geometry:** the pavilion massing with a ghosted colonnade grid of centre points along its front edge.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Cylinder + icon (0.5s fade) | Columns, cores, tanks — Cylinder builds them all. |
| 0:05–0:15 | Camera tracks along the ghosted colonnade grid; one finished column pulses at the first grid point | A colonnade is coming. Each column is one cylinder: a base circle and a height, nothing more. |
| 0:15–0:30 | Type `Cylinder`, Enter; snap Cen to the first grid point; type `0.3`, Enter for radius; drag upwards; type `4.5`, Enter | Type Cylinder and press Enter. Snap the base centre to the grid point, type point three for the radius, then four point five for the height. |
| 0:30–0:40 | The column stands; copies populate the remaining grid points; brief orbit down the colonnade | One column done — copy it along the grid and the colonnade marches into place. The same move makes circular cores and rainwater tanks. |
| 0:40–0:45 | Zoom to the first column; command line replays the three inputs | Centre, radius, height. Mark it Got it, or watch again. |
| 0:45–0:50 | End card: Cylinder + "Try it now" | Raise the practice colonnade yourself. |

## 4. Cone — 0:50
**Command:** `Cone` · **Related:** TCone, Pyramid, ExtrudeCrvToPoint, Cylinder
**Demo geometry:** a circular drum tower from the massing study, its flat top awaiting a conical roof.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Cone + icon (0.5s fade) | Turrets, funnels, roof forms — Cone tapers to the point. |
| 0:05–0:15 | Camera orbits the flat-topped drum tower; a ghosted conical roof fades in above it | This drum tower wants a proper conical roof. One base circle, one apex — the cone does the rest. |
| 0:15–0:30 | Type `Cone`, Enter; snap Cen to the drum's top centre; type `3.2`, Enter for radius; drag upwards; type `4`, Enter for apex height | Type Cone, press Enter, and snap the base centre onto the drum. Type the radius, three point two, then pull upwards and type four for the apex. |
| 0:30–0:40 | The conical roof lands on the drum; quick montage: a funnel-shaped rooflight, an inverted cone column head | The roof snaps on, watertight and solid. Flip the same form for funnels, hoppers and flaring column heads. |
| 0:40–0:45 | Return to the finished turret; base circle and apex point flash | Base, radius, apex — done. Mark it Got it, or watch again. |
| 0:45–0:50 | End card: Cone + "Try it now" | Crown the practice tower yourself. |

## 5. Pipe — 1:15
**Command:** `Pipe` · **Related:** Sweep1, Tube, MultiPipe, Helix
**Demo geometry:** a stair rail curve climbing around a half-landing, plus a branching tree of service-run curves nearby.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Pipe + icon (0.5s fade) | Any curve becomes a handrail. Pipe wraps it solid. |
| 0:05–0:15 | Orbit a finished piped handrail on the stair; fade back to the bare rail curve | Where Sweep1 needs a rail and a profile, Pipe needs only the curve — it wraps a circular section along it automatically. |
| 0:15–0:30 | Select the rail curve; type `Pipe`, Enter; prompt reads "Start radius"; type `0.025`, Enter; prompt reads "End radius"; press Enter to match | Select the stair curve and type Pipe. Type the start radius — twenty-five millimetres for a comfortable grip — then press Enter again to keep it constant. |
| 0:30–0:45 | Press Enter at "Point for next radius"; the solid handrail wraps along the whole curve; command line shows Cap=Flat; orbit the capped end | Press Enter once more and the rail is wrapped, end to end, with flat caps closing it into a solid. Round caps are one click away in the command line. |
| 0:45–1:00 | Second demo: the service-run curves piped at 100mm in one pass; a varying-radius pipe tapers along a sculptural baluster | The same move dresses service runs, structural tubes and balustrade posts. And by setting different radii along the curve, a pipe can swell and taper. |
| 1:00–1:10 | Return to the handrail; the source curve ghosts inside the solid | Curve, radius, Enter — the fastest solid in Rhino. Mark it Got it, or watch again. |
| 1:10–1:15 | End card: Pipe + "Try it now" | Wrap the practice rail yourself. |

## 6. BooleanUnion — 1:15
**Command:** `BooleanUnion` · **Related:** BooleanDifference, BooleanIntersection, BooleanSplit, MeshBooleanUnion
**Demo geometry:** two overlapping massing blocks — a bar and a taller tower — intersecting at a corner; a section-cut display plane ready to toggle.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: BooleanUnion + icon (0.5s fade) | Two masses, one clean volume — BooleanUnion merges them. |
| 0:05–0:20 | Orbit the two overlapping blocks; the section plane toggles on, revealing the internal wall where they interpenetrate | These blocks look like one building — until you cut a section. Inside, the walls still cross each other. For clean sections and true volumes, they must genuinely merge. |
| 0:20–0:35 | Select both solids; type `BooleanUnion`, Enter; a brief flicker, then the blocks read as one object when clicked | Select both solids, type BooleanUnion, press Enter. It looks like nothing happened — then click once. One object. The overlap has been dissolved. |
| 0:35–0:50 | Section plane toggles on again: the interior is now clear, no crossing walls; `Volume` reports one figure | Cut the section again: the internal walls are gone, and Volume now reports the true combined figure — no double counting where the blocks overlapped. |
| 0:50–1:05 | Montage: a podium, tower and core unioned in one pass; a failed union on a barely-touching pair, nudged to overlap and rerun | Union your massing before sections, exports and quantities. If it fails, the culprit is usually surfaces that only kiss — push them into proper overlap and go again. |
| 1:05–1:10 | The merged massing rotates once, clicked as a single object | Overlap, select, union. Mark it Got it, or watch again. |
| 1:10–1:15 | End card: BooleanUnion + "Try it now" | Merge the practice blocks yourself. |

## 7. BooleanDifference — 1:30
**Command:** `BooleanDifference` (alias `BoolDiff`) · **Related:** BooleanUnion, BooleanIntersection, WireCut, MakeHole
**Demo geometry:** a solid tower slab with three window-sized boxes pushed halfway through its façade.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: BooleanDifference + icon (0.5s fade) | Cutting openings is a subtraction. Meet BooleanDifference. |
| 0:05–0:20 | Orbit the tower with the three boxes embedded in its face; a ghosted preview shows the finished punched openings | Doors, windows, service penetrations, courtyards — in solid modelling they are all the same move: model the void as a solid, then subtract it. |
| 0:20–0:35 | Type `BooleanDifference`, Enter; prompt reads "Select surfaces or polysurfaces to subtract from"; click the tower; press Enter | Type BooleanDifference — or its alias, BoolDiff. First prompt: what to subtract from. Click the tower, then press Enter. Order matters here. |
| 0:35–0:50 | Prompt reads "Select surfaces or polysurfaces to subtract with"; click the three boxes; command line shows DeleteInput=Yes; press Enter | Second prompt: what to subtract with. Click all three window boxes and press Enter. With DeleteInput on Yes, the cutters vanish as they cut. |
| 0:50–1:05 | The three openings punch through; camera dives through one reveal, showing clean interior faces | Three crisp openings, with proper reveals inside — real faces you can dimension and detail, not pasted-on pictures of windows. |
| 1:05–1:20 | Montage: a courtyard box carved from a podium, a stair void dropped through floor plates, cutter solids ghosted before each cut | Keep your cutter solids on their own layer and set DeleteInput to No — then openings stay editable: move the cutter, subtract again. |
| 1:20–1:25 | Return to the punched tower; the from/with pick order replays as highlights | From first, with second. That order is the whole trick. Mark it Got it, or watch again. |
| 1:25–1:30 | End card: BooleanDifference + "Try it now" | Punch the practice openings yourself. |

## 8. BooleanIntersection — 1:15
**Command:** `BooleanIntersection` · **Related:** BooleanUnion, BooleanDifference, Intersect
**Demo geometry:** a rectangular massing block overlapped by a large angled daylight-envelope wedge, the shared zone faintly highlighted.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: BooleanIntersection + icon (0.5s fade) | Keep only what two solids share — BooleanIntersection. |
| 0:05–0:20 | Orbit the block and the angled wedge passing through it; the overlapping zone pulses | Union keeps everything; Difference removes one from the other. This third sibling keeps only the overlap — the volume common to both solids. |
| 0:20–0:35 | Select the massing block; type `BooleanIntersection`, Enter; prompt asks for the second set; click the wedge; press Enter | Select the massing, type BooleanIntersection, press Enter, then pick the wedge as the second set and press Enter again. Both originals go. |
| 0:35–0:50 | Only the shared volume remains — the massing sculpted to the envelope; slow orbit of the carved result | What survives is exactly the buildable zone: your massing, sculpted to the daylight envelope in a single operation. |
| 0:50–1:05 | Montage: two service solids overlapped to reveal a clash volume; two sweeping forms intersected into a sculptural roof | Use it to expose clash volumes between structure and services, to check rights-of-light, or to sculpt a form from two intersecting masses. |
| 1:05–1:10 | The carved massing rotates once beside ghosts of its two parents | Two solids in, their overlap out. Mark it Got it, or watch again. |
| 1:10–1:15 | End card: BooleanIntersection + "Try it now" | Carve the practice massing to its envelope. |

## 9. Shell — 1:30
**Command:** `Shell` · **Related:** OffsetSrf, Tube, ExtractSrf, BooleanDifference
**Demo geometry:** a plain rectangular pavilion solid with its long south face towards camera, ready to become an open-fronted enclosure.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Shell + icon (0.5s fade) | Solid mass to hollow enclosure, one command — Shell. |
| 0:05–0:20 | Orbit the solid pavilion; a ghosted cutaway shows the hollow version with 200mm walls and an open front | Massing gives you lumps; buildings are hollow. Shell turns this solid block into a thin-walled enclosure — walls, roof and floor in one move, with an opening where you choose. |
| 0:20–0:35 | Type `Shell`, Enter; prompt reads "Select faces to remove"; click the south face, which highlights; command line shows Thickness | Type Shell and press Enter. The prompt asks which faces to remove — these become the openings. Click the south face so the pavilion opens towards the garden. |
| 0:35–0:50 | Type `0.2` for thickness; press Enter; the solid hollows out, walls reading 200mm thick at the open edge; camera dolly inside | Set the thickness — point two — and press Enter. The block hollows instantly. Look at that open edge: every wall is a true two-hundred-millimetre solid. |
| 0:50–1:05 | Section cut through the shelled pavilion showing consistent wall build-up; compare with OffsetSrf workflow diagram | You could build this with offsets and Booleans in six steps — Shell is the same result in one. Sections through it read like a real building immediately. |
| 1:05–1:20 | Montage: shelled tower with the top face removed for a roof void, shelled planter, a picked pair of faces creating two openings | Shell kiosks, planters, cores and quick interior studies. Remove several faces at once and each becomes an opening. |
| 1:20–1:25 | Return to the pavilion; the removed face flashes, then the thickness value | Pick the opening faces, set a thickness. Mark it Got it, or watch again. |
| 1:25–1:30 | End card: Shell + "Try it now" | Hollow the practice pavilion yourself. |

## 10. FilletEdge — 1:45
**Command:** `FilletEdge` · **Related:** ChamferEdge, BlendEdge, FilletSrf, Fillet
**Demo geometry:** the unioned massing block from earlier, all edges razor-sharp, with studio lighting that exaggerates edge highlights.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: FilletEdge + icon (0.5s fade) | Sharp corners are a giveaway. FilletEdge rounds them properly. |
| 0:05–0:20 | Slow pass along the razor-sharp massing edges; cut to the filleted version catching a soft line of light on every corner | Nothing built is ever knife-sharp — concrete arrises get eased, metal gets folded. Those slim rounded edges are what catch the light and make renders read as real. |
| 0:20–0:35 | Type `FilletEdge`, Enter; prompt reads "Select edges to fillet"; command line shows NextRadius and ChainEdges options | Type FilletEdge and press Enter. Before picking anything, set the radius in the command line — click NextRadius and type point zero five for a fifty-millimetre ease. |
| 0:35–0:50 | Click ChainEdges, then click one vertical edge; the whole connected edge loop highlights; press Enter | Now pick edges. ChainEdges is the time-saver: click one edge and every tangent neighbour joins the selection. Press Enter when the set looks right. |
| 0:50–1:05 | Preview appears with radius handles along the edges; press Enter; the fillets build, corner patches resolving cleanly | Press Enter again and the fillets build — including those fiddly corner patches where three edges meet, handled for you automatically. |
| 1:05–1:20 | Rerun on a canopy edge; drag one radius handle larger mid-edge, creating a variable fillet that swells | The handles along each edge allow more: drag one and the radius varies along the run — a fillet that grows from tight to generous. |
| 1:20–1:35 | Montage: eased plinth arrises, a rounded balustrade capping, before/after render crops | Save it for last — fillet after the Booleans, or the little surfaces multiply and fight you. Small radii, big realism. |
| 1:35–1:40 | Return to the softened massing; light rakes across the eased edges | Radius first, chain the edges, Enter twice. Mark it Got it, or watch again. |
| 1:40–1:45 | End card: FilletEdge + "Try it now" | Ease the practice edges yourself. |
