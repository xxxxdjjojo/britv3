# Britestate — Dashboard Testing Scaffolding

> **Source of truth for the dashboard test programme.** Milestone 1 deliverable.
> Generated 2026-06-16 from read-only code inspection. No app code was modified.
> Companion file: [`DASHBOARD_TEST_MATRIX.md`](./DASHBOARD_TEST_MATRIX.md) (PRD → implementation → test traceability).

**App root:** `/Users/jojominime/Documents/britv3main/britv3/` — run all `pnpm` commands here.
(The `britv3.0/` path referenced inside `CLAUDE.md` is stale; every real file resolves under `britv3/`.)

---

## 1. Product Summary

Britestate is an all-in-one UK property portal consolidating property search, a services
marketplace, transaction management, and landlord/agent tooling into one platform serving
**7 user roles + admin**. The dashboard system is the authenticated heart of the product: each
role gets a role-specific dashboard, and several surfaces (billing, settings, messaging,
notifications, reviews, RFQs, bookings) are shared across roles.

- **Stack:** Next.js 16.2.1 (App Router), React 19.2.3, TypeScript 5 (strict), Tailwind v4,
  shadcn/ui + Radix, Supabase (Auth/Postgres/Realtime/Storage), Stripe + Stripe Connect,
  Anthropic Claude + pgvector, MapTiler/MapLibre, Resend, Inngest, Upstash Redis, PostHog, Sentry.
- **Package manager:** pnpm (10.18.3).
- **Scale (verified counts):** **166** `page.tsx` under `src/app/(protected)/dashboard/` +
  **34** under `src/app/(admin)/` = **200 dashboard/admin pages**.
- **Build status (per `.planning`):** v3.0 core ~85% complete; landlord/agent/seller/provider
  dashboards substantially built, buyer/renter (v3.1) and broker partly scaffolded with mock data.

### Roles (`src/types/auth.ts` → `UserRole`)
`homebuyer`, `renter`, `seller`, `landlord`, `agent` (estate agent), `service_provider`
(provider), `mortgage_broker` (broker) — plus **admin** (separate `is_admin` + `AdminRole`).

---

## 2. Dashboard Inventory

| # | Dashboard | Base route | Directory | Pages (approx) | Build maturity |
|---|-----------|-----------|-----------|----------------|----------------|
| 1 | **Landlord** | `/dashboard/landlord` | `src/app/(protected)/dashboard/landlord/` | ~40 | **Mature** — real Supabase data across portfolio, tenancy, rent, compliance, finance, maintenance, deposits, inventory, legal |
| 2 | **Estate Agent** | `/dashboard/agent` | `.../dashboard/agent/` | ~34 | **Mature** — real data via `agent-*-service`; **nav only exposes 6 of 34 pages** |
| 3 | **Service Provider** | `/dashboard/provider` | `.../dashboard/provider/` | ~33 | **Mature** — jobs/quotes/payments/verification real; Stripe Connect feature-flagged |
| 4 | **Seller** | `/dashboard/seller` | `.../dashboard/seller/` | ~13 | **Mostly built** — real data + APIs; `enquiries` & `analytics` are "coming soon" placeholders |
| 5 | **Homebuyer** | `/dashboard/homebuyer` | `.../dashboard/[role]/` (shared) | shared | **Partial** — overview/saved/searches/viewings/documents real; `offers` & activity feed mock |
| 6 | **Renter** | `/dashboard/renter` | `.../dashboard/[role]/` (shared) | shared | **Partial** — applications/documents real; **`tenancy` page is 100% hardcoded mock** |
| 7 | **Mortgage Broker** | `/dashboard/broker` | `.../dashboard/broker/` | ~10 | **Prototype** — **5+ pages are 100% mock data** (leads, pipeline, products, reviews, fca-verification); no Supabase wiring |
| 8 | **Admin back-office** | `/admin` | `src/app/(admin)/admin/` | 34 | **Mature read / partial write** — queues & analytics render real data; many action handlers/forms incomplete |
| — | **Cross-role** (shared) | various | see §7 | ~31 | Billing (Stripe), settings, inbox (Realtime), notifications, reviews, RFQs, bookings, saved |

