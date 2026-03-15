---
phase: 15-estate-agent-dashboard
plan: 12
subsystem: ui
tags: [react, stripe, recharts, supabase, reviews, billing, subscription]

requires:
  - phase: 15-04
    provides: agent service layer and billing service (getCurrentSubscription, createCheckoutSession, getCustomerPortalUrl)

provides:
  - Reviews dashboard with overall rating, distribution bar chart, 12-month trend line chart, filtered review list
  - Review response form with 500-char limit, profanity word-list filter, preview mode, and public response POST API
  - Subscription billing page with no-plan / active-plan states, 3-tier plan cards, Stripe Customer Portal integration, invoice history

affects:
  - 15-estate-agent-dashboard (navigation links to /dashboard/agent/reviews and /dashboard/agent/billing)
  - phase-16-tradesperson-dashboard (same reviews + billing pattern reusable)

tech-stack:
  added: []
  patterns:
    - StripeSubscriptionSummary lightweight mapper keeps Stripe SDK types out of Client Components
    - Simple profanity word-list check (no external library) with regex whole-word boundary matching
    - Monthly trend bucketed server-side from raw review rows — no extra DB query
    - Billing page fetches invoices via dynamic import of Stripe SDK (avoids bundling Stripe in shared path)

key-files:
  created:
    - src/components/dashboard/agent/reviews/ReviewsDashboard.tsx
    - src/components/dashboard/agent/reviews/ReviewResponseForm.tsx
    - src/app/(protected)/dashboard/agent/reviews/page.tsx
    - src/app/(protected)/dashboard/agent/reviews/[id]/respond/page.tsx
    - src/app/api/agent/reviews/[id]/respond/route.ts
    - src/components/dashboard/agent/billing/SubscriptionBilling.tsx
    - src/app/(protected)/dashboard/agent/billing/page.tsx
  modified: []

key-decisions:
  - "Reviews dashboard computes monthly trend server-side from raw review array — avoids extra SQL aggregation query"
  - "Profanity filter uses hardcoded Set<string> with regex whole-word boundary — no external library per plan spec"
  - "StripeSubscriptionSummary lightweight mapper in billing/page.tsx keeps Stripe.Subscription type out of client bundle"
  - "Billing page uses dynamic import of Stripe SDK for invoice fetch — avoids loading stripe in shared module graph"
  - "Invoice list fetched server-side from Stripe API directly (not via /api/agent/billing GET) — avoids extra round-trip"

patterns-established:
  - "Lightweight summary mapper pattern: server component maps Stripe SDK types to plain POJO before passing to client"
  - "Profanity filter pattern: Set<string> + regex word-boundary, no library, enforced both client (UX) and server (API) conceptually"

requirements-completed:
  - AGT-24
  - AGT-25
  - AGT-26

duration: 12min
completed: 2026-03-15
---

# Phase 15 Plan 12: Reviews Dashboard, Response Form, and Subscription Billing Summary

**Reviews dashboard with Recharts rating distribution + 12-month trend, 500-char profanity-filtered response form, and Stripe subscription billing page with 3-tier plan cards and Customer Portal integration**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-15T14:27:07Z
- **Completed:** 2026-03-15T14:39:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Reviews dashboard showing overall star rating, bar chart by star level, line chart of monthly average over 12 months, and filtered review list with "Respond" CTA
- Review response form with 500-character counter, preview toggle, and word-list profanity check that blocks submission without external dependency
- Billing page rendering no-plan state (3 subscription tier cards with Stripe Checkout redirect) or active-plan state (current plan card, Stripe Customer Portal link, last 10 invoices)

## Task Commits

1. **Task 1: Reviews dashboard and respond pages** - `34f1755` (feat)
2. **Task 2: Subscription and Billing page** - `efa7a94` (feat)

## Files Created/Modified

- `src/components/dashboard/agent/reviews/ReviewsDashboard.tsx` — Overall rating hero, Recharts distribution and trend charts, filterable review list
- `src/components/dashboard/agent/reviews/ReviewResponseForm.tsx` — Response textarea with char counter, profanity check, preview mode, Sonner toast feedback
- `src/app/(protected)/dashboard/agent/reviews/page.tsx` — Server component: queries reviews by reviewed_user_id, computes monthly trend buckets
- `src/app/(protected)/dashboard/agent/reviews/[id]/respond/page.tsx` — Server component: ownership-verified review fetch, notFound on mismatch
- `src/app/api/agent/reviews/[id]/respond/route.ts` — POST endpoint: validates ownership, enforces 500-char limit, saves agent_response + responded_at
- `src/components/dashboard/agent/billing/SubscriptionBilling.tsx` — NoPlanCard (plan tier cards + checkout), ActiveSubscriptionCard (plan details + portal + invoices)
- `src/app/(protected)/dashboard/agent/billing/page.tsx` — Server component: getCurrentSubscription, lightweight mapper, invoice fetch via dynamic Stripe import

## Decisions Made

- Reviews dashboard computes monthly trend server-side from the raw review array (12-bucket initialisation loop) — avoids extra SQL aggregation query at the cost of slightly more JS
- Profanity filter uses a hardcoded `Set<string>` with regex whole-word boundary matching — no external library per plan specification; list is ~40 common English words, expandable
- `StripeSubscriptionSummary` lightweight mapper in `billing/page.tsx` converts `Stripe.Subscription` to a plain POJO before passing to the Client Component — keeps Stripe SDK types and their tree-shaking footprint out of the client bundle
- Billing page fetches invoices via dynamic `import("stripe")` inside the server component — consistent with existing agent-billing-service pattern and avoids the Stripe SDK in the shared module graph

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no new external service configuration required. Stripe integration reuses existing `STRIPE_SECRET_KEY` and the billing API route from plan 15-04.

## Next Phase Readiness

- Reviews and billing pages complete; agent dashboard navigation can now link to `/dashboard/agent/reviews` and `/dashboard/agent/billing`
- Phase 16 tradesperson dashboard can follow the same reviews + billing pattern

## Self-Check: PASSED

All 7 source files confirmed present on disk. Both task commits (34f1755, efa7a94) confirmed in git log.

---
*Phase: 15-estate-agent-dashboard*
*Completed: 2026-03-15*
