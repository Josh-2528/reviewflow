-- AI Prompt Settings migration
-- Run this AFTER migration-trial.sql
-- Creates the ai_prompt_settings table for managing AI reply generation prompts

create table public.ai_prompt_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  base_system_prompt text,
  star_1_instructions text,
  star_2_instructions text,
  star_3_instructions text,
  star_4_instructions text,
  star_5_instructions text,
  business_context text,
  custom_instructions text,
  contact_email text,
  contact_phone text,
  contact_reference_style text default 'email us at',
  contact_include_on text default 'negative_only',
  tone text default 'friendly',
  custom_tone_description text,
  sign_off text,
  do_not_mention text,
  always_mention text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Unique constraint: only one row per user_id, and only one global (null) row
create unique index idx_ai_prompt_settings_user_id on public.ai_prompt_settings(user_id) where user_id is not null;
create unique index idx_ai_prompt_settings_global on public.ai_prompt_settings((user_id is null)) where user_id is null;

-- RLS
alter table public.ai_prompt_settings enable row level security;

-- Users can view their own settings
create policy "Users can view own ai prompt settings" on public.ai_prompt_settings
  for select using (auth.uid() = user_id);

-- Users can update their own settings (limited fields enforced in API)
create policy "Users can update own ai prompt settings" on public.ai_prompt_settings
  for update using (auth.uid() = user_id);

-- Service role can do everything (for admin operations)
create policy "Service role full access ai prompt settings" on public.ai_prompt_settings
  for all using (true);

-- Trigger for updated_at
create trigger ai_prompt_settings_updated_at
  before update on public.ai_prompt_settings
  for each row execute procedure public.update_updated_at();

-- Insert global defaults row
insert into public.ai_prompt_settings (
  user_id,
  base_system_prompt,
  star_1_instructions,
  star_2_instructions,
  star_3_instructions,
  star_4_instructions,
  star_5_instructions
) values (
  null,
  'You write Google Review replies as a car wash owner. Be professional, be human, keep it short. Rules: Only reference facts from the review and from this prompt. Never invent details, weather, emotions, promises, solutions, or operational changes. Never use placeholders, brackets, or notes. Every reply must be publish-ready. If a reviewer name is available, use their first name. If not, skip it. Only include contact details if provided below. Only use the sign-off if provided below. Never open with Thank you for your feedback or I am sorry to hear that. Never use valued customer, rest assured, we strive to, or your patronage.',
  '2-3 sentences. Acknowledge the issue. Apologise. If contact details are provided, direct them to get in touch. CRITICAL: Only mention what the reviewer actually wrote. Do not add details they did not mention.',
  '2-3 sentences. Acknowledge what went wrong. Apologise. If contact details are provided, direct them to get in touch. CRITICAL: Only mention what the reviewer actually wrote.',
  '2-3 sentences. Acknowledge their concern honestly. No made-up fixes. If contact details are provided, mention them. CRITICAL: Only mention what the reviewer actually wrote.',
  '2-3 sentences. Positive. If they mentioned a gap, acknowledge it briefly. Do not overcompensate. CRITICAL: Only mention what the reviewer actually wrote.',
  '1-2 sentences. Quick and genuine. Acknowledge what they said, move on. CRITICAL: Only mention what the reviewer actually wrote.'
);
