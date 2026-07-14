---
title: Stripe webhook backlog replay
area: payments
severity_default: P1
code_paths:
  - src/app/api/webhooks/stripe/route.ts
  - src/services/billing/stripe-event-processor.ts
  - src/services/billing/billing-events.ts
  - src/inngest/functions/stripe-webhook-dlq.ts
  - src/services/admin/tier1-actions/replay-dlq-webhook.ts
tables:
  - billing_events
  - subscriptions
admin_surfaces:
  - /admin/subscriptions
  - /admin/system-health
tier1_actions:
  - replay-dlq-webhook
  - restore-entitlement-from-stripe
alert_rules:
  - stripe_dlq_backlog
last_verified_commit: 4c3fe1ff
---

# Stripe webhook backlog replay

## Summary
The Stripe webhook DLQ has accumulated unprocessed events (entitlement/invoice
updates never applied). This runbook drains it safely, relying on the existing
idempotency guarantees so replays never double-apply.

## Symptoms
- `stripe_dlq_backlog` firing; count climbing.
- Multiple customers paid-but-no-access (or cancelled-but-still-active).
- `billing_events` shows a cluster of failed/unprocessed events.

## Customer impact
Money-touching and broad: real paying customers wrongly gated. P1 while the
backlog is non-zero.

## Severity
P1.

## Detection
- `stripe_dlq_backlog` diagnostic/alert.
- `/admin/system-health` deep-diagnostics DLQ count.

## Diagnosis
1. Read the DLQ errors — are they uniform (one structural cause) or varied
   (transient)?
2. If uniform/structural, FIX FORWARD FIRST: patch `stripe-event-processor.ts` (or
   the schema drift) and deploy — otherwise replays just re-fail.
3. If transient (a dependency blip that has recovered), proceed straight to replay.

## Remediation
1. Confirm the fix (if any) is deployed and green.
2. Replay events via **Tier-1 `replay-dlq-webhook`** (permission
   `manage_subscriptions`) — re-emits each event for the existing
   `stripe-webhook-dlq` consumer, which guards already-processed events. The
   `billing_events.stripe_event_id` UNIQUE + atomic claim make replays idempotent.
3. For any entitlement still wrong after replay, reconcile per account with
   **`restore-entitlement-from-stripe`**.
4. Work in batches for large backlogs; watch the count trend down.

## Verification
DLQ count returns to zero, `billing_events` shows events processed,
`subscriptions` match live Stripe, and affected customers regain access. Spot-check
a few real accounts, not just the count.

## Escalation
Backlog not draining after a deployed fix, or entitlements unreconcilable →
payments incident + engineering; keep the status page "Payments" updated.

## Follow-up
Add/extend signature-rejection + DLQ idempotency tests (PR 12); alert threshold
review; post-incident note on the structural cause.
