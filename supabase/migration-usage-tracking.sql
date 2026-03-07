-- API Usage Tracking migration
-- Run this AFTER migration-locations.sql
-- Creates the api_usage_log table for tracking Anthropic API usage and costs

create table public.api_usage_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  action text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_cost_usd numeric(10, 6) not null default 0,
  created_at timestamptz default now()
);

-- Indexes for efficient admin queries
create index idx_api_usage_log_user_id on public.api_usage_log(user_id);
create index idx_api_usage_log_created_at on public.api_usage_log(created_at);
create index idx_api_usage_log_action on public.api_usage_log(action);

-- Enable RLS
alter table public.api_usage_log enable row level security;

-- Users can view their own usage
create policy "Users can view own api usage" on public.api_usage_log
  for select using (auth.uid() = user_id);

-- Service role has full access (for server-side logging and admin queries)
create policy "Service role full access api usage" on public.api_usage_log
  for all using (true);
