-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0001: Normalise course modules and lessons into relational tables
--
-- Run once in Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- BEFORE running this migration:
--   1. Take a Supabase database backup (Dashboard → Settings → Database → Backups)
--   2. Confirm addition_courses.modules JSONB column exists and has data
--   3. Run the migration during low-traffic hours
--
-- AFTER running:
--   The application reads/writes from addition_modules + addition_lessons.
--   The addition_courses.modules JSONB column is kept for a transition period
--   and can be dropped after the next deployment is stable.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Create addition_modules ────────────────────────────────────────────────

create table if not exists addition_modules (
  id          text        primary key,
  course_id   text        not null references addition_courses(id) on delete cascade,
  title       text        not null default 'Untitled module',
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_modules_course_id on addition_modules(course_id);
create index if not exists idx_modules_sort     on addition_modules(course_id, sort_order);

-- ── 2. Create addition_lessons ────────────────────────────────────────────────

create table if not exists addition_lessons (
  id              text        primary key,
  module_id       text        not null references addition_modules(id) on delete cascade,
  course_id       text        not null,   -- denormalised for fast single-course queries
  title           text        not null default 'Untitled lesson',
  video_url       text        not null default '',
  video_id        text,                   -- Cloudflare Stream video UID
  image           text        not null default '',
  content         text        not null default '',
  duration_min    int,
  sort_order      int         not null default 0,
  published       boolean     not null default false,
  -- Extra fields (transcript, steps, practice, etc.) stored as JSONB
  -- rather than adding many nullable columns
  metadata        jsonb       not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_lessons_module_id  on addition_lessons(module_id);
create index if not exists idx_lessons_course_id  on addition_lessons(course_id);
create index if not exists idx_lessons_sort       on addition_lessons(module_id, sort_order);
-- Useful for the "missing video" dashboard filter
create index if not exists idx_lessons_no_video   on addition_lessons(course_id)
  where video_url = '' and video_id is null;

-- ── 3. Updated-at trigger (shared function) ───────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_modules_updated_at on addition_modules;
create trigger trg_modules_updated_at
  before update on addition_modules
  for each row execute function set_updated_at();

drop trigger if exists trg_lessons_updated_at on addition_lessons;
create trigger trg_lessons_updated_at
  before update on addition_lessons
  for each row execute function set_updated_at();

-- ── 4. Data migration: JSONB → relational rows ───────────────────────────────
-- Safe to re-run: ON CONFLICT DO NOTHING prevents duplicate inserts.

do $$
declare
  course_rec  record;
  module_json jsonb;
  lesson_json jsonb;
  mod_idx     int;
  les_idx     int;
  mod_id      text;
  les_id      text;
  extra_keys  text[] := array[
    'id','title','video','videoId','image','content','durationMin'
  ];
  metadata    jsonb;
begin
  for course_rec in
    select id, modules
    from   addition_courses
    where  type in ('course', 'core')
      and  modules is not null
      and  jsonb_typeof(modules) = 'array'
  loop
    mod_idx := 0;

    for module_json in select * from jsonb_array_elements(course_rec.modules) loop
      mod_id := module_json->>'id';
      if mod_id is null or mod_id = '' then
        mod_idx := mod_idx + 1;
        continue;
      end if;

      insert into addition_modules (id, course_id, title, sort_order)
      values (
        mod_id,
        course_rec.id,
        coalesce(nullif(module_json->>'title', ''), 'Untitled module'),
        mod_idx
      )
      on conflict (id) do nothing;

      les_idx := 0;

      if jsonb_typeof(module_json->'lessons') = 'array' then
        for lesson_json in select * from jsonb_array_elements(module_json->'lessons') loop
          les_id := lesson_json->>'id';
          if les_id is null or les_id = '' then
            les_idx := les_idx + 1;
            continue;
          end if;

          -- Build metadata JSONB from the remaining keys
          metadata := lesson_json;
          for i in 1..array_length(extra_keys, 1) loop
            metadata := metadata - extra_keys[i];
          end loop;

          insert into addition_lessons (
            id, module_id, course_id,
            title, video_url, video_id,
            image, content, duration_min,
            sort_order, metadata
          ) values (
            les_id,
            mod_id,
            course_rec.id,
            coalesce(nullif(lesson_json->>'title', ''), 'Untitled lesson'),
            coalesce(lesson_json->>'video', ''),
            nullif(lesson_json->>'videoId', ''),
            coalesce(lesson_json->>'image', ''),
            coalesce(lesson_json->>'content', ''),
            (lesson_json->>'durationMin')::int,
            les_idx,
            metadata
          )
          on conflict (id) do nothing;

          les_idx := les_idx + 1;
        end loop;
      end if;

      mod_idx := mod_idx + 1;
    end loop;
  end loop;
end $$;

-- ── 5. Verify migration ───────────────────────────────────────────────────────

select
  'addition_modules' as table_name,
  count(*) as row_count
from addition_modules
union all
select
  'addition_lessons',
  count(*)
from addition_lessons;

-- ─────────────────────────────────────────────────────────────────────────────
-- Optional cleanup (run AFTER confirming the new tables work in production):
--
--   alter table addition_courses drop column if exists modules;
--
-- Do NOT drop the column until the application is stable on the new tables.
-- ─────────────────────────────────────────────────────────────────────────────
