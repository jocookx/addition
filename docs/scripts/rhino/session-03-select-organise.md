# Session 3 — Select and organise · Recording scripts
Setup: open `demo-house-working.3dm` — the cottage model mid-project: walls and roof as surfaces/polysurfaces, plan linework and setting-out curves, a furniture set, and context buildings; Shaded display, Perspective active in 4-view; osnaps End and Mid on; Layers panel docked but collapsed.

## 1. SelAll — 0:35
**Command:** `SelAll` (shortcut `Ctrl+A`) · **Related:** SelNone, Invert, Export, SelCrv
**Demo geometry:** full working model on screen, nothing selected.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: SelAll + icon (0.5s fade). Whole model flashes to selected yellow. | SelAll grabs everything visible and unlocked in one hit. |
| 0:05–0:14 | Type `SelAll`, Enter; every object highlights. Status bar shows the object count. Keystroke overlay: Ctrl+A does the same. | Type SelAll — or just Control-A — and the whole model lights up, with the count in the status bar. |
| 0:14–0:24 | Cut: locked context buildings and a hidden furniture layer stay unselected; overlay label "skips locked + hidden". | Note what it skips: locked and hidden objects stay put — so lock your reference before sweeping. |
| 0:24–0:35 | Selected model dragged slightly then undone; Export dialog flashes briefly. End card: SelAll + "Try it now" (app practice nudge). | First step before whole-model moves, exports and purges. Mark it Got it, or watch again. |

## 2. SelNone — 0:30
**Command:** `SelNone` · **Related:** SelAll, Invert, SelCrv
**Demo geometry:** the whole model selected (carrying on from SelAll), highlight everywhere.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: SelNone + icon (0.5s fade). Fully selected model on screen. | SelNone drops the lot — a clean empty selection. |
| 0:05–0:13 | Type `SelNone`, Enter; all highlighting vanishes instantly. Status bar count clears. | Type SelNone and everything deselects at once — the opposite bookend to SelAll. |
| 0:13–0:22 | Esc key overlay pressed for comparison — same result; note "Esc usually does it; SelNone is explicit, scripts love it". | Escape usually does the same job — SelNone matters when Escape is busy, and inside macros and scripts. |
| 0:22–0:30 | Empty selection, cursor idle. End card: SelNone + "Try it now" (app practice nudge). | Start clean before a careful pick. Mark it Got it, or watch again. |

## 3. SelCrv — 0:40
**Command:** `SelCrv` · **Related:** SelSrf, SelPt, ChangeLayer, SelAll
**Demo geometry:** the model with plan linework and setting-out curves threaded through the 3D surfaces.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: SelCrv + icon (0.5s fade). Only the curves in the model flash selected. | SelCrv selects every curve in the model — nothing else. |
| 0:05–0:15 | Type `SelCrv`, Enter. All linework highlights; surfaces stay grey. Status bar: "42 curves added to selection". | Type SelCrv. All the linework lights up — setting-out, plan lines, stray edges — while surfaces stay untouched. |
| 0:15–0:27 | With curves selected, type `ChangeLayer`; pick "2D-linework" layer in the dialog; curves recolour. Layers panel flashes the target layer. | Now do something useful: ChangeLayer, pick the linework layer, and forty-two strays are filed in one move. |
| 0:27–0:40 | Clean model; overlay note: "whole SelSomething family — SelSrf, SelPt, SelDup...". End card: SelCrv + "Try it now" (app practice nudge). | It's one of a whole Sel family — the fastest way to clean a messy inherited model. Mark it Got it, or watch again. |

## 4. SelSrf — 0:45
**Command:** `SelSrf` · **Related:** SelPolysrf, SelCrv, SelAll
**Demo geometry:** the model where the roof is a joined polysurface but several wall faces were left as loose single surfaces.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: SelSrf + icon (0.5s fade). A few loose wall faces flash selected; the joined roof stays grey. | SelSrf finds every loose single surface — and only those. |
| 0:05–0:16 | Type `SelSrf`, Enter. Four stray faces highlight; the joined roof polysurface does not. Overlay label: "single surfaces only". | Type SelSrf. See the split: loose faces highlight, but the joined roof — a polysurface — is ignored. |
| 0:16–0:28 | With them selected, type `Join`; the walls fuse; status bar confirms. Rerun `SelSrf` — nothing selects. | That makes it a diagnostic. Join the strays, run SelSrf again — empty selection means the model is properly closed up. |
| 0:28–0:38 | Type `SelPolysrf`; now the joined roof and walls highlight instead. | Its sibling SelPolysrf grabs the joined stuff — between them you can audit any model. |
| 0:38–0:45 | Clean shaded model. End card: SelSrf + "Try it now" (app practice nudge). | Run it before every export. Mark it Got it, or watch again. |

