# Rhino recording plan

Generated from the live command library (src/data/commands/rhino.json).
Format per video: 60–90s — what it does, when to reach for it, one real example.
Tick videos off as recorded; paste the lesson's Cloudflare video into the matching command's video field in the studio.

## Phase 1 — Beginner essentials (week one confidence)

### Session 1 — Navigate & see your model

- [ ] **Zoom** · 🖼 — Zooms the viewport by window, extents, selected objects or factor.
- [ ] **Pan** · 🖼 — Slides the view across the model without changing zoom or angle.
- [ ] **RotateView** · 🖼 — Orbits the camera around the view target.
- [ ] **4View** — Restores the classic four-viewport arrangement of Top, Front, Right and Perspective.
- [ ] **Plan** — Sets the viewport to look straight down at the current construction plane.
- [ ] **Isometric** · 🖼 — Sets the viewport to an isometric parallel projection from a chosen quadrant such as north-east or south-west.
- [ ] **MaxViewport** · 🖼 — Toggles the active viewport between maximised and the multi-view layout.
- [ ] **NextViewport** — Makes the next viewport active, cycling through them in order.
- [ ] **Shade** · 🖼 — Temporarily displays the viewport shaded regardless of its display mode.
- [ ] **SetObjectDisplayMode** · 🖼 — Overrides the display mode of selected objects in a viewport - for instance keeping context buildings wireframe while your proposal shows re

### Session 2 — First lines & shapes

- [ ] **Line** · 🖼 — Draws a single straight line between two picked points.
- [ ] **Polyline** · 🖼 — Draws a connected chain of straight segments as one curve.
- [ ] **Rectangle** · 🖼 — Draws a rectangular polyline from two corners, a centre, or three points, with a rounded-corner option.
- [ ] **Circle** · 🖼 — Draws a circle from centre and radius, with vertical, tangent and other placement options.
- [ ] **Arc** · 🖼 — Draws a circular arc from a centre, start and angle, with options for tangent and other constructions.
- [ ] **Ellipse** · 🖼 — Draws an ellipse from a centre and two axis lengths, or by bounding corners.
- [ ] **Polygon** · 🖼 — Draws a regular polygon with any number of sides, inscribed or circumscribed about a radius.
- [ ] **Curve** · 🖼 — Draws a free-form NURBS curve by placing control points that pull the curve towards them.
- [ ] **InterpCrv** — Draws a smooth curve that passes exactly through each picked point.
- [ ] **Point** · 🖼 — Places a single point object at a picked or typed location.

### Session 3 — Select & organise

- [ ] **SelAll** · `Ctrl+A` — Selects every visible, unlocked object in the model.
- [ ] **SelNone** — Clears the current selection entirely.
- [ ] **SelCrv** — Selects all curve objects in one hit.
- [ ] **SelSrf** — Selects every single-surface object in the model.
- [ ] **Layer** · 🖼 — Opens the layers panel to create, rename, colour and structure layers and sublayers.
- [ ] **Group** · `Ctrl+G` · 🖼 — Binds selected objects into a group that selects as one.
- [ ] **Ungroup** — Dissolves the selected group back into independent objects.
- [ ] **Hide** · 🖼 — Makes selected objects invisible without deleting them.
- [ ] **Show** — Reveals all hidden objects at once.
- [ ] **Lock** · 🖼 — Makes selected objects visible but unselectable, greyed in the viewport.

### Session 4 — Move it, shape it

- [ ] **Move** · 🖼 — Moves objects from a base point to a target point with full snapping precision.
- [ ] **Copy** · 🖼 — Duplicates objects from a base point to one or more target points.
- [ ] **Rotate** · 🖼 — Rotates objects around a centre point within the construction plane.
- [ ] **Scale** · 🖼 — Resizes objects uniformly in all directions from an origin, by factor or reference distance.
- [ ] **Mirror** · 🖼 — Reflects objects across a line or plane, optionally keeping the original.
- [ ] **ArrayLinear** — Copies objects repeatedly along a single direction at even spacing.
- [ ] **ArrayPolar** — Copies objects around a centre point through a set angle and count.
- [ ] **Gumball** · 🖼 — Toggles the on-object widget that drags, rotates and scales selections along its arrows and arcs, with extrude and copy modifiers.
- [ ] **Orient** · 🖼 — Moves, rotates and optionally scales objects by mapping two reference points onto two targets.
- [ ] **Align** · 🖼 — Lines up selected objects by their edges or centres, vertically or horizontally.

