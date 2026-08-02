# Session 2 — Lines and shapes · Recording scripts
Setup: open `demo-plan-blank.3dm` — an empty file with a 1m grid visible, Top viewport maximised, Wireframe display; osnaps End, Mid, Cen and Int on; Ortho off unless a script says otherwise; keep a finished cottage plan on a locked reference layer to reveal for hooks.

## 1. Line — 0:45
**Command:** `Line` · **Related:** Polyline, Curve, Point
**Demo geometry:** empty Top view; reference plan revealed briefly for the hook, then hidden.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Line + icon (0.5s fade). Reveal the finished plan, setting-out lines highlighted red. | Line draws one straight segment — the atom of every drawing. |
| 0:05–0:16 | Hide the reference. Keystroke overlay: type `Line`, Enter. Prompt: "Start of line". Click a grid point; prompt: "End of line". Rubber-band follows the cursor. | Type Line. Rhino asks for a start — click one — then an end, and the line stretches live from your cursor. |
| 0:16–0:28 | Type `5` on the command line, Enter, hold Shift for Ortho; line locks horizontal at exactly 5 units. Second line snaps its End osnap to the first. | For precision, type the length — five — and hold Shift to lock the direction. Osnaps grab the endpoint for the next one. |
| 0:28–0:45 | Quick montage: three setting-out lines struck across the plan, gridline labels appearing. End card: Line + "Try it now" (app practice nudge). | Use it constantly for gridlines, setting-out and quick construction geometry — the checks behind every plan. Mark it Got it, or watch again. |

## 2. Polyline — 1:00
**Command:** `Polyline` · **Related:** Line, Rectangle, Polygon, Curve
**Demo geometry:** empty Top view with the grid; finished L-shaped cottage outline shown for the hook.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:06 | Title card: Polyline + icon (0.5s fade). Finished L-shaped plan outline glows as one selected object. | Polyline chains straight segments into a single curve — plan outlines in one go. |
| 0:06–0:18 | Keystroke overlay: type `Polyline`, Enter. Prompt: "Start of polyline". Click; prompt changes to "Next point". Click three corners of the L, Ortho on. | Type Polyline and click a start. Every click adds a corner, and the whole chain stays connected as you go. |
| 0:18–0:32 | Type `6`, Enter for an exact leg; command line shows Undo option — click it once, last corner disappears, continue clicking. | Type distances for exact legs — six metres here. Misclick? The Undo option on the prompt steps back one corner without quitting. |
| 0:32–0:45 | Cursor hovers the start point; command line shows Close option. Click Close; outline snaps shut. Click the outline — it highlights as one object. | To finish, click Close on the command line and it seals back to the start. Select it — one object, not six loose lines. |
| 0:45–1:00 | Side-by-side: closed polyline extruded into walls in Perspective. End card: Polyline + "Try it now" (app practice nudge). | This is how footprints, room outlines and site boundaries begin — and because it's closed, it extrudes straight into walls. Mark it Got it, or watch again. |

## 3. Rectangle — 1:00
**Command:** `Rectangle` · **Related:** Polygon, Polyline, Box, Circle
**Demo geometry:** empty Top view; hook shows a plan of four rectangular rooms plus a rounded-corner terrace.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:06 | Title card: Rectangle + icon (0.5s fade). Plan of rectangular rooms, one with rounded corners, briefly highlighted. | Rectangle draws a closed four-sided outline — the start of most footprints. |
| 0:06–0:18 | Keystroke overlay: type `Rectangle`, Enter. Prompt: "First corner of rectangle". Click; drag; prompt: "Other corner or length". Rectangle rubber-bands. | Type Rectangle, click the first corner, and drag — the opposite corner finishes it. Two clicks, one closed polyline. |
| 0:18–0:32 | Start again; after first corner type `8`, Enter, then `5`, Enter. An exact 8×5 rectangle appears. Overlay shows the typed numbers. | For a real room, type the sizes instead: eight, Enter, five, Enter — an exact eight-by-five bay, no guesswork. |
| 0:32–0:46 | Command line options highlighted: 3Point, Vertical, Center, Rounded. Click Center; place a rectangle about a gridline crossing. Then Rounded; corners preview with a radius drag. | The prompt hides variants — Center places it about a point, handy on grids, and Rounded builds the corner radii in as you draw. |
| 0:46–1:00 | Zoom out: rooms assembled from rectangles snapped edge to edge. End card: Rectangle + "Try it now" (app practice nudge). | Rooms, panels, table layouts — most orthogonal plans are rectangles snapped together. Master the typed sizes first. Mark it Got it, or watch again. |

