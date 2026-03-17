# Admin / Back Office — CEO Plan Review
**Date:** 2026-03-17
**Scope:** Pages 20.1–20.30 (System Audit of completed implementation)
**Mode:** SCOPE EXPANSION — FAANG-grade implementation
**Status:** All 30 pages built and merged to main (2026-03-15). This review audits quality, identifies gaps, and prescribes upgrades.

---

## System Audit Summary

### Implementation Inventory
| Category | Count | Lines |
|----------|-------|-------|
| Admin page routes | 29 | ~1,500 |
| Admin components | 34 | ~4,553 |
| Admin services | 11 | 722 |
| Admin API routes | 21 | ~1,200 |
| Admin lib + hooks | 5 | 178 |
| Migrations | 3 | ~182 |
| **Total** | **93 files** | **~8,600 lines** |

### Original P0 Security Issues — ALL RESOLVED
1. Admin layout role guard — FIXED (`layout.tsx:30`)
2. API route admin verification — FIXED (all wrapped in `auditedAdminAction()`)
3. `searchUsers()` SQL injection — FIXED (sanitizes `%`, `_`, `\`)
4. `suspendUser()` Auth sync — FIXED (calls `auth.admin.updateUserById` with rollback)
5. Audit trail — FIXED (all actions logged to `admin_audit_log`)

### Taste Calibration
**Well-designed:** `audited-admin-action.ts` (elegant wrapper), `admin-guard.ts` (defense-in-depth), `computeRiskScore()` (transparent algorithm)
**Anti-patterns:** `analytics-service.ts` eslint-disable for any type, Stitch design color inconsistency across screens

---

## Stitch Design References (12 screens)

| Screen ID | Title |
|-----------|-------|
| 93836c98 | Admin Overview Dashboard |
| 6cf1e4f2 | Admin Console Overview |
| f4ad2997 | User Management List |
| dcd8a2c9 | User Management & Moderation |
| 9a4c6c58 | Verification Approval Queue (v1) |
| 8a08be72 | Verification Approval Queue (v2) |
| a7b3d634 | Listing Moderation Queue (v1) |
| cd78ba56 | Listing Moderation Queue (v2) |
| 7c7136bc | GDPR & Privacy Requests |
| 7ecf916e | System Health & Performance |
| cc2c241d | Fraud & Security Center |
| f91450f2 | Feature Flags & Rollouts |

---

## Issues Found & Decisions Made

### BUILD NOW (P0/P1 — decided to implement)

| # | Issue | Decision | Effort |
|---|-------|----------|--------|
| 1 | Dashboard KPIs missing Revenue, trends, progress bars, alert banners | Full Stitch parity — RichKpiCard + Revenue MTD + alert banners | M |
| 2 | Missing User Growth + MRR charts (shows "Mock") | Both charts with real data | M |
| 3 | No System Health widget on dashboard overview | Add compact health widget reusing ping functions | S |
| 4 | Activity feed is plain text vs Stitch's rich Critical Action Log | Rich feed with icons, category tags, moderator names | S |
| 5 | Audit log doesn't record success/failure | Add success boolean + error_message to admin_audit_log | S |
| 6 | suspendUser/banUser double-failure gap | Log rollback failures with alert-level severity | S |
| 7 | activateUser doesn't clear stale ban_reason/banned_at | Clear all ban fields on activate | trivial |
| 8 | No self-demotion or last-admin guard | Server-side guards for demotion | S |
| 9 | Feature flags readable by ALL authenticated users | RPC for public flag checks, full SELECT admin-only | M |
| 10 | No pagination on queue/list services | Add server-side pagination to all queue services | S |
| 11 | Fraud detection unbounded queries | RPC for fraud signals with DB-side aggregation | M |
| 12 | cancelSubscription doesn't call Stripe | Wire Stripe cancel API | S |
| 13 | Listing queue missing owner context | JOIN profiles on owner_id | S |
| 14 | Zero test coverage for admin (93 files, 0 tests) | Critical-path test suite | M |
| 15 | System health 4 external pings on every load, no cache | Cache health checks for 30s | S |
| 16 | All services silently swallow errors | Structured logging + degraded UI indicator | S |

### TODOS.md ADDITIONS

| # | Item | Priority | Effort |
|---|------|----------|--------|
| 18 | RBAC-filtered sidebar navigation | P2 | M |
| 19 | Email campaign Resend integration | P2 | L |
| 20 | GDPR automated export pipeline (Edge Function) | P1 | L |
| 21 | CMS public rendering routes (/blog, /help) | P2 | M |
| 22 | Cmd+K command palette | P3 (vision) | S |
| 23 | Keyboard shortcuts on queue pages | P3 (vision) | S |
| 24 | Realtime "new items" banner on queues | P3 (vision) | M |
| 25 | KPI sparklines (7-day trend) | P3 (vision) | S |
| 26 | Dark mode toggle for admin | P3 (vision) | M |

---

## Architecture Diagrams

### System Architecture (Updated)
```
REQUEST FLOW (post-review)
═══════════════════════════════════════════════════════════════════

Browser Request
    │
    ▼
middleware.ts
    ├─ Checks Supabase session (JWT)
    ├─ Matches /admin/* paths
    └─ Role check via JWT → redirect if not admin
         │
         ▼
(admin)/layout.tsx
    ├─ Secondary DB role check (profiles.role === 'admin')
    ├─ AdminShell render (grouped collapsible sidebar)
    └─ [FUTURE] RBAC nav filtering by admin sub-role
         │
         ▼
Page (Server Component)
    ├─ Suspense boundaries for async data
    ├─ [NEW] Pagination params (page, limit, cursor)
    └─ [NEW] Degraded data indicator on query failures
         │    (client action triggers)
         ▼
/api/admin/* Route Handler
    └─ auditedAdminAction() wrapper
         ├─ adminOnly() guard (auth + DB role check)
         ├─ fn() — business logic
         ├─ finally: logAdminAction()
         │    └─ [NEW] success: boolean, error_message: text
         ├─ [NEW] Self-demotion guard (demote/promote)
         └─ return Response

  EXTERNAL SERVICES
    ├── Supabase DB      — all admin queries
    ├── Supabase Auth    — ban via banned_until='876600h'
    ├── Supabase Storage — GDPR export files
    ├── Supabase Realtime — [FUTURE] queue live updates
    ├── Stripe API       — revenue data (cached 5min)
    │   └── [NEW] Stripe cancel subscription API
    ├── PostHog API      — behaviour + search analytics (cached 5min)
    ├── Resend           — GDPR fulfilment email
    │   └── [FUTURE] Email campaigns batch send
    └── [NEW] check_feature_flag() RPC — public flag checks
```

### Error Flow
```
  auditedAdminAction(request, action, targetType, targetId, fn)
      │
      ├─ adminOnly(request)
      │   ├─ Supabase client creation fails → 503 + log
      │   ├─ Auth getUser fails → 401
      │   ├─ Profile fetch fails → 503 + log
      │   └─ Role !== admin → 403
      │
      ├─ fn(ctx) executes
      │   ├─ Success → result
      │   ├─ AdminActionError → status from error
      │   └─ Unknown Error → 500 + message
      │
      └─ finally: logAdminAction()
          ├─ [NEW] success = (thrownError === undefined)
          ├─ [NEW] error_message = thrownError?.message
          └─ Insert fails → console.error (never throws)
```

### Fraud Detection Data Flow (Post-Fix)
```
  CURRENT (slow, unbounded):
  content_reports → JS → reportCounts → profiles → JS → riskScore → render

  PROPOSED (RPC):
  get_fraud_signals() RPC
    ├─ JOIN content_reports ON profiles
    ├─ GROUP BY user_id
    ├─ COUNT(reports) + MAX(created_at)
    ├─ Compute risk_score in SQL
    ├─ WHERE risk_score >= 20
    ├─ ORDER BY risk_score DESC
    ├─ LIMIT 200
    └─ Single round-trip, DB-optimized
```

---

## Error & Rescue Registry

```
  METHOD/CODEPATH              | EXCEPTION/ERROR              | RESCUED? | ACTION                    | USER SEES
  -----------------------------|------------------------------|----------|---------------------------|------------------
  adminOnly()                  | Supabase client creation     | Y        | Return 503                | "Service unavailable"
                               | Auth getUser error           | Y        | Return 401                | "Unauthorized"
                               | Profile DB fetch error       | Y        | Return 503 + log          | "Service unavailable"
                               | Role !== admin               | Y        | Return 403                | "Forbidden"
  auditedAdminAction()         | fn() throws AdminActionError | Y        | Return status + message   | JSON error
                               | fn() throws unknown          | Y        | Return 500                | "Action failed"
                               | logAdminAction insert fails  | Y        | console.error (best-effort)| Nothing (silent)
  suspendUser()                | DB update fails              | Y        | Return { success: false }  | Error toast
                               | Auth ban fails               | Y        | Rollback DB + false       | Error toast
                               | Auth ban + rollback fail     | PARTIAL  | [NEW] Alert-level log     | Error toast
  banUser()                    | DB update fails              | Y        | Return { success: false }  | Error toast
                               | Auth ban fails               | Y        | Rollback all 3 fields     | Error toast
  activateUser()               | DB update fails              | Y        | Return { success: false }  | Error toast
                               | Auth unban fails             | Y        | Rollback DB               | Error toast
  searchUsers()                | DB query fails               | Y        | [NEW] Log error           | [NEW] Degraded indicator
  getListingQueue()            | DB query fails               | Y        | [NEW] Log error           | [NEW] Degraded indicator
  getGdprQueue()               | DB query fails               | Y        | [NEW] Log error           | [NEW] Degraded indicator
  getFeatureFlags()            | DB query fails               | Y        | [NEW] Log error           | [] (all flags off)
  getPlatformMetrics()         | Any count fails              | Y        | Returns 0                 | Zero count shown
  getRevenueData()             | Stripe 429 / timeout         | Y        | Returns null              | Skeleton
  getBehaviourData()           | PostHog timeout              | Y        | Returns null              | Skeleton
  fulfilGdprRequest()          | Optimistic lock race         | Y        | { alreadyFulfilled: true }| "Already processed" msg
  pingSupabase/Stripe/etc      | 5s AbortSignal timeout       | Y        | "down" status             | Red status card
  cancelSubscription()         | [NEW] Stripe cancel fails    | [NEW] Y  | Return error, don't update DB| Error toast
```

---

## Failure Modes Registry

```
  CODEPATH              | FAILURE MODE                  | RESCUED? | TEST? | USER SEES?        | LOGGED?
  ----------------------|-------------------------------|----------|-------|-------------------|--------
  suspendUser           | Auth ban + DB rollback fail   | PARTIAL  | N     | Error toast       | [NEW] Y
  activateUser          | Stale ban_reason after reactivation | [FIX] Y | N | Clean profile  | N/A
  demoteFromAdmin       | Self-demotion                 | [FIX] Y  | N     | Error message     | Y
  demoteFromAdmin       | Last-admin removal            | [FIX] Y  | N     | Error message     | Y
  cancelSubscription    | Stripe not called             | [FIX] Y  | N     | Proper cancel     | Y
  getListingQueue       | Unbounded query at scale      | [FIX] Y  | N     | Paginated results | N/A
  fraud detection       | 10K+ reports slow page load   | [FIX] Y  | N     | Fast RPC results  | N/A
  feature_flags         | All users read internal flags | [FIX] Y  | N     | RPC only key+enabled | N/A
  all services          | Error → empty results (silent)| [FIX] Y  | N     | Degraded indicator| [NEW] Y
  audit_log             | No success/failure recording  | [FIX] Y  | N     | Correct audit     | Y
```

**CRITICAL GAPS remaining after fixes: 0**
**Tests needed: 14 (Issue #14 — critical-path test suite)**

---

## NOT in scope
- AI-assisted content moderation (Claude scanning new listings) — Phase 2 vision item
- ML fraud detection model — requires training data from production usage
- Real-time global session map — requires significant infrastructure
- Admin mobile responsive layout — admin is desktop-only for now
- Multi-tenancy / white-label admin — not in v3.0 scope

## What already exists
- All 30 pages render with functional data
- Auth guard + audit logging works
- All original P0 security issues resolved
- TipTap CMS editor functional
- Feature flags CRUD works
- GDPR queue with idempotent fulfilment
- Cursor-based audit log pagination

## Dream state delta
This review closes **16 build-now gaps** and adds **9 TODOS items**. After implementation:
- Dashboard matches Stitch designs (KPIs, charts, health, activity)
- All services have pagination, structured logging, and degraded indicators
- Security gaps closed (self-demotion, flag visibility, Stripe cancel)
- Test coverage for critical paths
- Compliance: audit log records success/failure

Remaining delta to 12-month ideal:
- AI-assisted moderation
- ML fraud scoring
- Realtime queue updates
- RBAC sidebar filtering
- Public CMS rendering
- GDPR automated pipeline

---

## Build Waves (Recommended Order)

> **Eng Review Refinements (2026-03-17):**
> - Issue 11 (fraud RPC) → simplified to `.limit()` bounds (DRY preserved, no dual JS/SQL)
> - Issue 6+7 → consolidated via `withAuthSync` helper (DRY extraction)
> - Issue 9 RPC rollout → random per-call evaluation (simple)
> - Wave C: UserGrowthChart needs SQL RPC (`get_user_growth_by_month`) for GROUP BY
> - Wave C: Each new widget gets its own Suspense boundary + Skeleton
> - Wave C: RichKpiCard must handle null trend data (show "—")
> - Wave B: Extract health ping functions to `services/admin/health-service.ts`
> - Wave D: 3 additional test targets (feature flag RPC, cancelSubscription, demoteFromAdmin guards)
> - Code quality: Fix `safeCount` any type, fix `Record<string, unknown>` in listing-service

### Wave A: Security & Compliance (Issues 5, 7, 8, 9, 12)
1. ALTER admin_audit_log ADD success + error_message
2. Update auditedAdminAction to pass outcome to logAdminAction
3. Extract `withAuthSync` helper in user-service.ts (DRY: suspend/ban/activate)
4. Fix activateUser to clear ban_reason + banned_at (via withAuthSync)
5. Add self-demotion + last-admin guard to demoteFromAdmin route handler
6. Create check_feature_flag() RPC (random rollout), restrict direct SELECT to admins
7. Wire cancelSubscription to Stripe API (fetch stripe_subscription_id from DB, call stripe.subscriptions.cancel, then update DB)

### Wave B: Performance & Observability (Issues 6, 10, 11, 15, 16)
1. Add pagination (page/limit) to getListingQueue, getGdprQueue
2. Add .limit(500) to fraud content_reports query + .limit(200) to profiles query (no RPC needed)
3. Extract ping functions to `services/admin/health-service.ts`, wrap in unstable_cache(revalidate: 30)
4. Add structured console.error logging to all service catch blocks (10 files)
5. Add DegradedDataIndicator component for UI-side error surfacing
6. Rollback failure logging already handled via withAuthSync (Wave A)
7. Fix safeCount `any` type → import PostgrestError
8. Fix listing-service Record<string, unknown> → typed update objects

### Wave C: Dashboard Stitch Parity (Issues 1, 2, 3, 4, 13)
1. Upgrade CountCard → RichKpiCard (trends, progress bars, contextual color). Handle null trend with "—" fallback.
2. Add Revenue MTD card (from getRevenueData cache) + threshold alert banners
3. Build UserGrowthChart (Recharts stacked bar by role) — needs SQL RPC `get_user_growth_by_month()`
4. Upgrade revenue chart to use real Stripe data (remove "Mock" label)
5. Add SystemHealthWidget to dashboard (import from health-service.ts) — own Suspense + Skeleton
6. Upgrade ActivityFeed: JOIN profiles on admin_id for names, add action-type icons + category tags
7. JOIN profiles(full_name, email, verification_status) on owner_id in getListingQueue

### Wave D: Tests (Issue 14)
1. adminOnly guard tests (3 branches: no user, no profile, not admin)
2. auditedAdminAction tests (4 branches: success, AdminActionError, unknown error, audit log failure)
3. computeRiskScore tests (5+ cases: 0 reports, 3 reports, new account, suspended account, max score)
4. withAuthSync tests (4 branches: success, DB fail, Auth fail+rollback, double-fail alert)
5. searchUsers sanitization tests (strip %, _, \, length cap at 100)
6. fulfilGdprRequest idempotency tests (pending → in_progress, already fulfilled)
7. demoteFromAdmin guard tests (self-demotion rejected, last-admin rejected)
8. cancelSubscription Stripe tests (success, Stripe error → no DB update, missing stripe_id)
9. check_feature_flag RPC tests (enabled, disabled, non-existent key, role filtering)

---

## Completion Summary

```
  +====================================================================+
  |            MEGA PLAN REVIEW — COMPLETION SUMMARY                   |
  +====================================================================+
  | Mode selected        | SCOPE EXPANSION                             |
  | System Audit         | 93 files, 8.6K LOC, all P0s resolved        |
  | Step 0               | EXPANSION — FAANG-grade, Stitch design audit |
  | Section 1  (Arch)    | 4 issues found (KPIs, charts, health, feed) |
  | Section 2  (Errors)  | 12 error paths mapped, 2 GAPS (now fixed)   |
  | Section 3  (Security)| 4 issues found, 2 High severity             |
  | Section 4  (Data/UX) | 2 issues (pagination, fraud query)          |
  | Section 5  (Quality) | 2 issues (Stripe cancel, owner context)     |
  | Section 6  (Tests)   | Diagram produced, 14+ test gaps             |
  | Section 7  (Perf)    | 1 issue (health cache)                      |
  | Section 8  (Observ)  | 1 issue (silent errors across all services) |
  | Section 9  (Deploy)  | 1 migration needed (audit log columns)      |
  | Section 10 (Future)  | Reversibility: 4/5, debt items: 2           |
  +--------------------------------------------------------------------+
  | NOT in scope         | written (5 items)                            |
  | What already exists  | written                                      |
  | Dream state delta    | written                                      |
  | Error/rescue registry| 20 methods, 0 CRITICAL GAPS (after fixes)   |
  | Failure modes        | 10 total, 0 CRITICAL GAPS (after fixes)     |
  | TODOS.md updates     | 9 items proposed (all accepted)              |
  | Delight opportunities| 5 identified (all added to TODOS)            |
  | Diagrams produced    | 3 (system arch, error flow, fraud data flow) |
  | Stale diagrams found | 0                                            |
  | Unresolved decisions | 0                                            |
  +====================================================================+
```
