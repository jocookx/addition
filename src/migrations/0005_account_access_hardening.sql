-- Run in Supabase SQL Editor before deploying the account/resources/workshop hardening code.
-- Safe to re-run.

alter table public.addition_users
  add column if not exists phone text not null default '',
  add column if not exists organisation text not null default '',
  add column if not exists role text not null default '',
  add column if not exists timezone text not null default 'Europe/London',
  add column if not exists software_preferences text[] not null default '{}',
  add column if not exists primary_goal text not null default '',
  add column if not exists stripe_customer_id text not null default '',
  add column if not exists stripe_subscription_id text not null default '',
  add column if not exists subscription_status text not null default 'inactive',
  add column if not exists billing_interval text not null default '';

alter table public.addition_users drop constraint if exists addition_users_plan_check;
alter table public.addition_users
  add constraint addition_users_plan_check check (plan in ('free', 'pro', 'team', 'student'));

alter table public.addition_student_verifications
  add column if not exists method text not null default 'manual',
  add column if not exists ai_confidence numeric(4,3),
  add column if not exists ai_reason text;

alter table public.addition_workshops
  add column if not exists start_time timestamptz,
  add column if not exists end_time timestamptz,
  add column if not exists live_provider text not null default 'zoom',
  add column if not exists joining_url text not null default '',
  add column if not exists join_url text not null default '',
  add column if not exists host_url text not null default '',
  add column if not exists meeting_id text not null default '',
  add column if not exists passcode text not null default '',
  add column if not exists live_embed_url text not null default '',
  add column if not exists joining_details text not null default '',
  add column if not exists calendar_url text not null default '',
  add column if not exists pre_work text[] not null default '{}',
  add column if not exists resources text[] not null default '{}',
  add column if not exists recording_status text not null default 'none',
  add column if not exists recording_url text not null default '',
  add column if not exists recording_embed_url text not null default '',
  add column if not exists recording_duration text not null default '',
  add column if not exists recording_thumbnail text not null default '',
  add column if not exists recording_uploaded_at timestamptz,
  add column if not exists recording_access_level text not null default 'booked_users';

alter table public.addition_workshop_registrations
  drop constraint if exists addition_workshop_registrations_status_check;
alter table public.addition_workshop_registrations
  add constraint addition_workshop_registrations_status_check
  check (status in ('registered', 'confirmed', 'waitlisted', 'cancelled', 'completed', 'refunded'));

alter table public.addition_command_progress
  add column if not exists attempted_count integer not null default 0,
  add column if not exists correct_count integer not null default 0,
  add column if not exists incorrect_count integer not null default 0,
  add column if not exists confidence integer not null default 0,
  add column if not exists mastery_state text not null default 'not_started';

alter table public.addition_command_progress drop constraint if exists addition_command_progress_status_check;
alter table public.addition_command_progress
  add constraint addition_command_progress_status_check
  check (status in ('new', 'learning', 'mastered', 'not_started', 'practising', 'confident'));

do $$ begin
  alter table public.addition_users
    add constraint addition_users_primary_goal_check
    check (
      primary_goal = ''
      or primary_goal in ('learn_rhino', 'learn_revit', 'learn_grasshopper', 'ai_digital_design', 'workshop_training', 'career_development')
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.addition_users
    add constraint addition_users_subscription_status_check
    check (subscription_status in ('inactive', 'active', 'trialing', 'past_due', 'cancelled', 'unpaid', 'payment_failed'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.addition_workshops
    add constraint addition_workshops_live_provider_check
    check (live_provider in ('zoom', 'youtube', 'vimeo', 'custom', 'other'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.addition_workshops
    add constraint addition_workshops_recording_status_check
    check (recording_status in ('none', 'processing', 'available', 'failed'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.addition_workshops
    add constraint addition_workshops_recording_access_level_check
    check (recording_access_level in ('booked_users', 'pro', 'student', 'purchased', 'free'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.addition_command_progress
    add constraint addition_command_progress_mastery_state_check
    check (mastery_state in ('not_started', 'practising', 'confident', 'mastered'));
exception when duplicate_object then null;
end $$;

do $$ begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'addition_toolkit'
  ) then
    alter table public.addition_toolkit drop constraint if exists addition_toolkit_content_type_check;
    alter table public.addition_toolkit
      add constraint addition_toolkit_content_type_check
      check (content_type in ('command', 'combo', 'course', 'resource'));
  end if;
end $$;

create index if not exists addition_users_stripe_customer_idx
  on public.addition_users(stripe_customer_id)
  where stripe_customer_id <> '';

create index if not exists addition_users_subscription_status_idx
  on public.addition_users(subscription_status);
