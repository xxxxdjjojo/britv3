---
phase: 13
plan: "08"
subsystem: seller-dashboard
tags: [offers, seller, conveyancing, compare]
dependency_graph:
  requires: [seller.ts types, supabase server client, offer-service]
  provides: [GET /api/seller/offers, PATCH /api/seller/offers/[id], OffersReceivedPage]
  affects: [seller dashboard navigation, sale progression flow]
tech_stack:
  added: []
  patterns: [client-side fetch with useCallback, controlled modal state, role-gated API routes]
key_files:
  created:
    - src/services/seller/offer-service.ts
    - src/app/api/seller/offers/route.ts
    - src/app/api/seller/offers/[id]/route.ts
    - src/components/seller/offers/OfferCard.tsx
    - src/components/seller/offers/OfferActionModal.tsx
    - src/components/seller/offers/OfferCompareTable.tsx
    - src/app/(protected)/dashboard/seller/offers/page.tsx
  modified: []
decisions:
  - Counter amount stored in pence (multiply by 100 on write, divide on display) consistent with listing asking_price
  - Compare table limited to 3 offers to keep table scannable; falls back to all offers if fewer than 2 pending
  - Solicitor details are optional on accept — conveyancing details can be added later
metrics:
  duration: "~15 minutes"
  completed: "2026-03-16"
  tasks_completed: 2
  files_created: 7
---

# Phase 13 Plan 08: Offers Received Summary

Implemented the full Offers Received page for the seller dashboard — offer listing with accept/counter/reject actions, a side-by-side comparison table, and two API routes backed by a typed offer service.

## What Was Built

**offer-service.ts** — Two service functions: `getSellerOffers` fetches all offers for the authenticated seller (optionally filtered by listing), joined with listing address/price data. `respondToOffer` updates status + solicitor/counter fields atomically via Supabase.

**API routes** — `GET /api/seller/offers` for listing (with optional `listing_id` filter), `PATCH /api/seller/offers/[id]` mapping accept/counter/reject actions to `OfferStatus` values. Both guard with `getUser()` auth check.

**OfferCard** — Renders buyer avatar initial, verified badge, chain-free/in-chain indicator, buyer type, submission time, and a large offer amount with trend icon (TrendingUp/TrendingDown) and percentage vs asking price. Pending offers show Accept / Counter / Reject buttons.

**OfferActionModal** — Three distinct flows: accept collects optional solicitor name/email/phone; counter requires a pound amount and optional message; reject shows a confirmation warning. Submits to PATCH route, propagates success via `onSuccess` callback.

**OfferCompareTable** — Side-by-side table of up to 3 offers across 9 dimensions: amount, vs-asking %, buyer, buyer type, chain status, chain length, verified, submitted date, and status.

**OffersReceivedPage** — Client page with list/compare toggle, loading skeletons, empty state, and `loadOffers` callback refreshed after any modal action.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] src/services/seller/offer-service.ts — exists
- [x] src/app/api/seller/offers/route.ts — exists
- [x] src/app/api/seller/offers/[id]/route.ts — exists
- [x] src/components/seller/offers/OfferCard.tsx — exists
- [x] src/components/seller/offers/OfferActionModal.tsx — exists
- [x] src/components/seller/offers/OfferCompareTable.tsx — exists
- [x] src/app/(protected)/dashboard/seller/offers/page.tsx — exists
- [x] Commit f791da5 exists

## Self-Check: PASSED
