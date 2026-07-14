# AI Support Agent (Recommend Mode)

**Owner:** [INFORMATION REQUIRED]

How an LLM assists support triage **without** ever touching production autonomously,
seeing customer PII, or holding privileged credentials. The agent recommends; a
human, gated by RBAC and audit, decides and acts.

## Operating principle

> The AI is a **reasoning aid over a redacted packet**, not an operator. It has no
> database access, no Stripe/Supabase credentials, and no ability to call the
> Tier-1 action registry. Its only inputs are the redacted triage packet and the
> playbook/runbook corpus; its only output is a recommendation a human reads.

This keeps three invariants intact:

1. **No PII / secrets in the prompt.** Everything the agent sees is routed through
   the redaction choke-point first (see below).
2. **No autonomous production writes.** The agent cannot execute anything. Actions
   run only through `/admin/support/[id]` and `/admin/users/[id]`, behind
   `manage_support_tickets` / per-action permissions, each producing an
   `admin_audit_log` row.
3. **Human accountability.** Every recommendation is acted on by a named admin,
   never "the AI did it".

## The redaction choke-point (the guarantee)

`src/lib/observability/redact.ts` is the **single** function set through which any
customer-derived value passes before it can reach an LLM. It is exhaustively
unit-tested (`redact.test.ts`) and applied by the packet builder on every field:

| Data class | Treatment |
|---|---|
| Free-text bodies (ticket messages, notes) | **Stripped entirely** to `[free text redacted · N chars]`. Regex cannot catch free-form PII (names in prose, addresses), so free text never passes through — only its length. |
| Emails | `[email]` placeholder (no partial reveal) |
| UK phone numbers | `[phone]` |
| UK postcodes | `[postcode]` |
| Names (known fields) | `[name]` |
| Stripe / GoCardless object ids | Prefix + `…` + **last 4** only (e.g. `cus_…34EF`) — enough to correlate against the provider dashboard, never the full id |
| Internal user id | Last-8 handle only (`user …55555555`) |
| Subscription / billing state | Statuses, plan names, amounts, event **types** only — never `payload` row contents |

If a value has no safe reduction, it does not appear. Over-masking is acceptable;
leaking is not.

## The triage packet (the sole context)

`src/services/support/triage-packet-service.ts` builds a markdown packet from a
ticket + the account's operational state. Sections:

- **Ticket** — reference, category, status, priority, timestamps, redacted subject.
- **Account** — last-8 user handle, `[email]`/`[name]` placeholders, or "No linked account" for guests.
- **Thread (redacted)** — per message: author, internal flag, timestamp, and a length placeholder. **Bodies are never included.**
- **Email delivery** — `email_logs` template / status / suppression reason / error (PII-scrubbed). No message content.
- **Billing events** — `billing_events` event **types** + timestamps. No payloads.
- **Subscription** — status, plan, amount, renewal, `cancel_at_period_end`, redacted customer id.
- **Recent admin actions** — `admin_audit_log` action + target type + timestamp for this user.
- **System diagnostics** — the `getDiagnostics()` snapshot (DLQ backlog, probe staleness, email failures, GDPR age). System-wide, non-PII.
- **Recommended Tier-1 actions** — the registry actions valid for this target, with risk / reversibility / approval flags.
- **References** — a **Sentry search URL** keyed by `correlation_id` (link only — set `SENTRY_ORG_SLUG` / optional `SENTRY_PROJECT_SLUG`), and category-mapped playbook links.

Generation runs through the audited route
`POST /api/admin/support/[id]/triage-packet` (`support_ticket.triage_packet`),
gated on `manage_support_tickets`. The response carries only redacted markdown.

## Action registry (what a human may then do)

Recommendations point at the **Tier-1 action registry** (PR 8,
`src/services/admin/tier1-actions/`). Each action is permission-gated, previewable
(Recommend mode), and audited on success **and** failure.

| Action | Permission | Risk | Approval | Reversible | Audit | Verification |
|---|---|---|---|---|---|---|
| `resend-verification-email` | `manage_users` | low | no | yes | `tier1.resend-verification-email` | customer confirms receipt; `email_logs` shows `sent` |
| `regenerate-reset-link` | `manage_credentials` (super_admin) | high | **yes** | no | `tier1.regenerate-reset-link` | link emailed **only** to the account address, never displayed/logged (account-takeover guard) |
| `replay-dlq-webhook` | `manage_subscriptions` | medium | no | yes | `tier1.replay-dlq-webhook` | `billing_events` shows the event processed; idempotent claim prevents double-apply |
| `restore-entitlement-from-stripe` | `manage_subscriptions` | medium | no | yes | `tier1.restore-entitlement-from-stripe` | `subscriptions` row matches live Stripe; customer regains access |

## Modes

The agent operates on a fixed ladder; the **default and only enabled mode is
Recommend**.

| Mode | Meaning | Status |
|---|---|---|
| **Observe** | Summarise the packet, no recommendation | available |
| **Recommend** (default) | Suggest a Tier-1 action or playbook, with rationale, for a human to run | **enabled** |
| **Execute-approved** | A human approves a specific recommendation; the human runs it in the console | the human executes, not the agent |
| **Await** | Recommendation pending human review | available |
| **Lock** | No recommendations (e.g. security-sensitive ticket) | available |

**Act mode — autonomous execution — is explicitly deferred** and tracked in
`14-open-risks.md`. Enabling it would require: scoped machine credentials with
per-action allow-lists, a reversible-only constraint, a rate limiter, a
human-in-the-loop approval queue, and a kill switch — none of which exist yet.

## What the agent must never do

- Request or infer un-redacted PII ("what's the customer's email?").
- Ask for, store, or display one-time links, tokens, or secrets.
- Recommend a destructive, refund, identity, deletion, or migration action as
  Tier-1 — those are out of the registry by design and require the incident /
  privileged-engineering path.
- Claim an issue is resolved. Resolution is asserted by a human only after
  customer-impact verification (see the verification column above).
