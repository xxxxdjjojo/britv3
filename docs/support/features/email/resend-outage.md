---
title: Resend outage / email delivery down
area: email
severity_default: P2
code_paths:
  - src/services/notifications/email-service.ts
  - src/services/email/email-service.ts
  - src/services/admin/health-service.ts
tables:
  - email_logs
admin_surfaces:
  - /admin/system-health
tier1_actions: []
alert_rules:
  - email_failures_24h
last_verified_commit: ebb22d7b
---

# Resend outage / email delivery down

## Summary
Transactional email (verification, password reset, receipts, notifications) is
failing to send because Resend is down, throttling us, or our API key/domain is
misconfigured. Users can still use the product but won't receive mail — which
silently blocks signup confirmation and password reset.

## Symptoms
- `email_logs` filling with `status = 'failed'`.
- Customers report "never got the verification/reset email" across many accounts
  at once (single-account reports → `auth/verification-email-not-received.md`).
- `/admin/system-health` Resend ping red.

## Customer impact
No verification, reset, or receipt emails. Signup and password-reset journeys are
effectively broken even though the app is up. P2 (P1 if it blocks all new signups
during a launch window).

## Severity
P2 default; escalate to P1 if it blocks all onboarding.

## Detection
- `email_failures_24h` diagnostic/alert (trailing-24h failed-send count).
- `/admin/system-health` Resend ping (`health-service.ts`).
- Sentry errors from the email send path.

## Diagnosis
1. Is it Resend (provider) or us? Check the Resend status page and
   `/admin/system-health`.
2. If us: recently rotated `RESEND_API_KEY`, changed the `ALERT_FROM`/from-domain,
   or lost domain verification (SPF/DKIM/DMARC)? A broken from-domain fails every
   send.
3. Read a failed `email_logs.error_message` for the exact rejection.

## Remediation
- **Provider outage** → publish a status-page incident ("Email"); sends will retry
  once Resend recovers. Do not hand-blast retries.
- **Key/domain regression** → restore the correct `RESEND_API_KEY` / from-domain
  and re-verify DNS; redeploy. Never paste the key into logs, tickets, or the AI
  packet.
- Confirm the failed messages are re-sendable (verification/reset can be re-issued
  via Tier-1 once mail recovers).

## Verification
A real end-to-end send succeeds (trigger a verification email to a test inbox),
`email_logs` returns to `status = 'sent'`, and `email_failures_24h` clears. Confirm
the mail actually arrives, not just that the API returned 200.

## Escalation
Sustained provider outage or DNS/domain problem you can't resolve → incident owner
+ the domain/DNS owner; keep "Email" on the status page current. See
`runbooks/email-outage.md`.

## Follow-up
Post-incident note; verify SPF/DKIM/DMARC monitoring exists so domain drift is
caught before it breaks sends.
