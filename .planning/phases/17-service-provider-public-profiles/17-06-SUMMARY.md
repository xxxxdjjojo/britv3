---
phase: 17-service-provider-public-profiles
plan: "06"
subsystem: ui
tags: [react, nextjs, server-components, tailwind, lucide, supabase, seo, json-ld, specialist-profiles]
dependency_graph:
  requires:
    - phase: 17-service-provider-public-profiles/17-01
      provides: ServiceProviderPublicProfile type + fetchProviderBySlug, fetchProviderReviews service functions + TrustBadges component
  provides:
    - src/components/providers/SpecialistHero.tsx
    - src/components/providers/SpecialistCredentials.tsx
    - src/components/providers/SpecialistSidebar.tsx
    - src/app/(main)/mortgage-brokers/[slug]/page.tsx
    - src/app/(main)/conveyancers/[slug]/page.tsx
    - src/app/(main)/surveyors/[slug]/page.tsx
  affects:
    - src/lib/providers/jsonld.ts (added buildSpecialistJsonLd)
tech_stack:
  added: []
  patterns:
    - "parseAccreditations helper parses qualifications[] using PREFIX:VALUE convention — same approach as ProviderHero"
    - "SpecialistCredentials uses pricingValue() cast helper to extract JSONB fields without requiring type changes"
    - "Category validation: each specialist page checks services.includes() and calls notFound() for wrong-category slugs"
    - "buildSpecialistJsonLd uses @type discriminated by specialistType — FinancialService/LegalService/ProfessionalService"
key_files:
  created:
    - src/components/providers/SpecialistHero.tsx
    - src/components/providers/SpecialistCredentials.tsx
    - src/components/providers/SpecialistSidebar.tsx
    - src/app/(main)/mortgage-brokers/[slug]/page.tsx
    - src/app/(main)/conveyancers/[slug]/page.tsx
    - src/app/(main)/surveyors/[slug]/page.tsx
  modified:
    - src/lib/providers/jsonld.ts
decisions:
  - "parseAccreditations parses qualifications[] using PREFIX:VALUE convention — ServiceProviderPublicProfile has no dedicated accreditations field; plan spec accreditations[] maps to qualifications[] at the service layer"
  - "pricingValue() cast helper reads JSONB pricing data without modifying ServiceProviderPublicProfile type — avoids a schema-wide type change for specialist-only fields"
  - "SurveyorCredentials falls back to RICS Level 1/2/3 display when no specific survey type qualifications are present — prevents empty survey types grid"
  - "SpecialistSidebar reads response_time_hours from pricing JSONB cast; defaults to 24h if not set"
  - "buildSpecialistJsonLd added as additive export to jsonld.ts — imports SpecialistType from SpecialistHero (single source of truth)"
metrics:
  duration_seconds: 748
  completed_date: "2026-03-14"
  tasks_completed: 2
  files_created: 6
  files_modified: 1
---

# Phase 17 Plan 06: Specialist Profiles (Mortgage Broker, Conveyancer, Surveyor) Summary

**Three specialist professional profile pages sharing SpecialistHero + SpecialistCredentials components with role-specific FCA/SRA/RICS regulatory badge rendering, fee structure display, and category-validated SSR routes.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-13T23:57:30Z
- **Completed:** 2026-03-14T00:09:58Z
- **Tasks:** 2
- **Files created:** 6, modified: 1

## Accomplishments

### Task 1: Shared Components

