-- Stripe subscription columns for users table
-- Run this AFTER migration.sql

alter table public.users add column if not exists stripe_customer_id text;
alter table public.users add column if not exists stripe_subscription_id text;
alter table public.users add column if not exists plan_id text default 'free';
alter table public.users add column if not exists subscription_status text;
alter table public.users add column if not exists subscription_current_period_end timestamptz;

-- Index for Stripe customer lookup
create index if not exists idx_users_stripe_customer_id on public.users(stripe_customer_id);
