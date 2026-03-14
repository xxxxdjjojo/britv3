---
phase: 15-estate-agent-dashboard
plan: 08
subsystem: ui
tags: [react, supabase, realtime, react-day-picker, shadcn, typescript, viewings, offers, negotiation]

# Dependency graph
requires:
  - phase: 15-03
    provides: agent-viewing-service.ts (getAgentViewingSlots, createViewingSlot, deleteViewingSlot, getViewingFeedback, submitViewingFeedback) and agent-offer-service.ts (getAgentOffers, getOfferById, updateOfferStatus, counterOffer, getOfferHistory)

provides:
  - ViewingCalendar.tsx — day/week/month calendar with react-day-picker, slot publishing dialog, edit dialog, Supabase Realtime subscription
  - ViewingFeedbackForm.tsx — star rating, price opinion radio, likelihood radio, read-only feedback cards
  - viewings/page.tsx — Server Component fetching current-month slots
  - viewings/feedback/page.tsx — Server Component computing booked slots without feedback
  - OffersDashboard.tsx — offers grouped by property with status/AIP badges, search/filter/sort, Supabase Realtime
  - NegotiationThread.tsx — offer summary card, history timeline, accept/reject/counter dialogs with sonner toasts
  - offers/page.tsx — Server Component fetching all agent offers
  - offers/[id]/page.tsx — Server Component fetching single offer + history
  - api/agent/viewings/feedback/route.ts — GET/POST feedback endpoint
  - api/agent/offers/[id]/history/route.ts — GET offer history for client-side refresh

affects: [phase-10-buyer-viewing-booking, 15-09, 15-10]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component passes initialSlots/initialOffers to client component; Realtime subscription refreshes via fetch API (avoid re-fetching on mount)
    - Sonner toasts for all mutation feedback (accept/reject/counter)
    - Grouped offers rendered as Map<propertyId, AgentOffer[]> — property section per property
    - History timeline rendered from AgentOfferHistory array with status-change diff display

key-files:
  created:
    - src/components/dashboard/agent/viewings/ViewingCalendar.tsx
    - src/components/dashboard/agent/viewings/ViewingFeedbackForm.tsx
    - src/app/(protected)/dashboard/agent/viewings/feedback/page.tsx
    - src/app/api/agent/viewings/feedback/route.ts
    - src/components/dashboard/agent/offers/OffersDashboard.tsx
    - src/components/dashboard/agent/offers/NegotiationThread.tsx
    - src/app/(protected)/dashboard/agent/offers/page.tsx
    - src/app/(protected)/dashboard/agent/offers/[id]/page.tsx
    - src/app/api/agent/offers/[id]/history/route.ts
  modified:
    - src/app/(protected)/dashboard/agent/viewings/page.tsx

key-decisions:
  - "ViewingCalendar uses DayPicker Day render-prop to overlay booked/available dot indicators — avoids patching DayPicker styles"
  - "DELETE /api/agent/viewings reads slot_id from query params (not body); EditSlotDialog uses ?slot_id= query string to match existing API contract"
  - "Feedback page computes bookedSlotsWithoutFeedback server-side by diffing slot IDs against feedback viewing_slot_id set"
  - "NegotiationThread refreshes history via GET /api/agent/offers/[id]/history after accept — avoids a full page reload"
  - "OffersDashboard groups offers client-side from flat initialOffers array rather than a grouped server response — simpler for Realtime refresh"

patterns-established:
  - "Client calendar pattern: Server Component fetches initial data, client calendar manages Realtime updates via fetch refresh"
  - "Star rating via custom StarRating component (no external lib) — 5 fill-amber-400 stars toggled on click"
  - "Offer action dialogs (Counter, Reject) are co-located sub-components in NegotiationThread.tsx — not separate files"

requirements-completed: [AGT-12, AGT-13, AGT-14, AGT-15]

# Metrics
duration: 14min
completed: 2026-03-14
---

# Phase 15 Plan 08: Viewing Calendar, Feedback, Offers Dashboard, and Negotiation Thread Summary

**react-day-picker calendar in 3 modes with slot publishing, post-viewing feedback form with structured rating fields, offers grouped by property with Realtime updates, and negotiation thread with accept/reject/counter audit trail**

## Performance

