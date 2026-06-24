# ARCHITECTURE.md — TrueDeed (britv3)

A system map of the TrueDeed platform: how the pieces fit, where business logic
lives, how data flows, and which external services back each feature. Written for
an engineer who has cloned the repo and wants the shape of the whole thing before
diving into any one corner.

> Companion docs: [README.md](README.md) (quickstart), [CONTRIBUTING.md](CONTRIBUTING.md)
> (dev workflow), [CLAUDE.md](CLAUDE.md) (agent guidance + conventions),
> [DESIGN.md](DESIGN.md) (design system), [SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md),
> [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md).

---

## 1. What this is

TrueDeed (formerly Britestate) is an all-in-one UK property portal. One codebase
serves **7 user roles**: homebuyer, renter, seller, landlord, estate agent,
service provider, and admin. It covers property search and detail pages, a national
sold-price market map, area guides, a services marketplace (RFQ → quote → booking),
messaging, notifications, role-specific dashboards, a 24-section admin back-office,
billing/subscriptions, and the TrueDeed agent-introduction ledger.

Production: **https://www.truedeed.co.uk** (apex `308` → `www`).

---

## 2. Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.2.9 (App Router), React 19.2.3, TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) + CSS custom properties in `globals.css` |
| UI | shadcn-style primitives over Radix + Base UI (`src/components/ui/`) |
| Backend | Supabase (Postgres, Auth, Realtime, Storage) — no custom server |
| Data access | Server Components → Supabase server client; client → hooks → services; TanStack Query for async client state |
| Maps | MapLibre GL + MapTiler; `@vis.gl/react-maplibre`; vector tiles via PostGIS `ST_AsMVT` |
| AI | Anthropic Claude SDK; pgvector for embeddings |
| Payments | Stripe + Stripe Connect (platform commission); GoCardless (Bacs Direct Debit) |
| Email | Resend + React Email |
| Async jobs | Inngest (20 functions) + GitHub Actions cron |
| Monitoring | Sentry (errors), PostHog (analytics + flags), Upstash Redis (rate limit + cache) |
| Package manager | pnpm 10 |

The Next.js app lives at the **repo root**. (`britv3.0/` referenced in older notes
does not exist; ignore it.)

---

## 3. Codebase layout

```
src/
├── app/              # App Router: route groups + ~242 API route handlers
│   ├── (main)/       # Public pages (search, properties, tools, legal, marketing)
│   ├── (auth)/       # Login, signup, email confirmation, MFA, reset
│   ├── (protected)/  # Authenticated: dashboards, inbox, settings, milestones
│   ├── (admin)/      # Admin back-office (24 sections)
│   ├── api/          # 45 endpoint groups, 242 route.ts handlers
│   └── auth/callback # OAuth + email-confirm exchange → role assignment
├── components/       # 614 components, organised by domain + ui/ primitives
├── services/         # Business logic by domain (~36 domains)
├── lib/              # Supabase clients, auth, guards, utilities, integrations
├── inngest/          # 20 background-job functions + client
├── emails/           # React Email templates
├── contexts/         # Global React state (auth, theme)
├── hooks/            # Client-side stateful logic
├── types/            # Shared TS types incl. generated database.types.ts
├── config/ content/ data/ perf/
├── env.ts            # @t3-oss/env-nextjs schema (validated env)
└── proxy.ts          # Middleware: route protection, RBAC, CSP, gating

supabase/migrations/  # 131 migrations (append-only, 14-digit UTC prefix)
scripts/              # Data ingest + setup + checks (land registry, EPC, etc.)
.github/workflows/    # 7 CI / cron workflows
```

**Layer responsibilities:**

| Layer | Location | Owns |
|-------|----------|------|
| Routes | `app/` | Pages, layouts, API handlers |
| Components | `components/` | UI; `ui/` primitives, feature dirs by domain |
| Services | `services/` | Business logic, the only place that composes DB + integrations |
| Lib | `lib/` | Supabase client factories, auth/guards, integration adapters, pure utils |
| Types | `types/` | Shared types + generated DB types |

Rule of thumb: routes and components stay thin; **services hold the logic**, and
within a service, pure transforms (`build*()`) are split from async IO (`get*()`)
so the transforms are unit-testable without a DB.

---

## 4. Route surface

Four App Router route groups plus standalone system pages.

