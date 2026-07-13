# Support Tier Model

**Owner:** [INFORMATION REQUIRED]

How support requests flow from a customer to resolution, and when they escalate into an incident.

## Intake

- **Channel:** the contact form (`/help/contact` → `/api/contact`) persists a `support_tickets` row (PR 6) and emails support. Guests and logged-in customers both supported; logged-in customers track status at `/settings/support`.
- **Reference:** every ticket gets a `TD-XXXXXX` reference, shown to the customer and used in all correspondence.
- **Intake is never lost:** if ticket persistence fails, the form still emails support (email-only fallback).

## The three tiers

| Tier | Who / what | Scope |
|---|---|---|
| **Tier 1 — automated / self-service** | Help centre, `/settings/support`, self-service reset/billing portal, and the audited Tier-1 action registry (PR 8) | Known, low-risk, reversible fixes: resend verification, regenerate reset link, replay a DLQ webhook, restore entitlement from Stripe |
| **Tier 2 — AI-assisted triage** | The triage-packet generator (PR 9) prepares a redacted summary + recommended actions for a human | Unknown or higher-risk issues; AI **recommends**, a human decides |
| **Tier 3 — incident** | The incident-response plan (`docs/incidents/incident-response-plan.md`) | Several customers affected, core service down, payment/entitlement data wrong, security/privacy — see the escalation triggers below |

## Admin triage queue (PR 7)

- `/admin/support` (queue) + `/admin/support/[id]` (thread). Gated on `manage_support_tickets` (super_admin, ops_admin, moderation_admin — **not** dev_admin).
- Admins can post a **public reply** (emails the customer, stamps `first_response_at`, moves the ticket to `pending_customer`) or an **internal note** (invisible to the customer, no status change).
- Every reply/status change is written to `admin_audit_log` via `auditedAdminActionWithPermission`.
- Internal notes are protected by RLS on the customer side (a customer never sees `internal_note = true` messages).

## Status lifecycle

`open` → `pending_internal` (with our team) / `pending_customer` (awaiting their reply) → `resolved` → `closed`. A public admin reply never re-opens a resolved/closed ticket.

## SLA targets (to be ratified by the owner)

| Priority | First response | Resolution target |
|---|---|---|
| urgent | 2 business hours | same day |
| high | 1 business day | 2 business days |
| normal | 2 business days | 5 business days |
| low | 5 business days | best effort |

The `support.unanswered_tickets` alert (planned) surfaces tickets breaching the first-response target. There is no automated SLA enforcement yet (see `14-open-risks.md` OR-07).

## Escalate to an incident (Tier 3) when

Several customers are affected; a core service is unavailable; payment/entitlement data may be wrong; unauthorised access or personal-data exposure is suspected; or a third-party provider causes widespread failure. Follow `docs/incidents/incident-response-plan.md` and, for personal-data/security, the compliance breach procedure.