- **Duration:** 14 min
- **Started:** 2026-03-14T18:39:53Z
- **Completed:** 2026-03-14T18:53:59Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Viewing calendar with react-day-picker DayPicker in day/week/month modes, green/blue dot indicators, slot publishing dialog, edit/reschedule dialog, and Supabase Realtime subscription refreshing on any slot change
- Post-viewing feedback form with star rating (1-5), price opinion (too_high/about_right/good_value), likelihood to offer (unlikely/possible/likely/very_likely), textarea comments, and read-only display cards with colour-coded badges
- Offers dashboard grouping all agent offers by property, with search/filter by status/sort by amount or date, Supabase Realtime subscription for new offers
- Negotiation thread showing offer summary, full audit history timeline, and context-aware action buttons (accept/counter/reject based on current status) with accept triggering sale progression initiation via existing service layer

## Task Commits

Each task was committed atomically:

1. **Task 1: Build Viewing Calendar and Feedback pages** - `aa93e23` (feat)
2. **Task 2: Build Offers Dashboard and Negotiation Thread pages** - `2694f57` (feat)

**Plan metadata:** [to be filled by final commit]

## Files Created/Modified

- `src/components/dashboard/agent/viewings/ViewingCalendar.tsx` — DayPicker calendar with day/week/month views, slot publishing, edit dialog, Realtime subscription
- `src/components/dashboard/agent/viewings/ViewingFeedbackForm.tsx` — StarRating component, price opinion/likelihood radio buttons, read-only FeedbackCard display
- `src/app/(protected)/dashboard/agent/viewings/page.tsx` — Server Component fetching current-month + next-month slots (overwrote stub)
- `src/app/(protected)/dashboard/agent/viewings/feedback/page.tsx` — Server Component computing booked slots without feedback
- `src/app/api/agent/viewings/feedback/route.ts` — GET/POST feedback API with auth guard
- `src/components/dashboard/agent/offers/OffersDashboard.tsx` — Offers grouped by property, filter/sort/search, Realtime subscription
- `src/components/dashboard/agent/offers/NegotiationThread.tsx` — Offer summary card, history timeline, CounterDialog, RejectDialog, sonner toasts
- `src/app/(protected)/dashboard/agent/offers/page.tsx` — Server Component fetching all agent offers
- `src/app/(protected)/dashboard/agent/offers/[id]/page.tsx` — Server Component fetching offer + history via getOfferById
- `src/app/api/agent/offers/[id]/history/route.ts` — GET offer history for client-side refresh after accept action

## Decisions Made

- ViewingCalendar uses DayPicker Day render-prop to overlay dot indicators — no style patching needed
- DELETE /api/agent/viewings reads from query params so EditSlotDialog calls `?slot_id=` — matches existing API contract from 15-03
- Feedback page computes pending-feedback slots server-side to avoid extra client fetch
- NegotiationThread refreshes history via `/api/agent/offers/[id]/history` after accept action instead of full page reload
- OffersDashboard groups offers client-side (Map on flat array) which simplifies Realtime refresh pattern

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Created feedback API route**
- **Found during:** Task 1 (ViewingFeedbackForm)
- **Issue:** Plan described `submitViewingFeedback via API` but no `/api/agent/viewings/feedback` route existed — the form would have no endpoint to call
- **Fix:** Created `src/app/api/agent/viewings/feedback/route.ts` with GET/POST handlers
- **Files modified:** src/app/api/agent/viewings/feedback/route.ts (new)
- **Verification:** TypeScript compiles with zero errors in new file
- **Committed in:** aa93e23 (Task 1 commit)

**2. [Rule 2 - Missing Critical] Created offer history API route**
- **Found during:** Task 2 (NegotiationThread)
- **Issue:** NegotiationThread refreshes history client-side after accept action; no `/api/agent/offers/[id]/history` route existed
- **Fix:** Created `src/app/api/agent/offers/[id]/history/route.ts` using `getOfferHistory` service function
- **Files modified:** src/app/api/agent/offers/[id]/history/route.ts (new)
- **Verification:** TypeScript compiles with zero errors in new file
- **Committed in:** 2694f57 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 2 - Missing Critical functionality)
**Impact on plan:** Both were necessary for the UI components to function. No scope creep.

## Issues Encountered

- Pre-existing TypeScript errors in 6 unrelated files (providers/ReviewsTab.tsx, compare/page.tsx, marketplace/page.tsx, test file) — out of scope, logged per deviation rules, not fixed.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Viewing calendar with slot publishing resolves the Phase 10 blocker (agent-published viewing_slots must exist before buyer booking flow)
- Offer negotiation thread links to existing PATCH /api/agent/offers for accept/reject/counter — fully connected to service layer
- Accept action triggers createSaleProgression via existing service-to-service call in updateOfferStatus

---
*Phase: 15-estate-agent-dashboard*
*Completed: 2026-03-14*

## Self-Check: PASSED

All 9 new files verified present on disk. Both task commits (aa93e23, 2694f57) verified in git log.
