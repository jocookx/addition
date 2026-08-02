# Session 17 — Analysis & QA · Recording scripts
Setup for the whole session: open `demo-17-qa.3dm` — a small pavilion with a deliberately flawed roof (one kinked surface join, one flipped surface, one bad object) plus a cast GRC panel solid — Shaded display, osnaps off, panels closed.

## 1. CurvatureAnalysis — 1:00
**Command:** `CurvatureAnalysis` · **Related:** Zebra, CurvatureGraph, EMap
**Demo geometry:** The pavilion roof surface, shaded plain grey so its subtle dent is invisible, Perspective viewport.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: CurvatureAnalysis + icon (0.5s fade) | CurvatureAnalysis. False colour that exposes what shading hides. |
| 0:05–0:14 | Slow orbit over the innocent-looking grey roof; caption: "looks fine…" | This roof looks perfectly smooth. It isn't — and plain shading will never tell you where. |
| 0:14–0:26 | Cursor types `CurvatureAnalysis`, selects the roof; rainbow colours flood the surface; control dialog opens | Type CurvatureAnalysis and select the surface. Instantly it's shaded in false colour, mapping curvature across the whole sheet. |
| 0:26–0:38 | Style dropdown flicked from Gaussian to Mean; a hidden dent flares as a hot spot; Auto Range clicked | Gaussian shows double curvature — where it can't be unrolled. Mean finds dents and flat spots. There's our hidden dimple. |
| 0:38–0:48 | Range values adjusted; colours rebalance; dent circled on screen; dialog closed, colours vanish | Tune the range so colours spread usefully, note what needs fixing, close the dialog and the paint disappears. |
| 0:48–0:55 | Fixed roof re-analysed: calm, even colour throughout | Run it before fabricating any curved roof or facade panel. Mark it Got it, or watch again. |
| 0:55–1:00 | End card: CurvatureAnalysis + "Try it now" | Try it now — find the dent in the practice file. |

## 2. Zebra — 1:00
**Command:** `Zebra` · **Related:** EMap, CurvatureAnalysis, MatchSrf, EdgeContinuity
**Demo geometry:** Two joined canopy surfaces meeting along a visible seam — one pair matched smoothly, one pair only touching — Perspective viewport.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Zebra + icon (0.5s fade) | Zebra. Stripes that tell the truth about smoothness. |
| 0:05–0:14 | Camera skims low across the canopy seam; the join looks acceptable in plain shading | Two surfaces meet along this seam. Smooth enough? Your eye can't judge it — stripes can. |
| 0:14–0:26 | Cursor types `Zebra`, selects both surfaces; bold black-and-white stripes wrap the canopy; dialog opens | Type Zebra, select the surfaces, and they're wrapped in stripes. Now read the seam like a surfboard shaper would. |
| 0:26–0:38 | Zoom to the bad seam: stripes jog sideways at the join; then the good seam: stripes flow straight through | Stripes that jump sideways mean position only. A kink means tangency. Stripes flowing straight through — that's true curvature continuity. |
| 0:38–0:48 | Stripe direction and size adjusted in the dialog; horizontal stripes rake across the seam for a clearer read | Adjust stripe size and direction in the dialog — stripes crossing the seam give the clearest verdict. |
| 0:48–0:55 | Zebra on a full glass facade model, reflections implied by stripe flow | The instant check before glossy claddings and canopies go out. Mark it Got it, or watch again. |
| 0:55–1:00 | End card: Zebra + "Try it now" | Try it now — read the seams in the practice file. |

## 3. DraftAngleAnalysis — 1:00
**Command:** `DraftAngleAnalysis` · **Related:** ExtrudeCrvTapered, ThicknessAnalysis, CurvatureAnalysis
**Demo geometry:** The GRC cladding panel solid with subtle undercuts, sitting above an implied mould base, Perspective viewport.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: DraftAngleAnalysis + icon (0.5s fade) | DraftAngleAnalysis. Will it ever leave the mould? |
| 0:05–0:14 | The GRC panel rotates; caption: "cast in one pull?"; a mould outline fades in beneath it | This GRC panel casts in a one-piece mould. If any face leans the wrong way, it's stuck forever. |
| 0:14–0:26 | Cursor types `DraftAngleAnalysis`, selects the panel; colours appear; dialog shows draft angle range fields | Type DraftAngleAnalysis and select the solid. Every face is coloured by its angle from the pull direction. |
| 0:26–0:38 | Angle limits typed (one degree); a hidden undercut glows red on the panel's return edge; camera zooms in | Set your minimum draft — say one degree. Green releases cleanly; red is an undercut. There's the trap, on the return. |
| 0:38–0:48 | Pull direction flipped in the dialog; colours recompute; the fixed panel shows all green | You can change the pull direction to test other mould splits — and the same colouring maps facade panels against rain angles. |
| 0:48–0:55 | All-green panel above its mould; a demoulded cast panel photo flashes | Check every cast component before the mould is made. Mark it Got it, or watch again. |
| 0:55–1:00 | End card: DraftAngleAnalysis + "Try it now" | Try it now — find the undercut in the practice file. |

