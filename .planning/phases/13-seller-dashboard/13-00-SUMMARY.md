---
phase: 13-seller-dashboard
plan: "00"
subsystem: seller-dashboard
tags: [dependencies, test-stubs, nyquist, tdd]
dependency_graph:
  requires: []
  provides: [seller-test-stubs, phase-13-deps]
  affects: [13-01, 13-02, 13-03, 13-04, 13-05, 13-06, 13-07, 13-08, 13-09, 13-10]
tech_stack:
  added: [date-fns@4.1.0, "@dnd-kit/core@6.3.1", "@dnd-kit/sortable@8.0.0", "@dnd-kit/utilities@3.2.2", browser-image-compression@2.0.2]
  patterns: [nyquist-stub-pattern, tdd-red-phase]
key_files:
  created:
    - src/__tests__/seller/dashboard-kpis.test.ts
    - src/__tests__/seller/listing-service.test.ts
    - src/__tests__/seller/wizard-state.test.ts
    - src/__tests__/seller/analytics-service.test.ts
    - src/__tests__/seller/viewing-transitions.test.ts
    - src/__tests__/seller/offer-card.test.tsx
    - src/__tests__/seller/offer-state-machine.test.ts
    - src/__tests__/seller/sale-progression.test.ts
    - src/__tests__/seller/land-registry-parser.test.ts
    - src/__tests__/seller/agent-search.test.ts
    - src/__tests__/seller/agent-compare.test.tsx
    - src/__tests__/seller/ai-description.test.ts
    - src/__tests__/seller/photo-upload.test.ts
  modified:
    - package.json
    - pnpm-lock.yaml
decisions:
  - "Used date-fns@^4.1.0 (ESM-only v4) not v3, matching project module system and react-day-picker@9 compatibility requirement"
  - "All test stubs use it.todo() pattern so they show as skipped/pending, not failing — correct red-phase behaviour"
metrics:
  duration: "~3 minutes"
  completed: "2026-03-15"
  tasks_completed: 2
  files_created: 13
  files_modified: 2
---

# Phase 13 Plan 00: Install Dependencies and Nyquist Test Stubs Summary

Wave 0 gate complete — installed 5 Phase 13 dependencies and created 13 test stub files covering all SELL-* requirements. The `pnpm test --run src/__tests__/seller/` command now runs in under 5 seconds with 13 suites and 56 todo tests.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install Phase 13 dependencies | 45da1cb | package.json, pnpm-lock.yaml |
| 2 | Create 13 Nyquist test stub files | 70c90a7 | 13 test files in src/__tests__/seller/ |

## Dependencies Installed

| Package | Version | Used In |
|---------|---------|---------|
| date-fns | ^4.1.0 | ViewingCard, SaleProgressionStepper, analytics charts |
| @dnd-kit/core | ^6.3.1 | Step3Photos drag-and-drop (Plan 13-04) |
| @dnd-kit/sortable | ^8.0.0 | Step3Photos drag-and-drop (Plan 13-04) |
| @dnd-kit/utilities | ^3.2.2 | Step3Photos drag-and-drop (Plan 13-04) |
| browser-image-compression | ^2.0.2 | Client-side image compression before upload (Plan 13-04) |

## Test Stub Files Created

| File | SELL Requirement(s) | Todo Count |
|------|---------------------|------------|
| dashboard-kpis.test.ts | SELL-01 | 3 |
| listing-service.test.ts | SELL-02, SELL-18 | 6 |
| wizard-state.test.ts | SELL-03 | 4 |
| analytics-service.test.ts | SELL-04 | 4 |
| viewing-transitions.test.ts | SELL-05 | 5 |
| offer-card.test.tsx | SELL-06 | 5 |
| offer-state-machine.test.ts | SELL-07 | 5 |
| sale-progression.test.ts | SELL-08 | 5 |
| land-registry-parser.test.ts | SELL-09 | 4 |
| agent-search.test.ts | SELL-10 | 3 |
| agent-compare.test.tsx | SELL-11 | 3 |
| ai-description.test.ts | SELL-16 | 5 |
| photo-upload.test.ts | SELL-17 | 4 |

**Total: 13 files, 56 todo tests**

## Verification Output

```
pnpm test --run src/__tests__/seller/

 RUN  v4.0.18

 ↓ src/__tests__/seller/offer-card.test.tsx (5 tests | 5 skipped)
 ↓ src/__tests__/seller/sale-progression.test.ts (5 tests | 5 skipped)
 ↓ src/__tests__/seller/wizard-state.test.ts (4 tests | 4 skipped)
 ↓ src/__tests__/seller/photo-upload.test.ts (4 tests | 4 skipped)
 ↓ src/__tests__/seller/offer-state-machine.test.ts (5 tests | 5 skipped)
 ↓ src/__tests__/seller/land-registry-parser.test.ts (4 tests | 4 skipped)
 ↓ src/__tests__/seller/ai-description.test.ts (5 tests | 5 skipped)
 ↓ src/__tests__/seller/analytics-service.test.ts (4 tests | 4 skipped)
 ↓ src/__tests__/seller/viewing-transitions.test.ts (5 tests | 5 skipped)
 ↓ src/__tests__/seller/listing-service.test.ts (6 tests | 6 skipped)
 ↓ src/__tests__/seller/dashboard-kpis.test.ts (3 tests | 3 skipped)
 ↓ src/__tests__/seller/agent-search.test.ts (3 tests | 3 skipped)
 ↓ src/__tests__/seller/agent-compare.test.tsx (3 tests | 3 skipped)

 Test Files  13 skipped (13)
       Tests  56 todo (56)
    Start at  20:49:23
    Duration  4.48s
```

## Deviations from Plan

None - plan executed exactly as written. Note: @dnd-kit/modifiers was already present in package.json from a prior installation; only @dnd-kit/sortable version was downgraded from 10.0.0 to 8.0.0 as specified.

## Self-Check: PASSED

- All 13 test stub files exist in src/__tests__/seller/
- Dependencies confirmed in package.json: date-fns@^4.1.0, @dnd-kit/core@^6.3.1, @dnd-kit/sortable@^8.0.0, @dnd-kit/utilities@^3.2.2, browser-image-compression@^2.0.2
- Commits confirmed: 45da1cb (deps), 70c90a7 (stubs)
- pnpm test exits cleanly with 56 todo tests in 4.48s
