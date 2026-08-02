# Session 10 — Surface craft · Recording scripts
Setup: open `session-10-surface-craft.3dm` — a kit of prepared surface pairs: two roof sheets with a gap between them, two sheets meeting at a visible kink, two untrimmed sheets sharing an edge, a roof surface stopping short of a party wall, a plinth of intersecting faces, a gently curved façade panel, and a heavily trimmed panel with holes; Shaded display mode with edge display on, Perspective maximised, Osnap on with End and Near ticked; keep Zebra analysis one click away in the toolbar.

## 1. BlendSrf — 1:45
**Command:** `BlendSrf` · **Related:** BlendCrv, FilletSrf, MatchSrf, BlendEdge
**Demo geometry:** two curved roof sheets with a clear gap between their long edges, like a canopy interrupted mid-flow.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: BlendSrf + icon (0.5s fade) | Bridge two surfaces beautifully — that is BlendSrf. |
| 0:05–0:20 | Orbit the two roof sheets and the awkward gap; a ghosted blend fades in, flowing seamlessly from one to the other | Two roof sheets, one gap. A fillet would bridge it with a rigid arc; this junction wants something that flows — a transition you can shape and tune. |
| 0:20–0:35 | Type `BlendSrf`, Enter; prompt reads "Select first edge"; click the first sheet's edge, then Enter; click the second edge, Enter | Type BlendSrf and press Enter. Pick the first edge and confirm, then the opposite edge. Rhino now knows the two shores it must bridge. |
| 0:35–0:50 | The Adjust Surface Blend dialogue opens with a live preview; continuity dropdowns read Curvature on both sides | The preview appears with the dialogue. Both ends are set to curvature continuity — meaning the blend leaves each sheet without even a change in highlight, let alone a crease. |
| 0:50–1:05 | Drag the shape handles at the edges; the blend bulges fuller, then tightens; sliders move in the dialogue | These handles are the joy of it. Drag them and the blend swells or tightens live — you are sculpting the junction, not accepting whatever the maths gives. |
| 1:05–1:20 | Click OK; the finished blend joins the composition; Zebra analysis sweeps across the junction with unbroken stripes | Click OK, then check with Zebra: the stripes run across the junction without a kink. That is the signature of a surface joint done properly. |
| 1:20–1:35 | Montage: a canopy blending into a façade wall, a ramp soffit easing into a podium edge | Reach for it wherever roof meets wall or shell meets ground and the design intent says seamless. When FilletSrf feels too mechanical, blend. |
| 1:35–1:40 | Return to the finished junction; the two picked edges flash in order | Two edges, set continuity, shape the handles. Mark it Got it, or watch again. |
| 1:40–1:45 | End card: BlendSrf + "Try it now" | Bridge the practice gap yourself. |

## 2. MatchSrf — 1:45
**Command:** `MatchSrf` · **Related:** Match, BlendSrf, MergeSrf, EndBulge, EdgeContinuity
**Demo geometry:** two façade sheets whose edges touch but meet at a visible kink; Zebra stripes across the seam are broken and stepped.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: MatchSrf + icon (0.5s fade) | Kill the crease between surfaces — MatchSrf. |
| 0:05–0:20 | Camera rakes light across the seam: a hard kink line glints; Zebra toggles on, stripes visibly stepping at the joint | These sheets touch, but look at the light — a crease runs down the seam, and the zebra stripes jump sideways across it. On a glossy façade, every passer-by would see this. |
| 0:20–0:35 | Type `MatchSrf`, Enter; prompt reads "Select untrimmed surface edge to change"; click the left sheet's edge; prompt asks for the target edge; click the right sheet's edge | Type MatchSrf. First pick the edge that is allowed to move — the surface being corrected. Then pick the edge it must obey. That order decides who bends. |
| 0:35–0:50 | The Match Surface dialogue opens; Continuity options Position, Tangency, Curvature; Tangency selected; live preview updates | The dialogue offers three grades of agreement. Position just closes gaps. Tangency removes the crease. Curvature makes even the reflections flow through. Choose tangency here. |
| 0:50–1:05 | Click OK; the left sheet's edge reshapes subtly; raking light now sweeps across the seam without a glint; Zebra stripes run through cleanly | Click OK. The edge reshapes — subtly, just enough — and the crease is gone. The zebra stripes now stroll across the seam as if it were not there. |
| 1:05–1:20 | Overlay tip: control points shown clustering near the matched edge; note reads "match untrimmed edges" | Two habits: MatchSrf wants untrimmed edges, and it works by moving the control points nearest the seam — so keep some rows in reserve for it to adjust. |
| 1:20–1:35 | Montage: multi-patch curved façade with every seam matched, reflection lines flowing uninterrupted across five panels | This is how multi-panel surfaces become one apparent skin — GRP shells, curved soffits, car-quality cladding. Match every seam, then let the reflections prove it. |
| 1:35–1:40 | Return to the healed seam; edge-to-change then target edge flash in order | Edge to change, edge to obey, pick the continuity. Mark it Got it, or watch again. |
| 1:40–1:45 | End card: MatchSrf + "Try it now" | Heal the practice seam yourself. |

