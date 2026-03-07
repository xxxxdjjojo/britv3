---
gsd_state_version: 1.0
milestone: v3.0
milestone_name: milestone
status: executing
stopped_at: Completed 07-04-PLAN.md
last_updated: "2026-03-07T21:45:44.458Z"
last_activity: 2026-03-07 -- Completed 05-04 Calculator UI & Financial Tools
progress:
  total_phases: 7
  completed_phases: 4
  total_plans: 53
  completed_plans: 47
  percent: 60
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-07)

**Core value:** Users can find, compare, and transact on properties with full transparency -- AI-powered matching, integrated services, and real-time transaction tracking in one place.
**Current focus:** Phase 6: Landlord Tools

## Current Position

Phase: 6 of 7 (Landlord Tools)
Plan: 5 of 5 in current phase
Status: Executing
Last activity: 2026-03-07 -- Completed 05-04 Calculator UI & Financial Tools

Progress: [██████░░░░] 60%

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 6 min
- Total execution time: 0.47 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 5 | 28 min | 6 min |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 01 P04 | 9min | 2 tasks | 13 files |
| Phase 01 P07 | 16min | 2 tasks | 16 files |
| Phase 01 P08 | 16min | 2 tasks | 16 files |
| Phase 04 P01 | 6min | 2 tasks | 3 files |
| Phase 04 P02 | 8min | 2 tasks | 12 files |
| Phase 04 P04 | 23min | 2 tasks | 12 files |
| Phase 05 P02 | 18min | 2 tasks | 7 files |
| Phase 04 P03 | 22min | 2 tasks | 5 files |
| Phase 05 P03 | 23min | 2 tasks | 10 files |
| Phase 04 P06 | 26 | 2 tasks | 9 files |
| Phase 06 P01 | 23min | 2 tasks | 8 files |
| Phase 03 P02 | 26min | 3 tasks | 14 files |
| Phase 02 P01 | 21min | 2 tasks | 9 files |
| Phase 03 P01 | 30min | 3 tasks | 7 files |
| Phase 05 P01 | 32min | 3 tasks | 11 files |
| Phase 04 P05 | 7min | 2 tasks | 7 files |
| Phase 06 P03 | 6min | 2 tasks | 13 files |
| Phase 06 P02 | 6min | 2 tasks | 15 files |
| Phase 06 P04 | 11min | 2 tasks | 9 files |
| Phase 02 P02 | 12min | 2 tasks | 14 files |
| Phase 01 P09 | 73min | 2 tasks | 8 files |
| Phase 02 P03 | 15min | 2 tasks | 15 files |
| Phase 03 P04 | 21min | 3 tasks | 17 files |
| Phase 03 P05 | 24min | 3 tasks | 15 files |
| Phase 04 P07 | 26min | 2 tasks | 13 files |
| Phase 02 P04 | 12min | 2 tasks | 13 files |
| Phase 02 P05 | 12min | 2 tasks | 11 files |
| Phase 06 P05 | 25min | 3 tasks | 17 files |
| Phase 03 P03 | 31min | 3 tasks | 12 files |
| Phase 05 P04 | 30min | 3 tasks | 12 files |
| Phase 03 P06 | 22min | 3 tasks | 8 files |
| Phase 03 P07 | 21min | 2 tasks | 8 files |
| Phase 03 P08 | 25min | 3 tasks | 10 files |
| Phase 02 P07 | 49min | 2 tasks | 19 files |
| Phase 03 P10 | 18min | 2 tasks | 4 files |
| Phase 03 P09 | 24min | 2 tasks | 7 files |
| Phase 07 P03 | 17 | 2 tasks | 9 files |
| Phase 07 P02 | 21 | 2 tasks | 15 files |
| Phase 07 P01 | 45 | 2 tasks | 14 files |
| Phase 07 P05 | 4 | 2 tasks | 5 files |
| Phase 07 P06 | 20 | 2 tasks | 8 files |
| Phase 07 P04 | 24 | 2 tasks | 7 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- 2026-03-07: Planning docs rebuilt using amended epic specs (epicNfinal.md for epics 4-11, originals for 1-3)
- 2026-03-07: Requirements reduced from 161 to 139 (cost-optimized scope cuts across all epics)
- 2026-03-07: Epic 5 (Communication) merged into Phase 3 with Dashboards (previously in Phase 2)
- 2026-03-07: Epic 6 (AI) drastically reduced -- only AI property descriptions at MVP; rest is SQL/static
- 2026-03-07: Epic 8 (Financial) reduced to 2 calculators + affordability display; merged into Phase 5 with AI
- 2026-03-07: Epic 9 (Mobile) changed from 4 native apps to PWA-only ($0/mo vs $1,400/mo)
- 2026-03-07: Target monthly infrastructure: ~$50/mo at launch, ~$800/mo at 100K MAU
- 2026-03-07: Used Readonly<{}> wrapper on all entity types for immutability
- 2026-03-07: Database type kept as stub, to be replaced by supabase gen types output later
- 2026-03-07: ROLES constant uses Lucide icon name strings (not components) for serialization flexibility
- 2026-03-07: Used zod main export (not zod/v4) for @t3-oss/env-nextjs compatibility
- 2026-03-07: Kept Shadcn dark mode via .dark class + prefers-color-scheme auto-apply for flexibility
- 2026-03-07: All brand colors, fonts, shadows, radii configured via Tailwind v4 @theme block in globals.css
- 2026-03-07: Auth service uses pure functions (not class) for tree-shaking and simplicity
- 2026-03-07: getUser() used instead of getSession() for secure server-side verification
- 2026-03-07: Google OAuth adds access_type: offline, prompt: consent for refresh token support
- 2026-03-07: Middleware uses btoa(crypto.randomUUID()) for CSP nonce -- simple, crypto-strong
- 2026-03-07: Middleware creates own Supabase client (not lib helper) for direct cookie access
- 2026-03-07: Auth routes redirect authenticated users to /dashboard (generic, not role-specific)
- 2026-03-07: Header uses scroll detection for shadow-sm; protected layout uses getUser() for security
- 2026-03-07: Homepage served from (main) route group; old root page.tsx removed
- 2026-03-07: MobileNav uses Sheet component sliding from left with close-on-click
- [Phase 01]: useAuth hook created in Plan 04 (not Plan 03) since UI components need client-side auth state management
- [Phase 01]: Consent initialized client-side after signup to avoid server import in client component
- [Phase 01]: Export service uses admin client (bypasses RLS) for complete Subject Access Request data
- [Phase 01]: Role service uses server Supabase client for secure mutations, useRole hook uses browser client for state
- [Phase 01]: Sidebar nav items defined as Record<UserRole, NavItem[]> config for easy extension
- [Phase 01]: Protected layout simplified to fragment-only (auth check) to avoid conflicting flex wrappers
- [Phase 01]: OnboardingFlow forms skeletal -- preference saving deferred to later phases
- [Phase 04]: provider_rating_stats is a regular table with incremental trigger updates, not a materialized view
- [Phase 04]: PostGIS GEOGRAPHY(Point, 4326) for geospatial columns; search_providers() uses ST_DWithin for radius queries
- [Phase 04]: Authenticity scoring uses database trigger heuristics (timing, caps ratio, review history)
- [Phase 04]: Used file-type ESM import directly (no dynamic import wrapper needed)
- [Phase 04]: Booking state machine defines 9 transitions including provider/user cancel from in_progress
- [Phase 04]: Spam detector uses 10-char minimum before flagging excessive caps
- [Phase 04]: Provider matching scores: category 50pts, postcode overlap 30pts, proximity 20pts, rating 4+ bonus 10pts
- [Phase 04]: Quote acceptance uses partial unique index + catch code 23505 for race condition prevention
- [Phase 04]: Inngest rfq-notify-providers: in-app notifications first, 1hr sleep, then email fallback for unread
- [Phase 05]: Fixed plan SDLT 1M test expectation from 41,250 to 43,750 (correct HMRC calculation)
- [Phase 05]: SDLT rates stored as threshold-based bands with surcharge applied additively
- [Phase 04]: Provider service uses function-per-operation pattern with Supabase client injection for testability
- [Phase 04]: Slug generated from business_name with uniqueness check and incrementing suffix
- [Phase 04]: Base location stored as PostGIS WKT (SRID=4326;POINT(lng lat)) from geocoded first service postcode
- [Phase 05]: Supabase query chain mocks use thenable pattern to match PostgREST builder behavior
- [Phase 05]: Smart replies use type-first + keyword-augmented selection capped at 4 suggestions
- [Phase 05]: PriceTrendChart extracted as client component for recharts; PriceHistory remains server component
- [Phase 04]: Moderation queue priority scoring: spam_score * 3 + fake_review_probability threshold + flag boost at >= 3 flags
- [Phase 04]: Helpfulness voting uses check-then-upsert pattern with manual count tracking
- [Phase 06]: Used inline magic byte checks (not file-type library) for file-validation.ts -- simpler, no ESM import issues
- [Phase 06]: Month-end clamping for rent period calculation (Jan 31 -> Feb 28) prevents invalid dates
- [Phase 06]: Rent status derived from payments in current period only, not stored in DB
- [Phase 03]: Redis client returns null (no-op) when UPSTASH env vars missing for graceful degradation
- [Phase 03]: Protected layout wraps children with QueryProvider for client-side async state
- [Phase 02]: Migration numbered 003 (not 002) since 002_marketplace.sql already exists from Phase 4
- [Phase 02]: SearchListingRow includes extra columns for richer search cards
- [Phase 03]: Activity log uses native PostgreSQL monthly range partitioning (not pg_partman)
- [Phase 03]: Transaction/service job milestones use deferred FKs -- parent tables in later phases
- [Phase 03]: Market pricing allows anonymous reads; no write access for regular users
- [Phase 03]: Platform events use O(1) writes per action (not per-recipient fan-out)
- [Phase 03]: Dashboard types use discriminated union with role field as discriminant
- [Phase 04]: Used StateMachineStatus type cast for canTransition compatibility between marketplace.ts BookingStatus (has disputed) and booking-state-machine.ts BookingStatus (has declined)
- [Phase 05]: Claude Haiku 4.5 selected for AI descriptions -- cost-efficient at $1/$5 per 1M tokens
- [Phase 05]: AI rate limiters lazy-initialized to avoid startup errors when Upstash env vars missing
- [Phase 05]: All AI calls route through callClaude wrapper for centralized cost/rate control
- [Phase 06]: State machine as static ALLOWED_TRANSITIONS map with canTransitionTo/getValidNextStatuses exports
- [Phase 06]: Provider assignment is simple marketplace link + manual name/ID input (no auto-RFQ per spec)
- [Phase 06]: StatusUpdateForm extracted as co-located client component in requestId page directory
- [Phase 06]: zodResolver with coerce fields requires 'as any' cast due to input/output type mismatch in react-hook-form
- [Phase 06]: Portfolio uses Supabase embedded selects (foreign key joins) for single-query data fetching
- [Phase 06]: Tenancy detail page is client component for edit/end tenancy interactions
- [Phase 06]: FinancialSummary uses client-side fetch (not React Query) since data is manually entered
- [Phase 06]: Receipt upload handled client-side via Supabase Storage SDK after API entry creation
- [Phase 06]: Period preset resolver as pure function for testability and reuse
- [Phase 02]: Query builder uses any-typed query variable to support both RPC and from() builder chains uniformly
- [Phase 02]: Amenities filter converts string[] to {key: true} object for JSONB containment query
- [Phase 02]: Default search sort is date_desc (newest first) when no sort specified
- [Phase 01]: Verification service uses client-side stage order enforcement
- [Phase 01]: Middleware skips auth checks gracefully when Supabase env vars missing
- [Phase 02]: Listing service uses Supabase client injection (function-per-operation) matching Phase 4 pattern
- [Phase 02]: PostGIS coordinates set via fire-and-forget RPC after property insert (non-blocking)
- [Phase 02]: Image processing: auto-rotate, EXIF strip, WebP 85 (2400x1800), thumbnail 400x300 cover crop WebP 75
- [Phase 02]: Max 30 images per listing enforced at service layer before processing
- [Phase 03]: Inline magic byte validation for attachments instead of file-type library
- [Phase 03]: Conversation enrichment via sequential queries per conversation, not complex SQL join
- [Phase 03]: Email templates use inline HTML strings for server-side dispatch (not React Email render)
- [Phase 03]: Critical email dispatch is fire-and-forget (void promise) to not block event creation
- [Phase 03]: NotificationBell uses Base UI PopoverTrigger directly (asChild not supported by @base-ui/react)
- [Phase 04]: Untyped useForm (no generic) with zodResolver to avoid react-hook-form Resolver type mismatch
- [Phase 04]: MarketplaceSearch as client component extracted from server page for URL-synced filters
- [Phase 02]: MapRef imported from @vis.gl/react-maplibre (not maplibre-gl) for React wrapper compatibility
- [Phase 02]: Polygon search takes priority over radius search when both params provided
- [Phase 02]: MapSearchSync renders null (behavior-only component) for clean separation of concerns
- [Phase 02]: Duplicate saves handled via unique constraint catch (code 23505) returning null gracefully
- [Phase 02]: favorite_count tracked via fire-and-forget RPC increment_favorite_count
- [Phase 02]: Saved search filters stored as JSONB, re-executed with listed_after cutoff for alert checking
- [Phase 06]: Compliance reminder logic extracted into pure module for testability across Deno and Node
- [Phase 06]: jsPDF dynamically imported on lease page only to avoid bundle impact
- [Phase 06]: Expiry status derived as pure function: valid (>30d), expiring (<=30d), expired, none
- [Phase 06]: Duplicate compliance notifications prevented via 24-hour window check in Edge Function
- [Phase 03]: Profile service uses injected Supabase client for testability (same pattern as provider-service)
- [Phase 03]: Zod v4 uses .issues not .errors on ZodError objects
- [Phase 03]: Provider details stored in profiles.provider_details JSONB column (not separate table)
- [Phase 03]: Profile page uses numeric Tab indices (base-ui pattern) with conditional provider tab
- [Phase 05]: Mocked tooltip in PersonalizedEstimate tests for visible content assertions
- [Phase 05]: OfferLetterPdf tests validate React element tree, not rendered PDF (avoids browser API dependency)
- [Phase 05]: base-ui render prop pattern used for DialogTrigger/TooltipTrigger composition
- [Phase 03]: Safe query helpers with try/catch for missing tables -- dashboard works before domain tables exist
- [Phase 03]: Single Supabase Realtime channel per user for dashboard updates (conversations + platform_events)
- [Phase 03]: StatCard uses Lucide icon name registry lookup, matching ROLES constant pattern
- [Phase 03]: AI quote service uses callClaude wrapper (not direct Anthropic SDK) for centralized rate/cost control
- [Phase 03]: Quote draft validation uses runtime shape checks instead of Zod for lightweight JSON parsing
- [Phase 03]: TooltipTrigger uses render prop pattern (base-ui) for Button composition
- [Phase 03]: Milestone ordering uses client-side sort by template order map (not DB order column)
- [Phase 03]: FilesTab queries messages API with attachments_only param, groups by image/document type
- [Phase 02]: Draft-first listing creation: form creates draft on Step 1 completion to enable media uploads in Step 4
- [Phase 02]: Zod v4 uses message instead of required_error for number schema params
- [Phase 03]: ProtectedHeader renders NotificationBell and inbox link with UnreadBadge in a sticky top bar
- [Phase 03]: Sidebar common links (inbox, notifications, profile) placed in separate nav section below role nav
- [Phase 03]: Used base-ui render prop pattern (not asChild) for Button+Link composition in dashboard components
- [Phase 03]: Stat card configurations derived from DashboardData discriminated union at render time
- [Phase 07]: Admin route group (admin)/ separate from (protected)/ with own sidebar layout -- no ProtectedHeader inheritance
- [Phase 07]: safeCount() accepts PromiseLike not Promise to match Supabase PostgREST builder return type
- [Phase 07]: Admin middleware guard queries profiles.is_admin directly using middleware Supabase client (cookie-based)
- [Phase 07]: Feature flags use NEXT_PUBLIC_ENABLE_{NAME} env vars with JSDoc upgrade path to PostHog remote flags
- [Phase 07]: PostHogProvider imported directly (not dynamic) since it has use client directive -- Next.js 16 Turbopack forbids ssr:false in Server Components
- [Phase 07]: turbopack: {} added to next.config.ts to resolve Next.js 16 Turbopack/Serwist webpack conflict
- [Phase 07]: Serwist 9.5.6 used for PWA service worker; sw.js generation requires webpack mode, not available with Turbopack default in Next.js 16
- [Phase 07]: PWA icons are placeholder solid-color PNGs generated with sharp; real icons to come from design team
- [Phase 07]: britestate_visit_count localStorage key tracks visits for deferred install prompt (shows on 2nd+ visit)
- [Phase 07]: Profanity filter uses word boundary regex anchors -- no false positives on substrings (class does not flag ass)
- [Phase 07]: flagListing is a pure function (no DB access) combining profanity + price anomaly checks -- easy to call before listing insert
- [Phase 07]: detectDuplicate uses Jaccard word-set similarity on normalized addresses (DUPLICATE_THRESHOLD=0.7)
- [Phase 07]: BottomTabBarWrapper client component wraps dynamic(ssr:false) to avoid Next.js 16 Turbopack restriction on ssr:false in Server Components
- [Phase 07]: FAQ content stored as TypeScript arrays in src/content/help-faq.ts (not MDX) for simplicity
- [Phase 07]: Contact route returns 200 when RESEND_API_KEY missing for graceful degradation without exposing infrastructure info
- [Phase 07]: VAPID lazy-init in push.ts on first sendPushNotification call to avoid startup errors
- [Phase 07]: push/send route guards with Bearer SUPABASE_SERVICE_ROLE_KEY for service-to-service calls
- [Phase 07]: IndexedDB via native API (no idb-keyval) in useOfflineData for zero-dependency offline caching
- [Phase 07]: SW runtime caching: NetworkFirst for /api/properties/* (24h), CacheFirst for cross-origin images (7d, 100 entries)

### Pending Todos

None yet.

### Blockers/Concerns

- Research flags Phase 1 RLS performance as critical risk -- tables with row-level security need careful JWT claim design
- Research flags library version verification needed before Phase 1 installation (Supabase SDK may have had major version bump)

## Session Continuity

Last session: 2026-03-07T21:45:44.451Z
Stopped at: Completed 07-04-PLAN.md
Resume file: None
