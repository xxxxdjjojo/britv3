---
title: Password reset failing
area: auth
severity_default: P3
code_paths:
  - src/app/(auth)/forgot-password/page.tsx
  - src/app/(auth)/reset-password/page.tsx
  - src/app/auth/callback/route.ts
  - src/services/email/email-service.ts
  - src/services/admin/tier1-actions/regenerate-reset-link.ts
tables:
  - email_logs
  - support_tickets
admin_surfaces:
  - /admin/support
  - /admin/system-health
tier1_actions:
  - regenerate-reset-link
alert_rules:
  - email_failures_24h
last_verified_commit: 4c3fe1ff
---

# Password reset failing

## Summary
A user requests a password reset but the email never arrives, or the reset link
is expired/consumed by the time they click it.

## Symptoms
- "I clicked reset password and nothing came" or "link expired / invalid".
- No `sent` `email_logs` row, or a stale one older than the link TTL.

## Customer impact
Account lockout — the user cannot regain access. Higher anxiety than a
verification delay; treat with care but never rush the security controls.

## Severity
P3 individual. Systemic (many failing at once) → P2 and the email/auth runbook.

## Detection
- `email_failures_24h` alert for provider-side failures.
- `email_logs` for the address; `/admin/system-health` Resend ping.
- Customer ticket.

## Scope check
Single user vs many. Broad failure = provider or auth-config incident, not a
per-user reset.

## Code paths
Request UI `forgot-password/page.tsx`; the reset link resolves through
`src/app/auth/callback/route.ts`; delivery + logging in `email-service.ts`.

## Data & tables
- `email_logs` — delivery status of the reset email.
- `support_tickets` — the intake.

## Admin surfaces
`/admin/support`, `/admin/system-health`.

## Diagnosis
1. `email_logs`: no row → send never fired; suppressed → deliverability.
2. Link expired → the reset TTL lapsed; re-issue rather than extend.
3. Link "already used" → a prior successful reset; confirm with the user.

## Common root causes
- Reset email delivered to spam / slow, link TTL expired before click.
- Address suppressed from a prior bounce.
- User requesting reset for an email that has no account (silent by design).

## Remediation
- **Tier-1 `regenerate-reset-link`** (permission `manage_credentials`,
  **super_admin only**, high risk, requires approval). CRITICAL: the link is
  delivered **only** by email to the account address and is **never displayed or
  logged** — showing it to a support agent is an account-takeover vector.
- Verify the requester owns the account through normal identity checks before
  approving; a reset request is not identity proof.

## Rollback
Not reversible (a new link invalidates the old). Scope is narrow — only a new
email to the verified account address.

## Verification
Customer confirms they received the email, completed the reset, and can log in.
Never confirm resolution by inspecting the link.

## Communication
"We've sent a fresh reset link to your account email." No link, no token, ever.

## Escalation
Repeated failures or suspected takeover → security path (see comms security
template) and `auth-outage.md`.

## Prevention & follow-up
Monitor `email_failures_24h`; keep reset TTL documented; suppression-list hygiene.

## Related
- Tier-1: `regenerate-reset-link`
- Alert: `email_failures_24h`
- Runbook: `auth-outage.md`
