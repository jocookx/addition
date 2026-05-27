-- Migration: 0004_rhino_microlearning_split
-- Splits "Rhino Beginner" (course-1773656744906-ojoph, 11 modules, 141 lessons)
-- into 11 standalone micro-courses feeding the rhino-beginner learning path.
--
-- Data is split across two sources:
--   • 8 modules already have their lessons in the big course → re-parent directly
--   • 3 modules (Editing Geometry, Analysing, Drafting) have 0 lessons in the big
--     course but their lessons live in the matching core-rhino-csv-* course → move
--     those modules across, then clean up the now-empty CSV shell
--
-- Safe to re-run: course inserts use ON CONFLICT DO NOTHING.
-- Run in: Supabase SQL Editor → New Query → paste → Run

DO $$
DECLARE
  v_module     RECORD;
  v_csv_mod    RECORD;
  v_new_id     TEXT;
  v_csv_id     TEXT;
  v_course_ids TEXT[] := ARRAY[]::TEXT[];
BEGIN

  -- ── Step 1: One micro-course per module ───────────────────────────────────
  FOR v_module IN
    SELECT
      m.id,
      m.title,
      m.sort_order,
      (SELECT COUNT(*) FROM addition_lessons WHERE module_id = m.id) AS lesson_count
    FROM   addition_modules m
    WHERE  m.course_id = 'course-1773656744906-ojoph'
    ORDER  BY m.sort_order
  LOOP
    -- Stable ID + matching CSV course ID from the same slugification rule
    v_new_id := 'rhino-'
             || lower(regexp_replace(trim(v_module.title), '[^a-zA-Z0-9]+', '-', 'g'));
    v_csv_id := 'core-rhino-csv-'
             || lower(regexp_replace(trim(v_module.title), '[^a-zA-Z0-9]+', '-', 'g'));

    -- Create the micro-course (idempotent)
    INSERT INTO addition_courses (id, type, title, software, status)
    VALUES (v_new_id, 'course', v_module.title, 'Rhino', 'Draft')
    ON CONFLICT (id) DO NOTHING;

    IF v_module.lesson_count > 0 THEN
      -- ── Case A: lessons already in the big course module ──────────────────
      UPDATE addition_modules
      SET    course_id = v_new_id, updated_at = now()
      WHERE  id = v_module.id;

      UPDATE addition_lessons
      SET    course_id = v_new_id, updated_at = now()
      WHERE  module_id = v_module.id;

    ELSE
      -- ── Case B: lessons live in the matching CSV course ───────────────────
      -- Move every module from the CSV course into the new micro-course
      FOR v_csv_mod IN
        SELECT id FROM addition_modules WHERE course_id = v_csv_id
      LOOP
        UPDATE addition_modules
        SET    course_id = v_new_id, updated_at = now()
        WHERE  id = v_csv_mod.id;

        UPDATE addition_lessons
        SET    course_id = v_new_id, updated_at = now()
        WHERE  module_id = v_csv_mod.id;
      END LOOP;

      -- Remove the now-empty placeholder module from the big course
      DELETE FROM addition_modules WHERE id = v_module.id;
    END IF;

    v_course_ids := v_course_ids || v_new_id;
    RAISE NOTICE 'Micro-course ready: % (%)', v_new_id, v_module.title;
  END LOOP;

  -- ── Step 2: Update the rhino-beginner learning path ──────────────────────
  UPDATE addition_learning_paths
  SET    course_ids = v_course_ids,
         updated_at = now()
  WHERE  slug = 'rhino-beginner';

  RAISE NOTICE 'Path updated with % courses', array_length(v_course_ids, 1);

  -- ── Step 3: Delete the original big course shell ──────────────────────────
  -- All modules have been re-parented or deleted — no cascade risk.
  DELETE FROM addition_courses WHERE id = 'course-1773656744906-ojoph';

  -- ── Step 4: Delete the 3 absorbed CSV courses (now empty shells) ──────────
  DELETE FROM addition_courses
  WHERE  id IN (
    'core-rhino-csv-editing-geometry',
    'core-rhino-csv-analysing',
    'core-rhino-csv-drafting'
  );

  -- ── Step 5: Delete the remaining empty CSV shells ─────────────────────────
  -- These had 0 lessons all along — their content was always in the big course.
  DELETE FROM addition_courses
  WHERE  id IN (
    'core-rhino-csv-foundation',
    'core-rhino-csv-creating-geometry',
    'core-rhino-csv-user-interface',
    'core-rhino-csv-precision-modelling',
    'core-rhino-csv-transforming-geometry',
    'core-rhino-csv-importing-exporting',
    'core-rhino-csv-rendering',
    'core-rhino-csv-printing-layouts',
    'core-rhino-csv-sculpting'    -- 0 lessons, no big-course counterpart
  );

  RAISE NOTICE 'Cleanup complete';
END;
$$;

-- ── Verify ────────────────────────────────────────────────────────────────────
-- Should show 11 rhino-* courses, each with their lesson counts (141 total)
SELECT
  c.id,
  c.title,
  COUNT(DISTINCT m.id) AS modules,
  COUNT(l.id)          AS lessons
FROM   addition_courses c
LEFT   JOIN addition_modules m ON m.course_id = c.id
LEFT   JOIN addition_lessons l ON l.module_id = m.id
WHERE  c.id LIKE 'rhino-%'
GROUP  BY c.id, c.title
ORDER  BY c.id;
