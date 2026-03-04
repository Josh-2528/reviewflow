-- Migration: Branding settings table
-- Run this in Supabase SQL Editor after previous migrations

-- Global branding settings (single-row table)
create table public.branding_settings (
  id integer primary key default 1 check (id = 1),
  app_name text not null default 'ReviewFlow',
  logo_url text,
  primary_color text not null default '#2563eb'
);

-- Insert default row
insert into public.branding_settings (id, app_name, logo_url, primary_color)
values (1, 'ReviewFlow', null, '#2563eb');

-- RLS — anyone can read branding, only service role can write
alter table public.branding_settings enable row level security;

create policy "Anyone can read branding" on public.branding_settings
  for select using (true);
