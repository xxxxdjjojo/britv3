---
title: AI cost anomaly
area: ai
severity_default: P3
code_paths:
  - src/services/ai/claude-service.ts
  - src/services/ai/types.ts
  - src/app/api/ai/generate-description/route.ts
tables: []
admin_surfaces:
  - /admin/system-health
tier1_actions: []
alert_rules: []
last_verified_commit: ebb22d7b
---

# AI cost anomaly

## Summary
Anthropic spend jumps unexpectedly — a retry loop, an abusive caller hammering an
AI endpoint, an oversized-context regression, or a genuine usage surge. Cost, not
availability, is the concern; the goal is to find and stop the driver without
killing a legitimate feature.

## Symptoms
- Anthropic billing/usage climbs faster than user growth explains.
- A single endpoint or user dominates AI calls.
- Latency/429s alongside the spend (a retry storm inflates both).

## Customer impact
None directly — this is a cost/abuse issue. P3 (raise if spend is runaway).

## Severity
P3.

## Detection
- Anthropic dashboard usage/billing trend (primary — we have no local `ai_usage`
  table yet; this is an open risk).
- Sentry for retry loops / repeated AI calls.
- Rate-limit signals on the AI routes.

## Diagnosis
1. Concentrated or broad? Identify the top caller/endpoint from provider usage +
   logs.
2. Retry storm (same request repeated) vs real demand vs a context-size regression
   (each call suddenly much larger)?
3. Abuse (one actor hammering an endpoint) vs organic growth.

## Remediation
- **Retry storm** → fix the retry logic in `claude-service.ts`; add/verify caching
  via `lib/cache/redis.ts`.
- **Abuse** → tighten rate limiting on the AI route; block the abusive actor.
- **Context bloat** → cap prompt/context size; trim what's sent to the model.
- **Organic surge** → capacity/budget decision, not an incident.
- Never disable AI silently platform-wide without noting the customer-facing effect.

## Verification
Spend returns to an expected trend, the dominant caller is controlled, and
legitimate AI features still work. Confirm over a following interval, not a single
reading.

## Escalation
Runaway spend you can't quickly attribute → the AI feature owner + finance
awareness; consider temporarily disabling the heaviest endpoint.

## Follow-up
Build local AI usage/cost instrumentation (an `ai_usage` table + an `ai.cost_spike`
alert rule) — currently deferred; track in `14-open-risks.md`.
