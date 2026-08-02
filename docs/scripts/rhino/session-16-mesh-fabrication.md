# Session 16 — Mesh & fabrication · Recording scripts
Setup for the whole session: open `demo-16-fabrication.3dm` — a NURBS pavilion canopy, a dense photogrammetry scan of a facade fragment, and a downloaded chair mesh with defects — Shaded display mode, osnaps off unless a step says otherwise.

## 1. Mesh — 1:15
**Command:** `Mesh` · **Related:** MeshToNURB, ReduceMesh, QuadRemesh, OffsetMesh
**Demo geometry:** The NURBS canopy polysurface alone in a maximised Perspective viewport, shaded, nothing selected.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Mesh + icon (0.5s fade) | Mesh. Turn smooth NURBS into polygons that printers and engines understand. |
| 0:05–0:15 | Finished canopy beside its meshed twin, wireframe on so the polygon net is visible | This canopy is off to the 3D printer. Printers speak polygons, not NURBS — Mesh does the translation. |
| 0:15–0:27 | Cursor types `Mesh` at the command line, selects the canopy, presses Enter; simple dialog appears | Type Mesh, select the polysurface, Enter. The simple dialog opens with one slider running from fewer polygons to more. |
| 0:27–0:39 | Slider dragged left then right; preview mesh visibly coarsens, then tightens over the curved roof | Drag it and watch the preview. Coarse is light but faceted; fine hugs the curvature at the cost of file size. |
| 0:39–0:51 | Detailed Controls clicked; dialog expands; cursor highlights the maximum edge length field, types a value | Need real control? Detailed Controls exposes density, maximum edge length and angle — set edge length to cap facet size for fabrication. |
| 0:51–1:03 | OK clicked; new mesh object appears on its own layer; original NURBS hidden; properties panel shows Mesh | Click OK and you get a separate mesh object — your original NURBS stays untouched, so keep both and export the mesh. |
| 1:03–1:10 | Split screen: canopy model and the same mesh in a print-slicer window | Run it before any print, game engine export or heavy visualisation scene. Mark it Got it, or watch again. |
| 1:10–1:15 | End card: Mesh + "Try it now" | Try it now — mesh a surface in the practice file. |

## 2. MeshRepair — 1:15
**Command:** `MeshRepair` · **Related:** Check, UnifyMeshNormals, FillMeshHoles, ShrinkWrap
**Demo geometry:** The downloaded chair mesh with visible holes and a few dark flipped faces, Perspective viewport, shaded.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: MeshRepair + icon (0.5s fade) | MeshRepair. A guided clinic for meshes that refuse to behave. |
| 0:05–0:15 | Slow orbit around the chair mesh; camera pauses on a hole in the seat and a dark flipped patch | You downloaded a chair for a visual, and it won't print, won't boolean, and shades in odd patches. |
| 0:15–0:27 | Cursor types `MeshRepair`; panel docks on the right; Check Mesh button clicked; report lists defects | Type MeshRepair and a panel opens. Hit Check Mesh first — it lists exactly what's wrong: holes, bad normals, duplicate faces. |
| 0:27–0:39 | Repair button clicked; progress ticks through fixes; hole count in the report drops to zero | Then work down the panel step by step. Each button targets one defect class, and the report updates as problems disappear. |
| 0:39–0:51 | Dark patch flips to normal shading; camera orbits the now-uniform chair | Flipped normals unify, small holes fill automatically. Bigger gaps get highlighted so you can patch them deliberately rather than blindly. |
| 0:51–1:03 | Final Check Mesh run; report reads "This is a good mesh"; mesh re-shaded clean | Re-run the check until the report comes back clean. That line is your licence to print or export. |
| 1:03–1:10 | Chair mesh dropped into a scene beside scanned site context | First stop for any scanned or downloaded mesh in a project. Mark it Got it, or watch again. |
| 1:10–1:15 | End card: MeshRepair + "Try it now" | Try it now — heal the broken mesh in the practice file. |