### Generic `[role]` pages (serve homebuyer & renter, some shared with seller/agent)
`src/app/(protected)/dashboard/[role]/` resolves for any role and contains:
`ai-match`, `applications` (+ `apply/[listingId]`), `billing/**`, `calculators`, `documents`,
`listings` (+ `new`, `[id]`, `[id]/analytics`), `moving`, `offers`, `referrals`, `saved`,
`searches`, `services`, `tenancy`, `viewings` (+ `book`, `[id]/reschedule`).

---

## 3. Route Inventory

Routing is **role-parametrised**. `src/app/(protected)/dashboard/page.tsx` reads
`profiles.active_role` and redirects to `/dashboard/{role}`. The `[role]/layout.tsx` validates the
URL role against `active_role` and redirects mismatches (defence-in-depth over middleware).

**Route-group structure** (`src/app/`):
- `(auth)/` — login, signup, password reset.
- `(main)/` — public pages (search, property detail, area guides, pricing, marketplace, blog).
- `(protected)/` — authenticated; guarded by `(protected)/layout.tsx` (`getUser()` → `/login`).
  - `dashboard/[role]/**` — generic role pages.
  - `dashboard/{seller,landlord,agent,provider,broker}/**` — role-specific pages.
  - `dashboard/{bookings,rfqs,reviews,saved}/**` — cross-role.
  - `settings/**`, `profile/**`, `inbox/**`, `notifications/**` — account/comms.
- `(admin)/admin/**` — admin back-office; guarded by `(admin)/layout.tsx` (`is_admin` + `admin_role`).
- Root system pages: `session-expired`, `rate-limited`, `forbidden`, `offline`, `maintenance`,
  `error.tsx`, `global-error.tsx`, `not-found`.

**Canonical route helpers:** `src/lib/routes.ts` — `dashboardPathForRole(role)`,
`savedDashboardPathForRole(role)`. **Role/route maps:** `src/lib/constants.ts` — `ROUTE_TO_ROLE`,
`ROLE_TO_ROUTE`, `PUBLIC_ROUTES`, `AUTH_ROUTES`, `PROTECTED_ROUTES`. `role-route-map.ts` maps DB
enum (`estate_agent`→`agent`, `service_provider`→`provider`, `mortgage_broker`→`broker`).

> Full per-page route lists (200 pages) are captured per surface in the agent inventories that fed
> this document and are enumerated in the test matrix; representative subtrees are listed in §2.

---

## 4. Component Inventory

**Shared UI (shadcn/Radix):** `src/components/ui/` — `button`, `input`, `label`, `textarea`,
`checkbox`, `radio-group`, `select`, `toggle(-group)`, `slider`, `table`, `badge`, `avatar`,
`progress`, `skeleton`, `dialog`, `alert-dialog`, `popover`, `drawer`, `sheet`, `tabs`,
`breadcrumb`, `sidebar`, `dropdown-menu`, `chart`, `card`, `separator`, `alert`, `scroll-area`,
`tooltip`, `sonner` (toast), `command`, `SafeHTML`.

**Layout:** `src/components/layout/Sidebar.tsx` (role-aware nav), `ProtectedHeader.tsx`,
`RoleSwitcher.tsx`; mobile `BottomTabBar(Wrapper).tsx`; banners `EmailVerifyBanner`,
`DeletionPendingBanner`.

**Feature component domains:** `src/components/` →
`landlord/`, `agent/`, `provider/`, `dashboard/{homebuyer,renter}/`, `seller/` (within dashboard),
`admin/` (40+ client queue/table components), `billing/`, `listings/`, `marketplace/`,
`messaging/`, `notifications/`, `property/`, `search/`, `reviews/`, `settings/`, `files/`,
`map(s)/`, `charts/`, `mobile/`, `shared/`, `auth/`.

**Notable interactive widgets:** Lead pipeline Kanban (`@dnd-kit`), 7-step listing wizard (seller),
5-step provider verification stepper + trust gauge, service-area map editor (MapTiler), MFA/TOTP
enrolment + sessions/login-history (settings security), Stripe `EmbeddedCheckout`, CMS rich editor.

---

## 5. API / Data Dependency Inventory

**Data access patterns:**
- **Server Components** fetch directly via `src/lib/supabase/server.ts` (`createClient()`), usually
  wrapping calls in domain **services** (`src/services/<domain>/*`).
- **Client Components** use hooks → services → `src/lib/supabase/client.ts`, or `fetch()` to
  `src/app/api/**` route handlers. Async client state via `@tanstack/react-query`.
- **Admin elevated ops** use `src/lib/supabase/admin.ts` (service-role).
- **Realtime:** inbox/notifications use Supabase Realtime channels.