## 5. Layer — 1:30
**Command:** `Layer` · **Related:** ChangeLayer, OneLayerOn, LayerStateManager, SelLayer
**Demo geometry:** the model with a deliberately flat, badly named layer list ("Layer 01", "Layer 02"...); hook shows the finished structured panel.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:07 | Title card: Layer + icon (0.5s fade). Finished layers panel: tidy tree — Site, Structure, Envelope, Interiors — colour-coded. | Layers are how a Rhino model stays sane — and this panel runs them all. |
| 0:07–0:18 | Type `Layer`, Enter; panel opens showing the messy flat list. Cursor points at the current-layer tick and the lightbulb/padlock columns. | Type Layer to open the panel. Each row has a colour, a lightbulb for visibility, a padlock — and one layer holds the tick as current. |
| 0:18–0:32 | Click New Layer icon; type `Envelope`. Click its colour swatch; pick a blue in the colour dialog. Double-click "Layer 03", rename to `Structure`. | Make a new layer, name it Envelope, click the swatch and give it a colour. Double-click old names to rename them — names are documentation. |
| 0:32–0:47 | Drag the "Windows" layer onto Envelope — it nests as a sublayer, indented. Add "Walls" sublayer the same way. Collapse and expand the parent arrow. | Now structure: drag Windows onto Envelope and it nests as a sublayer. Parents collapse whole systems — one click hides the entire envelope tree. |
| 0:47–1:02 | Select roof surfaces in the viewport; right-click the Envelope layer, choose "Change Object Layer". Roof recolours blue. Then click the lightbulb off/on. | To file geometry, select it, right-click the target layer, Change Object Layer. Test with the lightbulb — the roof blinks with its new home. |
| 1:02–1:16 | Right-click a layer: menu shows Select Objects, One Layer On, Lock. Click "Select Objects" — everything on Structure highlights. | The right-click menu is the power-user bit — select everything on a layer, isolate one layer, lock the lot. |
| 1:16–1:30 | Finished tidy tree; quick cut of the model with Interiors off, Envelope ghosted. End card: Layer + "Try it now" (app practice nudge). | Structure by building system — site, structure, envelope, interiors — and every drawing, export and consultant issue gets easier. Mark it Got it, or watch again. |

## 6. Group — 0:45
**Command:** `Group` (shortcut `Ctrl+G`) · **Related:** Ungroup, AddToGroup, Block, SelAll
**Demo geometry:** a furniture set — table plus six chairs — placed in the cottage's dining room, all separate objects.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Group + icon (0.5s fade). One click on a chair selects the whole dining set. | Group makes many objects pick as one. |
| 0:05–0:16 | Window-select table and chairs — seven objects highlight. Keystroke overlay: Ctrl+G. Status bar: "1 group". Click empty space, then click one chair: whole set selects. | Select the table and chairs, press Control-G. Done — now one click grabs the entire set for moving or copying. |
| 0:16–0:28 | Drag the grouped set to another room in one move. Then Ctrl-Shift-click one chair — it sub-selects alone and can be nudged. | Drag it around as a unit. Need just one chair? Control-Shift-click reaches inside the group without breaking it. |
| 0:28–0:38 | Overlay note: "Group = loose bundle · Block = repeated component". Copy the group twice into other rooms. | Groups are light-touch — for repeated coordinated components across a project, that's a Block instead. |
| 0:38–0:45 | Three dining sets placed. End card: Group + "Try it now" (app practice nudge). | Furniture sets, trees with pots, door-plus-frame. Mark it Got it, or watch again. |

