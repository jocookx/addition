# Session 12 — Solid editing · Recording scripts
Setup for all ten videos: open `demo-solid-editing.3dm` — a concrete pavilion massing (closed polysurface blocks, one floor-plate surface, one façade panel), Shaded mode with edges on, osnaps End + Mid on, Gumball enabled.

## 1. BooleanSplit — 1:00
**Command:** `BooleanSplit` · **Related:** Split, BooleanDifference, MeshBooleanSplit, WireCut
**Demo geometry:** Tower massing solid with a horizontal slab-like cutter box passing through it at level three.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: BooleanSplit + icon (0.5s fade) | Cut a solid into pieces — and keep every piece. |
| 0:05–0:15 | Finished example: tower separated into podium and upper storeys, pieces pulled apart, all closed solids | This massing is now two watertight solids, split along the cutter, nothing thrown away — ideal for phasing diagrams. |
| 0:15–0:28 | Type `BooleanSplit`; click the tower, Enter; click the cutter box, Enter | Type BooleanSplit. First select the solid to split — the tower — and Enter. Then the cutting solid, Enter again. Rhino does the rest. |
| 0:28–0:40 | Drag pieces apart with Gumball; Properties shows each as a closed polysurface | Unlike a plain Split, every fragment comes back capped and closed — ready for more booleans, volume checks or 3D printing. |
| 0:40–0:52 | Exploded-storey axonometric: tower pulled apart floor by floor, colour per level | Classic use: slice a scheme into storeys or phases, colour each piece, and pull the model apart for that exploded axo. |
| 0:52–1:00 | End card: BooleanSplit + "Try it now" | Split a massing into parts — mark it Got it, or watch again. |

## 2. WireCut — 1:10
**Command:** `WireCut` · **Related:** BooleanDifference, MakeHole, Split, BooleanSplit
**Demo geometry:** Front view of a slab-sided pavilion block with a red stepped profile curve drawn across its face.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: WireCut + icon (0.5s fade) | Draw the profile, cut the solid — like a hot wire. |
| 0:05–0:15 | Finished example: pavilion block carved with a stepped notch exactly matching the drawn profile | One curve drawn in elevation, pushed clean through the block: a stepped façade cut in seconds, no cutter solid needed. |
| 0:15–0:28 | Type `WireCut`; click the stepped curve; click the pavilion solid; cut previews through the block | Type WireCut. Pick the cutting curve first, then the solid. Rhino projects the curve straight through and shows the cut live. |
| 0:28–0:42 | Drag cut depth, or press Enter for all the way through; command line shows CutDepth and KeepAll options | Drag to set how deep the cut travels, or Enter to slice right through. KeepAll retains both sides; otherwise click the piece to discard. |
| 0:42–0:54 | Click the notch piece; it deletes; orbit the finished stepped block | Here I discard the notch — and the block heals into a closed solid, capped along the new faces automatically. |
| 0:54–1:04 | Montage: arched openings cut into a wall, terraced landform cut from a ground block | Any profile-driven subtraction — arched openings, terraced ground, sawtooth roofs — WireCut turns your elevation sketch straight into form. |
| 1:04–1:10 | End card: WireCut + "Try it now" | Carve a block with a curve — mark it Got it, or watch again. |

## 3. ExtrudeSrf — 0:55
**Command:** `ExtrudeSrf` · **Related:** ExtrudeCrv, OffsetSrf, Shell, PushPull
**Demo geometry:** A flat floor-plate surface with an irregular footprint, floating in Perspective.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: ExtrudeSrf + icon (0.5s fade) | A surface has no thickness. Give it some — straight up. |
| 0:05–0:15 | Finished example: floor plate as a 350 mm deep solid slab, section cut showing it closed | This floor plate is now a proper solid: 350 millimetres deep, capped top and bottom, ready to boolean stairs and risers through. |
| 0:15–0:27 | Type `ExtrudeSrf`; click the plate, Enter; drag upward, live solid preview follows the cursor | Type ExtrudeSrf, select the surface, Enter. Drag and the solid grows with your cursor — or type an exact depth. |
| 0:27–0:38 | Type `0.35`, Enter; highlight Solid=Yes and BothSides options on command line | I'll type point-three-five. Keep Solid set to Yes for a closed result; BothSides thickens symmetrically about the original. |
| 0:38–0:48 | Stack of extruded plates forming a quick sectional building model | Extrude every plate in a scheme and your flat levels become a sectional model — real slabs that cut properly in section. |
| 0:48–0:55 | End card: ExtrudeSrf + "Try it now" | Thicken a surface to a solid — mark it Got it, or watch again. |

