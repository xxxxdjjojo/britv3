# Alerting

**Owner:** [INFORMATION REQUIRED]

Alerts are built around **customer impact**, delivered by **email**, and deduped so they don't become noise. Two engines cover two failure domains.

## Engine 1 — in-app alert engine (`alert-engine-tick`)

- **Where:** `src/inngest/functions/alert-engine-tick.ts` (Inngest cron `*/15 * * * *` + manual `alerts/engine.tick-requested`).
- **How:** `gatherFindings` evaluates rules over current DB snapshots → `runAlertEngine` reconciles findings against the `alert_events` ledger (dedup by `fingerprint`) → emails `OPS_ALERT_EMAIL` via `sendOpsAlertEmail`. **Email fires only on the transition to firing**, so a persistent condition mails once, not every 15 minutes. Resolution flips the row to `resolved`.
- **Idempotency:** a partial unique index (`alert_events_one_firing`) guarantees at most one firing row per fingerprint; re-running the tick opens nothing new.
- **Safety:** rule summaries carry only counts/rates — never row contents or PII (enforced by `alert-rules.ts` + tests).

### Rule catalogue (computable from existing tables)

| Rule key | Source | Threshold | Severity |
|---|---|---|---|
| `uptime_probe_staleness` | `uptime_checks.checked_at` | warn > 20 min, critical > 45 min | warn/critical |
| `uptime.consecutive_failures` | last 3 `uptime_checks.ok` | 3 in a row false | critical |
| `stripe_dlq_backlog` | `billing_events` `status='failed'` | > 0 | critical (money) |
| `email_failures_24h` | `email_logs` `status in (failed,bounced)` 24h | warn ≥ 5, critical ≥ 20 | warn/critical |
| `gdpr_deadline_risk` | oldest open `gdpr_requests` | warn ≥ 20d, critical ≥ 25d | warn/critical |

The DB-threshold rules reuse `diagnostics-service` (single source of truth — see `05-observability.md`). New rules are added as pure functions in `src/services/alerts/alert-rules.ts` with a table-driven test.

## Engine 2 — dead-man switch (external)

The in-app engine runs inside Vercel/Inngest, so a **full outage would silence it**. `.github/workflows/uptime-ping.yml` (GitHub Actions, external vantage point) emails ops directly via the Resend HTTP API when the 15-minute probe reports the site down. This is the only alert that survives a total outage.

**Required Actions secrets:** `SUPABASE_DB_URL`, `RESEND_API_KEY`, `OPS_ALERT_EMAIL`, `ALERT_FROM` (a Resend-verified sender). The step skips quietly if any is unset — the probe itself never fails.

## Engine 3 — Sentry alert rules (configured in the vendor UI)

Not computable in-app; configure these in Sentry (documented here because the config isn't as-code — see `14-open-risks.md` OR-03):

- **New issue** tagged `module:payments` or `module:auth` → email. (These tags come from `capture-exception.ts`.)
- **Error-rate spike** on the whole project (session-based) → email.
- **Cron monitor** on `alert-engine-tick` — alerts if the engine itself stops running (the meta-alert the in-app engine can't raise about itself).

## Env / setup checklist

- `OPS_ALERT_EMAIL` (app env, Vercel) — destination for in-app alerts. Unset → alerts recorded in `alert_events` but not emailed.
- Actions secrets for the dead-man switch (above).
- Sentry rules configured per the list above.

## Anti-fatigue design

Dedup by fingerprint; email only on transition to firing; recovery flips to resolved; severity split (warning vs critical); conservative thresholds tuned via the backlog. If a rule gets noisy, raise its threshold in `alert-rules.ts`/`diagnostics-service.ts` — never silence it by dropping the row (that hides the failure).
