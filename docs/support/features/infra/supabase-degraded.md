---
title: Supabase degraded (partial)
area: infra
severity_default: P2
code_paths:
  - src/services/admin/health-service.ts
  - src/services/admin/diagnostics-service.ts
  - src/app/api/health/route.ts
tables:
  - uptime_checks
admin_surfaces:
  - /admin/system-health
tier1_actions: []
alert_rules:
  - uptime.consecutive_failures
last_verified_commit: ebb22d7b
---

# Supabase degraded (partial)

## Summary
Supabase is up but slow or intermittently erroring — elevated query latency,
occasional timeouts, or connection-pool pressure — rather than a full outage. Some
requests succeed, some fail. If it tips into a full outage, switch to
`runbooks/database-down.md`.

## Symptoms
- Intermittent 5xx / slow pages, not uniform failure.
- `/admin/system-health` Supabase ping flapping.
- Occasional connection/timeout errors in Sentry.

## Customer impact
Inconsistent — some users fine, some hitting errors/slowness. P2 (P1 if it degrades
to an outage).

## Severity
P2; escalate to P1 on full outage.

## Detection
- `/admin/system-health` (`health-service.ts`) intermittent red.
- `uptime.consecutive_failures` may or may not trip depending on which probes hit
  the slow path.
- `diagnostics-service.ts` signals + Sentry latency/timeout clusters.

## Diagnosis
1. Provider-side degradation (check Supabase status) vs self-inflicted (a slow
   query, a migration, pool exhaustion)?
2. Did a recent deploy/migration introduce a heavy query or a connection leak?
3. Is it one endpoint (localized) or broad (platform)?

## Remediation
- **Provider degradation** → publish a status-page note; degrade gracefully, don't
  thrash retries.
- **Slow query / pool pressure** → identify and fix or roll back the offending
  deploy (`runbooks/deploy-rollback.md`); add missing indexes/limits.
- Keep changes reversible and narrow; never hand-edit prod schema outside the
  migration flow.

## Verification
Latency and error rate return to baseline, `/admin/system-health` steady green,
`uptime_checks` stable. Confirm real pages load quickly, not just the health probe.

## Escalation
Degradation deepens or data-loss risk appears → `runbooks/database-down.md` + DB
owner.

## Follow-up
Add a query/pool guard or a latency alert; post-incident note on the driver.
