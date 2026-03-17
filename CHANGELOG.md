# Changelog

All notable changes to this project will be documented in this file.

## [0.3.2] - 2026-03-17

### Fixed
- Strip ILIKE wildcard characters (`%`, `_`) in `sanitizePostgrestInput()` to prevent filter bypass

## [0.3.1] - 2026-03-17

### Added
- **Marketplace Discovery** — Service Directory page at `/services` with category browsing and search
- **Specialist Search Pages** — Dedicated pages for mortgage brokers, conveyancers, surveyors, and architects
- **Job Board** — SSR job board at `/jobs` with postcode masking for privacy
- **Agent Search** — Enhanced agents page with area filter (county/city) and rating filter
- **Compare Bar** — Floating UI for comparing up to 3 providers side-by-side; compare API endpoint at `/api/marketplace/compare`
- **Provider Profile Redirect** — ProviderCard links now use `/services/[category]/[slug]` URL structure

### Fixed
- RPC parameter rename `p_category` → `p_service_category` in provider service
- `localStorage` safety guards for SSR environments in marketplace utilities
- DRY label deduplication in marketplace filter components
- Budget cross-field validation (max >= min) and past-date guard in `rfqCreateSchema`
- Extract shared `sanitizePostgrestInput()` for consistent PostgREST filter sanitization across agents, admin, CRM, and category pages
- `GBPToPence` → `gbpToPence` to match currency.ts export

### Changed
- Added service categories: `builder`, `plasterer`, `painter`, `carpenter` to marketplace schemas
- Added `reviewEditSchema` for 48-hour review edit window

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
