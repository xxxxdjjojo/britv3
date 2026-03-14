---
phase: 17-service-provider-public-profiles
plan: "07"
subsystem: ui
tags: [react, localStorage, supabase, next.js, compare, marketplace]

# Dependency graph
requires:
  - phase: 17-service-provider-public-profiles
    provides: ServiceProviderPublicProfile type, provider profile pages, CompareButton stub

provides:
  - useCompare hook — localStorage-backed compare state (max 3), SSR-safe, exported from @/components/compare/useCompare
  - CompareTable component — 7-row side-by-side provider comparison table with empty slot placeholders
  - /compare page — full client page, fetches provider data from Supabase using compare IDs from localStorage
  - CompareButton — replaces stub; shows Add/Remove/Full states using useCompare hook
  - /marketplace landing page — category grid (12 categories), hero with search form, SSR featured providers, CTA
  - CompareProvider type in src/types/providers.ts

affects: [search pages, provider profile pages that use CompareButton, 17-service-provider-public-profiles]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useCompare reads localStorage on each mutation call (not via closed-over state) to support multiple sequential add() calls within same React event cycle
    - Compare page is full "use client" — hydrates IDs from localStorage via useCompare then fetches Supabase data in useEffect
    - Marketplace landing uses plain HTML <form action="/services"> for search — works without JS
    - CompareTable pads provider slots to exactly 3 with null entries for consistent column layout

key-files:
  created:
    - src/components/compare/useCompare.ts
    - src/components/compare/CompareTable.tsx
    - src/app/(main)/compare/page.tsx
  modified:
    - src/components/providers/CompareButton.tsx
    - src/app/(main)/marketplace/page.tsx
    - src/types/providers.ts
    - src/__tests__/compare/useCompare.test.ts

key-decisions:
  - "useCompare reads localStorage on each add()/remove() call rather than relying on React state closure — required for sequential mutations within one act() call (test compatibility) and prevents stale-closure bugs"
  - "createClient() from @/lib/supabase/client used in compare page (not createBrowserClient) — matches actual export from lib/supabase/client.ts"
  - "marketplace/page.tsx replaced in full — previous search-only page moved into a sub-route pattern; new landing page is the category discovery entry point"

patterns-established:
  - "localStorage-backed hook pattern: read storage directly in mutation functions, not from React state, to handle rapid sequential calls"
  - "Compare table: always render 3 columns, pad with null/EmptySlot for consistent layout"

requirements-completed:
  - PROF-01
  - PROF-02
  - PROF-03
  - PROF-04
  - PROF-05
  - PROF-06
  - PROF-07
  - PROF-08
  - PROF-09
  - PROF-10
  - PROF-11
  - PROF-12
  - PROF-13
  - PROF-14

# Metrics
duration: 20min
completed: 2026-03-14
---

# Phase 17 Plan 07: Compare Providers and Marketplace Landing Summary

**localStorage-backed useCompare hook with 7-row side-by-side CompareTable, full /compare page, and /marketplace category landing with SSR featured providers**

## Performance

- **Duration:** 20 min
- **Started:** 2026-03-14T00:13:03Z
- **Completed:** 2026-03-14T00:33:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- useCompare hook: localStorage-backed, SSR-safe, max 3 providers, all 5 unit tests pass (784 total passing)
- CompareButton: replaced fallback stub with full Add/Remove/Full state management via useCompare
- CompareTable: 7 comparison rows (Rating, Reviews, Verified, Response Time, Price Range, Coverage, Qualifications) with empty slot placeholders and footer CTAs
- /compare page: full client route that hydrates from localStorage then fetches Supabase data; handles empty state
- /marketplace landing: hero + search form + 12 category cards + SSR featured providers + professionals CTA
- pnpm build passes with /compare and /marketplace in route output

## Task Commits

Each task was committed atomically:

1. **Task 1: useCompare hook + CompareButton + CompareTable + compare page** - `8868a78` (feat)
2. **Task 2: Marketplace category landing page** - `b30cf19` (feat)

## Files Created/Modified
- `src/components/compare/useCompare.ts` — localStorage-backed compare state hook, SSR-safe
- `src/components/compare/CompareTable.tsx` — side-by-side comparison table, 3 provider columns with empty slot fallback
- `src/app/(main)/compare/page.tsx` — full client page; loads IDs from useCompare, fetches from Supabase
- `src/components/providers/CompareButton.tsx` — replaced stub with full Add/Remove/Full states
- `src/app/(main)/marketplace/page.tsx` — category landing page with 12 cards, SSR featured providers, CTA
- `src/types/providers.ts` — added CompareProvider type
- `src/__tests__/compare/useCompare.test.ts` — replaced todo stub with 5 real unit tests

## Decisions Made
- useCompare reads localStorage directly in add()/remove() rather than via React state closure — avoids stale-state bugs when multiple add() calls fire sequentially within one React event cycle (discovered during TDD RED→GREEN phase)
- /marketplace page replaced in full rather than adding a new route — the category landing IS the marketplace homepage as specified in the plan
- createClient() export used in compare page (not createBrowserClient) — matches actual export in lib/supabase/client.ts

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] useCompare reads localStorage on each mutation (not closed-over state)**
- **Found during:** Task 1 (TDD GREEN phase — "ignores add when full" test failing)
- **Issue:** Original implementation relied on React state closure in add()/remove(); sequential calls within one act() block saw stale ids=[] on each call, preventing the third add from detecting isFull
- **Fix:** Extracted readStorage() helper; add()/remove() call readStorage() to get current list rather than reading from ids state
- **Files modified:** src/components/compare/useCompare.ts
- **Verification:** All 5 unit tests pass including "ignores add when full (3 items)"
- **Committed in:** 8868a78 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Fix was necessary for correct behavior when multiple adds fire in rapid succession. No scope creep.

## Issues Encountered
- Pre-existing test failure in `src/__tests__/pages/public.test.ts` (missing `/terms/page` import) — pre-existing, out of scope per deviation boundary rules, not introduced by this plan

## Self-Check: PASSED
- All 5 created/modified files verified present on disk
- Commits 8868a78 and b30cf19 confirmed in git log
- /compare and /marketplace in build route output
- 784 tests pass (1 pre-existing failure unrelated to this plan)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Compare feature complete: useCompare hook + CompareButton + CompareTable + /compare page
- Marketplace landing complete with category cards and featured providers
- CompareButton can now be dropped into any provider profile or search result card
- Phase 17 complete — all 7 plans delivered
