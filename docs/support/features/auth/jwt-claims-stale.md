---
title: JWT claims stale (role not reflected)
area: auth
severity_default: P3
code_paths:
  - src/services/auth/role-service.ts
  - src/app/auth/callback/route.ts
  - src/proxy.ts
  - src/services/admin/tier1-actions/registry.ts
tables:
  - support_tickets
admin_surfaces:
  - /admin/support
  - /admin/users
tier1_actions: []
alert_rules: []
last_verified_commit: 4c3fe1ff
---

# JWT claims stale (role not reflected)

## Summary
A user's role or entitlement changed (upgrade, admin grant, plan change) but their
active session still carries the old claims, so the UI/route guards behave as the
previous role until the token refreshes.

## Symptoms
- "I was upgraded / made an admin but still see the old dashboard."
- A route that should now be allowed still bounces (guard reads stale claim).
- Works after logout/login — the tell-tale of a stale token.

## Customer impact
Confusing but low-severity: the entitlement exists, only the live session lags.
No data loss.

## Severity
P3. Escalate only if a privileged grant must take effect immediately during an
incident.

## Detection
Customer ticket. No automatic alert — staleness is a session-timing artifact, not
a failure the engine can see.

## Scope check
Almost always a single account whose role just changed. Broad "wrong role for
everyone" is a different, higher-severity claims/proxy bug.

## Code paths
Role source of truth in `role-service.ts`; assignment on confirm in
`src/app/auth/callback/route.ts`; route guards read claims in `src/proxy.ts`.

## Data & tables
Role/entitlement lives in app tables + Supabase Auth claims; the session JWT is a
cached snapshot. `support_tickets` for intake.

## Admin surfaces
`/admin/users/[id]` to confirm the persisted role; `/admin/support` for the ticket.

## Diagnosis
1. Confirm the DB role/entitlement is actually correct (the change landed).
2. If DB is correct but the session is not → stale token; a refresh fixes it.
3. If DB is also wrong → this is not staleness; fix the underlying grant.

## Common root causes
- Role changed mid-session; the JWT hadn't refreshed yet.
- Client cached an old session across the change.

## Remediation
- Instruct the user to log out and back in (or hard-refresh) to mint a token with
  current claims — the correct, least-privileged fix.
- No Tier-1 action: forcibly revoking sessions is a privileged operation kept off
  the self-serve registry; use it only when a grant must apply instantly.

## Rollback
None — a re-login simply reflects the already-correct state.

## Verification
After re-login the user sees the new role/entitlement and the previously blocked
route resolves. Confirm with the customer.

## Communication
"Please sign out and back in — your upgrade is applied and will show after a fresh
login."

## Escalation
If claims are wrong for many users (not just stale), treat as an auth/proxy
incident and escalate.

## Prevention & follow-up
Where instant effect matters, trigger a session refresh on role change; document
which grants require re-login.

## Related
- Feature: `oauth-callback-failures.md`
- Runbook: `auth-outage.md`
