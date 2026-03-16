# MEGA PLAN REVIEW — Buyer/Renter Dashboard (7.1–7.22)

**Date:** 2026-03-15
**Mode:** HOLD SCOPE
**Scope:** 22 pages locked. Build them correctly, no shortcuts, no scope creep.

---

## PRE-REVIEW SYSTEM AUDIT — Implementation Status

| Page | Status | Notes |
|------|--------|-------|
| 7.1 Dashboard Home | ✅ Built | `HomebuyerDashboard.tsx` + `RenterDashboard.tsx` with Redis-cached aggregation |
| 7.2 Saved Properties | ✅ Built + wired | `saved/page.tsx` → `saved-properties-service.ts` → Supabase |
| 7.3 Saved Searches | ✅ Built + wired | `searches/page.tsx` → `saved-searches-service.ts` → Supabase |
| 7.4 Notification Settings | ⚠️ Partial | Alert prefs exist in saved searches; no dedicated notifications page |
| 7.5 Viewing Schedule | ⚠️ Mock data | `viewings/page.tsx` — DB schema + RPCs exist, UI not wired |
| 7.6 Viewing — Book | ❌ Not built | `book_viewing_slot()` RPC exists, no booking form/flow |
| 7.7 Viewing — Reschedule/Cancel | ❌ Not built | RPCs exist, no UI |
| 7.8 Offers Sent | ⚠️ Mock data | `offers/page.tsx` — DB schema exists, not wired + wrong perspective |
| 7.9 Offer — Submit | ❌ Not built | `offers` table + `offer_status_history` exist, no form |
| 7.10 Offer — Status/Tracking | ⚠️ Mock data | State machine designed, no wiring |
| 7.11 Messages — Inbox | ❌ Not built | `conversations` + `messages` tables exist; no inbox page |
| 7.12 Messages — Thread | ❌ Not built | `messages` table + `conversation_read_status` exist; no thread UI |
| 7.13 Documents — Uploads | ⚠️ Mock data | `user_documents` table + `buyer-documents` storage bucket exist |
| 7.14 Moving Checklist | ❌ Not built | `moving_checklist_items` table exists; no UI |
| 7.15 AI Match Preferences | ❌ Not built | `ai_match_preferences` table + schema exist; no form |
| 7.16 AI Match Results | ❌ Not built | `ai_match_results` (24hr cache) table exists; no results UI |
| 7.17 Affordability Calculator | ❌ Not built | No table needed, but no component |
| 7.18 Mortgage Comparison Tool | ❌ Not built | Hardcoded illustrative rates (decided) |
| 7.19 Browse Mortgage Brokers | ❌ Not built | Service provider browsing not scaffolded |
| 7.20 Browse Conveyancers | ❌ Not built | Same |
| 7.21 Browse Surveyors | ❌ Not built | Same |
| 7.22 Referral Tracker | ❌ Not built | `referral_codes` + `referral_conversions` tables exist; no UI |

**Summary: 3 fully wired, 4 with mock data (one with wrong perspective), 15 not built.**

---

## Decisions Locked (from review session)

1. **Viewing address strategy:** JOIN at query time (`viewings → viewing_slots → listings`). No denormalization.
2. **Build strategy:** Wave-based. Each wave is independently shippable.
3. **Mortgage comparison rates:** Hardcoded illustrative rates from major UK lenders with "rates are indicative" disclaimer. Live API is Phase 2.
4. **Wave 3 split:** Wave 3 is split into 3a (calculators + service directory + alerts) and 3b (AI match). AI match has external Anthropic API risk that should not block 5 other pages.
5. **Currency utility:** `src/lib/currency.ts` with `penceToGBP(n)` / `GBPToPence(n)` helpers. All offer service read/write boundaries call these. JSDoc on `Offer` type points to the utility.
6. **Test infrastructure:** Vitest + pgTAP installed as the first task of Wave 1, before any service code is written. The test matrix in Section 6 is not aspirational — it ships alongside each wave.
7. **Service directory filtering:** 7.19–7.21 query `service_providers` filtered by user postcode, limited to 20 results. Category filter (broker / conveyancer / surveyor) passed as query param. No unbounded list queries.

---

## Section 1: Architecture

### System Architecture

