---
title: Verification email not received
area: auth
severity_default: P3
code_paths:
  - src/services/auth/verification-service.ts
  - src/app/(auth)/verify-email
  - src/app/auth/callback/route.ts
  - src/services/email/email-service.ts
  - src/services/admin/tier1-actions/resend-verification-email.ts
tables:
  - email_logs
  - support_tickets
admin_surfaces:
  - /admin/support
  - /admin/system-health
tier1_actions:
  - resend-verification-email
alert_rules:
  - email_failures_24h
last_verified_commit: 4c3fe1ff
---

# Verification email not received

## Summary
A new signup never receives the confirmation email, so the account stays
unconfirmed and the role is never assigned (role is granted on confirm via
`role_intent` metadata → `auth/callback` `assign_role_atomic`).

## Symptoms
- Customer reports "I signed up but never got the email".
- Cannot log in ("please confirm your email").
- No `email_logs` row for the address, or one with `status` other than `sent`.

## Customer impact
Hard block: the user cannot enter the product until confirmed. High-friction at
the very top of the funnel.

## Severity
P3 individual; escalate to P2 if `email_failures_24h` shows a systemic spike
(see runbook `email-outage.md` once delivered in PR 11).

## Detection
- Alert rule `email_failures_24h` (Resend delivery failures, trailing 24h).
- `/admin/system-health` Resend ping; `email_logs` filtered to the address.
- The customer-reported ticket itself.

## Scope check
One address vs many. If many recent signups have no `sent` row, this is an
email-provider incident, not a per-user issue — stop and open the email runbook.

## Code paths
Confirmation send flows through `verification-service.ts`; the confirm link lands
on `src/app/auth/callback/route.ts` which assigns the role. Resend send + logging
is `src/services/email/email-service.ts`.

## Data & tables
- `email_logs` — template, `status`, suppression reason, error (PII-scrubbed).
- `support_tickets` — the intake if the customer wrote in.

## Admin surfaces
`/admin/support` for the ticket; `/admin/system-health` for provider status.

## Diagnosis
1. Look up `email_logs` for the address. No row → send never fired (app/config).
2. Row with `bounced`/`complained`/suppression → deliverability, not resend.
3. `sent` but not received → spam folder / provider-side; confirm address spelling.

## Common root causes
- Typo in email at signup (most common).
- Address on the Resend suppression list from a prior bounce/complaint.
- Resend outage or domain-auth (SPF/DKIM) regression.

## Remediation
- **Tier-1 `resend-verification-email`** (permission `manage_users`, low risk,
  reversible) — re-issues the confirmation email to the account address.
- If suppressed: the address must be un-suppressed at the provider first; do not
  loop resends against a suppressed address.
- If the email was mistyped: the user must re-register with the correct address
  (we do not silently change the auth email).

## Rollback
None required — resend is additive and idempotent from the user's side.

## Verification
`email_logs` shows a fresh `sent` row AND the customer confirms receipt and can
log in. Do not mark resolved on "email sent" alone.

## Communication
Reply on the ticket with a plain "we've re-sent it, check spam". Never include or
reference any link or token in the reply.

## Escalation
Systemic failure → payments/email incident path and `email-outage` runbook.

## Prevention & follow-up
Signup-time email validation; monitor `email_failures_24h`; periodic
suppression-list review.

## Related
- Alert: `email_failures_24h`
- Tier-1: `resend-verification-email`
- Runbook: `auth-outage.md`
