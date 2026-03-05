-- Multi-location support migration
-- Run this AFTER migration-ai-prompts.sql
-- Creates the locations table and adds location_id columns to existing tables

-- ── Locations table ──────────────────────────────────────────────
create table public.locations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  google_account_id text,
  google_location_id text,
  location_name text,
  location_address text,
  contact_name text,
  contact_email text,
  contact_phone text,
  is_primary boolean default false,
  created_at timestamptz default now()
);

-- Indexes
create index idx_locations_user_id on public.locations(user_id);

-- RLS
alter table public.locations enable row level security;

create policy "Users can view own locations" on public.locations
  for select using (auth.uid() = user_id);

create policy "Users can insert own locations" on public.locations
  for insert with check (auth.uid() = user_id);

create policy "Users can update own locations" on public.locations
  for update using (auth.uid() = user_id);

create policy "Users can delete own locations" on public.locations
  for delete using (auth.uid() = user_id);

create policy "Service role full access locations" on public.locations
  for all using (true);

-- ── Add location_id to reviews ───────────────────────────────────
alter table public.reviews add column location_id uuid references public.locations(id) on delete set null;
create index idx_reviews_location_id on public.reviews(location_id);

-- ── Add location_id to ai_prompt_settings ────────────────────────
alter table public.ai_prompt_settings add column location_id uuid references public.locations(id) on delete cascade;

-- Drop the old unique constraint on user_id (since now we can have multiple per user with different location_ids)
-- The old index only allowed one row per user_id. We need per-user-per-location.
-- Keep backward compat: rows with location_id=null are the user's default settings.

-- ── Add location_id to activity_log ──────────────────────────────
alter table public.activity_log add column location_id uuid references public.locations(id) on delete set null;
