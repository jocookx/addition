# Session 18 — Blocks & reference · Recording scripts
Setup for the whole session: open `demo-18-housing.3dm` — a six-unit terraced housing scheme with repeated windows and furniture, plus a `consultants/` folder of DWG, SKP and 3dm files on the desktop — Shaded display, osnaps End and Mid on, Layers panel docked.

## 1. Block — 1:30
**Command:** `Block` · **Related:** Insert, BlockManager, BlockEdit, Group
**Demo geometry:** One fully modelled window assembly (frame, glazing, cill) at the origin end of the terrace, plus five bare openings awaiting windows.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Block + icon (0.5s fade) | Block. Model it once, place it everywhere, edit it everywhere. |
| 0:05–0:15 | Camera sweeps the terrace: thirty identical windows; one window's frame profile edited; all thirty change at once | Thirty windows on this terrace. Watch — edit one, and all thirty update together. That's block thinking. |
| 0:15–0:27 | Window assembly selected; cursor types `Block`; base point picked at the cill's outside corner with osnap | Select the window geometry and type Block. First it wants a base point — pick somewhere meaningful, like the cill corner you'll place from. |
| 0:27–0:39 | Naming dialog appears; "Window_Type_A_1200x1450" typed; description field filled; OK clicked | Then name it properly — type and size, not "block01". Future you, and everyone else in the file, will be grateful. |
| 0:39–0:51 | The window is now one selectable instance; dragged copies snap into the five bare openings | The geometry becomes a block instance — one lightweight object. Copy it into every opening; each copy just points at the definition. |
| 0:51–1:03 | Properties panel shows tiny file size change; caption compares "30 copies: 60 MB" vs "30 instances: 2 MB" | Because instances share one definition, the file barely grows. Thirty exploded copies would cost megabytes; thirty instances cost almost nothing. |
| 1:03–1:15 | BlockEdit double-click on one instance; a glazing bar added; exit; every window on the terrace gains the bar | Double-click any instance to edit the definition in place. Add a glazing bar, close the editor — the whole terrace updates. |
| 1:15–1:25 | Zoom out across the scheme: windows, doors and bathroom pods all shown as tinted block instances | Windows, doors, bathroom pods, whole repeated flats — block anything you'll place more than twice. Mark it Got it, or watch again. |
| 1:25–1:30 | End card: Block + "Try it now" | Try it now — block the window in the practice file. |

## 2. Insert — 1:15
**Command:** `Insert` · **Related:** Block, BlockManager, Import, Worksession
**Demo geometry:** The terrace with its Window_Type_A block defined; an empty plot at the end; the consultants folder visible in a file browser.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Insert + icon (0.5s fade) | Insert. Place blocks — from this file, or any other. |
| 0:05–0:15 | A furnished flat interior; camera pulls back revealing every chair and table is a placed block instance | Every chair, table and sanitaryware item in this flat was placed with Insert — none of it modelled here. |
| 0:15–0:27 | Cursor types `Insert`; dialog opens listing the file's block definitions with thumbnails; Window_Type_A picked | Type Insert. The dialog lists every block already defined in the file — pick one, like our window type. |
| 0:27–0:39 | Insertion point, scale and rotation fields shown; OK; the window drops onto the cursor and snaps to an opening | Set insertion point, scale and rotation — or leave them prompted — and the block rides your cursor to snap into place. |
| 0:39–0:51 | File button clicked; browser selects a chair.3dm from the consultants folder; Link option radio highlighted | The real power: browse to an external file. Choose Embed, or Link — linked blocks update whenever the source file is resaved. |
| 0:51–1:03 | The linked chair placed around a table; source file edited off-screen; chairs refresh with the new arm design | Link a manufacturer's chair model once, place it fifty times, and a product update refreshes every instance. |
| 1:03–1:10 | Furnished scheme; Properties panel showing a linked block's source path | This is component-based modelling — the way big schemes stay light. Mark it Got it, or watch again. |
| 1:10–1:15 | End card: Insert + "Try it now" | Try it now — insert a block in the practice file. |