**Service layer (`src/services/`):** `auth/`, `properties/`, `marketplace/`, `payments/`, `ai/`,
`areas/`, `provider/`, `landlord/`, `agent/`, `messaging/`, `notifications/`, `admin/`,
`dashboard/`, `billing/`, plus role-specific services (`agent-dashboard-service`,
`agent-listings-service`, `agent-offer-service`, `agent-lead-service`, `agent-crm-service`,
`agent-analytics-service`, `agent-billing-service`, `chain-risk-service`, provider job/quote/
certificate/payment/verification services, etc.).

**External dependencies per surface:**
| Dependency | Used by |
|---|---|
| Supabase (Postgres + RLS, 266 tables) | All real-data dashboards |
| Stripe + Stripe Connect | Billing (all roles), provider payments/boost (feature-flagged) |
| Anthropic Claude + pgvector | AI Match (buyer/renter), AI descriptions |
| MapTiler / MapLibre | Provider service-area editor, property maps |
| Resend | Email (viewings, campaigns) |
| Inngest | Background jobs (notifications, async flows) |
| Upstash Redis | Rate limiting, admin API-usage stats |
| PostHog | Admin analytics (search/behaviour), experiments |
| GoCardless / Companies House / HelloSign | Truedeed mandates, agent billing, verification |

**Mock / placeholder data (must NOT be treated as working live):**
- Broker dashboard — `leads`, `pipeline`, `products`, `reviews`, `fca-verification` use `MOCK_*`
  arrays (confirmed via grep). `broker/analytics`, `broker/billing` also hardcoded.
- Renter `tenancy` page — fully hardcoded property/lease/landlord data.
- Buyer/seller `offers` (generic `[role]/offers`) — mock `OfferStatus` data.
- Seller `enquiries` and `analytics` — "coming soon" placeholders.
- Generic dashboard activity feed — placeholder, no real event stream.
- Calculators — hardcoded mortgage rates (by design; no live rate feed).
- Public search renders mock results when feature flag `search_live_data` is **off**.

---

## 6. Navigation Map

**Source of truth:** `src/config/navigation.ts` — `ROLE_NAV_ITEMS[role]` (desktop sidebar) and
`TAB_CONFIG[role]` (mobile bottom tabs). The e2e suite asserts these directly.

| Role | Sidebar nav items (count) | Coverage of built pages |
|---|---|---|
| homebuyer | Overview, Saved, Searches, Viewings, Documents (5) | Core covered; ai-match/offers/moving/services/calculators **not in nav** |
| renter | Overview, Saved, Applications, Tenancy, Documents (5) | Core covered |
| seller | Overview, Listings, Viewings, Offers, Documents (5) | `documents` nav target has no dedicated page; analytics/enquiries placeholders |
| landlord | 14 items | **Full** — every nav item resolves to a real page |
| agent | Overview, Listings, Leads, Viewings, Revenue, Team (6) | **Only 6 of 34 pages reachable from sidebar**; offers/crm/analytics/sales/reviews/billing/integrations reachable only via deep links/buttons |
| service_provider | 6 items | All 6 resolve; deeper pages reached via buttons |
| mortgage_broker | Overview, Leads, Pipeline, Products, Analytics, FCA Verification (6) | Profile/Reviews/Billing/Calculators exist but **not in nav** |

**Key navigation findings (UX audit candidates):**
- **Agent**: 28 built pages are not in the sidebar — major discoverability gap (not a 404, but
  unreachable without deep links). Tests should assert nav→page parity.
- **Broker**: 4 pages exist outside nav; the in-nav pages are mock-only.
- **Seller**: `Documents` nav item lacks a destination page (potential broken link).

The shared e2e `dashboard-navigation.spec.ts` already iterates `ROLE_NAV_ITEMS`/`TAB_CONFIG` for all
7 roles, asserts each link's `href`, navigates it, checks HTTP <400, no app-error text, and a
visible heading — so **nav-link integrity for in-nav items is already covered** (see §10).

---

## 7. User Role / Permission Map

**Auth enforcement (`src/middleware.ts`):** JWT custom claims (role/plan/is_admin/admin_role) with
DB fallback; AAL2/MFA enforcement; role-route authorization (a buyer cannot load `/dashboard/agent`);
professional-verification gate (providers must be verified for most provider routes; agent
sections are open and trust-checked at action/API boundaries, not walled by verification);
subscription gate for certain routes; admin permission gate for `/admin/*`.