## 3. ReduceMesh — 1:00
**Command:** `ReduceMesh` · **Related:** QuadRemesh, Mesh, ShrinkWrap
**Demo geometry:** The photogrammetry facade scan — around two million faces — shaded with wireframe on, polygon count visible in the status bar.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: ReduceMesh + icon (0.5s fade) | ReduceMesh. Shrink a heavy scan without losing its shape. |
| 0:05–0:14 | Orbit stutters visibly around the two-million-face scan; polygon count highlighted on screen | This facade scan is two million faces, and every orbit stutters. You need the shape, not the weight. |
| 0:14–0:26 | Cursor types `ReduceMesh`, selects the scan; dialog opens; reduction typed as a percentage | Type ReduceMesh, select the mesh. In the dialog, set a target — a percentage or an exact face count. |
| 0:26–0:38 | Preview ticked; mesh visibly lightens while cornice profiles stay crisp; accuracy slider nudged | Preview it live. Rhino strips faces from flat areas first, protecting edges and detail — nudge accuracy if profiles start softening. |
| 0:38–0:48 | OK clicked; status bar shows 200k faces; orbit now silky smooth | Accept, and the same facade orbits smoothly at a tenth of the weight — ideal before dropping scans into context models. |
| 0:48–0:55 | Side-by-side: original and reduced mesh, visually identical at viewing distance | Reach for it whenever scan data slows a model down. Mark it Got it, or watch again. |
| 0:55–1:00 | End card: ReduceMesh + "Try it now" | Try it now — lighten the scan in the practice file. |

## 4. QuadRemesh — 1:30
**Command:** `QuadRemesh` · **Related:** ToSubD, ReduceMesh, ShrinkWrap
**Demo geometry:** A jagged triangulated terrain scan in Perspective, wireframe visible so the messy triangles read clearly.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: QuadRemesh + icon (0.5s fade) | QuadRemesh. Rebuild any mess as clean, flowing quads. |
| 0:05–0:15 | Camera glides over the triangulated terrain; zoom into a patch of chaotic sliver triangles | Scan meshes arrive as triangle soup — impossible to edit, ugly to contour. QuadRemesh rebuilds the whole thing properly. |
| 0:15–0:27 | Cursor types `QuadRemesh`, selects the terrain; options dialog appears; target quad count field highlighted | Type QuadRemesh and select the mesh — it also takes surfaces and SubD. Set a target quad count to suit your purpose. |
| 0:27–0:39 | Adaptive Size slider adjusted; preview shows smaller quads gathering in the valley folds | Adaptive Size concentrates quads where curvature demands them, so ridgelines and valleys keep their definition while flats stay light. |
| 0:39–0:51 | Detect Hard Edges ticked; preview quads snap along a retaining-wall crease | Tick Detect Hard Edges to keep creases crisp — retaining walls and kerbs stay sharp instead of melting. |
| 0:51–1:03 | Convert to SubD option ticked, then unticked; preview flips between quad mesh and smooth SubD | The killer option: Convert to SubD. Your scan becomes a smooth, sculptable object in one step. |
| 1:03–1:15 | OK clicked; finished quad mesh orbits; wireframe shows tidy flowing loops following the landform | Accept, and admire the result — orderly quad loops flowing with the landform, ready for editing, contouring or Grasshopper. |
| 1:15–1:25 | Terrain dropped under a massing model; quick Contour command slices clean sections through it | Use it to turn survey scans into workable site models. Mark it Got it, or watch again. |
| 1:25–1:30 | End card: QuadRemesh + "Try it now" | Try it now — remesh the terrain in the practice file. |

