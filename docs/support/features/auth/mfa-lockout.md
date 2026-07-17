---
title: MFA lockout (incl. admin AAL2)
area: auth
severity_default: P2
code_paths:
  - src/app/(auth)/two-factor
  - src/app/(auth)/two-factor-setup
  - src/app/api/settings/mfa
  - src/lib/auth/reauth-token.ts
  - src/proxy.ts
tables:
  - support_tickets
admin_surfaces:
  - /admin/support
  - /admin/users
tier1_actions: []
alert_rules: []
last_verified_commit: 4c3fe1ff
---

# MFA lockout (incl. admin AAL2)

## Summary
A user (or an admin) cannot pass the second factor: lost authenticator, no backup
codes, or an admin blocked by the AAL2 gate in `src/proxy.ts`.

## Symptoms
- "I lost my phone / authenticator and can't log in."
- Admin reaches the console but every privileged route bounces on step-up.
- Backup codes exhausted or never saved.

## Customer impact
Full lockout for the user; for an admin, loss of privileged operations — which
can itself block incident response. Treat admin AAL2 lockout as P2.

## Severity
P2 (P1 if the only super_admin is locked out during an active incident).

## Detection
Customer/admin ticket. There is no automatic alert for individual MFA lockouts.

## Scope check
Single account. Confirm identity rigorously — MFA reset is an account-takeover
target, so identity proof must be stronger here than for a password reset.

## Code paths
Enrollment/verify UI under `two-factor` / `two-factor-setup`; MFA management API
`src/app/api/settings/mfa` (`enroll`, `verify`, `unenroll`, `backup-codes`);
step-up reauth token in `src/lib/auth/reauth-token.ts`; the admin AAL2 gate lives
in `src/proxy.ts`.

## Data & tables
Supabase Auth holds the MFA factors (not an app table). `support_tickets` for the
intake.

## Admin surfaces
`/admin/support` for the ticket; `/admin/users/[id]` for the account.

## Diagnosis
1. Confirm the account has an enrolled factor and whether backup codes remain.
2. For admins: confirm whether the block is factor loss vs a session AAL level
   that never reached AAL2.
3. Establish identity out-of-band before any factor removal.

## Common root causes
- Lost/replaced device with no saved backup codes.
- Backup codes all consumed.
- Admin session at AAL1 hitting an AAL2-gated route.

## Remediation
- No Tier-1 action exists for MFA reset by design — removing a factor is a
  privileged, identity-sensitive operation, kept off the self-serve registry.
- After strong identity verification, an authorised admin removes the factor via
  the Supabase Auth admin API (unenroll), the user re-enrolls, and **new backup
  codes are saved**. Record who verified identity and how in the ticket.

## Rollback
The user re-enrolls immediately, restoring MFA. Never leave the account without a
second factor longer than necessary.

## Verification
User completes fresh MFA enrollment and logs in; admin passes the AAL2 gate.
Confirm the account is protected again before closing.

## Communication
Explain the factor was reset after identity verification and that they should
save the new backup codes. Never send codes or secrets in the reply.

## Escalation
Suspected takeover → security incident path. Sole-super_admin lockout →
emergency admin-access procedure (see `12-dr-and-backups.md`).

## Prevention & follow-up
Enforce backup-code capture at enrollment; keep ≥2 super_admins so one lockout is
never single-point.

## Related
- Runbook: `auth-outage.md`
- Doc: `12-dr-and-backups.md` (emergency admin access)
