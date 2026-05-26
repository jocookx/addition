-- Migration: 0003_student_verifications
-- Creates the addition_student_verifications table used by the student
-- verification wizard (/api/v1/auth/student-verify) and the billing
-- checkout gate (/api/v1/billing/checkout).
--
-- Run in: Supabase SQL Editor → New Query → paste → Run

create table if not exists addition_student_verifications (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  status          text        not null default 'pending'
                              check (status in ('pending', 'approved', 'rejected')),
  method          text        not null default 'ai_document'
                              check (method in ('email_domain', 'ai_document', 'manual')),
  institution     text,
  evidence_path   text,
  ai_confidence   numeric(4,3),
  ai_reason       text,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- One verification record per user — upsert on conflict resolves updates
  constraint addition_student_verifications_user_id_key unique (user_id)
);

-- Index already created in 0002 — only add if not yet present
create index if not exists idx_student_verifications_user
  on addition_student_verifications(user_id);

-- Status filter index (admin views pending queue)
create index if not exists idx_student_verifications_status
  on addition_student_verifications(status)
  where status = 'pending';

-- Row-level security: users can read their own record, admins can read all
alter table addition_student_verifications enable row level security;

-- Users can see their own verification record
create policy "users can read own verification"
  on addition_student_verifications
  for select
  using (auth.uid() = user_id);

-- Service role bypasses RLS (used by all API routes via createSupabaseServiceClient)
-- No additional policy needed — service role always bypasses RLS.

-- Updated-at trigger
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger addition_student_verifications_updated_at
  before update on addition_student_verifications
  for each row execute procedure set_updated_at();
