---
phase: 05-ai-financial-tools
plan: 02
subsystem: calculators
tags: [mortgage, sdlt, stamp-duty, financial, pure-functions, tdd, vitest]

# Dependency graph
requires: []
provides:
  - "Pure mortgage calculator (calculateMonthlyPayment, calculateTotalRepayable, calculateAffordability)"
  - "SDLT calculator with April 2025 HMRC rates for standard, first-time, and additional buyers"
  - "Calculator TypeScript types (MortgageParams, MortgageResult, SdltBand, BuyerType, SdltResult)"
affects: [property-search-ui, affordability-display, property-listing-pages]

# Tech tracking
tech-stack:
  added: []
  patterns: [pure-function-calculators, tdd-red-green-refactor]

key-files:
  created:
    - britv3.0/src/types/calculators.ts
    - britv3.0/src/lib/calculators/mortgage.ts
    - britv3.0/src/lib/calculators/mortgage.test.ts
    - britv3.0/src/lib/calculators/sdlt-rates.ts
    - britv3.0/src/lib/calculators/sdlt-rates.test.ts
    - britv3.0/src/lib/calculators/sdlt.ts
    - britv3.0/src/lib/calculators/sdlt.test.ts
  modified: []

key-decisions:
  - "Fixed plan's SDLT 1M test expectation from 41,250 to 43,750 (correct HMRC calculation)"
  - "SDLT rates stored as threshold-based bands with surcharge applied additively"

patterns-established:
  - "Pure calculator functions: zero dependencies, deterministic, testable in isolation"
  - "Rate configuration separated from calculation logic (sdlt-rates.ts vs sdlt.ts)"

requirements-completed: [FIN-01, FIN-02, FIN-05]

# Metrics
duration: 18min
completed: 2026-03-07
---

# Phase 05 Plan 02: Financial Calculators Summary

**Pure mortgage amortization and SDLT stamp duty calculators with 25 TDD tests using April 2025 HMRC rates**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-07T18:09:51Z
- **Completed:** 2026-03-07T18:28:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Mortgage calculator with standard amortization formula, edge cases for zero interest/principal/term
- SDLT calculator with correct April 2025 HMRC rates (5% additional surcharge, 125K standard nil-rate, 300K FTB)
- First-time buyer relief with automatic fallback to standard rates above 500K price cap
- 25 passing tests covering all buyer types, edge cases, and per-band breakdowns

## Task Commits

Each task was committed atomically:

1. **Task 1: Mortgage Calculator** (TDD)
   - `b8b61bf` (test) - Failing mortgage tests
   - `3266c22` (feat) - Implement mortgage calculator
2. **Task 2: SDLT Calculator** (TDD)
   - `8a0f9e9` (test) - Failing SDLT tests
   - `b6efd96` (feat) - Implement SDLT calculator

## Files Created/Modified
- `britv3.0/src/types/calculators.ts` - MortgageParams, MortgageResult, SdltBand, BuyerType, SdltResult types
- `britv3.0/src/lib/calculators/mortgage.ts` - calculateMonthlyPayment, calculateTotalRepayable, calculateAffordability
- `britv3.0/src/lib/calculators/mortgage.test.ts` - 10 tests for mortgage calculations
- `britv3.0/src/lib/calculators/sdlt-rates.ts` - HMRC rate band configuration (April 2025)
- `britv3.0/src/lib/calculators/sdlt-rates.test.ts` - 4 tests for rate configuration
- `britv3.0/src/lib/calculators/sdlt.ts` - calculateSdlt with band-based progressive calculation
- `britv3.0/src/lib/calculators/sdlt.test.ts` - 11 tests for SDLT calculations

## Decisions Made
- Fixed plan's SDLT 1M test expectation from 41,250 to 43,750 (plan had arithmetic error; 0+2,500+33,750+7,500=43,750)
- SDLT rates stored as threshold-based bands with surcharge applied additively per band
- Rate configuration separated from calculation logic for maintainability when HMRC updates rates

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect SDLT 1M expected value in plan**
- **Found during:** Task 2 (SDLT Calculator GREEN phase)
- **Issue:** Plan specified 1M standard SDLT = 41,250, but correct HMRC calculation is 43,750
- **Fix:** Updated test expectation to 43,750 and effective rate to 4.375%
- **Files modified:** britv3.0/src/lib/calculators/sdlt.test.ts
- **Verification:** Matches manual HMRC calculation: 0 + 2,500 + 33,750 + 7,500 = 43,750
- **Committed in:** b6efd96 (Task 2 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug in plan test data)
**Impact on plan:** Corrected test data to match actual HMRC rates. No scope creep.

## Issues Encountered
- Pre-existing build failure (globals.css import in layout) and lint errors (marketplace services) -- unrelated to calculator changes, not in scope

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Calculator libraries ready for integration into property listing UI components
- Affordability display can use calculateAffordability with property price and user deposit
- SDLT display can show per-band breakdown with buyer type selection

## Self-Check: PASSED

All 7 files verified present. All 4 commits verified in git log.

---
*Phase: 05-ai-financial-tools*
*Completed: 2026-03-07*
