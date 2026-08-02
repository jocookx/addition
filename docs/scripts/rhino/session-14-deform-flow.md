# Session 14 — Deform & flow · Recording scripts
Setup for all ten videos: open `demo-deform-flow.3dm` — a straight tower massing, a flat panelised façade strip with its base surface, a doubly curved target surface, and assorted straight elements (truss, louvre run, chair rail), Shaded mode, osnaps End + Point on, Record History off unless stated.

## 1. Bend — 0:55
**Command:** `Bend` · **Related:** Flow, Twist, Taper, Stretch
**Demo geometry:** A straight lattice truss modelled flat along the X axis, Front view active.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Bend + icon (0.5s fade) | Model it straight. Then bend it like steel. |
| 0:05–0:15 | Finished example: the truss curved into a graceful arc over an atrium, glazing beneath | This arched atrium truss was modelled dead straight — every node square and simple — then bent through its arc in one move. |
| 0:15–0:28 | Type `Bend`; select truss, Enter; click spine start at one end, spine end at the other | Type Bend and select the objects. Now define the spine — click the start of the truss, then its far end. That's the axis that will curve. |
| 0:28–0:40 | Drag: truss bows live following the cursor; type an angle; show Symmetric and Copy options | Drag and the whole truss bows to follow. Type a point or an angle for precision; Symmetric bends both ends evenly about the middle. |
| 0:40–0:48 | Montage: straight louvre run bent around a curved façade corner, handrail bent up a ramp | Louvres around a curved corner, handrails climbing a ramp — model straight where it's easy, bend where it's needed. |
| 0:48–0:55 | End card: Bend + "Try it now" | Bend something straight — mark it Got it, or watch again. |

## 2. Twist — 1:00
**Command:** `Twist` · **Related:** Bend, Taper, Maelstrom, Flow
**Demo geometry:** A straight rectangular tower massing with floor plates visible, Perspective view.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Twist + icon (0.5s fade) | The twisting tower. Every studio tries one. Here's how. |
| 0:05–0:15 | Finished example: the tower spiralling 90 degrees base to crown, floor plates rotating in step | Ninety degrees of rotation from plinth to crown, every floor plate turning in sequence — one command on a straight extrusion. |
| 0:15–0:28 | Type `Twist`; select the tower, Enter; click axis start at base centre, axis end at roof centre | Type Twist, select the tower, Enter. Then set the twist axis — click the centre of the base, then straight up to the roof. |
| 0:28–0:40 | Drag rotation live; type `90`, Enter; tower snaps to a clean quarter turn | Now drag — the massing spirals live under the cursor. Type ninety for an exact quarter turn and press Enter. |
| 0:40–0:52 | Toggle Rigid=Yes and repeat on a tower of stacked storey boxes: boxes rotate but stay square | One option to know: Rigid keeps each object un-deformed while the stack still spirals — perfect for storey-by-storey plate studies. |
| 0:52–1:00 | End card: Twist + "Try it now" | Twist a massing yourself — mark it Got it, or watch again. |

## 3. Taper — 0:55
**Command:** `Taper` · **Related:** Twist, Bend, ExtrudeCrvTapered
**Demo geometry:** The straight tower massing again, untouched copy, Front view active.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Taper + icon (0.5s fade) | Give a straight tower a silhouette that narrows skyward. |
| 0:05–0:15 | Finished example: tower slimming smoothly from a broad base to a narrow crown, elegant profile | Broad and stable at the plinth, slender at the crown — the classic tapering profile, applied to a plain extrusion in seconds. |
| 0:15–0:27 | Type `Taper`; select tower, Enter; click axis start at base, axis end at top | Type Taper and select the massing. Define the taper axis — base of the tower to the top — the direction the scaling will run along. |
| 0:27–0:39 | Click a reference distance at the base edge, then drag the end width narrower; type exact half-width | Then set the start width with a reference click, and drag the end width tighter — or type it. The form scales progressively between. |
| 0:39–0:48 | Show Flat=Yes tapering in one direction only: tower becomes a wedge; quick chimney/plinth montage | The Flat option tapers one axis only — a wedge rather than a spire. Plinths, chimneys, battered walls: all one Taper away. |
| 0:48–0:55 | End card: Taper + "Try it now" | Taper a volume — mark it Got it, or watch again. |

