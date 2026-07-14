---
title: Redis down (Upstash)
area: infra
severity_default: P2
code_paths:
  - src/lib/cache/redis.ts
  - src/lib/rate-limit-memory.ts
  - src/services/admin/health-service.ts
tables: []
admin_surfaces:
  - /admin/system-health
tier1_actions: []
alert_rules: []
last_verified_commit: ebb22d7b
---

# Redis down (Upstash)

## Summary
Upstash Redis is unreachable. Redis backs rate limiting and caching. The decisive
question is fail-open vs fail-closed: does the app degrade gracefully to the memory
fallback, or does it refuse requests? This runbook confirms the behaviour and
restores Redis.

## Symptoms
- Redis connection errors in Sentry (`lib/cache/redis.ts`).
- Rate-limited endpoints behaving abnormally (unlimited, or refusing everyone).
- Cache-backed pages slower (misses everywhere).

## Customer impact
Fail-open → abuse-protection gap, users unaffected. Fail-closed → legitimate
requests refused (worst on auth endpoints). P2 until the behaviour is confirmed.

## Severity
P2.

## Detection
- Sentry Redis connection errors.
- `/admin/system-health` Redis ping.
- Rate-limit behaviour change on protected endpoints.

## Diagnosis
1. Provider outage vs our credentials? Check Upstash status + `UPSTASH_REDIS_*` env.
2. Confirm the real fallback: `rate-limit-memory.ts` exists — verify whether the
   limiter actually fails open to it or fails closed (documented open risk; the
   PR 12 test pins this).
3. Identify affected endpoints — auth rate limiting is the sensitive one.

## Remediation
- **Provider outage** → rely on the fallback; publish a status note if user-facing.
  If it fails closed and blocks users, ship the graceful-degradation fix — that
  coupling is the incident.
- **Credential/URL regression** → restore `UPSTASH_REDIS_*`, redeploy; never log the
  token.
- Do not strip rate limiting to "unblock" — prefer the memory fallback; removing it
  opens an abuse hole.

## Verification
`/admin/system-health` Redis green, rate limiting correct, cache hit-rate recovered,
and auth endpoints neither wide-open nor blocking valid users. Confirm with a real
login + a rate-limited endpoint.

## Escalation
Sustained outage with fail-closed impact → infra owner; treat an auth-limiter gap as
security-relevant.

## Follow-up
Post-incident review; PR 12 rate-limiter-with-Redis-down test; Upstash single point
for rate limiting tracked in `12-open-risks`/`14-open-risks.md`. See
`features/infra/upstash-redis-down.md`.
