# Session 15 — Present & document · Recording scripts
Setup for all ten videos: open `demo-present-document.3dm` — a finished two-storey house model with furniture, on tidy layers, annotation style "A3-1to50" set current, one Layout page pre-made for later videos, Shaded mode in model space, osnaps End + Mid + Int on.

## 1. Make2D — 1:40
**Command:** `Make2D` · **Related:** Section, Silhouette, Layout, ClippingPlane
**Demo geometry:** The house model in a saved Perspective view; a finished Make2D elevation drawing parked on a hidden layer.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Make2D + icon (0.5s fade) | From model to line drawing — the bridge is Make2D. |
| 0:05–0:16 | Reveal hook layer: crisp hidden-line elevation of the house, dashed hidden lines, beside the 3D model | This elevation wasn't drawn — it was generated: visible lines, hidden lines dashed behind them, all traced from the model automatically. |
| 0:16–0:30 | Set up a Front view; type `Make2D`; select the whole house, Enter; dialogue opens | Set the viewport to the view you want flattened — a true Front for an elevation. Type Make2D, select the model, Enter. |
| 0:30–0:44 | Walk the dialogue: View projection ticked, Hidden lines ticked, Scene silhouette ticked, layers preview | The dialogue is the control room: projection from the current view, hidden lines on or off, and a silhouette outline to give the drawing weight. |
| 0:44–0:58 | Click OK; progress; flat linework lands at the world origin in Top view; zoom to it | Click OK and the drawing lands flat at the origin — a separate 2D object, completely detached from the model. |
| 0:58–1:12 | Open Layers panel: Make2D layer tree — visible, hidden, silhouette sub-layers; recolour hidden lines grey | Everything arrives pre-sorted onto its own layer tree — visible, hidden, silhouette — so lineweights and dashes take seconds to assign. |
| 1:12–1:26 | Combine with ClippingPlane: section view made 2D; then linework placed on a sheet with dimensions | Run it on a clipped section view and you've got true section linework — the raw material for every plan, section and elevation you'll issue. |
| 1:26–1:34 | Overlay caution: Make2D output is static — re-run after design changes; keep a tidy naming habit | One habit: the output doesn't update with the model. Re-run after changes, and date-stamp your drawing layers. |
| 1:34–1:40 | End card: Make2D + "Try it now" | Generate an elevation from the practice model — mark it Got it, or watch again. |

## 2. Layout — 1:45
**Command:** `Layout` · **Related:** Detail, Print, Make2D
**Demo geometry:** The house model open; a finished A3 sheet with title block and two details parked for the hook.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Layout + icon (0.5s fade) | Real drawings need paper. Layout is Rhino's paper space. |
| 0:05–0:16 | Show finished A3 sheet: title block, scaled plan viewport, 3D view, dimensions — then flip back to model space | Here's the destination: an A3 sheet, title block, a one-to-fifty plan and a 3D view — issued straight from Rhino, no export. |
| 0:16–0:30 | Type `Layout`; dialogue opens; name it "A3-01", set width 420, height 297, initial details 1 | Type Layout. Name the page, set the paper size — 420 by 297 for A3 — and choose how many detail viewports to start with. |
| 0:30–0:44 | New layout tab appears at screen bottom; white page with one detail viewport showing the model | A new tab appears beside your viewport tabs. This white page is paper: one millimetre here is one millimetre printed. |
| 0:44–0:58 | Double-click into the detail, orbit to a plan view; double-click outside to return to the page | Double-click inside a detail to reach through to the model; double-click the paper to come back. In and out — that's the rhythm. |
| 0:58–1:12 | Draw the title block directly on the page: rectangle, text fields, north point at true size | Draw title blocks, notes and borders directly on the page at real printed size — they belong to the sheet, not the model. |
| 1:12–1:26 | Right-click the layout tab: show duplicate layout, rename, and multiple pages for a drawing set | Right-click the tab to duplicate pages — one model, a whole numbered set: location plan, plans, sections, details. |
| 1:26–1:38 | Zoomed pair: model space chaos versus composed sheet; arrow labelled "same model, live" | The viewports stay live: change the design, and every sheet in the set shows the new state. That's drawing from the model, properly. |
| 1:38–1:45 | End card: Layout + "Try it now" | Make an A3 page for the house — mark it Got it, or watch again. |

