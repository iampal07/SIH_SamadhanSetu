-- =============================================================================
-- SAMADHANSETU · CONNECTED WORKFLOW SCHEMA (run AFTER supabase_schema.sql)
-- Paste this whole file into Supabase → SQL Editor → Run.  It is idempotent.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ── 1. CHALLENGE MEDIA (citizen photos / videos / documents) ────────────────
create table if not exists public.challenge_media (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges(id) on delete cascade,
  challenge_code text not null,
  name text,
  url text,
  storage_path text,
  media_type text default 'image',     -- image | video | doc
  size_label text,
  uploaded_by uuid,
  uploaded_by_name text,
  created_at timestamptz default now()
);
create index if not exists challenge_media_code_idx on public.challenge_media(challenge_code);

-- ── 2. PROJECTS (one per accepted challenge — the shared workflow record) ───
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges(id) on delete cascade,
  challenge_code text unique not null,
  stage text not null default 'university_matched',
  progress_pct integer default 0,
  university_id text,
  university_name text,
  university_short text,
  university_district text,
  match_score integer,
  accepted_at timestamptz,
  accepted_by text,
  proposal jsonb,
  industry_need jsonb,
  impact jsonb,
  history jsonb default '[]'::jsonb,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);
create index if not exists projects_stage_idx on public.projects(stage);

-- ── 3. TEAMS + MEMBERS ──────────────────────────────────────────────────────
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  challenge_code text not null,
  name text not null,
  disciplines jsonb default '[]'::jsonb,
  formed_at timestamptz default now(),
  created_at timestamptz default now()
);
create unique index if not exists teams_project_uidx on public.teams(challenge_code);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade,
  member_ref text,
  name text not null,
  member_role text,           -- Faculty | Researcher | Student
  dept text,
  experience text,
  skills jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- ── 4. MILESTONES ───────────────────────────────────────────────────────────
create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  challenge_code text not null,
  milestone_key text not null,        -- M1..Mn
  seq integer default 0,
  title text not null,
  owner text,
  due timestamptz,
  status text default 'pending',      -- pending | in_progress | completed
  progress integer default 0,
  updated_at timestamptz default now()
);
create unique index if not exists milestones_uidx on public.project_milestones(challenge_code, milestone_key);

-- ── 5. SOLUTIONS / PROTOTYPES ───────────────────────────────────────────────
create table if not exists public.solutions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  challenge_code text unique not null,
  title text not null,
  abstract text,
  trl integer default 6,
  demo_url text,
  video_demo_url text,
  estimated_funding numeric default 0,
  funding_raised numeric default 0,
  integration_requirements jsonb default '[]'::jsonb,
  faculty_lead text,
  student_contributors jsonb default '[]'::jsonb,
  is_industry_ready boolean default true,
  prototype_ready boolean default false,
  status text default 'published',
  published_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── 6. INDUSTRY SUPPORT ─────────────────────────────────────────────────────
create table if not exists public.industry_support (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  challenge_code text not null,
  industry_id text not null,
  industry_name text not null,
  industry_short text,
  industry_type text,
  support_types text[] default array['Funding'],
  amount numeric default 0,
  amount_label text,
  note text,
  status text default 'committed',
  created_at timestamptz default now()
);
create unique index if not exists industry_support_uidx on public.industry_support(challenge_code, industry_id);

-- ── 7. GOVERNMENT REVIEWS ───────────────────────────────────────────────────
create table if not exists public.government_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  challenge_code text not null,
  decision text not null,             -- approved | changes_requested
  note text,
  reviewer text,
  created_at timestamptz default now()
);

-- ── 8. DEPLOYMENTS ──────────────────────────────────────────────────────────
create table if not exists public.deployments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  challenge_code text unique not null,
  deployed_at timestamptz default now(),
  deployed_by text,
  summary text,
  beneficiaries integer default 0,
  metrics jsonb default '[]'::jsonb,
  sustainability integer default 80,
  duration_months integer default 9
);

