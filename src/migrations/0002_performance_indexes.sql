-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0002: Performance indexes
--
-- Run once in Supabase SQL editor (Dashboard → SQL Editor → New query).
-- All statements use CREATE INDEX IF NOT EXISTS so they are safe to re-run.
--
-- These indexes cover the hot query paths in the application:
--   • lesson_progress  — per-user progress look-ups
--   • enrollments      — per-user enrollment look-ups
--   • commands         — filter by software
--   • workshops        — upcoming workshops dashboard filter
--   • rate_limits      — TTL-based expiry scans (GC)
--   • lessons          — per-course lesson queries (not in 0001)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Lesson progress ────────────────────────────────────────────────────────
-- Most common query: "what lessons has this user completed?"
create index if not exists idx_lesson_progress_user
  on addition_lesson_progress(user_id);

-- Combined index for the per-course progress query (user + lesson_id)
create index if not exists idx_lesson_progress_user_lesson
  on addition_lesson_progress(user_id, lesson_id);

-- ── 2. Enrollments ────────────────────────────────────────────────────────────
-- "What courses is this user enrolled in?"
create index if not exists idx_enrollments_user
  on addition_enrollments(user_id);

create index if not exists idx_enrollments_user_course
  on addition_enrollments(user_id, course_id);

-- ── 3. Commands ───────────────────────────────────────────────────────────────
-- "Show me all commands for Blender"
create index if not exists idx_commands_software
  on addition_commands(software);

-- Combined index for software + category filter
create index if not exists idx_commands_software_category
  on addition_commands(software, category);

-- ── 4. Workshops ──────────────────────────────────────────────────────────────
-- Partial index — only index the upcoming workshops (the tiny live subset)
create index if not exists idx_workshops_upcoming
  on addition_workshops(upcoming)
  where upcoming = true;

-- ── 5. Rate limits ────────────────────────────────────────────────────────────
-- GC query: DELETE FROM addition_rate_limits WHERE reset_at < now()
create index if not exists idx_rate_limits_reset_at
  on addition_rate_limits(reset_at);

-- Look-up by key is the primary hot path
create index if not exists idx_rate_limits_key
  on addition_rate_limits(key);

-- ── 6. Student verifications ─────────────────────────────────────────────────
create index if not exists idx_student_verifications_user
  on addition_student_verifications(user_id);

-- ── 7. Subscriptions ─────────────────────────────────────────────────────────
create index if not exists idx_subscriptions_user
  on addition_subscriptions(user_id);

create index if not exists idx_subscriptions_stripe_customer
  on addition_subscriptions(stripe_customer_id);

-- ── 8. Search log ────────────────────────────────────────────────────────────
create index if not exists idx_search_log_user
  on addition_search_log(user_id);

create index if not exists idx_search_log_created
  on addition_search_log(created_at desc);

-- ── Verify ───────────────────────────────────────────────────────────────────

select
  schemaname,
  tablename,
  indexname
from pg_indexes
where schemaname = 'public'
  and tablename like 'addition_%'
order by tablename, indexname;
