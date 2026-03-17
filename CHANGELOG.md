# Changelog

All notable changes to Britestate are documented here.

## [0.3.0] - 2026-03-17

### Added
- **Marketplace Discovery (Phase 14)**
  - Area reviews page at `/reviews/[area]` with category breakdown and weighted average rating
  - `PATCH /api/reviews/[id]/edit` — edit a review within the 48-hour window (max 2 edits, audit trail, moderation re-queue)
  - `GET /api/reviews/aggregate` — public endpoint for aggregated rating stats by area and/or category
  - `EditReviewForm` and `ReportReviewModal` UI components
  - `ReviewAggregateHero` and `ReviewCardEnhanced` components
  - Supabase migration: `area_rating_stats` view, `review_flags` unique constraint, edit history columns, review text search vector
- Rate limiting on review creation (max 3 per user per 24h) and flagging (max 10 per user per 24h)
- Shared `CATEGORY_LABELS` constant extracted to `@/lib/marketplace/category-labels` (DRY — was duplicated in 3 files)
- `localStorage.setItem` error handling in `useCompare` hook (storage-full safety)

### Fixed
- `searchProviders()` RPC param `p_category` → `p_service_category` so category filtering works on all search pages
- `GBPToPence` → `gbpToPence` import in AI Match page to match actual export in `@/lib/currency`
- `budget_max >= budget_min` and `preferred_start_date` cannot be in the past — added `.refine()` to `rfqCreateSchema`
- Added `builder`, `plasterer`, `painter`, `carpenter` to `SERVICE_CATEGORIES` in marketplace-schemas to match `ServiceCategory` type
- `409` response for duplicate review flags (previously returned 500)

## [0.2.0] - 2026-03-16

### Added

- **Property Detail Pages (5.1–5.29 + expansions)**
  - Full RSC page at `/properties/[slug]` with parallel data fetches, Suspense boundaries, and status gates (DRAFT/ARCHIVED → 404, SOLD → hides booking CTA)
  - `PropertyDetailHero` + `HeroGallery` with AI Highlights overlay and lightbox (history shim, focus management)
  - `StickyInfoBar` with Price Velocity Indicator and status-gated CTAs
  - `PropertyDetailTabs` with mobile scroll navigation
  - `FloorPlanViewer` with AI room annotations
  - `VirtualTourViewer` + `VideoTourPlayer`
  - `PriceHistoryChart` fed from Land Registry service
  - `PropertyMap` + `PropertyMapInner` with MapTiler amenity layer toggles
  - `TransportWidget` + `SchoolCatchmentWidget` (Ofsted API + Redis cache, 7-day TTL)
  - `EPCDisplay`, `FloodRiskWidget`, `CrimeStatsChart`, `BroadbandWidget`, `CouncilTaxWidget`
  - `MortgageCalculatorWidget` + `StampDutyWidget` (reuse existing calculators)
  - `RenovationROIPanel` + `RenovationScenarioCard` + `ROIConfidenceDisclosure` + `WhatIfFloorPlan` scenario overlay
  - `AskAgentForm` with fail-open Upstash rate limiter (G4: Redis down never blocks users)
  - `BookViewingModal` with atomic `claim_viewing_slot` RPC to prevent double-bookings (G3), Viewing Tracker banner
  - `AgentCardSidebar` with real DB fetch and fallback card
  - `SimilarProperties` (Suspense, postcode-district query, hides when < 2 results)
  - `RecommendedTradespeople` (GIN index postcode proximity, hides when no results)
  - `ShareModal` (copy-link + WhatsApp/Facebook/X/Email) + `ReportListingModal` (5 reasons, Zod-validated API)
  - `SavePropertyButton` with optional notes textarea, sessionStorage auth intent, 300 ms debounce
  - `SocialProofBadge` with Supabase Realtime viewer/save counts, 30 s throttle, hides at zero
  - Nightly ROI pre-compute Supabase Edge Function (`supabase/functions/nightly-roi-precompute/`)
  - DB migrations: `property_views`, `property_renovation_scenarios`, `renovation_type_benchmarks` tables; `saved_properties.notes` column; slug + postcode-district indexes

- **AI service layer**
  - `AiCallOptions` extended with optional `timeoutMs` and `model` override
  - `'roi_estimate'` added to `AiFeature` union
  - `roi-estimation-service` uses `callClaude` wrapper (rate limiting, spend kill-switch, usage logging) with Zod-validated response, 4-branch fallback, and G2 guard (returns `null` on empty benchmarks)
  - Vitest: 5-branch test suite for `roi-estimation-service` (cache hit, AI success, null fallback, JSON parse failure, empty benchmarks)

- **Seller dashboard sub-pages**
  - Viewings, Offers, Documents, Alerts, Messages pages under `/dashboard/[role]/`
  - Supporting services: `viewings-service`, `offers-service`, `documents-service`
  - Supporting hooks: `useViewings`, `useOffers`, `useDocuments`
  - API routes: `/api/viewings`, `/api/offers`, `/api/documents`, `/api/documents/[id]/download`

### Changed

- CSP headers in `middleware.ts`: added MapTiler domains to `img-src` and `connect-src`
- `next.config.ts`: permanent redirect `/dashboard/service_provider/*` → `/dashboard/provider/*`
- Removed old `service_provider` stub pages (superseded by provider dashboard + redirect)

### Fixed

- `roi-estimation-service`: G2 guard — service now returns `null` (not hardcoded estimates) when `renovation_type_benchmarks` table is empty, so UI shows "ROI temporarily unavailable"
- `roi-estimation-service`: switched from direct Anthropic SDK to `callClaude` wrapper (aligns with spend controls and usage logging)
