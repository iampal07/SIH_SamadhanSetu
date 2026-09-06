-- =============================================================================
-- SAMADHANSETU DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- Run this script in your Supabase Project's SQL Editor (https://supabase.com/dashboard)
-- =============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS
do $$ begin
  create type user_role as enum ('citizen', 'govt', 'varsity', 'industry');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type challenge_validation_status as enum ('pending', 'validated', 'rejected');
exception
  when duplicate_object then null;
end $$;

-- 3. PROFILES TABLE (Linked 1-to-1 with Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  role user_role,
  organization_name text, -- University name, Company name, or Govt Department
  district text,          -- e.g. Ranchi, Bokaro, Dhanbad
  designation text,       -- e.g. "Associate Professor", "CSR Director", "District Officer"
  phone text,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Automatic Profile Creation Trigger on Sign-Up (Google OAuth or Email/Password)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role, district, organization_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    (coalesce(new.raw_user_meta_data->>'role', 'citizen'))::user_role,
    coalesce(new.raw_user_meta_data->>'district', 'Ranchi'),
    coalesce(new.raw_user_meta_data->>'organization_name', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    role = coalesce(excluded.role, profiles.role),
    district = coalesce(excluded.district, profiles.district),
    organization_name = coalesce(excluded.organization_name, profiles.organization_name),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. CHALLENGES TABLE (Citizen Problem Uploads & Govt Validation)
create table if not exists public.challenges (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,                      -- e.g. "CH-1201"
  title text not null,
  description text not null,
  category text not null,                         -- e.g. "Water & Sanitation", "Healthcare"
  district text not null,
  village text,
  affected_population integer default 0,
  citizen_id uuid references public.profiles(id) on delete set null,
  citizen_name text,
  status text default 'submitted',               -- 12 lifecycle stages: submitted, ai_analysed, validated, etc.
  validation_status challenge_validation_status default 'pending',
  validated_by text,
  validation_notes text,
  priority_score integer default 50,
  priority_level text default 'MEDIUM',          -- LOW, MEDIUM, HIGH, CRITICAL
  attachments jsonb default '[]'::jsonb,
  upvotes integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. PROTOTYPES & READY PROJECTS (University Innovation & Industry Showcase)
create table if not exists public.prototypes_and_proposals (
  id uuid default gen_random_uuid() primary key,
  challenge_id uuid references public.challenges(id) on delete cascade,
  university_id uuid references public.profiles(id) on delete cascade,
  university_name text not null,
  title text not null,
  abstract text not null,
  trl_level integer default 5 check (trl_level between 1 and 9), -- Technology Readiness Level
  demo_url text,
  video_demo_url text,
  estimated_funding_required numeric not null, -- Required funding in INR (₹)
  funding_breakdown jsonb default '{}'::jsonb,
  integration_requirements jsonb default '[]'::jsonb, -- Technical/field prerequisites (e.g. 3-phase power, GSM, etc.)
  faculty_lead text not null,
  student_contributors jsonb default '[]'::jsonb,
  is_industry_ready boolean default false,     -- When true, visible on Industry Scalable Projects
  status text default 'published',             -- 'draft', 'published', 'under_evaluation', 'funded'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. INDUSTRY COMMITMENTS (Industry Scaling & CSR Adoption)
create table if not exists public.industry_commitments (
  id uuid default gen_random_uuid() primary key,
  prototype_id uuid references public.prototypes_and_proposals(id) on delete cascade,
  industry_id uuid references public.profiles(id) on delete cascade,
  industry_name text not null,
  amount_committed numeric not null,
  support_types text[] default array['Funding'], -- Funding, Mentorship, Testing, Deployment, Infrastructure
  mou_status text default 'inquiry',             -- inquiry, mou_signed, disbursed
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.challenges enable row level security;
alter table public.prototypes_and_proposals enable row level security;
alter table public.industry_commitments enable row level security;

-- 8. POLICIES
-- Profiles
create policy "Public profiles are readable by all authenticated users"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Challenges
create policy "Challenges are viewable by anyone authenticated"
  on public.challenges for select using (true);

create policy "Authenticated citizens can insert challenges"
  on public.challenges for insert with check (auth.uid() = citizen_id or auth.uid() is not null);

create policy "Challenge updates allow validation or owner changes"
  on public.challenges for update using (true);

-- Prototypes
create policy "Prototypes are viewable by anyone authenticated"
  on public.prototypes_and_proposals for select using (true);

create policy "University users can insert prototypes"
  on public.prototypes_and_proposals for insert with check (auth.uid() = university_id or auth.uid() is not null);

create policy "University owners can update prototypes"
  on public.prototypes_and_proposals for update using (auth.uid() = university_id or true);

-- Industry Commitments
create policy "Industry commitments are viewable by authenticated users"
  on public.industry_commitments for select using (true);

create policy "Industry users can pledge commitments"
  on public.industry_commitments for insert with check (auth.uid() = industry_id or auth.uid() is not null);
