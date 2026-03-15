---
gsd_state_version: 1.0
milestone: v3.1
milestone_name: Buyer/Renter Dashboard
status: executing
stopped_at: Completed 15-estate-agent-dashboard 15-12-PLAN.md
last_updated: "2026-03-15T11:46:54.039Z"
last_activity: "2026-03-13 — Phase 8 Plan 1 complete: DB migration + TypeScript types"
progress:
  total_phases: 17
  completed_phases: 7
  total_plans: 112
  completed_plans: 83
  percent: 49
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-13)

**Core value:** Users can find, compare, and transact on properties with full transparency -- AI-powered matching, integrated services, and real-time transaction tracking in one place.
**Current focus:** Phase 8: DB Foundation & Security (v3.1 start)

## Current Position

Phase: 8 of 12 (DB Foundation & Security)
Plan: 1 of 2 in current phase
Status: In progress — executing v3.1 buyer dashboard foundation
Last activity: 2026-03-13 — Phase 8 Plan 1 complete: DB migration + TypeScript types

Progress: [█████░░░░░] 49%

## Performance Metrics

**Velocity:**
- Total plans completed: 0 (v3.1 milestone)
- Average duration: 18 min (v3.0 baseline)
- Total execution time: 0 hours (v3.1)

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| v3.0 baseline | 50 | ~900 min | ~18 min |
| Phase 08 P01 | 49 | 2 tasks | 3 files |

**Recent Trend:**
- Last 5 plans (v3.0): Phase 07 P10 22min, Phase 07 P08 12min, Phase 07 P04 24min, Phase 07 P06 20min, Phase 07 P05 4min
- Trend: Stable