## 5. ShrinkWrap — 1:30
**Command:** `ShrinkWrap` · **Related:** QuadRemesh, MeshRepair, Drape
**Demo geometry:** A messy competition massing model — overlapping solids, open meshes and a point-cloud tree — grouped loosely on screen.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: ShrinkWrap + icon (0.5s fade) | ShrinkWrap. One watertight mesh around absolutely anything. |
| 0:05–0:15 | Orbit around the massing model; ShowEdges flashes purple naked edges everywhere; a boolean visibly fails | Deadline week: your massing model is overlapping solids, open meshes and a point cloud. The printer wants one watertight object. |
| 0:15–0:27 | Cursor types `ShrinkWrap`, window-selects everything, Enter; dialog opens with target edge length field | Type ShrinkWrap, select the lot — solids, meshes, even point clouds — and Enter. The dialog asks for a target edge length. |
| 0:27–0:39 | Edge length typed; offset field highlighted; preview mesh forms tightly around the whole cluster | Edge length sets resolution; the offset inflates the wrap slightly, which quietly bridges small gaps between parts. |
| 0:39–0:51 | Polish slider adjusted; wrap surface visibly smooths; interior view shows a single closed skin | The result shrinks tight to every face like vacuum-packing, then Polish smooths the skin. Inside, it's one closed volume. |
| 0:51–1:03 | Check run on the result; command line reports a valid closed mesh; count reads one object | Run Check on it: one valid, closed, printable mesh. No repairing, no booleans, no tears. |
| 1:03–1:15 | Fill Holes option toggled on a second run over the scanned chair mesh; holes seal in the preview | It doubles as a repair tool — wrap a holed scan with Fill Holes on, and defects simply vanish under the new skin. |
| 1:15–1:25 | Wrapped massing model in a slicer window, print progress bar; then a photo-style shot of the printed model | This is the modern route from messy model to 3D print. Mark it Got it, or watch again. |
| 1:25–1:30 | End card: ShrinkWrap + "Try it now" | Try it now — wrap the massing cluster in the practice file. |

## 6. UnrollSrf — 1:30
**Command:** `UnrollSrf` · **Related:** Squish, Smash, CreateUVCrv, FlattenSrf
**Demo geometry:** A curved timber cladding surface with panel joint curves and setting-out marks drawn on it, Perspective plus Top viewports.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: UnrollSrf + icon (0.5s fade) | UnrollSrf. Flatten curved surfaces into cuttable templates. |
| 0:05–0:15 | Finished curved timber facade render; cut to the flat CNC templates laid out on a sheet | This curved timber facade started life as flat sheets. UnrollSrf produces the exact templates the fabricator cut. |
| 0:15–0:27 | Cursor types `UnrollSrf`, picks the cladding surface; command line options row highlighted | Type UnrollSrf and pick the surface. This works on developable surfaces — curved in one direction only, like bent sheet material. |
| 0:27–0:39 | Joint curves and setting-out marks selected at the "select curves on surface" prompt; Enter pressed | Then select the curves drawn on it — panel joints, fixing positions, score lines. They travel with the surface as it flattens. |
| 0:39–0:51 | Flat unrolled copy appears beside the model on the CPlane, joint curves perfectly mapped onto it | Enter, and the flattened surface lands on the construction plane, every marked curve in its true flat position. |
| 0:51–1:03 | Labels option shown ticked; matching number tags appear on the 3D surface and its flat twin | Turn on Labels and Rhino tags each edge on both copies, so the workshop knows exactly which seam meets which. |
| 1:03–1:15 | Command line shows Explode=No option; polysurface of several panels unrolls as one connected flat strip | Unroll a polysurface with Explode off and connected faces open out as one hinged strip — perfect for fold-up card models. |
| 1:15–1:25 | Flat templates arranged on a 1220×2440 sheet rectangle; dimension added; sent to Print | Sheet metal, veneers, curved cladding: unroll, nest on a sheet, dimension, issue. Mark it Got it, or watch again. |
| 1:25–1:30 | End card: UnrollSrf + "Try it now" | Try it now — unroll the cladding in the practice file. |

## 7. Squish — 1:15
**Command:** `Squish` · **Related:** UnrollSrf, Smash, FlattenSrf
**Demo geometry:** One doubly curved fabric canopy panel from a tensile roof, Perspective viewport, shaded with isocurves visible.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Squish + icon (0.5s fade) | Squish. Flatten the surfaces UnrollSrf refuses to touch. |
| 0:05–0:15 | Orbit around the saddle-shaped canopy panel; UnrollSrf attempted; command line reports it cannot unroll | This canopy panel curves in two directions — try UnrollSrf and Rhino politely declines. Doubly curved needs Squish. |
| 0:15–0:27 | Cursor types `Squish`, picks the panel; command line options for material behaviour highlighted | Type Squish and pick the surface or mesh. The options ask how your material behaves — free to stretch, or compression only. |
| 0:27–0:39 | Flat squished panel appears on the CPlane beside the model | Enter, and the panel flattens by distributing controlled stretch and compression — a best-fit pattern, honest about its distortion. |
| 0:39–0:51 | SquishInfo run; false-colour map on the flat panel shows red stretch zones and blue compression | And it will report that distortion: a coloured map shows where the fabric must stretch and by how much. |
| 0:51–1:03 | Flat pattern overlaid with seam allowances; row of cut fabric panels in a workshop photo | That honesty is why it patterns tensile roofs, upholstery and stretch ceilings — the maker knows exactly what they're absorbing. |
| 1:03–1:10 | 3D canopy and flat pattern side by side, distortion map still glowing | Doubly curved to flat, with a distortion receipt. Mark it Got it, or watch again. |
| 1:10–1:15 | End card: Squish + "Try it now" | Try it now — squish the canopy panel in the practice file. |

