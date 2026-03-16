---
phase: 13
plan: "01"
subsystem: seller-dashboard
tags: [database, types, migration, rls]
dependency_graph:
  requires: []
  provides: [seller_listings, seller_viewings, seller_offers, sale_progression_stages, agent_enquiries, agent_profiles, seller-types]
  affects: [13-02, 13-03, 13-04, 13-05, 13-06, 13-07, 13-08, 13-09, 13-10]
tech_stack:
  added: []
  patterns: [supabase-rls, updated-at-trigger, partial-unique-index]
key_files:
  created:
    - supabase/migrations/20260313_seller_dashboard.sql
    - britv3.0/src/types/seller.ts
  modified: []
decisions:
  - "Partial unique index on seller_offers(listing_id) WHERE status='accepted' enforces one accepted offer per listing at DB level"
  - "agent_profiles RLS created inline with table (before global ALTER TABLE pattern) to avoid ordering issues with policies referencing the table"
metrics:
  duration_minutes: 5
  completed_date: "2026-03-15"
  tasks_completed: 2
  files_created: 2
---

# Phase 13 Plan 01: DB Migration and TypeScript Types Summary

**One-liner:** 8-table Supabase migration for seller dashboard with full RLS, triggers, and 25 TypeScript types covering listings, viewings, offers, sale progression, and agent management.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Supabase migration | 68a44d9 | supabase/migrations/20260313_seller_dashboard.sql |
| 2 | TypeScript types | 68a44d9 | britv3.0/src/types/seller.ts |

## What Was Built

### Migration (20260313_seller_dashboard.sql)

8 tables created with `CREATE TABLE IF NOT EXISTS` (idempotent):

1. **seller_listings** — Core listing record with property details, photos (JSONB), pricing, status workflow (draft → active → under_offer → sold)
2. **listing_analytics_events** — Per-event tracking (view/save/enquiry/phone_click/email_click) with visitor fingerprinting
3. **listing_description_attempts** — Tracks AI description generation history per listing + tone
4. **seller_viewings** — Viewing appointments with in_person/virtual type and status lifecycle
5. **seller_offers** — Offer records with buyer details, chain status, counter-offer support, solicitor contact
6. **sale_progression_stages** — 8-stage conveyancing tracker with JSONB stage_dates/expected_dates and shareable token
7. **agent_enquiries** — Seller-to-agent contact requests linked to optional listing
8. **agent_profiles** — Agent profile with areas_covered GIN index, fee_percentage, ratings

**Indexes:** 13 total including partial unique index `idx_one_accepted_offer_per_listing` (listing_id WHERE status='accepted') and GIN index on agent_profiles.areas_covered.

**Triggers:** 4 `update_updated_at_column()` triggers on mutable tables.

**RLS:** All 8 tables have RLS enabled. Sellers own their data; analytics INSERT is open (visitor tracking); agent_profiles readable by all.

### TypeScript Types (src/types/seller.ts)

25 exported types covering:
- 14 union literal types (PropertyType, Tenure, ListingStatus, etc.)
- SellerListing, ListingWithStats, ListingWithStep
- ListingAnalyticsEvent, ListingAnalyticsSummary
- SellerViewing, SellerOffer (both with optional listing Pick join)
- SaleProgressionStage, SaleProgressionDocument
- AgentProfile, AgentEnquiry
- SellerDashboardKPIs, LandRegistryComparable

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `grep -c "CREATE TABLE IF NOT EXISTS"` → 8 (correct)
- `npx tsc --noEmit` → no errors in seller.ts (pre-existing errors in other files unrelated to this plan)

## Self-Check: PASSED

- `/Users/joanflerinbig/Documents/britv3.0/.worktrees/phase-13-seller-dashboard/supabase/migrations/20260313_seller_dashboard.sql` — EXISTS
- `/Users/joanflerinbig/Documents/britv3.0/.worktrees/phase-13-seller-dashboard/britv3.0/src/types/seller.ts` — EXISTS
- Commit `68a44d9` — EXISTS
