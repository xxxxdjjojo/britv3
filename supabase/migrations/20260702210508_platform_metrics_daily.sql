-- ============================================================================
-- platform_metrics_daily — Influence Strategy Phase 2, Campaign 44 (/metrics).
--
-- One row per (metric, day), written nightly by the platform-metrics-daily
-- Inngest job via the service role. Metric definitions are versioned ON THE
-- PAGE (src/app/(main)/metrics) — never quietly redefine a metric; add a new
-- metric key instead. Public read: the whole point is that anyone can check.
-- ============================================================================

create table if not exists public.platform_metrics_daily (
  metric     text        not null,  -- e.g. 'active_sale_listings'
  day        date        not null,
  value      numeric     not null,
  meta       jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (metric, day)
);

comment on table public.platform_metrics_daily is
  'Nightly public platform metrics (Open Metrics page). Definitions are '
  'versioned on the /metrics page; a definition change means a NEW metric key, '
  'never a silent redefinition.';

alter table public.platform_metrics_daily enable row level security;

drop policy if exists platform_metrics_daily_public_read on public.platform_metrics_daily;
create policy platform_metrics_daily_public_read
  on public.platform_metrics_daily
  for select
  to anon, authenticated
  using (true);

grant select on public.platform_metrics_daily to anon, authenticated, service_role;
