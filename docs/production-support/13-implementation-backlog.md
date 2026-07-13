# Implementation Backlog

One row per PR in the production-support initiative. Status: `in-progress` / `pending` /
`done`. This table is the self-description of the rollout; update Status as PRs merge.

| ID | Work item | Customer risk | Severity | Code location | Proposed implementation | Owner | Acceptance test | Status |
|---|---|---|---|---|---|---|---|---|
| PR-1 | Production-support pack skeleton + incident-response plan | Ops can't run incidents consistently | P2 | `docs/production-support/*`, `docs/incidents/*` | 15 numbered docs (00–14) + incident plan/template/comms | [REQUIRED] | `src/__tests__/docs/production-support-pack.test.ts` | in-progress |
| PR-2 | Public `/status` page + fix broken error-boundary link | R-03 | P2 | `src/app/(main)/status/page.tsx`, `src/app/error.tsx`, `PUBLIC_ROUTES` | Read-only status from `uptime_checks` + health pings; drop internal error strings | [REQUIRED] | status page render + no-internals leak test | pending |
| PR-3 | `status_incidents` table + admin incident management | R-03 | P2 | migration, `src/app/(admin)/admin/status-incidents/*`, `status-incident-service.ts` | Draft→publish incidents; RLS public-read published only; audited writes | [REQUIRED] | service transitions + RLS db-test + audit | pending |
| PR-4 | Privileged deep-diagnostics endpoint + system-health upgrade | R-11 | P2 | `src/services/admin/diagnostics-service.ts`, `/api/admin/diagnostics` | DLQ/backlog/staleness/bounce diagnostics gated on `view_system_health` | [REQUIRED] | 401/403/200 matrix + no-secrets | pending |
| PR-5 | Alert engine (`alert_events`) + Inngest tick + email + dead-man switch | R-01,R-02,R-08,R-09,R-10,R-15 | P1 | `src/services/alerts/*`, `src/inngest/functions/alert-engine-tick.ts`, `uptime-ping.yml` | Pure rules → dedupe → email via Resend; GH-Actions dead-man for site-down | [REQUIRED] | per-rule + engine idempotency + no-PII | pending |
| PR-6 | `support_tickets` schema + customer submission & "my requests" | R-04 | P2 | migration, `ticket-service.ts`, `src/app/api/contact/route.ts`, `/settings/support` | Persist tickets (guest+authed), email-fallback on insert failure | [REQUIRED] | RLS isolation + contact degradation | pending |
| PR-7 | `/admin/support` triage queue | R-04 | P2 | `src/app/(admin)/admin/support/*`, `support-admin-service.ts` | Queue, assign, reply (records `email_log_id`), resolve; audited | [REQUIRED] | permission matrix + audit + SLA stamps | pending |
| PR-8 | Tier-1 action registry (audited, permission-gated) | R-05,R-08 | P2 | `src/services/admin/tier1-actions/*`, `/api/admin/tier1-actions` | Resend verify, reset link, DLQ replay, retry job, restore entitlement | [REQUIRED] | registry contract + per-action + audit-on-failure | pending |
| PR-9 | Triage-packet generator + AI-agent spec (Recommend mode) | R-06 | P0 | `src/lib/observability/redact.ts`, `triage-packet-service.ts` | Redaction choke-point; redacted markdown packet; no autonomous execution | [REQUIRED] | redaction property tests (PII never in output) | pending |
| PR-10 | Playbooks batch 1 (auth+payments) + critical runbooks + CI doc guard | R-01,R-05 | P2 | `docs/support/features/*`, `docs/support/runbooks/*`, grounding test | 23-field playbooks + front-matter; guard test asserts paths/tables/actions exist | [REQUIRED] | `playbook-grounding.test.ts` | pending |
| PR-11 | Playbooks batch 2 (email/files/AI/infra) + remaining runbooks | R-10,R-13,R-15 | P2 | `docs/support/features/*`, `docs/support/runbooks/*` | Same structure; guard test enforces grounding | [REQUIRED] | grounding test | pending |
| PR-12 | Failure-mode test backfill | R-13 | P2 | `src/__tests__/*`, `db-tests/*` | Webhook sig-reject, DLQ idempotency, bounce→suppression, rate-limiter-on-outage | [REQUIRED] | new tests green | pending |
| PR-13 | DR backup-restore evidence + first tabletop | R-07 | P1 | `scripts/dr/*`, `docs/production-support/12`, `docs/incidents/tabletop/*` | Execute local-stack restore; record evidence; run tabletop | [REQUIRED] | evidence record committed | pending |
| PR-14 | Finalize pack (fill 09/10/11, refresh 02/13/14) | — | P3 | `docs/production-support/*` | As-built content; pack test flips to no-stubs | [REQUIRED] | pack completeness test | pending |

**Owner:** every row needs a named owner before the initiative is "operable" — `[REQUIRED]`
placeholders must be filled by the business owner.
