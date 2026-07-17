# Tier-1 Actions & Audit

**Owner:** [INFORMATION REQUIRED]

The audited, permission-gated actions a support admin can take on a customer's behalf —
and the audit trail that makes every one of them accountable. Tier-1 is deliberately
**narrow, reversible, and idempotent**; anything destructive, financial-adjusting, or
identity-changing stays a human decision outside this registry.

## The registry

`src/services/admin/tier1-actions/` — each action is a typed entry declaring `key`,
`label`, `requiredPermission`, `targetType`, `preview(ctx)` (powers Recommend mode), and
`execute(ctx)`. Dispatch: `src/app/api/admin/tier1-actions/route.ts` — per-action
permission check → execute → audit. Surfaced as buttons on `/admin/support/[id]` and
`/admin/users/[id]`.

| Action key | Permission | What it does | Safety property |
|---|---|---|---|
| `resend-verification-email` | `manage_users` | Re-sends the Supabase email verification | Idempotent; email only |
| `regenerate-reset-link` | `manage_credentials` | Issues a password-reset link **delivered only by email to the account address** | **Never displayed or logged** — account-takeover vector; the link is not returned to the admin UI or written to any audit/log field |
| `replay-dlq-webhook` | `manage_subscriptions` | Re-emits the event consumed by `stripe-webhook-dlq.ts` to drain the DLQ | Idempotent — `billing_events.stripe_event_id` UNIQUE + atomic claim guard against double-apply |
| `restore-entitlement-from-stripe` | `manage_subscriptions` | Fetches the live Stripe subscription and reconciles local rows (reuses webhook-processor logic) | Reconciliation from source of truth; no new charge |

## Audit trail

- Every dispatch writes to the append-only `admin_audit_log` via
  `logAdminAction("tier1.<key>")` — **on success AND on failure**. There is no unaudited
  Tier-1 execution path.
- In a ticket context, the dispatch also appends an `author_type='system'` message to the
  ticket thread, so the customer-facing record shows what was done.
- **Audit metadata carries no secrets and no reset links** — only the action key, target
  type/id, actor, and outcome. The `regenerate-reset-link` link never enters the audit row.
- Audit writes are best-effort and never block the action (OR-11) — an audit outage must
  not take support down; a failed write is captured in Sentry.

## Modes (AI support agent)

The Tier-1 registry is the **execution surface** the AI support agent (`07-ai-support-agent.md`)
recommends against, but does not drive:

- Default mode is **Recommend** — the agent calls `preview(ctx)` and proposes an action; a
  human reviews and clicks execute. There is **no autonomous execution** (OR-04).
- The registry `preview`/`execute` split is what makes Recommend mode safe: the agent only
  ever sees the preview, never a live execute handle.

## Contract guarantees (tested)

`registry.test` + per-action tests assert:

- every action declares a permission and a preview (registry contract);
- an unknown key or insufficient permission is **rejected** before any side effect;
- audit is written on both success and failure;
- no secret/link appears in audit metadata.

## Not in the registry (deliberately)

- `retry-inngest-job` — considered in planning, **not implemented**; re-driving arbitrary
  Inngest jobs safely needs per-job idempotency review. Excluded rather than shipped
  half-guarded. (Confirmed absent by the PR 12 backfill audit.)
- Refunds, account deletion, identity changes, migrations — **never** Tier-1; these require
  the human-approval path in the incident/GDPR processes.
