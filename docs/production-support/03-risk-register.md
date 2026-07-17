# Risk Register

Severity-ranked production-support risks as at 13 July 2026. Severity uses the P0–P4 scale
from `02-critical-journeys.md`. "Gap" is what this initiative (or the open-risks backlog)
addresses. Verify each cited path before acting on a row.

| ID | Risk | Customer impact | Severity | Current mitigation | Gap | Closes in |
|---|---|---|---|---|---|---|
| R-01 | Payment/webhook failure goes unnoticed until a customer complains | Wrong entitlement, lost revenue, silent dunning | P1 | Stripe idempotency + DLQ; Sentry | No proactive alert on `billing_events` DLQ backlog / failures | PR 5 |
| R-02 | Site/DB down with no human notified | Platform-wide outage undetected | P0 | `uptime_checks` history; Sentry | No alert *delivery*; alert engine would share fate with the app | PR 5 (+ dead-man switch); external synthetic monitoring → `14-open-risks` |
| R-03 | Error pages link to a status page that doesn't exist (`src/app/error.tsx:90` → `https://status.truedeed.co.uk`) | Broken trust signal during an incident | P2 | none | No status page | PR 2 + PR 3 |
| R-04 | Contact form is fire-and-forget (`src/app/api/contact/route.ts`) | Support requests lost; no customer status tracking | P2 | Resend email to support | No ticket persistence, no queue, no customer visibility | PR 6 + PR 7 |
| R-05 | No safe, audited support actions | Support escalates trivial issues to engineering, or acts unsafely via raw DB | P2 | Manual, ad-hoc | No Tier-1 action registry (resend verify, reset link, DLQ replay, restore entitlement) | PR 8 |
| R-06 | Sending production context to an LLM could leak PII | Privacy/compliance breach | P0 | none (no AI support flow yet) | No redaction choke-point before LLM context | PR 9 (`redact.ts`) |
| R-07 | 7-day PITR backups never restored | False confidence; unknown RTO/RPO | P1 | Supabase PITR configured | No evidenced restore test | PR 13 |
| R-08 | Paid-but-no-entitlement drift | Customer paid, no access | P1 | Idempotent webhook | No detection; no one-click reconcile | Detection PR 5; remedy Tier-1 PR 8 |
| R-09 | GDPR deletion misses statutory deadline | ICO exposure | P0 | `gdpr_requests`, purge job, FK runbook | No deadline-risk alert | PR 5 (`gdpr.deadline_risk`) |
| R-10 | Email domain reputation damage from bounces | Deliverability collapse (verify/reset stop arriving) | P1 | `email_logs`, Resend webhook | No bounce-rate alert | PR 5 (`email.bounce_rate`) |
| R-11 | No privileged deep diagnostics | Slow incident triage | P2 | shallow health pings | No DLQ/backlog/staleness diagnostics endpoint | PR 4 |
| R-12 | Audit writes are best-effort (`admin-audit.ts` never throws) | A failed audit write doesn't block the action; gaps in the trail | P2 | append-only table, RPC + fallback | Acceptable for v1; flagged | `14-open-risks` |
| R-13 | Upstash Redis is a single point for rate limiting | Auth rate-limiting behaviour changes on Redis outage | P2 | in-memory dev fallback; fail-open/closed split | Behaviour-on-outage undocumented/untested | PR 12 (verify + document) |
| R-14 | Sentry/Vercel alert config lives in vendor UIs | Config not reproducible-as-code | P3 | Sentry rules (to be set) | Documented only | PR 5 doc + `14-open-risks` |
| R-15 | AI cost spike (runaway generation) | Unexpected spend | P3 | daily rate limits | No spend alert | PR 5 (`ai.cost_spike`) |

## How this register is used

- Rows feed `13-implementation-backlog.md` (work items) and the per-feature playbooks
  (`docs/support/features/`), whose "detection" field must map back to a row here.
- New risks discovered while writing playbooks (PR 10/11) or running the tabletop (PR 13)
  are appended here and, if deferred, mirrored into `14-open-risks.md`.
