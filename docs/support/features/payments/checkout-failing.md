---
title: Checkout failing
area: payments
severity_default: P2
code_paths:
  - src/app/api/billing/checkout/route.ts
  - src/services/billing/billing-service.ts
  - src/lib/billing-config.ts
  - src/app/api/webhooks/stripe/route.ts
tables:
  - subscriptions
  - billing_events
admin_surfaces:
  - /admin/subscriptions
  - /admin/system-health
tier1_actions: []
alert_rules:
  - stripe_dlq_backlog
last_verified_commit: 4c3fe1ff
---

# Checkout failing

## Summary
A customer cannot complete a subscription checkout — the session won't create, the
redirect errors, or payment succeeds at Stripe but no local subscription appears
(which is really the webhook-drift class, cross-linked below).

## Symptoms
- "Checkout button does nothing / errors."
- Stuck on the Stripe hosted page or bounced back without a plan.
- Card charged but no access (→ entitlement drift).

## Customer impact
Blocks new revenue and upgrades. Visible friction at the point of payment.

## Severity
P2; P1 if checkout is down for everyone.

## Detection
- Sentry errors tagged `module: "payments"` on the checkout route.
- `stripe_dlq_backlog` if post-payment events are failing.
- Customer tickets.

## Scope check
One customer/plan vs all. All → checkout route or Stripe config incident. One →
plan/price mapping or the customer's payment method.

## Code paths
Session creation `src/app/api/billing/checkout/route.ts`; plan/price resolution in
`src/lib/billing-config.ts` and `billing-service.ts`; post-payment reconciliation
via the Stripe webhook.

## Data & tables
- `subscriptions` — the row created on successful checkout.
- `billing_events` — the webhook ledger that provisions it.

## Admin surfaces
`/admin/subscriptions`, `/admin/system-health`.

## Diagnosis
1. Reproduce; read the Sentry event + `correlation_id`.
2. Confirm the price/plan id resolves in `billing-config` for the segment.
3. If payment succeeded but no local sub → this is entitlement drift, use that
   playbook + `restore-entitlement-from-stripe`.

## Common root causes
- Missing/mismatched Stripe price id after a pricing change (see the pricing-v2
  provisioning scripts).
- Customer payment method declined (Stripe-side, not our bug).
- Post-payment webhook failed → drift.

## Remediation
- Config cause: correct the price/plan mapping and redeploy; re-verify with a test
  checkout.
- Payment declined: guide the customer to retry with a valid method — nothing to
  fix on our side.
- Paid-but-no-access: switch to `subscription-entitlement-drift.md` and run
  `restore-entitlement-from-stripe`.

## Rollback
If a recent pricing/config deploy broke checkout, roll it back
(`deploy-rollback.md`) while fixing forward.

## Verification
A fresh checkout completes and creates the correct `subscriptions` row; the
customer has access. Confirm impact.

## Communication
Status page under "Payments" if broadly down; otherwise reply on the ticket.

## Escalation
All-customer checkout failure → payments incident + engineering.

## Prevention & follow-up
Keep Stripe price provisioning idempotent and verified; include checkout in
post-deploy smoke after any billing-config change.

## Related
- Feature: `subscription-entitlement-drift.md`, `stripe-webhook-failure-and-dlq.md`
- Runbook: `deploy-rollback.md`
