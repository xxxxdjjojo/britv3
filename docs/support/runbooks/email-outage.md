---
title: Email outage
area: email
severity_default: P2
code_paths:
  - src/services/notifications/email-service.ts
  - src/services/email/email-service.ts
  - src/services/admin/health-service.ts
  - src/app/api/webhooks/resend/route.ts
tables:
  - email_logs
admin_surfaces:
  - /admin/system-health
tier1_actions: []
alert_rules:
  - email_failures_24h
last_verified_commit: ebb22d7b
---

# Email outage

## Summary
All transactional email is failing. Because verification and password-reset mail
flow through this path, an email outage silently breaks onboarding and account
recovery even while the site is up. This runbook restores delivery and confirms the
blocked journeys recover.

## Symptoms
- `email_failures_24h` firing; `email_logs` filling with `status = 'failed'`.
- Broad "didn't get the email" reports across unrelated accounts.
- `/admin/system-health` Resend ping red.

## Customer impact
No verification, reset, receipt, or notification mail. Onboarding and recovery are
effectively broken. P2 (P1 during a launch/onboarding push).

## Severity
P2; escalate to P1 if it blocks all new signups.

## Detection
- `email_failures_24h` diagnostic/alert.
- `/admin/system-health` Resend ping.
- Sentry on the email send path.

## Diagnosis
1. Provider vs us: Resend status page + `/admin/system-health`.
2. Us: rotated `RESEND_API_KEY`, changed from-domain/`ALERT_FROM`, or lost
   SPF/DKIM/DMARC verification? A broken from-domain fails every send.
3. Read a failed `email_logs.error_message` for the exact cause.

## Remediation
- **Provider outage** → publish an "Email" status incident; sends retry on recovery.
- **Key/domain regression** → restore the correct key / from-domain, re-verify DNS,
  redeploy. Never expose the key in logs, tickets, or the AI packet.
- Once recovered, re-issue anything critical that was blocked (verification/reset
  via the Tier-1 actions).

## Verification
A real end-to-end send arrives at a test inbox, `email_logs` returns to `sent`,
`email_failures_24h` clears, AND a fresh signup-verification and password-reset both
complete. Confirm the blocked journeys actually work again — not just that the API
returns 200.

## Escalation
Sustained provider outage or unresolved DNS/domain problem → incident owner + DNS
owner; keep "Email" on the status page current.

## Follow-up
Post-incident review; add SPF/DKIM/DMARC monitoring so domain drift is caught early;
see `features/email/resend-outage.md`.