## 4. Circle — 1:00
**Command:** `Circle` · **Related:** Circle3Pt, Ellipse, Arc, Polygon
**Demo geometry:** the cottage plan on screen with a structural grid; hook shows columns as circles at grid intersections.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:06 | Title card: Circle + icon (0.5s fade). Plan with a rhythm of circular columns highlighted at grid crossings. | Circle: centre, radius, done — columns, penetrations, construction geometry. |
| 0:06–0:18 | Keystroke overlay: type `Circle`, Enter. Prompt: "Center of circle". Int osnap flags a grid intersection; click. Prompt: "Radius". Circle rubber-bands. | Type Circle. It asks for a centre — the intersection osnap grabs the grid crossing — then a radius, previewed live. |
| 0:18–0:30 | Type `0.3`, Enter. A 300mm column lands. Repeat at the next intersection, same typed radius; two identical columns. | Type point-three and Enter for a three-hundred-millimetre column. Repeat along the grid — every one identical, every one centred. |
| 0:30–0:45 | Command line options highlighted: Diameter, 3Point, Tangent, Vertical, Deformable. Click Diameter, type `0.6`; same result. Then 3Point through three wall points. | Watch the options: Diameter takes the size engineers quote, and 3Point fits a circle through three known points — great for surveys. |
| 0:45–1:00 | Zoom out over the full column grid; one circle selected showing centre point osnap. End card: Circle + "Try it now" (app practice nudge). | Beyond columns, think rooflights, service risers, and setting-out arcs for curved walls. Centre plus radius covers nearly everything. Mark it Got it, or watch again. |

## 5. Arc — 1:10
**Command:** `Arc` · **Related:** Arc3Pt, Circle, ArcBlend, Fillet
**Demo geometry:** partial plan with a door opening in a wall and a curved bay window outline for the hook.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:06 | Title card: Arc + icon (0.5s fade). Finished plan: door swings and a curved bay highlighted. | Arc draws a piece of a circle — door swings, curved walls, bays. |
| 0:06–0:18 | Keystroke overlay: type `Arc`, Enter. Prompt: "Center of arc". Click the door hinge point; prompt: "Start of arc". End osnap grabs the door leaf tip. | Type Arc. Default is centre-start-angle: click the hinge as centre, then snap the start to the door leaf's tip. |
| 0:18–0:32 | Prompt: "End point or angle". Type `90`, Enter; a quarter-circle door swing appears. Overlay circles the typed 90. | Now the angle — type ninety, and you've a perfect quarter-circle swing. Typed angles beat eyeballing every time. |
| 0:32–0:47 | Command line options highlighted: StartPoint, Tangent, 3Pt shown via `Arc3Pt`. Draw the bay: click two wall ends and pull the bulge through a third point. | For the bay, three points is easier — start, end, then pull the bulge through. The Tangent option meets existing curves smoothly. |
| 0:47–1:00 | The bay arc joins the wall lines; osnap flags at each junction. Brief Perspective cut: bay extruded. | Snap the arc's ends to your wall lines and it joins cleanly later — that curve becomes a real bay in seconds. |
| 1:00–1:10 | Plan with swings and bay complete. End card: Arc + "Try it now" (app practice nudge). | Swing checks in plans, curved walls, vault profiles in section — arcs everywhere. Mark it Got it, or watch again. |

## 6. Ellipse — 0:50
**Command:** `Ellipse` · **Related:** Circle, Conic, Curve
**Demo geometry:** Top view with a rectangular courtyard drawn; hook shows an elliptical lawn fitted inside it.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Ellipse + icon (0.5s fade). Courtyard with a fitted elliptical lawn highlighted. | Ellipse: two axes instead of one radius — elegant, stretched circles. |
| 0:05–0:17 | Keystroke overlay: type `Ellipse`, Enter. Prompt: "Ellipse center". Mid osnap grabs the courtyard centre; click. Prompt: "End of first axis". Drag along the long side. | Type Ellipse, click the centre — mid-snap finds it — then set the first axis along the courtyard's length. |
| 0:17–0:30 | Type `9`, Enter, then for the second axis `5`, Enter. Ellipse lands fitted. Command line shows FromFoci and Corners options highlighted. | Type nine for the half-length, then five across. Or use Corners to fit an ellipse straight into a bounding rectangle. |
| 0:30–0:40 | Brief overlay comparing the ellipse to a squashed circle; note "true conic — offsets cleanly". | Unlike a scaled circle, this is a true ellipse — it offsets and dimensions predictably. |
| 0:40–0:50 | Zoom out: lawn, elliptical rooflight added over an atrium in Perspective. End card: Ellipse + "Try it now" (app practice nudge). | Lawns, rooflights, elliptical arches — anywhere a circle feels too static. Mark it Got it, or watch again. |

