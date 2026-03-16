---
phase: 13
plan: 07
subsystem: seller-dashboard
tags: [viewings, seller, dashboard, api]
dependency-graph:
  requires: [13-00, 13-02]
  provides: [viewing-management-ui, viewing-api]
  affects: [seller-dashboard-nav]
tech-stack:
  added: []
  patterns: [supabase-client-service, api-route-patch, client-component-modal, date-grouping]
key-files:
  created:
    - src/services/seller/viewing-service.ts
    - src/app/api/seller/viewings/route.ts
    - src/app/api/seller/viewings/[id]/route.ts
    - src/components/seller/viewings/ViewingActionModal.tsx
    - src/components/seller/viewings/ViewingCard.tsx
    - src/app/(protected)/dashboard/seller/viewings/page.tsx
  modified: []
decisions:
  - Client-side page with fetch calls to API routes (not server component) to enable real-time refresh after actions
  - ViewingActionModal handles all three mutating actions (confirm/cancel/reschedule) in a single component with action-specific config
  - Date-grouping helper normalises to T12:00:00 to avoid timezone boundary edge case on date headers
metrics:
  duration: ~8 minutes
  completed: 2026-03-16
  tasks-completed: 2
  files-created: 6
  files-modified: 0
---

# Phase 13 Plan 07: Manage Viewings Summary

Viewing management page for sellers with confirm, reschedule, and cancel actions backed by a full CRUD API layer.

## What Was Built

**Service layer** (`viewing-service.ts`): Four focused functions — `getSellerViewings` (with upcoming/past filter using date + status filtering), `updateViewingStatus`, `rescheduleViewing`, and `addViewingFeedback`. All scoped to `seller_id` for security.

**API routes:**
- `GET /api/seller/viewings?filter=upcoming|past` — lists viewings with joined listing data
- `PATCH /api/seller/viewings/[id]` — dispatches confirm/cancel/reschedule/feedback actions; validates `new_datetime` presence for reschedule

**ViewingActionModal** — Single modal covering all three action types. Config-driven titles, descriptions, button labels, and styles. Reschedule shows datetime-local input with `min` set to now; cancel requires a reason; confirm takes optional notes.

**ViewingCard** — Displays listing thumbnail (fallback MapPin icon), address, buyer name, viewing type (in-person vs virtual with icons), date/time, and status badge. Action buttons (Confirm shown only for pending, Reschedule and Cancel for all non-terminal statuses). Buyer feedback rendered when present.

**ManageViewingsPage** — Upcoming/past tab toggle, `groupByDate` groups cards under date headings, loading skeletons (3 pulse cards), and empty state with Calendar icon.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `src/services/seller/viewing-service.ts` — exists
- [x] `src/app/api/seller/viewings/route.ts` — exists
- [x] `src/app/api/seller/viewings/[id]/route.ts` — exists
- [x] `src/components/seller/viewings/ViewingActionModal.tsx` — exists
- [x] `src/components/seller/viewings/ViewingCard.tsx` — exists
- [x] `src/app/(protected)/dashboard/seller/viewings/page.tsx` — exists
- [x] Commit 5dbd587 — verified

## Self-Check: PASSED
