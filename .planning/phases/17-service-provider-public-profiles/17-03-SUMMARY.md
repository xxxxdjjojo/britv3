---
phase: 17-service-provider-public-profiles
plan: "03"
subsystem: ui
tags: [next.js, server-components, react, tailwind, supabase, dialog, masonry]

requires:
  - phase: 17-01
    provides: PublicReview, PortfolioItem, ProviderService, ProviderPricing types; fetchProviderReviews, fetchPortfolioItems, fetchProviderServices; provider_leads table
  - phase: 17-02
    provides: ProfileTabs client island (typed ReactNode props); page.tsx SSR shell; placeholder tab content replaced by this plan

provides:
  - src/components/providers/ReviewsTab.tsx (Server Component — paginated review cards with star ratings, relative dates, provider response block)
  - src/components/providers/PortfolioTab.tsx (Server Component frame — delegates to PortfolioFilter client)
  - src/components/providers/PortfolioFilter.tsx (Client Component — category pill chips + masonry grid + PortfolioLightbox)
  - src/components/providers/PortfolioLightbox.tsx (Client Component — Dialog lightbox on image click with next/image blur placeholder)
  - src/components/providers/ServicesTab.tsx (Server Component — service cards grid with PricingBadge discriminated union rendering)
  - src/components/providers/ServicesTabWithModal.tsx (Client Component — event delegation wrapper opening QuoteModal on data-quote-service click)
  - src/components/providers/QuoteModal.tsx (Client Component — 3-step RFQ modal inserting into provider_leads via Supabase browser client)
  - src/app/(main)/services/[category]/[slug]/page.tsx (updated — real tab content replacing placeholders)

affects:
  - "Plan 17-04 (agent profile page can reuse ServicesTab/ReviewsTab patterns)"
  - "Plan 17-07 (useCompare hook replacement; QuoteModal insert pattern for provider_leads)"

tech-stack:
  added: []
  patterns:
    - "Server Component tab + Client Component wrapper pattern: ServicesTab (server) inside ServicesTabWithModal (client wrapper with event delegation)"
    - "CSS masonry grid with Tailwind v4 arbitrary values: [column-count:2] md:[column-count:3] [break-inside:avoid]"
    - "Event delegation for cross-boundary Server→Client button activation: data-quote-service attribute triggers QuoteModal open state"
    - "Next/image with base64 blur placeholder for portfolio images"
    - "Intl.RelativeTimeFormat for relative date strings in review cards"

key-files:
  created:
    - src/components/providers/ReviewsTab.tsx
    - src/components/providers/PortfolioTab.tsx
    - src/components/providers/PortfolioFilter.tsx
    - src/components/providers/PortfolioLightbox.tsx
    - src/components/providers/ServicesTab.tsx
    - src/components/providers/ServicesTabWithModal.tsx
    - src/components/providers/QuoteModal.tsx
  modified:
    - src/app/(main)/services/[category]/[slug]/page.tsx
    - src/types/providers.ts
    - src/services/providers/public-profile-service.ts
    - src/services/landlord/document-service.ts

key-decisions:
  - "ServicesTabWithModal uses event delegation (click on data-quote-service buttons) rather than prop-drilling a callback through the Server Component — avoids passing client functions as props to Server Components"
  - "QuoteModal uses render-prop pattern for modal factory (modal: (props) => ReactNode) so ServicesTabWithModal stays generic without importing QuoteModal directly"
  - "PortfolioLightbox wraps each image in a Dialog individually (not a shared Dialog with item state) — simpler state management, each item is self-contained"
  - "PublicReview type extended with provider_response/provider_response_at — these columns exist in the reviews table (DB types confirmed) but were missing from the TypeScript type in providers.ts"

patterns-established:
  - "Pattern 3: Server-Component-in-Client-delegation — ServicesTab renders server HTML with data attributes; ServicesTabWithModal captures clicks via event delegation and opens a client Dialog"
  - "Pattern 4: 3-step modal form with local step state and direct Supabase browser client insert for public-facing lead capture"

requirements-completed:
  - PROF-02
  - PROF-03
  - PROF-04
  - PROF-05

duration: 46min
completed: 2026-03-13
---

# Phase 17 Plan 03: Tab Content + QuoteModal Summary

**Four tradesperson profile tab panels with real data: star-rated review cards, CSS masonry portfolio gallery with lightbox, pricing-badged service cards, and a 3-step RFQ modal that inserts into provider_leads**

## Performance

- **Duration:** 46 min
- **Started:** 2026-03-13T22:33:26Z
- **Completed:** 2026-03-13T23:19:33Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- ReviewsTab renders review cards with Lucide Star ratings (amber-400 fill), reviewer initials avatar (no avatar_url fallback), Intl.RelativeTimeFormat relative dates, and provider response indented block with #1B4D3E left border
- PortfolioTab delivers CSS masonry gallery ([column-count:2] md:[column-count:3]) with client-side category filter chips and Dialog lightbox on image click
- ServicesTab renders service cards with discriminated union PricingBadge (hourly=green, fixed=blue, quote=amber) and Request Quote buttons using data-quote-service attributes
- QuoteModal (3-step client form): step 1 validates budget+timeline+description(≥20 chars), step 2 validates name+email, submit inserts to provider_leads via Supabase browser client, step 3 CheckCircle confirmation screen
- page.tsx: all 4 tabs now show real data — placeholders fully replaced; serviceNames array derived from services for QuoteModal select dropdown

## Task Commits

Each task was committed atomically:

1. **Task 1: ReviewsTab + PortfolioTab + PortfolioFilter + PortfolioLightbox + ServicesTab + ServicesTabWithModal** - `700e818` (feat)
2. **Task 2: QuoteModal 3-step RFQ + wire all tabs into page.tsx** - `530e1ee` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `src/components/providers/ReviewsTab.tsx` — Server Component; star row, reviewer avatar, relative date helper, provider response indent
- `src/components/providers/PortfolioTab.tsx` — Server Component frame; delegates to PortfolioFilter
- `src/components/providers/PortfolioFilter.tsx` — Client Component; category pill chips, masonry grid, mounts PortfolioLightbox per item
- `src/components/providers/PortfolioLightbox.tsx` — Client Component; Dialog trigger wrapper with base64 blur placeholder image
- `src/components/providers/ServicesTab.tsx` — Server Component; PricingBadge, Clock duration, data-quote-service button
- `src/components/providers/ServicesTabWithModal.tsx` — Client Component; event delegation wrapper, passes render-prop modal
- `src/components/providers/QuoteModal.tsx` — Client Component; 3-step controlled form, Supabase browser client insert to provider_leads
- `src/app/(main)/services/[category]/[slug]/page.tsx` — Updated; real tabs wired (ReviewsTab, PortfolioTab, ServicesTabWithModal+ServicesTab+QuoteModal)
- `src/types/providers.ts` — Added provider_response/provider_response_at to PublicReview type
- `src/services/providers/public-profile-service.ts` — Fixed fetchAgentTeam profile JOIN array cast
- `src/services/landlord/document-service.ts` — Fixed pre-existing type cast blocking build

## Decisions Made

- `ServicesTabWithModal` uses event delegation on `data-quote-service` attribute to open QuoteModal — avoids the otherwise impossible task of passing a client state setter as a prop to a Server Component rendered inside a Client Component's `children`
- `QuoteModal` is provided via render-prop (`modal: (props) => ReactNode`) so the client wrapper stays decoupled from the specific modal implementation
- Each `PortfolioLightbox` is self-contained (individual Dialog per item) — no shared lightbox state, cleaner component boundary
- `PublicReview` type updated to include `provider_response` and `provider_response_at` — the `reviews` table schema (confirmed in `database.types.ts`) has these columns; the plan's interface spec was correct but 17-01 had omitted them from the TypeScript type

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] PublicReview type missing provider_response fields**
- **Found during:** Task 1 (ReviewsTab implementation)
- **Issue:** Build error: `Property 'provider_response' does not exist on type 'PublicReview'`. The 17-01 type definition omitted `provider_response` and `provider_response_at` but these columns exist in the `reviews` table (confirmed in `database.types.ts` lines 2150-2203)
- **Fix:** Added `provider_response: string | null` and `provider_response_at: string | null` to the `PublicReview` type in `src/types/providers.ts`
- **Files modified:** src/types/providers.ts
- **Verification:** `npx tsc --noEmit --skipLibCheck 2>&1 | grep providers/` — zero errors
- **Committed in:** 700e818 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed fetchAgentTeam profile JOIN array cast**
- **Found during:** Task 1 (TypeScript check)
- **Issue:** `member.profiles as { full_name: string | null; avatar_url: string | null }` — Supabase returns profiles as an array from JOIN; TypeScript correctly detected the mismatch
- **Fix:** Changed cast to `(Array.isArray(member.profiles) ? member.profiles[0] : member.profiles) as { full_name: string | null; avatar_url: string | null } | null`
- **Files modified:** src/services/providers/public-profile-service.ts
- **Verification:** `npx tsc --noEmit --skipLibCheck 2>&1 | grep providers/` — zero errors
- **Committed in:** 700e818 (Task 1 commit)

**3. [Rule 1 - Bug] Fixed document-service.ts pre-existing type cast (document-service.ts:248)**
- **Found during:** Task 1 (build verification)
- **Issue:** `(doc.property ?? {}) as { address_line_1: string; city: string; postcode: string }` — TypeScript rejected the empty object cast since `{}` is `{}[]` from array JOIN shape
- **Fix:** Changed to `(doc.property as { address_line_1: string; city: string; postcode: string } | null) ?? { address_line_1: "", city: "", postcode: "" }`
- **Files modified:** src/services/landlord/document-service.ts
- **Verification:** This specific error no longer appears in tsc output
- **Committed in:** 700e818 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (3 Rule 1 — type alignment with actual DB schema and Supabase JOIN shapes)
**Impact on plan:** All auto-fixes necessary for type correctness. No scope creep.

## Issues Encountered

- **Build (pnpm build) fails due to pre-existing Phase 14 landlord dashboard TypeScript errors.** These errors are in untracked/uncommitted Phase 14 landlord compliance, deposits, finance, and properties pages that appeared after 17-02. All use `asChild` prop on Button which is not typed in this codebase. These errors existed before this plan's changes.
  - **Verification of plan scope:** `npx tsc --noEmit --skipLibCheck 2>&1 | grep "components/providers\|services/providers"` — zero errors. All Phase 17-03 files compile cleanly.
  - **Resolution:** Logged to `deferred-items.md`. Test suite (pnpm test --run) passes: 782 tests passed, 15 todo, 0 failures.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All 4 tradesperson profile tabs have real data (ReviewsTab, PortfolioTab, ServicesTab, QuoteModal)
- Plan 17-04 (agent profile page) can reuse ReviewsTab and ServicesTab patterns directly
- Plan 17-07 (useCompare hook) can replace CompareButton localStorage logic
- QuoteModal insert pattern to `provider_leads` is established and can be reused for other lead capture flows

---
*Phase: 17-service-provider-public-profiles*
*Completed: 2026-03-13*
