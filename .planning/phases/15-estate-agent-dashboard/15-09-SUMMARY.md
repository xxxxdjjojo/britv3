---
phase: 15
plan: 09
subsystem: estate-agent-dashboard
tags: [kanban, dnd-kit, sale-progression, vendor-reports, market-appraisal, react-pdf]
dependency_graph:
  requires: [15-01, 15-03, 15-04]
  provides: [sale-progression-kanban, vendor-reports, market-appraisal]
  affects: [agent-dashboard-navigation]
tech_stack:
  added: ["@react-pdf/renderer (PDF generation, already installed)", "serverExternalPackages config for @react-pdf/renderer"]
  patterns: ["isolated PDF module pattern for ssr:false boundary", "optimistic kanban updates with server revert", "dynamic import isolation for ESM-only packages"]
key_files:
  created:
    - src/app/api/agent/sales/route.ts
    - src/app/(protected)/dashboard/agent/sales/page.tsx
    - src/components/dashboard/agent/sales/SaleProgressionKanban.tsx
    - src/app/(protected)/dashboard/agent/sales/reports/page.tsx
    - src/components/dashboard/agent/sales/VendorReportsPage.tsx
    - src/components/dashboard/agent/sales/VendorReportPDF.tsx
    - src/components/dashboard/agent/sales/PDFDownloadButton.tsx
    - src/app/(protected)/dashboard/agent/sales/appraisal/page.tsx
    - src/components/dashboard/agent/sales/MarketAppraisalTool.tsx
  modified:
    - next.config.ts (added serverExternalPackages for @react-pdf/renderer)
decisions:
  - "Isolated PDFDownloadButton.tsx as the sole module-level importer of @react-pdf/renderer to satisfy Turbopack SSR bundling requirements"
  - "Used useDraggable/useDroppable from @dnd-kit/core directly (not sortable) since columns are fixed and progression cards move between named columns"
  - "Adjacent-only validation done client-side for muting invalid drop targets, plus server-side enforcement via ALLOWED_TRANSITIONS in updateSaleStage (422 on invalid)"
  - "Market appraisal returns MarketAppraisalData from existing analytics service — comparable list is aggregated stats, not individual property rows"
metrics:
  duration: "~45 minutes"
  completed_date: "2026-03-15"
  tasks_completed: 2
  files_created: 9
  files_modified: 1
requirements_completed: [AGT-16, AGT-17, AGT-18]
---

# Phase 15 Plan 09: Sale Progression, Vendor Reports, and Market Appraisal Summary

**One-liner:** Kanban board with @dnd-kit adjacent-stage drag-and-drop, @react-pdf/renderer vendor reports with Turbopack SSR isolation, and postcode-driven market appraisal with a custom price range indicator.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Sale Progression Kanban + API route | ed1609c |
| 2 | Vendor Reports (PDF) + Market Appraisal | f918932 |

## Key Decisions

**1. PDFDownloadButton isolation pattern**
Turbopack's SSR bundler resolves `@react-pdf/renderer` even inside `dynamic(..., { ssr: false })` when the import appears in a `"use client"` file that is server-rendered during SSR. The fix: create `PDFDownloadButton.tsx` as the sole file with a module-level import of `@react-pdf/renderer`, then import *that file* via `dynamic(..., { ssr: false })` in `VendorReportsPage.tsx`. This creates a clean SSR boundary. Added `serverExternalPackages: ["@react-pdf/renderer"]` to next.config.ts as belt-and-suspenders.

**2. @dnd-kit/core useDraggable + useDroppable vs sortable**
Kanban columns are fixed named containers (not sortable lists), so `useDraggable`/`useDroppable` is the right primitive. `@dnd-kit/sortable` is for reordering within a single list.

**3. Adjacent-only validation layered**
- Client UI: columns >1 step away from active card are `opacity-40` during drag, and non-adjacent drops show a sonner error toast (no API call)
- Server: `updateSaleStage` enforces `ALLOWED_TRANSITIONS` and throws `Invalid stage transition`, caught as HTTP 422

**4. Market appraisal data shape**
`getMarketAppraisalData` returns aggregated stats (min, max, avg, median) not individual property rows. The UI renders a custom CSS price range bar (gradient + mid marker) and a Shadcn Table showing the key metrics. No Recharts needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Turbopack SSR bundling error for @react-pdf/renderer**
- **Found during:** Task 2 build
- **Issue:** `VendorReportsPage.tsx` used `dynamic(() => import("@react-pdf/renderer").then(...), { ssr: false })` but Turbopack still tried to resolve the ESM module during SSR compilation, causing "ModuleId not found" build failure
- **Fix:** Extracted all `@react-pdf/renderer` module-level imports into `PDFDownloadButton.tsx`; imported that via `dynamic(..., { ssr: false })`; added `serverExternalPackages` to next.config.ts
- **Files modified:** VendorReportsPage.tsx, next.config.ts, created PDFDownloadButton.tsx
- **Commits:** ed1609c (config), f918932 (component)

## Self-Check

- [x] `/dashboard/agent/sales` route built and rendered as dynamic (ƒ)
- [x] `/dashboard/agent/sales/reports` route built and rendered as dynamic (ƒ)
- [x] `/dashboard/agent/sales/appraisal` route built and rendered as dynamic (ƒ)
- [x] `/api/agent/sales` route built as dynamic API handler
- [x] `pnpm build` exits 0 with all 336 static pages generated
- [x] TypeScript check (`npx tsc --noEmit`) passes with 0 errors

## Self-Check: PASSED
