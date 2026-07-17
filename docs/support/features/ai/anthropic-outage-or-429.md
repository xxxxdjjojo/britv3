---
title: Anthropic outage or rate-limiting (429)
area: ai
severity_default: P3
code_paths:
  - src/services/ai/claude-service.ts
  - src/app/api/ai/generate-description/route.ts
  - src/lib/cache/redis.ts
tables: []
admin_surfaces:
  - /admin/system-health
tier1_actions: []
alert_rules: []
last_verified_commit: ebb22d7b
---

# Anthropic outage or rate-limiting (429)

## Summary
AI-assisted features (listing description generation, AI summaries) fail because
the Anthropic API is down, returning 429s, or our key/quota is exhausted. These
are enhancement features — the core product works without them, so they must
degrade gracefully.

## Symptoms
- AI generation buttons error or hang; "couldn't generate" messaging.
- Sentry errors from `claude-service.ts` / the AI route with 429 or 5xx.
- Spikes correlate with high AI usage or a billing/quota limit.

## Customer impact
Users lose the AI assist but can still complete the task manually (write their own
description). P3.

## Severity
P3.

## Detection
- Sentry on the AI service/route (status codes 429/5xx).
- `/admin/system-health` (Anthropic ping, if configured).
- Correlated usage spike.

## Diagnosis
1. Provider outage vs our rate-limit vs our quota/billing? Check the Anthropic
   status page and the error code/body.
2. 429 → we're being throttled; is there a usage spike or a retry storm amplifying
   it?
3. Auth/quota error → `ANTHROPIC_API_KEY` invalid or account quota hit.

## Remediation
- **Provider outage** → surface a graceful "AI temporarily unavailable" state; the
  manual path must remain fully usable. Do not hard-fail the page.
- **Throttling** → back off/retry sanely (cache where possible via
  `lib/cache/redis.ts`); avoid retry storms that deepen the 429s.
- **Quota/billing** → resolve the account limit; never log the API key.
- Confirm no user-facing flow is *blocked* on AI — if it is, that coupling is the
  real bug to fix.

## Verification
AI generation succeeds again for a test input, and with AI forced-off the manual
flow still completes. Confirm the feature degrades, not breaks.

## Escalation
Sustained outage or quota problem → the AI feature owner; consider disabling the AI
entry points via config until recovery.

## Follow-up
Ensure every AI surface has a working non-AI fallback; see `ai-cost-anomaly.md` for
the spend side. Usage/cost instrumentation is an open risk (no `ai_usage` table
yet) — track in `14-open-risks.md`.