**Role dashboard gating:** `(protected)/dashboard/[role]/layout.tsx` validates URL role ===
`profiles.active_role`; mismatch → redirect to the user's actual dashboard.

**Provider verification gate:** provider dashboard layout requires
`active_role === "service_provider"`; verification status drives banners and some route access.
Agent dashboard sections are NOT verification-walled (subscription gate still applies).

**Admin permission model (`src/lib/admin-permissions.ts`):**
- **Roles:** `super_admin`, `moderation_admin`, `ops_admin`, `dev_admin`.
- **Permissions (22):** `manage_users`, `ban_users`, `suspend_users`, `moderate_listings`,
  `moderate_reviews`, `moderate_content`, `manage_verifications`, `manage_gdpr`,
  `manage_subscriptions`, `manage_fraud`, `view_audit_log`, `manage_cms`, `manage_seo`,
  `send_campaigns`, `manage_promo_codes`, `view_revenue`, `manage_feature_flags`,
  `view_system_health`, `view_api_usage`, `view_analytics`, `manage_team`, `manage_roles`.
- **Route→permission map** (`ADMIN_ROUTE_PERMISSIONS`): 19 admin routes gated (e.g. `/admin/users`
  → `manage_users`, `/admin/gdpr` → `manage_gdpr`). Note: `/admin/pricing-review`, `/admin/sdr`,
  and `/admin/truedeed/*` use **custom/ad-hoc admin checks**, not the permission map — a gap to test.

**Permission test priorities:** (a) cross-role URL access blocked; (b) unauthenticated → `/login`;
(c) unverified provider gating (agent sections are not verification-walled); (d) admin sub-role can only reach permitted routes;
(e) RLS denies cross-user data access (currently only DB-test covered, no negative E2E).

---

## 8. PRD Requirement Mapping

**Requirement sources (authority order):**
1. `.planning/REQUIREMENTS.md` — **formal IDs** for v3.1 buyer/renter:
   `FOUND-01..04`, `DISC-01..08`, `VIEW-01..05`, `OFFR-01..05`, `COMMS-01..06`, `TOOLS-01..06`,
   `FIN-01..04`, `REF-01..03` (41 reqs, with checkbox status + phase traceability table).
2. `.planning/ROADMAP.md`, `.planning/STATE.md` — phase status & success criteria.
3. `docs/brit estate prd 2026.txt` — master PRD (1,978 lines, 11 epics).
4. `docs/epic[1-11]*.txt` — per-epic specs (epic3 dashboards, epic4 marketplace/provider,
   epic7 landlord, epic8 financial tools, epic10 admin).

**ID scheme (confirmed for this programme):** reuse existing IDs verbatim; derive structured IDs
`<AREA>-<TOPIC>-<NN>` for the other roles — `LL-*` (landlord), `AG-*` (agent), `SL-*` (seller),
`PRV-*` (provider), `BRK-*` (broker), `ADMIN-*` (admin), `BILL-*/SET-*/MSG-*/NOTIF-*` (cross-role).
The full requirement→implementation→test traceability lives in
[`DASHBOARD_TEST_MATRIX.md`](./DASHBOARD_TEST_MATRIX.md). ~210 dashboard requirements total.

---

## 9. Feature Matrix (per-dashboard summary)

Legend — Impl: ✅ implemented (real data) · 🟡 partial/mock/placeholder · ❌ missing.
Test (UI/E2E): see §10 and the matrix for evidence; "svc" = service-layer unit tests exist.