```
Browser
  │
  ├── /dashboard/[role]/             ← DashboardShell + role router
  ├── /dashboard/[role]/saved/       ← ✅ Wired to Supabase
  ├── /dashboard/[role]/searches/    ← ✅ Wired to Supabase
  ├── /dashboard/[role]/viewings/    ← ⚠️  MOCK DATA ONLY
  ├── /dashboard/[role]/offers/      ← ⚠️  MOCK DATA + WRONG PERSPECTIVE
  ├── /dashboard/[role]/documents/   ← ⚠️  MOCK DATA ONLY
  └── /dashboard/[role]/[MISSING 15 pages]
         │
         ▼
  API Routes (/api/*)
  ├── /api/dashboard          ← ✅ GET (Redis-cached aggregation)
  ├── /api/saved/properties   ← ✅ GET / POST / DELETE
  └── [MISSING: /api/viewings, /api/offers, /api/documents,
       /api/messages, /api/ai-match, /api/moving-checklist,
       /api/referrals]
         │
         ▼
  Services (server-side)
  ├── dashboard-service.ts        ← ✅ Redis + Supabase
  ├── saved-properties-service.ts ← ✅
  └── saved-searches-service.ts   ← ✅
         │
         ▼
  Supabase PostgreSQL (10 tables, RLS, RPCs)
  └── Redis (Upstash) — 5-min TTL dashboard cache
```

### New services needed (all DB infrastructure already exists)

```
viewings-service.ts         → viewings + viewing_slots + listings (JOIN)
offers-service.ts           → offers + offer_status_history
documents-service.ts        → user_documents table + buyer-documents storage bucket
messages-service.ts         → conversations + messages tables
ai-match-service.ts         → ai_match_preferences + ai_match_results + Anthropic SDK
moving-checklist-service.ts → moving_checklist_items table
referral-service.ts         → referral_codes + referral_conversions tables
financial/calculators.ts    → pure computation, no DB
```

### CRITICAL BUG #1 — Schema Mismatch

**File:** `src/services/dashboard/dashboard-service.ts` line 108
**Problem:** `buildHomebuyerDashboard` queries `viewings` for `property_address` column. That column does not exist on the `viewings` table (only `listing_id` exists per migration). Result: `upcoming_viewings` always returns `[]`. Stat card always shows `0 Upcoming Viewings`.
**Fix:** JOIN `viewings → viewing_slots → listings` to get address, or use Supabase select with foreign key expand.

### CRITICAL BUG #2 — Wrong Perspective on Offers Page

**File:** `src/app/(protected)/dashboard/[role]/offers/page.tsx`
**Problem:** Page shows a *Seller's* offer management view (columns: "Buyer", "Asking Price", "Accept/Counter" buttons). This lives in the buyer dashboard. A buyer needs to see *their own submitted offers* and track their status through the state machine: `submitted → solicitors_instructed → searches → survey → mortgage_approved → exchange → completion`.
**Fix:** Complete rewrite of page logic. UI shell (Card, Table, Badge) can stay.

### WARNING — Role Param Not Validated

