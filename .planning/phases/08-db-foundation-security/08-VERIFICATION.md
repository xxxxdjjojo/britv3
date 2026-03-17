---
phase: 08-db-foundation-security
verified: 2026-03-13T23:10:00Z
status: gaps_found
score: 8/9 must-haves verified
re_verification: false
gaps:
  - truth: "npm packages react-day-picker@9 and tus-js-client@4 are importable without error in the Vitest test suite"
    status: partial
    reason: "Packages are installed in node_modules and resolve correctly from Node.js, but the package-imports.test.ts tests for react-day-picker and tus-js-client time out at 5000ms in the happy-dom Vitest environment. nanoid and date-fns pass. The core truth (packages installable) is satisfied; the automated regression gate is broken."
    artifacts:
      - path: "src/__tests__/foundation/package-imports.test.ts"
        issue: "react-day-picker and tus-js-client dynamic import tests time out in happy-dom environment — likely ESM/browser-API incompatibility in the test runner, not a missing package"
    missing:
      - "Increase testTimeout for the react-day-picker and tus-js-client test cases (e.g. it('...', async () => {...}, 15000)) OR configure those two tests to run in a 'node' environment via a vitest.config override for the foundation test file"
human_verification:
  - test: "Supabase dashboard: confirm all 10 tables exist with RLS enabled"
    expected: "All 10 tables (viewings, viewing_slots, offers, offer_status_history, user_documents, ai_match_preferences, ai_match_results, moving_checklist_items, referral_codes, referral_conversions) appear under Database > Tables with the RLS shield icon showing 'enabled'"
    why_human: "Cannot connect to remote Supabase instance from CLI in this environment; migration was applied via Management API and SUMMARY confirms 10 tables + RLS verified"
  - test: "Supabase dashboard: confirm buyer-documents Storage bucket is private"
    expected: "Storage > buyer-documents shows Public = false; attempting to access a file URL without auth returns a 403 or signed-URL-only response"
    why_human: "Cannot test live Supabase Storage from CLI"
  - test: "Supabase dashboard: confirm 3 RPCs exist with SECURITY DEFINER"
    expected: "Database > Functions lists book_viewing_slot, cancel_viewing, reschedule_viewing all with security_type = DEFINER"
    why_human: "Cannot query remote Supabase function registry from CLI"
---

# Phase 8: DB Foundation & Security Verification Report

**Phase Goal:** Establish the database schema, RLS policies, and security controls that all Phase 09-15 dashboard features will build on — no feature code yet, just the secure data layer.
**Verified:** 2026-03-13T23:10:00Z
**Status:** gaps_found (1 partial gap — test environment timeout; core artifact fully present)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All 10 new tables exist in migration with RLS enabled | VERIFIED | migration line 43-190, each table followed immediately by `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`; database.types.ts lines 393, 432, 1202, 1252, 1290, 1991, 2012, 2657, 2764, 2800 |
| 2 | buyer-documents Storage bucket is private (public=false) | VERIFIED | migration lines 13-21: `INSERT INTO storage.buckets ... VALUES ('buyer-documents', 'buyer-documents', false, ...)` — public=false hardcoded |
| 3 | RLS policies enforce row ownership; cross-user SELECT uses listings.user_id | VERIFIED | migration lines 218-220, 229-231: `auth.uid() IN (SELECT user_id FROM public.listings WHERE id = listing_id)` — uses user_id not agent_id |
| 4 | user_documents SELECT scopes to buyer + offer-specific agent/solicitor (not all agents) | VERIFIED | migration lines 268-278: subquery on `offers.agent_id` and `offers.solicitor_id` — not a global agent join |
| 5 | book_viewing_slot RPC atomically locks a slot with FOR UPDATE | VERIFIED | migration lines 427-429: `SELECT * FROM public.viewing_slots WHERE id = p_slot_id FOR UPDATE` inside SECURITY DEFINER plpgsql function |
| 6 | TypeScript types in database.types.ts reflect all 10 new tables | VERIFIED | 4340-line generated file; all 10 table names verified as top-level keys under `Database["public"]["Tables"]` |
| 7 | homebuyer navigating to /dashboard/landlord is redirected to /dashboard/homebuyer | VERIFIED | layout.tsx line 52-54: `if (profile.active_role !== role) { redirect(\`/dashboard/${profile.active_role}\`) }`; role-guard test "redirects homebuyer from /dashboard/landlord to /dashboard/homebuyer" passes |
| 8 | layout.tsx uses getUser() not getSession(), and reads active_role from profiles — never auto-grants | VERIFIED | layout.tsx lines 30-31: `supabase.auth.getUser()` only; line 41-44: `.from("profiles").select("active_role")`; no `upsert`, no `user_roles` references |
| 9 | npm packages nanoid@5, date-fns@4, react-day-picker@9, tus-js-client@4 importable | PARTIAL | nanoid and date-fns: tests pass. react-day-picker and tus-js-client: installed in node_modules (verified), but test cases time out in happy-dom environment at 5000ms |

