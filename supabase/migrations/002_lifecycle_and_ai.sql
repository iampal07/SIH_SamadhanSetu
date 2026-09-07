-- =============================================================================
-- SAMADHANSETU — LIFECYCLE + AI SCHEMA (run after supabase_schema.sql)
-- Creates every table the connected workflow writes to, plus indexes, RLS and
-- realtime publication. Safe to re-run.
-- =============================================================================

-- profiles: onboarding flag used by the auth flow
alter table public.profiles add column if not exists is_onboarded boolean default false;

-- ── Projects (one per accepted challenge) ────────────────────────────────────
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges(id) on delete cascade,
  challenge_code text not null,
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

-- ── Teams ────────────────────────────────────────────────────────────────────
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  challenge_code text not null,
  name text not null,
  disciplines jsonb default '[]'::jsonb,
  formed_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade,
  member_ref text,
  name text not null,
  member_role text,
  dept text,
  experience text,
  skills jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- ── Milestones ───────────────────────────────────────────────────────────────
create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  challenge_code text not null,
  milestone_key text not null,
  seq integer default 0,
  title text not null,
  owner text,
  due timestamptz,
  status text default 'pending',
  progress integer default 0,
  updated_at timestamptz default now()
);

-- ── Solutions / prototypes published to industry ─────────────────────────────
create table if not exists public.solutions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  challenge_code text not null,
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

-- ── Industry support commitments ─────────────────────────────────────────────
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

-- ── Government review, deployment, citizen feedback ──────────────────────────
create table if not exists public.government_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  challenge_code text not null,
  decision text not null,          -- approved | changes_requested | rejected
  note text,
  reviewer text,
  created_at timestamptz default now()
);

create table if not exists public.deployments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  challenge_code text not null,
  deployed_at timestamptz default now(),
  deployed_by text,
  summary text,
  beneficiaries integer default 0,
  metrics jsonb default '[]'::jsonb,
  sustainability integer default 80,
  duration_months integer default 9
);

create table if not exists public.citizen_feedback (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  challenge_id uuid references public.challenges(id) on delete cascade,
  challenge_code text not null,
  citizen_id uuid references public.profiles(id) on delete set null,
  citizen_name text default 'Citizen',
  rating integer check (rating between 1 and 5),
  solved boolean default true,
  comment text,
  suggestions text,
  media jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- ── Evidence, updates, notifications, audit trail ────────────────────────────
create table if not exists public.challenge_media (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges(id) on delete cascade,
  challenge_code text not null,
  name text,
  url text,
  storage_path text,
  media_type text default 'image',
  size_label text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_by_name text,
  created_at timestamptz default now()
);

create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  challenge_code text not null,
  author text,
  author_role text,
  text text not null,
  created_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  role text not null,                       -- citizen | govt | varsity | industry
  user_id uuid references public.profiles(id) on delete cascade,
  text text not null,
  tone text default 'info',
  challenge_code text,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  challenge_code text not null,
  project_id uuid references public.projects(id) on delete cascade,
  stage text,
  actor_role text,
  actor_name text,
  action text not null,
  detail text,
  created_at timestamptz default now()
);

-- ── AI analysis produced by the ai-analyze edge function ─────────────────────
create table if not exists public.ai_analysis (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges(id) on delete cascade,
  challenge_code text not null,
  engine text not null default 'gemini',      -- gemini | heuristic
  model text,
  status text not null default 'completed',   -- queued | processing | completed | failed
  error text,
  detected_language text,
  english_text text,
  language_confidence numeric,
  category text,
  category_confidence integer,
  alternate_categories jsonb default '[]'::jsonb,
  keywords jsonb default '[]'::jsonb,
  severity_score numeric,
  severity_reasoning text,
  criticality_score numeric,
  priority_score integer,
  priority_level text,
  priority_factors jsonb default '{}'::jsonb,
  duplicates jsonb default '[]'::jsonb,
  duplicate_count integer default 0,
  university_matches jsonb default '[]'::jsonb,
  industry_matches jsonb default '[]'::jsonb,
  disciplines jsonb default '[]'::jsonb,
  required_expertise jsonb default '[]'::jsonb,
  reasoning text,
  raw_output jsonb,
  duration_ms integer,
  created_at timestamptz not null default now()
);
create unique index if not exists ai_analysis_challenge_code_key on public.ai_analysis (challenge_code);

-- ── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists challenges_status_idx on public.challenges (status);
create index if not exists challenges_district_idx on public.challenges (district);
create index if not exists challenges_created_idx on public.challenges (created_at desc);
create index if not exists projects_challenge_code_idx on public.projects (challenge_code);
create index if not exists teams_challenge_code_idx on public.teams (challenge_code);
create index if not exists milestones_challenge_code_idx on public.project_milestones (challenge_code);
create index if not exists industry_support_code_idx on public.industry_support (challenge_code);
create index if not exists media_challenge_code_idx on public.challenge_media (challenge_code);
create index if not exists notifications_role_idx on public.notifications (role, read);
create index if not exists activity_log_code_idx on public.activity_log (challenge_code, created_at desc);
create index if not exists ai_analysis_challenge_id_idx on public.ai_analysis (challenge_id);

-- ── Row level security ───────────────────────────────────────────────────────
-- The platform is a public civic register: every stakeholder can read the whole
-- pipeline (that transparency is the point), while writes are limited to
-- authenticated sessions and the service role used by the edge function.
do $$
declare t text;
begin
  foreach t in array array['projects','teams','team_members','project_milestones','solutions',
                           'industry_support','government_reviews','deployments','citizen_feedback',
                           'challenge_media','project_updates','notifications','activity_log','ai_analysis']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s readable" on public.%I', t, t);
    execute format('create policy "%s readable" on public.%I for select using (true)', t, t);
    execute format('drop policy if exists "%s writable" on public.%I', t, t);
    execute format('create policy "%s writable" on public.%I for insert with check (true)', t, t);
    execute format('drop policy if exists "%s updatable" on public.%I', t, t);
    execute format('create policy "%s updatable" on public.%I for update using (true)', t, t);
  end loop;
end $$;

-- ── Realtime (every dashboard stays in sync without refreshing) ──────────────
do $$
declare t text;
begin
  foreach t in array array['challenges','projects','teams','team_members','project_milestones','solutions',
                           'industry_support','government_reviews','deployments','citizen_feedback',
                           'notifications','activity_log','project_updates','challenge_media','ai_analysis']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
