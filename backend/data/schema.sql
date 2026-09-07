-- Jharkhand Societal Innovation Portal — schema for Supabase (run once in SQL Editor)

create table if not exists complaints (
  id                 bigint generated always as identity primary key,
  title              text,
  raw_text           text not null,
  detected_language  text,
  english_text       text,
  category           text,
  district           text,
  village_locality   text,
  people_affected    integer not null default 0,
  latitude           decimal,
  longitude          decimal,
  attachments        jsonb not null default '[]',
  severity_score     decimal,
  severity_reasoning text,
  criticality_score  decimal,
  duplicate_of       bigint references complaints(id),
  duplicate_count    integer not null default 0,
  status             text not null default 'queued',
  error_message      text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists institutes (
  id             bigint generated always as identity primary key,
  name           text not null,
  nirf_rank      integer,
  domains        jsonb not null default '[]',
  past_projects  jsonb not null default '[]'
);

create table if not exists institute_matches (
  id             bigint generated always as identity primary key,
  complaint_id   bigint not null references complaints(id),
  institute_id   bigint not null references institutes(id),
  rank           integer not null,
  match_score    decimal,
  reasoning      text,
  created_at     timestamptz not null default now()
);

-- speeds up the geo bounding-box pre-filter in geoClustering.js
create index if not exists complaints_lat_lon_idx on complaints (latitude, longitude);
create index if not exists complaints_status_idx on complaints (status);
create index if not exists institute_matches_complaint_idx on institute_matches (complaint_id);
