---
title: Site down (P1 master runbook)
area: infra
severity_default: P1
code_paths:
  - src/app/api/health/route.ts
  - src/app/(main)/status/page.tsx
  - src/app/error.tsx
  - .github/workflows/uptime-ping.yml
  - src/services/alerts/alert-engine-service.ts
tables:
  - uptime_checks
  - status_incidents
  - alert_events
admin_surfaces:
  - /admin/system-health
  - /admin/status-incidents
tier1_actions: []
alert_rules:
  - uptime.consecutive_failures
  - uptime_probe_staleness
last_verified_commit: 4c3fe1ff
---

# Site down (P1 master runbook)

## Summary
The public site is unreachable or erroring for everyone. This is the master P1
procedure; branch into `database-down`, `auth-outage`, or `deploy-rollback` once
the failing layer is identified.

## Symptoms
- `/` and key routes 5xx or time out.
- `uptime.consecutive_failures` firing; the GitHub dead-man's-switch emailed.
- Broad customer reports across unrelated features.

## Customer impact
Total outage — nobody can use the product. Highest severity; act immediately.

## Severity
P1. Declare an incident and publish a status-page entry early.

## Detection
- `uptime.consecutive_failures` (3 failed probes) and/or `uptime_probe_staleness`.
- The GitHub Actions dead-man's-switch email (external vantage point — fires even
  if the app and alert engine are down).
- `/api/health` failing; `/admin/system-health` pings red.

## Diagnosis
1. Hit `/api/health` directly — does the app respond at all?
2. Check the Vercel deployment status and recent deploys (a bad deploy is the most
   common single cause).
3. Check Supabase status → if the DB is down, go to `database-down.md`.
4. Check auth specifically → if only auth, go to `auth-outage.md`.
5. Read Sentry for the dominant error and its `correlation_id`.

## Remediation
- **Recent bad deploy** → `deploy-rollback.md` (fastest path to green).
- **Database down** → `database-down.md`.
- **Dependency outage** (Stripe/Resend/Upstash) → the app should degrade, not
  hard-fail; if it's hard-failing on a dependency, that's the fix to ship.
- Keep changes reversible and narrowly scoped; prefer rollback over hotfix under
  P1 pressure.

## Verification
`/api/health` green, `uptime_checks` probes passing again, key routes load, and
the `uptime.consecutive_failures` alert resolves. Confirm with a real page load,
not just the health endpoint.

## Escalation
If not root-caused within the first cycle, widen the incident: page the DB/deploy
owners, keep the status page updated on the cadence in
`docs/incidents/incident-response-plan.md`.

## Follow-up
Post-incident review (blameless, `post-incident-template.md`); add a regression
guard or alert for the specific failure mode; update this runbook.