**File:** `src/app/(protected)/dashboard/[role]/page.tsx` line 113
`const typedRole = role as UserRole;` — cast without validation. User can navigate to `/dashboard/hacker` and hit the `default: return []` branch silently.
**Fix:** Validate `role` against the `UserRole` union and redirect to `/dashboard/homebuyer` (or the user's actual role) if invalid.

---

## Section 2: Error & Rescue Map

```
METHOD/CODEPATH                    | WHAT CAN GO WRONG              | EXCEPTION CLASS
-----------------------------------|--------------------------------|-----------------
getDashboardData()                 | Redis down                     | Upstash connection error
                                   | Supabase timeout               | PostgrestError
                                   | Role not recognized            | silent default
buildHomebuyerDashboard()          | property_address col missing   | ← returns [] silently (BUG)
book_viewing_slot() RPC            | Slot already booked (race)     | returns {success:false}
                                   | Supabase RPC error             | PostgrestError
cancel_viewing() RPC               | viewing_id not found           | returns {success:false}
document upload                    | File > 50MB                    | Storage error
                                   | MIME type not allowed          | Storage policy violation
offer submission                   | listing_id invalid             | FK constraint violation
AI match (future)                  | Anthropic API timeout          | AnthropicError
                                   | Malformed JSON response        | JSON.parse error
                                   | Empty response                 | returns null scores
```

```
EXCEPTION CLASS              | RESCUED? | RESCUE ACTION           | USER SEES
-----------------------------|----------|-------------------------|------------------
Redis connection error        | Y        | safeXxx() returns []    | Empty dashboard (silent) ⚠️
PostgrestError (any)          | Y        | safeXxx() returns []    | Empty dashboard (silent) ⚠️
property_address missing      | Y*       | returns [] silently     | "0 Upcoming Viewings" ← BUG
Slot double-book race         | Y        | RPC returns false       | No UI error shown ← GAP
Storage MIME violation        | N ← GAP  | —                       | 500 error ← BAD
FK constraint on offer submit | N ← GAP  | —                       | 500 error ← BAD
AnthropicError (future)       | N ← GAP  | —                       | 500 error ← BAD
```

**Action required:** `safeXxx()` helpers must add structured error logging:
```ts
console.error("[dashboard-service] safeQuery failed", { table, filters, userId, error });
```
All new API routes need try/catch returning `{ error: string }` with appropriate HTTP status codes.

---

## Section 3: Security & Threat Model

| Threat | Likelihood | Impact | Mitigated? |
|--------|-----------|--------|-----------|
| Role spoofing (`/dashboard/admin`) | Med | Med | ❌ No role validation at route level |
| IDOR on viewings (cancel another user's) | Low | High | ✅ RPCs are SECURITY DEFINER + RLS |
| Document path traversal | Med | High | ✅ Storage policy checks `[user_id]/` prefix |
| Offer on inaccessible listing | Low | Med | ⚠️ FK to listings exists but no ownership check |
| AI prompt injection via lifestyle_factors | Med | Med | ❌ Not addressed — sanitize before prompt construction |
| Referral code enumeration | Low | Low | ✅ UUIDs, not sequential |
| Cross-conversation message read | Low | High | ✅ RLS on conversations |

**Two unmitigated items to fix during implementation:**
1. Role validation in `page.tsx`
2. Input sanitization in `ai-match-service.ts` before Anthropic prompt construction

---

## Section 4: Interaction Edge Cases

```
INTERACTION          | EDGE CASE                    | HANDLED? | FIX NEEDED?
---------------------|------------------------------|----------|-------------
Booking a viewing    | Double-click submit          | ❌        | Optimistic disable on click
                     | Slot gone between page load  | ✅ (RPC)  | Show user-friendly toast
                     | No slots available           | ❌        | Empty state needed
Submitting offer     | Amount 0 or negative         | ✅ (DB)   | Add client validation too
                     | No AIP document uploaded     | ❌        | Form validation required
                     | Duplicate offer same listing | ❌        | Check existing offer first
Uploading document   | File > 50MB                  | ❌        | Client-side size check before upload
                     | Wrong file type              | ❌        | MIME check before upload
                     | Upload interrupted           | ❌        | Acceptable (no resumable upload needed)
Messages             | Send with empty body         | ❌        | Client validation
                     | User not in conversation     | ✅ (RLS)  | —
Moving checklist     | Complete item out of order   | ✅        | Items are independent
AI match results     | No matches found             | ❌        | Empty state needed
                     | Results expired (>24hr)      | ❌        | Show "refreshing..." state
```

---

## Section 5: Code Quality

**DRY violations to fix:**
- `viewings/page.tsx`, `offers/page.tsx`, `documents/page.tsx` each need the same loading/error/empty-state pattern used in `page.tsx`. Extract a shared page wrapper pattern.
- `safeQuery` / `safeQuerySingle` / `safeCount` use `any` casts (lines 516, 539 in `dashboard-service.ts`). Remove the `eslint-disable` comments by properly typing the Supabase query builder chain.

**Footgun — pence storage:**
`offers.amount` is stored in pence (`integer`, `CHECK (amount > 0)`). Every UI layer must `× 100` on write and `÷ 100` on read. Add a JSDoc comment to the `Offer` type definition to prevent future bugs.

---

## Section 6: Tests Needed

No tests currently exist for any buyer dashboard flow. At FAANG standard, each RPC needs verification that race conditions are handled correctly.

```
FLOW                          | TYPE        | HAPPY PATH | FAILURE PATH | EDGE CASE
------------------------------|-------------|------------|--------------|----------
book_viewing_slot() RPC       | DB/pgTAP    | ✅ needed   | Double-book  | Expired slot
cancel_viewing() RPC          | DB/pgTAP    | ✅ needed   | Not found    | Already cancelled
reschedule_viewing() RPC      | DB/pgTAP    | ✅ needed   | New slot gone| Same slot re-used
Offer submission              | Integration | ✅ needed   | FK violation | Duplicate offer
Document upload               | Integration | ✅ needed   | MIME reject  | 50MB limit
Message send                  | Integration | ✅ needed   | Empty body   | Not in conversation
AI match preferences save     | Integration | ✅ needed   | Invalid JSON | Partial prefs
Full E2E buyer journey        | E2E         | ✅ needed   | —            | —
```

---

## Section 7: Performance

**N+1 bug in `buildAgentDashboard`:**
Line 301 fetches up to 500 leads then reduces in JS. Should be a `GROUP BY stage` aggregation query.

**Missing indexes (verify against migration, add if absent):**
```sql
CREATE INDEX ON viewings(user_id, status);
CREATE INDEX ON offers(user_id, status);
CREATE INDEX ON ai_match_results(user_id, expires_at);
CREATE INDEX ON moving_checklist_items(user_id, offer_id);
```

**React Query stale times for new pages:**
- Viewings, offers, documents: 1 minute
- AI match results: 24 hours (matches DB TTL)
- Service directory (brokers/conveyancers/surveyors): 1 hour

---

## Section 8: Observability Gaps

- All `safeXxx()` helpers swallow errors silently. Need structured logging with context.
- No Sentry integration in any dashboard service.
- Zero PostHog events tracked. Key funnel events to add on each state-changing action:

```
viewing.booked        viewing.cancelled      viewing.rescheduled
offer.submitted       offer.status_changed
document.uploaded     document.upload_failed
ai_match.prefs_saved  ai_match.results_viewed
referral.link_shared  referral.converted
```

---

## Section 9: Deployment Notes

Migration `20260313100000_v3_1_buyer_dashboard_foundation.sql` is already written and safe:
- All new tables are additive — backward compatible ✅
- Storage bucket creation is idempotent (`ON CONFLICT DO NOTHING`) ✅
- No breaking changes to existing tables ✅
- RPCs are `CREATE OR REPLACE` — safe to re-run ✅

---

## Section 10: Long-Term Trajectory

```
CURRENT STATE              THIS PLAN DELTA           12-MONTH IDEAL
───────────────────────    ──────────────────────    ──────────────────────
3 pages wired           →  22 pages wired         →  22 pages + Realtime subs
Mock data in 4 pages    →  Mock data eliminated   →  Live updates
No messaging UI         →  Inbox + thread built   →  + video viewing link
No AI features          →  AI match prefs/results →  Personalised property feed
No calculators          →  Affordability + rates  →  Live mortgage rate API
No service directory    →  Browse 3 categories    →  Review + booking flow
```

**Reversibility: 5/5** — All new pages are additive. Any page can be reverted independently.

---

## Implementation Plan (Wave-Based)

### Wave 1 — Fix Critical Bugs + Wire Existing Mock Pages
**Delivers: 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.13**

**Task 0 (before any service code): Install test infrastructure**
```
pnpm add -D vitest @vitest/ui @testing-library/react
# pgTAP installed in supabase container for RPC tests
```

New files to create:
```
src/lib/currency.ts                              ← penceToGBP / GBPToPence utilities
src/services/viewings/viewings-service.ts
src/services/offers/offers-service.ts
src/services/documents/documents-service.ts
src/app/api/viewings/route.ts
src/app/api/viewings/[id]/route.ts
src/app/api/offers/route.ts
src/app/api/documents/route.ts
src/hooks/useViewings.ts
src/hooks/useOffers.ts
src/hooks/useDocuments.ts
```

Files to fix:
```
src/services/dashboard/dashboard-service.ts  ← fix viewings JOIN (schema bug)
src/app/(protected)/dashboard/[role]/offers/page.tsx  ← rewrite buyer perspective
src/app/(protected)/dashboard/[role]/page.tsx ← add role validation
```

Files to wire (replace mock data with real hooks):
```
src/app/(protected)/dashboard/[role]/viewings/page.tsx
src/app/(protected)/dashboard/[role]/documents/page.tsx
```

### Wave 2 — Messages
**Delivers: 7.11, 7.12**

```
src/services/messages/messages-service.ts
src/app/api/messages/route.ts
src/app/api/messages/[conversationId]/route.ts
src/app/(protected)/dashboard/[role]/messages/page.tsx    ← NEW
src/app/(protected)/dashboard/[role]/messages/[id]/page.tsx ← NEW
src/hooks/useMessages.ts
```

### Wave 3a — Financial + Service Directory + Alerts
**Delivers: 7.4, 7.17, 7.18, 7.19, 7.20, 7.21**
*No external API deps — independently shippable regardless of AI match status.*

```
src/services/financial/calculators.ts                      ← pure computation, no DB
src/app/(protected)/dashboard/[role]/alerts/page.tsx       ← NEW (7.4)
src/app/(protected)/dashboard/[role]/calculators/page.tsx  ← NEW (7.17 + 7.18)
src/app/(protected)/dashboard/[role]/services/page.tsx     ← NEW (7.19–7.21)
```

Service directory query spec:
- Table: `service_providers` filtered by `postcode_district` matching user's saved search area
- Limit: 20 results per category
- Category param: `?category=mortgage_broker|conveyancer|surveyor`
- Empty state if no providers in district

### Wave 3b — AI Match
**Delivers: 7.15, 7.16**
*Isolated so Anthropic prompt iteration doesn't block Wave 3a pages.*

```
src/services/ai/ai-match-service.ts
src/app/api/ai-match/route.ts
src/app/(protected)/dashboard/[role]/ai-match/page.tsx     ← NEW (7.15 + 7.16)
```

### Wave 4 — Checklist + Referrals
**Delivers: 7.14, 7.22**

```
src/services/moving/moving-checklist-service.ts
src/services/referrals/referral-service.ts
src/app/api/moving-checklist/route.ts
src/app/api/referrals/route.ts
src/app/(protected)/dashboard/[role]/moving/page.tsx       ← NEW
src/app/(protected)/dashboard/[role]/referrals/page.tsx    ← NEW
```

---

## Failure Modes Registry

```
CODEPATH              | FAILURE MODE            | RESCUED? | TEST? | USER SEES?        | LOGGED?
----------------------|-------------------------|----------|-------|-------------------|--------
safeQuery()           | Any DB error            | Y        | N     | Empty data        | N ← GAP
book_viewing_slot()   | Slot double-booked      | Y (RPC)  | N     | No UI feedback    | N ← GAP
cancel_viewing()      | viewing_id not found    | Y (RPC)  | N     | No UI feedback    | N ← GAP
offer submit          | FK violation            | N        | N     | 500 error         | N ← CRITICAL
document upload       | MIME violation          | N        | N     | 500 error         | N ← CRITICAL
document upload       | File > 50MB             | N        | N     | 500 error         | N ← CRITICAL
dashboard aggregation | Redis down              | Y        | N     | Stale/empty data  | N ← GAP
AI match              | Anthropic timeout       | N        | N     | 500 error         | N ← CRITICAL (future)
```

---

## What Already Exists (reuse, don't rebuild)

| Sub-problem | Existing code | Reuse plan |
|-------------|--------------|-----------|
| Dashboard shell/layout | `DashboardShell.tsx` | All 15 new pages use it |
| Loading skeletons | `StatCardSkeleton`, `Skeleton` | Import in each new page |
| Stat card pattern | `StatCard.tsx` | Reuse in offer/viewing summary |
| Activity logging | `logActivity()` in `dashboard-service.ts` | Call on every state-changing action |
| Cache invalidation | `invalidateDashboardCache()` | Call after offer/viewing changes |
| Supabase storage | Storage client exists | Documents page uses directly |
| Messaging schema | `conversations`, `messages` tables | Wire existing schema, build UI |
| Viewing RPCs | `book_viewing_slot()`, `cancel_viewing()`, `reschedule_viewing()` | Call from `viewings-service.ts` |
| Offer state machine | `offers` + `offer_status_history` tables | Render in `offers/page.tsx` |

---

## NOT In Scope (deferred)

| Item | Rationale |
|------|-----------|
| Supabase Realtime for live messages | Phase 2 — polling is acceptable for launch |
| Live mortgage rate API (Habito etc.) | Phase 2 — illustrative rates ship now |
| Video viewing link integration | Phase 2 |
| Push / browser notifications | Phase 3 |
| Agent-side slot management UI | Separate agent dashboard feature |
| Rental application submission (renter) | Phase 2 — schema exists, build separately |
| Tenancy details page (renter) | Phase 2 — `tenancies` table needs separate migration |