## 3. BlockManager — 1:15
**Command:** `BlockManager` · **Related:** Block, Insert, BlockEdit, Purge
**Demo geometry:** The fully furnished scheme, dozens of block definitions in use, at least one linked block whose source has changed.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: BlockManager + icon (0.5s fade) | BlockManager. Mission control for every component in the file. |
| 0:05–0:15 | Wide shot of the furnished scheme; caption: "47 block definitions — which are stale? which are unused?" | A component-based model lives or dies by housekeeping. Which blocks are stale? Which are dead weight? |
| 0:15–0:27 | Cursor types `BlockManager`; panel opens listing definitions with instance counts and link status columns | Type BlockManager. Every definition is listed with its instance count and, for linked blocks, the file it points to. |
| 0:27–0:39 | A linked block flagged as changed; Update button clicked; chairs across the scheme refresh visibly | Linked files that changed since opening are flagged — one click on Update pulls the new version through the model. |
| 0:39–0:51 | A definition with zero instances selected; Delete clicked; count column re-sorted to check for other zeros | Definitions with zero instances are pure bloat. Delete them here, or let Purge sweep them later. |
| 0:51–1:03 | Properties button opens a definition; name corrected; Export button shown saving a definition to its own file | You can also rename definitions, count what's placed where, and export a definition out as its own file. |
| 1:03–1:10 | Tidy manager list, all links green, no zero counts | Open it weekly on any block-heavy project. Mark it Got it, or watch again. |
| 1:10–1:15 | End card: BlockManager + "Try it now" | Try it now — audit the blocks in the practice file. |

## 4. ExplodeBlock — 0:45
**Command:** `ExplodeBlock` · **Related:** Explode, Block, BlockEdit, CreateUniqueBlock
**Demo geometry:** One window block instance on the terrace that needs a one-off modification, nested block (ironmongery) inside it.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: ExplodeBlock + icon (0.5s fade) | ExplodeBlock. Break the link — deliberately. |
| 0:05–0:13 | One corner window needs a unique angled cill; BlockEdit would change all thirty; cursor hovers, hesitates | This corner window needs a one-off cill. Editing the definition would change all thirty — we need to set this one free. |
| 0:13–0:24 | Cursor types `ExplodeBlock` on the instance; it bursts into plain geometry, nested ironmongery blocks bursting too | Type ExplodeBlock on the instance. It becomes ordinary geometry — and unlike Explode, it bursts nested blocks in one go. |
| 0:24–0:34 | The freed geometry edited into the angled cill; the other windows unaffected; caption: "link lost — on purpose" | Now edit freely. But know the trade: you've gained editability and lost the link that kept instances coordinated. |
| 0:34–0:40 | Side note: CreateUniqueBlock shown as the alternative for keeping it as a new block | Often CreateUniqueBlock is the smarter halfway house. Mark it Got it, or watch again. |
| 0:40–0:45 | End card: ExplodeBlock + "Try it now" | Try it now — free an instance in the practice file. |

