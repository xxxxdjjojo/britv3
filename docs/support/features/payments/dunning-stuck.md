---
title: Dunning stuck
area: payments
severity_default: P3
code_paths:
  - src/lib/truedeed/dunning-machine.ts
  - src/services/truedeed/dunning-service.ts
  - src/inngest/functions/truedeed-dunning-tick.ts
tables:
  - invoices
  - invoice_events
  - payment_schedules
admin_surfaces:
  - /admin/subscriptions
  - /admin/system-health
tier1_actions: []
alert_rules: []
last_verified_commit: 4c3fe1ff
---

# Dunning stuck

## Summary
The dunning state machine has stalled: an overdue invoice isn't advancing through
retry/notify stages, or (worse) it's escalating against a customer who has
actually paid.

## Symptoms
- A customer keeps getting "payment failed" reminders after paying.
- An overdue invoice never progresses (no reminders, no escalation).
- The dunning Inngest tick isn't running or errors.

## Customer impact
False dunning erodes trust and can wrongly threaten access; stalled dunning leaks
revenue. Usually P3 unless it wrongly gates access (then P2).

## Severity
P3; P2 if a paid customer is being denied access by an incorrect dunning state.

## Detection
- Inngest tick failures / stalled `truedeed-dunning-tick`.
- Customer ticket ("I paid but keep getting chased").
- No dedicated alert yet — monitor via Inngest health (see `inngest-backlog.md`,
  PR 11).

## Scope check
One invoice vs many. Many stalled = the tick/machine is broken (incident); one =
a single reconciliation.

## Code paths
State transitions `src/lib/truedeed/dunning-machine.ts`; orchestration
`dunning-service.ts`; the scheduled driver `truedeed-dunning-tick.ts`.

## Data & tables
- `invoices` — the debt and its status.
- `invoice_events` — the dunning state history.
- `payment_schedules` — upcoming/failed collection attempts.

## Diagnosis
1. Confirm the tick is running (Inngest) and not erroring.
2. Read `invoice_events` for the invoice — where did it stall?
3. Cross-check actual payment: did the customer pay (Stripe/GoCardless) while
   dunning kept running?

## Common root causes
- Inngest tick not firing (backlog/deploy) so state never advances.
- A payment landed but its webhook didn't clear the dunning state (drift).
- A machine edge-case with no outgoing transition.

## Remediation
- No Tier-1 action — dunning fixes are invoice-state reconciliations, not
  self-serve remedies.
- If paid-but-still-chased: reconcile the payment (see the relevant webhook/DLQ
  playbook), which should transition the invoice to paid and halt dunning.
- If the tick is down: restore Inngest (`inngest-backlog.md`) so the machine
  resumes.

## Rollback
None — reconcile to the true paid/unpaid state; never blanket-cancel dunning.

## Verification
The invoice reflects the true payment state, dunning has stopped (if paid) or
resumed correctly (if genuinely overdue), and the customer confirms.

## Communication
Apologise for erroneous reminders once corrected; be precise, not defensive.

## Escalation
Machine broken for many invoices → payments incident + engineering.

## Prevention & follow-up
Ensure payment webhooks clear dunning; add tick-health monitoring; state-machine
edge tests.

## Related
- Feature: `gocardless-mandate-failures.md`, `stripe-webhook-failure-and-dlq.md`
- Runbook: `inngest-backlog.md` (PR 11)
