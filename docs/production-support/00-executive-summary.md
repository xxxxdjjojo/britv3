# Production Support Pack — Executive Summary

**Product:** TrueDeed (britv3) · UK property platform · www.truedeed.co.uk
**Owner:** [INFORMATION REQUIRED — name the on-call owner]
**Assessed as at:** 13 July 2026 · **Review:** quarterly

## Purpose

This pack is the operational companion for running TrueDeed in production: how we
see failures, how support acts on them safely, and how we run an incident. It sits
alongside the legal/compliance pack (maintained separately — see
`britv3main/legal-compliance/`, not tracked on `main`), which remains the source of
truth for statutory obligations (ICO breach notification, DPA clause 5, DSARs).

## What already exists (do not rebuild)

TrueDeed is a mature codebase; much of the observability substrate is in place:

- **Error tracking:** Sentry (server/edge/client, replay-on-error, PII stripped) via
  `sentry.server.config.ts`, `src/instrumentation.ts`; structured context through
  `src/lib/observability/capture-exception.ts` (module / feature / operation /
  correlationId) and `src/lib/observability/correlation-id.ts`.
- **Uptime:** public `src/app/api/health/route.ts` + `.github/workflows/uptime-ping.yml`
  (15-min cron) → `public.uptime_checks` → public trailing-30d availability at
  `src/app/(main)/metrics/page.tsx`.
- **Dependency health:** `src/services/admin/health-service.ts` pings Supabase / Stripe /
  Resend / PostHog for `/admin/system-health`.
- **Payment integrity:** Stripe webhook idempotency (`billing_events.stripe_event_id`
  UNIQUE + atomic claim + Inngest dead-letter queue `src/inngest/functions/stripe-webhook-dlq.ts`);
  signature-verified Resend / GoCardless / referencing webhooks.
- **Admin + audit:** ~30-section RBAC admin console with 4 roles
  (`src/lib/admin-permissions.ts`), append-only `admin_audit_log`
  (`src/lib/admin-audit.ts`), MFA/AAL2 gate in `src/proxy.ts`.
- **Analytics:** PostHog + GA4 (consent-gated).
- **Background work:** Inngest (~30 functions in `src/inngest/functions/`).

## The gaps this initiative closes

1. **No alert delivery.** Sentry captures errors but nothing pages a human on
   payment/webhook/uptime failure. → PR 5 (email alert engine + dead-man switch).
2. **No public status page.** Error boundaries link to `https://status.truedeed.co.uk`
   which does not exist (`src/app/error.tsx:90`). → PR 2 + PR 3.
3. **Contact form is fire-and-forget.** `src/app/api/contact/route.ts` emails support with
   no ticket record or customer status tracking. → PR 6 + PR 7.
4. **No safe support actions.** Support has no audited, permission-scoped way to resend a
   verification email, regenerate a reset link, replay a DLQ webhook, or restore an
   entitlement from Stripe. → PR 8; AI-assisted triage in Recommend mode → PR 9.
5. **No privileged deep diagnostics** beyond the shallow health pings. → PR 4.
6. **Backup restore never tested.** 7-day Supabase PITR is configured but unproven. → PR 13.

## Delivery shape

14 small, independently-green PRs (see `13-implementation-backlog.md`). Docs first, then
the user-facing status fix, then diagnostics → alerts → tickets → safe actions → playbooks
→ DR evidence. Every new table ships with RLS; migrations apply to prod via the established
Supabase-MCP + ledger-reconciliation flow; no secrets/PII in logs, alerts, the status page,
or AI prompts.

## Honest posture

Single-region Vercel + Supabase. 7-day PITR, no multi-region failover, no on-call rota.
Alerts are email-only (no PagerDuty). This pack makes the current posture *legible and
operable* — it does not claim uptime or response-time guarantees we cannot keep. Remaining
limitations are tracked openly in `14-open-risks.md`.
