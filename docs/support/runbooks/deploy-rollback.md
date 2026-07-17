---
title: Deploy rollback
area: infra
severity_default: P1
code_paths:
  - .github/workflows/uptime-ping.yml
  - src/app/api/health/route.ts
  - src/app/(main)/status/page.tsx
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

# Deploy rollback

## Summary
A recent deploy broke production. This runbook restores service by promoting the
last-known-good Vercel deployment — the fastest, most reversible P1 remedy — then
fixes forward calmly.

## Symptoms
- Errors/outage began immediately after a deploy.
- `uptime.consecutive_failures` started right after a release.
- A specific feature or route regressed post-deploy.

## Customer impact
Ranges from a single broken feature to full outage. Rolling back is almost always
lower-risk than a hot patch under pressure.

## Severity
Match the impact (P1 for outage). Rollback is the action, not the severity.

## Detection
- Correlation between the incident start and a deploy timestamp.
- `uptime.consecutive_failures`; post-deploy smoke (`production-link-health.yml`)
  failing.

## Diagnosis
1. Identify the suspect deployment (timing correlation is usually decisive).
2. Confirm the previous deployment was healthy (it served fine before).
3. Note whether the bad deploy included a **migration** — if so, rollback of code
   alone may not be safe; consult `database-down.md` / `migration-drift.md` (PR 11)
   because schema changes are not reversed by re-promoting old code.

## Remediation
- **Code-only regression**: promote the last-known-good deployment in Vercel
  (instant rollback). Verify green, then fix forward on a branch.
- **Deploy included a migration**: do NOT assume rollback is safe — additive
  migrations are usually fine with old code; destructive ones are not. Coordinate a
  forward-fix or a schema-aware recovery instead of blind rollback.
- Keep the fix reversible and narrowly scoped; land the real fix through the normal
  PR + CI flow, never by editing prod directly.

## Verification
`/api/health` green, `uptime_checks` recovering, the regressed feature works, and
post-deploy smoke passes. Confirm with a real page load.

## Escalation
If rollback doesn't restore service (or a migration blocks it) → escalate to
`site-down.md` / `database-down.md` and the DB owner.

## Follow-up
Post-incident review; add a regression test/guard for the specific break so it
can't reship; confirm CI would now catch it.