## 3. MergeSrf — 1:15
**Command:** `MergeSrf` · **Related:** MatchSrf, Join, MergeAllCoplanarFaces
**Demo geometry:** two untrimmed sheets sharing a full common edge — one gentle roof surface split down its middle into halves.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: MergeSrf + icon (0.5s fade) | Two surfaces become truly one — MergeSrf. |
| 0:05–0:20 | Click each half in turn: two separate objects; a `Join` demo makes a polysurface, but the seam edge remains highlighted | Join would glue these halves, but the seam survives inside — a polysurface is still two faces wearing one coat. Some operations need a genuine single surface. |
| 0:20–0:35 | Type `MergeSrf`, Enter; click the first half near the shared edge, then the second; command line shows Smooth=Yes | Type MergeSrf and pick both surfaces near their common edge. Leave Smooth on Yes so the merge eases across the join rather than folding at it. |
| 0:35–0:50 | The halves fuse; clicking now selects one surface; edge display shows no interior seam; control points display as one continuous grid | One click now selects one surface. No interior edge, one continuous control point grid — the seam has not been hidden, it has ceased to exist. |
| 0:50–1:05 | Montage: a merged roof unrolling flat in one piece; a single surface offset cleanly; note reads "untrimmed, shared edge" | Merge before unrolling, offsetting or exporting, and downstream tools behave. The rule of entry: both surfaces untrimmed, meeting along a full shared edge. |
| 1:05–1:10 | Return to the fused sheet, rotating once | Two untrimmed sheets, one shared edge, merged. Mark it Got it, or watch again. |
| 1:10–1:15 | End card: MergeSrf + "Try it now" | Fuse the practice halves yourself. |

## 4. ExtendSrf — 1:15
**Command:** `ExtendSrf` · **Related:** Extend, Trim, MergeSrf
**Demo geometry:** a sloping roof surface that stops 400mm short of the party wall it should pass through, the shortfall spotlit.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: ExtendSrf + icon (0.5s fade) | When the roof falls short — ExtendSrf reaches further. |
| 0:05–0:20 | Camera pushes into the gap between the roof edge and the party wall; a Trim attempt fails because the surfaces never meet | The roof needs trimming against the party wall — but it stops short, so Trim has nothing to cut. Before you can trim, the surface must actually get there. |
| 0:20–0:35 | Type `ExtendSrf`, Enter; prompt reads "Select edge of surface to extend"; click the roof's short edge; command line shows Type=Smooth | Type ExtendSrf and click the edge that falls short. Note the Type option: Smooth continues the surface's curvature; Line drives it straight from the edge. |
| 0:35–0:50 | Type `0.6`, Enter; the roof grows through the wall; the earlier Trim now succeeds, cutting the roof neatly at the wall | Give it a distance with some spare — point six — and the roof grows straight through the wall. Now Trim has something to bite, and the junction cuts clean. |
| 0:50–1:05 | Montage: a canopy stretched to meet a column line, a floor surface extended under a façade for a solid trim | Extend generously, trim precisely — that pairing solves half the near-miss junctions in any model. Overshoot costs nothing; shortfall costs the whole operation. |
| 1:05–1:10 | Return to the trimmed junction; the extended zone ghosts briefly | Pick the edge, set the type, give a distance. Mark it Got it, or watch again. |
| 1:10–1:15 | End card: ExtendSrf + "Try it now" | Reach the practice wall yourself. |

## 5. FilletSrf — 1:30
**Command:** `FilletSrf` · **Related:** FilletEdge, BlendSrf, ChamferSrf
**Demo geometry:** two individual surfaces — a canopy sheet and a supporting wall face — intersecting at a raw, unjoined crossing.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: FilletSrf + icon (0.5s fade) | A rolling junction between two loose surfaces — FilletSrf. |
| 0:05–0:20 | Orbit the raw intersection where canopy pierces wall; a `FilletEdge` attempt fails — these are not a joined solid | FilletEdge rounds the edges of solids — but these are two loose surfaces crossing, with no shared edge to round. Surface-to-surface junctions get their own tool. |
| 0:20–0:35 | Type `FilletSrf`, Enter; command line shows Radius; type `0.3`, Enter; prompt reads "Select first surface to fillet" | Type FilletSrf and set the radius first — point three — in the command line. Then it asks for the two surfaces, one at a time. |
| 0:35–0:50 | Click the canopy on the side to keep, then the wall on its keep side; command line shows Trim=Yes; a rolling fillet surface appears between them | Click each surface on the side you want to keep — the picks steer where the fillet rolls. With Trim on Yes, both surfaces cut back to meet it exactly. |
| 0:50–1:05 | Orbit the finished junction: canopy, radius, wall in one continuous run; a section curve through it shows the tangent arc | The result is a true rolling radius: a constant arc, tangent to both sides, like a poured concrete cove running the length of the junction. |
| 1:05–1:20 | Side-by-side: FilletSrf's constant mechanical arc versus BlendSrf's sculptable transition on the same junction | Keep the family straight: FilletSrf is constant and mechanical; when the junction needs shaping and coaxing, that is BlendSrf's job. |
| 1:20–1:25 | Return to the coved junction; the two pick points flash on their keep sides | Radius first, then two surfaces, picked on the keep side. Mark it Got it, or watch again. |
| 1:25–1:30 | End card: FilletSrf + "Try it now" | Roll the practice junction yourself. |

