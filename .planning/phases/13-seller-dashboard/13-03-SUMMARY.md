---
phase: 13
plan: "03"
subsystem: seller-dashboard
tags: [seller, dashboard, components, ui, recharts]
dependency_graph:
  requires: [13-02]
  provides: [seller-dashboard-home, seller-listings-page, seller-ui-components]
  affects: [seller-dashboard]
tech_stack:
  added: []
  patterns: [server-component-auth-guard, recharts-area-chart, shadcn-dropdown-menu, url-driven-filter]
key_files:
  created:
    - src/app/(protected)/dashboard/seller/layout.tsx
    - src/app/(protected)/dashboard/seller/page.tsx
    - src/app/(protected)/dashboard/seller/listings/page.tsx
    - src/app/(protected)/dashboard/seller/enquiries/page.tsx
    - src/app/(protected)/dashboard/seller/analytics/page.tsx
    - src/components/seller/SellerSidebar.tsx
    - src/components/seller/KpiCard.tsx
    - src/components/seller/PerformanceChart.tsx
    - src/components/seller/StatusTabs.tsx
    - src/components/seller/ListingCard.tsx
  modified: []
decisions:
  - StatusTabs uses URL search params (router.push) for server-compatible status filtering
  - MiniBarChart is an inline sub-component inside ListingCard (not a standalone file)
  - PerformanceChart data prop typed against ListingAnalyticsSummary["daily_views"] for type safety
  - Stub pages (enquiries, analytics) ship with coming-soon UI rather than empty routes
metrics:
  duration: "~15 minutes"
  completed: "2026-03-16"
  tasks_completed: 2
  files_created: 10
---

# Phase 13 Plan 03: Dashboard Home + My Listings Summary

Seller dashboard core pages and shared UI components — SellerSidebar with active routing, KpiCard grid with trend badges, Recharts AreaChart for 30-day views, ListingCard with mini bar chart, and URL-driven StatusTabs filter.

## What Was Built

### Task 1: Layout, Sidebar, and Shared UI Components

- **`SellerSidebar`** — Fixed 256px sidebar (`bg-[#1B4D3E]`), active-link detection via `usePathname()`, logo header, user avatar/name footer with sign-out link
- **`KpiCard`** — Metric card with 3xl extrabold value, LucideIcon badge, and optional trend indicator (TrendingUp/TrendingDown + emerald/red badge)
- **`PerformanceChart`** — Recharts `AreaChart` with gradient fill (`#1B4D3E`), formatted en-GB date labels, empty state fallback
- **`StatusTabs`** — URL-driven tab filter using `useSearchParams` + `router.push`, count badges per status
- **`layout.tsx`** — Server component auth guard, profiles query for sidebar name/avatar, `ml-64` main content offset

### Task 2: Dashboard Home, My Listings, ListingCard, Stub Pages

- **`/dashboard/seller`** — KPI grid (4 cards), PerformanceChart section, Upcoming Viewings list (next 5 confirmed/pending)
- **`/dashboard/seller/listings`** — StatusTabs filter, ListingCard list, empty state with CTA, "Create New Listing" button
- **`ListingCard`** — Horizontal card with thumbnail (with status badge overlay), address/price/bedroom details, views/saves/enquiries stats, MiniBarChart (7-day), Edit link and DropdownMenu (Analytics, Archive)
- **Stub pages** — `/enquiries` and `/analytics` with coming-soon cards

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `src/app/(protected)/dashboard/seller/layout.tsx` — exists
- [x] `src/app/(protected)/dashboard/seller/page.tsx` — exists
- [x] `src/app/(protected)/dashboard/seller/listings/page.tsx` — exists
- [x] `src/components/seller/SellerSidebar.tsx` — exists
- [x] `src/components/seller/KpiCard.tsx` — exists
- [x] `src/components/seller/PerformanceChart.tsx` — exists
- [x] `src/components/seller/StatusTabs.tsx` — exists
- [x] `src/components/seller/ListingCard.tsx` — exists
- [x] Commit `626b061` exists on `feature/phase-13-seller-dashboard`
- [x] `tsc --noEmit` returned no errors

## Self-Check: PASSED
