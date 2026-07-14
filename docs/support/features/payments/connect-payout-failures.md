---
title: Connect payout failures
area: payments
severity_default: P2
code_paths:
  - src/services/provider/provider-payment-service.ts
  - src/components/settings/ConnectedAccountsCard.tsx
  - src/services/billing/refund-service.ts
  - src/app/api/webhooks/stripe/route.ts
tables:
  - provider_invoices
  - billing_events
admin_surfaces:
  - /admin/subscriptions
  - /admin/system-health
tier1_actions: []
alert_rules:
  - stripe_dlq_backlog
last_verified_commit: 4c3fe1ff
---

# Connect payout failures

## Summary
A provider/trader is not receiving funds owed for a completed job — the Stripe
Connect destination charge or transfer failed, or their connected account isn't
fully onboarded. (Platform commission on trader jobs is 0%; the trader is paid the
job total less Stripe fees.)

## Symptoms
- "I completed the job and got paid but never received the money."
- Connected-account status incomplete/restricted in Stripe.
- A `provider_invoices` row marked paid with no corresponding transfer.

## Customer impact
Provider is out of pocket — high trust impact even at low volume. Money-touching.

## Severity
P2 individual; P1 if payouts are failing across many providers.

## Detection
- Sentry `module: "payments"` on the payout path.
- `stripe_dlq_backlog` if payout-related webhooks are failing.
- Provider ticket.

## Scope check
One provider (their Connect account) vs many (transfer/platform config). One →
onboarding/verification. Many → incident.

## Code paths
Payout computation + transfer in `provider-payment-service.ts` (fee lever is 0%,
`src/lib/payments/platform-fee.ts`); connected-account UI
`ConnectedAccountsCard.tsx`; refund handling `refund-service.ts`; async state via
the Stripe webhook.

## Data & tables
- `provider_invoices` — what the provider is owed / paid.
- `billing_events` — the Stripe event ledger.

## Admin surfaces
`/admin/subscriptions`, `/admin/system-health`.

## Diagnosis
1. Check the provider's Connect account status in Stripe (last-4 handle).
2. If restricted/incomplete → onboarding/verification blocks the payout.
3. If the account is fine → look for a failed transfer/webhook and reconcile.

## Common root causes
- Connected account not fully onboarded (missing KYC/bank details).
- Stripe placed a restriction/hold on the account.
- Transfer webhook failed → local state drift.

## Remediation
- No Tier-1 action — payouts touch a third party's money and onboarding, so remedy
  is manual and identity-sensitive.
- Onboarding gap: guide the provider to complete Connect onboarding; the payout
  releases once the account is enabled.
- Failed transfer with a healthy account: reconcile via Stripe and, if a webhook
  was missed, drain the DLQ (`replay-dlq-webhook`).

## Rollback
None — do not re-issue transfers blindly; verify against Stripe to avoid double
payment.

## Verification
Stripe shows the payout/transfer succeeded and the provider confirms receipt.
`provider_invoices` reconciles.

## Communication
Reply to the provider with the concrete blocker (usually "finish onboarding");
never expose Stripe account internals.

## Escalation
Systemic payout failure → payments incident + engineering; suspected Stripe-side
restriction → Stripe support.

## Prevention & follow-up
Surface Connect onboarding status prominently; alert on payout webhook failures.

## Related
- Feature: `stripe-webhook-failure-and-dlq.md`
- Tier-1: `replay-dlq-webhook`
