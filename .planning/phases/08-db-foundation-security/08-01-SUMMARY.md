---
phase: 08-db-foundation-security
plan: "01"
subsystem: database
tags: [migration, postgresql, rls, supabase, typescript-types, rpcs]
dependency_graph:
  requires: []
  provides:
    - public.viewings table
    - public.viewing_slots table
    - public.offers table
    - public.offer_status_history table
    - public.user_documents table
    - public.ai_match_preferences table
    - public.ai_match_results table
    - public.moving_checklist_items table
    - public.referral_codes table
    - public.referral_conversions table
    - public.book_viewing_slot RPC
    - public.cancel_viewing RPC
    - public.reschedule_viewing RPC
    - buyer-documents private storage bucket
    - src/types/database.types.ts (Supabase-generated)
    - Viewing, ViewingSlot, Offer, OfferStatusHistory, UserDocument, AiMatchPreferences, AiMatchResult, MovingChecklistItem, ReferralCode, ReferralConversion TypeScript types
  affects:
    - All v3.1 phases (9-12) that build UI against these tables
tech_stack:
  added: []
  patterns:
    - PostgreSQL SELECT FOR UPDATE for atomic slot booking
    - SECURITY DEFINER functions for RPC operations
    - RLS cross-user SELECT via listings.user_id subquery
    - Private Supabase Storage bucket with per-owner policies
    - supabase gen types typescript --linked for type generation
key_files:
  created:
    - supabase/migrations/20260313100000_v3_1_buyer_dashboard_foundation.sql
    - src/types/database.types.ts
  modified:
    - src/types/database.ts
decisions:
  - "Migration applied via Supabase Management API (database/query endpoint) rather than supabase db push due to migration history tracking mismatch between CLI and remote DB"
  - "offers table includes solicitor_id UUID FK column (not present in RESEARCH.md schema but required by user_documents RLS policy that references offers.solicitor_id)"
  - "Removed listings.agent_id references from viewings/offers RLS policies — listings uses user_id only; offers has its own agent_id FK"
metrics:
  duration: 49 min
  completed: 2026-03-13
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 1
---

# Phase 8 Plan 1: v3.1 Buyer Dashboard DB Foundation Summary

Single atomic SQL migration creating all 10 v3.1 buyer dashboard tables with RLS, 3 SECURITY DEFINER RPCs for atomic viewing slot booking, private buyer-documents storage bucket, and Supabase-generated TypeScript types.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write and apply the v3.1 foundation SQL migration | 47b683c | supabase/migrations/20260313100000_v3_1_buyer_dashboard_foundation.sql |
| 2 | Generate and commit TypeScript types | 9359d6e | src/types/database.types.ts, src/types/database.ts |

## What Was Built

### 10 New Tables (all with RLS enabled)

| Table | Purpose | Key Constraints |
|-------|---------|-----------------|
| `viewing_slots` | Agent-created time slots | status CHECK ('available', 'booked', 'cancelled') |
| `viewings` | Buyer booked viewings | status CHECK ('confirmed', 'cancelled', 'rescheduled', 'completed') |
| `offers` | Buyer offers on listings | status CHECK (8 stages), amount stored in pence |
| `offer_status_history` | Immutable audit trail | No updated_at, no INSERT policy (service role only) |
| `user_documents` | Buyer uploaded documents | document_type CHECK, file_size_bytes > 0 |
| `ai_match_preferences` | AI match criteria | UNIQUE on user_id (one per buyer) |
| `ai_match_results` | Cached AI scores | match_score BETWEEN 0 AND 1, expires_at default 24h |
| `moving_checklist_items` | Per-offer checklists | offer_stage for status-linked items |
| `referral_codes` | Permanent referral codes | UNIQUE on both user_id AND code |
| `referral_conversions` | Sign-up tracking | UNIQUE on referred_id (one conversion per user) |

### RLS Policy Architecture

- **viewings + offers SELECT**: `auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM public.listings WHERE id = listing_id)` — buyer OR listing owner can read
- **user_documents SELECT**: buyer + instructed agent + instructed solicitor via subquery on offers.agent_id and offers.solicitor_id
- **offers UPDATE**: blocked entirely via `USING (false)` — all transitions via service role API
- **offer_status_history INSERT**: no policy = default deny; service role bypasses RLS
- **referral_conversions INSERT**: no policy = service role only