### `(main)` — public, no auth
- **Product:** `/search`, `/search/map`, `/search/market-map`, `/properties/[slug]`,
  `/marketplace` + `/marketplace/[slug]`, `/area-prices`, `/sold-prices/[area]`,
  `/market-trends` + `/market-trends/national`, `/valuation`, `/value-my-property/*`
  (address → details → review → verify-email → result), `/compare`.
- **Services directory:** `/services/*` and per-profession landings + profiles
  (`/agents/[slug]`, `/architects/[slug]`, `/conveyancers/[slug]`,
  `/mortgage-brokers/[slug]`, `/surveyors/[slug]`), `/services-near/[service]`
  (programmatic SEO, SSG).
- **Tools:** 11 calculators under `/tools/*` (mortgage, stamp-duty, affordability,
  rent-affordability, buy-vs-rent, rental-yield, remortgage, moving-cost,
  energy-bill, first-time-buyer guide, mortgage-comparison).
- **Marketing / segment landings:** `/pricing`, `/fee-transparency`, `/sellers`,
  `/developers`, `/traders`, `/partners`, `/how-it-works`, `/about`, `/careers`,
  `/blog/*`, `/press`, `/investors`.
- **Legal:** ~25 pages under `/legal/*` (privacy, terms, cookies, GDPR rights,
  AML, modern-slavery, fair-housing, AI-transparency, etc.), all reusing a shared
  legal page shell.

### `(auth)` — redirects authed users to dashboard
`/login`, `/signup`, `/register` (+ `role-select`, `onboarding`), `/forgot-password`,
`/reset-password`, `/verify-email` (+ `confirmed`), `/two-factor` (+ `-setup`),
`/welcome`, and account-state pages (`account-locked`, `-suspended`,
`account-deletion-confirm`).

### `(protected)` — auth required, role + verification + subscription gated
- `/dashboard` and per-role dashboards: `dashboard/[role]` plus explicit
  `agent`, `landlord`, `seller`, `provider`, `broker` trees, and shared
  `dashboard/{saved,bookings,reviews,rfqs}`.
- `/inbox` + `/inbox/[conversationId]`, `/milestones/{job,transaction}`,
  `/notifications`, `/profile` (+ `settings`), `/settings/*`
  (account, security, notifications, preferences, privacy).

### `(admin)` — `is_admin` + admin-role permission gated
24 sections under `/admin/*`: users, roles, team, verifications, moderation,
reported, reviews, fraud, gdpr, subscriptions, billing, promo-codes, pricing-review,
sdr, email-campaigns, cms, seo, analytics, api-usage, audit-log, feature-flags,
system-health, truedeed.

### Standalone
`/auth/callback`, `/maintenance`, `/offline`, `/forbidden`, `/rate-limited`,
`/session-expired`, `/overview`, `/unsubscribe`.

**Rendering:** Server Components by default; `"use client"` only where interaction
demands it. Most public pages currently render **dynamically** because shared layout
code reads `cookies()` — see [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) for the
ISR/static opportunity. `/services-near/*` is statically generated (≥500 SSG routes).

**Known overlaps to be aware of:** `/search/map` vs `/search/market-map` (two map
surfaces), `/area-prices` vs `/sold-prices` (related price views), `/fee-transparency`
exists both top-level and under `/legal`. These are intentional today; flagged so
nobody assumes one is dead.

---

## 5. API + services layers

### API (`src/app/api/`)
242 route handlers across 45 groups. Representative groups:

| Group(s) | Purpose | Auth |
|----------|---------|------|
| `auth`, `settings` | Email-code OTP, MFA, reauth, sessions, email/password change | Session cookie + rate limit |
| `properties`, `listings`, `search`, `saved` | Property/listing CRUD, instant search, favourites | Session / public read |
| `market-map`, `market-search`, `geocode`, `address` | Area cards, MVT tiles, sold parcels, postcode + UPRN lookup | Public read |
| `providers`, `provider`, `quotes`, `rfq`, `bookings`, `reviews` | Marketplace directory, RFQ→quote→booking, ratings | Mixed public/owner |
| `seller`, `landlord`, `agent` | Role dashboard data (offers, viewings, tenants, deposits, leads, feeds) | Role + subscription |
| `valuations`, `ai`, `ai-match` | Valuation flow, AI descriptions/quote drafts, matching | Session + AI rate limit |
| `billing`, `stripe`, `truedeed` | Checkout, invoices, plans, Connect, ledger/introductions/disputes | Session / service-role |
| `gdpr`, `legal`, `admin` | Export/delete/cancel-deletion, admin operations | Reauth / admin guard |
| `webhooks/{stripe,gocardless,resend,referencing}` | Inbound provider events | HMAC / signature verified |
| `inngest` | Inngest function discovery endpoint | Inngest signing key |

