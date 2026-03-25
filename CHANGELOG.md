# Changelog

All notable changes to this project will be documented in this file.

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
