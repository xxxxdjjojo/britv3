# Admin Analytics Wiring Audit & Remediation

**Date:** 2026-07-03
**Scope:** `/admin` back-office analytics vs. the live TrueDeed app
**Author:** Analytics-wiring audit pass
**Verdict:** Admin analytics were **mostly real DB-backed**, but three surfaces shipped **fake/mock data** and one whole analytics category (search) had **zero instrumentation feeding it**. All are now fixed with tests. See the honesty ledger in §Gap Report.

---

## Phase 1 — What exists

The admin area is large and largely real. Route group `src/app/(admin)/admin/*`:

| Area | Route | Data source |
|---|---|---|
| Dashboard | `/admin` | `getPlatformMetrics` (real counts) + revenue chart + audit feed |
| Platform metrics | `/admin/analytics/platform` | Real Supabase counts (profiles/properties/messages) |
| User behaviour | `/admin/analytics/behaviour` | PostHog API (degrades if unconfigured) |
| Revenue | `/admin/analytics/revenue` | Stripe API + `payments`/`provider_invoices` |
| Search insights | `/admin/analytics/search` | PostHog API (events `property_search`, `search_no_results`) |
| System health | `/admin/system-health` | Live pings to Supabase/Stripe/Resend/PostHog |
| API usage | `/admin/api-usage` | Upstash Redis rate-limit counters |
| Users | `/admin/users`, `/admin/users/[id]` | `user-service` over `profiles` + `auth.users` |
| Moderation / Reviews / Verifications / GDPR / Fraud / Audit log | various | Real Supabase queries |
| Pricing review / SDR | `/admin/pricing-review`, `/admin/sdr` | Real subscription rows / in-memory queue |

Auth model (verified in `src/proxy.ts` + `src/app/(admin)/layout.tsx` + `docs/admin-access.md`):
- **Two independent guards**: `proxy.ts` middleware (runs first, DB-backed `profiles.is_admin` + `admin_role`) and the `(admin)/layout.tsx` server component (re-checks). Source of truth is `public.profiles`, never JWT claims.
- Per-route permission gate via `ADMIN_ROUTE_PERMISSIONS` + `hasPermission(role, permission)`.
- Admin actions logged to `admin_audit_log` via `log_admin_action` RPC (fallback to direct insert).

Event instrumentation: `posthog-js` via `src/lib/analytics/track-event.ts` (`trackEvent`, SSR-safe, never throws). ~15 events fired across landlord/referral/messaging/new-homes surfaces.

---

## Phase 2 — Admin Wiring Matrix

