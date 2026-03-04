-- Test review flag migration
-- Run this AFTER migration-auto-publish-stars.sql
-- Adds a test_review flag so admin-injected test reviews can be identified

alter table public.reviews add column if not exists test_review boolean default false;
