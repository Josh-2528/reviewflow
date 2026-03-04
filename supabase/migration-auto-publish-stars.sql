-- Smart auto-publish by star rating migration
-- Run this AFTER migration-ai-prompts.sql
-- Replaces the boolean auto_publish with star-rating-based auto-publish

-- Add auto_publish_stars column (JSON array of star ratings to auto-publish)
-- Default: [4, 5] — auto-publish positive reviews, hold negative for approval
alter table public.users add column if not exists auto_publish_stars jsonb default '[4, 5]'::jsonb;

-- Migrate existing auto_publish boolean values:
-- If auto_publish was true → set to [1,2,3,4,5] (publish all, matching old behavior)
-- If auto_publish was false → set to [4,5] (new smart default)
update public.users
set auto_publish_stars = case
  when auto_publish = true then '[1, 2, 3, 4, 5]'::jsonb
  else '[4, 5]'::jsonb
end
where auto_publish_stars = '[4, 5]'::jsonb;

-- Add auto_published flag to replies table to track which were auto-published
alter table public.replies add column if not exists auto_published boolean default false;
