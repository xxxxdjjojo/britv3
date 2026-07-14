# Tabletop — Stripe webhook outage / DLQ backlog

**Date:** 2026-07-14
**Type:** Paper exercise (no production changes)
**Facilitator:** production-support initiative (PR 13)
**Scenario owner runbook:** `docs/support/runbooks/stripe-webhook-backlog-replay.md`
**Supporting:** `docs/support/features/payments/stripe-webhook-failure-and-dlq.md`,
`docs/incidents/incident-response-plan.md`, `docs/incidents/comms-templates.md`

A tabletop walks the team through an incident on paper to test whether the plan,
runbooks, alerts, and tools actually connect — *before* a real 3am page. This is the
first record; findings feed `14-open-risks.md`.

## Scenario

Stripe webhook delivery to `/api/webhooks/stripe` starts failing. Events are landing in
the DLQ (`billing_events.status='failed'`) and not applying. Symptom in the wild:
customers who just paid are still gated ("I paid but I don't have access"); a few
cancellations haven't taken effect either.

## Injects & walkthrough

**T+0 — Detection.** The `stripe_dlq_backlog` alert rule (`alert-rules.ts`, surfaced via
`diagnostics-service.ts`) fires: backlog > 0, climbing. Email lands at `OPS_ALERT_EMAIL`.
- *Check:* does the alert carry enough to triage without exposing PII? ✅ — summary is a
  count only, no row contents (enforced by alert-rule tests).

**T+10 — Declare & classify.** Per the incident plan, money-affecting → **SEV-2**,
escalating to **SEV-1** once paying customers are confirmed affected. Incident commander
assigned; scribe starts a timeline.
- *Check:* severity ladder unambiguous? ✅ — the runbook pre-declares "P1 once paying
  customers are affected."

**T+15 — Communicate.** Post the **investigating** template to `/status` (admin publishes
an incident, PR 3) and internally.
- *Check:* is there a payment-specific external template? ⚠️ **Gap** — `comms-templates.md`
  has investigating/identified/monitoring/resolved + security, but a payment-specific
  customer message ("your payment succeeded; access may be delayed") would reduce inbound
  ticket volume. → finding F1.

**T+20 — Diagnose.** Follow `stripe-webhook-backlog-replay.md`: is the endpoint/signing
key healthy, or is Stripe itself failing? Confirm `/admin/system-health` (Stripe ping) and
whether the failure is structural (every event re-fails → fix forward first) or transient.

**T+35 — Remediate.** Once the endpoint is healthy, drain the DLQ via Tier-1
`replay-dlq-webhook` (permission `manage_subscriptions`, audited). Idempotency
(`billing_events.stripe_event_id` UNIQUE + atomic claim) makes replay safe — no
double-charge, no double-apply. Work in batches for a large backlog.
- *Check:* is replay idempotency actually tested? ✅ — PR 12 added
  `billing-events.test.ts` (claim double-claim contract) + the route duplicate-dispatch
  test. The tabletop's key assumption is backed by a test.

**T+50 — Verify customer impact (not just the count).** Spot-check specific affected
accounts regain access; reconcile any still-wrong entitlement with
`restore-entitlement-from-stripe`. Per the operating principle: **not resolved until
customer impact is verified**, not merely until the backlog reads zero.

**T+60 — Resolve & communicate.** `stripe_dlq_backlog` back to zero, accounts confirmed,
post the **resolved** template. Schedule the blameless post-incident review
(`post-incident-template.md`).

## Findings

| ID | Finding | Action |
|---|---|---|
| F1 | No payment-specific customer comms template | Add a "payment received, access delayed" template to `comms-templates.md` → candidate for PR 14 |
| F2 | `replay-dlq-webhook` is the single drain path; a bad-forward-fix could mass-replay still-failing events | Runbook already says "fix forward first"; consider a batch cap / dry-run preview on the Tier-1 action |
| F3 | Alert engine shares fate with Inngest (if Inngest is the failure, the DLQ alert may itself be delayed) | Already tracked as OR-02; dead-man switch covers total outage only |
| F4 | PITR RTO for a payments-data corruption path is unmeasured | Tracked as OR-09; a future tabletop should pair with a real PITR-to-branch restore |

## Outcome

The plan, runbook, alert, Tier-1 action, and idempotency test **connect end-to-end** — an
on-call engineer following the runbook reaches resolution without improvising. Two comms/UX
gaps (F1, F2) are cheap to close; F3/F4 are already-known open risks. No blocker found.
