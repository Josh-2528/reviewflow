-- Supabase SQL Migration
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  business_name text,
  business_location text,
  google_access_token text,
  google_refresh_token text,
  google_account_id text,
  google_location_id text,
  tone_preference text default 'friendly and professional',
  custom_instructions text,
  auto_publish boolean default false,
  onboarding_completed boolean default false,
  google_connected boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Reviews table
create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  google_review_id text unique not null,
  reviewer_name text not null,
  reviewer_photo_url text,
  star_rating integer not null check (star_rating >= 1 and star_rating <= 5),
  review_text text,
  review_created_at timestamptz not null,
  has_existing_reply boolean default false,
  status text not null default 'new' check (status in ('new', 'reply_generated', 'approved', 'published', 'skipped')),
  created_at timestamptz default now()
);

-- Replies table
create table public.replies (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  generated_text text not null,
  edited_text text,
  final_text text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'published', 'rejected')),
  published_at timestamptz,
  created_at timestamptz default now()
);

-- Activity log table
create table public.activity_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  action text not null check (action in ('review_detected', 'reply_generated', 'reply_approved', 'reply_published', 'reply_edited', 'reply_rejected')),
  review_id uuid references public.reviews(id) on delete set null,
  details text,
  created_at timestamptz default now()
);

-- Indexes for performance
create index idx_reviews_user_id on public.reviews(user_id);
create index idx_reviews_status on public.reviews(status);
create index idx_reviews_google_review_id on public.reviews(google_review_id);
create index idx_replies_review_id on public.replies(review_id);
create index idx_activity_log_user_id on public.activity_log(user_id);
create index idx_activity_log_created_at on public.activity_log(created_at desc);

-- Row Level Security
alter table public.users enable row level security;
alter table public.reviews enable row level security;
alter table public.replies enable row level security;
alter table public.activity_log enable row level security;

-- RLS Policies for users
create policy "Users can view own data" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own data" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert own data" on public.users
  for insert with check (auth.uid() = id);

-- RLS Policies for reviews
create policy "Users can view own reviews" on public.reviews
  for select using (auth.uid() = user_id);

create policy "Service role can insert reviews" on public.reviews
  for insert with check (true);

create policy "Service role can update reviews" on public.reviews
  for update using (true);

-- RLS Policies for replies
create policy "Users can view own replies" on public.replies
  for select using (
    exists (
      select 1 from public.reviews
      where reviews.id = replies.review_id
      and reviews.user_id = auth.uid()
    )
  );

create policy "Service role can insert replies" on public.replies
  for insert with check (true);

create policy "Service role can update replies" on public.replies
  for update using (true);

-- RLS Policies for activity_log
create policy "Users can view own activity" on public.activity_log
  for select using (auth.uid() = user_id);

create policy "Service role can insert activity" on public.activity_log
  for insert with check (true);

-- Function to auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for updated_at on users
create trigger users_updated_at
  before update on public.users
  for each row execute procedure public.update_updated_at();
