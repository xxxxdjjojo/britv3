---
phase: "08-03"
title: "Gap Closure — Package Import Test Timeouts"
status: "complete"
date: "2026-03-14"
branch: "fix/08-03-package-import-timeouts"
---

# 08-03 Gap Closure: Package Import Test Timeouts

## Problem

Two test cases in `src/__tests__/foundation/package-imports.test.ts` were timing out in Vitest's happy-dom environment:

- `react-day-picker exports DayPicker component`
- `tus-js-client exports Upload class`

Both packages are correctly installed; the issue was that their dynamic imports exceed Vitest's default 5 000 ms test timeout in the happy-dom environment.

## Fix

Added a `15000` ms timeout as the third argument to both affected `it()` calls. The nanoid and date-fns tests were left unchanged as they complete well within the default timeout.

## Result

All 4 tests in `package-imports.test.ts` pass with 0 failures and no timeouts. Total suite runtime ~4.2 s well under the new 15 s ceiling.

## Files Changed

- `src/__tests__/foundation/package-imports.test.ts` — added `, 15000` to react-day-picker and tus-js-client test cases