| Dashboard | Core features | Impl | Notable gaps |
|---|---|---|---|
| Landlord | portfolio, tenancy, rent, deposits, compliance, maintenance, finance/tax, inventory, legal notices, analytics, marketplace, yield calc | ✅ (svc-tested) | No page-level/E2E UI tests; inconsistent loading states; some silent error fallbacks |
| Agent | listings (CRUD/analytics), leads Kanban, CRM, viewings, offers, sales progression, analytics, revenue, reviews, billing/boost/truedeed, team, integrations | ✅ (svc-tested) | **28/34 pages absent from sidebar**; no loading skeletons/Suspense; team/roles static |
| Provider | jobs/leads, quotes/invoices, payments (Stripe Connect), availability, services/areas, portfolio, verification (5-step), analytics, reviews, referrals, boost, field tools | ✅ (svc-tested) | Stripe Connect feature-flagged; thin page-level error states; no E2E form submission |
| Seller | 7-step listing wizard, viewings, offers, valuation, find/compare agents, sale progression | ✅/🟡 | `enquiries` & `analytics` placeholders; wizard steps untested |
| Homebuyer | overview, saved, searches, viewings (book/reschedule), documents, ai-match, calculators, moving, offers, services | ✅/🟡 | `offers` mock; activity feed placeholder; no filter/sort on saved |
| Renter | overview, saved, applications (+apply), tenancy, documents | ✅/🟡 | **`tenancy` fully mock**; applications display-only (no withdraw) |
| Broker | overview, leads, pipeline, products, calculators, analytics, profile, reviews, fca-verification, billing | 🟡 | **Mostly mock data, no Supabase**; 4 pages outside nav |
| Admin | dashboard, users, moderation, reviews, reported, verifications, roles, team, audit-log, system-health, api-usage, feature-flags, gdpr, fraud, email-campaigns, promo-codes, subscriptions, seo, cms (blog/help/landing), analytics (platform/revenue/search/behaviour), truedeed, pricing-review, sdr | ✅ read / 🟡 write | Many action handlers/forms incomplete; permission map not wired for pricing-review/sdr/truedeed |
| Cross-role | billing (9 pages), settings (account/security real; preferences/privacy/notifications stubs), inbox (Realtime), notifications, reviews, rfqs, bookings, saved | ✅/🟡 | 3 settings stubs; no error boundaries; 0 tests on these pages |

---

## 10. Testing Strategy

**Use the existing stack — do NOT add a new framework.**
- **Unit/component/integration:** Vitest + Testing Library + happy-dom — `vitest.config.mts`,
  setup `src/__tests__/setup.ts`, pattern `src/**/*.test.{ts,tsx}`.
- **DB/RLS contract:** `vitest.db.config.ts` (`pnpm test:db`, `RUN_DB_TESTS=1`).
- **E2E:** Playwright — `playwright.config.ts` (chromium desktop + iPhone 14 mobile), auth via
  `e2e/auth.setup.ts`, fixtures `e2e/fixtures/auth`, seeded roles.

**Current coverage (audited — see matrix for per-requirement detail):**
- **E2E:** ~54 spec files. `dashboard-navigation.spec.ts` covers all-role nav-link integrity +
  smoke render; `role-dashboard-redirect.spec.ts` covers role routing; `dashboard-seller.spec.ts`,
  `auth.spec.ts`, `admin-scenario-*.spec.ts` (admin **STRONG**, ~154 scenario tests),
  `pricing-*.spec.ts`.
- **Unit:** ~240+ Vitest files. **Service layers are well covered** for landlord, agent, seller,
  provider (and provider has 9 service test files; truedeed admin components have tests). 
- **DB:** ~5 contract tests (RLS, state machines).
- **Verdicts:** Landlord/Agent/Seller/Provider = STRONG service / THIN UI. Admin = STRONG.
  Homebuyer/Renter = PARTIAL (nav + smoke only). Broker = NONE beyond page load.

**Coverage gaps to close (M2–M4):**
1. **No E2E asserts a dashboard form submission** (create listing, save search, submit application,
   build quote, update profile).
