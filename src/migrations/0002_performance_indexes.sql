-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0002: Create missing tables + performance indexes
--
-- Run once in Supabase SQL editor (Dashboard → SQL Editor → New query).
-- All statements use IF NOT EXISTS so they are safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Create addition_rate_limits (used by server-side rate limiter) ─────────
-- DDL was previously only in a code comment; creating it here properly.
create table if not exists addition_rate_limits (
  key       text        primary key,
  count     int         not null default 0,
  reset_at  timestamptz not null
);

-- ── 2. Lesson progress ────────────────────────────────────────────────────────
create index if not exists idx_lesson_progress_user
  on addition_lesson_progress(user_id);

create index if not exists idx_lesson_progress_user_lesson
  on addition_lesson_progress(user_id, lesson_id);

-- ── 3. Enrollments ────────────────────────────────────────────────────────────
create index if not exists idx_enrollments_user
  on addition_enrollments(user_id);

create index if not exists idx_enrollments_user_course
  on addition_enrollments(user_id, course_id);

-- ── 4. Path enrolments ───────────────────────────────────────────────────────
create index if not exists idx_path_enrolments_user
  on addition_path_enrolments(user_id);

-- ── 5. Commands ───────────────────────────────────────────────────────────────
-- addition_commands uses 'software' and 'menu' columns (no 'category' column)
create index if not exists idx_commands_software
  on addition_commands(software);

-- ── 6. Workshops ──────────────────────────────────────────────────────────────
create index if not exists idx_workshops_upcoming
  on addition_workshops(upcoming)
  where upcoming = true;

-- ── 7. Rate limits ────────────────────────────────────────────────────────────
create index if not exists idx_rate_limits_reset_at
  on addition_rate_limits(reset_at);

create index if not exists idx_rate_limits_key
  on addition_rate_limits(key);

-- ── 8. Student verifications ─────────────────────────────────────────────────
create index if not exists idx_student_verifications_user
  on addition_student_verifications(user_id);

-- ── Verify ───────────────────────────────────────────────────────────────────

select tablename, indexname
from pg_indexes
where schemaname = 'public'
  and tablename like 'addition_%'
order by tablename, indexname;