## 4. OffsetSrf — 1:05
**Command:** `OffsetSrf` · **Related:** Offset, Shell, VariableOffsetSrf, OffsetSubD, ExtrudeSrf
**Demo geometry:** The doubly curved façade panel surface, single skin, Shaded with edges.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: OffsetSrf + icon (0.5s fade) | Curved surfaces can't extrude straight. Offset them instead. |
| 0:05–0:15 | Finished example: curved façade panel as a 200 mm thick solid, uniform thickness shown in section | This curved panel now has true, even material thickness — 200 millimetres everywhere, measured along the surface normals, not straight up. |
| 0:15–0:28 | Type `OffsetSrf`; click the panel, Enter; white arrows show offset direction; click FlipAll to demo | Type OffsetSrf and select the surface. Arrows show which way it will thicken — click, or use FlipAll, to send them the other way. |
| 0:28–0:42 | Type `0.2`; set Solid=Yes on the command line; Enter; closed solid appears | Type the distance, and here's the key option: Solid equals Yes builds the second skin and the edge walls in one go — a closed solid. |
| 0:42–0:54 | Compare with ExtrudeSrf on the same panel: extruded version shown thinning at steep areas | Extruding a curved surface thins out where it leans; offsetting follows the normals, so thickness stays honest — that's why this is the standard. |
| 0:54–1:00 | Concrete shell roof given structural depth; section through it | Shell roofs, ramped slabs, curved walls: whenever geometry curves, OffsetSrf is how it gains build thickness. |
| 1:00–1:05 | End card: OffsetSrf + "Try it now" | Give a curved surface depth — mark it Got it, or watch again. |

## 5. ChamferEdge — 0:55
**Command:** `ChamferEdge` · **Related:** FilletEdge, ChamferSrf, Chamfer, BlendEdge
**Demo geometry:** Precast concrete seat block (closed solid) zoomed to its sharp top arris.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: ChamferEdge + icon (0.5s fade) | Sharp concrete arrises chip. Chamfer them like a fabricator. |
| 0:05–0:15 | Finished example: seat block with crisp 15 mm chamfers on every top edge, raking light showing the facets | Every exposed edge of this precast seat carries a neat 15-millimetre chamfer — exactly how it would leave the mould. |
| 0:15–0:27 | Type `ChamferEdge`; set distance to `0.015`; click the top edges one by one, preview strips appear | Type ChamferEdge, set your distance first, then click the edges. Each pick previews the flat strip before anything is committed. |
| 0:27–0:39 | Drag a handle to change one edge's distance; show ChainEdges option picking a whole loop | Handles let you vary distances per edge, and ChainEdges grabs a whole connected loop in one click. Enter twice to apply. |
| 0:39–0:48 | Rendered close-up: chamfered plinth edge catching light; second shot of eased balustrade edge | Arris details, eased handrails, machined-looking joinery — chamfers read as intent, not accident, in every close-up render. |
| 0:48–0:55 | End card: ChamferEdge + "Try it now" | Ease an edge on a solid — mark it Got it, or watch again. |

## 6. BlendEdge — 1:00
**Command:** `BlendEdge` · **Related:** FilletEdge, BlendSrf, ChamferEdge
**Demo geometry:** A curved reception-desk solid in a reflective display mode (zebra-capable), sharp edges visible.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: BlendEdge + icon (0.5s fade) | When a fillet isn't smooth enough, blend the edge. |
| 0:05–0:15 | Finished example: desk edge with flowing rounded corner; zebra stripes running unbroken across it | Look at the zebra stripes: they flow straight across this edge without a kink. That's curvature continuity — a blend, not a fillet. |
| 0:15–0:28 | Type `BlendEdge`; set radius `0.05`; click the desk's front edges; preview appears | BlendEdge works just like FilletEdge: set a radius, click the edges, preview before committing. The difference is all in the surface quality. |
| 0:28–0:40 | Split-screen zebra comparison: FilletEdge left with striped kinks, BlendEdge right seamless | A circular fillet is only tangent — reflections snap at its border. The blend eases in and out, so highlights glide over. |
| 0:40–0:52 | Montage: polished concrete bench, GRP façade panel corner, ceiling bulkhead curve | Use it where reflections are the finish: polished joinery, glossy panels, curved ceilings — anywhere the eye will trace the light. |
| 0:52–1:00 | End card: BlendEdge + "Try it now" | Blend an edge and zebra-check it — mark it Got it, or watch again. |

