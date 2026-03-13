---
phase: 14-landlord-dashboard
plan: "03"
subsystem: landlord-dashboard-shell
tags: [landlord, dashboard, sidebar, portfolio, properties, compliance]
dependency_graph:
  requires: [14-02]
  provides: [landlord-layout, dashboard-home, portfolio-view, individual-property, add-property, create-listing]
  affects: [14-04, 14-05, 14-06, all-subsequent-landlord-plans]
tech_stack:
  added: []
  patterns:
    - Server Component with async data fetch + Suspense boundary
    - Client sidebar with usePathname active state detection
    - react-hook-form + zod multi-step form wizard
    - Parallel Promise.all data fetching in Server Components
key_files:
  created:
    - src/app/(protected)/dashboard/landlord/layout.tsx
    - src/app/(protected)/dashboard/landlord/page.tsx
    - src/app/(protected)/dashboard/landlord/properties/page.tsx
    - src/app/(protected)/dashboard/landlord/properties/[id]/page.tsx
    - src/app/(protected)/dashboard/landlord/properties/add/page.tsx
    - src/app/(protected)/dashboard/landlord/properties/[id]/listing/page.tsx
    - src/components/landlord/LandlordSidebar.tsx
    - src/components/landlord/KpiCard.tsx
    - src/components/landlord/ComplianceAlertBanner.tsx
  modified:
    - next.config.ts
decisions:
  - layout.tsx uses pl-64 offset on lg+ breakpoint to clear fixed sidebar (max-lg:pl-0 replaced with lg:pl-64)
  - LandlordSidebar uses base-ui Sheet component matching project's custom sheet.tsx
  - properties/[id]/page.tsx uses Tabs from project's base-ui implementation (not radix-ui)
  - Create listing page tries rental_listings table first, falls back to listings table (schema uncertain)
  - Add property inserts to listings table with listing_type=rental and is_rental=true
metrics:
  duration: 23
  completed_date: "2026-03-13"
  tasks: 2
  files: 10
---

# Phase 14 Plan 03: Landlord Dashboard Shell Summary

Landlord dashboard shell + 5 core pages wired to real Supabase data. `layout.tsx` wraps all 29 landlord routes with a fixed `LandlordSidebar` on desktop and Sheet drawer on mobile. Dashboard home (9.1) calls `getPortfolioKPIs` RPC and `getComplianceSummary` to show real data — no mock arrays.

## What Was Built

### Task 1: Sidebar Layout + Dashboard Home (9.1)

**LandlordSidebar.tsx** — `"use client"` component with 12 nav items and Lucide icons. Desktop: fixed `w-64` permanent aside. Mobile: Sheet drawer triggered by hamburger `Menu` button. Active state uses `border-l-4 border-[#1B4D3E] bg-[#1B4D3E]/10` from Stitch reference design.

**layout.tsx** — Server Component wrapping all landlord routes. `lg:pl-64` content offset clears the sidebar.

**page.tsx (Dashboard Home 9.1)** — Async Server Component with Suspense boundary. Calls `getPortfolioKPIs(supabase)` and `getComplianceSummary(supabase)` in parallel. Renders 4 `KpiCard`s and up to 3 `ComplianceAlertBanner`s for expired/expiring_soon certs.

**KpiCard.tsx** — Reusable card: icon top-right, large value, optional trend badge, `default`/`warning`/`danger` variants.

**ComplianceAlertBanner.tsx** — Amber (expiring) or red (expired) alert with `Fix Now` link to `/dashboard/landlord/compliance`.

**next.config.ts** — 3 permanent redirects from old Phase 6 paths to new Phase 14 routes.

### Task 2: Portfolio View, Individual Property, Add Property, Create Listing (9.2–9.5)

**properties/page.tsx (9.2)** — Server Component calling `getPortfolioProperties(supabase)`. Shows summary stats (total/occupied/vacant/occupancy) and passes data to `PortfolioGrid`. Empty state with CTA.

**properties/[id]/page.tsx (9.3)** — Server Component with `Promise.all` fetching: `getPropertyDetail`, `getTenancies`, `getFinancialEntries`, `getDocuments`, `getMaintenanceRequests`. 5-tab layout (Overview/Tenancy/Financials/Documents/Maintenance) using project's base-ui `Tabs` component.

**properties/add/page.tsx (9.4)** — Client Component form with react-hook-form + zod validation. Inserts to `listings` table with `listing_type='rental'`, `is_rental=true`. Redirects to new property on success.

**properties/[id]/listing/page.tsx (9.5)** — 3-step wizard: Step 1 (listing details with zod validation), Step 2 (photo placeholder), Step 3 (review + publish). Inserts to `rental_listings` table with `listings` table fallback.

## Deviations from Plan

### Auto-fixed Issues

None of the auto-fixes were needed. However, one plan deviation was made:

**1. [Rule 2 - Correctness] TenancyStatusBadge type cast**
- **Found during:** Task 2 (Individual Property page)
- **Issue:** `PropertyDetail.active_tenancy.status` is typed as `string` (from portfolio-service), but `TenancyStatusBadge` expects `TenancyStatus` union
- **Fix:** Added `as TenancyStatus` cast at usage site; safe because the value originates from the tenancies table which constrains the column to the same union
- **Files modified:** `src/app/(protected)/dashboard/landlord/properties/[id]/page.tsx`

**2. [Rule 3 - Blocking] Create Listing fallback table**
- **Found during:** Task 2 (Create Listing page)
- **Issue:** `rental_listings` table may not exist (schema uncertainty); `listings` table is the known canonical table
- **Fix:** Try insert into `rental_listings` first; on error, fall back to `listings` with extra columns
- **Files modified:** `src/app/(protected)/dashboard/landlord/properties/[id]/listing/page.tsx`

## Self-Check

### Files Created

- [x] `src/app/(protected)/dashboard/landlord/layout.tsx` — EXISTS
- [x] `src/app/(protected)/dashboard/landlord/page.tsx` — EXISTS
- [x] `src/app/(protected)/dashboard/landlord/properties/page.tsx` — EXISTS
- [x] `src/app/(protected)/dashboard/landlord/properties/[id]/page.tsx` — EXISTS
- [x] `src/app/(protected)/dashboard/landlord/properties/add/page.tsx` — EXISTS
- [x] `src/app/(protected)/dashboard/landlord/properties/[id]/listing/page.tsx` — EXISTS
- [x] `src/components/landlord/LandlordSidebar.tsx` — EXISTS
- [x] `src/components/landlord/KpiCard.tsx` — EXISTS
- [x] `src/components/landlord/ComplianceAlertBanner.tsx` — EXISTS
- [x] `next.config.ts` (modified) — EXISTS

### Commits

- `1c3421a` — feat(14-03): sidebar layout + dashboard home (9.1)
- `122e02a` — feat(14-03): portfolio view (9.2), individual property (9.3), add property (9.4), create listing (9.5)

### TypeScript

`npx tsc --noEmit` — PASSED (zero errors)

## Self-Check: PASSED
