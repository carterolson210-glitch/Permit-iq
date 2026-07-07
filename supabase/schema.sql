-- PermitIQ Supabase schema
-- Run this in the SQL editor of your Supabase project.
-- It is idempotent: safe to re-run during development.

create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- users (mirrors auth.users with app-level profile fields)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text check (role in ('homeowner','contractor','firm')) default 'homeowner',
  plan text check (plan in ('free','homeowner','contractor','firm')) default 'free',
  plan_expires_at timestamptz,
  stripe_customer_id text,
  referral_code text unique,
  referred_by uuid references public.users(id) on delete set null,
  primary_town text,
  permits_per_year int,
  free_analyses_used int default 0,
  created_at timestamptz default now()
);

-- Auto-create users row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, referral_code)
  values (
    new.id,
    new.email,
    'PIQ-' || substr(replace(gen_random_uuid()::text,'-',''), 1, 8)
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- projects
-- ─────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text not null,
  town text not null,
  category text,
  square_footage int,
  project_value numeric,
  ai_analysis jsonb,
  status text check (status in ('not_started','in_progress','submitted','approved','on_hold')) default 'not_started',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_updated_at_idx on public.projects(updated_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────
-- checklist_items
-- ─────────────────────────────────────────────────────────────
create table if not exists public.checklist_items (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  step_number int not null,
  action text not null,
  details text,
  who text,
  estimated_time text,
  completed boolean default false,
  completed_at timestamptz
);

create index if not exists checklist_items_project_idx on public.checklist_items(project_id, step_number);

-- ─────────────────────────────────────────────────────────────
-- documents
-- ─────────────────────────────────────────────────────────────
create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  file_url text not null,
  uploaded_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- activity_log
-- ─────────────────────────────────────────────────────────────
create table if not exists public.activity_log (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  action text not null,
  details text,
  created_at timestamptz default now()
);

create index if not exists activity_log_project_idx on public.activity_log(project_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- email_subscribers
-- ─────────────────────────────────────────────────────────────
create table if not exists public.email_subscribers (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  source text,
  subscribed_at timestamptz default now(),
  unsubscribed_at timestamptz
);

-- ─────────────────────────────────────────────────────────────
-- referrals
-- ─────────────────────────────────────────────────────────────
create table if not exists public.referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid not null references public.users(id) on delete cascade,
  referee_email text,
  referee_id uuid references public.users(id) on delete set null,
  signed_up boolean default false,
  converted boolean default false,
  created_at timestamptz default now()
);

create index if not exists referrals_referrer_idx on public.referrals(referrer_id);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.checklist_items enable row level security;
alter table public.documents enable row level security;
alter table public.activity_log enable row level security;
alter table public.email_subscribers enable row level security;
alter table public.referrals enable row level security;

-- users
drop policy if exists "users_self_select" on public.users;
create policy "users_self_select" on public.users
  for select using (auth.uid() = id);

drop policy if exists "users_self_update" on public.users;
create policy "users_self_update" on public.users
  for update using (auth.uid() = id);

-- projects
drop policy if exists "projects_owner_all" on public.projects;
create policy "projects_owner_all" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- checklist_items via projects
drop policy if exists "checklist_owner_all" on public.checklist_items;
create policy "checklist_owner_all" on public.checklist_items
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- documents
drop policy if exists "documents_owner_all" on public.documents;
create policy "documents_owner_all" on public.documents
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- activity_log
drop policy if exists "activity_log_owner_all" on public.activity_log;
create policy "activity_log_owner_all" on public.activity_log
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- email_subscribers (insert open via edge function; reads restricted)
drop policy if exists "email_subscribers_insert_anon" on public.email_subscribers;
create policy "email_subscribers_insert_anon" on public.email_subscribers
  for insert with check (true);

-- referrals (referrer can read their own)
drop policy if exists "referrals_referrer_select" on public.referrals;
create policy "referrals_referrer_select" on public.referrals
  for select using (auth.uid() = referrer_id);

drop policy if exists "referrals_referrer_insert" on public.referrals;
create policy "referrals_referrer_insert" on public.referrals
  for insert with check (auth.uid() = referrer_id);

-- ─────────────────────────────────────────────────────────────
-- scan_events: one row per analysis attempt (also used for rate limiting)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.scan_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  status text check (status in ('started','succeeded','failed','refunded')) default 'started',
  consumed_free_scan boolean not null default false,
  town text,
  category text,
  created_at timestamptz default now()
);

create index if not exists scan_events_user_recent_idx
  on public.scan_events(user_id, created_at desc);

alter table public.scan_events enable row level security;

-- Users may read their own scan history; all writes go through the
-- service role inside edge functions.
drop policy if exists "scan_events_self_select" on public.scan_events;
create policy "scan_events_self_select" on public.scan_events
  for select using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Free-scan reservation (atomic; called with service role only)
-- ─────────────────────────────────────────────────────────────
-- Reserves one scan for the user inside a single transaction:
--   * paid plans (not expired) scan without consuming free credits
--   * free plans consume one of 3 credits, incremented under a row lock
--     so concurrent requests cannot exceed the limit
-- Returns: { allowed, reason?, event_id?, remaining }
--   remaining is null for unlimited (paid) plans.
create or replace function public.reserve_scan(
  p_user_id uuid,
  p_town text default null,
  p_category text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  u record;
  v_event uuid;
  v_used int;
  v_limit constant int := 3;
begin
  select * into u from public.users where id = p_user_id for update;
  if not found then
    return jsonb_build_object('allowed', false, 'reason', 'no_user');
  end if;

  if u.plan <> 'free' and (u.plan_expires_at is null or u.plan_expires_at > now()) then
    insert into public.scan_events (user_id, status, consumed_free_scan, town, category)
    values (p_user_id, 'started', false, p_town, p_category)
    returning id into v_event;
    return jsonb_build_object('allowed', true, 'event_id', v_event, 'remaining', null);
  end if;

  v_used := coalesce(u.free_analyses_used, 0);
  if v_used >= v_limit then
    return jsonb_build_object('allowed', false, 'reason', 'limit', 'remaining', 0);
  end if;

  update public.users
    set free_analyses_used = v_used + 1
    where id = p_user_id;

  insert into public.scan_events (user_id, status, consumed_free_scan, town, category)
  values (p_user_id, 'started', true, p_town, p_category)
  returning id into v_event;

  return jsonb_build_object(
    'allowed', true,
    'event_id', v_event,
    'remaining', v_limit - (v_used + 1)
  );
end $$;

-- Refunds a reserved scan when the analysis fails after reservation
-- (AI error, timeout, malformed output). Idempotent per event.
create or replace function public.refund_scan(
  p_event_id uuid
) returns void
language plpgsql security definer set search_path = public as $$
declare
  e record;
begin
  select * into e from public.scan_events where id = p_event_id for update;
  if not found or e.status <> 'started' then
    return;
  end if;

  update public.scan_events set status = 'refunded' where id = p_event_id;

  if e.consumed_free_scan then
    update public.users
      set free_analyses_used = greatest(coalesce(free_analyses_used, 0) - 1, 0)
      where id = e.user_id;
  end if;
end $$;

create or replace function public.finish_scan(
  p_event_id uuid,
  p_status text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.scan_events
    set status = p_status
    where id = p_event_id and status = 'started'
      and p_status in ('succeeded','failed');
end $$;

-- These functions must only be callable by the service role (edge functions).
revoke all on function public.reserve_scan(uuid, text, text) from public, anon, authenticated;
revoke all on function public.refund_scan(uuid) from public, anon, authenticated;
revoke all on function public.finish_scan(uuid, text) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Storage bucket for permit documents
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('permit-documents', 'permit-documents', false)
on conflict (id) do nothing;
