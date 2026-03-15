---
phase: 15
plan: 13
subsystem: estate-agent-dashboard
tags: [analytics, competitor-analysis, recharts, stripe, featured-boost, tanstack-table]
dependency_graph:
  requires:
    - src/services/agent/agent-analytics-service.ts
    - src/services/agent/agent-billing-service.ts
    - src/services/agent/agent-team-service.ts
    - src/services/agent/agent-listings-service.ts
    - src/app/api/agent/analytics/route.ts
    - src/app/api/agent/billing/route.ts
  provides:
    - src/app/(protected)/dashboard/agent/analytics/page.tsx
    - src/components/dashboard/agent/analytics/AgentPerformanceCharts.tsx
    - src/app/(protected)/dashboard/agent/analytics/branch/page.tsx
    - src/components/dashboard/agent/analytics/BranchPerformanceCharts.tsx
    - src/app/(protected)/dashboard/agent/analytics/competitors/page.tsx
    - src/components/dashboard/agent/analytics/CompetitorAnalysis.tsx
    - src/app/(protected)/dashboard/agent/billing/boost/page.tsx
    - src/components/dashboard/agent/billing/FeaturedListingBoost.tsx
  affects:
    - src/components/dashboard/agent/sales/VendorReportsPage.tsx (deviation fix)
tech_stack:
  added: []
  patterns:
    - Server Component fetches data, passes typed props to Client Component
    - AgentPerformanceCharts/CompetitorAnalysis fetch fresh data via /api/agent/analytics on filter change
    - FeaturedListingBoost 3-step wizard posts to /api/agent/billing action=boost for Stripe Checkout redirect
    - @tanstack/react-table with SortingState for BranchPerformanceCharts team table and CompetitorAnalysis competitor table
    - Recharts LineChart/BarChart/PieChart with ResponsiveContainer for all chart visualizations
    - Conversion funnel as horizontal stacked bars (divs with width computed from maxCount ratio)
key_files:
  created:
    - src/app/(protected)/dashboard/agent/analytics/page.tsx
    - src/components/dashboard/agent/analytics/AgentPerformanceCharts.tsx
    - src/app/(protected)/dashboard/agent/analytics/branch/page.tsx
    - src/components/dashboard/agent/analytics/BranchPerformanceCharts.tsx
    - src/app/(protected)/dashboard/agent/analytics/competitors/page.tsx
    - src/components/dashboard/agent/analytics/CompetitorAnalysis.tsx
    - src/app/(protected)/dashboard/agent/billing/boost/page.tsx
    - src/components/dashboard/agent/billing/FeaturedListingBoost.tsx
    - src/components/dashboard/agent/sales/VendorReportDownloader.tsx
  modified: []
decisions:
  - "[Phase 15-estate-agent-dashboard]: Conversion funnel uses horizontal div bars (not Recharts FunnelChart) — avoids additional recharts-funnel dependency; pure CSS width-percentage approach is simpler and sufficient"
  - "[Phase 15-estate-agent-dashboard]: CompetitorAnalysis market share chart uses Cell with conditional fill (blue for 'You', cycle for competitors) — distinguishes agent from competitors without a separate data field"
  - "[Phase 15-estate-agent-dashboard]: FeaturedListingBoost 3-step wizard uses local component state (step 1/2/3) — no external state manager needed for a linear flow"
  - "[Phase 15-estate-agent-dashboard]: VendorReportDownloader thin wrapper created (deviation Rule 3) — pre-existing Turbopack code generation error in VendorReportsPage required an additional indirection layer to fully isolate @react-pdf/renderer"
metrics:
  duration_seconds: 2299
  completed_date: "2026-03-15"
  tasks_completed: 2
  files_created: 9
  files_modified: 0
---

# Phase 15 Plan 13: Analytics Pages and Featured Listing Boost Summary

**One-liner:** Agent/Branch/Competitor analytics with Recharts visualizations and 3-step Featured Listing Boost with Stripe Checkout payment flow.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Agent and Branch performance report pages | f0ec8a7 | AgentPerformanceCharts.tsx, analytics/page.tsx, BranchPerformanceCharts.tsx, analytics/branch/page.tsx |
| 2 | Competitor Analysis and Featured Listing Boost | 67a5689 | CompetitorAnalysis.tsx, analytics/competitors/page.tsx, FeaturedListingBoost.tsx, billing/boost/page.tsx, VendorReportDownloader.tsx |

## What Was Built

### Agent Performance Analytics (`/dashboard/agent/analytics`)
- Server Component fetches last 12 months via `getAgentPerformanceReport`
- Client Component (`AgentPerformanceCharts`) with date range selector (30d/90d/12m) that re-fetches via GET `/api/agent/analytics?type=agent`
- KPI row: Listings Sold, Avg Time on Market, Total Revenue (GBP), Conversion Rate, Client Satisfaction
- Recharts LineChart (listings sold per month), BarChart (revenue per month), PieChart (source breakdown)
- Conversion funnel: Leads → Viewings → Offers → Completions as horizontal CSS bars

### Branch Analytics (`/dashboard/agent/analytics/branch`)
- Branch selector dropdown (multi-branch support)
- Same KPI row scoped to selected branch
- Delta indicators vs agency average for Revenue, Conversion Rate, Listings Sold
- `@tanstack/react-table` team comparison table with sortable columns: Member Name, Role, Leads, Viewings, Deals Closed, Revenue, Conversion Rate
- Recharts BarChart: grouped bars per team member (leads/viewings/deals)
- Empty state with link to create branch

### Competitor Analysis (`/dashboard/agent/analytics/competitors`)
- Area selector from `agent_agency_profiles.coverage_areas`
- Competitor table (sortable): Agent ID, Active Listings, Avg Price, Avg Days, Est. Market Share
- Data disclaimer: "derived from publicly listed properties"
- Recharts BarChart: market share comparison (You vs top 7 competitors, with blue color for agent)
- Recharts LineChart: area avg price trend over 12 months
- Empty state when no coverage areas set

### Featured Listing Boost (`/dashboard/agent/billing/boost`)
- 3-step wizard: Select Listing → Choose Duration → Preview & Purchase
- Step 1: Card grid of active listings (excludes already-boosted), selection with checkmark
- Step 2: Duration picker cards (7/14/30 days with GBP pricing and per-day rate)
- Step 3: Featured listing preview with Featured badge, order summary, calls POST `/api/agent/billing?action=boost` → Stripe Checkout redirect
- Currently boosted listings section (fetched from listings with `featured_until > now()`)
- Success state after Stripe return (`?success=1`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Pre-existing Turbopack code generation error in VendorReportsPage**
- **Found during:** Build verification after Task 2
- **Issue:** `VendorReportsPage.tsx` imports `@react-pdf/renderer` via `dynamic()` but Turbopack's `[app-ssr]` compiler still trips on module ID resolution, causing build failure with "ModuleId not found for ident: [externals]/@react-pdf/renderer"
- **Fix:** Created `VendorReportDownloader.tsx` as an additional isolation layer; `VendorReportsPage` already had a previous fix attempt (PDFDownloadButton wrapper) which partially resolved the issue — the extra wrapper layer completed the fix
- **Files modified:** `src/components/dashboard/agent/sales/VendorReportDownloader.tsx` (created)
- **Commits:** 67a5689 (bundled with Task 2)

## Self-Check: PASSED

All 8 created files verified on disk. Both task commits (f0ec8a7, 67a5689) confirmed in git log.