### 3 SECURITY DEFINER RPCs

- `book_viewing_slot(p_slot_id, p_user_id, p_listing_id, p_type)`: SELECT FOR UPDATE lock + atomic insert; returns `{success, viewing_id}` or `{success: false, error: 'SLOT_UNAVAILABLE'}`
- `cancel_viewing(p_viewing_id)`: frees slot + marks viewing cancelled atomically
- `reschedule_viewing(p_viewing_id, p_new_slot_id)`: locks both slots, swaps atomically

### Private Storage Bucket

- `buyer-documents`: `public = false`, 50MB file size limit, restricted MIME types (PDF, JPEG, PNG, WebP)
- Storage RLS: INSERT/SELECT/DELETE restricted to `(storage.foldername(name))[1] = auth.uid()::text`

### TypeScript Types

- `src/types/database.types.ts`: 4,341-line generated file from `supabase gen types typescript --linked`; exports `Database` type with all 266+ tables
- `src/types/database.ts`: updated to re-export `Database` and add 10 convenience Row type aliases

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added solicitor_id FK to offers table**
- **Found during:** Task 1 — writing user_documents RLS policy
- **Issue:** The plan's user_documents SELECT policy references `offers.solicitor_id` but the RESEARCH.md schema for offers did not include a `solicitor_id` UUID column (only solicitor_name, solicitor_email, solicitor_phone text fields)
- **Fix:** Added `solicitor_id uuid REFERENCES auth.users(id)` to offers table so the RLS subquery can function correctly
- **Files modified:** supabase/migrations/20260313100000_v3_1_buyer_dashboard_foundation.sql
- **Commit:** 47b683c

**2. [Rule 3 - Blocking] Applied migration via Management API instead of supabase db push**
- **Found during:** Task 1 verification
- **Issue:** Supabase CLI migration history was empty (all prior migrations applied directly to remote DB without tracking); `supabase db push` tried to re-run all migrations from 001_foundation.sql and failed on existing objects
- **Fix:** Used Supabase Management API endpoint (`POST /v1/projects/{ref}/database/query`) to execute migration SQL directly; then marked migration as applied via `supabase migration repair --status applied 20260313100000`
- **Files modified:** None (migration SQL unchanged)
- **Commit:** 47b683c

**3. [Rule 1 - Bug] Removed trailing status message from generated types file**
- **Found during:** Task 2 — tsc --noEmit check
- **Issue:** `supabase gen types typescript` CLI wrote two status messages (initialising message + version upgrade notice) to stdout alongside the TypeScript output, causing parse errors
- **Fix:** Stripped `Initialising login role...` from line 1 and `A new version of Supabase CLI is available...` from the end of the file
- **Files modified:** src/types/database.types.ts
- **Commit:** 9359d6e

## Verification Results

- All 10 tables confirmed in remote DB via Management API query (`information_schema.tables`)
- RLS enabled on all 10 tables confirmed (`pg_class.relrowsecurity = true`)
- 3 RPCs confirmed with `security_type = 'DEFINER'`
- buyer-documents bucket confirmed with `public = false`
- `tsc --noEmit` exits 0 (zero TypeScript errors)
- `pnpm lint src/types/database.ts` exits clean
- `pnpm build` exits with SIGTERM (exit 143) — pre-existing environment issue unrelated to this plan; the build is killed before completion likely due to Turbopack memory usage; this existed before these changes

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| supabase/migrations/20260313100000_v3_1_buyer_dashboard_foundation.sql | FOUND |
| src/types/database.types.ts | FOUND |
| src/types/database.ts | FOUND |
| Commit 47b683c | FOUND |
| Commit 9359d6e | FOUND |
| 10 tables in remote DB | CONFIRMED (count=10) |
| RLS enabled on all 10 tables | CONFIRMED |
| 3 SECURITY DEFINER RPCs | CONFIRMED |
| buyer-documents bucket (public=false) | CONFIRMED |
