---
title: Upstash Redis down
area: infra
severity_default: P2
code_paths:
  - src/lib/cache/redis.ts
  - src/lib/rate-limit-memory.ts
tables: []
admin_surfaces:
  - /admin/system-health
tier1_actions: []
alert_rules: []
last_verified_commit: ebb22d7b
---

# Upstash Redis down

## Summary
Upstash Redis is unreachable. Redis backs rate limiting and caching, so the key
question is the fail-open/fail-closed behaviour: does the app degrade (memory
fallback) or does it block requests? This runbook drives you to confirm the actual
behaviour rather than assume it.

## Symptoms
- Redis connection errors in Sentry from `lib/cache/redis.ts`.
- Rate-limited endpoints behaving differently (either unlimited, or refusing all).
- Cache-backed responses slower (cache misses everywhere).

## Customer impact
Depends entirely on fail-open vs fail-closed. Fail-open → abuse-protection gap but
users unaffected; fail-closed → legitimate requests refused. P2 until the behaviour
is confirmed.

## Severity
P2.

## Detection
- Sentry Redis connection errors.
- `/admin/system-health` Redis ping.
- Rate-limit behaviour change on protected endpoints.

## Diagnosis
1. Provider outage vs our credentials/URL? Check Upstash status +
   `UPSTASH_REDIS_*` env.
2. What is the real fallback? `rate-limit-memory.ts` exists as an in-memory path —
   confirm whether the limiter actually fails open to it or fails closed when Redis
   is down (this is a documented open risk; verify, don't assume).
3. Which endpoints are affected — auth rate limiting is the sensitive one.

## Remediation
- **Provider outage** → rely on the fallback; publish a status note if user-facing.
  If it fails *closed* and blocks users, that coupling is the incident — ship the
  graceful-degradation fix.
- **Credential/URL regression** → restore `UPSTASH_REDIS_*` and redeploy; never log
  the token.
- Do not remove rate limiting entirely to "unblock" — that opens an abuse hole;
  prefer the memory fallback.

## Verification
Redis reachable again (`/admin/system-health` green), rate limiting behaves
correctly, and cache hit-rate recovers. Confirm auth endpoints are neither wide
open nor blocking valid users.

## Escalation
Sustained outage with a fail-closed impact → infra owner; treat an auth-limiter gap
as a security-relevant issue.

## Follow-up
PR 12 backfill: a test that pins the rate-limiter's actual behaviour with Upstash
down. Upstash as a single point for rate limiting is an open risk
(`14-open-risks.md`).
