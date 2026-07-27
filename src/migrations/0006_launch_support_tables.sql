-- Migration: 0006_launch_support_tables
-- Safe to re-run. Adds launch support tables used by admin access and search analytics.

create extension if not exists pg_trgm;

alter table public.addition_courses
  add column if not exists access_level text not null default 'Free';

do $$ begin
  alter table public.addition_courses
    add constraint addition_courses_access_level_check
    check (access_level in ('Free', 'Pro', 'Student', 'Workshop', 'Purchased', 'Locked', 'Admin only'));
exception when duplicate_object then null;
end $$;

create table if not exists public.addition_admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.addition_admins enable row level security;

create table if not exists public.search_synonyms (
  id uuid primary key default gen_random_uuid(),
  user_phrase text not null,
  command_name text,
  content_id text,
  problem_slug text,
  software text,
  weight numeric(6,3) not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists search_synonyms_phrase_idx
  on public.search_synonyms using gin (user_phrase gin_trgm_ops);

create index if not exists search_synonyms_command_idx
  on public.search_synonyms(command_name)
  where command_name is not null;

create table if not exists public.search_problems (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  software text,
  problem_type text not null default 'general',
  user_phrases text[] not null default '{}',
  solution_summary text,
  confidence_keywords text[] not null default '{}',
  clarification_questions jsonb not null default '[]'::jsonb,
  related_command_names text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists search_problems_title_idx
  on public.search_problems using gin (title gin_trgm_ops);

create table if not exists public.search_fixes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  software text,
  symptoms text[] not null default '{}',
  solution_steps jsonb not null default '[]'::jsonb,
  related_command_names text[] not null default '{}',
  estimated_minutes integer not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists search_fixes_title_idx
  on public.search_fixes using gin (title gin_trgm_ops);

create table if not exists public.search_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  raw_query text not null,
  normalised_query text not null,
  detected_intent text,
  detected_software text,
  confidence_score integer not null default 0,
  result_count integer not null default 0,
  results_returned jsonb not null default '[]'::jsonb,
  clarification_needed boolean not null default false,
  clarification_shown jsonb not null default '[]'::jsonb,
  no_result boolean not null default false,
  clicked_item_id text,
  clicked_item_type text,
  created_at timestamptz not null default now()
);

create index if not exists search_logs_created_at_idx
  on public.search_logs(created_at desc);

create index if not exists search_logs_no_result_idx
  on public.search_logs(no_result)
  where no_result = true;

create table if not exists public.search_failed_searches (
  id uuid primary key default gen_random_uuid(),
  search_log_id uuid references public.search_logs(id) on delete set null,
  raw_query text not null,
  normalised_query text not null,
  reason text not null default 'no_match',
  reviewed boolean not null default false,
  admin_notes text,
  suggested_synonym text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists search_failed_searches_created_at_idx
  on public.search_failed_searches(created_at desc);

create index if not exists search_failed_searches_reviewed_idx
  on public.search_failed_searches(reviewed);
