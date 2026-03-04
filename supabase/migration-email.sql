-- Email notification preferences for users table
-- Run this AFTER migration.sql and migration-stripe.sql

alter table public.users add column if not exists email_new_review boolean default true;
alter table public.users add column if not exists email_weekly_summary boolean default true;
