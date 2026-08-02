# Session 19 — Views, cameras, output · Recording scripts
Setup for the whole session: open `demo-19-house.3dm` — a finished courtyard house with materials assigned, a clipping plane through the living room, and a geolocated site — Perspective viewport in Shaded mode with a Rendered mode available, osnaps off.

## 1. NamedView — 1:15
**Command:** `NamedView` · **Related:** Camera, Snapshots, SetView
**Demo geometry:** The house composed in a carefully framed three-quarter hero view, materials on, Perspective viewport.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: NamedView + icon (0.5s fade) | NamedView. Never lose a good camera angle again. |
| 0:05–0:15 | The perfect hero view on screen; an accidental orbit destroys it; wince; undo doesn't bring the camera back | You spent ten minutes composing this view. One stray orbit and it's gone — undo won't rescue a camera. |
| 0:15–0:27 | Cursor types `NamedView`; panel docks with thumbnail gallery; Save button clicked; "Hero_SW" typed | Type NamedView. In the panel, hit Save and name the current camera — "Hero south-west". It's now stored with a thumbnail. |
| 0:27–0:39 | Several more views saved: "Courtyard_eye_level", "Planning_verified_01"; gallery fills with thumbnails | Bank every angle that matters: the courtyard eye-level, the agreed planning views, each render camera. |
| 0:39–0:51 | Viewport orbited away carelessly; double-click on the Hero_SW thumbnail; camera glides exactly back | Now orbit with abandon. Double-click any thumbnail and the camera returns, pixel-perfect, every single time. |
| 0:51–1:03 | Weekly design-review captures from the same named view laid side by side, design evolving, frame identical | Same view, week after week — design reviews become honest comparisons, and verified-view submissions stay repeatable. |
| 1:03–1:10 | Panel with a tidy set of project views, named consistently | Save views like you save files: early and often. Mark it Got it, or watch again. |
| 1:10–1:15 | End card: NamedView + "Try it now" | Try it now — bank a view in the practice file. |

## 2. ViewCaptureToFile — 1:15
**Command:** `ViewCaptureToFile` · **Related:** ViewCaptureToClipboard, Render, Print
**Demo geometry:** The hero named view restored, Rendered display mode on, shadows enabled.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: ViewCaptureToFile + icon (0.5s fade) | ViewCaptureToFile. Presentation images without a render engine. |
| 0:05–0:15 | A crisp A3 design-study sheet with viewport images; caption: "no rendering involved" | Every image on this study sheet came straight from the viewport — high resolution, no render queue, no waiting. |
| 0:15–0:27 | Cursor types `ViewCaptureToFile`; dialog opens showing resolution fields, scale dropdown, and tick-boxes | Type ViewCaptureToFile. The dialog is the point: set any resolution you like — far beyond your screen size. |
| 0:27–0:39 | Scale set to 4×; grid, axes and widget tick-boxes cleared; transparent background ticked | Scale up four times for print. Untick the grid, axes and widgets — nobody wants those on a board. |
| 0:39–0:51 | Transparent-background PNG dropped into a layout in a graphics app; drop shadow added behind the house | Tick transparent background and the PNG floats straight onto your InDesign page, no masking required. |
| 0:51–1:03 | Browse and save as PNG; the captured image opens: clean, sharp, shadows intact | Save as PNG and there's your image — the working display mode, captured faithfully at print quality. |
| 1:03–1:10 | Grid of study captures showing a design option matrix | The workhorse for design studies and option matrices. Mark it Got it, or watch again. |
| 1:10–1:15 | End card: ViewCaptureToFile + "Try it now" | Try it now — capture a hi-res frame from the practice file. |

