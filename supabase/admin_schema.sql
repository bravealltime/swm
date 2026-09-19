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

-- 2026-09-20: live data — hourly jobs and the back-office write here; the site reads it through
-- /api/live/<key> (and subscribes to changes), so fresh data no longer needs a redeploy.
create table if not exists public.live_data (
  key text primary key,           -- 'rta-tierlist', 'rta-cutoffs', 'rta-meta', 'guardian-meta', 'codes', …
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text                 -- 'workflow' or an admin email
);
alter table public.live_data enable row level security;
-- readable by everyone (it is public data); only the service role writes
drop policy if exists live_data_public_read on public.live_data;
create policy live_data_public_read on public.live_data for select using (true);

-- Redeem codes submitted by visitors; an admin approves them into live_data.codes
create table if not exists public.code_submissions (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  code text not null,
  note text,
  ip_hash text,
  status text not null default 'pending',   -- pending | approved | rejected
  resolved_by text,
  resolved_at timestamptz
);
alter table public.code_submissions enable row level security;
create index if not exists code_submissions_status_idx on public.code_submissions (status, created_at desc);

-- Realtime: open tabs learn about new live data / settings without a refresh
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'live_data') then
    alter publication supabase_realtime add table public.live_data;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'site_settings') then
    alter publication supabase_realtime add table public.site_settings;
  end if;
end $$;
-- site_settings stays unreadable to browsers (it holds admin-only fields); the change event alone
-- is enough — the client re-fetches the public subset through /api/admin/public
