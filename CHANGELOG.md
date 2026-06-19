# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0.1] - 2026-06-19 — Test type-check gate

Added a CI type-check gate (`pnpm typecheck` → `tsc --noEmit`) to the `app`
workflow and cleared the 36 pre-existing TypeScript errors that had accumulated
in test/spec/e2e files — none of which any prior gate caught (Vitest transpiles
via esbuild without type-checking; `next build` only checks the app's module
graph, not orphan test files). Fixes #57.

Most were test-fixture drift behind evolved production types (deposits, provider
invoices, notifications, listings, agent leads). One was a genuine production
type bug surfaced by the cleanup: `updateListing` reads and acts on `input.status`
at runtime (it's in `LISTING_FIELDS` and drives the publish guard) but
`UpdateListingFullInput` omitted it, so no caller could legally publish — now
widened to include `status?: ListingStatus`. Also bumped tsconfig `target` to
ES2018 (dotAll regex flag) and added an ambient `*?raw` import declaration.

## [0.3.0.0] - 2026-06-18 — Value my property: indicative AVM journey

Dedicated "Value my property" valuation journey, fixing the CTA that previously
opened general search. Anonymous flow: postcode → exact address → confirm/correct
details → review → "estimate ready" → passwordless email-OTP account → saved
result → optional agent handoff. Server-persisted sessions (no localStorage for
sensitive state); RLS-scoped tables (`valuation_sessions/results/comparables/
model_versions/model_metrics/agent_leads/consent_events`).

Explainable comparable-sales AVM (model `vmp-comparables-1.1.0`) over real HM Land
Registry `price_paid_data` (~31M rows): category-A filtering, robust weighted
median/trimmed mean, similarity weighting (recency, true postcode-centroid
distance, type, tenure, new-build), real UK HPI time-adjustment, and an A–E
evidence/fallback hierarchy that declines rather than fabricating a number
(e.g. Scotland, which is absent from the data). Open data ingested with no
third-party API: UK HPI (150,705 rows) + 1,746,976 Code-Point Open postcode
centroids (GeoPackage → WGS84).

Measured out-of-time backtest (150 targets): MdAPE 17.3%, within-20% 56.7%,
range coverage 72.7% — no accuracy claimed beyond what is measured.

Email-OTP is Supabase passwordless (rate-limited, generic responses, no
enumeration); a valuation is attached only to the verified owner; agent sharing
requires explicit consent and never implies marketing. Privacy/legal copy flagged
for counsel review. Analytics funnel + Sentry failure capture wired. Coverage:
54 unit, 20 db-tests, integration (real data + OTP/claim + agent-lead), and a
13-scenario E2E + accessibility suite (local Supabase + Mailpit).

## [0.2.1.0] - 2026-06-17 — Property-detail Local Area data layers

Real, source-attributed local-area data on every property page, each layer
self-gating so a widget only shows when it has real data. Buyers see what's
nearby — schools, crime, stations, broadband, flood risk, and how walkable,
transit-served, and bikeable the location is.

### Added

- **Transport** — nearby rail/tube/tram/ferry stations from NaPTAN, stored in a
  `transport_stops` PostGIS table with a `get_nearby_transport_stops` RPC
  (dedupes multi-entrance stations to the nearest). Ingest:
  `scripts/ingest-naptan.mjs`.
- **Broadband** — Ofcom Connected Nations availability by postcode
  (`broadband_coverage`), shown as Superfast/Ultrafast/Gigabit tiers (no
  fabricated Mbps — Ofcom's open data is availability %). Ingest:
  `scripts/ingest-ofcom-broadband.mjs`.
- **Flood risk** — Environment Agency NaFRA2 band (Very Low → High) via a live
  WMS point query, Redis-cached. `flood-service.ts`.
- **Mobility scores** — independent walk/transit/bike scores (0–100),
  precomputed into `mobility_scores` from OpenStreetMap (Overpass) plus our
  transport data. Not affiliated with Walk Score®. Ingest:
  `scripts/ingest-mobility-scores.ts`, with a daily backfill workflow
  (`.github/workflows/mobility-backfill.yml`).
- All ingest scripts verify TLS against a pinned Supabase root CA
  (`scripts/certs/supabase-prod-ca-2021.crt`).

## [0.2.0.0] - 2026-06-15 — Wandsworth median sold-price maps

Median registered sold price by postcode district, visualised as a colour-coded
map. MVP scoped to one borough (Wandsworth) to validate the visual and the
pricing algorithm before scaling. Not a £/m² product — no floor-area data, so
the honest metric is median sold price with transaction count and confidence.

### Added

- **`/search/map` — price heatmap.** MapLibre choropleth of median sold price by
  postcode district (green = lower → red = higher), with a filter bar (property
  type, time window), a ranked sub-area panel (bottom sheet on mobile),
  hover/click area card, and a fixed legend. Districts with fewer than 5 sales
  render neutral grey ("insufficient data").
- **`/search/market-map/[area]` — area price explorer.** Median / transactions /
  data-period / confidence summary cards, a quarterly median-price trend chart,
  a focused map, sub-areas ranked cheapest → most expensive, recent
  transactions, and a disclaimer that this is not a £/m² estimate.
- **`GET /api/market-map`** (+ `/api/market-map/transactions`). GeoJSON
  FeatureCollection of median sold price by postcode district, computed
  read-only over the existing `price_paid_data` (HM Land Registry) table — no
  schema change. Robust local log/percentile colour scale; confidence by
  transaction count; `metadata.sqm_available: false`.
- Navigation + command-palette links under Buy → Data. Unit tests for postcode
  normalisation, median, confidence classification, and colour-bucket assignment.

## [0.1.0.0] - 2026-05-22 — Memo Pivot v2

Full implementation of the strategy memo at
`/Users/jojominime/britv3/docs/britestate_strategy_memo.md`. Replaces the
SaaS-only model with a Hemnet-style 7-segment platform. No follow-ups — every
code-touching workstream from the memo ships in this PR.

### Added

- **/pricing — 7 segment tabs.** Sellers (one-off), Estate Agents, Landlords,
  Providers, Niche Professionals (Conveyancer / Surveyor / Mortgage broker),
  Developers, Traders. Memo prices verbatim. Monthly/annual toggle hidden for
  one-off segments. ARIA tablist semantics. CTA buttons POST to
  `/api/billing/checkout` and surface `data-plan-id` for analytics.
- **New segment landing pages**: `/sellers`, `/developers`, `/traders` with
  hero + tier cards + CTAs into `/pricing?tab=<segment>`.
- **`/fee-transparency`** — full commission table across all seven segments,
  with Rightmove / Checkatrade / Hemnet benchmarks.
- **Tier-banded provider commission** — `calculatePlatformFee({ grossAmountPence,
  providerPlanId })` exposes the new 12% / 10% / 6% bands (Listed / Pro / Elite)
  per `src/lib/commission-rates.ts`. Flat 0.025 retained only for legacy display
  paths.
- **Sellers default-tier A/B harness** (PostHog feature flag
  `sellers_default_tier`): `src/lib/experiments.ts` + server endpoint
  `/api/experiments/exposure`. Pricing tab fires exposure once per session.
  `?force_variant=plus` highlights the Plus card for QA.
- **Programmatic SEO** — dynamic `/services-near/[service]/[postcode]` route
  with `generateStaticParams` over `buildDefaultMatrix()` (43 postcode areas
  × 12 services = 516 prerendered URLs; expandable to 10K via the matrix
  builder + Land Registry ingest).
- **AI SDR campaign scaffold** — `enqueueOutbound` / `processBatch` queue
  with deterministic jobId hashing (idempotent), per-batch throttle of 200,
  three personas (trade / agent / developer). Admin UI at `/admin/sdr`.
  Migration `20260522000001_sdr_campaigns.sql` defines `sdr_campaigns`,
  `sdr_targets`, `sdr_messages` with admin-only RLS.
- **Invite-only seed onboarding** — `BRIT-<AUDIENCE>-<NONCE>` codes with
  per-audience quotas (memo: trade 50 / agent 10 / developer 20). `/signup`
  honours `?invite=…` and renders an invite chip. Migration
  `20260522000002_invite_codes.sql` defines `invite_codes` with RLS.
- **Pricing-review analytics dashboard** at `/admin/pricing-review` — MRR by
  segment, paying users, churn, vs memo targets (conservative 120 / base 600
  / bull 2,000).
- **Stripe provisioning** — `scripts/stripe-setup/create-pricing-v2.ts`
  idempotently creates 24 Products + 39 Prices in test mode via the Stripe
  SDK, plus `scripts/stripe-setup/verify-pricing-v2.ts` that exit-codes
  non-zero on drift.

### Changed

- **`src/lib/billing-config.ts`** rewritten to a 7-segment schema. New plan
  type carries `pricingType`, `commissionRate`, `commissionLabel`, `perLeadFee`.
  PLANS_BY_SEGMENT + ALL_PLANS + getPlansBySegment helpers. ALLOWED_PRICE_IDS
  auto-derived. Legacy PLANS_BY_ROLE retained for back-compat callers.
- **Plan entitlements** — new plan ids added to `src/lib/plan-entitlements.ts`;
  legacy ids retained so in-flight subscriptions keep their feature gates.
- **Navigation** — `src/config/navigation.ts` MegaMenu "List / Sell" gains
  Developers/Traders entries; Footer "Services" lists Sellers/Developers/
  Traders; "Company" gains Pricing + Fee Transparency. Command palette
  indexes all four new pages.
- **Sitemap** — `src/app/sitemap.ts` appends the 516 programmatic SEO URLs
  plus the new segment landings.
- **Middleware PUBLIC_ROUTES** — `/sellers`, `/developers`, `/traders`,
  `/fee-transparency`, `/services-near`, `/signup` added.
- **`/signup` no longer redirects to `/register`** — it is now a real
  invite-aware signup page.

### Removed

- Old pricing E2E spec at `tests/e2e/pricing-page.spec.ts` (orphaned —
  Playwright testDir is `./e2e`). Superseded by the rewritten
  `e2e/pricing-page.spec.ts` asserting the new prices.

### Verification

- Unit tests: 1,676 passing, 0 failing. Memo-pivot specs alone add 64 tests
  across billing-config, commission-rates, provider-payment-service,
  experiments, invite-codes, postcode-service-matrix, sdr-campaign-service,
  pricing-metrics-service.
- E2E: 17 screenshot tests passing (29 PNGs in `docs/pricing-v2/screenshots/`).
- Stripe: `verify-pricing-v2.ts` confirms 24/24 plans + boosts present in
  test mode.

## [0.0.2.1] - 2026-03-25

### Added
- Seller dashboard: CPUTR material information declaration checkbox — sellers must confirm legal compliance before publishing a listing
- Seller dashboard: short lease warning when leasehold years < 80 — surfaces mortgage difficulty risk at listing creation
- Seller dashboard: tenure, EPC band, and council tax band tooltips for first-time sellers
- Seller dashboard: empty state with "Create Your First Listing" CTA on dashboard home
- Seller dashboard: clickable KPI cards linking to relevant sections
- Seller dashboard: review checklist items navigate to the relevant wizard step for editing
- Seller dashboard: unverified buyer warning when accepting an offer without proof of funds
- Atomic offer acceptance cascade via Supabase RPC — accepts offer, updates listing to "under_offer", creates sale progression record, rejects all other pending offers in one transaction

### Fixed
- **Security (CRITICAL):** Prompt injection in AI description generator — user-supplied address was interpolated directly into Claude prompt; now uses structured system/user messages via `callClaude()`
- **Security (HIGH):** AI description route bypassed `callClaude()` spend limits and rate limiting — refactored to use centralized wrapper
- **Security (HIGH):** Push notification endpoint used `SUPABASE_SERVICE_ROLE_KEY` as bearer token — replaced with dedicated `PUSH_SECRET` env var
- **Security (HIGH):** Unsubscribe token utility had hardcoded `"dev-secret-not-for-production"` fallback — now throws if secret is missing
- **Security (MEDIUM):** Updated `file-type` from 21.3.0 to 21.3.4 — patches ZIP decompression bomb (GHSA-j47w-4g3g-c36v) and ASF infinite loop (GHSA-5v7r-6r5c-r473)
- **Security:** PostHog `us-assets.i.posthog.com` CDN added to CSP `script-src` and `connect-src` — analytics was silently blocked
- Seller offer ownership verification — `respondToOffer()` now checks `seller_id` + `status = "pending"` (prevents unauthorized access and concurrent action conflicts)
- Seller listing wizard: EPC certificate now required for publishing (was optional — violates UK Energy Performance of Buildings Regulations 2012)
- Seller listing wizard: `beforeunload` warning prevents accidental data loss when closing browser mid-step
- Seller listing wizard: step-skip prevention — direct URL navigation to later steps now validates prior step data exists
- Seller listing wizard: photo upload saves each photo individually — partial batch failure no longer loses all successfully uploaded photos
- Seller listing wizard: added `TouchSensor` for mobile photo drag-and-drop reordering
- Seller listing wizard: 20MB file size limit enforced on photo upload
- Seller listing wizard: HEIC/HEIF photo format support added (iPhone users)
- Seller listing wizard: price input now formats with commas inline as you type
- Seller dashboard: performance chart now aggregates views across all active listings (was showing only the first)
- Seller dashboard: `getSellerListings()` N+1 query replaced with 2 batched queries (was 10 queries per listing)
- Seller dashboard: duplicate listing detection — prevents creating a second listing at the same address
- Seller offers: counter-offer of £0 or less now rejected with validation error

## [0.0.2.0] - 2026-03-25

### Added
- GDPR-compliant terms acceptance + marketing consent checkboxes on registration (UK GDPR Article 7)
- Password visibility toggle on registration form (parity with login)
- Autocomplete attributes on all auth form inputs (given-name, family-name, email, new-password, current-password)
- Renter-specific onboarding wizard with monthly rent budget, renter property types, and renter must-haves
- Security alert emails via Resend for password changes, MFA enroll/unenroll, email changes
- MFA enforcement in middleware (AAL2 check) — fail-closed for admin, fail-open for dashboard
- Gas Safe registration enforcement for gas engineers (legally required accreditation)
- Role-aware verify-email confirmed CTAs routing to role-specific onboarding
- CODEOWNERS file protecting security-critical paths
- REAUTH_HMAC_SECRET documented in .env.example
- Area hub, city, neighbourhood, sold prices, and market trends pages (Section 6)
- Area stats dashboard (6.4) with price breakdowns, trends, and stock levels
- National market trends page (6.8) with historical chart
- All section 6 pages added to dynamic sitemap
- JSON-LD structured data for area and sold prices schemas
- `safeJsonLd()` utility for XSS-safe JSON-LD rendering across all 19 structured data usages
- Property detail page: JSON-LD RealEstateListing schema + canonical URL for SEO
- Property detail page: mortgage + SDLT calculators pre-populated with listing price
- Property detail page: sold/withdrawn listings render with status banner instead of 404
- Property detail page: MEES compliance warning for rental EPC D+ ratings
- Property detail page: price reduction badge, expanded key facts grid (receptions, listed date, lease remaining)

### Fixed
- Account enumeration prevention — uniform error messages for registration and login
- Post-login redirect preservation (redirectTo param now consumed by LoginForm)
- Open redirect prevention on OAuth callback and TwoFactorForm next params
- XSS prevention in security alert email templates (HTML-escape firstName)
- Role slug type coercion — validate against VALID_ROLES before casting
- Admin audit log writes now catch and log errors (prevents silent audit trail gaps)
- Login form no longer enforces password policy (min-length removed, server validates)
- 2FA attempt limit increased from 3 to 5 (reduces false lockouts on mobile)
- SHA-pinned GitHub Actions (actions/checkout, supabase/setup-cli)
- Dedicated secrets required: REAUTH_HMAC_SECRET, STRIPE_SECRET_KEY, QUOTE_SIGNING_SECRET, PUSH_SECRET
- Inngest webhook signing key configured for verification
- Supabase .temp/ gitignored to prevent credential leaks
- Property detail page: removed hardcoded "Low" flood risk data (was showing fake data on every listing)
- Property detail page: both mobile "Book Viewing" CTAs — dead onClick and wrong anchor
- IDOR in AI quote-draft endpoint — added ownership check + explicit column selection
- Analytics event endpoint now requires authentication
- AI match prompt injection — sanitize all user-controlled fields

### Changed
- Onboarding step persistence upgraded from sessionStorage to localStorage
- MFA enforcement: admin routes fail-closed, dashboard routes fail-open

## [0.0.1.1] - 2026-03-25

### Added
- Review verification system — reviews can now be verified via booking, tenancy, or agent transaction (not just bookings)
- UK legal compliance for reviews: incentivised review labelling, defamation flag type with 48h acknowledgement SLA
- Review policy page (`/legal/review-policy`) covering moderation, verification tiers, and defamation complaints
- Area category pages (`/reviews/[area]/category/[category]`) with provider listings and aggregate stats
- Review notification emails: published, removed, provider response, and flag outcome via Resend
- Atomic offer acceptance cascade — accepts offer, updates listing to under_offer, creates sale progression, rejects other pending offers in one transaction
- Reviewable interactions API (`GET /api/reviews/reviewable`) — surfaces all bookings, tenancies, and agent transactions eligible for review

### Fixed
- Review security: ON DELETE CASCADE changed to SET NULL (reviews survive account deletion as anonymised)
- Review security: provider UPDATE RLS restricted to response columns only (providers can't edit review content)
- Review security: providers blocked from flagging their own negative reviews
- Review security: aggregate stats now recalculate on review removal (not just approval)
- Review security: text length constraints enforced at DB level (20–2000 chars)
- Seller offer ownership verification — respondToOffer now checks seller_id + pending status
- Dead PostgREST subquery with string interpolation removed from reviewable endpoint

### Changed
- Review form links to review policy, defamation added to flag reasons
- Verified/unverified badges replace generic "Approved" badge on review cards

## [0.0.1.0] - 2026-03-24

### Added
- Rate limiting on message POST endpoints (10 msgs/min/user via Upstash)
- Loading skeleton pages for `/inbox` and `/notifications` routes
- aria-live regions for real-time message and notification announcements
- ARIA roles (listbox/option/log) and aria-labels across inbox and notifications
- Keyboard navigation (Arrow/Home/End) for conversation list
- PostHog analytics: message_sent, conversation_opened, notification_clicked, attachment_uploaded, inbox_searched
- Swipe-to-archive gesture on mobile inbox conversations
- Pull-to-refresh on mobile notification feed
- Security email service stub for settings API routes

### Fixed
- Error message leaking: all 6 API catch blocks now return generic strings
- Unsubscribe token secret lazily evaluated to prevent build-time crash
- Production guard throws if token signing secrets are missing
- Scoped aria-live on notification feed to only announce new items (not re-read entire list)
- Build failure from missing security-email-service module
## [0.3.5] - 2026-03-23

### Added
- **Agent Dashboard: Chain Risk Monitoring** — Pre-computed chain risk scores for property chains via hourly Inngest cron. Chain risk badges on sale Kanban cards, chain detail dialog with vertical chain visualization, risk scoring engine with 4 factors (chain length, stall duration, stage velocity, position penalty)
- **Agent Dashboard: Unified Home** — Redesigned agent dashboard with AI Suggestions placeholder, Today's Diary section, Sales/Lettings KPI split layout, and activity overview placeholder replacing mock chart data
- **Landlord Dashboard Enhancements** — Compliance matrix page, arrears analysis with trend tracking, batch reminders API, action items card, key dates ticker, all-clear celebration banner, portfolio KPI summary on analytics page
- **Provider Dashboard Enhancements** — Mobile-first field view (today/jobs/payments pages), smart action suggestions, quote builder with sections/templates/staged payments/PDF, quote-to-booking automation via Inngest, certificate issuance framework, cash position widget, on-site payment collection with Stripe PaymentIntent
- **PostHog Analytics Events** — Dashboard v2 tracking events for all role dashboards
- **Database Tables** — `chain_links`, `chain_risk_scores` with RLS policies; HMO columns on properties; compliance matrix and key dates RPCs; payment schedules and certificates tables

### Fixed
- **Security: Next.js CSRF bypass** — Upgraded Next.js 16.1.6 → 16.2.1 (GHSA-mq59-m269-xvcx)
- **Security: jsPDF HTML injection** — Upgraded jsPDF 4.2.0 → 4.2.1 (GHSA-wfv2-pwc8-crg5)
- **Security: Contact form stored XSS** — HTML-escape all user input in email builder
- **Zod v4 API migration** — Fixed `.errors` → `.issues` and `required_error` → `message` across 4 files
- Provider dashboard routing — Map `service_provider` role to `/provider` route in login redirect
- Provider analytics — Use `resolveProviderId` instead of non-existent `id` column
- Landlord dual sidebar removed — Use parent sidebar with full landlord nav items
- Provider field view sidebar hidden via pathname detection

### Changed
- Extracted `ActivityFeedItem` type from duplicated local definitions to shared `types/agent.ts`
- Added `DiaryViewingSlot`, `AgentLettingsKpis` types
- Added shared `date-utils`, `format-money`, `compliance-constants` utility modules

## [0.3.4] - 2026-03-17

### Added
- **Account Settings: Security** — Refactored into sub-components; added Connected Accounts (OAuth link/unlink with last-provider guard), Login History (paginated, graceful fallback)
- **Account Settings: Notifications** — Upgraded to 5×4 matrix (Property Alerts, Viewings, Offers, Messages, Market Reports × Email, Push, SMS, In-App); migration-on-read from old 7-key schema; Marketing Unsubscribe section
- **Account Settings: Privacy** — 2-column layout; Quick Privacy Mode (Public/Members/Ghost one-click presets); Delete Account moved to Privacy only
- **Account Settings: Preferences** — New page with Language/Region (locale, date format, currency, timezone) and Accessibility (font size, reduced motion, high contrast, dark mode with live preview, screen reader hints)
- **Sidebar Badges** — Security Score (progress ring, 4 factors) and Privacy Shield (protection level) in settings sidebar
- **Service Directory** — Browse-by-profession page at `/services` with category grid and "Post a Job" CTA
- **Specialist Search Pages** — Dedicated pages for mortgage brokers, conveyancers, surveyors, and architects
- **Job Board** — SSR job board at `/jobs` with postcode masking, category/urgency filters, pagination
- **Agent Search Filters** — Area and minimum rating filters on `/agents` page
- **Compare Bar** — Floating UI for side-by-side provider comparison; API at `/api/providers/compare`
- **`requireAuth()` helper** — Shared auth boilerplate for API routes
- DB migration: `language_preferences` and `accessibility_preferences` JSONB columns on profiles

### Fixed
- Notification race condition — client now sends single-key `{ [key]: value }` instead of full object
- GDPR export rate limiting — Upstash 1/hour per user
- Agents page PGRST200 error — removed broken `profiles(...)` JOIN from `agent_agency_profiles` query
- Agent profiles RLS — added public read policy for agent directory
- `sanitizePostgrestInput()` — strips ILIKE wildcards (`%`, `_`) and PostgREST filter syntax
- RPC parameter rename `p_category` → `p_service_category` in provider service
- `GBPToPence` → `gbpToPence` to match currency.ts export

### Changed
- Added service categories: `builder`, `plasterer`, `painter`, `carpenter` to marketplace schemas
- Security page refactored from 788-line monolith into 4 focused components

### Removed
- `mfa-service.ts` — dead code (MFA calls inlined into components)

## [0.3.0] - 2026-03-15

### Added
- Buyer/Renter dashboard Waves 2–4 (viewings, offers, documents, services)
- Seller dashboard Phase 13 — all 18 screens (valuation, find agent, compare, profile)
- Messaging & Communication — inbox, thread view, file attachments, schedule viewing, send quote, notification centre, notification preferences
- Admin back office Wave 1 (Phases 20.1–20.10)
- Phase 21 error/system state pages (404, 403, 500, 503, offline, session-expired, rate-limited)

## [0.2.0] - 2026-03-10

### Added
- Marketplace foundation — reviews, ratings, quotes, RFQ flows
- Estate agent dashboard Phase 15
- Landlord dashboard Phase 14
- Provider/tradesperson dashboard Phase 16
- Property detail pages (Phase 5)

## [0.1.0] - 2026-03-01

### Added
- Initial Next.js 16 scaffold
- Supabase auth and database integration
- Core routing structure (auth, main, protected, dashboard)
- Base UI components (Shadcn)