## 5. Worksession — 1:45
**Command:** `Worksession` · **Related:** Insert, Import, BlockManager
**Demo geometry:** Your active file contains only the terrace; the site survey, landscape and structure exist as separate 3dm files in the project folder.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Worksession + icon (0.5s fade) | Worksession. One big project, many files, one coherent model. |
| 0:05–0:15 | Full masterplan view: terrace, landscape, structure, survey all visible; layer panel shows them from four different files | This looks like one model. It's four files — four people working in parallel — assembled live around this one. |
| 0:15–0:27 | Cursor types `Worksession`; manager dialog opens; Attach button clicked; site-survey.3dm selected from the project folder | Type Worksession and click Attach. Browse to the survey file, and it appears around your geometry — visible, snappable, read-only. |
| 0:27–0:39 | Landscape and structure files attached the same way; each listed in the manager with its path | Attach the landscape and structure files too. You can snap to every consultant's geometry, but you can't accidentally move it. |
| 0:39–0:51 | Modelling continues on the terrace, osnapping to the attached survey's boundary line | That's the beauty: full precision against reference geometry, zero risk of editing someone else's work. |
| 0:51–1:03 | The structure file resaved off-screen; Refresh clicked in the manager; new steelwork appears in the view | When a teammate saves their file, hit Refresh and their changes flow in. No emailing models around. |
| 1:03–1:15 | Active document swapped in the manager: the landscape file becomes editable, terrace turns to reference | You can even switch which attached file is active — pass the pen without ever closing the session. |
| 1:15–1:27 | Save Worksession As dialog; a .rws file saved to the project folder; reopened next morning intact | Save the arrangement as a worksession file, and tomorrow the whole assembly opens exactly as you left it. |
| 1:27–1:38 | Split screen: four architects at four desks, one shared masterplan on each screen | This is how studios split big schemes — blocks per building, worksessions per team. Mark it Got it, or watch again. |
| 1:38–1:45 | End card: Worksession + "Try it now" | Try it now — attach the survey in the practice files. |

## 6. Import — 1:00
**Command:** `Import` · **Related:** Export, Open, Insert, Paste
**Demo geometry:** The terrace model open; the consultants folder showing structure.dwg, context.skp and a product STEP file.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Import + icon (0.5s fade) | Import. The daily bridge to everyone else's software. |
| 0:05–0:14 | Email inbox: engineer's DWG, context model SKP, manufacturer's STEP; caption: "Monday morning" | The engineer works in CAD, the context model came from SketchUp, the door's a STEP file. All of it needs to land here. |
| 0:14–0:26 | Cursor types `Import`; file browser shows the format dropdown scrolled through: DWG, IGES, STEP, SKP, OBJ; structure.dwg picked | Type Import and browse. Rhino reads dozens of formats — DWG, IGES, STEP, SKP, OBJ — pick the engineer's drawing. |
| 0:26–0:38 | DWG import options dialog: units set to millimetres; OK; the steel grid appears aligned with the terrace | Most formats show an options dialog — check the units before anything else. The geometry drops into your current model. |
| 0:38–0:48 | Imported layers visible in the panel under their own names; imported grid moved onto a "REF" parent layer | Imported layers arrive with the geometry. File them under a reference parent layer immediately, before the model gets muddled. |
| 0:48–0:55 | The three imports assembled around the terrace | Unlike Open, Import merges into what you have. Mark it Got it, or watch again. |
| 0:55–1:00 | End card: Import + "Try it now" | Try it now — import the DWG in the practice folder. |

## 7. Export — 1:00
**Command:** `Export` · **Related:** Import, SaveAs, ExportWithOrigin, SelAll
**Demo geometry:** The terrace with the facade panels selected, ready to issue to a fabricator; rest of the model visible but unselected.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Export + icon (0.5s fade) | Export. Issue exactly what they need — nothing more. |
| 0:05–0:14 | Fabricator email requesting "facade panels only, as STEP"; the whole heavy model on screen | The fabricator wants the facade panels as STEP. Not the site, not the furniture — just the panels. |
| 0:14–0:26 | Facade panels selected; cursor types `Export`; save dialog with format dropdown open on STEP; filename typed with date | Select the panels first, then type Export. Only selected objects go out. Choose STEP, and name the file like an issue — date included. |
| 0:26–0:38 | STEP options dialog accepted; caption ticks through common pairings: "DWG → engineers · SKP → visualisers · OBJ → render" | Each format has its options page. Learn your regulars: DWG for engineers, SKP for visualisers, OBJ for render pipelines. |
| 0:38–0:48 | ExportWithOrigin mentioned with a base point picked at a gridline intersection | Cousin command ExportWithOrigin lets you pick a base point — so the panels land on the fabricator's origin, not yours. |
| 0:48–0:55 | Sent email with the STEP attached; issue register updated | Select, export, record the issue. Daily bread for consultant coordination. Mark it Got it, or watch again. |
| 0:55–1:00 | End card: Export + "Try it now" | Try it now — issue the panels from the practice file. |