## 3. Turntable — 0:45
**Command:** `Turntable` · **Related:** RotateView, NamedView
**Demo geometry:** The house centred in the viewport, Rendered mode, target set at the model's middle.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Turntable + icon (0.5s fade) | Turntable. Let the model present itself. |
| 0:05–0:13 | Client review scene: laptop on the table, model rotating slowly by itself while people talk | Mid-meeting, hands off the mouse, and the scheme keeps slowly turning for the room. |
| 0:13–0:24 | Cursor types `Turntable`; model begins a smooth continuous spin; command line shows speed and direction options | Type Turntable and the viewport starts spinning around your model. Options set the speed and direction — slower reads better. |
| 0:24–0:34 | Escape pressed, rotation stops; restarted; the model reviewed from all sides as it turns | Any key stops it. Use it to check a design from every side, or as an instant presentation loop. |
| 0:34–0:40 | Model spinning in Rendered mode on a big screen in reception | Centre the model first — it orbits the view target. Mark it Got it, or watch again. |
| 0:40–0:45 | End card: Turntable + "Try it now" | Try it now — spin the practice model. |

## 4. SetView — 0:45
**Command:** `SetView` · **Related:** Plan, NamedView, 4View
**Demo geometry:** A skewed, orbit-mangled Perspective viewport of the house, clearly nowhere useful.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: SetView + icon (0.5s fade) | SetView. Snap back to the standard views, on command. |
| 0:05–0:13 | Awkward skewed view; caption: "how did we even get here?"; toolbar view buttons circled | Lost in a weird angle? SetView is the command behind every standard view button — and quicker typed. |
| 0:13–0:24 | Cursor types `SetView`; command line shows World/CPlane, then Top, Front, Right, Perspective; Front clicked | Type SetView, choose World or CPlane, then the direction — Top, Front, Right, Perspective. The view snaps instantly. |
| 0:24–0:34 | CPlane option chosen on an angled construction plane; Top view aligns with the rotated wing of the house | The CPlane option is the sleeper: on a rotated construction plane, "Top" means straight down at your angled wing. |
| 0:34–0:40 | Quick cycle: Front, Right, Top elevations of the house in sequence | Elevation checks in seconds, no mouse gymnastics. Mark it Got it, or watch again. |
| 0:40–0:45 | End card: SetView + "Try it now" | Try it now — cycle the views in the practice file. |

## 5. Camera — 1:00
**Command:** `Camera` · **Related:** NamedView, RotateCamera, Walkabout
**Demo geometry:** The house in Perspective plus a Top viewport side by side; a site photograph from a known position open in a corner.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Camera + icon (0.5s fade) | Camera. Grab the viewpoint itself and move it like an object. |
| 0:05–0:14 | Site photo beside the model view, nearly matching; caption: "the planners want this exact viewpoint" | For a verified view, "roughly there" isn't good enough. You need to place the camera like surveyed equipment. |
| 0:14–0:26 | Cursor types `Camera`, Show option; a camera widget with frustum lines appears in the Top viewport | Type Camera and choose Show. The view's camera appears as a widget — position, target and lens cone, all visible in other viewports. |
| 0:26–0:38 | In Top view, the camera point dragged to the surveyed photo position; target dragged to the front door; Perspective updates live | Now drag its points with full snapping: set the camera on the surveyed spot, the target on the entrance. The perspective follows live. |
| 0:38–0:48 | Camera height typed precisely; lens length adjusted in Properties to match the photo's focal length | Type an eye height of 1.6 metres, match the photo's lens length, and the model sits believably inside the photograph. |
| 0:48–0:55 | Matched view saved as a NamedView labelled "Verified_View_02" | Save it as a named view immediately. Mark it Got it, or watch again. |
| 0:55–1:00 | End card: Camera + "Try it now" | Try it now — place the camera in the practice file. |

