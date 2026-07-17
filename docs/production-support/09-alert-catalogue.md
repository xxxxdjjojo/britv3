# Alert Catalogue

**Owner:** [INFORMATION REQUIRED]

The authoritative list of alert rules that **actually fire today**, cross-checked against
the code. `04-alerting.md` describes the *engine*; this is the *catalogue* — kept honest
by the grounding guard (`playbook-grounding.test.ts`), which only accepts these keys in a
playbook's `alert_rules` front-matter.

## Live rules (5)

Findings are assembled in `gatherFindings` (`src/services/alerts/alert-engine-service.ts`)
from two sources — the diagnostics classifiers and the uptime probe series — then
reconciled against the `alert_events` ledger (fingerprint dedupe) and emailed on the
transition to firing.

| Rule key | Source | Fires when | Severity |
|---|---|---|---|
| `uptime_probe_staleness` | `diagnostics-service.ts` → `uptime_checks.checked_at` | probe gap warn > 20 min / critical > 45 min (meta-alert: the GH cron itself broke) | warn / critical |
| `uptime.consecutive_failures` | `alert-rules.ts` `uptimeFindings` → last 3 `uptime_checks.ok` | 3 consecutive probe failures | critical |
| `stripe_dlq_backlog` | `diagnostics-service.ts` → `billing_events` `status='failed'` | backlog > 0 (money-critical) | critical |
| `email_failures_24h` | `diagnostics-service.ts` → `email_logs` failed/bounced 24h | warn ≥ 5 / critical ≥ 20 | warn / critical |
| `gdpr_deadline_risk` | `diagnostics-service.ts` → oldest open `gdpr_requests` | warn ≥ 20 d / critical ≥ 25 d (vs 30-d statutory) | warn / critical |

Severity mapping: a `critical` diagnostic → `critical` finding, otherwise `warning`
(`diagnosticsToFindings`); consecutive-failure uptime is always `critical`.

**This table is the complete set.** The grounding guard's `knownAlertRuleKeys()` is exactly
the union of `ruleKey` in `alert-rules.ts` and `key` in `diagnostics-service.ts` — adding a
rule to a playbook without adding it here (and to the code) fails CI.

## Delivery & dedupe

- **Channel:** email to `OPS_ALERT_EMAIL` via `email-service.ts` (`sendOpsAlertEmail`).
- **Dedupe:** partial unique index `alert_events_one_firing` — one firing row per
  fingerprint; a persistent condition mails **once**, not every tick.
- **Recovery:** the row flips to `resolved` and a recovery email is sent.
- **Safety:** summaries carry counts/rates only — never row contents or PII (enforced by
  `alert-rules.ts` tests).
- **Dead-man switch:** total-outage coverage lives outside the app in
  `.github/workflows/uptime-ping.yml` (see `04-alerting.md`), since the in-app engine
  shares fate with Vercel/Inngest (OR-02).

## Sentry rules (vendor-side, documented not as-code)

Error-spike and new-issue alerts on `module:payments` / `module:auth`, plus a cron monitor
on the alert-engine tick itself, are configured in the Sentry UI — reproducibly documented
in `04-alerting.md §Sentry`. Tracked as OR-03 (config lives in a vendor UI).

## Rules considered but NOT yet implemented

Surfaced honestly so the catalogue isn't mistaken for the full ambition:

| Proposed rule | Why not yet | Tracking |
|---|---|---|
| `email.bounce_rate` (> 2% trailing 24h) | Have failure *counts*, not a rate denominator; and bounces don't auto-suppress | OR-14 |
| `ai.cost_spike` | No `ai_usage` table to compute spend | OR-15 |
| `uptime.availability_dip`, `uptime.latency_degraded` | Single-probe cadence; needs a rolling window | 14-open-risks |
| `deps.provider_down` (2 consecutive degraded pings) | Pings exist (`health-service.ts`); not yet wired into the rule set | 14-open-risks |
| `support.unanswered_tickets` | Depends on SLA fields not in tickets v1 | OR-07 |