## 6. ChamferSrf — 1:15
**Command:** `ChamferSrf` · **Related:** FilletSrf, ChamferEdge
**Demo geometry:** a concrete plinth modelled as two loose faces — top and side — meeting at a sharp arris.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: ChamferSrf + icon (0.5s fade) | A crisp bevel between surfaces — ChamferSrf. |
| 0:05–0:20 | Close-up of the plinth's sharp arris; cut to a site photo-style render of a chamfered concrete edge with its shadow line | Where a fillet rolls, a chamfer cuts — a flat strip at an angle. On concrete plinths and precast edges, that bevel is exactly what the shutter carpenter will form. |
| 0:20–0:35 | Type `ChamferSrf`, Enter; command line shows Distances; type `0.05,0.05`, Enter; prompt asks for first surface | Type ChamferSrf and set the distances first — fifty by fifty millimetres for an even bevel. Unequal distances give you a steeper, drawn-off splay. |
| 0:35–0:50 | Click the top face, then the side face, each on its keep side; Trim=Yes; a flat angled strip replaces the arris | Pick both surfaces on their keep sides, with Trim on Yes. The sharp arris is replaced by one clean flat strip — a shadow line you can actually build. |
| 0:50–1:05 | Montage: chamfered precast panel edges, a bevelled window surround, a machined-looking balustrade base | Plinths, precast joints, frames and anything machined — the chamfer reads as crafted where a raw edge reads as unfinished. |
| 1:05–1:10 | Return to the bevelled plinth; distances annotate the strip | Set two distances, pick two surfaces. Mark it Got it, or watch again. |
| 1:10–1:15 | End card: ChamferSrf + "Try it now" | Bevel the practice plinth yourself. |

## 7. VariableFilletSrf — 1:30
**Command:** `VariableFilletSrf` · **Related:** FilletSrf, VariableChamferSrf, BlendSrf
**Demo geometry:** a long canopy surface meeting a podium face, the junction running ten metres from a delicate glazed end to a heavy structural end.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: VariableFilletSrf + icon (0.5s fade) | A fillet that grows along its run — VariableFilletSrf. |
| 0:05–0:20 | Camera tracks the ten-metre junction; a ghosted fillet fades in, tight at the glazed end and swelling to generous at the structural end | One radius rarely suits a whole junction. Here the fillet should stay tight where the canopy meets glazing, then swell where the structure thickens. Constant tools cannot do that. |
| 0:20–0:35 | Type `VariableFilletSrf`, Enter; set Radius to `0.1`; pick the canopy, then the podium face; a preview fillet with round handles along its length appears | Type VariableFilletSrf, set a starting radius, and pick the two surfaces. The preview arrives wearing a row of handles along the junction — each one a local radius. |
| 0:35–0:50 | Click the handle at the structural end; type `0.4`, Enter; the fillet swells smoothly towards that end while the far end stays at 0.1 | Click the far handle and type point four. The fillet inflates towards that end, easing smoothly between values — one continuous surface, two personalities. |
| 0:50–1:05 | Click `AddHandle` in the command line; a new handle drops mid-run and is set to `0.25`; the profile adjusts again | Need more control? AddHandle drops extra radius stations anywhere along the run. Three, four, five — the fillet threads through every value you set. |
| 1:05–1:20 | Press Enter; the finished variable fillet builds; camera glides the full run from tight to generous | Confirm, and admire the run: a junction that responds to its context along its length — precisely the sort of move judges of good detailing notice. |
| 1:20–1:25 | Return to mid-run; the handles flash with their radius values | Two surfaces, then tune the handles. Mark it Got it, or watch again. |
| 1:25–1:30 | End card: VariableFilletSrf + "Try it now" | Tune the practice junction end to end. |

