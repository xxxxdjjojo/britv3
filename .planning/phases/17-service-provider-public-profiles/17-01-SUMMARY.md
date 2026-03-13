---
phase: 17-service-provider-public-profiles
plan: "01"
subsystem: providers
tags: [database, types, service-layer, rls, test-stubs]
dependency_graph:
  requires: []
  provides:
    - supabase/migrations/017_public_profiles.sql
    - src/types/providers.ts
    - src/services/providers/public-profile-service.ts
    - src/lib/providers/category-slugs.ts
  affects:
    - "Plans 17-02 through 17-08 (all import from public-profile-service)"
tech_stack:
  added: []
  patterns:
    - "Supabase anon RLS policies for public page access without auth"
    - "Server Component service layer pattern using createClient from @/lib/supabase/server"
    - "Discriminated union for ProviderPricing (hourly/fixed/quote)"
    - "Wave 0 test stubs with it.todo() for TDD scaffolding"
key_files:
  created:
    - supabase/migrations/017_public_profiles.sql
    - src/types/providers.ts
    - src/services/providers/public-profile-service.ts
    - src/lib/providers/category-slugs.ts
    - src/__tests__/providers/metadata.test.ts
    - src/__tests__/providers/jsonld.test.ts
    - src/__tests__/providers/TradespersonProfile.test.tsx
    - src/__tests__/providers/ReviewsTab.test.tsx
    - src/__tests__/providers/PortfolioTab.test.tsx
    - src/__tests__/providers/ServicesTab.test.tsx
    - src/__tests__/providers/QuoteModal.test.tsx
    - src/__tests__/providers/SpecialistProfile.test.tsx
    - src/__tests__/agents/AgencyProfile.test.tsx
    - src/__tests__/agents/ListingsTab.test.tsx
    - src/__tests__/agents/ValuationForm.test.tsx
    - src/__tests__/compare/useCompare.test.ts
  modified: []
decisions:
  - "ProviderPricing is a discriminated union (hourly/fixed/quote) rather than a flat object to enable exhaustive pattern matching in price display components"
  - "Wave 0 test stubs use it.todo() with component imports commented out to avoid TypeScript errors from missing components while still establishing the test structure"
  - "public-profile-service uses createClient() from server lib (async) following the Next.js Server Component pattern established in prior phases"
metrics:
  duration_seconds: 992
  completed_date: "2026-03-13"
  tasks_completed: 2
  files_created: 16
  files_modified: 0
---

# Phase 17 Plan 01: DB Foundation + Service Layer Summary

SQL migration + TypeScript type system + public-profile-service data layer + 12 Wave 0 test stubs enabling all subsequent Phase 17 profile page plans to fetch real Supabase data without auth.

## What Was Built

### Task 1: DB Migration (017_public_profiles.sql)

Created `supabase/migrations/017_public_profiles.sql` with 5 structural sections:

1. **provider_portfolio_items table** — stores tradesperson work photos with sort order and category, FK to service_provider_details
2. **provider_leads table** — captures quote/contact requests from profile visitors, FK to service_provider_details
3. **7 RLS policies** — 5 anon SELECT policies (verified provider details, approved reviews, rating stats, provider services, portfolio items), 1 anon INSERT (provider_leads), 1 authenticated SELECT (providers view own leads)
4. **get_seo_category_locations() RPC** — returns (category, location, provider_count) for SEO sitemap generation, limited to verified providers and groups with >= 3 providers
5. **get_agent_public_stats(slug) RPC** — returns JSONB with active/sold listings counts, avg days to sell, avg % asking price, and rating stats for agent profile pages

### Task 2: TypeScript Types + Service Layer + Category Slugs + Test Stubs

**src/types/providers.ts** — 15 exported types:
- `ServiceProviderPublicProfile` — JOIN shape of service_provider_details + profiles + provider_rating_stats
- `PortfolioItem`, `ProviderLead`, `ProviderService` — mirror new table columns exactly
- `PublicReview` — includes embedded reviewer profile (full_name, avatar_url)
- `ProviderPricing` — discriminated union: `{ type: 'hourly'; amount; unit } | { type: 'fixed'; amount } | { type: 'quote' }`
- `AgentPublicProfile`, `AgentPublicStats`, `AgentTeamMember`, `AgentListingItem`, `PaginatedListings` — agent page shapes

**src/services/providers/public-profile-service.ts** — 8 exported async functions:
- `fetchProviderBySlug` — queries service_provider_details + profiles + provider_rating_stats JOIN by slug
- `fetchProviderReviews` — paginated (PAGE_SIZE=10) approved reviews with reviewer profile JOIN
- `fetchPortfolioItems` — ordered by sort_order
- `fetchProviderServices` — filtered to is_active=true
- `fetchAgentBySlug` — queries agent_agency_profiles + profiles JOIN
- `fetchAgentStats` — calls get_agent_public_stats RPC, returns typed AgentPublicStats
- `fetchAgentListings` — paginated listings by agent_id with status group filter
- `fetchAgentTeam` — team members by agency_id with profiles JOIN

**src/lib/providers/category-slugs.ts** — `CATEGORY_SLUGS` (DB enum → URL slug) and `SLUG_TO_CATEGORY` (reverse) for all 16 ServiceCategory values

**12 Wave 0 test stubs** — all pass in vitest todo state (exit 0), organized in providers/agents/compare directories

## Verification

- Node check: SQL migration contains all 5 required sections (provider_portfolio_items, provider_leads, TO anon, get_seo_category_locations, get_agent_public_stats) — PASSED
- TypeScript: `npx tsc --noEmit` — 0 errors in new files
- Vitest: Wave 0 stubs run and pass (todo state) — PASSED
- Git: 2 atomic commits (7460778, 6fa5d7c)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

Files verified:
- FOUND: supabase/migrations/017_public_profiles.sql
- FOUND: src/types/providers.ts
- FOUND: src/services/providers/public-profile-service.ts
- FOUND: src/lib/providers/category-slugs.ts
- FOUND: All 12 Wave 0 test stubs

Commits verified:
- 7460778: feat(17-01): add DB migration for provider_portfolio_items, provider_leads, anon RLS policies + RPCs
- 6fa5d7c: feat(17-01): add TypeScript types, public-profile-service, category slugs + Wave 0 test stubs