### Services (`src/services/`)
~36 domains. The notable ones: `auth`, `properties` (detail + local-area layers),
`marketplace` (RFQ/quote/booking/review), `provider`/`providers` (dashboard vs
public directory), `market-map` (tiles + area stats), `valuation`, `billing`
(Stripe + GoCardless processors), `truedeed` (ledger, introductions, disputes,
dunning), `referencing` (pluggable tenant-referencing), `verification` (Companies
House + KYC), `land-registry` (PPD ingest/match), `gdpr`, `messaging`,
`notifications`, `email`, `ai`, `smart-replies`, `recommendations`, `connectors`
(partner feed ingestion), `organisations`.

### Supabase client pattern (`src/lib/supabase/`)
| Client | File | Used by | RLS |
|--------|------|---------|-----|
| Server | `server.ts` | Server Components, API routes (default) | Enforced |
| Browser | `client.ts` | Client Components | Enforced (anon key) |
| Admin | `admin.ts` | Webhooks, internal jobs, ingest | **Bypasses** (service role) |

Middleware uses `getUser()` (verifies the JWT) rather than `getSession()`. API
routes resolve the user from the server client, then authorise (owner check,
role check, admin guard, or HMAC) before touching data.

### Request flow
```
Server Component  → Supabase server client → Postgres (RLS)
Client Component  → hook → service → Supabase browser client → Postgres (RLS)
API route         → handler → service → Supabase server/admin client → Postgres
Webhook           → verify signature → service → Supabase admin client
Background job    → Inngest fn → service → Supabase admin client
```

---

## 6. Data model

Postgres via Supabase. **131 migrations** create roughly **181 tables** (deduped
`CREATE TABLE` count). Caveat: the generated `src/types/database.types.ts` types
only ~57 tables + 3 views + 110 functions, so it is **partial/stale** — regenerate
before relying on it. The "266 tables" figure in older docs traces to the v2 PRD
spec, not the live schema; treat any single table count as approximate.

**Domains:**
- **Users & auth** — `profiles`, `user_roles`, `provider_verifications`,
  `user_documents`, `deletion_requests`, `consent_records`, `auth_audit_log`.
- **Properties & listings** — `properties`, `listings`, `price_history`,
  `property_media`, `saved_properties`, `saved_searches`, `viewings`,
  `viewing_slots`, `search_analytics`.
- **Marketplace** — `service_provider_details` (**keyed by `user_id`, not `id`** —
  a known schema quirk other tables FK to), `provider_documents`,
  `provider_availability`, `provider_rating_stats`, `service_requests` (RFQ),
  `quotes`, `bookings` + `booking_state_transitions`, `reviews` +
  `review_flags`/`review_helpfulness`.
- **Transactions** — `offers` + `offer_status_history`, `transaction_milestones`,
  `service_job_milestones`, `sale_progression_stages`, `tenancies`,
  `maintenance_requests`, `financial_entries`.
- **Messaging & notifications** — `conversations`, `messages`,
  `conversation_read_status`, `platform_events` (event log; unread counts derived
  on read), `push_subscriptions`.
- **Billing** — subscription/plan tables, `billing_events` + ledger,
  `referral_codes` + `referral_conversions`.
- **TrueDeed** — `ppd_transactions` (HMLR Price Paid Data, text PK for idempotent
  re-ingest), `price_paid_data` (view), `introductions`, `outcomes`,
  `invoice_disputes`. PPD tables are service-role only (no RLS policies).
- **Geo / market-map** — see §8.
- **Admin & compliance** — `moderation_queue`, `listing_moderation`,
  `content_reports`, `compliance_certificates`, `activity_log` (partitioned by month).

**RLS approach:** enabled on all user-sensitive tables. The patterns are
owner-only (`user_id = auth.uid()`), public-read for published/verified rows
(`TO anon, authenticated`), and "no policy = service-role only" for internal/audit
tables. RLS is the primary data-access guard; route handlers add authorisation on
top.

