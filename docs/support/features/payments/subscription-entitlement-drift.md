---
title: Subscription entitlement drift
area: payments
severity_default: P1
code_paths:
  - src/services/billing/entitlements-service.ts
  - src/services/billing/stripe-event-processor.ts
  - src/services/admin/tier1-actions/restore-entitlement-from-stripe.ts
  - src/app/api/webhooks/stripe/route.ts
tables:
  - subscriptions
  - billing_events
admin_surfaces:
  - /admin/subscriptions
  - /admin/users
tier1_actions:
  - restore-entitlement-from-stripe
alert_rules:
  - stripe_dlq_backlog
last_verified_commit: 4c3fe1ff
---

# Subscription entitlement drift

## Summary
Stripe and the local `subscriptions` row disagree: Stripe says active but the app
shows lapsed (customer wrongly gated), or Stripe says cancelled but the app still
grants access. Caused by a missed/failed webhook.

## Symptoms
- Paid customer without access, or a cancelled customer who still has access.
- `subscriptions` status disagrees with the Stripe dashboard.
- Often paired with a `billing_events` failure or DLQ entry.

## Customer impact
Direct and money-related: wrongful denial of a paid service, or continued access
without payment. P1.

## Severity
P1 for wrongful denial of paid access; P2 for over-provisioning (revenue leak, no
customer harm).

## Detection
- `stripe_dlq_backlog` (the usual upstream cause).
- Customer ticket; `/admin/subscriptions` vs Stripe comparison.

## Scope check
One user (missed single event) vs many (systemic webhook failure — fix the
processor / drain the DLQ first).

## Code paths
Entitlement resolution `entitlements-service.ts`; provisioning
`stripe-event-processor.ts`; the reconciler
`src/services/admin/tier1-actions/restore-entitlement-from-stripe.ts` re-reads live
Stripe (Stripe is the source of truth) and upserts the local row.

## Data & tables
- `subscriptions` — the drifted row.
- `billing_events` — the webhook ledger; check for the missed event.

## Admin surfaces
`/admin/subscriptions`, `/admin/users/[id]`.

## Diagnosis
1. Compare the local `subscriptions` row to the live Stripe subscription (last-4
   customer handle from the triage packet).
2. Look for the missed/failed `billing_events` row.
3. Decide whether a single reconcile suffices or the DLQ must be drained.

## Common root causes
- Webhook missed or failed (DLQ) so the state change never applied.
- Manual Stripe-side change that never emitted/processed a webhook.

## Remediation
- **Tier-1 `restore-entitlement-from-stripe`** (permission `manage_subscriptions`,
  medium risk, reversible) — fetches the live Stripe subscription and reconciles
  the local row. Re-running just re-reads Stripe.
- If the root cause is a DLQ backlog, drain it (`replay-dlq-webhook` /
  `stripe-webhook-backlog-replay.md`) so drift doesn't recur.

## Rollback
Reversible — the action only mirrors current Stripe state; re-running converges.

## Verification
`subscriptions` matches live Stripe and the customer regains (or correctly loses)
access. Confirm the customer can use the product.

## Communication
"Your subscription is restored" once verified. For over-provisioning fixes, no
customer message is usually needed.

## Escalation
Cannot reconcile, or drift affects many accounts → payments incident.

## Prevention & follow-up
Keep the webhook DLQ healthy; alert on backlog; periodic reconcile sweep for
long-lived subscriptions.

## Related
- Tier-1: `restore-entitlement-from-stripe`, `replay-dlq-webhook`
- Feature: `stripe-webhook-failure-and-dlq.md`
