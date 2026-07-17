---
title: Lifecycle drip emails stuck
area: email
severity_default: P3
code_paths:
  - src/inngest/functions/lifecycle-drip.ts
  - src/services/email/lifecycle/lifecycle-email-service.ts
  - src/services/email/lifecycle/sequences.ts
tables:
  - email_logs
admin_surfaces:
  - /admin/system-health
tier1_actions: []
alert_rules:
  - email_failures_24h
last_verified_commit: ebb22d7b
---

# Lifecycle drip emails stuck

## Summary
The role-based lifecycle drip sequences (onboarding nudges, re-engagement) have
stopped advancing — users aren't getting the next step. This is a scheduled-job
problem, usually the Inngest cron not firing or the sequence logic gating everyone
out, not a transactional-email outage.

## Symptoms
- No lifecycle mail sent for a stretch while transactional email still works.
- A cohort stuck at the same drip step.
- `email_logs` shows lifecycle template sends dropping to zero at a timestamp.

## Customer impact
Low direct impact — onboarding/engagement nudges are missed, not core function.
P3.

## Severity
P3.

## Detection
- `email_logs` lifecycle-template volume trending to zero.
- Inngest dashboard: is `lifecycle-drip` running on schedule and succeeding?
- `email_failures_24h` if sends are attempted-but-failing rather than not-attempted.

## Diagnosis
1. Attempted-but-failing vs not-attempted? Not-attempted → the Inngest cron isn't
   firing (see `runbooks/inngest-backlog.md`). Failing → an email/provider issue
   (`resend-outage.md`).
2. Check the sequence logic in `sequences.ts` — a bad eligibility condition can gate
   the whole cohort out.
3. Confirm `INNGEST_SIGNING_KEY` and the Inngest route are healthy.

## Remediation
- **Cron not firing** → recover Inngest (`runbooks/inngest-backlog.md`); the drip
  resumes idempotently on the next tick.
- **Sequence-logic regression** → fix `sequences.ts` / `lifecycle-email-service.ts`
  and deploy through the normal PR flow; the drip catches up on schedule.
- Do not blast a manual backfill that double-sends — the sequence is designed to
  advance one step per eligible user per run.

## Verification
The next scheduled `lifecycle-drip` run sends the expected step, `email_logs` shows
lifecycle sends resuming, and a test user advances one step. Confirm no duplicate
sends.

## Escalation
Inngest platform problem → `runbooks/inngest-backlog.md`. Persistent logic bug →
the owning engineer.

## Follow-up
Add a light "lifecycle sends in last 24h" signal to diagnostics so a silent stall
is visible; regression-test the eligibility condition that broke.
