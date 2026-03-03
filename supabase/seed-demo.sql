-- Demo Seed SQL (alternative to seed-demo.ts script)
-- Run this AFTER migration.sql if you want to seed demo data via SQL directly.
--
-- NOTE: This requires a demo user to already exist in auth.users.
-- The recommended approach is to use the TypeScript seed script instead:
--   npm run seed:demo
--
-- This SQL is provided as reference for the demo data shape.

-- To use this, first create a demo user via Supabase Auth dashboard or API,
-- then replace 'YOUR_DEMO_USER_ID' below with the actual UUID.

-- Example (won't run without a real user ID):
/*
INSERT INTO public.users (id, email, business_name, business_location, tone_preference, custom_instructions, auto_publish, onboarding_completed, google_connected)
VALUES (
  'YOUR_DEMO_USER_ID',
  'demo@reviewflow.app',
  'Sparkle & Shine Car Wash',
  'Melbourne, Australia',
  'friendly and professional',
  'Always invite unhappy customers to call us on (03) 9555 0123. Mention our loyalty card when appropriate.',
  false,
  true,
  false
)
ON CONFLICT (id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  business_location = EXCLUDED.business_location;
*/

-- Use `npm run seed:demo` for the full automated seeding experience.