## 7. PushPull — 1:00
**Command:** `PushPull` · **Related:** MoveFace, ExtrudeCrv, Inset, SplitFace, SolidPtOn
**Demo geometry:** Simple pavilion block with a rectangle drawn flat on its front face, Shaded mode.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: PushPull + icon (0.5s fade) | SketchUp instincts, Rhino precision. This is PushPull. |
| 0:05–0:15 | Finished example: pavilion with a deep window reveal pushed in and a balcony volume pulled out | One block, two direct edits: a window recess pushed in, a balcony pulled out — no boolean commands typed, ever. |
| 0:15–0:28 | Type `PushPull`; hover the rectangle on the face — region highlights; click and drag inward | Type PushPull and hover: Rhino finds the region bounded by your curve automatically. Click, drag in, and material is removed live. |
| 0:28–0:40 | Type `0.4` for exact depth; then drag another face outward to add a volume; tap Alt to toggle add/subtract | Type a distance for precision. Drag outwards to add material instead — and Alt toggles whether the result merges or stays separate. |
| 0:40–0:52 | Rapid massing session: openings, setbacks and plinths sculpted in seconds on the block | For early massing this is the fastest loop in Rhino 8 — draw a shape on a face, push, judge, repeat. |
| 0:52–1:00 | End card: PushPull + "Try it now" | Push a recess into a block — mark it Got it, or watch again. |

## 8. Inset — 0:55
**Command:** `Inset` · **Related:** PushPull, SplitFace, OffsetSrf, MoveFace
**Demo geometry:** Pavilion block with one large flat façade face towards camera.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Inset + icon (0.5s fade) | A frame around a face, ready to push. That's Inset. |
| 0:05–0:15 | Finished example: façade face with a 100 mm border frame and its centre panel recessed 50 mm | This panel detail — a flush frame with a shadow-gap recess — started as one flat face and two quick commands. |
| 0:15–0:27 | Type `Inset`; click the façade face; drag inward, live border preview; type `0.1`, Enter | Type Inset, click a face, and drag: a smaller face forms inside it at an even margin. Type the margin for precision — Enter. |
| 0:27–0:39 | Immediately run PushPull on the new inner face, pushing it in 50 mm | The inner face is now its own region — PushPull it straight in and the frame stays proud. That pairing is the whole workflow. |
| 0:39–0:48 | Grid of façade panels each inset and recessed; raking sun showing shadow gaps | Repeat across a façade grid and you've got panelised elevation depth — reveals, frames and shadow gaps without any boolean modelling. |
| 0:48–0:55 | End card: Inset + "Try it now" | Inset and recess a face — mark it Got it, or watch again. |

## 9. SolidPtOn — 0:55
**Command:** `SolidPtOn` · **Related:** PointsOn, MoveEdge, MoveFace, PushPull
**Demo geometry:** A simple gabled house massing (closed polysurface), Perspective, Gumball on.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: SolidPtOn + icon (0.5s fade) | Grab a solid by its corners — no exploding required. |
| 0:05–0:15 | Finished example: house massing with ridge dragged higher and one eave pulled out, still one closed solid | This gable started as a plain box. Its ridge was dragged up, its eave pulled wide — and it never stopped being a solid. |
| 0:15–0:27 | Type `SolidPtOn`; house sprouts white grip points at corners and edge midpoints | Type SolidPtOn and grips appear at every corner and edge. These aren't control points — they're handles on the solid itself. |
| 0:27–0:39 | Select the two ridge grips; drag up with Gumball; walls and roof planes follow, staying planar and closed | Select the ridge grips and drag: connected faces stretch to follow, and the polysurface stays closed. Press Escape to put the grips away. |
| 0:39–0:48 | Quick massing riff: several boxes skewed into a stepped terrace composition | Perfect for loose massing studies — skew, stretch and pitch simple volumes while they stay watertight for sections and booleans. |
| 0:48–0:55 | End card: SolidPtOn + "Try it now" | Drag a solid's corner grips — mark it Got it, or watch again. |

## 10. MoveFace — 0:55
**Command:** `MoveFace` · **Related:** MoveEdge, PushPull, MoveHole, SolidPtOn
**Demo geometry:** Pavilion block with a rectangular recess already cut into one side, Perspective.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: MoveFace + icon (0.5s fade) | Change one face; let the solid sort itself out. |
| 0:05–0:15 | Finished example: same block shown before/after — top face raised a storey, recess deepened, all still closed | Taller building, deeper recess — two face moves, no remodelling. The neighbouring faces stretched to keep everything joined. |
| 0:15–0:27 | Type `MoveFace`; click the block's top face, Enter; pick a base point, drag upward | Type MoveFace, select the face, Enter. Then it's just like Move — base point, target point — except the solid updates around it. |
| 0:27–0:39 | Type `3.5` with Ortho on for an exact storey height; then move the recess's back face inward | Type distances for precision — an exact storey height here. Move a recess's back face and the reveal deepens like a parametric edit. |
| 0:39–0:48 | Side-by-side note: MoveFace slides along any vector; PushPull works normal to the face | Think of it as PushPull's free-direction cousin — when the edit isn't square to the face, MoveFace is the one to reach for. |
| 0:48–0:55 | End card: MoveFace + "Try it now" | Move a face on a solid — mark it Got it, or watch again. |
