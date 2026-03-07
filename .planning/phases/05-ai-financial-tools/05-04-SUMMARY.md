---
phase: 05-ai-financial-tools
plan: 04
subsystem: ui
tags: [react, calculators, mortgage, sdlt, pdf, react-pdf, localStorage]

requires:
  - phase: 05-ai-financial-tools
    provides: "Calculator pure functions (mortgage.ts, sdlt.ts, sdlt-rates.ts) and types (calculators.ts)"
provides:
  - "Mortgage calculator page at /tools/mortgage-calculator"
  - "SDLT calculator page at /tools/stamp-duty-calculator"
  - "useMortgageParams hook for localStorage persistence"
  - "PersonalizedEstimate component showing Est. X/mo on listing cards"
  - "OfferLetterButton and OfferLetterPdf for client-side PDF generation"
affects: [properties, listings, dashboard]

tech-stack:
  added: ["@radix-ui/react-slider (via Shadcn)", "@react-pdf/renderer"]
  patterns: ["base-ui render prop for trigger composition", "dynamic import with SSR disabled for browser-only libs"]

key-files:
  created:
    - britv3.0/src/hooks/useMortgageParams.ts
    - britv3.0/src/hooks/useMortgageParams.test.ts
    - britv3.0/src/components/calculators/MortgageCalculator.tsx
    - britv3.0/src/components/calculators/SdltCalculator.tsx
    - britv3.0/src/components/calculators/PersonalizedEstimate.tsx
    - britv3.0/src/components/calculators/PersonalizedEstimate.test.tsx
    - britv3.0/src/app/(main)/tools/mortgage-calculator/page.tsx
    - britv3.0/src/app/(main)/tools/stamp-duty-calculator/page.tsx
    - britv3.0/src/components/property/OfferLetterPdf.tsx
    - britv3.0/src/components/property/OfferLetterButton.tsx
    - britv3.0/src/components/property/OfferLetterPdf.test.tsx
  modified:
    - britv3.0/src/components/ui/slider.tsx

key-decisions:
  - "Mocked tooltip component in PersonalizedEstimate tests to make tooltip content always visible for testing"
  - "OfferLetterPdf tests validate component tree structure rather than rendered PDF output (avoids browser API dependency)"
  - "Slider uses base-ui onValueChange which returns number | readonly number[] -- handled with Array.isArray guard"

patterns-established:
  - "base-ui render prop: use render={<Component />} instead of asChild for trigger composition"
  - "Dynamic import for @react-pdf/renderer to avoid SSR errors"
  - "localStorage hook pattern: useEffect hydration to avoid SSR mismatch"

requirements-completed: [FIN-03, FIN-04, FIN-06]

duration: 30min
completed: 2026-03-07
---

# Phase 5 Plan 4: Calculator UI & Financial Tools Summary

**Mortgage/SDLT calculator pages with real-time results, PersonalizedEstimate listing card badge, and client-side offer letter PDF generation**

## Performance

- **Duration:** 30 min
- **Started:** 2026-03-07T18:45:14Z
- **Completed:** 2026-03-07T19:15:34Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments
- Mortgage calculator page with real-time monthly payment, total repayable, total interest, and LTV ratio
- SDLT calculator page with buyer type selection and per-band tax breakdown table
- useMortgageParams hook persists mortgage parameters in localStorage with SSR-safe hydration
- PersonalizedEstimate component renders "Est. X/mo" badge on listing cards when params are saved
- Offer letter PDF generation with @react-pdf/renderer, downloadable client-side without server calls
- 15 tests passing across 3 test files

## Task Commits

Each task was committed atomically:

1. **Task 1: Mortgage params hook, calculator UI, and tool pages** - `8b2120b` (feat) - pre-existing commit
2. **Task 2: PersonalizedEstimate component with tests** - `6dc26c9` (feat)
3. **Task 3: Offer letter PDF generation** - `9834ede` (feat)

## Files Created/Modified
- `src/hooks/useMortgageParams.ts` - localStorage persistence hook for mortgage parameters
- `src/hooks/useMortgageParams.test.ts` - 5 tests for hook behavior
- `src/components/calculators/MortgageCalculator.tsx` - Interactive mortgage calculator with sliders
- `src/components/calculators/SdltCalculator.tsx` - SDLT calculator with buyer type radio and band table
- `src/components/calculators/PersonalizedEstimate.tsx` - "Est. X/mo" badge for listing cards
- `src/components/calculators/PersonalizedEstimate.test.tsx` - 5 tests for personalized estimate
- `src/app/(main)/tools/mortgage-calculator/page.tsx` - Mortgage calculator page route
- `src/app/(main)/tools/stamp-duty-calculator/page.tsx` - SDLT calculator page route
- `src/components/property/OfferLetterPdf.tsx` - @react-pdf/renderer PDF document component
- `src/components/property/OfferLetterButton.tsx` - Dialog form with PDF generation and download
- `src/components/property/OfferLetterPdf.test.tsx` - 5 tests for PDF component
- `src/components/ui/slider.tsx` - Shadcn slider component (added)

## Decisions Made
- Mocked tooltip in PersonalizedEstimate tests to make content visible for assertions
- OfferLetterPdf tests validate React element tree rather than rendered PDF (avoids browser API dependency in test env)
- Slider onValueChange uses Array.isArray guard for base-ui compatibility (returns number | readonly number[])

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Slider component not installed**
- **Found during:** Task 1
- **Issue:** Shadcn slider component was not yet added to the project
- **Fix:** Ran `pnpm dlx shadcn@latest add slider` to install
- **Files modified:** src/components/ui/slider.tsx
- **Committed in:** 8b2120b (Task 1 commit)

**2. [Rule 1 - Bug] base-ui API differences from Radix**
- **Found during:** Task 3
- **Issue:** DialogTrigger uses `render` prop instead of `asChild` in base-ui
- **Fix:** Changed `<DialogTrigger asChild>` to `<DialogTrigger render={<Button />}>`
- **Files modified:** src/components/property/OfferLetterButton.tsx
- **Committed in:** 9834ede (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both necessary for correct functionality. No scope creep.

## Issues Encountered
- Turbopack build has a pre-existing ENOENT temp file bug unrelated to this plan's changes; TypeScript type checking confirmed no type errors in our files

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Calculator pages accessible at /tools/mortgage-calculator and /tools/stamp-duty-calculator
- PersonalizedEstimate ready to be integrated into property listing card components
- OfferLetterButton ready to be placed on property detail pages

## Self-Check: PASSED

All 12 files found. Commits 6dc26c9 and 9834ede verified. 15 tests passing.

---
*Phase: 05-ai-financial-tools*
*Completed: 2026-03-07*
