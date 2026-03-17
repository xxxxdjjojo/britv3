# Changelog

All notable changes to this project will be documented in this file.

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
