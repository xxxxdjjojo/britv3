# Phase 18: Payments & Billing — CEO Plan Review

**Date:** 2026-03-17
**Mode:** SCOPE EXPANSION
**Stitch Project:** Britestate Homepage (ID: 5956704101394866719)
**Screens:** 8 Stitch reference designs reviewed

---

## System Audit Summary

### What Exists (Before Phase 18)

| Sub-Page | Status | Completeness | Roles |
|----------|--------|-------------|-------|
| 18.1 Subscription Checkout | Partial — Agent-only Stripe Hosted Checkout redirect | ~60% agent, 0% universal |
| 18.2 One-Time Payment (Boost) | Partial — Agent 3-step wizard, placeholder price IDs, no webhook activation | ~55% agent |
| 18.3 Payment Method Management | Not built — Stripe Portal redirect only | ~10% |
| 18.4 Billing History / Invoices | Partial — Agent-only, live Stripe API (no caching) | ~50% agent |
| 18.5 Payment Confirmation | Email template exists, no page, no trigger wiring | ~30% |
| 18.6 Payment Failed | Email template exists, no page, no webhook trigger | ~25% |
| 18.7 Subscription Management | Partial — Admin DB-only cancel (doesn't sync to Stripe!) | ~40% |
| 18.8 Refund Request | Zero implementation | 0% |

### Critical Infrastructure Gap

**No Stripe webhook handler exists.** This is the #1 blocker. Without it:
- Payment confirmation emails never send
- Payment failed emails never send
- Listing boosts never activate after purchase
- Subscription status never syncs to Supabase
- Provider Stripe Connect payouts permanently stale

Already flagged as P1 in TODOS.md line 466.

### Existing Code to Reuse

| Code | Reuse Strategy |
|------|---------------|
| `agent-billing-service.ts` | Refactor → universal `billing-service.ts` |
| `SubscriptionBilling.tsx` | Extract helpers, rebuild UI matching Stitch |
| `FeaturedListingBoost.tsx` | Reuse 3-step wizard pattern for refund |
| `payment-confirmation.tsx` email | Wire to webhook |
| `payment-failed.tsx` email | Wire to webhook |
| `renewal-reminder.tsx` email | Wire to scheduled job |
| `statusBadge()` helper | Extract to shared component |
| `formatGBP()` / `formatDate()` | Extract to `lib/formatters.ts` |

---

## Architecture Decisions

### 1. Stripe Payment Element (embedded)
- SAQ A compliant (not SAQ A-EP)
- 95% Stitch design fidelity
- Supports cards, Apple Pay, Google Pay, bank transfers
- Replaces current Stripe Hosted Checkout redirect

### 2. Universal Billing Service
- Single `billing-service.ts` for all roles (agent, provider, landlord)
- Role parameter drives plan catalog selection
- Replaces agent-specific `agent-billing-service.ts`

### 3. Server-Side URL Allowlist
- Client sends redirect_key (e.g. "agent_billing"), server maps to URL
- Prevents open redirect via Stripe success_url/cancel_url

### 4. Webhook as Source of Truth
- All payment lifecycle events flow through webhook handler
- DB is cache; Stripe is source of truth
- Idempotent via `stripe_events` table (keyed by `stripe_event_id`)

---

## System Architecture

```
FRONTEND (Next.js App Router)
┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────────┐
│ /checkout/            │  │ /dashboard/[role]/    │  │ /admin/billing/   │
│   subscription/       │  │   billing/            │  │   refunds/        │
│   one-time/           │  │     methods/          │  │                   │
│   confirmation/       │  │     history/          │  │                   │
│   failed/             │  │     subscription/     │  │                   │
│                       │  │     refund/           │  │                   │
└──────────┬───────────┘  └──────────┬───────────┘  └──────────┬────────┘
           │                         │                          │
┌──────────▼─────────────────────────▼──────────────────────────▼────────┐
│                    API ROUTES  (/api/billing/*)                         │
│  POST /checkout    GET /invoices    POST /refund    POST /methods      │
└──────────┬─────────────────────────────────────────────────────────────┘
           │
┌──────────▼─────────────────────────────────────────────────────────────┐
│                   BILLING SERVICE LAYER                                 │
│  billing-service.ts │ payment-method-service.ts │ refund-service.ts    │
└──────────┬─────────────────────────────────────────────────────────────┘
           │
┌──────────▼──────────┐  ┌──────────────────────────────────────────────┐
│   STRIPE SDK        │  │  WEBHOOK HANDLER (/api/webhooks/stripe/)     │
│   (server-only)     │  │  ├─ checkout.session.completed               │
│                     │  │  ├─ invoice.payment_succeeded/failed          │
│                     │  │  ├─ customer.subscription.updated/deleted     │
│                     │  │  ├─ charge.refunded                          │
│                     │  │  ├─ payment_method.attached/detached          │
│                     │  │  └─ payout.paid/failed + account.updated      │
└─────────────────────┘  └──────────────────────────────────────────────┘

DATABASE: stripe_events, billing_events, refund_requests, boost_purchases,
          subscriptions, profiles.stripe_customer_id
EMAILS: payment-confirmation, payment-failed, renewal-reminder,
        refund-confirmed, refund-rejected
```

---

## Build Plan (4 Waves)

### Wave 1 — Infrastructure (P1)
- [ ] DB migration: `stripe_events`, `billing_events`, `refund_requests`, `boost_purchases`, add `profiles.stripe_customer_id`
- [ ] `lib/stripe.ts` — Stripe singleton
- [ ] `lib/formatters.ts` — extract `formatGBP()`, `formatDate()`, `statusBadge()`
- [ ] `billing-service.ts` — universal (refactor from agent-specific)
- [ ] `payment-method-service.ts` — list, setDefault, detach
- [ ] `refund-service.ts` — createRequest, processRefund, getStatus
- [ ] `/api/webhooks/stripe/route.ts` — signature verification + idempotency + event routing
- [ ] `/api/billing/` routes (checkout, invoices, methods, refund, subscription)
- [ ] Fix empty catch blocks in existing billing code
- [ ] Fix admin cancelSubscription to sync with Stripe

### Wave 2 — Checkout + Confirmation + Failed
- [ ] 18.1 Checkout — Subscription Purchase (Stripe Payment Element, 2-col Stitch layout, annual/monthly toggle, trust badges)
- [ ] 18.2 Checkout — One-Time Payment (Payment Element, product preview, order summary)
- [ ] 18.5 Payment Confirmation (green celebration, confetti, transaction summary, PDF receipt download, "Go to Dashboard" CTA)
- [ ] 18.6 Payment Failed (smart Stripe decline codes, contextual reasons, retry + change method CTAs, support contact)

### Wave 3 — Dashboard Billing Pages
- [ ] 18.3 Payment Method Management (saved cards list, default badge, add new, Apple Pay/bank transfer, edit/remove)
- [ ] 18.4 Billing History / Invoices (date range filter, transaction table, status badges, PDF download, pagination)
- [ ] 18.7 Subscription Management (current plan card, usage metrics + progress bars, upgrade/downgrade, cancel with confirmation, upsell banner)

### Wave 4 — Refund + Admin + Email Wiring
- [ ] 18.8 Refund Request (3-step wizard: Details → Reason with empathy flow + retention offers → Review)
- [ ] Admin Refund Processing Dashboard (queue, approve/reject, audit log)
- [ ] Wire payment-confirmation.tsx to invoice.payment_succeeded webhook
- [ ] Wire payment-failed.tsx to invoice.payment_failed webhook
- [ ] Refund confirmation/rejection email templates

---

## Delight Features (approved, built in-scope)

1. **Confetti on payment success** — canvas-confetti burst on confirmation page load (15 min)
2. **Annual billing toggle** — monthly/annual switch with animated price + "Save £X!" badge (20 min)
3. **Smart decline reasons** — map Stripe decline_code to friendly user messages + bank contact info (30 min)
4. **Usage metrics on subscription** — "82% of listing limit used" progress bars driving organic upgrades (25 min)
5. **Refund empathy flow** — "We're sorry" header, alternative offers before refund, estimated processing time (20 min)

---

## Deferred to TODOS.md

| Item | Priority | Effort | Why Deferred |
|------|----------|--------|-------------|
| Dunning sequence (Day 0/3/7/14 escalation emails) | P2 | M | Requires scheduled job infra; Day 0 email covers critical case |
| Branded Britestate invoice PDF | P2 | M | Stripe PDFs adequate for launch |
| Renewal reminder scheduled job | P2 | S | Stripe sends own notifications; ours is branded enhancement |

---

## Security Model

| Threat | Mitigation |
|--------|-----------|
| Webhook spoofing | Stripe-Signature header verification (HMAC) |
| IDOR on billing endpoints | All queries scoped to authenticated user.id |
| Price manipulation | Server resolves price from plan_key, never trusts client amounts |
| Refund amount tampering | Server validates amount ≤ original charge |
| Open redirect via success_url | Server-side URL allowlist (client sends redirect_key only) |
| PII in logs | Never log card details; only last4 + brand |
| Replay attacks on webhook | Idempotency table keyed on stripe_event_id |
| Refund fraud | Rate limit: 1 request per transaction; admin approval for >£100 |

---

## Error & Rescue Registry

| Method | Can Fail With | Rescued? | User Sees |
|--------|--------------|----------|-----------|
| createCheckoutSession | Stripe timeout | Y | "Try again" toast |
| createCheckoutSession | Invalid price_id | Y | "Contact support" + ref code |
| getInvoices | Stripe unavailable | Y | Cached DB data shown |
| getSubscription | No stripe_customer_id | Y | "No active plan" state |
| webhook handler | Invalid signature | Y | N/A (returns 400) |
| webhook handler | Duplicate event | Y | N/A (idempotency skip) |
| webhook handler | Email send failure | Y | N/A (best-effort, logged) |
| processRefund | Stripe refund fails | Y | "Unable to process" + support |
| setDefaultMethod | Method belongs to other | Y | "Invalid payment method" |

---

## Stitch Reference Screens

| Screen | Stitch ID | Key Implementation Notes |
|--------|-----------|------------------------|
| Checkout — Subscription | 5ace09758eba43159ebc9db48af2748c | 2-col: billing form + order summary. Add annual toggle |
| Checkout — One-Time | 0f2c9400c53d463aa5618cd0df149638 | 2-col: payment form + product preview with property image |
| Payment Confirmation | 4a905cda7fd14108990004e70210d0da | Modal/overlay style. Green header + confetti. Transaction table |
| Payment Failed | 0a3fa56804b5493da66ee6a51824da6b | Red alert. Smart decline codes. Retry + Change Method CTAs |
| Subscription Management | 5eab4cb0485f437da13533cf0b69fd11 | Current plan + usage metrics + downgrade/cancel + upsell |
| Payment Methods | 88aa459ace674f3da6e7a83cc847bb9d | Card list + default badge + Apple Pay + bank transfer |
| Billing History | d0af6eb7c40949fa83b697420d2e32e4 | Sidebar nav + date filter + transaction table + PDF links |
| Refund Request | dda9c9e1d5cc43d8923e0af30f9177f3 | 3-step wizard. Add empathy flow + retention offers |

---

## Observability

**Metrics:** checkout.created, checkout.completed, checkout.failed, webhook.processed, webhook.duplicate, refund.requested, refund.processed
**Alerts:** webhook error rate >5% (page), checkout fail rate >20% (alert), duplicate webhooks >50/min (attack)
**Logging:** Structured JSON for every webhook event, checkout, refund with user_id + amount + status
