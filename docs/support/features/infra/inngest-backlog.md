---
title: Inngest backlog / jobs not running
area: infra
severity_default: P2
code_paths:
  - src/inngest/client.ts
  - src/app/api/inngest/route.ts
  - src/inngest/functions/stripe-webhook-dlq.ts
tables:
  - billing_events
admin_surfaces:
  - /admin/system-health
tier1_actions:
  - replay-dlq-webhook
alert_rules:
  - stripe_dlq_backlog
last_verified_commit: ebb22d7b
---

# Inngest backlog / jobs not running

## Summary
Inngest background jobs (webhook DLQ processing, lifecycle drips, alert-engine tick)
have stopped running or are backing up. The most consequential fallout is the
Stripe webhook DLQ not draining — money-touching entitlement updates stall.

## Symptoms
- `stripe_dlq_backlog` climbing (DLQ not processed).
- Lifecycle drips stalled (`email/lifecycle-drip-stuck.md`); alert-engine tick not
  firing.
- Inngest dashboard shows queued/failed runs or no recent runs.

## Customer impact
Depends on which jobs are stuck. DLQ backlog → paying customers wrongly gated
(high). Drips stalled → low. P2 default, P1 if the DLQ backlog is affecting paying
customers.

## Severity
P2; P1 when the Stripe DLQ backlog hits real customers.

## Detection
- `stripe_dlq_backlog` diagnostic/alert.
- Inngest dashboard run history.
- `/admin/system-health` (Inngest ping, if configured).

## Diagnosis
1. Inngest platform issue vs our endpoint/auth? Check Inngest status and that
   `api/inngest/route.ts` is reachable with a valid `INNGEST_SIGNING_KEY`.
2. Are runs failing (erroring) or not being triggered at all?
3. For the DLQ specifically, is the backlog structural (every event re-fails) or
   transient? See `runbooks/stripe-webhook-backlog-replay.md`.

## Remediation
- **Endpoint/auth regression** → restore the Inngest route/signing key and redeploy;
  queued jobs resume.
- **Platform outage** → wait/liaise with Inngest; jobs are durable and resume.
- **DLQ drain** → once jobs run, replay via Tier-1 `replay-dlq-webhook`
  (`billing_events.stripe_event_id` UNIQUE + atomic claim keep replays idempotent);
  full procedure in `runbooks/stripe-webhook-backlog-replay.md`.
- Never manually re-fire jobs in a way that bypasses idempotency guards.

## Verification
Recent Inngest runs succeed, `stripe_dlq_backlog` trends to zero, and affected
customers' entitlements reconcile. Spot-check real accounts, not just the count.

## Escalation
Backlog not draining after the endpoint is healthy → payments/infra incident; keep
the status page current. See `runbooks/inngest-backlog.md`.

## Follow-up
DLQ idempotency + replay tests (PR 12). Alert-engine sharing fate with Inngest is an
open risk (`14-open-risks.md`).