### Session 5 — Edit curves like a pro

- [ ] **Trim** · 🖼 — Cuts away the parts of objects you click, using other objects as cutting edges.
- [ ] **Split** · 🖼 — Divides objects into pieces where cutters cross them, keeping every part.
- [ ] **Join** · 🖼 — Connects touching curves into polycurves, or surfaces into polysurfaces and closed solids.
- [ ] **Explode** · 🖼 — Breaks joined objects into their component curves, surfaces or mesh parts, and dissolves blocks and groups of segments.
- [ ] **Extend** · 🖼 — Lengthens a curve to meet a boundary or by a set distance, keeping its character by line, arc or smooth continuation.
- [ ] **Fillet** · 🖼 — Joins two curves with a tangent arc of a given radius, trimming them back to meet it.
- [ ] **Chamfer** · 🖼 — Connects two curves with an angled straight segment at set distances, trimming them to suit.
- [ ] **Offset** · 🖼 — Creates a parallel copy of a curve at a set distance, with corner and cap options.
- [ ] **Rebuild** · 🖼 — Reconstructs curves or surfaces with a chosen degree and control point count, evening out their structure.
- [ ] **BlendCrv** · 🖼 — Creates an adjustable smooth connecting curve between two curve ends, with control over continuity up to curvature and beyond.

### Session 6 — First surfaces

- [ ] **ExtrudeCrv** · 🖼 — Pushes a curve in a straight direction to form a surface, or a closed solid with caps.
- [ ] **Loft** · 🖼 — Fits a surface through an ordered series of profile curves, with style options from tight to loose.
- [ ] **Revolve** · 🖼 — Spins a profile curve around an axis to create a surface of revolution.
- [ ] **PlanarSrf** · 🖼 — Creates flat surfaces from closed planar curves, including nested boundaries with holes.
- [ ] **Sweep1** · 🖼 — Runs one or more cross-section shapes along a single rail curve to build a surface.
- [ ] **Sweep2** · 🖼 — Builds a surface by carrying cross-sections along two rail curves, keeping both edges under control.
- [ ] **NetworkSrf** · 🖼 — Builds a surface through a criss-crossing network of curves in two directions.
- [ ] **Patch** · 🖼 — Fits an approximate surface over a loose collection of curves, points or edges.
- [ ] **OffsetSrf** · 🖼 — Creates a copy of a surface or polysurface at a set distance along its normals, optionally building a closed solid between the two.
- [ ] **Cap** · 🖼 — Closes planar openings in a surface or polysurface with flat faces, making it a closed solid.

### Session 7 — First solids

- [ ] **Box** · 🖼 — Creates a rectangular solid box from corners or centre.
- [ ] **Sphere** · 🖼 — Creates a solid sphere from centre and radius or other constructions.
- [ ] **Cylinder** · 🖼 — Creates a solid cylinder from a base circle and height.
- [ ] **Cone** · 🖼 — Creates a solid cone from a base and apex.
- [ ] **Pipe** · 🖼 — Wraps a solid circular section along any curve, with optional varying radii and caps.
- [ ] **BooleanUnion** · 🖼 — Merges overlapping solids into one, removing internal walls.
- [ ] **BooleanDifference** — Subtracts one set of solids from another, cutting openings and voids.
- [ ] **BooleanIntersection** — Keeps only the volume shared by two sets of solids.
- [ ] **Shell** — Hollows a closed solid to a set wall thickness, removing the faces you pick as openings.
- [ ] **FilletEdge** · 🖼 — Rounds selected edges of a solid with constant or variable radii, handling the corner patches automatically.

## Phase 2 — Intermediate core (real modelling fluency)

### Session 8 — Precision & construction

- [ ] **Osnap** — Opens the object snap controls for end, mid, centre, intersection and other precise picks.
- [ ] **Grid** — Adjusts the construction plane grid's extents, spacing and snap intervals.
- [ ] **CPlane** · 🖼 — Redefines the construction plane by origin, three points, object or view.
- [ ] **NamedCPlane** · 🖼 — Saves and restores construction planes by name.
- [ ] **Distance** · 🖼 — Reports the distance between two picked points.
- [ ] **Length** · 🖼 — Reports the true length of curves and edges.
- [ ] **Angle** · 🖼 — Measures the angle between two lines or defined directions.
- [ ] **Area** · 🖼 — Calculates the area of closed curves, hatches, surfaces or meshes.
- [ ] **Volume** · 🖼 — Calculates the enclosed volume of closed solids or meshes.
- [ ] **What** — Prints a detailed report of an object's type, structure and validity.

