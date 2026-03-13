---
gsd_state_version: 1.0
milestone: v3.1
milestone_name: Buyer/Renter Dashboard
status: executing
stopped_at: Completed 17-service-provider-public-profiles 17-03-PLAN.md
last_updated: "2026-03-13T23:21:32.046Z"
last_activity: "2026-03-13 — Phase 8 Plan 1 complete: DB migration + TypeScript types"
progress:
  total_phases: 17
  completed_phases: 5
  total_plans: 110
  completed_plans: 62
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

### Pending Todos

- Confirm whether seller/agent dashboard has shipped viewing slot creation (needed for buyer booking flow in Phase 10)
- Decide Mojo/Habito widget vs. illustrative product table for Phase 12 mortgage comparison page
- Determine referral code backfill strategy for existing users created before Phase 8 migration

### Blockers/Concerns

- Phase 10 viewing booking flow requires agent-published viewing_slots to exist; if agent dashboard slot creation is not yet built, booking UI will have nothing to book against
- Phase 10 tus-js-client integration requires specific headers (Authorization, x-upsert) and signed upload URL flow; see STACK.md for exact pattern

## Session Continuity

Last session: 2026-03-13T23:21:32.035Z
Stopped at: Completed 17-service-provider-public-profiles 17-03-PLAN.md
Resume file: None
