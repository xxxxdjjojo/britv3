# Implementation Backlog

One row per PR in the production-support initiative. This table is the self-description of
the rollout. All fourteen are **implemented and committed on `feat/prod-support`** (TDD,
tsc-clean, guard-suite green). They are **not yet merged to `main` or deployed**, and the
migrations are **not yet applied to production** — see "Rollout state" below.

| ID | Work item | Severity | Code location | Status |
|---|---|---|---|---|
| PR-1 | Production-support pack skeleton + incident-response plan | P2 | `docs/production-support/*`, `docs/incidents/*` | done |
| PR-2 | Public `/status` page + fix broken error-boundary link | P2 | `src/app/(main)/status/page.tsx`, `src/app/error.tsx` | done |
| PR-3 | `status_incidents` table + admin incident management | P2 | migration, `src/app/(admin)/admin/status-incidents/*`, `status-incident-service.ts` | done |
| PR-4 | Privileged deep-diagnostics endpoint + system-health upgrade | P2 | `diagnostics-service.ts`, `/api/admin/diagnostics`, `health-service.ts` | done |
| PR-5 | Alert engine (`alert_events`) + Inngest tick + email + dead-man switch | P1 | `src/services/alerts/*`, `alert-engine-tick.ts`, `uptime-ping.yml` | done |
| PR-6 | `support_tickets` schema + customer submission & "my requests" | P2 | migration, `ticket-service.ts`, `api/contact/route.ts`, `/settings/support` | done |
| PR-7 | `/admin/support` triage queue | P2 | `src/app/(admin)/admin/support/*`, `support-admin-service.ts` | done |
| PR-8 | Tier-1 action registry (audited, permission-gated) | P2 | `src/services/admin/tier1-actions/*`, `/api/admin/tier1-actions` | done — **4 actions** (resend-verification-email, regenerate-reset-link, replay-dlq-webhook, restore-entitlement-from-stripe); `retry-inngest-job` **deferred** (see 11-tier1 / open risks) |
| PR-9 | Triage-packet generator + AI-agent spec (Recommend mode) | P0 | `src/lib/observability/redact.ts`, `triage-packet-service.ts` | done |
| PR-10 | Playbooks batch 1 (auth+payments) + critical runbooks + CI doc guard | P2 | `docs/support/features/*`, `docs/support/runbooks/*`, `playbook-grounding.test.ts` | done |
| PR-11 | Playbooks batch 2 (email/files/AI/infra) + remaining runbooks | P2 | `docs/support/features/*`, `docs/support/runbooks/*` | done |
| PR-12 | Failure-mode test backfill + testing doc | P2 | `src/__tests__/*`, webhook/billing/health tests, `08-testing-and-guard-layer.md` | done — sig-reject ×4, claim double-claim, rate-limiter fail-closed, health degradation; **bounce→suppression deferred** (path not implemented, OR-14) |
| PR-13 | DR backup-restore evidence + first tabletop | P1 | `scripts/dr/*`, `12-dr-and-backups.md`, `docs/incidents/tabletop/*` | done — restore drill **executed** 2026-07-14 (192,142 rows verified) |
| PR-14 | Finalize pack (fill 09/10/11, refresh 02/13/14) | P3 | `docs/production-support/*` | done — pack test flips to no-stubs |

## Rollout state (what remains, and who owns it)

The build is complete on the branch; production rollout is a set of **explicit human
actions** deliberately not automated:

- **Merge & deploy** — squash-merge `feat/prod-support` → `main`; Vercel deploys.
- **Apply migrations to production** (via Supabase MCP + ledger reconciliation): `status_incidents`
  (+updates), `alert_events`, `support_tickets` (+messages). Verify RLS live with an anon probe.
- **Add env/secrets before PR-5 deploys:** `OPS_ALERT_EMAIL`, `ALERT_FROM` (Resend-verified
  sender) in Vercel + GitHub Actions; optional `SENTRY_ORG_SLUG`/`SENTRY_PROJECT_SLUG`.
- **Post-deploy verification:** `/status` renders with real uptime; publish→unpublish a test
  incident and confirm public visibility flips; submit a contact-form ticket (guest + authed)
  and see it in `/admin/support`; run one Tier-1 action against a demo account and confirm the
  `admin_audit_log` row; trigger a manual alert-engine tick and confirm the email arrives.

## Deferred (moved to open risks, not silently dropped)

- `retry-inngest-job` Tier-1 action → needs per-job idempotency review (11-tier1).
- Bounce → suppression list → OR-14. AI cost/usage alert (`ai_usage` table) → OR-15.
- Everything else deferred is enumerated in `14-open-risks.md` (OR-01…OR-15).

**Owner:** every rollout action needs a named owner before the initiative is "operable".
