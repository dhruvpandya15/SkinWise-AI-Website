-- SkinWise application schema
-- Run this file in Supabase SQL Editor, or apply it with Supabase migrations.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skin_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skin_type text not null,
  skin_concerns text[] not null default '{}',
  age_range text not null,
  gender text,
  climate text,
  budget_range text,
  skin_goals text,
  allergies text[],
  created_at timestamptz not null default now()
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null unique references public.skin_assessments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  products jsonb not null default '[]'::jsonb,
  ai_summary text,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_name text not null,
  product_brand text,
  product_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, product_name)
);

create table if not exists public.product_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recommendation_id uuid not null references public.recommendations(id) on delete cascade,
  product_name text not null,
  rating integer not null check (rating between 1 and 5),
  feedback text,
  tried_product boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, recommendation_id, product_name)
);

create table if not exists public.skin_progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  photo_url text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public._heartbeat (
  id integer primary key default 1,
  note text not null default 'keepalive ping target'
);

insert into public._heartbeat (id, note)
values (1, 'keepalive ping target')
on conflict (id) do nothing;

create index if not exists skin_assessments_user_id_idx
  on public.skin_assessments(user_id, created_at desc);
create index if not exists recommendations_user_id_idx
  on public.recommendations(user_id);
create index if not exists favorites_user_id_idx
  on public.favorites(user_id);
create index if not exists product_feedback_recommendation_id_idx
  on public.product_feedback(recommendation_id);
create index if not exists skin_progress_photos_user_id_idx
  on public.skin_progress_photos(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.skin_assessments enable row level security;
alter table public.recommendations enable row level security;
alter table public.favorites enable row level security;
alter table public.product_feedback enable row level security;
alter table public.skin_progress_photos enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can view their own assessments" on public.skin_assessments;
create policy "Users can view their own assessments"
  on public.skin_assessments for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own assessments" on public.skin_assessments;
create policy "Users can insert their own assessments"
  on public.skin_assessments for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own assessments" on public.skin_assessments;
create policy "Users can delete their own assessments"
  on public.skin_assessments for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can view their own recommendations" on public.recommendations;
create policy "Users can view their own recommendations"
  on public.recommendations for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own recommendations" on public.recommendations;
create policy "Users can insert their own recommendations"
  on public.recommendations for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own recommendations" on public.recommendations;
create policy "Users can delete their own recommendations"
  on public.recommendations for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can view their own favorites" on public.favorites;
create policy "Users can view their own favorites"
  on public.favorites for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own favorites" on public.favorites;
create policy "Users can insert their own favorites"
  on public.favorites for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own favorites" on public.favorites;
create policy "Users can delete their own favorites"
  on public.favorites for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can view their own feedback" on public.product_feedback;
create policy "Users can view their own feedback"
  on public.product_feedback for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own feedback" on public.product_feedback;
create policy "Users can insert their own feedback"
  on public.product_feedback for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own feedback" on public.product_feedback;
create policy "Users can update their own feedback"
  on public.product_feedback for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can view their own progress photos" on public.skin_progress_photos;
create policy "Users can view their own progress photos"
  on public.skin_progress_photos for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own progress photos" on public.skin_progress_photos;
create policy "Users can insert their own progress photos"
  on public.skin_progress_photos for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own progress photos" on public.skin_progress_photos;
create policy "Users can delete their own progress photos"
  on public.skin_progress_photos for delete to authenticated
  using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
