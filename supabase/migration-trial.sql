-- Trial system migration
-- Run this AFTER migration-stripe.sql
-- Adds trial_started_at column to track 14-day free trial

alter table public.users add column if not exists trial_started_at timestamptz;

-- Backfill existing users: set trial_started_at to their created_at
update public.users set trial_started_at = created_at where trial_started_at is null;

-- For new signups, the handle_new_user trigger will set trial_started_at = now()
-- Update the trigger function:
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, trial_started_at)
  values (new.id, new.email, now());
  return new;
end;
$$ language plpgsql security definer;