-- ── 9. CITIZEN FEEDBACK ─────────────────────────────────────────────────────
create table if not exists public.citizen_feedback (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  challenge_id uuid references public.challenges(id) on delete cascade,
  challenge_code text not null,
  citizen_id uuid,
  citizen_name text default 'Citizen',
  rating integer check (rating between 1 and 5),
  solved boolean default true,
  comment text,
  suggestions text,
  media jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);
create index if not exists citizen_feedback_code_idx on public.citizen_feedback(challenge_code);

-- ── 10. NOTIFICATIONS ───────────────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  role text not null,                 -- citizen | govt | varsity | industry
  user_id uuid,
  text text not null,
  tone text default 'info',           -- info | success | warn
  challenge_code text,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);
create index if not exists notifications_role_idx on public.notifications(role, created_at desc);

-- ── 11. ACTIVITY LOG (reports / audit trail) ────────────────────────────────
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  challenge_code text not null,
  project_id uuid,
  stage text,
  actor_role text,
  actor_name text,
  action text not null,
  detail text,
  created_at timestamptz default now()
);
create index if not exists activity_log_code_idx on public.activity_log(challenge_code, created_at desc);

-- ── 12. PROJECT UPDATES (stakeholder discussion) ────────────────────────────
create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  challenge_code text not null,
  author text,
  author_role text,
  text text not null,
  created_at timestamptz default now()
);
create index if not exists project_updates_code_idx on public.project_updates(challenge_code, created_at desc);

-- ── 12b. CHALLENGES RLS ─────────────────────────────────────────────────────
-- Every workflow row (project, team, milestone, solution, support, review,
-- deployment, feedback) hangs off the challenge row, so a blocked challenge
-- write silently breaks the whole chain. Align it with the tables below.
drop policy if exists "Authenticated citizens can insert challenges" on public.challenges;
drop policy if exists "challenges_insert" on public.challenges;
create policy "challenges_insert" on public.challenges for insert with check (true);

drop policy if exists "Challenge updates allow validation or owner changes" on public.challenges;
drop policy if exists "challenges_update" on public.challenges;
create policy "challenges_update" on public.challenges for update using (true) with check (true);

drop policy if exists "challenges_delete" on public.challenges;
create policy "challenges_delete" on public.challenges for delete using (true);

-- ── 13. RLS (open policies — demo / hackathon platform) ─────────────────────
do $$
declare tbl text;
begin
  foreach tbl in array array[
    'challenge_media','projects','teams','team_members','project_milestones',
    'solutions','industry_support','government_reviews','deployments',
    'citizen_feedback','notifications','activity_log','project_updates'
  ] loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('drop policy if exists "%s_all_read" on public.%I', tbl, tbl);
    execute format('create policy "%s_all_read" on public.%I for select using (true)', tbl, tbl);
    execute format('drop policy if exists "%s_all_write" on public.%I', tbl, tbl);
    execute format('create policy "%s_all_write" on public.%I for insert with check (true)', tbl, tbl);
    execute format('drop policy if exists "%s_all_update" on public.%I', tbl, tbl);
    execute format('create policy "%s_all_update" on public.%I for update using (true)', tbl, tbl);
    execute format('drop policy if exists "%s_all_delete" on public.%I', tbl, tbl);
    execute format('create policy "%s_all_delete" on public.%I for delete using (true)', tbl, tbl);
  end loop;
end $$;

-- ── 14. REALTIME PUBLICATION ────────────────────────────────────────────────
do $$
declare tbl text;
begin
  foreach tbl in array array[
    'challenges','challenge_media','projects','teams','team_members','project_milestones',
    'solutions','industry_support','government_reviews','deployments',
    'citizen_feedback','notifications','activity_log','project_updates'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    exception when duplicate_object then null;
      when others then null;
    end;
  end loop;
end $$;

-- ── 15. STORAGE BUCKET (citizen evidence) ───────────────────────────────────
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do update set public = true;

drop policy if exists "attachments_public_read" on storage.objects;
create policy "attachments_public_read" on storage.objects
  for select using (bucket_id = 'attachments');

drop policy if exists "attachments_write" on storage.objects;
create policy "attachments_write" on storage.objects
  for insert with check (bucket_id = 'attachments');

drop policy if exists "attachments_update" on storage.objects;
create policy "attachments_update" on storage.objects
  for update using (bucket_id = 'attachments');
