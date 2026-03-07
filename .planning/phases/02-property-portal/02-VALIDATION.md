---
phase: 2
slug: property-portal
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + React Testing Library (from Phase 1 setup) |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `pnpm test --run` |
| **Full suite command** | `pnpm test --run --coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test --run`
- **After every plan wave:** Run `pnpm test --run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | LIST-08 | integration | `pnpm test src/__tests__/search/geospatial.test.ts` | No -- Wave 0 | pending |
| 02-01-02 | 01 | 1 | SRCH-11 | unit | `pnpm test src/__tests__/search/pagination.test.ts` | No -- Wave 0 | pending |
| 02-02-01 | 02 | 1 | SRCH-01 | integration | `pnpm test src/__tests__/search/location-search.test.ts` | No -- Wave 0 | pending |
| 02-02-02 | 02 | 1 | SRCH-02 | unit | `pnpm test src/__tests__/search/filters.test.ts` | No -- Wave 0 | pending |
| 02-02-03 | 02 | 1 | SRCH-03 | unit | `pnpm test src/__tests__/search/advanced-filters.test.ts` | No -- Wave 0 | pending |
| 02-02-04 | 02 | 1 | SRCH-10 | unit | `pnpm test src/__tests__/search/sorting.test.ts` | No -- Wave 0 | pending |
| 02-02-05 | 02 | 1 | SRCH-12 | unit | `pnpm test src/__tests__/search/geocode.test.ts` | No -- Wave 0 | pending |
| 02-03-01 | 03 | 2 | SRCH-04 | unit | `pnpm test src/__tests__/map/property-map.test.ts` | No -- Wave 0 | pending |
| 02-03-02 | 03 | 2 | SRCH-05 | unit | `pnpm test src/__tests__/map/clustering.test.ts` | No -- Wave 0 | pending |
| 02-03-03 | 03 | 2 | SRCH-06 | integration | `pnpm test src/__tests__/map/polygon-search.test.ts` | No -- Wave 0 | pending |
| 02-04-01 | 04 | 2 | LIST-01 | integration | `pnpm test src/__tests__/listings/create.test.ts` | No -- Wave 0 | pending |
| 02-04-02 | 04 | 2 | LIST-02 | unit | `pnpm test src/__tests__/listings/image-upload.test.ts` | No -- Wave 0 | pending |
| 02-04-03 | 04 | 2 | LIST-03 | unit | `pnpm test src/__tests__/listings/document-upload.test.ts` | No -- Wave 0 | pending |
| 02-04-04 | 04 | 2 | LIST-04 | unit | `pnpm test src/__tests__/listings/pricing.test.ts` | No -- Wave 0 | pending |
| 02-04-05 | 04 | 2 | LIST-05 | integration | `pnpm test src/__tests__/listings/update.test.ts` | No -- Wave 0 | pending |
| 02-04-06 | 04 | 2 | LIST-06 | unit | `pnpm test src/__tests__/listings/analytics.test.ts` | No -- Wave 0 | pending |
| 02-04-07 | 04 | 2 | LIST-07 | unit | `pnpm test src/__tests__/listings/price-history.test.ts` | No -- Wave 0 | pending |
| 02-05-01 | 05 | 3 | SRCH-07 | unit | `pnpm test src/__tests__/saved/saved-properties.test.ts` | No -- Wave 0 | pending |
| 02-05-02 | 05 | 3 | SRCH-08 | unit | `pnpm test src/__tests__/saved/saved-searches.test.ts` | No -- Wave 0 | pending |
| 02-05-03 | 05 | 3 | SRCH-09 | integration | `pnpm test src/__tests__/alerts/search-alerts.test.ts` | No -- Wave 0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/mocks/supabase-storage.ts` -- Mock for Supabase Storage operations
- [ ] `src/__tests__/mocks/maplibre.ts` -- Mock for MapLibre GL JS (WebGL not available in test env)
- [ ] `src/__tests__/mocks/postcodes-io.ts` -- Mock for postcodes.io API responses
- [ ] `src/__tests__/fixtures/search-results.ts` -- Sample search result data
- [ ] `src/__tests__/fixtures/listings.ts` -- Sample listing data for tests

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Map renders with property pins and clusters | SRCH-04, SRCH-05 | WebGL rendering not testable in JSDOM | Open /search, verify pins render, zoom out to see clusters |
| Polygon draw triggers spatial search | SRCH-06 | Canvas/WebGL interaction not testable in JSDOM | Open map, use draw tool, draw polygon, verify results filter |
| Image compression before upload | LIST-02 | Browser File API + Web Worker required | Upload 5MB+ image, verify network shows <1MB payload |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
