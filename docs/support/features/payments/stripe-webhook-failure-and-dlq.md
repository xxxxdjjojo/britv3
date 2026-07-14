---
title: Stripe webhook failure and DLQ
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
alert_rules:
  - stripe_dlq_backlog
last_verified_commit: 4c3fe1ff
---

# Stripe webhook failure and DLQ

## Summary
A Stripe webhook was received but its processing failed and the event landed in
the dead-letter queue, so the local billing state (entitlement, invoice) never
updated. Money moved at Stripe; the app didn't reflect it.

## Symptoms
- `stripe_dlq_backlog` alert firing (unresolved DLQ events).
- Customer paid but has no access, or a cancel/refund didn't remove access.
- `billing_events` rows for the event id show a failed/unprocessed state.

## Customer impact
Direct: paid customers without entitlement, or the reverse. Money-touching, so
this is the highest-priority payments class.

## Severity
P1 while the backlog is non-zero (real customers wrongly gated).

## Detection
- Alert `stripe_dlq_backlog` (diagnostic over `billing_events`).
- `/admin/system-health` deep panel DLQ count.
- Customer tickets about paid-but-no-access.

## Scope check
One event vs many. A rising backlog across event types = the processor or a
dependency is broken — treat as an incident, use the replay runbook.

## Code paths
Ingress `src/app/api/webhooks/stripe/route.ts` (signature-verified, idempotent via
`billing_events.stripe_event_id` UNIQUE + atomic claim); handler
`stripe-event-processor.ts`; DLQ consumer `src/inngest/functions/stripe-webhook-dlq.ts`,
which already guards already-processed events.

## Data & tables
- `billing_events` — the idempotency ledger and DLQ source of truth.
- `subscriptions` — the entitlement rows the handler upserts.

## Admin surfaces
`/admin/subscriptions`, `/admin/system-health`.

## Diagnosis
1. Read the failed `billing_events` row(s) and the DLQ error.
2. Determine whether the failure is transient (dependency blip) or structural
   (handler bug / schema drift).
3. Confirm the underlying Stripe object state via the Stripe dashboard (by the
   last-4 handle from the triage packet).

## Common root causes
- Transient dependency error during processing (DB/Stripe blip).
- Handler bug or schema drift for a specific event type.
- Signature/verification failure upstream (event never processed).

## Remediation
- **Tier-1 `replay-dlq-webhook`** (permission `manage_subscriptions`, medium risk,
  reversible) — re-emits the event for the existing DLQ consumer, which is
  idempotent so it will not double-apply.
- For a structural bug, fix the handler and deploy before replaying, or the
  replay just re-fails.
- Systemic backlog → follow `stripe-webhook-backlog-replay.md`.

## Rollback
Replay is idempotent; the idempotency ledger prevents double-application, so no
rollback is needed for a clean replay.

## Verification
`billing_events` shows the event processed, `subscriptions` matches live Stripe,
and the customer regains (or correctly loses) access. Confirm customer impact.

## Communication
Reply once entitlement is corrected. For a broad backlog, post to the status page
under "Payments".

## Escalation
Backlog not draining, or entitlement can't be reconciled → incident + engineering
(`stripe-webhook-backlog-replay.md`).

## Prevention & follow-up
Signature-rejection + DLQ idempotency tests (PR 12); alert on backlog; monitor the
DLQ consumer's own health.

## Related
- Tier-1: `replay-dlq-webhook`, `restore-entitlement-from-stripe`
- Alert: `stripe_dlq_backlog`
- Runbook: `stripe-webhook-backlog-replay.md`
