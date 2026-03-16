---
phase: 13
plan: "06"
subsystem: seller-dashboard
tags: [analytics, recharts, area-chart, pie-chart, api-route, rsc]
dependency_graph:
  requires: [analytics-service, listing-service, KpiCard, seller types]
  provides: [listing analytics page, analytics API route, ListingAnalyticsCharts component]
  affects: [seller dashboard listings section]
tech_stack:
  added: []
  patterns: [RSC page with client chart island, dynamic period filter via fetch]
key_files:
  created:
    - britv3.0/src/app/api/seller/listings/[id]/analytics/route.ts
    - britv3.0/src/app/(protected)/dashboard/seller/listings/[id]/analytics/page.tsx
    - britv3.0/src/components/seller/analytics/ListingAnalyticsCharts.tsx
  modified: []
decisions:
  - Recharts AreaChart + PieChart (donut) for views-over-time and event-breakdown respectively
  - Period switcher (7/30/90 days) triggers client-side fetch to analytics API route
  - Empty-state fallbacks in both charts when no data exists for selected period
metrics:
  duration: "~10 min"
  completed: "2026-03-16"
  tasks_completed: 2
  files_created: 3
  files_modified: 0
---

# Phase 13 Plan 06: Listing Analytics Page Summary

**One-liner:** Per-listing analytics page with Recharts area + donut charts, dynamic 7/30/90-day period filter, and KPI cards for views/saves/enquiries/CTR.

## What Was Built

**Task 1: Analytics API route + RSC page**

- `GET /api/seller/listings/[id]/analytics?days=N` — validates auth, ownership, and `days` param (whitelist 7/30/90), delegates to `getListingAnalyticsSummary`, returns JSON.
- RSC page at `/dashboard/seller/listings/[id]/analytics` — parallel-fetches listing (for address breadcrumb) and 30-day summary; renders 4 KPI cards (Total Views, Total Saves, Enquiries, CTR) using the existing `KpiCard` component; mounts `ListingAnalyticsCharts` client island.

**Task 2: Client charts component**

- `ListingAnalyticsCharts` holds period state (7/30/90), refetches via API on change, shows spinner during load, dims charts with opacity-50 while loading.
- Area chart: `daily_views` data rendered with branded green (`#1B4D3E`) stroke and gradient fill.
- Donut pie chart: event breakdown (views/saves/enquiries/phone clicks/email clicks) with 5-color palette; zero-value slices excluded.
- Empty-state divs shown when no data exists for either chart.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `britv3.0/src/app/api/seller/listings/[id]/analytics/route.ts` — created
- [x] `britv3.0/src/app/(protected)/dashboard/seller/listings/[id]/analytics/page.tsx` — created
- [x] `britv3.0/src/components/seller/analytics/ListingAnalyticsCharts.tsx` — created
- [x] Commit `92e6fbc` present in git log
- [x] TypeScript check: no errors
- [x] ESLint: no errors