## 4. Flow — 1:30
**Command:** `Flow` · **Related:** FlowAlongSrf, Bend, ArrayCrv, Sporph
**Demo geometry:** A straight run of balustrade — posts, rails, infill — modelled along a straight line, with a sweeping S-curve path drawn beside it in Top view.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Flow + icon (0.5s fade) | The oldest trick in Rhino: model straight, flow curved. |
| 0:05–0:16 | Finished example: balustrade snaking perfectly along the S-curve ramp edge, every post upright | Every post, rail and panel of this balustrade follows the S-curve exactly — but it was all modelled on a dead-straight line. |
| 0:16–0:30 | Show the two curves side by side: straight base line under the balustrade, S-curve target beyond | Flow needs two curves: a straight base curve lying along your geometry, and the target curve you want it wrapped onto. |
| 0:30–0:44 | Type `Flow`; select balustrade objects, Enter; click the base line near its left end | Type Flow, select the objects, Enter. Now click the base curve — and click it near the same end as you'll pick on the target, or things arrive backwards. |
| 0:44–0:58 | Click the S-curve near its matching end; balustrade re-forms along it instantly; orbit result | Click the target curve, matching end, and the whole assembly re-shapes along it — bending, curving, spacing preserved along the length. |
| 0:58–1:12 | Repeat with Rigid=Yes: posts stay straight while positions follow; then toggle Stretch option | Rigid keeps each part un-deformed — posts stay plumb while their positions flow. Stretch fits the run to the target's full length. |
| 1:12–1:24 | Montage: seating bench along a curved plaza edge, fence along a site boundary, moulding along an arch | Benches on curved plazas, fencing on wriggling boundaries, mouldings around arches — detail once, flow everywhere. |
| 1:24–1:30 | End card: Flow + "Try it now" | Flow a straight assembly onto a curve — mark it Got it, or watch again. |

## 5. FlowAlongSrf — 1:45
**Command:** `FlowAlongSrf` · **Related:** Flow, CreateUVCrv, ArraySrf, Sporph, Splop
**Demo geometry:** Flat rectangular base surface carrying a diagrid panel system modelled flat; a doubly curved tower-skin target surface alongside.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: FlowAlongSrf + icon (0.5s fade) | The doubly curved façade problem — solved flat. |
| 0:05–0:16 | Finished example: diagrid panels wrapping a doubly curved tower skin, joints aligned, orbit slowly | This panelised skin — hundreds of components on a doubly curved surface — was modelled entirely flat on a rectangle. |
| 0:16–0:30 | Split view: flat base surface with diagrid laid on it; empty curved target surface beside | The setup: your system sits on a flat base surface; the curved target waits. Flow maps one surface's space onto the other's. |
| 0:30–0:44 | Type `FlowAlongSrf`; window-select all the panels, Enter; click the flat base surface near one corner | Type FlowAlongSrf, select the panels, Enter. Click the base surface — and where you click matters: near a corner, to anchor the mapping. |
| 0:44–0:58 | Click the matching corner of the curved target; panels morph across in one sweep; orbit result | Click the matching corner on the target, and the entire system morphs across — every panel bending to the new curvature. |
| 0:58–1:12 | Deliberately click the wrong corner: panels arrive mirrored; undo; overlay tip about matching corners | Click mismatched corners and it lands flipped or mirrored — undo and re-pick. Corner discipline is the whole skill here. |
| 1:12–1:26 | Show Rigid and Record History options; edit the flat layout, history updates the curved version live | Two power moves: Rigid keeps fittings un-warped, and with History on, edits to the flat layout update the curved façade automatically. |
| 1:26–1:38 | Overlay: CreateUVCrv noted as the partner command for unrolling the target's true UV space first | Partner tip — CreateUVCrv unrolls the target's UV space flat first, so your layout fits the skin without stretching surprises. |
| 1:38–1:45 | End card: FlowAlongSrf + "Try it now" | Map a flat pattern onto a curved surface — mark it Got it, or watch again. |

