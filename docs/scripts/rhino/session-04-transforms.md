# Session 4 — Transforms · Recording scripts
Setup: open `demo-terrace-block.3dm` — a terrace of three house units on a gridded site with a courtyard, a single tree block, a bench, and a column grid; Shaded display, Top maximised for plan work with Perspective one Ctrl-Tab away; osnaps End, Mid, Cen and Int on; Ortho toggled per script; Gumball off until its own video.

## 1. Move — 1:00
**Command:** `Move` · **Related:** Copy, Gumball, Drag, SetPt
**Demo geometry:** Top view; the bench sitting slightly off its paving bay in the courtyard.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:06 | Title card: Move + icon (0.5s fade). Bench snaps crisply from off-grid to centred on its bay. | Move relocates objects with snapping precision — no wobbly dragging. |
| 0:06–0:18 | Select the bench. Keystroke overlay: type `Move`, Enter. Prompt: "Point to move from". End osnap flags the bench corner; click. | Select the bench and type Move. Rhino asks where to move from — pick a corner with an osnap. That's your handle. |
| 0:18–0:32 | Prompt: "Point to move to". Bench ghosts with the cursor; Int osnap flags the paving-bay corner; click. Bench lands exactly. | Then the move-to point. The bench travels with your cursor, and snapping the target corner lands it exactly — corner to corner. |
| 0:32–0:46 | Rerun: pick base point, type `3,0`, Enter — bench shifts exactly 3 units in x. Overlay circles the typed coordinates. Then a Vertical option glimpse. | For a measured shift, type it: three-comma-zero moves three metres along x. And the Vertical option lifts things in 3D. |
| 0:46–1:00 | Bench in place; quick contrast shot of imprecise mouse-dragging, crossed out. End card: Move + "Try it now" (app practice nudge). | Base point to target point — that discipline is why plans stay coordinated. Drag for roughing, Move for real. Mark it Got it, or watch again. |

## 2. Copy — 1:00
**Command:** `Copy` · **Related:** Move, Array, Mirror, Paste
**Demo geometry:** Top view; one tree block placed at the courtyard entrance, empty planting positions marked with points along the street.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:06 | Title card: Copy + icon (0.5s fade). One tree becomes a street of five in quick cuts. | Copy duplicates from a base point to as many targets as you like. |
| 0:06–0:18 | Select the tree. Keystroke overlay: type `Copy`, Enter. Prompt: "Point to copy from". Cen osnap grabs the trunk centre; click. | Select the tree, type Copy. Pick the base point — the trunk centre — because that's what will land on each target. |
| 0:18–0:33 | Prompt: "Point to copy to". Click the first planting point — a tree appears; the prompt repeats. Click three more points; a tree lands on each. Enter to finish. | Now click targets. Each click plants a copy, and the command keeps going — four trees in four clicks. Enter finishes. |
| 0:33–0:47 | Rerun on the bench: base point, then type `4`, Enter with Ortho on for an exact 4m spacing. Command line shows the InPlace option briefly. | Type distances for exact spacing — four metres with Ortho locked. InPlace stacks a copy for layer experiments. |
| 0:47–1:00 | Street elevation with the rhythm of trees; overlay note: "even repeats → Array". End card: Copy + "Try it now" (app practice nudge). | Trees, columns, repeated flats — Copy is the daily repeat tool. When spacing is strictly regular, graduate to Array. Mark it Got it, or watch again. |

## 3. Rotate — 1:00
**Command:** `Rotate` · **Related:** Rotate3D, Orient, ArrayPolar, Move
**Demo geometry:** Top view; one terrace house unit sitting orthogonal while the site boundary runs at a skew angle.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:06 | Title card: Rotate + icon (0.5s fade). House unit swings to sit parallel with the skewed boundary. | Rotate spins objects around a centre you choose — in plan, precisely. |
| 0:06–0:18 | Select the unit. Keystroke overlay: type `Rotate`, Enter. Prompt: "Center of rotation". End osnap grabs the unit's front-left corner; click. | Select the house, type Rotate. First it wants the centre — pick the corner that should stay put. Everything pivots around it. |
| 0:18–0:32 | Prompt: "Angle or first reference point". Type `15`, Enter; unit swings 15° anticlockwise, ghost preview during the turn. | Type the angle — fifteen — and it swings anticlockwise. Negative numbers go clockwise. Typed angles keep drawings auditable. |
| 0:32–0:47 | Undo. Rerun using two reference points: click along the unit's front edge, then click along the boundary line; unit aligns to the boundary exactly. | Don't know the angle? Use references: click along the wall, then along the boundary — Rhino measures the turn for you. |
| 0:47–1:00 | Unit parallel to boundary; command line Copy=Yes option highlighted with a second rotated copy appearing. End card: Rotate + "Try it now" (app practice nudge). | The Copy option rotates a duplicate — handy for fanned layouts. Orienting plans to site angles: constant work, now precise. Mark it Got it, or watch again. |