## 3. Detail — 1:20
**Command:** `Detail` · **Related:** Layout, Print, NamedView, Make2D
**Demo geometry:** The pre-made A3 layout page open, title block drawn, one empty area of paper available.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Detail + icon (0.5s fade) | Details are the windows in your sheet. Cut them deliberately. |
| 0:05–0:16 | Finished example: sheet with plan at 1:50, stair blow-up at 1:20, perspective vignette, labelled scales | Three windows onto one model: a plan at one-to-fifty, a stair enlargement at one-to-twenty, and a loose perspective vignette. |
| 0:16–0:30 | On the layout, type `Detail`; drag a rectangle on the empty paper; new viewport appears with model inside | On a layout page, type Detail and drag a rectangle — a new viewport opens onto the model wherever you draw it. |
| 0:30–0:44 | Double-click in; set Top view; open Properties panel: scale field — type 1:50; view locks to scale | Activate it, set the view, then the crucial step: in Properties, set the scale — one-to-fifty — so the drawing measures true on paper. |
| 0:44–0:58 | Click Locked in Properties; pan attempt inside detail fails; padlock icon shown | Then lock it. A locked detail can't be nudged out of scale by a stray scroll — the difference between a diagram and a drawing. |
| 0:58–1:10 | Select detail edge; drag its boundary handles to crop; show per-detail layer visibility hiding furniture in the plan | The detail's edge crops the view — drag it like a picture frame. And layers can hide per detail: furniture off in plan, on in perspective. |
| 1:10–1:20 | End card: Detail + "Try it now" | Add a scaled, locked detail — mark it Got it, or watch again. |

## 4. Dim — 0:55
**Command:** `Dim` · **Related:** DimAligned, DimRotated, Leader, Text
**Demo geometry:** Ground-floor plan linework (from Make2D) in Top view, annotation style current.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Dim + icon (0.5s fade) | A drawing without dimensions is a picture. Fix that. |
| 0:05–0:15 | Finished example: plan with a tidy dimension chain across the front wall — openings, piers, overall | A proper dimension chain: every opening, every pier, one overall — the string that lets a builder set out this wall. |
| 0:15–0:27 | Type `Dim`; snap first point to a wall corner, second to the opening jamb; drag the line clear and click | Type Dim, snap to the first corner, snap to the second, then a third click places the dimension line clear of the wall. |
| 0:27–0:39 | Continue the chain along the wall; show it auto-locking horizontal; place one vertical dimension too | It reads horizontally or vertically from your two points automatically — chain along the wall, then drop verticals the same way. |
| 0:39–0:48 | Select a dimension: highlight annotation style in Properties; nudge model line, dimension value updates | Dimensions follow the current annotation style, and they're associative — stretch the wall and the figure updates itself. |
| 0:48–0:55 | End card: Dim + "Try it now" | Dimension a wall on the plan — mark it Got it, or watch again. |