**Functions/RPCs:** ~110, split between `SECURITY DEFINER` (role assignment, GDPR
purge, admin audit — run as owner) and `SECURITY INVOKER` (geo queries, tiles,
public search — respect RLS). Notable: `assign_role_atomic`, `switch_role_atomic`,
`providers_in_bounds`, `get_nearby_transport_stops`, `market_map_postcode_card`,
`market_map_tile`, `refresh_market_map_area_stats`, `refresh_market_map_sold_parcels`,
`get_landlord_portfolio_kpis`, `complete_user_purge`, `log_admin_action`.

**Migration policy:** append-only, full 14-digit UTC `YYYYMMDDHHMMSS_` prefix, one
logical change per file. CI guards prefix collisions via `pnpm check:migrations`.
Prod apply is manual (the auto-apply workflow was retired June 2026 after baseline
drift). See `supabase/migrations/README.md`.

---

## 7. Auth & security

Full detail and the live risk register live in
[SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md). The shape:

- **Signup → confirm → role.** Email+password or OAuth (Google/Apple). The intended
  role rides in `user_metadata.role_intent`; the role is assigned **on email
  confirmation** (not at signup) via `assign_role_atomic` in
  `app/auth/callback`. Sessions are httpOnly secure cookies.
- **Middleware (`src/proxy.ts`)** is the front gate: public/auth/protected route
  classification, redirect-to-login, professional **verification gating** (providers
  and agents must verify before paid features), **subscription gating**, **MFA/AAL2**
  enforcement when a factor is enrolled, and the **admin guard** (requires
  `is_admin` plus a non-null `admin_role` — never defaults to super_admin).
- **RBAC:** 7 product roles; admin splits into 4 admin roles (`super_admin`,
  `moderation_admin`, `ops_admin`, `dev_admin`) with a 25-permission matrix
  (`src/lib/admin-permissions.ts`). Admin actions are wrapped in
  `auditedAdminAction()` → `admin_audit_log`.
- **Signing/secrets:** HMAC for reauth tokens (5-min TTL, timing-safe),
  quote links, push, unsubscribe; webhook signatures verified before parsing
  (Stripe `constructEvent`, Resend svix, GoCardless, referencing).
- **Input handling:** Zod at boundaries; layered sanitization (`lib/sanitize.ts`
  basic strip, DOMPurify allowlist, PostgREST filter sanitization, safe JSON-LD,
  http/https-only URL validation); file uploads validated by magic bytes + size.
- **Rate limiting:** Upstash Redis with in-memory fallback
  (`lib/rate-limit-memory.ts`) on OTP, reauth, MFA, and contact endpoints.
- **Headers/CSP:** per-request nonce CSP (no `unsafe-inline` scripts in prod),
  HSTS preload, `X-Frame-Options: DENY`, nosniff, strict referrer, locked-down
  Permissions-Policy — all set in `src/proxy.ts`.
- **GDPR:** export / delete / cancel-deletion endpoints; soft-delete with 30-day
  grace then async purge (`inngest/functions/gdpr-user-purge.ts`); consent + audit
  logging.

---

## 8. Geospatial & market map

The market map and property local-area data are the most data-engineering-heavy
part of the app.

- **Storage:** PostGIS. `geography(Point,4326)` for distance (provider
  `base_location`, transport stops); `geometry(MultiPolygon,4326)` for boundaries
  and INSPIRE parcels (reprojected from BNG 27700 on ingest); `geometry(Point,4326)`
  for UPRN points.
- **Reference tables (public-read, ingest-populated):** `postcode_geography` +
  `postcode_centroids` (ONS/NSPL), `geography_boundaries` (ONS generalised),
  `parcels` (HMLR INSPIRE freehold polygons), `os_open_uprn` (OS), `transport_stops`
  (NaPTAN), `broadband_coverage` (Ofcom), `mobility_scores` (OSM/Overpass).
- **Aggregation:** `market_map_area_stats` precomputes price bands
  (median/p10/p90 in **pence**, ntile 1..9 bucket, transaction count) per geography
  × property type × window, so tiles never compute on request. Busted via
  `market_map_data_version`. `market_map_sold_parcels` joins parcels to sales with a
  £/m² bucket. Tiles served by `market_map_tile` / `market_map_sold_parcels_tile`
  (`ST_AsMVT`), with geography level chosen by zoom.
- **Property local-area layers** (`components/properties/detail/LocalAreaSection.tsx`):
  each layer self-gates (renders only when real data exists). Schools (GIAS/Ofsted)
  and crime (data.police.uk) call live APIs (Redis-cached); transport, broadband, and
  mobility are DB-backed; flood risk hits EA NaFRA2 WMS live. All under OGL.