## 4. Scale — 1:10
**Command:** `Scale` · **Related:** Scale1D, Scale2D, ScaleNU, Gumball
**Demo geometry:** Top view; an imported furniture DWG block sitting comically large next to the correctly sized plan — drawn in millimetres into a metres file.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:06 | Title card: Scale + icon (0.5s fade). Giant imported sofa shrinks to fit its room. | Scale resizes uniformly — and rescues wrongly scaled imports. |
| 0:06–0:18 | Select the oversized furniture. Keystroke overlay: type `Scale`, Enter. Prompt: "Origin point". Click the block's corner. | Select the import, type Scale. The origin point is what stays fixed — pick the corner it should shrink towards. |
| 0:18–0:32 | Prompt: "Scale factor or first reference point". Type `0.001`, Enter. The furniture snaps down a thousandfold to correct size. Overlay circles `0.001`. | It came in a thousand times too big — millimetres into metres — so type nought-point-nought-nought-one. Fixed in one keystroke. |
| 0:32–0:47 | Rerun on a rug by reference: origin at a corner, click the rug's edge end, then click the wall point it should reach; rug stretches to fit exactly. | Or scale by reference: pick the origin, click a known point, then click where it should end up. No arithmetic required. |
| 0:47–1:00 | Command line Copy option flashes; overlay note: "Scale1D = one direction · Scale2D = in plane · ScaleNU = each axis". A door stretched with Scale1D as demo. | Uniform is only the start — Scale-One-D stretches a single direction, handy for stretching a door to a wider opening. |
| 1:00–1:10 | Corrected room layout, everything to scale. End card: Scale + "Try it now" (app practice nudge). | Check imports against a known dimension the moment they arrive — then Scale sorts them. Mark it Got it, or watch again. |

## 5. Mirror — 1:00
**Command:** `Mirror` · **Related:** Reflect, Symmetry, Copy, Rotate
**Demo geometry:** Top view; one fully drawn handed apartment unit beside an empty plot across a shared party-wall line.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:06 | Title card: Mirror + icon (0.5s fade). One flat flips into its handed twin across the party wall. | Mirror reflects geometry — draw one flat, get its handed pair free. |
| 0:06–0:18 | Select the whole apartment. Keystroke overlay: type `Mirror`, Enter. Prompt: "Start of mirror plane". End osnap grabs one end of the party-wall line; click. | Select the finished flat and type Mirror. It asks for the mirror line — snap the first point onto the party wall. |
| 0:18–0:32 | Prompt: "End of mirror plane". Ghost preview flips live as the cursor moves; snap the wall's other end; click. Mirrored unit lands, original kept. | Snap the second point along the same wall and click. The handed twin lands — and the original stays, because Copy defaults on. |
| 0:32–0:46 | Zoom to the pair: door swings, kitchens and stairs correctly handed. Overlay note: "text and dimensions mirror too — check annotations". | Everything hands correctly — swings, kitchens, stairs. One caution: annotation mirrors with it, so re-place any text after. |
| 0:46–1:00 | Quick second mirror of the pair across the corridor centreline — four units from one. End card: Mirror + "Try it now" (app practice nudge). | Mirror the pair again and one drawn flat becomes four. Symmetrical plans, reflected details, handed types — half the drawing, twice the output. Mark it Got it, or watch again. |