## 5. DimAligned — 0:50
**Command:** `DimAligned` · **Related:** Dim, DimRotated, Leader
**Demo geometry:** The plan's splayed bay-window wall at 30 degrees, plus a stair flight in section on screen.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: DimAligned + icon (0.5s fade) | Sloped walls need dimensions that slope with them. |
| 0:05–0:14 | Split: horizontal Dim across the splayed wall reading short, versus aligned dimension reading true | An ordinary dimension across this splayed wall measures its shadow — the aligned one reads the wall's true length. |
| 0:14–0:26 | Type `DimAligned`; snap to both ends of the splayed wall; drag offset perpendicular to it; click to place | Type DimAligned, snap the two ends, and drag: the dimension runs parallel to the wall itself, offset square off its face. |
| 0:26–0:36 | Place aligned dimensions down the stair flight pitch line and along a raked roof edge in section | Stair pitch lines, raking eaves, anything angled in section — aligned dimensions give the measurement that matters on site. |
| 0:36–0:44 | Rule-of-thumb overlay: Dim for orthogonal strings, DimAligned for anything on the skew | Simple rule: orthogonal chains use Dim; the moment geometry skews, switch to DimAligned. |
| 0:44–0:50 | End card: DimAligned + "Try it now" | Dimension the splayed wall — mark it Got it, or watch again. |

## 6. Leader — 0:55
**Command:** `Leader` · **Related:** Text, Dim, RevCloud
**Demo geometry:** The dimensioned plan, zoomed to the kitchen area needing call-up notes.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Leader + icon (0.5s fade) | Point at the thing, name the thing. That's a leader. |
| 0:05–0:15 | Finished example: three neat leaders — "SVP boxed out", "worktop over", "extract duct" — arrows on target | Notes that point: an arrow on the object, a short line, and the call-up text sitting clear of the linework. |
| 0:15–0:27 | Type `Leader`; click arrow point on the soil pipe; click a bend point; click text position; Enter | Type Leader. First click plants the arrowhead on the object; further clicks bend the line clear; Enter when it's positioned. |
| 0:27–0:39 | Type "SVP boxed out"; Enter; leader completes; drag its grip points to tidy the elbow | Type the note and Enter. Every part stays editable — drag the grips to re-route the elbow as the drawing fills up. |
| 0:39–0:48 | Zoom out: plan peppered with consistent leaders, all matching the annotation style | Arrowheads, text height and font all obey the annotation style — so fifty call-ups across a package still read as one hand. |
| 0:48–0:55 | End card: Leader + "Try it now" | Call up something on the plan — mark it Got it, or watch again. |

## 7. Text — 0:50
**Command:** `Text` · **Related:** Leader, TextObject, Dim
**Demo geometry:** The A3 layout sheet, title block awaiting a drawing title; plan awaiting room names.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Text + icon (0.5s fade) | Titles, labels, notes — words carry half the drawing. |
| 0:05–0:14 | Finished example: sheet with drawing title in the block, room names across the plan, general notes column | Room names on the plan, a title in the block, a notes column down the edge — all placed with one command. |
| 0:14–0:26 | Type `Text`; click a point in the title block; editor opens; type "GROUND FLOOR PLAN 1:50"; set height; OK | Type Text, click where it goes, and the editor opens — type your title, set the height, choose the style, OK. |
| 0:26–0:36 | Double-click existing text to re-edit; change annotation style; all styled text updates together | Double-click any text to edit it later. Better: keep everything on annotation styles, and one style tweak restyles the whole set. |
| 0:36–0:44 | Overlay note: Text stays screen-legible annotation; TextObject makes curve geometry for signage | Know the sibling: Text is annotation for drawings; TextObject creates real curves — that one's for modelled signage. |
| 0:44–0:50 | End card: Text + "Try it now" | Label the plan's rooms — mark it Got it, or watch again. |