## 8. FlattenSrf — 1:15
**Command:** `FlattenSrf` · **Related:** ApplyCrv, ApplyMesh, UnrollSrf, Smash, Squish
**Demo geometry:** A trimmed, doubly curved facade panel with a circular perforation trim, Perspective viewport, shaded.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: FlattenSrf + icon (0.5s fade) | FlattenSrf. A flat drawing board for your curved surface. |
| 0:05–0:15 | Finished curved facade with an engraved pattern flowing undistorted across it; camera pulls back | This engraving pattern flows perfectly across a curved panel. It was drawn flat — here's the round trip. |
| 0:15–0:27 | Cursor types `FlattenSrf`, picks the trimmed panel; flat copy appears beside it, trim circle included | Type FlattenSrf and pick the surface. You get a planar version built from its untrimmed UV structure — trims and all. |
| 0:27–0:39 | Zoom onto the flat copy: the circular perforation sits in place on the flat sheet | Notice the perforation came along, still in position. This is the surface's UV space laid out as a drawing board. |
| 0:39–0:51 | Pattern curves drawn across the flat copy using ordinary 2D tools; snapping to the trim circle | Now design flat: draw your pattern with ordinary curve tools, dimensioned and snapped, no wrestling with 3D. |
| 0:51–1:03 | ApplyCrv run; the pattern leaps from the flat copy onto the curved panel, following its curvature | Then ApplyCrv — or ApplyMesh — sends the artwork back onto the curved original, mapped through the same UV space. |
| 1:03–1:10 | Full facade with the applied pattern; flat template inset in corner | Flatten, design, rewrap: the workflow behind decorated curved facades. Mark it Got it, or watch again. |
| 1:10–1:15 | End card: FlattenSrf + "Try it now" | Try it now — flatten the panel in the practice file. |

## 9. OffsetMesh — 1:00
**Command:** `OffsetMesh` · **Related:** OffsetSrf, Shell, MeshRepair
**Demo geometry:** The repaired chair mesh — an open, zero-thickness shell — Perspective viewport, shaded, backfaces coloured red to show it's single-skin.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: OffsetMesh + icon (0.5s fade) | OffsetMesh. Give paper-thin meshes real, printable thickness. |
| 0:05–0:14 | Slicer window rejects the chair shell with a "not watertight" warning; back in Rhino, red backfaces visible | This scanned shell looks solid but has zero thickness — every slicer will reject it. It needs walls. |
| 0:14–0:26 | Cursor types `OffsetMesh`, selects the chair; command line shows Distance and Solidify options; distance typed | Type OffsetMesh, select the mesh, and set a distance — that's your wall thickness, measured along the face normals. |
| 0:26–0:38 | Solidify=Yes clicked; offset skin appears; section clip shows two skins joined at the rim into a closed band | The key option is Solidify. It stitches original and offset together at the open edges — one closed, watertight solid. |
| 0:38–0:48 | Check reports a valid closed mesh; the thickened chair loads cleanly in the slicer | Check confirms it's closed, and the slicer accepts it. This is Shell's mesh-world cousin. |
| 0:48–0:55 | Row of thickened scan fragments beside their printed counterparts | Standard prep for printing scans and exported single skins. Mark it Got it, or watch again. |
| 0:55–1:00 | End card: OffsetMesh + "Try it now" | Try it now — thicken the shell in the practice file. |
