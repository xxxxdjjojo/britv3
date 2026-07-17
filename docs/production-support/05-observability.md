# Observability

**Owner:** [INFORMATION REQUIRED]

What is instrumented, where, and how to read it. This is the map you use during an incident to find signal fast.

## Error tracking — Sentry

- Config: `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation.ts` (server/edge boot), `src/instrumentation-client.ts` (browser). `sendDefaultPii: false`; server strips `cookie`/`authorization` headers; client replay masks all text + blocks media.
- **Structured context is the key to triage.** Never call `Sentry.captureException` directly — use `src/lib/observability/capture-exception.ts`, which attaches `module`, `feature`, `operation`, `correlationId`, `tags`, `extra`. This is what makes Sentry searchable by subsystem (e.g. `module:payments`, `module:auth`) — the alert rules in `04-alerting.md` depend on these tags existing.
- Error boundaries: `src/app/error.tsx` (route) and `src/app/global-error.tsx` (root) both capture before rendering the fallback.

## Correlation IDs

- `src/lib/observability/correlation-id.ts`: reads `x-correlation-id` (fallback `x-request-id`), validates `^[A-Za-z0-9._:-]{8,128}$`, generates a UUID otherwise.
- This is the join key across request → handler → Sentry, and (PR 6) onto `support_tickets.correlation_id`. Given a ticket's correlation ID you can jump straight to the Sentry trace.

## Logging

- `src/lib/logger.ts`: minimal JSON logger (`log(level, message, context)`) → stdout/stderr (visible in Vercel logs). Not a full structured-logging stack — Sentry carries the rich context. Console usage is being migrated to `captureException` (tracked TODO in the error boundaries).

## Uptime & health

- Public probe: `src/app/api/health/route.ts` (rate-limited, DB ping, returns only `{ ok, latencyMs, ts }`).
- Cron: `.github/workflows/uptime-ping.yml` (every 15 min, external vantage point) → inserts into `public.uptime_checks`.
- History: `src/app/(main)/metrics/page.tsx` (trailing-30d availability) and `src/app/(main)/status/page.tsx` (live status).
- Dependency pings: `src/services/admin/health-service.ts` — `pingSupabase / pingStripe / pingResend / pingPostHog` (public `getHealthStatus`, cached 30s) plus `pingAnthropic / pingRedis` and `getDeepHealthStatus` for the admin panel.

## Deep diagnostics (privileged)

`src/services/admin/diagnostics-service.ts`, surfaced on `/admin/system-health` and via `GET /api/admin/diagnostics` (gated on `view_system_health`; internal `error` strings stripped from the response). DB-derived signals the shallow pings can't see:

| Diagnostic | Source | Thresholds |
|---|---|---|
| Uptime probe freshness | latest `uptime_checks.checked_at` | warn > 20 min, critical > 45 min (cron broke) |
| Stripe webhook DLQ | `billing_events` where `status='failed'` | critical if > 0 (money) |
| Email failures (24h) | `email_logs` `status in (failed,bounced)` trailing 24h | warn ≥ 5, critical ≥ 20 |
| GDPR request age | oldest open `gdpr_requests` (`pending`/`in_progress`) | warn ≥ 20d, critical ≥ 25d (30-day deadline) |

Each check is defensive: a query error yields `unknown`, never a crashed page. Only counts/ages are returned — never row contents.

## Analytics

- PostHog: `src/lib/posthog.ts` (client, `person_profiles: identified_only`, manual pageviews), `src/lib/analytics/track-event.ts` (error-swallowing event helper). Domain analytics services under `src/services/*/analytics-service.ts`.
- GA4: `src/components/analytics/GoogleAnalytics.tsx`, consent-gated.

## What's NOT instrumented (see `14-open-risks.md`)

No OpenTelemetry/distributed tracing (monolith), no centralized log aggregation/warehouse drain, no Vercel Speed Insights. Sentry + Vercel dashboards + the diagnostics panel are the current toolset.