## 8. Hatch — 1:00
**Command:** `Hatch` · **Related:** PlanarSrf, Make2D, CurveBoolean, Section
**Demo geometry:** Section linework through the house (closed wall and slab profiles) in Top view of the drawing layer.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Hatch + icon (0.5s fade) | Poché is what makes a section read as cut. |
| 0:05–0:15 | Finished example: section with solid-hatched cut walls, brick pattern on masonry, insulation zigzag in the cavity | Solid black where the blade cuts, brick coursing in the masonry, that zigzag in the cavity — hatching turns lines into construction. |
| 0:15–0:28 | Type `Hatch`; select the closed wall profiles, Enter; dialogue: pattern list, scale, rotation, live preview | Type Hatch and select closed boundaries — Enter. The dialogue offers the pattern library, with scale and rotation previewed live. |
| 0:28–0:40 | Choose Solid for cut walls, OK; re-run with a brick pattern at a sensible scale for the masonry leaf | Solid for primary cut elements; patterns for materials. Tune the scale until it reads at your print size — not on screen. |
| 0:40–0:52 | Click inside an unclosed region: boundary mode traces it; overlay tip: CurveBoolean fixes leaky outlines | You can also click inside a region and Rhino finds the boundary. If it leaks, close the linework — CurveBoolean from session eleven is the fixer. |
| 0:52–1:00 | End card: Hatch + "Try it now" | Poché the practice section — mark it Got it, or watch again. |

## 9. Print — 1:10
**Command:** `Print` (`Ctrl+P`) · **Related:** Layout, Detail, ViewCaptureToFile
**Demo geometry:** The completed A3 layout sheet, dimensioned, hatched and titled, active on screen.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Print + icon (0.5s fade) | The last command a drawing meets before the world sees it. |
| 0:05–0:15 | Finished example: crisp issued PDF of the A3 sheet in a viewer — true lineweights, dashed hidden lines | This is the deliverable: a vector PDF, lineweights true, text sharp at any zoom — issued straight from the layout. |
| 0:15–0:28 | Press Ctrl+P; print dialogue opens; choose PDF as destination; set A3, landscape; preview pane updates | Control-P opens the print panel. Destination: PDF. Size: A3 landscape to match the page. The preview updates as you set each choice. |
| 0:28–0:42 | View and Output: select the layout, scale locked at 1:1; note details carry their own scales | Printing a layout, keep the scale at one-to-one — the paper is already real size, and each detail carries its own drawing scale within it. |
| 0:42–0:54 | Open lineweight and colour settings: Display colour versus Print colour; vector versus raster toggle | Choose print colour for ink-on-white output, and vector for crisp scalable lines — raster only when a display mode demands it. |
| 0:54–1:04 | Click Print; PDF opens; zoom deep into a dimension — still sharp; file saved beside the model | Print, and the sheet becomes the file you issue — consistent every time because the settings live with the layout. |
| 1:04–1:10 | End card: Print + "Try it now" | Print the practice sheet to PDF — mark it Got it, or watch again. |

## 10. ClippingPlane — 1:10
**Command:** `ClippingPlane` · **Related:** Section, CutPlane, Make2D, SectionStyles
**Demo geometry:** The full house model in Perspective, camera outside the front elevation.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: ClippingPlane + icon (0.5s fade) | Cut the building open — live, and without harming it. |
| 0:05–0:15 | Finished example: house sliced open in 3D, interior fully visible, solid poché at the cut faces | A living sectional perspective: walls cut, rooms revealed, the cut faces filled solid — and the model itself is untouched. |
| 0:15–0:28 | Type `ClippingPlane`; in Top view drag a rectangle across the house; Perspective instantly clips | Type ClippingPlane and drag a rectangle through the building in plan. The moment it lands, the perspective view clips at that plane. |
| 0:28–0:40 | Select the plane; drag it with Gumball through the house — rooms sweep past live; rotate it for a stepped angle | It's an object: drag it and the section sweeps through the building live — the fastest way ever to explore a plan in 3D. |
| 0:40–0:52 | Properties panel: tick which viewports it clips; flip direction arrow; SectionStyles fills the cut solid | In Properties, choose which viewports it cuts and flip its direction. Section styles hatch and fill the cut for that proper poché look. |
| 0:52–1:02 | Combine: clipped perspective viewport placed as a detail on the layout sheet; Make2D of the clipped view | Drop a clipped view into a layout detail for a sectional perspective sheet — or Make2D it for true cut linework. |
| 1:02–1:10 | End card: ClippingPlane + "Try it now" | Slice the practice house live — mark it Got it, or watch again. |
