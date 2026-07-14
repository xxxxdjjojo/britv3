---
title: Vercel deploy rollback (quick reference)
area: infra
severity_default: P1
code_paths:
  - src/app/api/health/route.ts
  - .github/workflows/uptime-ping.yml
tables:
  - uptime_checks
admin_surfaces:
  - /admin/system-health
tier1_actions: []
alert_rules:
  - uptime.consecutive_failures
last_verified_commit: ebb22d7b
---

# Vercel deploy rollback (quick reference)

## Summary
Feature-area quick reference for the single most common P1 remedy: a bad deploy
broke prod, so promote the last-known-good Vercel deployment. For the full P1
procedure and the migration caveat, use `runbooks/deploy-rollback.md` — this page
is the fast pointer support/engineers hit first.

## Symptoms
- Errors/outage began right after a deploy.
- `uptime.consecutive_failures` started at a release timestamp.
- A specific route/feature regressed post-deploy.

## Customer impact
Anything from one broken feature to full outage. Rolling back is almost always the
lowest-risk fast fix.

## Severity
Match the impact (P1 for outage); rollback is the action, not the severity.

## Detection
- Incident start correlating with a deploy timestamp.
- `uptime.consecutive_failures`; post-deploy smoke failing.

## Diagnosis
1. Confirm the timing correlation to a specific deployment.
2. Confirm the previous deployment was healthy.
3. **Did the bad deploy include a migration?** If so, code-only rollback may be
   unsafe — go to `runbooks/deploy-rollback.md` / `runbooks/database-down.md`.

## Remediation
- **Code-only regression** → promote last-known-good in Vercel (instant), verify
  green, then fix forward on a branch.
- **Deploy included a migration** → do NOT blind-rollback; coordinate a schema-aware
  recovery per `runbooks/deploy-rollback.md`.
- Land the real fix through the normal PR + CI flow, never by editing prod.

## Verification
`/api/health` green, `uptime_checks` recovering, the regressed feature works, and
post-deploy smoke passes. Confirm with a real page load.

## Escalation
Rollback doesn't restore service (or a migration blocks it) → `runbooks/site-down.md`
/ `runbooks/database-down.md` + deploy owner.

## Follow-up
Add a regression guard for the specific break so it can't reship; confirm CI would
now catch it.
