-- SWM back-office tables. Run once in Supabase → SQL Editor.
-- Both tables are written only by the server (service role); browsers cannot read or write them.

create table if not exists public.site_settings (
  id text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);
alter table public.site_settings enable row level security;
-- no policies on purpose: anon / authenticated roles get nothing, the service role bypasses RLS

create table if not exists public.ai_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  kind text not null,
  question text,
  user_id uuid,
  ip_hash text,
  ok boolean not null default true,
  ms integer not null default 0,
  model text,
  error text,
  tokens integer
);
create index if not exists ai_logs_created_at_idx on public.ai_logs (created_at desc);
alter table public.ai_logs enable row level security;

-- Real guild leaderboards shared by players whose AegisLink saw the in-game ranking screen.
create table if not exists public.guild_rankings (
  id text primary key,            -- "<server>:<kind>", e.g. asia:siege
  server text not null,
  kind text not null,
  rows jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  contributor uuid,
  note text
);
alter table public.guild_rankings enable row level security;

-- optional: keep the log small (run by hand or as a cron job)
-- delete from public.ai_logs where created_at < now() - interval '30 days';