**Score:** 8/9 truths verified (1 partial — test environment issue, packages themselves are present and functional)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20260313100000_v3_1_buyer_dashboard_foundation.sql` | Single atomic migration: 10 tables, RLS, RPCs, indexes, storage bucket | VERIFIED | 538 lines, all 5 sections present; commit 47b683c |
| `src/types/database.types.ts` | Supabase-generated TypeScript types; exports `Database`; contains all 10 new tables | VERIFIED | 4340 lines; `export type Database = {` at line 9; all 10 table Row types confirmed |
| `src/types/database.ts` | Re-exports `Database` + 10 convenience type aliases | VERIFIED | Lines 30-44: `export type { Database }` + all 10 Row aliases (Viewing, ViewingSlot, Offer, OfferStatusHistory, UserDocument, AiMatchPreferences, AiMatchResult, MovingChecklistItem, ReferralCode, ReferralConversion) |
| `src/app/(protected)/dashboard/[role]/layout.tsx` | Role route guard using profiles.active_role; redirects on mismatch; no auto-grant | VERIFIED | 57 lines; `profile.active_role !== role` guard present; no upsert, no user_roles; commit ff60cb3 |
| `src/__tests__/foundation/package-imports.test.ts` | Smoke tests for 4 packages | PARTIAL | File exists and is substantive; 2/4 tests pass (nanoid, date-fns); 2/4 time out (react-day-picker, tus-js-client) in happy-dom |
| `src/__tests__/dashboard/role-guard.test.ts` | 3 tests for role route authorization | VERIFIED | File exists, 3 tests pass (redirects unauthenticated user, redirects homebuyer from landlord, allows homebuyer at homebuyer); commit 894399f |
| `src/__tests__/dashboard/auth-guard.test.ts` | 3 tests for defense-in-depth auth guard | VERIFIED | File exists, all 3 tests pass |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `migration` → `public.viewing_slots` | `book_viewing_slot` RPC | `SELECT FOR UPDATE` inside SECURITY DEFINER | WIRED | Migration line 429: `FOR UPDATE` inside plpgsql SECURITY DEFINER function |
| `viewings RLS policy` → `public.listings` | subquery joining listings.user_id to identify listing owner | `SELECT user_id FROM public.listings` | WIRED | Migration lines 218-221: pattern confirmed; uses `user_id` not `agent_id` |
| `user_documents RLS policy` → `public.offers` | subquery joining offers to identify instructed solicitor/agent | `SELECT.*FROM public.offers WHERE` | WIRED | Migration lines 273-276: subqueries on `offers.agent_id` and `offers.solicitor_id` with IS NOT NULL guard |
| `src/types/database.ts` → `supabase migration` | `export type { Database } from "./database.types"` | supabase gen types typescript | WIRED | database.ts line 30; database.types.ts line 9 exports Database |
| `layout.tsx` → `profiles.active_role` | `supabase.from('profiles').select('active_role').eq('id', user.id).single()` | active_role | WIRED | layout.tsx lines 40-44: exact pattern confirmed |
| `role-guard.test.ts` → `layout.tsx` | `vi.mock('@/lib/supabase/server')` mocking createClient | `vi.mock` | WIRED | role-guard.test.ts lines 13-31: mock confirmed; all 3 tests pass |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| FOUND-01 | 08-01-PLAN.md | DB migration creates 10 new tables with RLS policies | SATISFIED | Migration file exists with all 10 tables, RLS on each, confirmed by database.types.ts having all 10 table types |
| FOUND-02 | 08-02-PLAN.md | Role route authorization enforces active_role — buyers cannot navigate to /dashboard/landlord | SATISFIED | layout.tsx redirects on mismatch; role-guard tests 3/3 pass |
| FOUND-03 | 08-02-PLAN.md | All buyer dashboard API routes call supabase.auth.getUser() server-side (defense-in-depth) | SATISFIED | layout.tsx uses getUser(); no getSession(); auth-guard tests 3/3 pass |
| FOUND-04 | 08-02-PLAN.md | npm packages installed: react-day-picker@9, date-fns@4, tus-js-client@4, nanoid@5 | PARTIAL | All 4 in package.json at correct versions; all in node_modules; nanoid+date-fns tests pass; react-day-picker+tus-js-client tests time out (environment issue, packages present) |

No orphaned requirements: REQUIREMENTS.md maps exactly FOUND-01 through FOUND-04 to Phase 8, all accounted for in plan frontmatter.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/__tests__/dashboard/auth-guard.test.ts` | 47-52 | Third test ("uses getUser not getSession") is a documentation assertion — the `expect` always passes regardless of whether layout.tsx actually uses getUser or not | Warning | Provides no regression protection for the `getSession` anti-pattern; passes even if layout calls getSession |
| `src/types/database.ts` | 46-64 | `Tables` legacy type map does not include any of the 10 new tables (only profiles, user_roles, etc.) | Info | Low risk — not a regression gate, just the legacy stub; new code should use `Database["public"]["Tables"]` |

No blockers found. The auth-guard test weakness is a coverage gap, not a blocker — layout.tsx verifiably uses `getUser` (confirmed by direct file read and the role-guard mock tests which wire to the same function).

### Human Verification Required

#### 1. Confirm 10 tables in Supabase with RLS enabled

**Test:** Log into Supabase dashboard > Database > Tables. Verify all 10 tables (viewings, viewing_slots, offers, offer_status_history, user_documents, ai_match_preferences, ai_match_results, moving_checklist_items, referral_codes, referral_conversions) appear under the `public` schema with the RLS shield icon showing "RLS enabled."
**Expected:** All 10 tables present, RLS shield icon shown on each
**Why human:** Cannot connect to remote Supabase from local CLI without project credentials in this environment

#### 2. Confirm buyer-documents bucket is private

**Test:** Log into Supabase dashboard > Storage > Buckets. Click on `buyer-documents` and verify `Public bucket` is toggled off.
**Expected:** Public = false; no direct public URL access
**Why human:** Cannot query live Supabase Storage API from CLI

#### 3. Confirm 3 RPCs with SECURITY DEFINER

**Test:** Log into Supabase dashboard > Database > Functions. Verify `book_viewing_slot`, `cancel_viewing`, and `reschedule_viewing` appear with `security_type = DEFINER`.
**Expected:** 3 functions listed, all SECURITY DEFINER
**Why human:** Cannot query remote function registry from CLI

### Gaps Summary

One partial gap exists: the test suite for FOUND-04 (package imports) has two tests that time out in the happy-dom Vitest environment — `react-day-picker exports DayPicker component` and `tus-js-client exports Upload class`. The packages themselves are correctly installed (verified via `ls node_modules/` and direct Node.js require), and the package.json entries are correct (`react-day-picker@^9.14.0`, `tus-js-client@^4.3.1`). The issue is that dynamic `import()` of these packages in happy-dom exceeds the 5000ms default testTimeout, likely due to browser-API polyfill initialization. This is a test infrastructure deficiency that leaves FOUND-04 with only partial automated regression protection.

**Fix:** In `src/__tests__/foundation/package-imports.test.ts`, increase the timeout for these two test cases from the default 5000ms to 15000ms by passing a third argument: `it("react-day-picker exports DayPicker component", async () => {...}, 15000)`. Alternatively, configure the `foundation` test directory to use `environment: "node"` in a `vitest.config.mts` override.

The phase goal of establishing the secure data layer is substantively achieved. All 10 migration tables have correct RLS, the role bypass is eliminated, the TypeScript types are generated and committed, and the required packages are installed. The one gap is purely in the test coverage mechanism, not in the delivered data layer itself.

---

_Verified: 2026-03-13T23:10:00Z_
_Verifier: Claude (gsd-verifier)_