### Session 9 — Advanced transforms

- [ ] **Rotate3D** · 🖼 — Rotates objects around an axis you define by two points in space.
- [ ] **Scale1D** — Stretches objects along a single direction only.
- [ ] **Scale2D** — Scales objects in two directions while holding the third.
- [ ] **ArrayCrv** · 🖼 — Copies objects along a curve by count or spacing, optionally rotating them to follow it.
- [ ] **ArraySrf** · 🖼 — Copies an object across a surface in its U and V directions, orienting each copy to the surface normal.
- [ ] **OrientOnSrf** · 🖼 — Places copies of an object onto a surface, aligned to the surface normal at each pick.
- [ ] **RemapCPlane** · 🖼 — Re-orients objects from one construction plane to another, as if the geometry were drawn on the new plane.
- [ ] **ProjectToCPlane** · 🖼 — Squashes objects flat onto the construction plane, optionally keeping the originals.
- [ ] **SetPt** · 🖼 — Flattens selected objects or control points to a shared X, Y or Z value.
- [ ] **Distribute** — Spaces selected objects evenly between the outermost ones along an axis.

### Session 10 — Surface craft

- [ ] **BlendSrf** · 🖼 — Creates a smooth transition surface between two surface edges with adjustable continuity and shape handles.
- [ ] **MatchSrf** · 🖼 — Adjusts a surface edge to meet a neighbouring surface with position, tangency or curvature continuity.
- [ ] **MergeSrf** · 🖼 — Combines two untrimmed surfaces sharing an edge into one single surface.
- [ ] **ExtendSrf** · 🖼 — Lengthens a surface beyond a chosen edge, smoothly or as a straight continuation.
- [ ] **FilletSrf** — Inserts a constant-radius rounded surface between two surfaces and can trim them to fit.
- [ ] **ChamferSrf** · 🖼 — Connects two surfaces with a flat angled strip at set distances, trimming both back.
- [ ] **VariableFilletSrf** · 🖼 — Fillets between surfaces with a radius that varies along the edge, adjusted by handles - for fillets that need to grow or shrink along a run
- [ ] **Smash** · 🖼 — Roughly flattens a surface that is only slightly doubly curved, ignoring small distortions.
- [ ] **ShrinkTrimmedSrf** · 🖼 — Shrinks the hidden underlying surface of a trimmed face so it sits closely around the trim boundary.
- [ ] **UntrimAll** — Removes every trim from a surface, recovering the full underlying sheet - the fastest way to strip out holes and cut edges when you want to 

### Session 11 — Curve intelligence

- [ ] **Project** · 🖼 — Projects curves or points straight down (or along a view direction) onto surfaces, polysurfaces or meshes.
- [ ] **Pull** · 🖼 — Pulls curves or points onto a surface by the shortest path rather than a fixed direction.
- [ ] **Intersect** · 🖼 — Creates curves or points where selected objects cross each other.
- [ ] **Contour** · 🖼 — Cuts a stack of evenly spaced section curves through objects along an axis.
- [ ] **Section** — Creates section curves where a picked plane slices through objects.
- [ ] **DupBorder** · 🖼 — Duplicates the naked outer edges of a surface, polysurface, mesh or hatch as curves.
- [ ] **DupEdge** · 🖼 — Copies individually picked surface or polysurface edges as free-standing curves.
- [ ] **ExtractIsocurve** · 🖼 — Pulls a chosen U or V isocurve off a surface as a real curve.
- [ ] **ExtractWireframe** · 🖼 — Converts the displayed isocurve wireframe of surfaces or polysurfaces into curves in one go.
- [ ] **CurveBoolean** · 🖼 — Trims and joins overlapping closed planar curves by picking the regions to keep, like a 2D boolean.

### Session 12 — Solid editing

- [ ] **BooleanSplit** — Splits solids into separate closed pieces along their shared intersections, keeping everything.
- [ ] **WireCut** · 🖼 — Slices a solid using a curve projected through it, keeping or discarding the pieces you choose.
- [ ] **ExtrudeSrf** · 🖼 — Thickens a surface by extruding it straight into a closed solid.
- [ ] **OffsetSrf** · 🖼 — Creates a copy of a surface or polysurface at a set distance along its normals, optionally building a closed solid between the two.
- [ ] **ChamferEdge** · 🖼 — Bevels selected solid edges with a flat strip at set distances.
- [ ] **BlendEdge** · 🖼 — Rounds solid edges with a curvature-continuous blend rather than a plain circular fillet.
- [ ] **PushPull** · 🖼 — Drags planar regions directly in or out to add or remove material, SketchUp-style.
- [ ] **Inset** · 🖼 — Creates a smaller face inside a chosen face at a set margin, ready to push or pull.
- [ ] **SolidPtOn** — Turns on grip points at the corners and edges of a solid so they can be dragged directly.
- [ ] **MoveFace** · 🖼 — Pushes or pulls a face of a solid, extending the neighbouring faces to follow.