- `SpecialistHero.tsx` — Server Component with role-coloured avatar ring (blue-800/blue-700/[#1B4D3E]), primary regulatory badge (FCA Authorised/SRA|CLC Regulated/RICS Member), TrustBadges row, type-specific CTA buttons. Includes `parseRegBadge()` helper and exports `SpecialistType` union.
- `SpecialistCredentials.tsx` — Three named exports:
  - `MortgageBrokerCredentials`: FCA card (blue-50 bg), whole-of-market vs panel badge (green/amber), fee structure (fee-free/fixed-fee badges from pricing JSONB), lender count, specialism chips
  - `ConveyancerCredentials`: SRA/CLC registration card (Scale icon), 3-row fee table (purchase/sale/remortgage with POA fallback), turnaround badge, no-sale-no-fee badge
  - `SurveyorCredentials`: RICS membership card (Building2 icon, forest green), survey types grid (RICS Level 1/2/3 with Level/Popular/Detailed labels), turnaround time, postcode coverage pills (8 displayed + "+N more")
- `SpecialistSidebar.tsx` — Forest green CTA card with response time, contact info card (phone + email), Britestate protection blurb

### Task 2: Three Profile Pages + JSON-LD

- `/mortgage-brokers/[slug]` — SSR page, category validates `services.includes("mortgage_broker")`, generateMetadata with "| Mortgage Broker | Britestate" title, FinancialService JSON-LD
- `/conveyancers/[slug]` — SSR page, category validates `services.includes("conveyancing")`, generateMetadata with "| Conveyancer | Britestate" title, LegalService JSON-LD
- `/surveyors/[slug]` — SSR page, category validates `services.includes("surveying")`, generateMetadata with "| Surveyor | Britestate" title, ProfessionalService JSON-LD
- `buildSpecialistJsonLd()` added to `src/lib/providers/jsonld.ts` as additive export

## Task Commits

1. **Task 1: SpecialistHero + SpecialistCredentials + SpecialistSidebar** - `08b2488` (feat)
2. **Task 2: Three specialist profile pages + buildSpecialistJsonLd** - `301a2e8` (feat)

## Files Created/Modified

- `src/components/providers/SpecialistHero.tsx` — Shared hero with role ring + regulatory badge
- `src/components/providers/SpecialistCredentials.tsx` — MortgageBrokerCredentials, ConveyancerCredentials, SurveyorCredentials
- `src/components/providers/SpecialistSidebar.tsx` — Green CTA card + contact + protection blurb
- `src/app/(main)/mortgage-brokers/[slug]/page.tsx` — Mortgage broker SSR profile page
- `src/app/(main)/conveyancers/[slug]/page.tsx` — Conveyancer SSR profile page
- `src/app/(main)/surveyors/[slug]/page.tsx` — Surveyor SSR profile page
- `src/lib/providers/jsonld.ts` — Added buildSpecialistJsonLd function

## Decisions Made

- `parseAccreditations` parses `provider.qualifications[]` using `PREFIX:VALUE` convention — `ServiceProviderPublicProfile` has no dedicated `accreditations` field; the plan spec's `accreditations[]` maps to `qualifications[]` at the service layer (same approach as existing `ProviderHero`)
- `pricingValue()` cast helper reads JSONB pricing fields without modifying `ServiceProviderPublicProfile` type — avoids a schema-wide type change for specialist-only pricing fields
- `SurveyorCredentials` falls back to RICS Level 1/2/3 display when no specific survey type keys are present in qualifications — prevents empty survey types grid for providers without explicit qualification keys
- `buildSpecialistJsonLd` imports `SpecialistType` from `SpecialistHero` (single source of truth for the union type)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Adaptation] parseAccreditations uses qualifications[] not accreditations[]**

- **Found during:** Task 1
- **Issue:** Plan specified `accreditations[] JSONB array` on `ServiceProviderPublicProfile` but the actual 17-01 type has no `accreditations` field — only `qualifications: string[] | null` which follows the same `PREFIX:VALUE` convention
- **Fix:** Both `SpecialistHero` and `SpecialistCredentials` use `parseAccreditations(provider.qualifications)` which extracts PREFIX:VALUE pairs identically to what the plan described
- **Files modified:** `SpecialistHero.tsx`, `SpecialistCredentials.tsx`

## Issues Encountered

- Pre-existing test failure: `src/__tests__/pages/public.test.ts` fails because `@/app/(main)/terms/page` doesn't exist. Pre-existing, out of scope — 779/791 tests pass (todo).
- Turbopack ENOENT during first build attempt — resolved by clearing `.next` directory and using `NEXT_SKIP_TURBOPACK=true` webpack build mode (same pattern as prior phases)

## User Setup Required

None — no external service configuration required for these static profile pages.

## Next Phase Readiness

- All 3 specialist profile routes are live and serve real Supabase data
- Regulatory badges render from `qualifications[]` using PREFIX:VALUE convention
- Phase 17 specialist profile sequence complete (plans 01-06 done)

---
*Phase: 17-service-provider-public-profiles*
*Completed: 2026-03-14*
