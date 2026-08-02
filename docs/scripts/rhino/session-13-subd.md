# Session 13 — SubD sculpting · Recording scripts
Setup for all ten videos: open `demo-subd.3dm` — an empty Perspective viewport in a smooth Shaded mode plus a finished SubD pavilion on a hidden layer for hooks; Tab flat/smooth toggle demonstrated once; osnaps Vertex + End on, Gumball enabled.

## 1. SubDBox — 0:55
**Command:** `SubDBox` · **Related:** Box, SubDSphere, ToSubD, InsertEdge
**Demo geometry:** Empty viewport; finished sculpted-pavilion SubD on hook layer, ready to show.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: SubDBox + icon (0.5s fade) | Every soft, sculpted form starts somewhere. Usually here. |
| 0:05–0:15 | Reveal hook layer: flowing SubD pavilion; dissolve back to the plain SubD box it grew from | This whole pavilion was pushed and pulled out of one object — a SubD box, the clay block of Rhino modelling. |
| 0:15–0:27 | Type `SubDBox`; click two corners and a height like a normal box; smooth rounded box appears | Type SubDBox and place it like any box — corner, corner, height. It lands smooth and rounded, because SubD averages its faces. |
| 0:27–0:39 | Restart command; set X=4 Y=2 Z=3 face counts on command line; denser box appears; press Tab to toggle flat | Before placing, set faces per side — four by two by three here. More faces, more sculpting control. Tab flips between smooth and flat views. |
| 0:39–0:48 | Turn on points; drag a few vertices to slump the box into a soft massing | Now drag its points and it deforms like dough — the seed for pods, pavilions and furniture in the videos ahead. |
| 0:48–0:55 | End card: SubDBox + "Try it now" | Place a SubD box and pull its points — mark it Got it, or watch again. |

## 2. SubDSphere — 0:50
**Command:** `SubDSphere` · **Related:** Sphere, SubDBox, ToSubD
**Demo geometry:** Empty viewport; sculpted pebble-shaped pod on hook layer.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: SubDSphere + icon (0.5s fade) | Need a boulder, a pod, a pebble? Start spherical. |
| 0:05–0:14 | Reveal hook: organic meeting-pod form; morph back to a plain SubD sphere | This meeting pod began life as a SubD sphere — a ball of editable quad faces, waiting to be squashed. |
| 0:14–0:26 | Type `SubDSphere`; click centre, drag radius; sphere appears; zoom to show all-quad structure | Type SubDSphere: centre, radius, done. Unlike a NURBS sphere it's built from quads, so it edits evenly with no pinched poles. |
| 0:26–0:36 | Show Subdivisions option; place a coarser and a finer sphere side by side; scale one flat with Gumball | The Subdivisions option sets how many faces you start with. Then squash it with Gumball and it stays perfectly smooth. |
| 0:36–0:44 | Landscape scene: SubD boulders and a soft seating pod scattered on a plaza | Boulders for landscape models, soft seating, canopy bubbles — anything round and organic starts here fastest. |
| 0:44–0:50 | End card: SubDSphere + "Try it now" | Place one and squash it — mark it Got it, or watch again. |

## 3. ToSubD — 1:05
**Command:** `ToSubD` · **Related:** ToNURBS, QuadRemesh, SubDBox
**Demo geometry:** A faceted box-massing polysurface and a simple quad mesh sitting side by side.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: ToSubD + icon (0.5s fade) | Your existing geometry can join the sculpting party. |
| 0:05–0:15 | Finished example: angular massing model shown converted to SubD and softened into a flowing form | This flowing form is the angular massing beside it — converted to SubD, then sculpted. ToSubD is the doorway between the two worlds. |
| 0:15–0:28 | Type `ToSubD`; select the box massing, Enter; it converts, edges now creased; Tab to show smooth toggle | Type ToSubD, select a mesh, extrusion or surface, Enter. The box converts with its edges creased — still sharp until you decide otherwise. |
| 0:28–0:40 | Convert the quad mesh; highlight InterpolatePoints and DeleteInput options on the command line | For meshes, the InterpolatePoints option chooses whether the SubD passes through the vertices or hugs inside them. DeleteInput tidies as you go. |
| 0:40–0:52 | Overlay tip: run QuadRemesh first on a triangulated scan mesh, then ToSubD; clean quads appear | One pro habit: triangulated meshes convert badly — run QuadRemesh first for clean quads, then convert. That's the SubD retopo route. |
| 0:52–1:00 | Sculpt session: converted massing pushed into soft canopy studies | Use it when a scheme starts orthogonal and needs to go organic — the geometry you have becomes clay. |
| 1:00–1:05 | End card: ToSubD + "Try it now" | Convert something and sculpt it — mark it Got it, or watch again. |