## 7. Polygon — 0:55
**Command:** `Polygon` · **Related:** Rectangle, Circle, Polyline
**Demo geometry:** site plan with a park; hook shows a hexagonal kiosk plan and an octagonal gazebo.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Polygon + icon (0.5s fade). Hexagonal kiosk plan highlighted in the park. | Polygon draws regular shapes — any number of equal sides. |
| 0:05–0:17 | Keystroke overlay: type `Polygon`, Enter. Command line shows "NumSides=..." — click it, type `6`, Enter. Prompt: "Center of polygon". Click in the park. | Type Polygon, click NumSides on the prompt and set six. Then click the centre, just like a circle. |
| 0:17–0:30 | Prompt: "Corner of polygon"; type `2.5`, Enter. Hexagon lands. Options Inscribed/Circumscribed highlighted; toggle and show the size difference against a faint circle. | Type the radius — two-and-a-half. Inscribed puts corners on that circle; Circumscribed puts the flats there. Pick whichever dimension you actually know. |
| 0:30–0:42 | Rerun with NumSides=8 and the Edge option: click two points along a path edge; octagon grows off that edge, aligned. | The Edge option is the sleeper: click along an existing path and the octagon builds itself square to it. |
| 0:42–0:55 | Park plan with kiosk and gazebo; brief extrude in Perspective. End card: Polygon + "Try it now" (app practice nudge). | Kiosks, gazebos, bolt patterns, faceted plan forms — set the sides once and it remembers. Mark it Got it, or watch again. |

## 8. Curve — 1:10
**Command:** `Curve` · **Related:** InterpCrv, Sketch, Rebuild
**Demo geometry:** Top view with a straight-edged riverside site boundary; hook shows a finished flowing façade curve with its control points on.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:06 | Title card: Curve + icon (0.5s fade). Finished façade curve with control polygon displayed, points glowing. | Curve draws free-form NURBS geometry — the tool for lines that flow. |
| 0:06–0:18 | Keystroke overlay: type `Curve`, Enter. Prompt: "Start of curve". Click; then click four more points in a loose S. The curve lags inside the clicks. | Type Curve and click. Notice the curve doesn't touch your clicks — each point pulls it, like weights on a spline. |
| 0:18–0:32 | Slow zoom on the control polygon as more points are placed; overlay label: "control points attract, not intersect". Enter to finish. | That pull is the point: fewer clicks, smoother curve. Press Enter to finish, and the flow stays clean end to end. |
| 0:32–0:47 | Select the curve; press F10 — control points appear. Drag one; the curve reshapes fluidly, no kinks. | Here's the payoff. F-ten shows the control points, and dragging one reshapes the whole run smoothly — endlessly editable. |
| 0:47–1:00 | Command line Degree option highlighted; note "Degree=3 for smooth". A degree-1 version drawn beside it looks faceted, for contrast. | Leave Degree at three for smooth work. And when the curve must hit exact points instead, that's InterpCrv — next up. |
| 1:00–1:10 | The façade curve swept into a wall in Perspective. End card: Curve + "Try it now" (app practice nudge). | Use it wherever flow beats precision — façade lines, landscape paths, furniture profiles. Mark it Got it, or watch again. |

## 9. InterpCrv — 1:00
**Command:** `InterpCrv` · **Related:** Curve, CurveThroughPt, Sketch
**Demo geometry:** a scanned site survey raster placed on a locked layer, contour dots visible; hook shows one contour already traced.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:06 | Title card: InterpCrv + icon (0.5s fade). Traced contour glowing over the scanned survey. | InterpCrv draws a smooth curve through your points — exactly through them. |
| 0:06–0:18 | Keystroke overlay: type `InterpCrv`, Enter. Prompt: "Start of curve". Click precisely on the first contour dot; keep clicking dot to dot; curve threads through each. | Type InterpCrv and click along the contour. Unlike Curve, this one passes dead through every click — perfect for tracing. |
| 0:18–0:32 | Continue around a tight bend, clicks closer together; curve stays smooth. Command line shows Undo and Close options; use Undo once. | Click tighter around bends for control, and use Undo on the prompt to step back without restarting. Close seals a loop. |
| 0:32–0:45 | Finish with Enter. Select it, F10: many more control points than a Curve of similar shape, overlay comparing the two. | Press Enter to end. Fair warning — interpolated curves carry more control points, so save them for when positions truly matter. |
| 0:45–1:00 | Zoom out: three contours traced; quick Patch preview hinting at a site model. End card: InterpCrv + "Try it now" (app practice nudge). | Tracing surveys, section profiles, existing façades — anywhere the curve must honour measured points. Mark it Got it, or watch again. |

## 10. Point — 0:45
**Command:** `Point` · **Related:** Points, Divide, Line
**Demo geometry:** cleared Top view; hook shows a site plan with surveyed setting-out points marked and labelled.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Point + icon (0.5s fade). Site plan scattered with labelled setting-out points. | Point drops a marker — a snappable position before any geometry exists. |
| 0:05–0:16 | Keystroke overlay: type `Point`, Enter. Prompt: "Location of point object". Type `12,8`, Enter. A point lands at those coordinates; zoom to it. | Type Point, then type the coordinates — twelve comma eight — and Enter. A survey position, placed exactly. |
| 0:16–0:28 | Draw a `Line`; the Point osnap flags the marker and the line starts precisely on it. Place two more points by clicking. | Now everything can snap to it. Start a line, and the point osnap grabs that exact spot — no hunting. |
| 0:28–0:45 | Grid of points placed; overlay note: "Points command = place many; Divide = points along a curve". End card: Point + "Try it now" (app practice nudge). | Drop points for grid intersections, borehole positions, tree centres — targets first, drawing second. Plural Points places a run of them. Mark it Got it, or watch again. |