## 6. CageEdit — 1:40
**Command:** `CageEdit` · **Related:** Cage, SoftMove, MoveUVN, SolidPtOn
**Demo geometry:** A detailed mid-rise building model (façade, floors, core) as one selectable assembly, Perspective.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: CageEdit + icon (0.5s fade) | Reshape a whole building — through a handful of points. |
| 0:05–0:16 | Finished example: the mid-rise gently leaning and swelling, façade, floors and core all deformed together | The entire building — skin, slabs, core — leans and swells as one. Nobody remodelled anything: a cage did it. |
| 0:16–0:30 | Type `CageEdit`; select the whole building, Enter; choose BoundingBox from the control-object options | Type CageEdit and select everything to deform. For the control object, choose BoundingBox — Rhino wraps a box cage around the lot. |
| 0:30–0:44 | Set cage points to 4 in X, 2 in Y, 5 in Z at the prompts; lattice of points appears around the building | Set the cage's point counts — say four by two by five. Fewer points, smoother global moves; more points, finer local control. |
| 0:44–0:58 | Select the top two rows of cage points; drag sideways with Gumball; building shears smoothly, floors follow | Now edit the cage, not the building: grab the upper points, drag, and every object inside flexes smoothly to follow. |
| 0:58–1:12 | Pull one mid-height face of points outward: façade develops a subtle belly; slabs stretch to stay connected | Push one side's midpoints out and the elevation gains a belly — slabs and mullions stay stitched to the skin throughout. |
| 1:12–1:24 | Show Region-to-edit option limiting the deformation falloff; then delete cage vs keep for later editing | The region options control fall-off beyond the cage. Keep the cage afterwards and you can return and keep sculpting any time. |
| 1:24–1:34 | Montage: competition massing iterations — same base model cage-bent three ways side by side | For competition rounds, one detailed model plus three cage edits equals three schemes by Friday. That's the point of CageEdit. |
| 1:34–1:40 | End card: CageEdit + "Try it now" | Cage a model and bend it — mark it Got it, or watch again. |

## 7. Smooth — 0:55
**Command:** `Smooth` · **Related:** Fair, Rebuild, SoftEditCrv
**Demo geometry:** A jittery traced site-boundary polycurve and a lumpy terrain mesh, both visibly noisy.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Smooth + icon (0.5s fade) | Noisy traced linework? Calm it down with Smooth. |
| 0:05–0:15 | Before/after split: jittery site boundary versus the same curve relaxed and even | The same traced site boundary, before and after: every accidental wobble from the scan trace averaged away, shape intact. |
| 0:15–0:27 | Type `Smooth`; select the noisy curve, Enter; dialogue opens: X, Y, Z ticks and smooth factor slider | Type Smooth and select the curve. The dialogue lets you smooth per axis — untick Z to relax a plan shape without disturbing levels. |
| 0:27–0:39 | Set factor 0.2, click OK repeatedly; curve relaxes step by step; then smooth the lumpy terrain mesh | The factor sets strength; apply gently, several passes, watching each one. It works on meshes too — lumpy terrain calms the same way. |
| 0:39–0:48 | Overlay caution: smoothing shrinks shapes slightly; check against the original on a locked layer | One caution: smoothing pulls geometry inwards a touch — keep the original locked underneath and check you haven't drifted. |
| 0:48–0:55 | End card: Smooth + "Try it now" | Relax a noisy curve — mark it Got it, or watch again. |

