# Vouch Gate + Referral Engine Architecture

## Trust boundary

`profiles.id` is the canonical member identity and
`service_provider_details.user_id` is the provider join. Browser clients never
create trusted vouches, referral state changes, or credits directly. Public
token routes return an allowlisted projection rather than database rows.

The database owns transitions:

```text
vouch request: pending -> accepted | declined | expired | revoked
provider referral: invited -> signed_up -> gate_complete -> converted -> credited
credit application: pending -> applying -> applied | failed -> applying
```

Service-only security-definer RPCs lock the subject rows, validate the next
state, and apply uniqueness/cap constraints. They use a fixed empty
`search_path`, explicit schema qualification, revoked default execution, RLS,
and explicit grants. Legacy `provider_references` remains read-only history and
is never trusted as a vouch.

## Provider access

One database read composes authoritative role, confirmed email, admin
verification, peer/client counts, execution-time grandfathering, provider
subscription, and Stripe Connect readiness. One pure policy consumes that state
in the proxy, provider layout, API guard, and transaction guard. JWT claims are
only a role lookup optimisation. Database lookup errors fail closed with typed
503 responses.

`VOUCH_GATE_BYPASS=true` bypasses only the new vouch-count condition. It never
bypasses authentication, role, confirmed email, admin verification,
subscription, or transaction readiness, and missing configuration means false.

## Referral billing

Checkout completion does not convert a referral. The first positive paid
provider subscription invoice advances the referral and creates exactly one
referrer credit. The ledger snapshots billing inputs and uses a stable
referral/member idempotency key. An Inngest worker claims a leased application,
applies Stripe customer balance, and persists the Stripe balance transaction or
a durable retryable failure. Every non-void state counts toward the rolling
twelve-month/twelve-credit cap.

GoCardless remains isolated to the estate-agent network; it is not a provider
subscription rail.
