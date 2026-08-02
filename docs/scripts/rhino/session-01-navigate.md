# Session 1 — Navigate the viewport · Recording scripts
Setup: open `demo-house-site.3dm` — a small gabled house on a sloping site with a few context trees and a boundary fence; Shaded display mode; classic 4-view layout with Perspective active; osnaps End and Mid on; Gumball off.

## 1. Zoom — 0:50
**Command:** `Zoom` (aliases `ZE`, `ZEA`, `ZS`, `ZSA`) · **Related:** Pan, UndoView, MaxViewport, RotateView
**Demo geometry:** the full house-and-site model visible in Perspective, camera pulled back so the model looks small.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Zoom + icon (0.5s fade). Cut to the model tiny in the frame. | Zoom controls how close you are — window, extents, or a selection. |
| 0:05–0:15 | Type `Zoom` on the command line; prompt shows options. Click Window, drag a box around the front door; view jumps in tight. | Type Zoom and pick Window. Drag a box around the front door, and the view frames exactly that. |
| 0:15–0:27 | Keystroke overlay: type `ZE`, Enter. View snaps to the whole model. Then overlay `ZS` with the roof selected; view frames just the roof. | Faster: the alias Z-E zooms extents — the whole model fills the view. Select the roof, type Z-S, and you frame just that selection. |
| 0:27–0:38 | Overlay `ZEA`, Enter — all four viewports snap to extents together. Scroll-wheel zoom shown briefly for contrast. | Z-E-A does extents in every viewport at once. The scroll wheel is fine for rough moves — the aliases are for framing precisely. |
| 0:38–0:50 | Cursor idles over a neatly framed model; end card fades in. End card: Zoom + "Try it now" (app practice nudge). | Lost in a big site model? Z-E brings you straight home. Make those two letters a reflex — mark it Got it, or watch again. |

## 2. Pan — 0:35
**Command:** `Pan` · **Related:** Zoom, RotateView, NextViewport
**Demo geometry:** Top viewport maximised, zoomed into one corner of the site plan so most of it is off screen.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Pan + icon (0.5s fade). Cut to a plan cropped at the frame edge. | Pan slides the view sideways — same zoom, same angle. |
| 0:05–0:15 | Type `Pan`, Enter; cursor becomes a hand. Drag right to left; the site boundary glides into view. Esc to finish. | Type Pan, then drag. The model slides under your cursor until the bit you need is on screen. Escape ends it. |
| 0:15–0:25 | Right-mouse drag in the Top view does the same slide; brief cut to Perspective, Shift-plus-right-drag panning there. | Everyday shortcut: in a parallel view just right-drag. In Perspective, hold Shift while you right-drag to pan. |
| 0:25–0:35 | Cursor pans smoothly along the fence line, tracing it across the plan. End card: Pan + "Try it now" (app practice nudge). | Perfect for walking along a long façade or boundary at one scale. Mark it Got it, or watch again. |

## 3. RotateView — 0:40
**Command:** `RotateView` · **Related:** RotateCamera, Pan, Turntable, Zoom
**Demo geometry:** Perspective maximised, house centred, camera at eye level facing the front elevation.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: RotateView + icon (0.5s fade). Camera orbits smoothly around the house. | RotateView orbits the camera around whatever you're looking at. |
| 0:05–0:17 | Type `RotateView`, Enter. Drag left; camera swings around to the gable end. Drag up slightly for a higher vantage. Esc. | Type RotateView and drag. The camera circles the view target, so the building stays centred while you swing around it. |
| 0:17–0:28 | Right-mouse drag in Perspective orbits identically; arrow keys nudge the orbit in steps. Overlay highlights the right mouse button. | In Perspective, plain right-drag does the same orbit — and the arrow keys step it, handy for repeatable angles. |
| 0:28–0:40 | Slow orbit settles on a three-quarter hero view of the house. End card: RotateView + "Try it now" (app practice nudge). | Use it to check massing from every side before you commit to a form. Mark it Got it, or watch again. |

