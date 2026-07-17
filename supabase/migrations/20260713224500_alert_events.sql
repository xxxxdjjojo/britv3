-- ============================================================================
-- alert_events — production alert engine ledger (PR 5). One row per distinct
-- firing condition (deduped by `fingerprint`). The Inngest alert-engine-tick
-- evaluates rules over existing tables (uptime_checks, billing_events,
-- email_logs, gdpr_requests), opens/resolves rows here, and emails ops on the
-- transition to firing. Summaries carry ONLY counts/rates — never row contents,
-- never PII (enforced by the rule layer + a no-PII test).
--
-- RLS: no anon/authenticated policy (default deny). Reads/writes are service
-- role only (the Inngest job and admin surfaces use the service-role client).
-- ============================================================================

create table if not exists public.alert_events (
  id            uuid        primary key default gen_random_uuid(),
  rule_key      text        not null,
  fingerprint   text        not null,
  severity      text        not null check (severity in ('info', 'warning', 'critical')),
  status        text        not null default 'firing' check (status in ('firing', 'resolved')),
  summary       text        not null,
  details       jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  notified_at   timestamptz,
  resolved_at   timestamptz
);

-- At most one FIRING row per fingerprint — the dedupe backbone.
create unique index if not exists alert_events_one_firing
  on public.alert_events (fingerprint)
  where status = 'firing';

create index if not exists alert_events_status_idx
  on public.alert_events (status, last_seen_at desc);

comment on table public.alert_events is
  'Production alert ledger (deduped by fingerprint). Service-role only; '
  'summaries carry counts/rates, never PII.';

alter table public.alert_events enable row level security;

-- No anon/authenticated policy: default deny. Service role bypasses RLS.
grant select, insert, update, delete on public.alert_events to service_role;
