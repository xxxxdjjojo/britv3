# Post-Incident Review — [INCIDENT TITLE]

> Blameless. The goal is to fix the **system and process** that let an error reach customers,
> not to assign fault. Complete within 5 business days of resolution.

## Summary

- **Incident title:**
- **Date / time (start → resolved, timezone):**
- **Severity (P0–P4 / SEV):**
- **Duration (customer-impact window):**
- **Customer impact:** (who, how many, what they experienced)
- **Business impact:** (revenue, trust, compliance exposure)
- **Detection method:** (alert / dead-man switch / Sentry / customer ticket / manual)

## Timeline

| Time | Event | Actor |
|---|---|---|
| | Detected | |
| | Confirmed / declared | |
| | Contained | |
| | Communicated | |
| | Recovered | |
| | Verified (customer impact gone) | |
| | Closed | |

## Root cause

- **Root cause:** (the system/process condition that made the failure possible and
  customer-visible)
- **Contributing factors:** (what amplified or prolonged it)

> Do **not** stop at "human error". A person making a mistake is expected; the review's job is
> to identify the missing guardrail — the absent test, the unvalidated input, the alert that
> didn't fire, the deploy without a rollback path — that allowed the mistake to reach
> customers. If your root cause is "someone did X", ask "why did the system let X cause impact?"

## Analysis

- **What worked** (kept it from being worse):
- **What failed** (detection, response, tooling, comms):
- **Why existing controls did not prevent it:**

## Corrective actions

| Action | Owner | Deadline | Type (test / alert / runbook / code / process) |
|---|---|---|---|
| | | | |

## Durable improvements (required)

- **New / updated automated test(s):**
- **New / updated playbook or runbook:**
- **New / updated monitoring or alert threshold:**

## Follow-up

- Linked risk-register rows (`docs/production-support/03-risk-register.md`):
- Linked open-risks (`docs/production-support/14-open-risks.md`):
- If personal-data / security: compliance breach record reference (compliance pack):
