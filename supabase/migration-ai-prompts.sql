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
  'You are a professional review reply assistant for a car wash business. Write friendly, human-sounding replies that match the business owner''s tone. Never sound robotic or generic. Address specific details mentioned in the review. Keep replies concise — 2-4 sentences max.',
  'Apologise sincerely. Acknowledge their frustration. Invite them to contact the business directly to resolve the issue. Never offer refunds or compensation unless the business instructions say otherwise. Keep it professional and empathetic.',
  'Acknowledge the mixed experience. Thank them for the feedback. Mention that the team is working to improve. Invite them to give you another try.',
  'Thank them for the honest feedback. Acknowledge what went well and what could improve. Show you take feedback seriously.',
  'Thank them warmly. Acknowledge the specific positive things they mentioned. Express hope to earn that 5th star next time.',
  'Thank them enthusiastically. Reference specific details from their review. Invite them back. Keep it warm and genuine.'
);
