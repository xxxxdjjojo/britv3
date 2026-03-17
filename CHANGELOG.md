# Changelog

All notable changes to this project will be documented in this file.

## [0.3.3] - 2026-03-17

### Added
- **Service Directory** — Browse-by-profession page at `/services` with category grid and "Post a Job" CTA
- **Specialist Search Pages** — Dedicated pages for mortgage brokers, conveyancers, surveyors, and architects
- **Job Board** — SSR job board at `/jobs` with postcode masking, category/urgency filters, pagination
- **Agent Search Filters** — Area and minimum rating filters on `/agents` page
- **Compare Bar** — Floating UI for side-by-side provider comparison; API at `/api/providers/compare`
- **Provider Profile Links** — ProviderCard now links to `/services/[category]/[slug]` URL structure

### Fixed
- Agents page PGRST200 error — removed broken `profiles(...)` JOIN from `agent_agency_profiles` query
- Agent profiles RLS — added public read policy so visitors can see agent directory
- "Find Services" nav link now points to `/services` instead of `/marketplace`
- Strip ILIKE wildcard characters (`%`, `_`) in `sanitizePostgrestInput()` to prevent filter bypass
- Extract shared `sanitizePostgrestInput()` for consistent PostgREST filter sanitization
- RPC parameter rename `p_category` → `p_service_category` in provider service
- `localStorage` safety guards for SSR environments in marketplace utilities
- Budget cross-field validation (max >= min) and past-date guard in `rfqCreateSchema`
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