## 4. ShowEdges — 1:00
**Command:** `ShowEdges` · **Related:** Join, DupBorder, Check, MatchMeshEdge
**Demo geometry:** The pavilion shell that looks closed but reports as an open polysurface, Perspective viewport, shaded.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: ShowEdges + icon (0.5s fade) | ShowEdges. Find the gap that's keeping your solid open. |
| 0:05–0:14 | Cap command fails on the shell; Properties panel reads "open polysurface"; puzzled cursor circles the model | This shell should be a closed solid, but Rhino insists it's open. Somewhere, edges aren't joined. |
| 0:14–0:26 | Cursor types `ShowEdges`, selects the shell; edges light up; dialog appears with Naked Edges radio button | Type ShowEdges and select the object. Choose Naked Edges — the edges belonging to only one face, your open seams. |
| 0:26–0:38 | A single magenta edge glows at a hidden junction; Zoom Naked button clicked; camera flies straight to it | There — one magenta sliver at a junction you'd never spot. The dialog even zooms you straight to each one. |
| 0:38–0:48 | Non-manifold option flicked briefly; then the gap fixed with Join; ShowEdges re-run shows no naked edges | It flags non-manifold edges too — three faces sharing one edge. Fix, re-check, and the magenta disappears. |
| 0:48–0:55 | Closed solid confirmed in Properties; boolean now succeeds | Run it whenever a join, cap or boolean misbehaves. Mark it Got it, or watch again. |
| 0:55–1:00 | End card: ShowEdges + "Try it now" | Try it now — hunt the naked edge in the practice file. |

## 5. EMap — 0:45
**Command:** `EMap` · **Related:** Zebra, CurvatureAnalysis
**Demo geometry:** A curved metal entrance canopy surface, plain shaded, Perspective viewport.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: EMap + icon (0.5s fade) | EMap. See your surface as polished metal, instantly. |
| 0:05–0:13 | Photo of a real polished canopy with wobbly reflections; cut back to the flat-shaded model | Polished cladding shows every flaw as a wobbled reflection. Preview that embarrassment before it's built. |
| 0:13–0:24 | Cursor types `EMap`, selects the canopy; chrome environment reflects across it; dialog shows image thumbnails | Type EMap, select the surface, and a chrome environment wraps it. Orbit — reflections slide like on real metal. |
| 0:24–0:34 | Slow orbit; a reflection wobble snags over a flawed area; different environment image chosen from the dialog | Watch for reflections that snag or ripple — that's your defect. Swap images for stripes or interiors. |
| 0:34–0:40 | Wobble-free canopy after repair, chrome flowing cleanly | The polished-finish preview for metal and glazing. Mark it Got it, or watch again. |
| 0:40–0:45 | End card: EMap + "Try it now" | Try it now — chrome the canopy in the practice file. |

## 6. Dir — 1:00
**Command:** `Dir` · **Related:** Flip, UnifyMeshNormals
**Demo geometry:** The flipped roof surface plus a footpath curve, both selected states demonstrable, Perspective viewport.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Dir + icon (0.5s fade) | Dir. When Rhino gets its directions back to front. |
| 0:05–0:14 | OffsetSrf on the roof thickens downwards into the room instead of up; user undoes with a visible wince | You offset the roof upwards — it thickened down into the space. The surface normal is pointing the wrong way. |
| 0:14–0:26 | Cursor types `Dir`, selects the roof; a field of white arrows sprouts from the surface, all pointing down | Type Dir and select the object. Arrows appear showing the normals — and yes, this roof thinks down is out. |
| 0:26–0:38 | Flip option clicked on the command line; arrows swing to point upward; U and V direction options shown briefly | Click Flip right there on the command line and the arrows swap. You can swap U and V directions too. |
| 0:38–0:48 | Dir run on the footpath curve; a single arrow shows its flow; flipped so it runs door-to-gate | It works on curves as well — direction governs arrays, sweeps and text flow along a path. |
| 0:48–0:55 | OffsetSrf re-run; roof now thickens correctly upwards | First diagnostic when offsets, extrusions or textures come out backwards. Mark it Got it, or watch again. |
| 0:55–1:00 | End card: Dir + "Try it now" | Try it now — flip the roof normal in the practice file. |

