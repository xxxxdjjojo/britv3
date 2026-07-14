---
title: GoCardless mandate failures
area: payments
severity_default: P2
code_paths:
  - src/lib/truedeed/gocardless-client.ts
  - src/app/api/webhooks/gocardless/route.ts
  - src/services/truedeed/dunning-service.ts
tables:
  - invoices
  - invoice_events
admin_surfaces:
  - /admin/subscriptions
  - /admin/system-health
tier1_actions: []
alert_rules: []
last_verified_commit: 4c3fe1ff
---

# GoCardless mandate failures

## Summary
A Direct Debit mandate failed to set up or was cancelled/expired, so scheduled
collections cannot be taken — the customer looks "unpaid" though they intended to
pay by DD.

## Symptoms
- "I set up Direct Debit but you say I'm not paying."
- Mandate status failed/cancelled/expired at GoCardless.
- Collections not created; invoices sliding into arrears.

## Customer impact
Payment can't be collected; if dunning escalates it can wrongly threaten access.
Trust-sensitive.

## Severity
P2 individual; P1 if mandate setup is broken for everyone (webhook/config).

## Detection
- GoCardless webhook errors (Sentry `module: "payments"`).
- Arrears surfacing in dunning; customer ticket.
- No dedicated alert rule yet — a known gap (see `14-open-risks.md`, GoCardless
  DLQ parity unaudited).

## Scope check
One mandate vs all. All → webhook verification or client config; one → the
customer's bank/mandate.

## Code paths
GoCardless API wrapper `src/lib/truedeed/gocardless-client.ts`; webhook ingress
`src/app/api/webhooks/gocardless/route.ts` (signature-verified); arrears handling
`dunning-service.ts`.

## Data & tables
- `invoices` — the amounts due.
- `invoice_events` — state transitions including collection outcomes.

## Diagnosis
1. Check the mandate status at GoCardless.
2. If failed/cancelled → the customer must re-authorise a new mandate.
3. If mandate is active but collections aren't firing → webhook/processing issue.

## Common root causes
- Bank rejected the mandate (details/authorisation).
- Mandate cancelled by the customer or bank.
- Webhook verification/processing failure so status never updated locally.

## Remediation
- No Tier-1 action — DD mandates are a third-party, customer-authorised flow.
- Failed/cancelled mandate: send the customer a fresh mandate setup link via the
  normal billing flow; do not attempt to force collections.
- Webhook issue: fix verification/processing and reconcile the mandate/invoice
  state.

## Rollback
None — never retry collections against an invalid mandate.

## Verification
Mandate is active at GoCardless, the next collection is scheduled, and invoice
state is current. Confirm with the customer.

## Communication
Explain the mandate needs re-setup and send the official link. No banking details
in the reply.

## Escalation
Broad mandate/webhook failure → payments incident. Persistent arrears → dunning
review (`dunning-stuck.md`).

## Prevention & follow-up
Add a GoCardless mandate-failure alert to close the parity gap with Stripe;
webhook signature-rejection tests (PR 12).

## Related
- Feature: `dunning-stuck.md`
- Open risk: GoCardless DLQ parity (`14-open-risks.md`)
