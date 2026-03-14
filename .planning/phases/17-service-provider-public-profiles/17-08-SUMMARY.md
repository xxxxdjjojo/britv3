---
phase: 17-service-provider-public-profiles
plan: "08"
subsystem: ui
tags: [react, next.js, seo, isr, supabase, server-components, structured-data]

# Dependency graph
requires:
  - phase: 17-service-provider-public-profiles
    provides: ServiceProviderPublicProfile type, /services/[category]/[slug] route, CATEGORY_SLUGS/SLUG_TO_CATEGORY, createAdminClient, seo RPC get_seo_category_locations

provides:
  - isLocationSlug() utility — disambiguates UK location slugs from provider slugs
  - ISR category location pages at /services/[category]/[location] — e.g. /services/plumbers/london
  - ProviderSearchCard component — avatar, rating, badges, review snippet, dual CTAs (View Profile + Get a Quote)
  - CategoryPageFAQ component — <details>/<summary> accordion with FAQPage JSON-LD schema
  - seo-utils.ts — generateCategoryPageMeta, generateCategoryFAQs, formatLocationDisplay, formatCategoryDisplay
  - generateStaticParams pre-builds top 200 category/location combos from get_seo_category_locations RPC
  - export revalidate = 3600 for ISR
  - Breadcrumb nav: Home > Services > {Category} > {Location}
  - LocalBusiness ItemList JSON-LD schema for location pages

affects: [search pages, sitemap generation, SEO crawler indexing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - In-page route disambiguation: same [slug] route renders provider profile or SEO location page based on isLocationSlug() check
    - ISR with revalidate = 3600 for category location pages; provider profiles remain dynamic via live DB fetch
    - generateStaticParams at build time uses createAdminClient() (not createClient) to avoid cookies() outside request scope error
    - FAQ JSON-LD injected in CategoryPageFAQ via <script type="application/ld+json"> — no client JS needed
    - <details>/<summary> accordion for FAQ — native HTML, no JS library required

key-files:
  created:
    - src/lib/providers/location-slugs.ts
    - src/lib/providers/seo-utils.ts
    - src/components/seo/CategoryPageFAQ.tsx
    - src/components/providers/ProviderSearchCard.tsx
  modified:
    - src/app/(main)/services/[category]/[slug]/page.tsx

key-decisions:
  - "createAdminClient() used in generateStaticParams (not createClient) — build-time call has no Next.js request scope so cookies() throws; admin client uses service role key directly without cookies"
  - "In-page disambiguation preserves the locked /services/[category]/[slug] route — no new /in/ directories or separate route segments created"
  - "generateStaticParams wrapped in try/catch — returns [] if DB unavailable at build time (CI without env vars); pages render on-demand and ISR-cached on first hit"

patterns-established:
  - "Admin client pattern for generateStaticParams: use createAdminClient() not createClient() in build-time functions to avoid request-scope errors"
  - "Dual-purpose route pattern: single [slug] segment serves provider profiles and SEO location pages via runtime disambiguation"

requirements-completed:
  - PROF-01
  - PROF-06
  - PROF-12
  - PROF-13
  - PROF-14

# Metrics
duration: 12min
completed: 2026-03-14
---

# Phase 17 Plan 08: ISR SEO Category Location Pages Summary

**ISR location pages at /services/[category]/[location] with in-page slug disambiguation, ProviderSearchCard, CategoryPageFAQ, and FAQPage + ItemList JSON-LD for Google organic discoverability**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-14T00:36:22Z
- **Completed:** 2026-03-14T00:48:05Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- isLocationSlug() disambiguates UK location slugs (london, south-london, manchester etc.) from provider slugs using a Set of 60+ known UK cities/regions plus heuristic fallback (≤ 25 chars, ≤ 2 hyphens, no digits)
- /services/plumbers/london renders SEO location page; /services/plumbers/smith-plumbing-london renders provider profile — same route, zero new directories
- ProviderSearchCard: avatar with ShieldCheck overlay, trade category pills, location pill, amber star rating, years experience, trust badges (verified/insured/qualifications), review snippet, View Profile + Get a Quote CTAs
- CategoryPageFAQ: <details>/<summary> accordion with no-JS FAQ, FAQPage JSON-LD schema injected in <script> tag
- seo-utils.ts: pure functions generateCategoryPageMeta, generateCategoryFAQs, formatLocationDisplay, formatCategoryDisplay — no Supabase dependency
- generateStaticParams uses get_seo_category_locations RPC via admin client, returns top 200 combos
- export revalidate = 3600 enables ISR for location pages
- pnpm build exits 0; 784 tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: ProviderSearchCard + seo-utils + CategoryPageFAQ** - `fd574df` (feat)
2. **Task 2: location-slugs.ts + page.tsx ISR disambiguation** - `196bc1d` (feat)

## Files Created/Modified
- `src/lib/providers/seo-utils.ts` — pure SEO content generators: generateCategoryPageMeta, generateCategoryFAQs, formatLocationDisplay, formatCategoryDisplay
- `src/components/seo/CategoryPageFAQ.tsx` — Server Component FAQ accordion with FAQPage JSON-LD
- `src/components/providers/ProviderSearchCard.tsx` — Server Component provider card for category/search pages
- `src/lib/providers/location-slugs.ts` — isLocationSlug() UK location disambiguation utility
- `src/app/(main)/services/[category]/[slug]/page.tsx` — updated with in-page disambiguation, generateStaticParams, revalidate, generateMetadata for location slugs, CategoryLocationPage local component

## Decisions Made
- Used `createAdminClient()` in `generateStaticParams` rather than `createClient()` — build-time function has no Next.js request scope, so `cookies()` inside `createClient()` throws. Admin client uses service role key directly, bypasses cookie handling.
- Wrapped `generateStaticParams` in try/catch returning `[]` on error — allows build to succeed when DB credentials are unavailable in CI/CD environments; pages are rendered on-demand and then cached by ISR.
- In-page disambiguation preserves the plan's locked route constraint (`/services/[category]/[slug]` not `/services/[category]/[location]`) — `isLocationSlug()` checks at runtime.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used createAdminClient() in generateStaticParams instead of createClient()**
- **Found during:** Task 2 (build verification)
- **Issue:** `createClient()` calls `cookies()` from next/headers, which throws "cookies was called outside a request scope" when called at build time in generateStaticParams
- **Fix:** Imported `createAdminClient()` from `@/lib/supabase/admin` — uses service role key without cookie dependencies; wrapped in try/catch returning [] if env vars missing
- **Files modified:** src/app/(main)/services/[category]/[slug]/page.tsx
- **Verification:** pnpm build exits 0, no "cookies outside request scope" error
- **Committed in:** 196bc1d (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - Blocking)
**Impact on plan:** Necessary for correct build-time behaviour. No scope creep.

## Issues Encountered
- Pre-existing test failure in `src/__tests__/pages/public.test.ts` (missing /terms/page import) — pre-existing, noted in 17-07 SUMMARY, out of scope

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 17 complete — all 8 plans delivered
- SEO category location pages ready for organic traffic indexing
- ProviderSearchCard available for use in any future search results or listing pages
- generateStaticParams will generate 200 pre-built pages once get_seo_category_locations RPC returns data from production DB