## 7. Ungroup — 0:35
**Command:** `Ungroup` · **Related:** Group, Explode, SelNone
**Demo geometry:** the grouped dining set from the previous video, selected.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Ungroup + icon (0.5s fade). Grouped set selected as one. | Ungroup dissolves a group back into free objects. |
| 0:05–0:15 | Type `Ungroup`, Enter. Status bar: "1 group ungrouped". Click empty space; click a chair — only that chair selects now. | Select the group, type Ungroup. Now each chair selects alone again — the bundle is gone, the geometry untouched. |
| 0:15–0:25 | Overlay note: "Ungroup ≠ Explode". A polysurface selected next to it; Ungroup does nothing to it. | Don't confuse it with Explode — Ungroup only unbinds groups; it never breaks joined geometry apart. |
| 0:25–0:35 | One chair moved independently. End card: Ungroup + "Try it now" (app practice nudge). | Regroup and ungroup freely as layouts evolve. Mark it Got it, or watch again. |

## 8. Hide — 0:40
**Command:** `Hide` · **Related:** Show, ShowSelected, Isolate, Lock
**Demo geometry:** the cottage with its roof on, interior invisible from above.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Hide + icon (0.5s fade). Roof vanishes; interior revealed from above. | Hide gets objects out of the way — without deleting anything. |
| 0:05–0:16 | Click the roof polysurface; type `Hide`, Enter. Roof disappears; camera tilts down into the exposed rooms. | Select the roof, type Hide, Enter. Gone from view, safe in the file — and suddenly you can work inside. |
| 0:16–0:28 | Hide two internal walls the same way; orbit through the open interior; edit a piece of furniture freely. | Keep going — hide whatever blocks you. Every click and window-select now reaches only what you can see. |
| 0:28–0:40 | Overlay note: "Show brings all back · Isolate = hide everything else". End card: Hide + "Try it now" (app practice nudge). | It's the everyday declutter for editing interiors and cores. Show reverses it — and Isolate flips the idea. Mark it Got it, or watch again. |

## 9. Show — 0:35
**Command:** `Show` · **Related:** Hide, ShowSelected, Unisolate
**Demo geometry:** the cottage with roof and two walls still hidden from the previous video.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Show + icon (0.5s fade). Gappy model — roof and walls missing. | Show brings every hidden object back at once. |
| 0:05–0:14 | Type `Show`, Enter. Roof and walls reappear together; model complete again. | Type Show, Enter. Everything you hid all session returns in one hit — the blanket undo for hiding. |
| 0:14–0:25 | Type `ShowSelected`, Enter — hidden objects appear ghosted with prompt "Select objects to show"; click just the roof; Enter. Only it returns. | Want it selective? ShowSelected reveals the hidden set as ghosts and lets you pick which ones come back. |
| 0:25–0:35 | Complete model, gentle orbit. End card: Show + "Try it now" (app practice nudge). | End every hiding spree with Show — nothing gets forgotten in a file. Mark it Got it, or watch again. |

## 10. Lock — 0:45
**Command:** `Lock` · **Related:** Unlock, UnlockSelected, Hide, Layer
**Demo geometry:** the cottage plus surveyed site boundary curves and context buildings — geometry that must not move.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Lock + icon (0.5s fade). Context shown greyed; a window-select sweeps over it and nothing highlights. | Lock keeps objects visible but untouchable. |
| 0:05–0:16 | Select boundary curves and context buildings; type `Lock`, Enter. They grey out. Click one — no selection; window-select across — still nothing. | Select the survey and context, type Lock. They turn grey — you can see them, snap near them, but never select them. |
| 0:16–0:28 | Start a `Line`; End osnap still flags a locked boundary corner and the line snaps to it. Overlay label: "locked = still snappable". | Crucially, osnaps still work — draw against the locked boundary all day without any risk of dragging it. |
| 0:28–0:38 | Type `Unlock`, Enter; everything returns to normal colour. Note overlay: "UnlockSelected for one at a time; padlock in Layers panel locks whole layers". | Unlock frees the lot; UnlockSelected is surgical. For whole systems, use the padlock on the layer instead. |
| 0:38–0:45 | Working shot: drafting over grey context. End card: Lock + "Try it now" (app practice nudge). | Lock the survey the moment it arrives. Mark it Got it, or watch again. |
