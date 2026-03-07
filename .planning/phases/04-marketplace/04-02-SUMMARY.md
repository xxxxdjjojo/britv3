---
phase: 04-marketplace
plan: 02
subsystem: infra
tags: [inngest, file-type, geocoding, state-machine, sentiment, spam-detection, vitest, tdd]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Next.js app scaffold, vitest test infrastructure"
provides:
  - "Inngest client singleton and serve endpoint"
  - "Postcodes.io geocoding service (single, bulk, validate)"
  - "Magic bytes file validator (PDF, JPEG, PNG, WebP)"
  - "Booking state machine with 9 transitions and role-based access"
  - "Rule-based sentiment analyzer for review text"
  - "Spam detector with 6 indicator categories"
affects: [04-marketplace, service-listings, booking-system, reviews, file-uploads]

# Tech tracking
tech-stack:
  added: [inngest@3.52.6, file-type@21.3.0]
  patterns: [magic-bytes-validation, state-machine-transitions, keyword-based-sentiment, regex-spam-detection]

key-files:
  created:
    - britv3.0/src/inngest/client.ts
    - britv3.0/src/app/api/inngest/route.ts
    - britv3.0/src/services/geocoding/postcodes-io.ts
    - britv3.0/src/lib/marketplace/file-validator.ts
    - britv3.0/src/lib/marketplace/booking-state-machine.ts
    - britv3.0/src/lib/marketplace/sentiment-analyzer.ts
    - britv3.0/src/lib/marketplace/spam-detector.ts
  modified:
    - britv3.0/package.json

key-decisions:
  - "Used file-type ESM import directly (no dynamic import wrapper needed)"
  - "Booking state machine defines 9 transitions including provider/user cancel from in_progress"
  - "Sentiment analyzer uses 30+ positive/negative keywords with intensifier multiplier of 1.5x"
  - "Spam detector uses 10-character minimum threshold before flagging excessive caps"

patterns-established:
  - "Pure utility modules: no DB dependencies, fully unit-testable with mocked fetch"
  - "Postcodes.io graceful error handling: return null/empty on failure, never throw"
  - "State machine pattern: canTransition returns {allowed, requiresReason} for UI integration"

requirements-completed: [MKT-08, MKT-11, MKT-14]

# Metrics
duration: 8min
completed: 2026-03-07
---

# Phase 4 Plan 2: Marketplace Utility Modules Summary

**Inngest setup, postcodes.io geocoding, magic-bytes file validator, booking state machine, sentiment analyzer, and spam detector -- 6 pure utility modules with 51 tests**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-07T17:52:07Z
- **Completed:** 2026-03-07T18:00:07Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Installed inngest and file-type dependencies; created Inngest client singleton and /api/inngest serve endpoint
- Built postcodes.io geocoding service with single, bulk, and validate functions (9 tests)
- Built 4 marketplace utility modules via TDD: file validator, booking state machine, sentiment analyzer, spam detector (42 tests)
- All 51 tests passing, production build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create Inngest + geocoding infrastructure** - `f63468f` (feat)
2. **Task 2 RED: Add failing tests for marketplace utility modules** - `269b60b` (test)
3. **Task 2 GREEN: Implement marketplace utility modules** - `c2615a0` (feat)

## Files Created/Modified
- `britv3.0/src/inngest/client.ts` - Inngest client singleton with id "britestate"
- `britv3.0/src/app/api/inngest/route.ts` - Inngest serve endpoint exporting GET, POST, PUT
- `britv3.0/src/services/geocoding/postcodes-io.ts` - UK postcode geocoding via postcodes.io API
- `britv3.0/src/services/geocoding/postcodes-io.test.ts` - 9 geocoding tests
- `britv3.0/src/lib/marketplace/file-validator.ts` - Magic bytes file type validation (PDF/JPEG/PNG/WebP)
- `britv3.0/src/lib/marketplace/file-validator.test.ts` - 7 file validator tests
- `britv3.0/src/lib/marketplace/booking-state-machine.ts` - 9-transition state machine with role checks
- `britv3.0/src/lib/marketplace/booking-state-machine.test.ts` - 15 state machine tests
- `britv3.0/src/lib/marketplace/sentiment-analyzer.ts` - Keyword-based review sentiment scoring
- `britv3.0/src/lib/marketplace/sentiment-analyzer.test.ts` - 7 sentiment tests
- `britv3.0/src/lib/marketplace/spam-detector.ts` - 6-indicator spam detection
- `britv3.0/src/lib/marketplace/spam-detector.test.ts` - 10 spam detector tests
- `britv3.0/package.json` - Added inngest and file-type dependencies

## Decisions Made
- Used file-type ESM import directly (no dynamic import wrapper needed) -- works with vitest ESM handling
- Booking state machine defines 9 transitions including provider/user cancel from in_progress state, with requiresReason flag for cancellation/decline
- Sentiment analyzer uses 30+ positive and 30+ negative keywords with intensifier multiplier of 1.5x; confidence capped at min(matchedWords / 5, 1)
- Spam detector uses 10-character letter minimum before flagging excessive caps to avoid false positives on short text

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 6 utility modules ready for service-layer plans (04-03 through 04-08)
- Inngest client ready for background job functions to be registered
- File validator, booking state machine, sentiment analyzer, and spam detector are pure functions ready for import

---
*Phase: 04-marketplace*
*Completed: 2026-03-07*
