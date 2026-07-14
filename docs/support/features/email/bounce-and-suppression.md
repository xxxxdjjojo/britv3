---
title: Email bounces and suppression
area: email
severity_default: P3
code_paths:
  - src/lib/email/resend-webhook-verifier.ts
  - src/app/api/webhooks/resend/route.ts
  - src/services/notifications/email-service.ts
tables:
  - email_logs
admin_surfaces:
  - /admin/system-health
tier1_actions: []
alert_rules:
  - email_failures_24h
last_verified_commit: ebb22d7b
---

# Email bounces and suppression

## Summary
A specific recipient stops receiving mail because their address hard-bounced or
was marked as spam and is now suppressed. This is per-address, not a platform
outage — the fix is confirming the address is real and clearing the suppression.

## Symptoms
- One customer: "I never get any emails" while everyone else does.
- `email_logs` for that recipient shows `status = 'suppressed'` with a
  `suppression_reason`.
- A cluster of suppressions from one domain can indicate a deliverability problem
  (→ `resend-outage.md`).

## Customer impact
That user misses verification, reset, and notification mail. Localised; P3 unless
it's an important account or a broad cluster.

## Severity
P3 (single address); re-triage upward if it's a domain-wide cluster.

## Detection
- `email_logs` filtered to the recipient (`status`, `suppression_reason`).
- `email_failures_24h` if the volume is high enough to trend.
- The Resend inbound webhook (`api/webhooks/resend/route.ts`) records
  bounce/complaint events into `email_logs`.

## Diagnosis
1. Read `suppression_reason`: hard bounce (bad address), spam complaint, or manual
   suppression.
2. Hard bounce → the address is likely wrong/dead; confirm the correct address
   with the customer before anything else.
3. Spam complaint → the user marked us as spam; re-subscribing them without consent
   is not appropriate.

## Remediation
- **Wrong address** → have the customer correct their email, then re-issue the
  needed mail (verification/reset via Tier-1 once the address is valid).
- **Valid address, transient bounce** → clear the suppression in Resend and re-send;
  confirm delivery.
- **Spam complaint** → do not silently re-enable; respect the complaint and follow
  up through support.
- Never expose other recipients' addresses when investigating — query only the one
  account.

## Verification
A fresh send to the corrected/cleared address arrives, and `email_logs` shows
`status = 'sent'`. Confirm with the customer that mail now lands.

## Escalation
Domain-wide suppression cluster or reputation problem → `resend-outage.md` +
deliverability owner.

## Follow-up
Consider surfacing suppression state in the admin user view so support can see it
without a raw query; note recurring bad-domain patterns.
