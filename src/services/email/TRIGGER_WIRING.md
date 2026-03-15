# Email Trigger Wiring — Status & Gaps

This document records which `email-service.ts` send functions have been wired to
source trigger events, and which are pending implementation of their upstream feature.

---

## Wired (Phase 22, Task 7)

| Email function | Trigger location | Condition |
|---|---|---|
| `sendWelcome` | `src/app/auth/callback/route.ts` | New user detected (no roles yet assigned after OAuth/email callback) |
| `sendOfferReceived` | `src/app/api/agent/offers/route.ts` POST | After `createOffer` — notifies the agent who logged the offer |
| `sendOfferStatus` | `src/app/api/agent/offers/route.ts` PATCH `action=update_status` | When status becomes `accepted` or `rejected` — notifies buyer via `buyer_email` |
| `sendReviewReceived` | `src/app/api/reviews/create/route.ts` | After `createReview` — notifies the provider |
| `sendAccountDeletion` | `src/app/api/gdpr/delete/route.ts` | After `createDeletionRequest` succeeds |
| `sendViewingConfirmation` | `src/app/api/bookings/[id]/status/route.ts` PATCH | When booking status transitions to `confirmed` — notifies the customer |

All sends are fire-and-forget (`void sendX(...)`). Errors are logged but never
bubble up to the HTTP response.

---

## Pending — Awaiting Upstream Feature

### `sendVerification`
Supabase handles verification emails natively via its Auth flow. A custom
`sendVerification` call is only needed if a bespoke verification flow is built.
Wire location: wherever `supabase.auth.resend({ type: "signup", ... })` is
called server-side, or in a dedicated `/api/auth/resend-verification` route
when it is created.

### `sendPasswordReset`
Supabase handles password reset emails natively. Wire only if a custom flow
is implemented. Candidate location: a `/api/auth/forgot-password` route that
calls `supabase.auth.resetPasswordForEmail()` server-side.

### `sendPropertyAlert`
Needs a scheduled job (cron / Inngest) that queries saved search alerts and
matches new listings. Wire to: an Inngest background function or the Supabase
Edge Function that runs the alert matcher.

### `sendPaymentConfirmation` / `sendPaymentFailed`
No Stripe webhook handler (`/api/webhooks/stripe`) exists yet. Wire to:
`checkout.session.completed` (success) and `payment_intent.payment_failed`
(failure) events in the Stripe webhook handler once it is built.

### `sendRenewalReminder`
Wire to: Stripe `customer.subscription.trial_will_end` or a 7-day-before-renewal
Inngest scheduled function. No subscription renewal handler exists yet.

### `sendWeeklyDigest`
A separate cron endpoint exists at `POST /api/email/digest` using the older
`sendDailyDigest` from `notifications/email-service`. Once the Phase 22
weekly digest workflow is the canonical path, replace with `sendWeeklyDigest`
from `email-service.ts` in that endpoint or the Supabase Edge Function
`supabase/functions/weekly-digest`.

### `sendNewEnquiry`
The `/api/rfq/create/route.ts` is the closest trigger — a new RFQ (request for
quote) is effectively an enquiry directed at service providers. Wire location:
`src/app/api/rfq/create/route.ts` after `createServiceRequest`. Requires
looking up which provider(s) to notify (many-to-many in the marketplace
model) — defer until provider-matching logic is implemented.

### `sendReEngagement`
Needs a scheduled job that identifies users inactive for N days. Wire to:
a nightly Inngest function or Supabase Edge Function that queries
`profiles.last_seen_at` and calls `sendReEngagement` for qualifying users.

### `sendReferralInvitation`
No referral feature exists yet. Wire location: a future
`POST /api/referrals/invite` route when the referral system is built.
