# Architecture Map

Production-critical systems, their failure modes, customer impact, existing monitoring, and
recovery. Paths are relative to the `britv3` repo root. This is the map the risk register
(`03-risk-register.md`) and the playbooks (`docs/support/features/`) are built on.

## Stack at a glance

Next.js App Router (`src/app`) on Vercel · Supabase Postgres + RLS + Storage · Stripe +
Stripe Connect + GoCardless · Resend email · Inngest background jobs · Upstash Redis (rate
limiting/cache) · PostHog + GA4 analytics · Sentry error tracking · Anthropic (AI features).

## System table

| System | Component | Purpose | Production dependency | Failure modes | Customer impact | Existing monitoring | Recovery method |
|---|---|---|---|---|---|---|---|
| Edge/routing | `src/proxy.ts` | Auth gates, admin MFA/AAL2, verification & subscription gates | Vercel edge, Supabase auth | Bad gate logic locks users out; Supabase auth down | Users can't reach dashboards | Sentry; e2e route guards | Rollback deploy; fix gate |
| Auth | Supabase Auth, `src/app/(auth)/*`, `assign_role_atomic` | Signup/login/verify/reset, roles | Supabase Auth, Resend (verify/reset email) | Email not delivered; expired links; MFA lockout | Cannot register/login | Sentry; `email_logs` | Resend verify (Tier-1); reset link (Tier-1) |
| Webhooks — Stripe | `src/app/api/webhooks/stripe/route.ts`, `billing_events` | Billing/subscription/payout events | Stripe, Supabase | Missed/duplicate/failed event | Wrong entitlement/subscription state | Idempotent claim + DLQ `stripe-webhook-dlq.ts`; Sentry | Replay DLQ (Tier-1); restore entitlement (Tier-1) |
| Webhooks — GoCardless | `src/app/api/webhooks/gocardless/route.ts` | Direct-debit + mandate lifecycle | GoCardless, Supabase | Mandate break; payment failed/chargeback | Failed collection; dunning | Sentry; `truedeed_audit_log`; Inngest dunning | Runbook: gocardless-mandate-failures |
| Webhooks — Resend | `src/app/api/webhooks/resend/route.ts`, `email_logs` | Delivery/bounce reflection | Resend (svix) | Bounce/suppression not recorded | Silent email loss | Sentry; `email_logs.status` | Runbook: bounce-and-suppression |
| Webhooks — Referencing | `src/app/api/webhooks/referencing/route.ts` | Tenant referencing outcomes | Referencing provider | Outcome lost | Referencing stuck | Sentry | Re-request referencing |
| Payments | `src/app/api/billing/*`, `src/services/billing/*`, `/pay/[token]` | Checkout, subscriptions, invoices, refunds, Connect payouts | Stripe, Supabase | Checkout fails; renewal fails; payout fails | Cannot pay / not paid | Sentry; `billing_events` | Runbooks: checkout-failing, connect-payout-failures |
| Email | `src/services/email/email-service.ts`, `email_logs`, lifecycle drips | Transactional + lifecycle email | Resend | Provider outage; bounce; suppression; template error | No verify/reset/receipt | `email_logs`; Resend webhook; alert `email.bounce_rate` (PR 5) | Runbook: resend-outage |
| Background jobs | Inngest (`src/inngest/functions/*`), `/api/inngest` | Drips, dunning, DLQ replay, PPD ingest, GDPR purge, push | Inngest, Supabase | Function failing/paused; backlog | Delayed emails/entitlements | Sentry (`capture-exception`) | Runbook: inngest-backlog |
| Database | Supabase Postgres + RLS, `supabase/migrations/*` | System of record | Supabase | DB down/degraded; migration drift; RLS mistake | Platform-wide outage / data exposure | `pingSupabase`; `uptime_checks`; `pg` advisors | 7-day PITR restore (see `12-dr-and-backups.md`) |
| Storage | Supabase Storage buckets, upload routes | Property docs, receipts, maintenance photos | Supabase Storage | Upload fails; RLS denial; missing file | Cannot upload/view docs | Sentry | Runbook: attachment-upload-failures |
| AI features | `src/services/ai/claude-service.ts`, `ai_usage_log` | Listing descriptions/summaries, quote drafts | Anthropic | Outage/429; timeout; cost spike | AI feature unavailable | Rate limits; alert `ai.cost_spike` (PR 5) | Runbook: anthropic-outage-or-429 |
| Uptime/health | `src/app/api/health/route.ts`, `uptime-ping.yml`, `uptime_checks`, `/metrics` | Availability probe + history | GitHub Actions cron, Supabase | Probe stale (cron broke); DB ping fails | (internal signal) | The probe itself; alert `uptime.*` (PR 5) | Dead-man switch (PR 5) |
| Admin/support | `src/app/(admin)/admin/*`, `src/lib/admin-permissions.ts`, `admin_audit_log` | RBAC console + audit | Supabase, MFA | Permission bug; audit write fails (best-effort) | Support can't act | `admin_audit_log`; `/admin/system-health` | Runbook: auth-outage |
| Error tracking | Sentry (`sentry.*.config.ts`, `capture-exception.ts`) | Exception capture + context | Sentry SaaS | Sentry down (blind) | (internal) | Sentry status; `deps.provider_down` (PR 5) | Rely on `email_logs`/`billing_events` signals |

## Data-flow notes

- **Correlation IDs** (`src/lib/observability/correlation-id.ts`) thread `x-correlation-id`
  across request → handler → Sentry, and (PR 6) onto `support_tickets.correlation_id`. This
  is the join key between a customer ticket and its Sentry trace.
- **Idempotency** is the payment-integrity backbone: `billing_events.stripe_event_id` UNIQUE
  + atomic claim; failed processing → Inngest DLQ, which itself guards already-processed.
- **RLS everywhere.** Service-role writes (webhooks, admin routes) bypass RLS deliberately;
  every new table in this initiative ships with least-privilege RLS.
