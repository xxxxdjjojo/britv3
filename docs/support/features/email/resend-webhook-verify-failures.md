---
title: Resend webhook verification failures
area: email
severity_default: P2
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

# Resend webhook verification failures

## Summary
Inbound Resend webhooks (delivery/bounce/complaint events) are being rejected at
the signature-verification step, so `email_logs` stops reflecting real delivery
outcomes. Sends may still work, but our record of what happened to them goes stale.

## Symptoms
- Resend webhook deliveries showing 4xx in the Resend dashboard.
- `email_logs` status stuck at `sent` — no bounce/complaint updates arriving.
- Sentry errors from `api/webhooks/resend/route.ts`.

## Customer impact
Indirect: we stop learning about bounces/complaints, so suppression handling and
`email_failures_24h` under-report. P2 because it degrades our observability of a
money-and-trust surface.

## Severity
P2.

## Detection
- Resend dashboard webhook delivery failures.
- Absence of expected bounce/complaint rows in `email_logs`.
- Sentry on the webhook route.

## Diagnosis
1. Signature verification failing? Check the webhook signing secret used by
   `resend-webhook-verifier.ts` matches the one configured in Resend.
2. Recently rotated the secret without updating both sides? That rejects every
   event.
3. Confirm the route is reachable (not blocked by `src/proxy.ts` / auth) and that
   the raw body is preserved for signature checks.

## Remediation
- **Secret mismatch** → align the signing secret on both sides and redeploy; never
  log or echo the secret.
- **Body-parsing regression** → ensure the raw payload reaches the verifier
  unmodified (signature is computed over the raw body).
- **Never disable verification to "make it work"** — an unverified webhook endpoint
  is a spoofing vector. Fix the secret instead.

## Verification
Send a test event from Resend; it verifies, the route returns 2xx, and the matching
`email_logs` row updates (e.g. a test bounce flips status). Confirm signature
verification is still enforced.

## Escalation
Can't reconcile the secret or the endpoint stays unreachable → the email/infra
owner; keep verification enabled throughout.

## Follow-up
Add a webhook-verification failure test (PR 12 backfill); document the signing
secret's rotation procedure in `runbooks/secret-rotation.md`.
