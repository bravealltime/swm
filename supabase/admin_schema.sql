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

-- 2026-09-20: who asks — raw IP and Vercel's geo headers (country / region / city / timezone).
-- The API keeps writing rows without these columns until this runs, and the daily quota
-- (3 answers per account and per IP per Thai day, api/ai/advise.js) only needs ip_hash + user_id.
alter table public.ai_logs
  add column if not exists ip text,
  add column if not exists country text,
  add column if not exists region text,
  add column if not exists city text,
  add column if not exists timezone text;
create index if not exists ai_logs_ip_hash_day_idx on public.ai_logs (ip_hash, created_at desc);
create index if not exists ai_logs_user_day_idx on public.ai_logs (user_id, created_at desc);

-- Real guild leaderboards shared by players whose AegisLink saw the in-game ranking screen.
-- One row per contributor and board; the server picks which snapshot to show (api/_lib/guildRankings.js).
create table if not exists public.guild_rankings (
  id text primary key,            -- "<server>:<kind>:<contributor uuid>", e.g. asia:siege:6f1c…
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
