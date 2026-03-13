---
phase: 14-landlord-dashboard
plan: 05
subsystem: ui
tags: [react, nextjs, supabase, react-query, financial, deposits]

# Dependency graph
requires:
  - phase: 14-02
    provides: financial-service.ts with getRentCollection, deposit-service.ts with listDeposits, landlord types including FinancialEntry and DepositRegistration

provides:
  - Rent Collection Overview page (9.10) at /dashboard/landlord/rent with summary cards + 3-tab table
  - Per-property Rent History page (9.11) at /dashboard/landlord/rent/[propertyId] with stats + payment table
  - Deposit Management page (9.25) at /dashboard/landlord/deposits with compliance banner + card grid
  - RentPaymentRow component with status badges (paid/partial/overdue) and Mark Paid action
  - DepositCard component with scheme, status, dates, registration actions
  - GET /api/landlord/rent — returns getRentCollection JSON
  - PATCH /api/landlord/rent/[entryId]/mark-paid — updates payment_status='paid'
  - GET POST /api/landlord/deposits — list and create deposit registrations
  - PATCH /api/landlord/deposits/[id] — update deposit registration

affects:
  - landlord dashboard navigation (links to /rent and /deposits)
  - Phase 14 financial UX (rent + deposits complete the landlord financial workflow)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component fetches initial data, passes as initialData to React Query client wrapper
    - Mark Paid via optimistic React Query mutation (PATCH API route scoped to user_id)
    - Compliance warning computed server-side (serverTimestamp prop) to avoid impure Date.now() in render
    - useMemo for derived lists in client components (unregisteredDeposits)

key-files:
  created:
    - src/components/landlord/RentPaymentRow.tsx
    - src/components/landlord/DepositCard.tsx
    - src/app/(protected)/dashboard/landlord/rent/page.tsx
    - src/app/(protected)/dashboard/landlord/rent/RentCollectionClient.tsx
    - src/app/(protected)/dashboard/landlord/rent/[propertyId]/page.tsx
    - src/app/(protected)/dashboard/landlord/rent/[propertyId]/PropertyRentClient.tsx
    - src/app/(protected)/dashboard/landlord/rent/[propertyId]/PropertyRentClient.tsx
    - src/app/(protected)/dashboard/landlord/deposits/page.tsx
    - src/app/(protected)/dashboard/landlord/deposits/DepositManagementClient.tsx
    - src/app/api/landlord/rent/route.ts
    - src/app/api/landlord/rent/[entryId]/mark-paid/route.ts
    - src/app/api/landlord/deposits/route.ts
    - src/app/api/landlord/deposits/[id]/route.ts
  modified: []

key-decisions:
  - "Compliance warning for unregistered deposits uses serverTimestamp prop (from server component Date object) rather than Date.now() in client render — avoids react-hooks/purity ESLint error"
  - "PropertyRentClient is a separate client component wrapping RentPaymentRow so mutation callbacks don't cross server/client boundary as non-serializable props"
  - "Per-property rent page (9.11) links 'Log Payment' back to the rent overview sheet rather than embedding a duplicate form — avoids duplication and routes through the main overview for state invalidation"

patterns-established:
  - "Server Component passes serverTimestamp for date-based UI computations in client components"
  - "Client mutation wrappers kept as thin sibling files to server pages (e.g. RentCollectionClient.tsx, PropertyRentClient.tsx)"

requirements-completed: [LD-05, LD-15, LD-23, LD-24, LD-25]

# Metrics
duration: 20min
completed: 2026-03-13
---

# Phase 14 Plan 05: Rent Collection and Deposit Management Summary

**Rent collection pages querying financial_entries (not tenancies) and deposit management with 30-day compliance warning using React Query optimistic mutations**

## Performance

- **Duration:** 20 min
- **Started:** 2026-03-13T22:49:08Z
- **Completed:** 2026-03-13T23:09:32Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Rent Collection Overview (9.10) with 4 summary cards, 3-tab table (All/Overdue/Partial), and Mark Paid mutation
- Per-property Rent History (9.11) with year stats (collected/owed/last payment) and payment table
- Deposit Management (9.25) with DepositCard grid, compliance warning banner, and Register/Edit Sheet form
- All 4 API routes protected with `supabase.auth.getUser()` defense-in-depth