| Widget | Route/component | Claims to show | Real source | Backend/query | Tables | Event source | Auth/RBAC | Live method | Status (before) | Gap/risk | Sev | Fix |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KPI cards (users/listings/verifs/reports/reviews) | `/admin` `KpiCards` | Platform totals | ✅ real | `getPlatformMetrics` count queries | profiles, properties, content_reports, provider_reviews | — | is_admin+role (proxy+layout) | RSC per request | WORKING_AND_VERIFIED | none | — | — |
| "Platform Revenue" area chart | `/admin` `AdminDashboardCharts` | Monthly platform revenue | ❌ **MOCK** | none — hardcoded `MOCK_REVENUE` | none | — | inherit | none | **MOCK_DATA** | Fabricated £4.2k–£9.4k. Title even said "(Mock)" | **P0** | New `getMonthlyRevenue()` over `payments`/`provider_invoices`; honest empty state |
| Recent activity feed | `/admin` `ActivityFeed` | Last 10 admin actions | ✅ real | `getAuditLog(limit:10)` | admin_audit_log | admin actions | inherit | RSC per request | WORKING_AND_VERIFIED | none | — | — |
| DAU card | `/admin/analytics/platform` | "DAU" | ⚠️ mislabeled | count `admin_audit_log` today | admin_audit_log | — | inherit | RSC | PARTIALLY_WIRED | Labeled DAU but counts *admin* actions | P1 | Relabeled "Admin Actions Today (last 24h)" |
| MAU card | same | "Active Users 30d" | ⚠️ mislabeled | count `profiles.updated_at≥30d` | profiles | — | inherit | RSC | PARTIALLY_WIRED | Profile edits ≠ active users | P1 | Relabeled "Profiles Updated (30d)" |
| New Users 30d | same | new signups | — | *did not exist* | — | — | — | — | MISSING | No signup-growth metric | P1 | Added "New Users (30d)" + 12-week `UserGrowthTable` |
| Users by role / Listings by status | same | breakdowns | ✅ real | select + JS aggregate | profiles, properties | — | inherit | RSC | WORKING_AND_VERIFIED | full-table scan (small) | P3 | left (acceptable at current scale) |
| Behaviour top-pages/sessions | `/admin/analytics/behaviour` | PostHog pageviews | ✅ real (if configured) | PostHog trend API | — | `$pageview` (fired) | view_analytics | 5-min cache | WORKING (degrades) | none | — | — |
| Revenue MRR/subs | `/admin/analytics/revenue` | Stripe MRR | ✅ real (if configured) | Stripe subscriptions API | — | — | view_revenue | 5-min cache | WORKING (degrades) | none | — | — |
| Revenue "Monthly Revenue" bar chart | same `RevenueBarChart` | monthly revenue | ❌ **MOCK** | rendered with **no data prop** → `MOCK_DATA` | none | — | inherit | none | **MOCK_DATA** | Same fabricated figures | **P0** | Now fed real `getMonthlyRevenue()`; honest empty state |
| Transaction volume / commission | same | payments totals | ✅ real | sum `payments.amount` | payments | — | inherit | RSC | WORKING (0 if empty) | none | — | — |
| Search volume chart | `/admin/analytics/search` | search volume | ⚠️ **MOCK fallback** | PostHog + `MOCK_VOLUME` random fallback | — | `property_search` | view_analytics | 5-min cache | **MOCK_DATA + MISSING_EVENT** | Random data shown even when PostHog connected; **event never fired by app** | **P0** | Removed `MOCK_VOLUME`; **added `property_search`/`search_no_results` firing in search UI** |
| Top / zero-result queries | same | search queries | ❌ empty forever | PostHog breakdown by `query` | — | `property_search`/`search_no_results` | view_analytics | 5-min cache | **MISSING_EVENT_INSTRUMENTATION** | Events never emitted → always empty | **P0** | Instrumented search page |
| System health cards | `/admin/system-health` | service status | ✅ real | live pings | — | — | view_system_health | per-load | WORKING_AND_VERIFIED | Resend ping is reachability-only | P3 | left (documented) |
| API usage | `/admin/api-usage` | rate-limit stats | ✅ real (if Redis) | Upstash REST | — | — | view_api_usage | per-load | WORKING (degrades) | none | — | — |
| User table email | `/admin/users` | user email | ❌ null | `email: null` hardcoded | profiles (no email col) | — | manage_users | RSC | PARTIALLY_WIRED | Email always blank | P1 | Fetch via admin client per displayed id |
| User detail email | `/admin/users/[id]` | user email | ❌ null | `email: null` | profiles | — | manage_users | RSC | PARTIALLY_WIRED | Email always blank | P1 | `getUserById` via admin client |
| Fraud detection | `/admin/fraud` | risk scores | ✅ real (email null) | reports + account age | content_reports, profiles | — | manage_fraud | RSC | WORKING (email TODO) | Email column still null (auth.users) | P2 | left (documented follow-up) |

---

## Phase 3 — Data lineage (the fixed metrics)

**Monthly revenue** (was fake → now real):
User pays → Stripe/`payments` row written → `getMonthlyRevenue()` buckets last 7 months in JS → RSC passes to `AdminDashboardCharts`/`RevenueBarChart` → renders bars, or "No revenue data yet" if all zero. Freshness: per request. Trust: **yes** — reads real rows, shows zero honestly. Edge cases: missing `payments` table → falls back to `provider_invoices` → falls back to 7 zero months. Test: `analytics-wiring.test.ts` (aggregation, empty, error, throw) + `RevenueCharts.test.tsx` (render branches).

**Search queries** (was impossible → now collected forward):
User searches → `search/page.tsx` `useEffect` fires `trackEvent("property_search", {query, result_count, filters_active})` (and `search_no_results` when 0 results) → PostHog ingests → `/admin/analytics/search` reads PostHog trend/breakdown → renders tables/chart. Freshness: 5-min cache. Trust: **forward-looking only** — no historical backfill possible (events were never collected before). Test: `analytics-wiring.test.ts` asserts event shape + SSR-safety.