Prices are stored in **pence** in SQL and divided by 100 for display in services.

---

## 9. External integrations

| Service | Used for | Adapter | Status |
|---------|----------|---------|--------|
| Supabase | Auth, Postgres, Realtime, Storage | `lib/supabase/*` | Live |
| Anthropic Claude | Descriptions, quote drafts, AI-match, smart replies | `services/ai/claude-service.ts` | Live (rate-limited, daily spend kill-switch) |
| Stripe + Connect | Subscriptions, provider payouts, platform commission | `lib/stripe.ts`, `services/billing` | Live |
| GoCardless | Bacs Direct Debit | `services/billing` + webhook | Live when token set |
| Resend + React Email | Transactional + security email | `services/email`, `src/emails` | Live |
| MapTiler + MapLibre | Maps, tiles | `components/map`, `components/market-map` | Live (OSM fallback) |
| PostHog | Analytics + feature flags + A/B | `lib/posthog.ts`, `lib/experiments.ts` | Live |
| Sentry | Error tracking | `lib/observability` | Live |
| Upstash Redis | Rate limit + cache | `lib/cache`, `lib/rate-limit-memory.ts` | Live (optional in dev) |
| Companies House | Agent/provider ≥2yr onboarding gate | `services/verification` | Live (set `disabled` to bypass) |
| Land Registry PPD | Sold prices, price history | `services/land-registry`, ingest scripts | Live |
| EPC dataset | Property energy ratings | `lib/epc`, ingest scripts | Bulk-dataset (no live API) |
| Referencing | Tenant referencing | `services/referencing` (pluggable) | Scaffold (`mock` active; goodlord/homelet ready) |
| KYC / Identity | Identity verification | `services/verification` (pluggable) | Scaffold (`stub`; Stripe Identity ready) |
| Web Push | Notifications | `lib/push`, serwist | Partially wired |

Pluggable adapters (referencing, KYC, address provider) default to a free/mock
implementation and switch via env var, so the app runs end to end with zero paid
third parties configured.

---

## 10. Background jobs & CI

**Inngest (20 functions, `src/inngest/functions/`):** event- and cron-driven.
Highlights: `gdpr-user-purge`, `price-drop-alerts`, `push-dispatch`,
`quote-accepted-to-booking`, `rfq-notify-providers`, `referencing-initiate`,
`stripe-webhook-dlq`, `activity-log-partitions`, and the TrueDeed suite
(`truedeed-ppd-ingest`, `-ppd-match`, `-hash-anchor` daily ledger,
`-dunning-tick`, `-dispute-emails`, `-invoice-emails`, `-expire-introductions`,
`-release-held-candidates`).

**GitHub Actions (`.github/workflows/`, 7):**
- `app-ci.yml` — PR gate: typecheck, **lint (gating since PR #83)**, unit tests,
  build; E2E link-health runs `continue-on-error`.
- `production-link-health.yml` — post-deploy + daily smoke test of live routes.
- `mobility-backfill.yml` — daily mobility-score backfill (idempotent).
- `perf-budget.yml` — report-only bundle budget + Lighthouse.
- `gstack-pre-deploy.yml`, `gstack-daily-audit.yml` — QA + listing-quality audit.
- `branch-sweep.yml` — stale-branch cleanup.

**Deploy:** Vercel on push to `main`. Migrations are applied to prod manually (see §6).

---

## 11. Conventions (quick reference)

- TypeScript strict; path alias `@/*` → `./src/*`; `import type` for types; prefer
  `type` over `interface`; branded types for domain IDs.
- Server Components by default; `ui/` for primitives, feature dirs by domain.
- Files: `PascalCase.tsx` components, `useX.ts` hooks, `kebab-case-service.ts`
  services, `api/[resource]/route.ts`.
- Styling: Tailwind v4 + CSS custom properties; no CSS modules; no Prettier (ESLint
  enforces). `no-console` is an error outside tests/scripts.
- Conventional Commits; `main` is the only long-lived branch; one worktree per task;
  squash-merge and land same day. Full workflow in [CONTRIBUTING.md](CONTRIBUTING.md).

---

*Generated from a full-codebase scan. If you change a public surface (route, API
group, integration, env var, or a major table), update the relevant section here in
the same PR.*
