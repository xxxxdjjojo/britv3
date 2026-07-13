-- ============================================================================
-- status_incidents — public status page incident management (PR 3 of the
-- production-support initiative). Admins draft incidents privately and PUBLISH
-- them deliberately; the public /status page (src/app/(main)/status) reads only
-- published rows. RLS mirrors the uptime_checks posture: public read of the
-- published subset, writes via service role only (through the audited admin
-- routes at /api/admin/status-incidents).
-- ============================================================================

create table if not exists public.status_incidents (
  id                  uuid        primary key default gen_random_uuid(),
  title               text        not null,
  severity            text        not null
                        check (severity in ('minor', 'major', 'critical', 'maintenance')),
  status              text        not null
                        check (status in ('investigating', 'identified', 'monitoring', 'resolved', 'scheduled')),
  -- Public-safe component names only (e.g. 'website', 'payments', 'email').
  affected_components text[]      not null default '{}',
  started_at          timestamptz not null default now(),
  resolved_at         timestamptz,
  scheduled_for       timestamptz,
  scheduled_until     timestamptz,
  -- Draft first; publishing is a deliberate, audited act.
  is_published        boolean     not null default false,
  created_by          uuid,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists status_incidents_published_idx
  on public.status_incidents (is_published, started_at desc);

create table if not exists public.status_incident_updates (
  id          uuid        primary key default gen_random_uuid(),
  incident_id uuid        not null references public.status_incidents(id) on delete cascade,
  status      text        not null,
  -- Written-for-public text only.
  body        text        not null,
  created_by  uuid,
  created_at  timestamptz not null default now()
);

create index if not exists status_incident_updates_incident_idx
  on public.status_incident_updates (incident_id, created_at desc);

comment on table public.status_incidents is
  'Public status-page incidents. Public read of published rows only; writes via '
  'service role through the audited /api/admin/status-incidents routes.';

alter table public.status_incidents enable row level security;
alter table public.status_incident_updates enable row level security;

-- Public read: only published incidents.
drop policy if exists status_incidents_public_read on public.status_incidents;
create policy status_incidents_public_read
  on public.status_incidents
  for select
  to anon, authenticated
  using (is_published);

-- Public read of updates: only when the parent incident is published.
drop policy if exists status_incident_updates_public_read on public.status_incident_updates;
create policy status_incident_updates_public_read
  on public.status_incident_updates
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.status_incidents i
      where i.id = incident_id
        and i.is_published
    )
  );

grant select on public.status_incidents to anon, authenticated;
grant select on public.status_incident_updates to anon, authenticated;
grant select, insert, update, delete on public.status_incidents to service_role;
grant select, insert, update, delete on public.status_incident_updates to service_role;
