-- Migration: 0004_rhino_microlearning_split
-- Splits the monolithic "Rhino Beginner" course (course-1773656744906-ojoph)
-- into standalone micro-courses — one per module — and updates the
-- rhino-beginner learning path to reference them.
--
-- What it does:
--   1. For each module in course-1773656744906-ojoph, create a new standalone course
--   2. Re-parent the module (and its lessons' denormalised course_id) to the new course
--   3. Update addition_learning_paths "rhino-beginner" with the new course IDs
--   4. Delete the old core-rhino-csv-* placeholder courses (had 0 lessons)
--   5. Delete the original big course (modules re-parented, no cascade risk)
--
-- Safe to re-run: ON CONFLICT DO NOTHING on course inserts.
-- Run in: Supabase SQL Editor → New Query → paste → Run

DO $$
DECLARE
  v_module     RECORD;
  v_new_id     TEXT;
  v_course_ids TEXT[] := ARRAY[]::TEXT[];
BEGIN

  -- ── Step 1: One micro-course per module ────────────────────────────────────
  FOR v_module IN
    SELECT id, title, sort_order
    FROM   addition_modules
    WHERE  course_id = 'course-1773656744906-ojoph'
    ORDER  BY sort_order
  LOOP
    -- Stable slug-based ID from the module title
    -- e.g. "User Interface" → "rhino-user-interface"
    v_new_id := 'rhino-'
             || lower(regexp_replace(trim(v_module.title), '[^a-zA-Z0-9]+', '-', 'g'));

    -- Create the micro-course (idempotent)
    INSERT INTO addition_courses (id, type, title, software, status)
    VALUES (v_new_id, 'course', v_module.title, 'Rhino', 'Draft')
    ON CONFLICT (id) DO NOTHING;

    -- Re-parent module to the new micro-course
    UPDATE addition_modules
    SET    course_id  = v_new_id,
           updated_at = now()
    WHERE  id = v_module.id;

    -- Update denormalised course_id on every lesson in this module
    UPDATE addition_lessons
    SET    course_id  = v_new_id,
           updated_at = now()
    WHERE  module_id = v_module.id;

    v_course_ids := v_course_ids || v_new_id;

    RAISE NOTICE 'Micro-course ready: % — %', v_new_id, v_module.title;
  END LOOP;

  -- ── Step 2: Update (or create) the Rhino Beginner learning path ───────────
  UPDATE addition_learning_paths
  SET    course_ids = v_course_ids,
         updated_at = now()
  WHERE  slug = 'rhino-beginner';

  IF NOT FOUND THEN
    INSERT INTO addition_learning_paths
      (id, title, slug, description, outcome, level, audience, software, course_ids, sort_order)
    VALUES (
      'rhino-beginner',
      'Rhino Beginner',
      'rhino-beginner',
      'A complete beginner path through Rhino — from first principles to confident modelling.',
      'Navigate Rhino fluently, understand NURBS, and build your first complete 3D model.',
      'explorer',
      'Complete beginners to Rhino',
      ARRAY['Rhino'],
      v_course_ids,
      5
    );
    RAISE NOTICE 'Created new rhino-beginner learning path';
  ELSE
    RAISE NOTICE 'Updated rhino-beginner path with % courses', array_length(v_course_ids, 1);
  END IF;

  -- ── Step 3: Remove old CSV placeholder courses (empty shells) ─────────────
  -- These were created by an earlier migration attempt and have 0–10 lessons
  -- that were never the canonical data. All real lessons are accounted for above.
  DELETE FROM addition_courses WHERE id LIKE 'core-rhino-csv-%';
  RAISE NOTICE 'Deleted core-rhino-csv-* placeholder courses';

  -- ── Step 4: Delete the now-empty original big course ──────────────────────
  -- All modules have been re-parented; no cascade risk.
  DELETE FROM addition_courses WHERE id = 'course-1773656744906-ojoph';
  RAISE NOTICE 'Deleted original monolithic course';

END;
$$;

-- ── Verify ────────────────────────────────────────────────────────────────────
SELECT
  c.id,
  c.title,
  COUNT(DISTINCT m.id) AS modules,
  COUNT(l.id)          AS lessons
FROM   addition_courses c
LEFT   JOIN addition_modules m ON m.course_id = c.id
LEFT   JOIN addition_lessons l ON l.module_id = m.id
WHERE  c.software = 'Rhino'
  AND  c.type     = 'course'
GROUP  BY c.id, c.title
ORDER  BY c.id;
