---
title: Database down / degraded
area: infra
severity_default: P1
code_paths:
  - src/services/admin/health-service.ts
  - src/services/admin/diagnostics-service.ts
  - src/app/api/health/route.ts
tables:
  - uptime_checks
  - status_incidents
admin_surfaces:
  - /admin/system-health
  - /admin/status-incidents
tier1_actions: []
alert_rules:
  - uptime.consecutive_failures
last_verified_commit: 4c3fe1ff
---

# Database down / degraded

## Summary
Supabase Postgres is unreachable, throttled, or erroring, so most authenticated
and data-backed pages fail. Everything downstream (auth, billing, search) inherits
the outage.

## Symptoms
- Queries time out or error; `/admin/system-health` Supabase ping red.
- Broad 5xx across data-backed routes while static assets still serve.
- Connection-pool exhaustion errors in Sentry.

## Customer impact
Near-total for logged-in users; a P1 alongside `site-down.md`.

## Severity
P1.

## Detection
- `/admin/system-health` Supabase ping (via `health-service.ts`).
- `uptime.consecutive_failures` from probes that exercise a DB path.
- Sentry connection/timeout errors.

## Diagnosis
1. Check the Supabase project status/dashboard — outage vs degradation vs limits.
2. Distinguish provider outage from self-inflicted: a recent migration, a runaway
   query, or connection-pool exhaustion.
3. If a migration or deploy immediately preceded it, suspect that first.

## Remediation
- **Provider outage**: publish a status-page incident, wait/liaise with Supabase;
  the app should degrade gracefully. Do not thrash retries.
- **Pool exhaustion**: identify and stop the offending caller; rollback the deploy
  that introduced it (`deploy-rollback.md`).
- **Bad migration**: see `migration-drift.md` (PR 11); never hand-edit prod schema
  outside the migration flow (`supabase/migrations/README.md`).
- **Data-loss risk**: if recovery needs a restore, use `12-dr-and-backups.md` and
  the DR restore evidence procedure.

## Verification
Supabase ping green, queries succeed, `uptime_checks` recovering, and a real
authenticated page loads. Confirm no data was lost if a restore was involved.

## Escalation
Sustained outage or any data-loss possibility → full incident, DB owner, and DR
procedure; keep the status page current.

## Follow-up
Post-incident review; add query/pool guards or alerts; verify backup/restore
posture in `12-dr-and-backups.md`.