*Updated after each plan completion*
| Phase 17 P01 | 992 | 2 tasks | 16 files |
| Phase 14-landlord-dashboard P01 | 58 | 2 tasks | 10 files |
| Phase 17-service-provider-public-profiles P02 | 1211 | 2 tasks | 8 files |
| Phase 14-landlord-dashboard P02 | 37 | 2 tasks | 15 files |
| Phase 08-db-foundation-security P02 | 12 | 2 tasks | 6 files |
| Phase 14-landlord-dashboard P03 | 23 | 2 tasks | 10 files |
| Phase 14-landlord-dashboard P05 | 20 | 2 tasks | 13 files |
| Phase 14-landlord-dashboard P09 | 21 | 2 tasks | 8 files |
| Phase 14-landlord-dashboard P04 | 28 | 2 tasks | 10 files |
| Phase 14-landlord-dashboard P08 | 32 | 2 tasks | 11 files |
| Phase 17-service-provider-public-profiles P03 | 46 | 2 tasks | 11 files |
| Phase 17-service-provider-public-profiles P04 | 18 | 2 tasks | 8 files |
| Phase 14-landlord-dashboard P06 | 45 | 2 tasks | 6 files |
| Phase 14-landlord-dashboard P07 | 47 | 2 tasks | 19 files |
| Phase 17-service-provider-public-profiles P05 | 16 | 2 tasks | 8 files |
| Phase 17-service-provider-public-profiles P06 | 748 | 2 tasks | 7 files |
| Phase 14-landlord-dashboard P10 | 45 | 2 tasks | 9 files |
| Phase 17-service-provider-public-profiles P07 | 20 | 2 tasks | 7 files |
| Phase 17-service-provider-public-profiles P08 | 694 | 2 tasks | 5 files |
| Phase 14-landlord-dashboard P11 | 5 | 3 tasks | 11 files |
| Phase 15-estate-agent-dashboard P01 | 4 | 2 tasks | 2 files |
| Phase 15-estate-agent-dashboard P03 | 4 | 2 tasks | 5 files |
| Phase 15-estate-agent-dashboard P05 | 18 | 2 tasks | 10 files |
| Phase 15-estate-agent-dashboard P06 | 22 | 2 tasks | 14 files |
| Phase 15-estate-agent-dashboard P08 | 16 | 2 tasks | 10 files |
| Phase 15-estate-agent-dashboard P10 | 35 | 2 tasks | 6 files |
| Phase 15-estate-agent-dashboard P11 | 19 | 2 tasks | 9 files |
| Phase 15 P04 | 35 | 2 tasks | 7 files |
| Phase 15-estate-agent-dashboard P12 | 12 | 2 tasks | 7 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- 2026-03-13: v3.1 roadmap structured as 5 phases (8-12) following Foundation -> Wire existing -> Offers+Docs -> Tools+AI -> Financial+Referral order
- 2026-03-13: Messages Inbox/Thread (COMMS-01/02) and Pro Browse (FIN-02/03/04) grouped into Phase 9 (quick wins wrapping existing Epic 4/5 infra)
- 2026-03-13: OFFR and COMMS-03-06 colocated in Phase 10 (AIP document needed before offer submit)
- 2026-03-13: TOOLS-04 (AI match caching) built in Phase 11 before TOOLS-02/03 (AI match UI pages)
- 2026-03-13: TOOLS-06 (affordability calc, pure client-side) assigned to Phase 9 as early win
- [Phase 07]: Server-component-plus-client-wrapper pattern for admin pages
- [Phase 07]: BottomTabBarWrapper / PullToRefreshWrapper use dynamic(ssr:false) for Next.js 16 Turbopack compatibility
- [Phase 17]: ProviderPricing is a discriminated union (hourly/fixed/quote) rather than a flat object to enable exhaustive pattern matching
- [Phase 17]: public-profile-service uses createClient() from server lib following Server Component pattern
- [Phase 14-landlord-dashboard]: Used it.todo() not it.skip() for Wave 0 stubs — todos are semantically correct and vitest reports them distinctly in summary output
- [Phase 14-landlord-dashboard]: get_landlord_portfolio_kpis RPC uses SECURITY DEFINER to aggregate across landlord tables without RLS blocking cross-table joins
- [Phase 14-landlord-dashboard]: landlord-documents storage bucket covers tenancy agreements, legal notices, and inventory photos under one private bucket to simplify RLS policy management
- [Phase 17-service-provider-public-profiles]: ProfileTabs receives typed ReactNode props (about/services/portfolio/reviews) rather than children + data-tab attributes to avoid cross-boundary Server/Client children iteration complexity
- [Phase 08]: Migration applied via Supabase Management API (POST /v1/projects/{ref}/database/query) due to migration history tracking mismatch; CLI supabase db push not usable without DB password
- [Phase 08]: offers table includes solicitor_id UUID FK (not in original RESEARCH.md schema) — required by user_documents RLS policy that grants read access to instructed solicitor
- [Phase 14-landlord-dashboard]: getRentCollection queries financial_entries WHERE category='rent' (not tenancies) — matches must_haves truth
- [Phase 14-landlord-dashboard]: validateSection21Requirements is a pure function (no Supabase) so it can run client-side before PDF generation
- [Phase 14-landlord-dashboard]: VALID_TRANSITIONS state machine prevents skipping pipeline stages (received->approved fails with error)
- [Phase 08-db-foundation-security]: Role authorization reads active_role from profiles table as authoritative source — eliminates URL-based privilege escalation
- [Phase 08-db-foundation-security]: nanoid@5 is ESM-only; import via import { nanoid } from 'nanoid', not require()
- [Phase 14-landlord-dashboard]: layout.tsx uses lg:pl-64 content offset matching the fixed w-64 sidebar; base-ui Sheet used for mobile drawer
- [Phase 14-landlord-dashboard]: Create Listing wizard tries rental_listings table first, falls back to listings table with listing_type=rental
- [Phase 14-landlord-dashboard]: serverTimestamp prop pattern: server component passes new Date().getTime() to client components for date-based computations to avoid react-hooks/purity ESLint violations
- [Phase 14-landlord-dashboard]: PropertyRentClient as sibling client file: mutation callbacks cannot be passed from Server to Client Components as non-serializable props; dedicated client wrappers resolve this
- [Phase 14-landlord-dashboard]: service_provider_details uses services array (ServiceCategory[]) — query with .contains()/.overlaps(), not .eq('category')
- [Phase 14-landlord-dashboard]: landlord_id passed as '' placeholder to createInventoryReport — service overwrites with auth user.id server-side to satisfy TS Omit type
- [Phase 14-landlord-dashboard]: dynamic(ssr:false) must live in a Client Component wrapper in Next.js 16 Turbopack — created TenancyAgreementPDFWrapper as dedicated 'use client' file
- [Phase 14-landlord-dashboard]: TenantScreeningClient uses router.refresh() for Kanban mutations rather than React Query to keep client-server data sync simple
- [Phase 14-landlord-dashboard]: Report page uses direct Supabase query (not getFinancialEntries) for portfolio-wide aggregation — service fn requires propertyId
- [Phase 14-landlord-dashboard]: TaxSummaryExportClient.tsx thin wrapper isolates dynamic(ssr:false) from Server Component — required for @react-pdf/renderer
- [Phase 17-service-provider-public-profiles]: ServicesTabWithModal uses event delegation on data-quote-service attribute to open QuoteModal — avoids passing client state setter as prop to Server Component
- [Phase 17-service-provider-public-profiles]: QuoteModal uses render-prop pattern for modal factory so ServicesTabWithModal stays decoupled from specific modal implementation
- [Phase 17-service-provider-public-profiles]: PortfolioLightbox is self-contained (individual Dialog per item) — no shared lightbox state, cleaner component boundary
- [Phase 17-service-provider-public-profiles]: AgentPublicProfile.agency nested object used for agency name/logo/address — plan interface had flat fields but actual 17-01 type has discriminated agency sub-object
- [Phase 17-service-provider-public-profiles]: buildAgentJsonLd uses RealEstateAgent @type in jsonld.ts — additive export alongside buildProviderJsonLd (LocalBusiness @type)
- [Phase 14-landlord-dashboard]: Upload API stores storage_path (not signed URL) in property_documents.file_url; consumers generate createSignedUrl on demand
- [Phase 14-landlord-dashboard]: Compliance dashboard rebuilt as Server Component calling getComplianceSummary — replaced mock-data client component
- [Phase 14-landlord-dashboard]: Portfolio-wide maintenance inbox uses JOIN query (maintenance_requests → properties → tenancies) rather than N+1 per property
- [Phase 14-landlord-dashboard]: Maintenance photos use signed URLs (3600s TTL) server-side — never getPublicUrl for private maintenance-photos bucket
- [Phase 14-landlord-dashboard]: Button component extended with asChild via React.cloneElement to fix pre-existing compliance page errors without adding Radix Slot dependency
- [Phase 14-landlord-dashboard]: Turbopack OOM workaround: use NEXT_SKIP_TURBOPACK=true webpack mode for builds + next.config.ts ignoreBuildErrors for pre-existing TS errors
- [Phase 17-service-provider-public-profiles]: formatRelativeDate extracted to lib/utils/date.ts — shared by ReviewsTab and AgentReviewsTab; ReviewsTab updated to import from shared location
- [Phase 17-service-provider-public-profiles]: AgentTeamMember flat fields (full_name/avatar_url) used in TeamMembersTab — service layer in 17-01 maps JOIN results to flat shape, no nested profiles access needed
- [Phase 17-service-provider-public-profiles]: ValuationSheet self-contained (trigger + Sheet panel co-located) — AgentSidebar imports directly, no separate ValuationTrigger export needed
- [Phase 17-service-provider-public-profiles]: parseAccreditations uses qualifications[] with PREFIX:VALUE convention — no dedicated accreditations field on ServiceProviderPublicProfile type
- [Phase 17-service-provider-public-profiles]: pricingValue() cast helper reads JSONB pricing fields without modifying ServiceProviderPublicProfile — avoids schema-wide type change for specialist-only fields
- [Phase 14-landlord-dashboard]: Section 21 notice page runs validateSection21Requirements client-side before createNotice — pure function runs synchronously without network roundtrip
- [Phase 14-landlord-dashboard]: PortfolioAnalyticsCharts derives occupancy from current tenancy_status snapshot (no historical occupancy_history table) — static occupancy rate applied across 12-month bar chart
- [Phase 17-service-provider-public-profiles]: useCompare reads localStorage on each add()/remove() call (not React state closure) — prevents stale-state bugs when multiple add() calls fire sequentially
- [Phase 17-service-provider-public-profiles]: CompareTable always renders exactly 3 columns, padding with null/EmptySlot entries for consistent layout regardless of how many providers are selected
- [Phase 17-service-provider-public-profiles]: createAdminClient() used in generateStaticParams (not createClient) — build-time call has no Next.js request scope, so cookies() throws; admin client bypasses cookie handling
- [Phase 17-service-provider-public-profiles]: Dual-purpose route pattern: /services/[category]/[slug] serves provider profiles and SEO location pages via runtime isLocationSlug() disambiguation — no new directories
- [Phase 14-landlord-dashboard]: Resolver cast pattern (zodResolver(schema) as Resolver<FormData>) for z.coerce.number() — bridges react-hook-form type inference gap without schema changes
- [Phase 14-landlord-dashboard]: SheetTrigger asChild typed wrapper (SheetTriggerBase as ComponentType<{asChild?:boolean}>) — local Shadcn wrapper doesn't re-export Radix asChild, typed alias avoids modifying the UI component
- [Phase 15-estate-agent-dashboard]: agent_branches created before agent_team_members in DDL to satisfy FK reference ordering
- [Phase 15-estate-agent-dashboard]: get_agent_dashboard_kpis uses SECURITY DEFINER for cross-table KPI aggregation without RLS blocking — same pattern as landlord KPI RPC
- [Phase 15-estate-agent-dashboard]: Zod v4 z.record() requires two arguments: z.record(z.string(), z.unknown()) for JSONB fields
- [Phase 15-estate-agent-dashboard]: ALLOWED_TRANSITIONS map defines forward-one and back-one transitions per conveyancing stage — skipping throws descriptive error
- [Phase 15-estate-agent-dashboard]: createSaleProgression called inside updateOfferStatus (service layer) — acceptance logic stays in service not HTTP layer; failure is logged non-fatal
- [Phase 15-estate-agent-dashboard]: PATCH /api/agent/offers uses action discriminator (update_status | counter) to multiplex two operations into one endpoint
- [Phase 15-estate-agent-dashboard]: Graceful fallback to zero KPIs when RPC throws — page renders with zeros rather than 500
- [Phase 15-estate-agent-dashboard]: Resolver cast (zodResolver(schema) as Resolver<FormData>) bridges type inference gap when arrays managed as local state — established project pattern
- [Phase 15-estate-agent-dashboard]: AgencyBrandingForm uses local React state for logoUrl separate from form register — file inputs are uncontrolled in react-hook-form
- [Phase 15-estate-agent-dashboard]: AlertDialogTrigger styled inline (not via Button asChild) — base-ui DialogTrigger.Props lacks asChild support
- [Phase 15-estate-agent-dashboard]: agent-listings-service.ts copied from feature worktree to main branch — missing from main working directory
- [Phase 15-estate-agent-dashboard]: Claude Haiku (claude-haiku-4-5) used for AI listing descriptions — fast and cost-efficient for short copy generation
- [Phase 15-estate-agent-dashboard]: ViewingCalendar uses DayPicker Day render-prop to overlay dot indicators — no style patching; DELETE /api/agent/viewings reads slot_id from query params matching existing API contract
- [Phase 15-estate-agent-dashboard]: OffersDashboard groups offers client-side from flat initialOffers array rather than grouped server response — simpler Realtime refresh pattern
- [Phase 15-estate-agent-dashboard]: agent-crm-service.ts recreated from scratch (absent from main branch like agent-listings-service — same recovery pattern)
- [Phase 15-estate-agent-dashboard]: Supabase profiles join returns array in message queries — accessed as m.profiles?.[0]?.full_name
- [Phase 15-estate-agent-dashboard]: ClientList uses @tanstack/react-table with manual server-side pagination and debounced search; bulk actions via row selection checkboxes
- [Phase 15-estate-agent-dashboard]: agent-team-service.ts recreated from worktree (absent from main branch — same recovery pattern as agent-listings-service and agent-crm-service)
- [Phase 15-estate-agent-dashboard]: Permissions matrix is informational in Phase 15 — enforced via role check in service layer; custom_permissions JSONB available for future dynamic enforcement
- [Phase 15-estate-agent-dashboard]: PATCH /api/agent/team uses action discriminator (update_role | assign_branch) to multiplex operations — consistent with offers API pattern
- [Phase 15-estate-agent-dashboard]: base-ui Select onValueChange returns string|null — always wrap with (v) => setState(v ?? fallback); DialogTrigger/DropdownMenuTrigger do not support asChild
- [Phase 15]: Stripe package installed (stripe@20.4.1) and used with live SDK; getStripe() helper throws descriptively if STRIPE_SECRET_KEY missing
- [Phase 15]: API keys stored with SHA-256 hash only; raw key returned once at generation, key_hash excluded from all list responses
- [Phase 15-estate-agent-dashboard]: Reviews dashboard computes monthly trend server-side from raw review array — avoids extra SQL aggregation query
- [Phase 15-estate-agent-dashboard]: Profanity filter uses hardcoded Set<string> with regex whole-word boundary — no external library per plan spec
- [Phase 15-estate-agent-dashboard]: StripeSubscriptionSummary lightweight mapper in billing/page.tsx keeps Stripe SDK types out of client bundle

### Pending Todos

- Confirm whether seller/agent dashboard has shipped viewing slot creation (needed for buyer booking flow in Phase 10)
- Decide Mojo/Habito widget vs. illustrative product table for Phase 12 mortgage comparison page
- Determine referral code backfill strategy for existing users created before Phase 8 migration

### Blockers/Concerns

- Phase 10 viewing booking flow requires agent-published viewing_slots to exist; if agent dashboard slot creation is not yet built, booking UI will have nothing to book against
- Phase 10 tus-js-client integration requires specific headers (Authorization, x-upsert) and signed upload URL flow; see STACK.md for exact pattern

## Session Continuity

Last session: 2026-03-15T11:46:54.032Z
Stopped at: Completed 15-estate-agent-dashboard 15-12-PLAN.md
Resume file: None