## 8. Fair — 1:00
**Command:** `Fair` · **Related:** Smooth, Rebuild, SimplifyCrv, CurvatureGraph
**Demo geometry:** An imported DWG spline for a canopy edge, with CurvatureGraph on showing spiky combs.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Fair + icon (0.5s fade) | The curve looks fine. Its curvature says otherwise. |
| 0:05–0:16 | CurvatureGraph on the imported curve: comb spiking wildly; after fairing: comb flowing evenly | See those spikes in the curvature comb? Invisible kinks that will print as ripples in any surface built from this imported curve. |
| 0:16–0:28 | Type `Fair`; select the curve, Enter; tolerance prompt appears; accept default, Enter | Type Fair, select the curve, Enter. Rhino asks for a tolerance — how far the curve may move while being cleaned. Accept the default. |
| 0:28–0:40 | Curve updates subtly; comb smooths dramatically; overlay both curves showing tiny deviation | The shape barely moves — millimetres — but the curvature transforms: kinks and wobbles ironed out while the design intent survives. |
| 0:40–0:52 | Loft a canopy surface from faired curves; zebra stripes flow cleanly; compare unfaired version's ripples | Fair imported or traced curves before lofting and sweeping — clean input curvature is the difference between a crisp canopy and a rippled one. |
| 0:52–1:00 | End card: Fair + "Try it now" | Fair a curve and check the comb — mark it Got it, or watch again. |

## 9. Stretch — 0:55
**Command:** `Stretch` · **Related:** Scale1D, Bend, Flow
**Demo geometry:** A panelled door with moulded edge details, Front view, plus a window assembly nearby.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Stretch + icon (0.5s fade) | Make it longer — without squashing the good ends. |
| 0:05–0:15 | Split: Scale1D version with distorted mouldings versus Stretch version with crisp ends, longer middle | Scale1D stretches everything — see the smeared mouldings. Stretch lengthens only the middle, so both detailed ends stay perfect. |
| 0:15–0:27 | Type `Stretch`; select the door, Enter; click stretch-axis start below the bottom detail, end above it | Type Stretch, select the object, Enter. Click two points to bracket the zone that's allowed to stretch — between the end details. |
| 0:27–0:39 | Drag: middle elongates live, ends ride along rigidly; type exact new length; Enter | Drag, and only that middle band elongates — the ends translate untouched. Type a point or distance for the exact final length. |
| 0:39–0:48 | Montage: window jamb lengthened between head and cill details, handrail run extended mid-span | Doors to bespoke heights, windows between standard details, rails extended mid-span — resize the boring bit, protect the crafted bits. |
| 0:48–0:55 | End card: Stretch + "Try it now" | Stretch something's middle — mark it Got it, or watch again. |

## 10. Splop — 1:05
**Command:** `Splop` · **Related:** Sporph, OrientOnSrf, FlowAlongSrf
**Demo geometry:** A small rosette ornament sitting on a flat plane, beside a doubly curved dome surface.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Splop + icon (0.5s fade) | Stamp ornaments across a curved surface — one click each. |
| 0:05–0:15 | Finished example: dome speckled with rosettes, each hugging the curvature at a different scale | Every rosette on this dome is a stamped copy — placed, rotated and scaled with single clicks, each one moulded to the curvature. |
| 0:15–0:28 | Type `Splop`; select the rosette, Enter; define the base: click centre point and radius on the flat plane | Type Splop, select the ornament, Enter. Define its base plane — a centre and radius around it on the flat surface it sits on. |
| 0:28–0:42 | Move cursor over the dome: live morphing preview follows; click to place; drag second point sets rotation and scale | Now hover over the target surface: the ornament previews live, wrapping to the curvature. Click to plant it, then a second click sets rotation and size. |
| 0:42–0:54 | Rapid-fire placing: several rosettes at varied sizes; press Enter to finish; orbit dome | Keep clicking — every placement is a fresh morphed copy. It's playful, fast and surprisingly precise. Enter when the surface is dressed. |
| 0:54–1:00 | Montage: bosses across a vaulted soffit, studs across a curved acoustic wall | Bosses on vaults, studs on acoustic walls, decorative repeats on any curved skin — Splop is the ornament stamp. |
| 1:00–1:05 | End card: Splop + "Try it now" | Stamp something onto a curve — mark it Got it, or watch again. |