## 6. ArrayLinear — 1:15
**Command:** `ArrayLinear` · **Related:** Array, ArrayCrv, Copy, ArrayPolar
**Demo geometry:** Front viewport of a balustrade: one baluster drawn at the stair's base, handrail line above; hook shows the completed run.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:06 | Title card: ArrayLinear + icon (0.5s fade). Finished balustrade — one baluster repeated evenly along the rail. | ArrayLinear repeats objects along one direction at even spacing. |
| 0:06–0:18 | Select the baluster. Keystroke overlay: type `ArrayLinear`, Enter. Prompt: "Number of items". Type `12`, Enter. | Select your baluster and type ArrayLinear. First question: how many? Twelve for this flight. |
| 0:18–0:33 | Prompt: "First reference point". Cen osnap on the baluster base; click. Prompt: "Second reference point"; ghost previews of all 12 stretch as the cursor moves. | Then the spacing, as two points: click the baluster's base, and watch — every copy previews live while you set the step. |
| 0:33–0:47 | Type `0.11`, Enter with the direction locked along the stair pitch; twelve balusters land at 110mm centres. Overlay circles the typed spacing. | Type the spacing — a hundred and ten millimetres, your maximum gap for compliance — and twelve land at perfect centres. |
| 0:47–1:02 | Zoom out; run again on a fence post along the site boundary in Top view, spacing 1.8, count 20. Fence builds instantly. | Same recipe anywhere with rhythm: fence posts at eighteen-hundred centres, joists, façade fins — count, base point, step. |
| 1:02–1:15 | Overlay note: "Array = grids in x/y/z · ArrayCrv = along a curve". End card: ArrayLinear + "Try it now" (app practice nudge). | Need a full grid, that's plain Array; along a curve, ArrayCrv. Linear covers every straight rhythm. Mark it Got it, or watch again. |

## 7. ArrayPolar — 1:20
**Command:** `ArrayPolar` · **Related:** Array, Rotate, Radiate, ArrayLinear
**Demo geometry:** Top view of a circular pavilion: centre point marked, one column drawn on the perimeter; hook shows the finished ring of columns.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:06 | Title card: ArrayPolar + icon (0.5s fade). Finished pavilion — columns evenly ringed around the centre. | ArrayPolar repeats objects around a centre — instant radial order. |
| 0:06–0:18 | Select the column. Keystroke overlay: type `ArrayPolar`, Enter. Prompt: "Center of polar array". Point osnap grabs the marked centre; click. | Select the column, type ArrayPolar. It asks for the centre — snap the pavilion's centre point. Everything revolves around this. |
| 0:18–0:32 | Prompt: "Number of items". Type `16`, Enter. Prompt: "Angle to fill or first reference point" showing `360`; Enter accepts. Ghost ring previews. | Sixteen items, and accept the default three-sixty — the full circle. The preview shows the whole ring before you commit. |
| 0:32–0:47 | Enter confirms; sixteen columns land evenly. Zoom on two adjacent columns — each is rotated to face the centre. Overlay: "copies rotate with the array". | Confirm, and sixteen columns land — each one rotated as it travels, so mullions and details keep facing the centre. |
| 0:47–1:03 | Undo to one column. Rerun with angle `180` and 9 items: a half-ring colonnade forms along the pavilion's south face. | Part-circles work too: nine items through a hundred and eighty degrees gives a south-facing crescent colonnade. |
| 1:03–1:20 | Finished ring plus crescent; quick Perspective orbit. Overlay note: "radial stairs, columns, seating". End card: ArrayPolar + "Try it now" (app practice nudge). | Spiral stair balusters, radial roof beams, amphitheatre seating — anything arranged about a centre is one command. Centre, count, angle. Mark it Got it, or watch again. |

## 8. Gumball — 1:30
**Command:** `Gumball` · **Related:** Move, Rotate, Scale, PushPull
**Demo geometry:** Perspective view; a simple massing box for one terrace unit, Gumball currently off.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:07 | Title card: Gumball + icon (0.5s fade). Box selected; the coloured widget appears and drags it, spins it, stretches it in three quick cuts. | Gumball is the on-object widget — move, rotate and scale without typing a single command. |
| 0:07–0:18 | Type `Gumball`, Enter — status bar Gumball pane lights up. Select the box: red, green and blue arrows, arcs and square handles appear at its centre. | Toggle it with the Gumball command or the status bar. Select anything and the widget appears — arrows, arcs and scale handles. |
| 0:18–0:32 | Drag the blue arrow upward; the box translates in z with a distance readout. Click the blue arrow instead; a text box opens; type `3`, Enter — exact 3m lift. | Drag an arrow to move along that axis. Better: single-click the arrow, type three, Enter — an exact three-metre lift. |
| 0:32–0:46 | Drag the blue arc; box rotates in plan with angle readout. Click the arc, type `45`, Enter. Then drag a square scale handle; box stretches in one direction. | Arcs rotate — click one and type forty-five for a precise turn. The square handles scale, one axis at a time. |
| 0:46–1:02 | Ctrl held while dragging the blue arrow up: the top face extrudes, box grows taller as a solid. Then Alt-drag an arrow: a copy slides off sideways. Keystroke overlays for Ctrl and Alt. | Now the modifiers. Control-drag an arrow to extrude — the massing grows as a solid. Alt-drag leaves a copy behind. That's massing studies at full speed. |
| 1:02–1:16 | Click the small white menu ball; options show Relocate Gumball; move its origin to the box corner; rotation now pivots about the corner. | The little menu ball relocates the widget — put it on a corner and rotations pivot exactly where you want. |
| 1:16–1:30 | Rapid massing montage: three units stretched, lifted, copied into a stepped terrace. End card: Gumball + "Try it now" (app practice nudge). | Most designers leave Gumball on permanently — it's the fastest way to push massing around while options are still loose. Mark it Got it, or watch again. |

