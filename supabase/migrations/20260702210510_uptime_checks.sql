-- ============================================================================
-- uptime_checks — Influence Strategy Phase 2, Campaign 44 (/metrics uptime).
--
-- One row per external availability probe of the public site. Fed by the
-- .github/workflows/uptime-ping.yml GitHub Actions cron (precedent:
-- mobility-backfill.yml — connects via the SUPABASE_DB_URL Actions secret),
-- which pings /api/health and records the result. The /metrics page computes
-- a trailing 30-day availability percentage from these rows and only shows it
-- once enough probes exist (disclosed threshold on the page).
-- ============================================================================

create table if not exists public.uptime_checks (
  id         bigint      generated always as identity primary key,
  checked_at timestamptz not null default now(),
  ok         boolean     not null,
  latency_ms int,
  source     text        not null default 'github-actions'
);

create index if not exists uptime_checks_checked_at_idx
  on public.uptime_checks (checked_at desc);

comment on table public.uptime_checks is
  'External availability probes of the public site (GitHub Actions cron). '
  'Public read; inserts via service role / direct DB connection only.';

alter table public.uptime_checks enable row level security;

drop policy if exists uptime_checks_public_read on public.uptime_checks;
create policy uptime_checks_public_read
  on public.uptime_checks
  for select
  to anon, authenticated
  using (true);

grant select on public.uptime_checks to anon, authenticated, service_role;