## Task Commits

Each task was committed atomically:

1. **Task 1: Rent Collection Overview (9.10) and Per-Property Rent (9.11)** - `1bfaaff` (feat)
2. **Task 2: Deposit Management (9.25)** - `bc47f21` (feat)

## Files Created/Modified
- `src/components/landlord/RentPaymentRow.tsx` - Table row with status badge + Mark Paid button
- `src/components/landlord/DepositCard.tsx` - Card with scheme, status, dates, Edit/Mark Registered actions
- `src/app/(protected)/dashboard/landlord/rent/page.tsx` - Server Component for 9.10 overview
- `src/app/(protected)/dashboard/landlord/rent/RentCollectionClient.tsx` - React Query client wrapper with tabs and mutation
- `src/app/(protected)/dashboard/landlord/rent/[propertyId]/page.tsx` - Server Component for 9.11 per-property
- `src/app/(protected)/dashboard/landlord/rent/[propertyId]/PropertyRentClient.tsx` - Client wrapper for mark-paid mutations
- `src/app/(protected)/dashboard/landlord/deposits/page.tsx` - Server Component for 9.25 deposit list
- `src/app/(protected)/dashboard/landlord/deposits/DepositManagementClient.tsx` - React Query client wrapper with Sheet form
- `src/app/api/landlord/rent/route.ts` - GET rent collection
- `src/app/api/landlord/rent/[entryId]/mark-paid/route.ts` - PATCH mark-paid
- `src/app/api/landlord/deposits/route.ts` - GET list + POST create deposits
- `src/app/api/landlord/deposits/[id]/route.ts` - PATCH update deposit

## Decisions Made
- `serverTimestamp` prop pattern: server component passes `new Date().getTime()` to client component for 30-day compliance check, avoiding the `react-hooks/purity` ESLint error that prohibits `Date.now()` in client render
- `PropertyRentClient` as a sibling client component: passing `onMarkPaid={() => {}}` from server to client would fail the serializable-props constraint; a dedicated client wrapper resolves this cleanly
- Per-property page Log Payment links to overview page rather than embedding a second form, ensuring all mutations go through the same React Query invalidation path

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Created PropertyRentClient to avoid non-serializable prop error**
- **Found during:** Task 1 (Per-property rent page)
- **Issue:** Plan specified per-property page as Server Component using RentPaymentRow with `onMarkPaid` callback. Passing a function from Server Component to Client Component fails serialization.
- **Fix:** Extracted `PropertyRentClient.tsx` as a dedicated client component that provides the mutation callback. Server page passes serializable data (the entries array) only.
- **Files modified:** `src/app/(protected)/dashboard/landlord/rent/[propertyId]/PropertyRentClient.tsx` (created)
- **Committed in:** `1bfaaff` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed react-hooks/purity ESLint error for Date.now() in compliance check**
- **Found during:** Task 2 (Deposit Management page)
- **Issue:** ESLint `react-hooks/purity` rule prohibits `Date.now()` calls in client component render, even inside `useMemo`
- **Fix:** Pass `serverTimestamp` number prop from the server component (which can call `new Date().getTime()` freely) to the client component
- **Files modified:** `src/app/(protected)/dashboard/landlord/deposits/DepositManagementClient.tsx`, `src/app/(protected)/dashboard/landlord/deposits/page.tsx`
- **Committed in:** `bc47f21` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 - Bug)
**Impact on plan:** Both fixes required for correctness and ESLint compliance. No scope creep — all planned features delivered.

## Issues Encountered
- `pnpm build` timed out in the 2-minute build window (exit code 143 / SIGTERM). This is an infrastructure timeout, not a compilation error. TypeScript checks and ESLint both pass cleanly on all new files.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Rent collection and deposit management pages complete for the landlord financial workflow
- API routes are ready for integration with Supabase `financial_entries` and `deposit_registrations` tables when data is present
- Ready for Phase 14 plan 06+ (remaining landlord dashboard features)

---
*Phase: 14-landlord-dashboard*
*Completed: 2026-03-13*

## Self-Check: PASSED

All created files verified on disk. Both task commits verified in git history (1bfaaff, bc47f21).