## 8. Picture — 1:00
**Command:** `Picture` (alias `PictureFrame`) · **Related:** Heightfield, InterpCrv, Import
**Demo geometry:** Empty Top viewport at 1:1 scale; a scanned hand-drawn site plan image file in the project folder.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Picture + icon (0.5s fade) | Picture. Put a drawing under your cursor and trace. |
| 0:05–0:14 | A scanned 1970s site plan on paper; cut to the empty Rhino viewport | The only record of this site is a scanned drawing from the seventies. Let's get it under our model. |
| 0:14–0:26 | Cursor types `Picture`; file browser selects the scan; two corners picked in the Top viewport; image appears as a plane | Type Picture — old hands know it as PictureFrame — choose the image, then pick two corners. It lands as a real plane in the model. |
| 0:26–0:38 | Scale command run using a known 10-metre dimension on the scan; image resized to true site scale | Now scale it truthfully: pick a dimension printed on the drawing and scale until model units match reality. |
| 0:38–0:48 | Picture plane's transparency slider adjusted in Properties; InterpCrv traces the site boundary over the faded image | Drop its transparency in Properties, lock the layer, and trace the boundary with InterpCrv right over the top. |
| 0:48–0:55 | Traced site curves floating above the ghosted scan | Scans, aerials, sketch elevations — anything worth tracing. Mark it Got it, or watch again. |
| 0:55–1:00 | End card: Picture + "Try it now" | Try it now — place the scan in the practice folder. |

## 9. Purge — 0:45
**Command:** `Purge` · **Related:** Audit, SaveSmall, SelDup, BlockManager
**Demo geometry:** The long-running scheme file; Layers panel showing dozens of empty layers, materials list bloated with unused entries.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Purge + icon (0.5s fade) | Purge. Bin the invisible clutter bloating your file. |
| 0:05–0:13 | File properties show 480 MB; layers panel scrolls through empty imported layers; caption: "where did it all go?" | This file is 480 megabytes and half the content is invisible: dead layers, orphaned blocks, unused materials. |
| 0:13–0:24 | Cursor types `Purge`; command line options list layers, blocks, materials, annotation styles, all toggled Yes; Enter | Type Purge. The options let you choose what to sweep — empty layers, unused block definitions, materials, annotation styles. |
| 0:24–0:34 | Report lists items deleted; file resaved; size drops dramatically in the folder view; caption: "480 → 195 MB" | Enter, and Rhino reports what it deleted. Resave and watch the file size fall — often dramatically on old project files. |
| 0:34–0:40 | Purge, Audit, SaveSmall shown as a trio checklist | Run it with Audit and SaveSmall before every issue. Mark it Got it, or watch again. |
| 0:40–0:45 | End card: Purge + "Try it now" | Try it now — purge the practice file. |

## 10. SaveSmall — 0:40
**Command:** `SaveSmall` · **Related:** Save, Purge, Audit
**Demo geometry:** The purged scheme file, shaded viewport visible so render meshes clearly exist; file size on show.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: SaveSmall + icon (0.5s fade) | SaveSmall. The same model at a fraction of the size. |
| 0:05–0:12 | Attempt to email the file bounces: "attachment too large"; caption: "195 MB of what, exactly?" | Still too big to send? A surprising slice of any file is just render meshes — regenerable display data. |
| 0:12–0:22 | Cursor types `SaveSmall`; save dialog; folder view shows the new file at a fraction of the size | Type SaveSmall and save. Rhino writes the file without render meshes — same geometry, dramatically smaller on disk. |
| 0:22–0:30 | The small file reopened; viewport shades up after a brief remeshing pause | The catch is tiny: next open, Rhino remeshes for display. A pause on opening, megabytes saved in transit. |
| 0:30–0:35 | Email sends successfully; archive folder of dated small saves | Standard practice for emailing and archiving models. Mark it Got it, or watch again. |
| 0:35–0:40 | End card: SaveSmall + "Try it now" | Try it now — shrink the practice file. |