## 4. 4View — 0:35
**Command:** `4View` · **Related:** SetView, NewFloatingViewport, MaxViewport, Plan
**Demo geometry:** a messy viewport layout — Perspective stretched huge, Top squashed to a sliver, Front dragged off-centre.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: 4View + icon (0.5s fade). Cut to the mangled layout. | Viewports in a muddle? 4View resets the classic layout. |
| 0:05–0:15 | Type `4View`, Enter. Layout snaps back to equal Top, Front, Right and Perspective panes, model visible in each. | Type 4View, hit Enter, and you're back to Top, Front, Right and Perspective in four tidy quarters. |
| 0:15–0:25 | Type `4View` again, Enter; each viewport zooms extents as the layout refreshes. Cursor circles the restored Top view. | Run it a second time and it also sizes each view to your model — a full reset in two keystrokes. |
| 0:25–0:35 | Clean 4-view layout held; end card fades in. End card: 4View + "Try it now" (app practice nudge). | Whenever a borrowed file opens strangely, this is your first move. Mark it Got it, or watch again. |

## 5. Plan — 0:40
**Command:** `Plan` · **Related:** SetView, CPlane, 4View, Isometric
**Demo geometry:** Top viewport active but orbited off-axis, so the floor plan reads as a skewed 3D view.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Plan + icon (0.5s fade). The skewed "top" view fills the frame. | Plan points the view straight down at your construction plane. |
| 0:05–0:16 | Type `Plan`, Enter. The view snaps flat; walls become clean plan lines. Cursor traces the now-true room outlines. | Type Plan and Enter. The camera drops perpendicular to the CPlane, and your drawing reads as a true, undistorted plan again. |
| 0:16–0:28 | Cut to a viewport with a custom CPlane set on the sloped roof; `Plan`, Enter — the view looks square onto the roof surface. | It follows the current CPlane, not just world Top — set a plane on a roof slope and Plan looks square onto it. |
| 0:28–0:40 | Flat plan view with dimensions legible; end card fades in. End card: Plan + "Try it now" (app practice nudge). | After orbiting a 3D model, this gets you back to honest drafting instantly. Mark it Got it, or watch again. |

## 6. Isometric — 0:45
**Command:** `Isometric` · **Related:** Perspective, Plan, SetView, 4View
**Demo geometry:** Perspective view of the house showing obvious perspective convergence on the long elevation.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Isometric + icon (0.5s fade). A crisp axonometric of the house on screen. | Isometric gives you that classic architect's axonometric view. |
| 0:05–0:16 | Type `Isometric`, Enter. Prompt shows quadrant options: NE, NW, SE, SW. Click NE; view snaps to a parallel iso from the north-east. | Type Isometric. The prompt asks which quadrant — pick NorthEast, and the view snaps to a parallel projection from that corner. |
| 0:16–0:28 | Cycle the other options — SW, SE — view jumping corner to corner. Parallel edges stay parallel; overlay arrow highlights this. | Try the other quadrants to circle the scheme. Notice the edges stay parallel — no perspective distortion, so proportions read true. |
| 0:28–0:45 | Hold the SW iso; briefly toggle `Perspective` for contrast, then back. End card: Isometric + "Try it now" (app practice nudge). | It's the view for explanatory drawings — massing diagrams, exploded axos, planning studies. Screenshot straight from here. Mark it Got it, or watch again. |

## 7. MaxViewport — 0:35
**Command:** `MaxViewport` · **Related:** 4View, Zoom, NextViewport
**Demo geometry:** 4-view layout, Perspective active with the house framed.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: MaxViewport + icon (0.5s fade). Four small viewports on screen. | MaxViewport makes the active view full screen — and back. |
| 0:05–0:15 | Type `MaxViewport`, Enter. Perspective expands to fill the window. Type it again; the four-pane layout returns. | Type MaxViewport and the active view takes the whole window. Run it again and your layout comes straight back. |
| 0:15–0:25 | Cursor double-clicks the Top viewport's title tab; it maximises. Double-click the title again to restore. Overlay circles the title. | The everyday shortcut: double-click a viewport's title. Same toggle, one gesture — most people never type it. |
| 0:25–0:35 | Maximised Top view held for a beat; end card fades in. End card: MaxViewport + "Try it now" (app practice nudge). | Go big to draft a plan, small to check all sides. Mark it Got it, or watch again. |