### Session 13 — SubD modelling

- [ ] **SubDBox** — Creates a SubD box with a chosen number of faces per side.
- [ ] **SubDSphere** — Creates a smooth SubD sphere built from quad faces.
- [ ] **ToSubD** · 🖼 — Converts meshes, NURBS surfaces or extrusions into SubD objects.
- [ ] **ToNURBS** · 🖼 — Converts SubD or mesh objects into NURBS surfaces and polysurfaces.
- [ ] **Crease** · 🖼 — Makes selected SubD edges or vertices perfectly sharp while the rest stays smooth.
- [ ] **InsertEdge** · 🖼 — Adds new edge loops across SubD faces to tighten or add detail in a region.
- [ ] **Bridge** · 🖼 — Connects two SubD or mesh face groups or edge loops with a smooth linking tunnel.
- [ ] **Stitch** · 🖼 — Zips selected SubD or mesh edges together so they become shared edges.
- [ ] **Bevel** · 🖼 — Replaces selected SubD edges or vertices with narrow face strips, hardening the corner while staying smooth.
- [ ] **MultiPipe** · 🖼 — Builds a smooth SubD pipe network over a set of connected curves, resolving the junctions automatically.

### Session 14 — Deform & flow

- [ ] **Bend** · 🖼 — Bends objects along a spine between two points, with control over the arc.
- [ ] **Twist** · 🖼 — Rotates an object progressively along an axis so it spirals between start and end angles.
- [ ] **Taper** · 🖼 — Scales an object progressively along an axis so it narrows or widens towards one end.
- [ ] **Flow** · 🖼 — Re-shapes objects from along a straight base curve onto a target curve, bending them to follow it.
- [ ] **FlowAlongSrf** · 🖼 — Maps objects from a flat base surface onto a target surface, morphing them to its curvature.
- [ ] **CageEdit** · 🖼 — Surrounds objects with a low-point control cage and deforms them by moving its points.
- [ ] **Smooth** · 🖼 — Averages out control point positions to relax curves, surfaces or meshes, with per-axis control.
- [ ] **Fair** · 🖼 — Gently re-smooths a curve to remove kinks and wobbles in its curvature while keeping close to its original shape.
- [ ] **Stretch** · 🖼 — Elongates only the middle region of objects along an axis, leaving the ends undistorted.
- [ ] **Splop** · 🖼 — Copies and morphs an object from a plane onto a surface at picked points, with rotate and scale control while placing.

### Session 15 — Present & document

- [ ] **Make2D** · 🖼 — Generates flat 2D line drawings of the model from a view, with hidden lines on separate layers.
- [ ] **Layout** · 🖼 — Creates a paper-space page with a title-block-ready sheet and viewports onto the model.
- [ ] **Detail** · 🖼 — Adds and manages viewport windows on a layout page, each with its own view and scale.
- [ ] **Dim** — Places a horizontal or vertical linear dimension between two points.
- [ ] **DimAligned** — Places a dimension parallel to the line between its two picked points.
- [ ] **Leader** · 🖼 — Draws an arrowed leader line with attached text.
- [ ] **Text** · 🖼 — Places a block of annotation text at a picked point, styled by the current annotation style.
- [ ] **Hatch** · 🖼 — Fills closed boundaries with a pattern or solid fill.
- [ ] **Print** · `Ctrl+P` · 🖼 — Sends layouts or viewports to a printer or PDF with scale, line width and colour controls.
- [ ] **ClippingPlane** · 🖼 — Places a plane that cuts the viewport display away on one side, revealing a live section.

## Phase 3 — Advanced & specialist

### Session 16 — Mesh & fabrication