## 8. Smash — 1:15
**Command:** `Smash` · **Related:** UnrollSrf, Squish
**Demo geometry:** a gently doubly curved façade panel that needs to be cut from flat sheet metal; UnrollSrf has just refused it.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Smash + icon (0.5s fade) | Nearly flat, needs to be flat — Smash it. |
| 0:05–0:20 | Orbit the subtly double-curved panel; `UnrollSrf` runs and the command line refuses — surface is not developable | This panel must be cut from flat sheet. UnrollSrf refuses — it only accepts truly developable surfaces, and this one carries a whisper of double curvature. |
| 0:20–0:35 | Select the panel; type `Smash`, Enter; a flattened copy drops onto the ground plane beside the original | Select it and type Smash. No dialogue, no ceremony — a flattened version lands on the construction plane, distortion quietly absorbed across the sheet. |
| 0:35–0:50 | Overlay compares edge lengths of 3D panel and flat pattern: differences under a percent; a caution icon appears | Check the honesty of it: compare edge lengths against the original. On a nearly developable panel the error is a whisker — fine for a mock-up, not for aerospace. |
| 0:50–1:05 | Montage: flat patterns nested on a sheet for laser cutting; note reads "precision flattening → Squish" | Use it for cutting patterns, templates and cardboard models. When the curvature is serious and accuracy matters, graduate to Squish — Smash is the quick approximation. |
| 1:05–1:10 | The flat pattern beside its 3D parent, both highlighted | Select, Smash, sanity-check the edges. Mark it Got it, or watch again. |
| 1:10–1:15 | End card: Smash + "Try it now" | Flatten the practice panel yourself. |

## 9. ShrinkTrimmedSrf — 1:15
**Command:** `ShrinkTrimmedSrf` · **Related:** Untrim, RebuildUV, UntrimAll
**Demo geometry:** a small trimmed façade panel; F10 control points on, revealing a vast underlying surface grid extending far beyond the visible panel.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: ShrinkTrimmedSrf + icon (0.5s fade) | Trim the invisible baggage — ShrinkTrimmedSrf. |
| 0:05–0:20 | F10 pressed: control points blossom far outside the small visible panel, mapping a huge hidden parent surface | Turn on control points and there is the secret: this modest panel still drags around the whole parent surface it was cut from. Trimming hides geometry; it never removes it. |
| 0:20–0:35 | Select the panel; type `ShrinkTrimmedSrf`, Enter; the control point cloud contracts to hug the panel's boundary | Select the panel, type ShrinkTrimmedSrf, press Enter. The underlying sheet contracts until it sits snugly around the trim boundary. The visible panel does not move at all. |
| 0:35–0:50 | Before/after split: sprawling point grid versus tight grid; a point-edit on the shrunk panel behaves predictably | Same shape, honest structure. Now point editing works at the panel's own scale, and commands that read the underlying surface stop being confused by acres of ghost. |
| 0:50–1:05 | Montage: panels shrunk before export to fabricators, before MatchSrf, file size readout dropping | Make it housekeeping: shrink before matching, before exporting to fabricators, before rebuilding. Tidy underlying surfaces are the difference between a model and a liability. |
| 1:05–1:10 | The shrunk panel with its neat point grid rotates once | Select, shrink, carry less baggage. Mark it Got it, or watch again. |
| 1:10–1:15 | End card: ShrinkTrimmedSrf + "Try it now" | Shrink the practice panel yourself. |

## 10. UntrimAll — 1:00
**Command:** `UntrimAll` · **Related:** Untrim, UntrimHoles, ShrinkTrimmedSrf
**Demo geometry:** a façade sheet peppered with trimmed window holes and a badly judged trimmed outer edge — the trims all need to go.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: UntrimAll + icon (0.5s fade) | Wrong trims? Recover the whole sheet — UntrimAll. |
| 0:05–0:15 | Orbit the sheet with its scatter of holes and ragged edge; a red annotation reads "setting-out was wrong" | The setting-out has changed and every one of these openings is now in the wrong place. Deleting and remodelling the surface would lose its carefully built curvature. |
| 0:15–0:30 | Select the sheet; type `UntrimAll`, Enter; every hole heals and the full rectangular underlying sheet returns at once | Select it, type UntrimAll, press Enter. Every hole heals and the full original sheet returns in one stroke — because trimmed geometry was only ever hidden, never gone. |
| 0:30–0:45 | New opening curves drop in at the revised positions; the sheet is re-trimmed correctly; note contrasts `Untrim` for one edge, `UntrimHoles` for holes only | Now re-trim against the corrected curves. And know the family: Untrim lifts one edge at a time, UntrimHoles clears only the holes — UntrimAll clears the decks. |
| 0:45–0:55 | The corrected façade beside a ghost of its wrongly trimmed former self | Trims are decisions, and decisions get revised. This is your undo for all of them. Mark it Got it, or watch again. |
| 0:55–1:00 | End card: UntrimAll + "Try it now" | Strip and re-trim the practice sheet. |