## 8. NextViewport — 0:30
**Command:** `NextViewport` · **Related:** PrevViewport, NextViewportToTop, MaxViewport, 4View
**Demo geometry:** 4-view layout; Top active, its title highlighted.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: NextViewport + icon (0.5s fade). Four viewports, Top's title lit. | NextViewport hops your focus to the next view — no mouse. |
| 0:05–0:15 | Type `NextViewport`, Enter; Front's title lights up. Repeat twice — Right, then Perspective — highlight moving each time. | Type NextViewport and the active view steps on — Front, Right, Perspective — cycling round in order. |
| 0:15–0:22 | Keystroke overlay: Ctrl+Tab pressed twice; the highlight keeps cycling. | Ctrl-Tab does the same, so your hands never leave the keyboard. |
| 0:22–0:30 | Highlight lands back on Top; end card fades in. End card: NextViewport + "Try it now" (app practice nudge). | Pair it with maximised views for fast checks. Mark it Got it, or watch again. |

## 9. Shade — 0:40
**Command:** `Shade` · **Related:** SetDisplayMode, Render, SetObjectDisplayMode
**Demo geometry:** Perspective in Wireframe mode — the house reads as a tangle of edges.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Shade + icon (0.5s fade). Wireframe tangle on screen. | Shade gives you a quick shaded preview without leaving wireframe. |
| 0:05–0:16 | Type `Shade`, Enter. Surfaces fill in with shading; the massing suddenly reads. Cursor orbits gently — shading holds. | Type Shade and the model fills in, so you can actually judge the form. Orbit and it stays shaded. |
| 0:16–0:28 | Command line shows options DisplayMode and Drawing; click DisplayMode=Rendered for a materials preview. Start `Line` — shading drops back to wireframe. | The prompt offers modes — try Rendered for materials. The moment you start another command, you're back in clean wireframe. |
| 0:28–0:40 | Wireframe restored, cursor mid-draft on a wall line. End card: Shade + "Try it now" (app practice nudge). | Ideal when you draft in wireframe but need a sanity check on massing. Mark it Got it, or watch again. |

## 10. SetObjectDisplayMode — 1:10
**Command:** `SetObjectDisplayMode` · **Related:** DisplayProperties, Isolate, Shade, SetDisplayMode
**Demo geometry:** the house proposal plus three grey context buildings, all in Shaded mode, Perspective maximised.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:07 | Title card: SetObjectDisplayMode + icon (0.5s fade). Finished shot: proposal rendered, context ghost-wireframe around it. | This overrides display mode per object — rendered proposal, wireframe context, one viewport. |
| 0:07–0:18 | Back to everything Shaded. Drag-select the three context buildings; they highlight yellow. Type `SetObjectDisplayMode`, Enter. | Everything's currently shaded and the proposal drowns. Select the context buildings, then type SetObjectDisplayMode and press Enter. |
| 0:18–0:30 | Prompt reads "New display mode" with options: Wireframe, Shaded, Rendered, Ghosted, UseView. Click Wireframe; context turns to line-work while the house stays shaded. | The prompt lists modes. Click Wireframe, and just those objects drop to edges — your proposal keeps its shading and instantly pops. |
| 0:30–0:44 | Select the house; run the command again, choose Rendered. House shows materials. Orbit slowly — the mix holds in the viewport. | Now the reverse: select the house, run it again, pick Rendered. Orbit around — each object keeps its own mode, all in one view. |
| 0:44–0:57 | Select the context again, rerun, click UseView; buildings return to the viewport's mode. Overlay note: "override is per viewport". | To clear it, run the command once more and choose UseView. And remember — the override lives per viewport, so Top can stay pure wireframe. |
| 0:57–1:10 | Hero shot: rendered house, wireframe context, gentle orbit. End card: SetObjectDisplayMode + "Try it now" (app practice nudge). | This is the trick behind readable working views and those clean planning-study screenshots — proposal loud, context quiet. Mark it Got it, or watch again. |
