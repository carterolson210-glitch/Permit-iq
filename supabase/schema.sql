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
    'PIQ-' || substr(replace(uuid_generate_v4()::text,'-',''), 1, 8)
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
-- Storage bucket for permit documents
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('permit-documents', 'permit-documents', false)
on conflict (id) do nothing;