- [ ] **Mesh** · 🖼 — Converts NURBS surfaces, polysurfaces or SubD into a polygon mesh with density controls.
- [ ] **MeshRepair** · 🖼 — Opens a guided panel that checks a mesh and walks through fixing its defects step by step.
- [ ] **ReduceMesh** · 🖼 — Lowers a mesh's polygon count while preserving its shape as far as possible.
- [ ] **QuadRemesh** · 🖼 — Rebuilds any mesh, surface or SubD as a clean quad-dominant mesh, optionally converting straight to SubD.
- [ ] **ShrinkWrap** · 🖼 — Wraps a watertight mesh tightly around any collection of geometry, meshes or point clouds.
- [ ] **UnrollSrf** · 🖼 — Flattens developable (single-curvature) surfaces onto a plane, with their marked curves and labels.
- [ ] **Squish** · 🖼 — Flattens doubly curved surfaces or meshes by allowing controlled stretching and compression, and can report the distortion.
- [ ] **FlattenSrf** · 🖼 — Produces a flat, planar version of a surface based on its untrimmed UV structure, keeping the trim curves in place on the flat copy.
- [ ] **OffsetMesh** · 🖼 — Offsets a mesh by a distance, optionally closing the result into a solid.

### Session 17 — Analysis & QA

- [ ] **CurvatureAnalysis** — Shades surfaces with false colour showing Gaussian or mean curvature.
- [ ] **Zebra** · 🖼 — Projects stripe patterns onto surfaces so continuity flaws show as kinked or broken stripes.
- [ ] **DraftAngleAnalysis** · 🖼 — Colours surfaces by their angle from a pull direction.
- [ ] **ShowEdges** · 🖼 — Highlights the edges of surfaces and meshes, with naked and non-manifold edges picked out in colour.
- [ ] **EMap** · 🖼 — Reflects a chosen environment image in the model's surfaces as a quality check.
- [ ] **Dir** · 🖼 — Displays and edits the direction arrows of curves and the normals of surfaces or meshes.
- [ ] **Check** · 🖼 — Tests selected objects for internal errors and reports whether they are valid.
- [ ] **SelBadObjects** — Selects every invalid object in the model in one command.
- [ ] **Audit** · 🖼 — Checks the open model's database for errors and reports what it finds.
- [ ] **List** — Dumps the full internal data structure of an object, down to knots and control points.

### Session 18 — Blocks & reference

- [ ] **Block** · 🖼 — Defines selected geometry as a named block so copies insert as lightweight linked instances.
- [ ] **Insert** · 🖼 — Places an instance of a block definition, or an external file as a block, at a chosen point and scale.
- [ ] **BlockManager** — Lists every block definition in the file with counts, links and update controls.
- [ ] **ExplodeBlock** — Replaces block instances with copies of their component geometry, including bursting nested blocks in one go.
- [ ] **Worksession** · 🖼 — Attaches other Rhino files as read-only references around your active file, so a team can split a big project into parts.
- [ ] **Import** — Brings geometry from another file into the current model, converting from formats like DWG, IGES, STEP, SKP and OBJ.
- [ ] **Export** · 🖼 — Writes the selected objects out to another file and format.
- [ ] **Picture** · 🖼 — Places an image in the model as a picture plane, commonly used to trace scanned drawings or display reference imagery.
- [ ] **Purge** · 🖼 — Deletes unused layers, blocks, materials and other invisible data bloating the file.
- [ ] **SaveSmall** — Saves without render meshes to produce a much smaller file.

### Session 19 — Views, cameras, output

- [ ] **NamedView** · 🖼 — Saves and restores camera positions by name, with thumbnails.
- [ ] **ViewCaptureToFile** — Saves an image of the viewport at chosen resolution, with options for grid and widget visibility.
- [ ] **Turntable** · 🖼 — Spins the model continuously in the viewport.
- [ ] **SetView** · 🖼 — Points the viewport at a standard direction such as Top, Front, Right or Perspective, in world or CPlane terms.
- [ ] **Camera** — Shows or hides the active view's camera widget so its position, target and lens can be manipulated as objects.
- [ ] **Walkabout** · 🖼 — Moves the camera at eye level with walking-style controls.
- [ ] **SectionStyles** — Controls how clipped geometry displays at the cut, including hatch, fill and edge styling per object or layer.
- [ ] **ViewCaptureToClipboard** — Copies a viewport image straight to the clipboard for pasting into emails, decks and documents.
- [ ] **Render** · 🖼 — Renders the current view with the active renderer into the render window.
- [ ] **Sun** · 🖼 — Controls a sun light by date, time and location for accurate shadows.

---

*189 videos across 19 recording sessions. 🖼 = command card already shows its Rhino 9 icon. Suggested pace: one session (~10 videos) per sitting; Phase 1 gives learners a complete beginner journey after seven sittings.*