## 9. Orient — 1:30
**Command:** `Orient` · **Related:** Orient3Pt, OrientOnSrf, Move, Rotate
**Demo geometry:** Top view; a drawn stair flight lying flat and orthogonal, plus a skewed stair core outline on the plan it must fit into.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:07 | Title card: Orient + icon (0.5s fade). The stair jumps from its drafting spot straight into the skewed core — placed and rotated in one action. | Orient moves and rotates in one command — two points to two points. |
| 0:07–0:18 | Cut showing the slow way: Move, then Rotate, then adjust — three operations crossed out. Select the stair. Keystroke overlay: type `Orient`, Enter. | Normally this is a move, then a rotate, then fiddling. Orient collapses all of it. Select the stair and type Orient. |
| 0:18–0:33 | Prompt: "Reference point 1". End osnap on the stair's bottom-left newel; click. Prompt: "Reference point 2"; click the bottom-right newel. Overlay labels the two picks. | It wants two reference points on the object — click both ends of the bottom riser. They define the stair's own baseline. |
| 0:33–0:48 | Prompt: "Target point 1". Click the core's skewed threshold corner; stair ghost appears attached. Prompt: "Target point 2"; ghost rotates live; click the other threshold corner. | Now the targets: click where each reference should land in the core. The ghost swings live — second click, and it's home. |
| 0:48–1:03 | Stair sits perfectly in the skewed core. Command line options highlighted: Copy=Yes and Scale=Yes. Rerun with Scale=Yes on a detail block into a narrower core; it shrinks to fit. | Placed and rotated together. Turn on Scale and it also resizes to fit the target spacing — one action instead of three. |
| 1:03–1:18 | Quick second example: a WC layout oriented into three differently angled bathroom pods, Copy=Yes leaving the original. | With Copy on, stamp one layout into every angled pod on the floor plate — same two-point rhythm each time. |
| 1:18–1:30 | Floor plan with all pods populated. Overlay note: "Orient3Pt for 3D · OrientOnSrf for surfaces". End card: Orient + "Try it now" (app practice nudge). | For full 3D placement there's Orient3Pt, and OrientOnSrf plants objects on curved surfaces. Mark it Got it, or watch again. |

## 10. Align — 1:00
**Command:** `Align` · **Related:** Distribute, SetPt, Move
**Demo geometry:** Top view; a row of five furniture blocks scattered slightly off a shared datum line, plus a ragged column of text labels.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:06 | Title card: Align + icon (0.5s fade). Scattered blocks snap into a crisp shared line. | Align lines objects up by edges or centres — no snapping gymnastics. |
| 0:06–0:18 | Select the five blocks. Keystroke overlay: type `Align`, Enter. Command line shows options: Bottom, Top, Left, Right, HorizCenter, VertCenter, Concentric. | Select the wayward blocks and type Align. The prompt offers the choices — top, bottom, left, right, or centres. |
| 0:18–0:32 | Click Bottom. Prompt: "Alignment point". Click on the datum line; all five blocks drop so their bottom edges sit on it exactly. | Choose Bottom, then click the datum. Every object drops until its bottom edge sits on that line — one click, five fixes. |
| 0:32–0:46 | Rerun on the text labels with Left; they form a clean column. Then VertCenter on a run of window blocks along a wall; centres align through the wall axis. | Left tidies label columns instantly. VertCenter is the drafting favourite — window blocks centred along a wall in one pass. |
| 0:46–1:00 | Overlay note: "Align positions · Distribute spaces evenly"; quick Distribute demo evening the gaps. End card: Align + "Try it now" (app practice nudge). | Pair it with Distribute, which evens the gaps between them — together they tidy any layout sheet. Mark it Got it, or watch again. |