## 6. Walkabout — 1:00
**Command:** `Walkabout` · **Related:** RotateCamera, NamedView, Camera
**Demo geometry:** Camera positioned at the house's front door, eye level, Rendered mode, interior visible ahead.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Walkabout + icon (0.5s fade) | Walkabout. Walk your building before it exists. |
| 0:05–0:14 | Static bird's-eye view of the plan; caption: "but what does the hallway feel like?" | Plans tell you dimensions. They don't tell you whether the hallway feels generous or mean. Walking does. |
| 0:14–0:26 | Cursor types `Walkabout`; view drops to eye level; WASD-style keys shown on screen as the camera steps forward through the door | Type Walkabout and the camera drops to eye height with walking controls — step forward through the front door. |
| 0:26–0:38 | Camera strolls the hallway, turns into the living room, drag-look towards the courtyard glazing | Keys move you, the mouse turns your head. Stroll the hall, turn into the living room, look out at the courtyard. |
| 0:38–0:48 | Pause at the kitchen threshold; a too-low bulkhead reads obviously oppressive from eye level; annotation dropped | You feel problems instantly — that bulkhead reads oppressive at eye level, invisible in every section you drew. |
| 0:48–0:55 | Quick eye-level pass along the courtyard elevation | The cheapest spatial check in architecture: just walk it. Mark it Got it, or watch again. |
| 0:55–1:00 | End card: Walkabout + "Try it now" | Try it now — walk the house in the practice file. |

## 7. SectionStyles — 1:30
**Command:** `SectionStyles` · **Related:** ClippingPlane, Hatch, Layout
**Demo geometry:** The clipping plane cutting the living room, cut faces currently unstyled; walls, slabs and furniture on separate layers.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: SectionStyles + icon (0.5s fade) | SectionStyles. Live sections that look like real drawings. |
| 0:05–0:15 | The clipped view: raw hollow cuts, no fill; cross-fade to the same view with solid poché and hatched insulation | A clipping plane shows the cut — but raw. Here's the same section wearing proper drawing conventions. Let's dress it. |
| 0:15–0:27 | Cursor types `SectionStyles`; options panel opens showing fill, hatch, background and boundary edge settings | Type SectionStyles. The settings control everything at the cut: fill colour, hatch pattern, and how boundary edges draw. |
| 0:27–0:39 | Wall layer's section style set to solid dark fill; the cut walls instantly render as crisp poché in the viewport | Set the walls to a solid dark fill and the viewport cut becomes poché — instantly, live, while you orbit. |
| 0:39–0:51 | Slab layer given a concrete hatch at drawing scale; insulation layer given its zig-zag pattern | Styles apply per layer or per object — concrete hatch on slabs, the zig-zag on insulation, just like your CAD standards. |
| 0:51–1:03 | Clipping plane dragged through the building; poché and hatches update continuously as rooms slide past | Now drag the clipping plane through the house. The section stays fully dressed the whole way — a drawing you can scrub. |
| 1:03–1:15 | The styled section placed on a Layout page next to conventional 2D drawings; visually indistinguishable | Put that view on a layout and it holds its own against drafted sections — but it never goes out of date. |
| 1:15–1:25 | Design review: live styled section scrubbed in front of clients | This is the Rhino 8 sectioning workflow: model once, section forever. Mark it Got it, or watch again. |
| 1:25–1:30 | End card: SectionStyles + "Try it now" | Try it now — dress the section in the practice file. |

## 8. ViewCaptureToClipboard — 0:40
**Command:** `ViewCaptureToClipboard` · **Related:** ViewCaptureToFile, Print
**Demo geometry:** A tidy shaded view of the house; an email draft to the project team open in a second window.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: ViewCaptureToClipboard + icon (0.5s fade) | ViewCaptureToClipboard. Model to meeting note in two seconds. |
| 0:05–0:12 | Email draft asking "can the ridge drop 300?"; cursor flicks to the Rhino window | Mid-email, you need the view in front of the team — right now, no files, no exports. |
| 0:12–0:22 | Cursor types `ViewCaptureToClipboard`; subtle flash; Ctrl+V in the email; the viewport image lands inline | Type ViewCaptureToClipboard — the viewport copies silently. Switch to the email, paste, done. |
| 0:22–0:30 | Same paste into a slide deck and a chat thread; each drops instantly | It pastes anywhere: decks, chats, minutes. For resolution control, its sibling ViewCaptureToFile has the dialog. |
| 0:30–0:35 | Sent email with the inline screenshot, reply already arriving | Alias it to one key and use it hourly. Mark it Got it, or watch again. |
| 0:35–0:40 | End card: ViewCaptureToClipboard + "Try it now" | Try it now — capture and paste from the practice file. |