**User email** (was null → now real):
Admin opens users list → `searchUsers` reads `profiles` slice → for each displayed id, `adminClient.auth.admin.getUserById(id)` → email joined in. Freshness: per request. Trust: **yes**. Edge cases: service-role unavailable → email stays null (no crash). Test: `user-service.test.ts` (populates email; null-on-throw).

---

## Phase 5 — Gap report (honesty ledger)

| # | Problem | Impact | Root cause | Sev | Fix shipped | Migration? | Instrumentation? | Backfill? |
|---|---|---|---|---|---|---|---|---|
| 1 | Dashboard revenue chart = hardcoded `MOCK_REVENUE` | Admin sees fabricated £ | Placeholder never wired to data | **P0** | ✅ real `getMonthlyRevenue` + empty state | No | No | No (reads existing `payments`) |
| 2 | Revenue analytics bar chart rendered with no data → `MOCK_DATA` | Same fabricated £ on 2nd page | Component never passed real data | **P0** | ✅ fed real data + empty state | No | No | No |
| 3 | Search analytics `property_search`/`search_no_results` never emitted | Search insights permanently empty | Events queried but never fired by app | **P0** | ✅ instrumented `search/page.tsx` | No | **Yes (added)** | Impossible (not collected) |
| 4 | Search volume `MOCK_VOLUME` shown even when PostHog connected | Random fake trend line | Placeholder fallback | **P0** | ✅ removed; honest empty message | No | No | No |
| 5 | "DAU"/"MAU" cards mislabeled | Misleading KPIs | Labels didn't match queries | P1 | ✅ relabeled honestly | No | No | No |
| 6 | No new-user growth metric | Can't see signups trend | Never built | P1 | ✅ New Users 30d + 12-week table | No | No | No (reads `profiles.created_at`) |
| 7 | User email always null (list + detail) | Admin can't see emails | `email:null` hardcoded (col in auth.users) | P1 | ✅ admin-client per-id lookup | No | No | No |
| 8 | Fraud page email still null | Minor | auth.users join deferred | P2 | Documented follow-up | No | No | No |

**Not collectible historically:** search query history before this change (events were never emitted). Everything else reads existing rows, so it is correct retroactively.

---

## Phase 8 — Verification

- `tsc --noEmit`: **0 errors**
- New tests: `analytics-wiring.test.ts` (14), `RevenueCharts.test.tsx` (6), `user-service.test.ts` (+2 email) — all green
- Full admin suite: 135 passing (1 pre-existing flake under CPU contention — `ListingModerationTabs` reject modal — passes 7/7 solo; unrelated to these changes)
- `pnpm build`: see build log (production build)
- Guards (`proxy.ts`, `(admin)/layout.tsx`) confirmed **unchanged** from origin — no security relaxation shipped.

## Files changed

```
src/services/admin/analytics-service.ts      + getMonthlyRevenue()
src/app/(admin)/admin/page.tsx               revenue chart fed real data, title de-mocked
src/app/(admin)/admin/analytics/revenue/page.tsx   RevenueBarChart fed real data
src/app/(admin)/admin/analytics/platform/page.tsx  honest DAU/MAU labels + New Users + growth table
src/app/(admin)/admin/analytics/search/page.tsx    removed MOCK_VOLUME, honest empty states
src/components/admin/AdminDashboardCharts.tsx      data prop, no MOCK, empty state
src/components/admin/RevenueBarChart.tsx           no MOCK_DATA, empty state
src/services/admin/user-service.ts                 real email via admin client (per-id)
src/app/(main)/search/page.tsx                      fire property_search / search_no_results
src/__tests__/admin/analytics-wiring.test.ts        NEW
src/__tests__/m3/admin/RevenueCharts.test.tsx       NEW
src/__tests__/admin/user-service.test.ts            +2 email tests
```

## Follow-ups (not blocking)

- Fraud-detection email via service-role join on `auth.users` (P2).
- Consider a real DAU metric: add a lightweight `page_view`/session ping table or read PostHog `$session` for true active-user counts (currently only PostHog-side).
- If `payments` grows large, move `getMonthlyRevenue` aggregation into a SQL `date_trunc` group-by RPC instead of JS.
- Live-refresh: analytics are RSC-per-request / 5-min PostHog cache. A visible "last updated" stamp + optional polling could be added to `/admin/analytics/*` if true real-time is required.
