---
title: Auth outage
area: auth
severity_default: P1
code_paths:
  - src/app/auth/callback/route.ts
  - src/services/auth/auth-service.ts
  - src/proxy.ts
  - src/services/admin/health-service.ts
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

# Auth outage

## Summary
Login/signup is broken for everyone — sessions won't mint, the callback errors, or
the route guard/proxy is rejecting valid sessions. The rest of the site may look
up but nobody can get in.

## Symptoms
- All login attempts fail (all providers, or email+OAuth alike).
- Authenticated routes bounce valid users to login.
- Sentry errors clustered on `module: "auth"`.

## Customer impact
Effective outage — existing users are locked out and no one can sign up. P1.

## Severity
P1.

## Detection
- Spike of `module: "auth"` Sentry errors.
- `uptime.consecutive_failures` if the probe path includes auth.
- `/admin/system-health` Supabase Auth ping.

## Diagnosis
1. Is it Supabase Auth (provider) or our code/config? Check the Supabase status +
   `/admin/system-health`.
2. Did a recent deploy touch `src/proxy.ts`, the callback route, or auth env
   (keys, allowed callback URLs, domain)?
3. Reproduce a login and read the Sentry event + `correlation_id`.

## Remediation
- **Recent deploy/config regression** (proxy guard, callback, env) → roll back
  first (`deploy-rollback.md`), then fix forward.
- **Provider outage** → publish a status-page incident; the app can't mint
  sessions until Supabase Auth recovers.
- **Domain/OAuth config drift** → correct allowed callback URLs / secrets and
  redeploy (see `oauth-callback-failures.md`).
- Keep the AAL2 admin gate intact — never weaken auth controls to "fix" an outage.

## Verification
A fresh end-to-end login and a fresh signup both succeed and land on the correct
role dashboard; existing sessions work. Confirm with a real login.

## Escalation
Not resolved in the first cycle → incident owner + auth/deploy owners; ensure at
least one super_admin retains access (see `mfa-lockout.md` / emergency admin
access in `12-dr-and-backups.md`).

## Follow-up
Post-incident review; add auth login to post-deploy smoke; document per-env OAuth
callback URLs so domain changes don't silently break auth.