## 9. Render — 1:45
**Command:** `Render` · **Related:** ViewCaptureToFile, SetDisplayMode, Sun
**Demo geometry:** The hero named view restored; materials assigned; Sun enabled; render resolution preset in Rhino options.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Render + icon (0.5s fade) | Render. From working model to presentation image. |
| 0:05–0:15 | Finished rendered image of the courtyard house — soft shadows, glass, brick texture; pull back to the plain viewport | Viewport captures are quick, but this — real light, real materials — is what clients respond to. |
| 0:15–0:27 | Materials panel shown briefly: brick, glass, oak assigned to layers; environment panel with an HDRI thumbnail | Rendering rewards preparation. Assign materials by layer, set an environment for reflections, and position your sun first. |
| 0:27–0:39 | Cursor types `Render`; the render window opens; the image resolves progressively from noise to clarity | Then simply type Render. The current view hands over to the active renderer, and the render window builds the image progressively. |
| 0:39–0:51 | Render window toolbar: resolution readout, then the passes/quality counter ticking upward | Resolution and quality come from your render settings, not the viewport — set them in Document Properties before committing to a big frame. |
| 0:51–1:03 | The image sharpening; zoom into glass reflections and soft shadow edges under the eaves | Let it cook. Reflections deepen and shadow edges soften as the passes accumulate — stop it whenever it looks convincing. |
| 1:03–1:15 | Render window's post-effects panel: exposure nudged, a touch of glow; Save button saves a PNG | The render window has post-processing built in — tune exposure and effects, then save the image straight from the window. |
| 1:15–1:27 | Three renders side by side: morning, noon, evening sun — same NamedView | Pair it with named views and the Sun, and you can reissue identical camera angles across options and seasons. |
| 1:27–1:38 | Final image dropped onto a competition board layout | Viewport captures for studies; Render when the image itself must persuade. Mark it Got it, or watch again. |
| 1:38–1:45 | End card: Render + "Try it now" | Try it now — render the hero view in the practice file. |

## 10. Sun — 1:30
**Command:** `Sun` · **Related:** Render, SetDisplayMode, NamedView
**Demo geometry:** The house with its courtyard, Rendered display mode, shadows on, location not yet set.

| Time | Screen shows | Narration |
|---|---|---|
| 0:00–0:05 | Title card: Sun + icon (0.5s fade) | Sun. Real daylight, on the real date, at the real address. |
| 0:05–0:15 | The courtyard in flat generic lighting; cross-fade to the same view with long low winter shadows raking across it | Generic lighting tells you nothing. This is the same courtyard on the twenty-first of December — suddenly it's information. |
| 0:15–0:27 | Cursor types `Sun`; panel opens; toggle switched on; location tab shows a map, city search typing "Manchester" | Type Sun and switch it on. First, set the location — search the city or drop a pin, and set true north. |
| 0:27–0:39 | Date and time controls set to 21 December, 10am; shadows stretch long and low across the courtyard | Now pick the moment that matters: winter solstice, ten a.m. The shadows recompute instantly in the viewport. |
| 0:39–0:51 | Time slider scrubbed from morning to evening; shadows sweep across the courtyard in real time | Scrub the time slider and watch the day pass. Does the courtyard get its lunchtime sun? Now you know, not hope. |
| 0:51–1:03 | Date switched to 21 June; the same scrub shows the courtyard bathed for most of the day | Flip to midsummer and compare. This is a daylight study — the same evidence base as rights-of-light conversations. |
| 1:03–1:15 | ViewCaptureToFile fired at four key times; a 2×2 shadow-study grid assembles on screen | Capture key times from a fixed named view, and you've got a shadow study board for the planning meeting. |
| 1:15–1:25 | The sunlit model rendering in the render window, shadows matching the study | The Sun drives renders too — set once, and every output agrees on the light. Mark it Got it, or watch again. |
| 1:25–1:30 | End card: Sun + "Try it now" | Try it now — run a solstice study on the practice file. |