## 4. ToNURBS — 1:00
**Command:** `ToNURBS` · **Related:** ToSubD, MeshToNURB, Make2D
**Demo geometry:** The sculpted SubD pavilion, finished and ready to be documented.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: ToNURBS + icon (0.5s fade) | Sculpting done. Time to make it buildable. |
| 0:05–0:15 | Finished example: pavilion as NURBS polysurface being sectioned, trimmed and dimensioned | The sculpted pavilion, now a NURBS polysurface: sections cut through it, edges filleted, dimensions attached — documentation-grade geometry. |
| 0:15–0:27 | Type `ToNURBS`; select the SubD pavilion, Enter; conversion completes, Properties shows polysurface | Type ToNURBS, select the SubD, Enter. Every quad becomes a genuine NURBS patch, joined into one polysurface — visually identical, mathematically exact. |
| 0:27–0:39 | Zoom command line: DeleteInput and UnweldedEdges options; toggle and explain briefly | DeleteInput swaps the SubD out for the conversion. Keep the SubD on a reference layer instead — you'll want to sculpt again. |
| 0:39–0:51 | Workflow diagram overlay: SubD sculpt → ToNURBS → Contour/Make2D/fillets → drawings | This is the hand-over moment in every SubD project: sculpt free, convert once, then trim, intersect and draw like normal Rhino. |
| 0:51–1:00 | End card: ToNURBS + "Try it now" | Convert a SubD and cut a section — mark it Got it, or watch again. |

## 5. Crease — 0:55
**Command:** `Crease` · **Related:** RemoveCrease, Bevel, InsertEdge
**Demo geometry:** A soft SubD pavilion form with an intended sharp roofline, edges visible.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Crease + icon (0.5s fade) | Soft everywhere is a blob. Architecture needs edges. |
| 0:05–0:15 | Finished example: pavilion soft-bodied but with one knife-sharp roofline arris running its length | Same soft pavilion — but that roofline is now razor sharp while everything around it stays smooth. That single edge is a crease. |
| 0:15–0:27 | Type `Crease`; sub-object click the chain of roofline edges (Ctrl+Shift-click); press Enter; edge sharpens | Type Crease, then Control-Shift-click the edges to harden — pick the whole roofline chain — and Enter. The smoothing simply stops there. |
| 0:27–0:39 | Tab between flat and smooth showing crease holding; run `RemoveCrease` on one segment to soften it back | Tab confirms it holds in smooth mode. Changed your mind? RemoveCrease melts it soft again — creasing is fully reversible. |
| 0:39–0:48 | Montage: creased plinth line where pavilion meets ground, creased fold in a canopy | Ground lines, folded canopies, drip edges — creases are how sculpted buildings keep their architectural discipline. |
| 0:48–0:55 | End card: Crease + "Try it now" | Sharpen one edge on a SubD — mark it Got it, or watch again. |

## 6. InsertEdge — 1:00
**Command:** `InsertEdge` · **Related:** InsertPoint, Crease, Subdivide, Bevel
**Demo geometry:** A coarse SubD box massing whose corners are visibly too rounded, edges displayed.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: InsertEdge + icon (0.5s fade) | Control how tight a SubD corner reads — with loops. |
| 0:05–0:15 | Finished example: two identical forms, one with balloon-soft corners, one with firm near-square shoulders | Same box, two characters: soft and inflated on the left, firm and architectural on the right. The difference is extra edge loops. |
| 0:15–0:28 | Type `InsertEdge`; click an edge; loop previews around the box; slide near the corner, click to place | Type InsertEdge and click an edge — a whole loop previews around the form. Slide it close to the corner and click to commit. |
| 0:28–0:40 | Add a second loop the other side of the corner; corner visibly tightens in smooth view; Tab check | Loops near an edge pull the smoothing tight — two loops flanking a corner and it firms right up, without the harshness of a crease. |
| 0:40–0:52 | Insert a loop mid-face and drag its points to raise a ridge along a roof form | Loops also add local detail: insert one mid-roof and lift it into a ridge. More loops where the design happens, fewer where it doesn't. |
| 0:52–1:00 | End card: InsertEdge + "Try it now" | Tighten a corner with a loop — mark it Got it, or watch again. |

## 7. Bridge — 1:00
**Command:** `Bridge` · **Related:** Stitch, AppendFace, InsertEdge, MultiPipe
**Demo geometry:** Two separate SubD pod volumes floating a short distance apart, faces selectable.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Bridge + icon (0.5s fade) | Two volumes, one smooth connection. Build the bridge. |
| 0:05–0:15 | Finished example: the two pods joined by a flowing waisted tunnel, one continuous form | Two separate pods, now one continuous building — linked by a smooth tunnel that grew between them in a single command. |
| 0:15–0:28 | Type `Bridge`; Ctrl+Shift-click a face on pod one, Enter; matching face on pod two, Enter | Type Bridge. Control-Shift-click a face — or group of faces — on the first pod, Enter. Then the facing faces on the second. Enter. |
| 0:28–0:40 | Tunnel forms; adjust Segments=3 and Straightness slider in the command options; tunnel waists elegantly | The link appears live. Segments adds rings along the tunnel for shaping, and Straightness swings it from taut to fully relaxed. |
| 0:40–0:52 | Second demo: bridge two faces on the same pod to punch a smooth doughnut opening through it | Bridge faces on the same object and you tunnel straight through it — instant openings through sculpted forms, still watertight. |
| 0:52–1:00 | End card: Bridge + "Try it now" | Link two pods with a bridge — mark it Got it, or watch again. |

