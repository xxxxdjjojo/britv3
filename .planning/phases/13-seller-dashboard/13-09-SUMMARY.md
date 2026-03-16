---
phase: 13
plan: 09
title: Sale Progression Tracker
status: complete
branch: feature/phase-13-seller-dashboard
commit: ddc5ed8
date: 2026-03-16
---

# Plan 13-09: Sale Progression Tracker — Summary

## What Was Built

Six files implementing the Sale Progression Tracker feature for the seller dashboard.

### Files Created

| File | Purpose |
|------|---------|
| `src/services/seller/sale-progression-service.ts` | Service layer: fetch by offer/id, advance stage, create progression |
| `src/app/api/seller/sale-progress/[id]/route.ts` | REST API: GET (fetch) + PATCH (advance_stage, update_contacts, update_documents) |
| `src/components/seller/sale-progress/SaleProgressionStepper.tsx` | 8-node horizontal stepper with progress track, date badges, current-stage detail card |
| `src/components/seller/sale-progress/SaleDocumentsList.tsx` | Documents checklist with status icons, defaults to 8 standard UK conveyancing docs |
| `src/components/seller/sale-progress/SaleContactsSidebar.tsx` | Key contacts panel: seller solicitor, buyer solicitor, mortgage broker |
| `src/app/(protected)/dashboard/seller/sale-progress/[id]/page.tsx` | Full page: header breadcrumb + all 3 components in responsive grid |

## Architecture Notes

- **8 stages**: Offer Accepted → Solicitors Instructed → Searches Ordered → Survey Completed → Mortgage Offer → Contracts Signed → Exchange → Completion
- **Service pattern**: `getSaleProgression(offerId)` and `getSaleProgressionById(progressionId)` both return `SaleProgressionStage | null`
- **IIFE avoided**: The inline IIFE for the expected-date badge was extracted to a `ExpectedDateBadge` helper component to keep JSX clean and TS-safe
- **Listing join cast**: Supabase join on `listing_id` cast via `as unknown as ListingShape` to avoid TS inference issues with nested selects
- **Default documents**: `SaleDocumentsList` falls back to 8 standard UK conveyancing docs when `progression.documents` is empty

## Build & Lint

- `pnpm build`: Passed — both routes (`/api/seller/sale-progress/[id]` and `/dashboard/seller/sale-progress/[id]`) appear in the route table as dynamic (ƒ)
- `pnpm lint`: Passed — no errors or warnings
