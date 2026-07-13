# Open Risks (Accepted / Deferred)

Risks this initiative knowingly does **not** close in its first pass. Each is a deliberate
scope decision, not an oversight. Revisit quarterly. Do not silence any of these by
suppressing an alert — deferral is documented here instead.

| ID | Open risk | Why deferred | Compensating control | Revisit trigger |
|---|---|---|---|---|
| OR-01 | No paging / on-call rota — alerts are email-only | No 24/7 staff; PagerDuty cost | Ops email monitored in business hours; SEV-1 comms templates | First out-of-hours SEV-1 |
| OR-02 | Alert engine shares fate with Vercel/Inngest | In-app engine is simplest; full external synthetic monitoring is a separate build | GitHub-Actions dead-man switch (PR 5) covers "site down"; Sentry cron-monitor on the tick | Any missed outage |
| OR-03 | Sentry/Vercel alert rules live in vendor UIs, not code | Vendors don't expose config-as-code cleanly | `04-alerting.md` documents the exact rules + screenshots for reproducibility | Rule drift / lost config |
| OR-04 | AI support agent Act mode (auto-executing Tier-1 actions) | Safety: Recommend-only until the action registry + audit are battle-tested | Human approval gate; Tier-1 registry is the future Act surface | After Tier-1 actions proven in production |
| OR-05 | No auto-incident creation on `/status` from alert events | Avoid false public incidents from noisy early thresholds | Manual publish by an admin (PR 3) | Thresholds tuned + trusted |
| OR-06 | No status-page email subscriptions | Out of scope v1 | Customers refresh `/status` | Customer demand |
| OR-07 | Tickets v1: no attachments, SLA automation, or CSAT | Keep the first ticket system small | `support.unanswered_tickets` alert (PR 5) covers SLA-ish signal | Support volume growth |
| OR-08 | No centralized log aggregation / warehouse log drain | Sentry + Vercel dashboards suffice at current scale | Correlation IDs + Sentry search | Multi-service growth |
| OR-09 | DR evidence is a local-stack restore; Supabase PITR *tier* and Storage-bucket (non-Postgres) backup coverage unverified | Local restore is cheap, safe evidence | 7-day PITR configured; documented in `12-dr-and-backups.md` | Before scaling / funding round |
| OR-10 | Upstash Redis is a single point for rate limiting | Acceptable fail-open/closed behaviour documented | In-memory dev fallback; behaviour tested (PR 12) | Redis outage in prod |
| OR-11 | Audit writes are best-effort (never block the action) | Blocking would let an audit outage take down support | Append-only table; Sentry on write failure | Compliance requirement change |
| OR-12 | GoCardless webhook/DLQ parity with the Stripe DLQ pattern not audited | Stripe path is the money-critical one; GoCardless is lower volume | `truedeed_audit_log` idempotency; runbook | GoCardless incident |
| OR-13 | `status.truedeed.co.uk` DNS not pointed at the app | `/status` is app-hosted for now (shares fate — see OR-02) | Error pages link to in-app `/status` (PR 2) | External status host adopted |

## Notes

- OR-02 + OR-13 are the same underlying limitation: everything customer-facing during an
  outage is hosted by the thing that's down. The dead-man switch (an external GitHub Actions
  vantage point) is the only true out-of-band signal until external synthetic monitoring or
  an external status host is adopted.
- OR-04/OR-11 are the two places where we deliberately trade completeness for safety —
  documented so the trade is a decision, not a surprise.
