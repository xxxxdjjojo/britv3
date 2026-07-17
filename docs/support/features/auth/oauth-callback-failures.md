---
title: OAuth callback failures
area: auth
severity_default: P2
code_paths:
  - src/app/auth/callback/route.ts
  - src/lib/auth/safe-redirect.ts
  - src/services/auth/auth-service.ts
  - src/services/auth/role-service.ts
tables:
  - support_tickets
admin_surfaces:
  - /admin/support
  - /admin/system-health
tier1_actions: []
alert_rules:
  - uptime.consecutive_failures
last_verified_commit: 4c3fe1ff
---

# OAuth callback failures

## Summary
Users complete the provider consent screen but the return to
`src/app/auth/callback/route.ts` errors — no session, or a session with no role
assigned, or a redirect that dead-ends.

## Symptoms
- "Signed in with Google/Apple and got an error page."
- Landed back on login despite consenting.
- Session created but the role is missing (dashboards 404 / bounce).

## Customer impact
Blocks login for every user on the affected provider. Because it fails after
consent, it looks like the product is broken, not the provider.

## Severity
P2; P1 if it affects all providers (auth wholly down → `auth-outage.md`).

## Detection
- Sentry errors tagged `module: "auth"` on the callback route.
- `uptime.consecutive_failures` if the callback participates in the health probe
  path and errors cascade.
- Customer tickets clustering on "sign in with…".

## Scope check
One provider vs all. One provider → provider config/keys. All providers →
callback route or Supabase Auth incident.

## Code paths
Callback + role assignment in `src/app/auth/callback/route.ts`; safe post-login
redirect resolution in `src/lib/auth/safe-redirect.ts`; session/role wiring in
`auth-service.ts` and `role-service.ts`.

## Data & tables
Session/identity live in Supabase Auth; role assignment writes app tables.
`support_tickets` for intake.

## Admin surfaces
`/admin/support`, `/admin/system-health` (Supabase ping).

## Diagnosis
1. Reproduce the flow; read the Sentry event and its `correlation_id`.
2. Check the provider's redirect/allowed-callback URL config matches the deployed
   domain (a domain change is a classic cause).
3. Confirm the role assignment step ran (metadata `role_intent` present).

## Common root causes
- Redirect URI / allowed callback mismatch after a domain or env change.
- Expired or rotated provider client secret.
- `role_intent` metadata missing so `assign_role_atomic` no-ops.

## Remediation
- No Tier-1 action — this is a config/deploy fix, not a per-user remedy.
- Correct the provider callback URL or rotate the secret in env, redeploy, and
  re-test. If role assignment failed for specific users, an admin assigns the
  role via `/admin/users/[id]` after confirming intent.

## Rollback
If a recent deploy/env change introduced it, roll back the deploy
(`deploy-rollback.md`) while the config is corrected.

## Verification
A fresh end-to-end OAuth login succeeds, creates a session, and lands on the
correct role dashboard. Affected users can log in.

## Communication
Status page if login is broadly affected; otherwise reply on tickets once fixed.

## Escalation
All-provider failure → auth incident (`auth-outage.md`) and status page.

## Prevention & follow-up
Include OAuth login in post-deploy smoke; document provider callback URLs per
environment so domain changes don't silently break them.

## Related
- Runbook: `auth-outage.md`, `deploy-rollback.md`
- Alert: `uptime.consecutive_failures`