2. **No empty/loading/error-state assertions** at page level.
3. **No pagination/filter/sort behavioural tests.**
4. **No negative permission/RLS E2E** (user accessing another user's resource).
5. **Broker dashboard untested**; mock-data surfaces not flagged as non-live in tests.
6. **Nav→page parity** untested for pages outside the sidebar (esp. agent's 28 hidden pages).

**Recommended sequence (each its own `/plan` pass):**
- **M2 — Route/nav/smoke:** extend `dashboard-navigation.spec.ts` to (a) all 200 pages reachable by
  deep link, (b) unknown-route 404 fallback, (c) unauthenticated redirect, (d) cross-role block.
- **M3 — Feature-level, dashboard-by-dashboard:** component + integration tests for filters, forms,
  sort, pagination, tabs, modals, and empty/loading/error states. Red → green.
- **M4 — TDD fixes:** failing test first for each broken/mocked flow, minimal fix, re-run, update
  matrix. Document any PRD-vs-implementation conflict before changing behaviour.

**Test pyramid target per dashboard:** pure logic (formatters, calculators, permission helpers,
filter/sort) → Vitest unit; reusable widgets → component tests; page data/empty/error/permission →
integration; full journeys (login → navigate → filter → submit → verify → logout) → Playwright E2E.

---

## 11. Test Data Assumptions

- **Seeded users** (`supabase/seed/seed-test-users.ts`, idempotent; `e2e/auth.setup.ts` depends on
  them): `test-buyer@`, `test-seller@`, `test-landlord@`, `test-agent@`, `test-provider@`,
  `test-admin@` `britestate.test`, password `TestPassword123!`. Renter/broker fixtures: confirm a
  seeded user exists or extend the seed before role-specific E2E.
- **Fixtures:** `src/__tests__/fixtures/` — `search-results.ts` (`MOCK_SEARCH_RESULTS`),
  `dashboard.ts`, `listings.ts`, `messaging.ts`, `landlord.ts`.
- **Mocks:** `src/__tests__/mocks/` — supabase (+landlord/storage variants), stripe, anthropic,
  maplibre, postcodes-io, redis, resend. `__mocks__/server-only.ts` for server-module unit tests.
- **Feature flags** (`src/lib/features.ts`, `NEXT_PUBLIC_ENABLE_*`): `search_live_data` (mock vs
  live search), `ai_descriptions`, `push_notifications`, `offline_mode`, `jwt_claims_middleware`,
  `local_area_intelligence`. Provider Stripe Connect gated by `FEATURE_STRIPE_CONNECT_ENABLED`.
  **Tests must pin flag state** so "works" isn't conflated with "mock fallback rendered".
- **Env (`.env.example` → `.env.local`):** required `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; payments/AI/maps/email keys as
  needed per surface. Note: a known broken local migration (NOW()-in-index) can block a clean local
  Supabase reset — confirm a working DB before DB/E2E runs.

---

## 12. Known Gaps

**Implementation gaps (treat as "not done" until fixed):**
- Broker dashboard: 5+ pages 100% mock, no persistence.
- Renter `tenancy`: hardcoded mock.
- Generic `[role]/offers`: mock data.
- Seller `enquiries`, `analytics`: "coming soon".
- Settings `preferences`, `privacy`, `notifications`: stubs.
- Many admin write actions (CMS save, campaign send, promo create, verification approve) lack
  complete handlers.
- Activity feeds (generic dashboard, agent) partly placeholder.

**Navigation/reachability gaps:**
- Agent: 28 built pages not in sidebar.
- Broker: 4 pages not in nav; Seller: `Documents` nav item has no page.

**Quality/observability gaps:**
- Sparse loading skeletons / few Suspense boundaries on role dashboards (agent especially).
- Frequent silent error fallback (catch → empty/zeros) with no user-facing error UI.
- No error boundaries on protected pages; limited accessibility attributes.
- `pricing-review`/`sdr`/`truedeed` admin pages bypass the permission map.

**Test gaps:** see §10 (no form-submission E2E, no state assertions, no negative permission tests,
broker untested).

---

## 13. Risks & Unknowns

| Risk / Unknown | Impact | Mitigation for test programme |
|---|---|---|
| Mock-data pages look "built" but aren't live | False-green tests | Flag each mock surface (§5); pin `search_live_data` off→on; assert real data path explicitly |
| Service tests are strong but **UI/page behaviour is largely untested** | Regressions invisible at the surface users touch | M3 prioritises page-level integration + E2E for forms/states |
| Agent/broker pages unreachable from nav | Users can't find features; smoke tests miss them | M2 deep-links every page; add nav→page parity assertions |
| Local Supabase reset blocked by bad migration | Can't run DB/E2E locally | Verify DB health first; document workaround before M2 DB runs |
| Renter & broker seeded users may be absent | E2E for those roles can't authenticate | Extend `seed-test-users.ts` before role-specific E2E |
| Permission map not applied to some admin routes | Unauthorised access risk | Add negative-permission E2E for `pricing-review`/`sdr`/`truedeed` |
| PRD spans PRD txt + 11 epics with mixed ID granularity | Traceability drift | Matrix pins source per requirement; reuse+derive ID scheme (§8) |
| 200 pages → large matrix | Hard to maintain | Grouped by role/area; representative interactive detail per page |
| RLS only DB-test covered | Cross-user data leakage could pass UI tests | Add negative-access E2E in M3/M4 |

---

*End of scaffolding. Keep this document updated as the source of truth as tests are added and gaps
are closed; mirror status changes into `DASHBOARD_TEST_MATRIX.md`.*