## 7. Check — 0:45
**Command:** `Check` · **Related:** SelBadObjects, What, MeshRepair, Audit
**Demo geometry:** The pavilion's damaged roof polysurface selected, Perspective viewport.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Check + icon (0.5s fade) | Check. A health certificate for any object. |
| 0:05–0:13 | Boolean fails mysteriously on the roof; error message on the command line | Booleans failing for no visible reason? The geometry itself may be internally broken. |
| 0:13–0:24 | Cursor types `Check`, selects the roof; report window opens, listing an invalid trim among the details | Type Check and select the object. Rhino tests its internal data and reports — this one is invalid, with the fault named. |
| 0:24–0:34 | Healthy wall selected and checked; report reads "valid"; both reports side by side | A clean bill of health reads "valid". Make this routine before booleans, exports and any file handover. |
| 0:34–0:40 | Report window over a consultant-issue email draft | Thirty seconds of checking saves a week of consultant emails. Mark it Got it, or watch again. |
| 0:40–0:45 | End card: Check + "Try it now" | Try it now — diagnose the roof in the practice file. |

## 8. SelBadObjects — 0:40
**Command:** `SelBadObjects` · **Related:** Check, Audit, ExtractBadSrf
**Demo geometry:** Full pavilion model visible, nothing selected — one bad object hidden somewhere among hundreds.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: SelBadObjects + icon (0.5s fade) | SelBadObjects. Every broken object, found in one hit. |
| 0:05–0:12 | Wide shot of the whole model; caption: "one of these objects is corrupt" | Something in this model is corrupt. Checking hundreds of objects one by one? No thanks. |
| 0:12–0:22 | Cursor types `SelBadObjects`; a single roof surface highlights yellow; command line reports "1 bad object" | Type SelBadObjects. Rhino sweeps the whole file and selects every invalid object — there's our culprit, instantly. |
| 0:22–0:30 | Bad object isolated with Isolate; repaired with a quick rebuild; SelBadObjects re-run finds nothing | Isolate it, repair or remodel it, then run the command again until nothing selects. |
| 0:30–0:35 | Clean sweep result; command line reads "No bad objects" | Pair it with Check as your pre-issue sweep. Mark it Got it, or watch again. |
| 0:35–0:40 | End card: SelBadObjects + "Try it now" | Try it now — catch the bad object in the practice file. |

## 9. Audit — 0:45
**Command:** `Audit` · **Related:** Check, Purge, SelBadObjects
**Demo geometry:** The full pavilion file open; command line area prominent, ready for a text report.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Audit + icon (0.5s fade) | Audit. An MOT for the file itself. |
| 0:05–0:13 | A long-running project file's title bar; caption: "three years, four offices, one file" | Objects can be broken — but so can the file around them, especially after years of edits and imports. |
| 0:13–0:24 | Cursor types `Audit`; report scrolls: tables checked, object counts, errors found: zero | Type Audit and Rhino inspects the model's database — every table, every record — and reports what it finds. |
| 0:24–0:34 | Sequence montage: Audit, then Purge, then SaveSmall run in a row; file size drops in the save dialog | Zero errors? Lovely. Make Audit, Purge and SaveSmall your standard hygiene routine before archiving or issuing. |
| 0:34–0:40 | Clean audit report beside a tidy project folder | Run it monthly on any long-running project file. Mark it Got it, or watch again. |
| 0:40–0:45 | End card: Audit + "Try it now" | Try it now — audit the practice file. |

## 10. List — 0:40
**Command:** `List` · **Related:** What, Check
**Demo geometry:** A single NURBS curve selected, command line and a text window ready.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: List + icon (0.5s fade) | List. X-ray vision into an object's raw data. |
| 0:05–0:12 | The innocuous curve selected; caption: "what is this thing, really?" | Sometimes What isn't enough — you need to see exactly what Rhino stores under the bonnet. |
| 0:12–0:22 | Cursor types `List`; text window fills with degree, knot vector and control point coordinates, scrolling | Type List with the curve selected. A window dumps everything: degree, knot vector, every control point coordinate. |
| 0:22–0:30 | A duplicated knot value highlighted in the readout; cross-reference with a Grasshopper error message | It's how you spot a stacked knot or rogue weight when scripts and Grasshopper definitions choke on imported geometry. |
| 0:30–0:35 | Text window beside the humble curve | Deep-debug tool — rare, but irreplaceable when needed. Mark it Got it, or watch again. |
| 0:35–0:40 | End card: List + "Try it now" | Try it now — list the curve in the practice file. |
