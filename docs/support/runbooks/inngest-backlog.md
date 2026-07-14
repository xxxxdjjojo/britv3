---
title: Inngest backlog
area: infra
severity_default: P2
code_paths:
  - src/inngest/client.ts
  - src/app/api/inngest/route.ts
  - src/inngest/functions/stripe-webhook-dlq.ts
  - src/services/admin/tier1-actions/replay-dlq-webhook.ts
tables:
  - billing_events
admin_surfaces:
  - /admin/system-health
  - /admin/subscriptions
tier1_actions:
  - replay-dlq-webhook
alert_rules:
  - stripe_dlq_backlog
last_verified_commit: ebb22d7b
---

# Inngest backlog

## Summary
Inngest background processing has stalled or is backing up. The critical fallout is
the Stripe webhook DLQ not draining — entitlement/invoice updates never apply, so
paying customers get wrongly gated. This runbook restores job processing and drains
the DLQ idempotently.

## Symptoms
- `stripe_dlq_backlog` climbing.
- Lifecycle drips stalled; alert-engine tick not firing.
- Inngest dashboard shows queued/failed runs or no recent runs.

## Customer impact
DLQ backlog → real paying customers paid-but-no-access (or cancelled-but-active).
High when money is involved. P2 default, P1 once paying customers are affected.

## Severity
P2; P1 when the DLQ backlog hits paying customers.

## Detection
- `stripe_dlq_backlog` diagnostic/alert.
- Inngest dashboard run history.
- `/admin/system-health` (Inngest ping, if configured).

## Diagnosis
1. Platform issue vs our endpoint/auth? Check Inngest status and that
   `api/inngest/route.ts` is reachable with a valid `INNGEST_SIGNING_KEY`.
2. Runs failing (erroring) vs not triggered at all?
3. For the DLQ, is the backlog structural (every event re-fails — fix forward first)
   or transient? Cross-reference `stripe-webhook-backlog-replay.md`.

## Remediation
1. **Endpoint/auth regression** → restore the Inngest route/signing key, redeploy;
   durable jobs resume.
2. **Platform outage** → wait/liaise with Inngest; jobs resume on recovery.
3. **Drain the DLQ** → once jobs run, replay via Tier-1 `replay-dlq-webhook`
   (permission `manage_subscriptions`). `billing_events.stripe_event_id` UNIQUE +
   atomic claim make replays idempotent — no double-apply. Work in batches for a
   large backlog.
4. Reconcile any still-wrong entitlement with `restore-entitlement-from-stripe`.
- Never manually re-fire jobs in a way that bypasses idempotency guards.

## Verification
Recent Inngest runs succeed, `stripe_dlq_backlog` returns to zero, `billing_events`
show processed, and affected customers regain access. Spot-check real accounts, not
just the count.

## Escalation
Backlog not draining after the endpoint is healthy → payments/infra incident; keep
the status page current.

## Follow-up
Post-incident review; PR 12 DLQ idempotency tests; alert-engine sharing fate with
Inngest is an open risk (`14-open-risks.md`). See `features/infra/inngest-backlog.md`.