## 8. Stitch — 0:55
**Command:** `Stitch` · **Related:** Bridge, Weld, Join, Crease
**Demo geometry:** A SubD canopy sculpted in two halves with a narrow open seam running between them.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Stitch + icon (0.5s fade) | Mind the gap — then zip it shut with Stitch. |
| 0:05–0:15 | Finished example: canopy shown whole and seamless; ghost overlay of the old open seam | This canopy was sculpted as two halves. Now the seam is gone — the edges are zipped into one continuous, smooth skin. |
| 0:15–0:27 | Type `Stitch`; Ctrl+Shift-click the edge chain on one side, Enter; the facing chain, Enter | Type Stitch. Select the edges along one side of the gap — Enter — then the matching edges opposite. Enter again to zip. |
| 0:27–0:39 | Edges merge; show AlignTo option: Average, First, Second; repeat on a corner gap | The AlignTo option decides where they meet: average between the two, or hold one side still and pull the other across. |
| 0:39–0:48 | Overlay note: Bridge adds a tunnel of new faces; Stitch merges edges directly, no new geometry | Remember the difference: Bridge builds new faces between parts; Stitch welds edges together directly — the tool for closing gaps, not spanning them. |
| 0:48–0:55 | End card: Stitch + "Try it now" | Zip a seam closed — mark it Got it, or watch again. |

## 9. Bevel — 0:55
**Command:** `Bevel` · **Related:** Crease, InsertEdge, FilletEdge, ChamferEdge
**Demo geometry:** SubD furniture piece (soft bench) with one over-tight creased edge along its front.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Bevel + icon (0.5s fade) | Between razor-sharp and pillow-soft sits the bevel. |
| 0:05–0:15 | Finished example: bench front edge with a neat narrow band — firm but softly rounded, catching a highlight | This bench edge isn't creased and isn't soft — it's bevelled: a narrow strip of faces that reads as a controlled radius. |
| 0:15–0:27 | Type `Bevel`; Ctrl+Shift-click the front edge chain; press Enter; strip previews with a width handle | Type Bevel, select the SubD edges, Enter. The edge splits into a face strip — drag the handle or type an offset for its width. |
| 0:27–0:39 | Adjust Segments option from 1 to 2; edge softens into a rounder band; Enter to commit | Segments controls the roundness: one strip for a firm break, two or more for a fuller curve. It's the SubD fillet, effectively. |
| 0:39–0:48 | Compare trio on screen: creased edge, bevelled edge, untouched soft edge, labelled | Crease for knife lines, Bevel for touchable radii on furniture and handrails, plain SubD for everything soft — three tools, one language. |
| 0:48–0:55 | End card: Bevel + "Try it now" | Bevel an edge on a SubD — mark it Got it, or watch again. |

## 10. MultiPipe — 1:10
**Command:** `MultiPipe` · **Related:** Pipe, SubDCylinder, ToNURBS, Bridge
**Demo geometry:** A branching tree-column centreline network — lines meeting at multi-way nodes — in Perspective.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: MultiPipe + icon (0.5s fade) | Branching structure from a bundle of lines — automatically. |
| 0:05–0:15 | Finished example: elegant tree column, smooth SubD junctions where six members meet, rendered white | This tree column is one command's work. Every junction — even six members meeting — resolved into a clean, smooth node. |
| 0:15–0:28 | Type `MultiPipe`; window-select the whole centreline network; press Enter; pipes wrap the lines instantly | Type MultiPipe, select all the centrelines at once, Enter. Rhino wraps every line and welds every junction into one SubD. |
| 0:28–0:42 | Open options: set Radius `0.15`; show NodeSize and StrutSize sliders adjusting junction bulge live | Set the pipe radius in the options, then tune the junctions: NodeSize fattens or slims the joints, StrutSize handles the members between. |
| 0:42–0:54 | Click individual node to give it a larger local radius; result stays smooth and watertight | You can even vary radius per node — thicker where forces gather. The output stays a single watertight SubD. |
| 0:54–1:04 | Montage: gridshell node cluster, tubular stair balustrade frame, branching canopy structure | Tree columns, gridshell nodes, tubular furniture frames — anywhere old Pipe would choke on the junctions, MultiPipe just works. |
| 1:04–1:10 | End card: MultiPipe + "Try it now" | Pipe a branching network — mark it Got it, or watch again. |
