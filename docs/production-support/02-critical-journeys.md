# Critical Customer Journeys

Journeys that directly affect revenue, access, safety, or trust. Criticality:

- **P0** — safety, security, data integrity, or platform-wide outage
- **P1** — core service or payments unavailable for many customers
- **P2** — significant feature degraded, or individual customers blocked
- **P3** — minor issue, workaround available
- **P4** — cosmetic/informational

Alert/Runbook columns reference artifacts delivered later in this initiative (PR number noted).

| # | Journey | Entry point | Services involved | Success condition | Failure conditions | Customer-facing message | Alert | Runbook | Crit |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Registration | `/(auth)/signup` | Supabase Auth, Resend, `assign_role_atomic` | Account created, verify email sent | Duplicate account; verify email not sent | "We couldn't create your account…" | `email.delivery_failures` (PR5) | verification-email-not-received (PR10) | P1 |
| 2 | Login (+MFA) | `/(auth)/login`, `src/proxy.ts` | Supabase Auth, MFA | Session established | Wrong creds; MFA lockout; auth outage | "Incorrect email or password" | `uptime.*`, Sentry auth (PR5) | auth-outage (PR10) | P1 |
| 3 | Email verification | `/auth/callback` | Supabase Auth, Resend | Email verified, role assigned | Expired/invalid link; email missing | "This link has expired…" | `email.bounce_rate` (PR5) | verification-email-not-received (PR10) | P1 |
| 4 | Password reset | `/(auth)/forgot-password`, `/reset-password` | Supabase Auth, Resend | New password set | Reset email missing; link expired | "If that email exists, we've sent a link" | `email.delivery_failures` (PR5) | password-reset-failing (PR10) | P1 |
| 5 | Subscription checkout | `/api/billing/checkout` | Stripe, Supabase | Subscription active, entitlement granted | Checkout session fails; webhook missed | "Payment couldn't be completed" | `billing.processing_failures` (PR5) | checkout-failing (PR10) | P1 |
| 6 | One-off payment (invoice) | `/pay/[token]`, `/api/pay/[token]` | Stripe Connect, Supabase | Invoice paid | Token expired; already paid; charge fails | "This payment link has expired" | `billing.processing_failures` (PR5) | checkout-failing (PR10) | P2 |
| 7 | Subscription renewal | Stripe webhook | Stripe, `billing_events` | Renewal recorded, access continues | Renewal webhook failed | (email on failure) | `billing.dlq_backlog` (PR5) | stripe-webhook-failure-and-dlq (PR10) | P1 |
| 8 | Payment failure / dunning | GoCardless/Stripe webhook, Inngest | GoCardless, Inngest dunning | Retry/dunning proceeds | Mandate break; dunning stuck | (dunning email) | `billing.processing_failures` (PR5) | gocardless-mandate-failures, dunning-stuck (PR10) | P2 |
| 9 | Cancellation | Billing portal / Stripe | Stripe, Supabase | Subscription cancelled, access ends correctly | Cancelled but still active (or vice-versa) | "Your plan is cancelled" | subscription drift (manual) | subscription-entitlement-drift (PR10) | P2 |
| 10 | Refund | `/api/billing/refund` | Stripe | Refund issued | Refund fails | "Refund is being processed" | `billing.processing_failures` (PR5) | checkout-failing (PR10) | P2 |
| 11 | Entitlement / credits update | Stripe webhook → Supabase | Stripe, `billing_events` | Entitlement matches paid state | Paid but no entitlement (drift) | (none — silent) | subscription drift (manual) | subscription-entitlement-drift (PR10) → Tier-1 restore (PR8) | P1 |
| 12 | Document/file upload | upload routes, Supabase Storage | Supabase Storage | File stored, retrievable | Upload fails; RLS denial; missing file | "Upload failed, please retry" | Sentry | attachment-upload-failures, storage-rls-denials (PR11) | P2 |
| 13 | AI generation | `/api/ai/*`, `claude-service.ts` | Anthropic, `ai_usage_log` | Output returned, usage logged | Timeout; 429; refusal; cost spike | "We couldn't generate that right now" | `ai.cost_spike` (PR5) | anthropic-outage-or-429 (PR11) | P3 |
| 14 | Search & discovery | `/search`, map tiles | Supabase, MapTiler | Results render | Query error; tiles fail | "Something went wrong with search" | Sentry | supabase-degraded (PR11) | P2 |
| 15 | Messaging | `/inbox`, Supabase Realtime | Supabase Realtime, RLS | Message delivered | Realtime down; RLS block | "Message failed to send" | Sentry | supabase-degraded (PR11) | P2 |
| 16 | Notifications | `platform_events`, push, email | Inngest, Resend, push | Notification delivered | Drip stuck; push fails | (none) | `email.delivery_failures` (PR5) | lifecycle-drip-stuck (PR11) | P3 |
| 17 | Account deletion (GDPR) | `/settings/privacy`, `gdpr_requests` | Inngest gdpr-user-purge | Data purged within statutory window | Purge FK-blocked; deadline risk | "Your request is being processed" | `gdpr.deadline_risk` (PR5) | `docs/runbooks/gdpr-purge-fk-blocked.md` | P0 |
| 18 | Admin/support action | `/admin/*`, `admin_audit_log` | Supabase, RBAC | Action performed + audited | Permission bug; audit write fails | (internal) | Sentry | auth-outage (PR10) | P2 |
| 19 | Marketplace payout (Connect) | Stripe Connect | Stripe Connect | Provider paid | Connect account not enabled; payout fails | "Payout could not be sent" | `billing.processing_failures` (PR5) | connect-payout-failures (PR10) | P1 |
| 20 | Status / health visibility | `/status` (PR2), `/api/health` | uptime_checks, health-service | Customer can see live status | Status stale/misleading | (the page itself) | `uptime.probe_stale` (PR5) | site-down (PR10) | P2 |

## Cross-map to compliance severity

The compliance incident plan uses SEV-1/2/3. Rough mapping: **P0 ≈ SEV-1**,
**P1 ≈ SEV-1/SEV-2**, **P2 ≈ SEV-2**, **P3/P4 ≈ SEV-3**. Personal-data or security
incidents are **always** SEV-1 regardless of the P-level of the underlying journey — see
`docs/incidents/incident-response-plan.md`.
