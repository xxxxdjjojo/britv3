# QA Report: Responsive, A11y, Dark Mode, SEO & Performance

**Date:** 2026-03-20
**Session:** QA Session 5 / Group E — Code Audit
**Scope:** Provider, Agent, and Marketplace components
**Method:** Source code analysis (no browser)

---

## Summary

| Area | Status | Issues Found |
|------|--------|-------------|
| E-01/02: Mobile (375px) | PASS with issues | 4 issues |
| E-03: Tablet (768px) | PASS with issues | 2 issues |
| E-04: Keyboard & ARIA | PASS | 1 minor issue |
| E-05: Dark mode | PASS with issues | 7 issues |
| E-06: SEO & structured data | PASS | 2 minor issues |
| E-07: Performance | PASS | 1 issue |

**Total issues: 17** (3 P1, 8 P2, 6 P3)

---

## E-01 & E-02: Mobile Responsive (375px)

### ProviderHero.tsx -- PASS
- Line 75: `flex flex-col md:flex-row` -- correctly stacks vertically on mobile, horizontal on md+
- Avatar is 160px fixed width, reasonable on mobile
- CTA buttons use `flex flex-wrap gap-3` (line 151) -- wraps on mobile
- Stats row uses `flex flex-wrap` (line 121) -- good

### ProviderSidebar.tsx -- PASS
- Sidebar is in a `lg:w-[380px]` aside in the profile page (line 382 of `[slug]/page.tsx`), which means it moves below main content on mobile (flex-col on small screens via `flex flex-col lg:flex-row`, line 318). Correct.

### QuoteModal.tsx -- PASS
- Dialog uses `sm:max-w-md max-h-[90vh]` (line 152). The base-ui Dialog component applies `max-w-[calc(100%-2rem)]` (dialog.tsx line ~56), so it's effectively full-width minus 1rem padding on each side on mobile.
- All inputs are `w-full` -- correct

### PortfolioTab.tsx / PortfolioFilter.tsx -- PASS with issue
- **P2-01: Portfolio grid uses CSS columns, not responsive grid classes.** Line 77 of PortfolioFilter.tsx: `[column-count:2] [column-gap:1rem] md:[column-count:3]`. This works but starts at 2 columns even at 375px. Should be `[column-count:1] sm:[column-count:2] md:[column-count:3]` for single-column on narrow mobile.
  - **File:** `/src/components/providers/PortfolioFilter.tsx` line 77

### ProviderSearchPage.tsx -- PASS
- HeroSearchBar: `flex flex-col sm:flex-row gap-3` (line 173) -- stacks on mobile, correct
- Body layout: `flex flex-col lg:flex-row gap-6` (line 313) -- filters above results on mobile, correct
- Sidebar filters: `w-full lg:w-[280px]` (line 315) -- full-width on mobile, correct

### ProviderSearchCard.tsx -- PASS
- Layout: `flex flex-col sm:flex-row` (line 50) -- stacks on mobile, correct

### Touch targets -- PASS with issues
- **P2-02: CTA buttons in ProviderSearchCard have insufficient touch height.** Line 155: `px-4 py-2` on "View Profile" and "Get a Quote" links produces ~36px height. Should be `py-2.5` or `min-h-[44px]` for 44px minimum touch target.
  - **File:** `/src/components/providers/ProviderSearchCard.tsx` lines 153-163
- **P2-03: Filter chip buttons in PortfolioFilter have insufficient touch height.** Line 51: `px-4 py-1.5` produces ~32px height. Should be `py-2` or `min-h-[44px]`.
  - **File:** `/src/components/providers/PortfolioFilter.tsx` lines 48-56
- **P3-01: CompareButton touch target is small.** `px-3 py-1.5 text-xs` (line 17, 39) produces ~28px height. Acceptable as supplementary action but ideally `min-h-[44px]` on mobile.
  - **File:** `/src/components/providers/CompareButton.tsx`

---

## E-03: Tablet (768px)

### Agent listing grid -- PASS with issue
- **P3-02: Agent cards grid is `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`** (agents/page.tsx line 244). At 768px (sm), this shows 2 columns, which is correct for tablet. However, it does not collapse to 1-col at any intermediate breakpoint -- 2-col at 640px+ may be tight for agent cards with long names.
  - **File:** `/src/app/(main)/agents/page.tsx` line 244

### Team grid -- PASS with issue
- **P3-03: TeamMembersTab uses `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`** (line 67). At 768px (md), shows 2 columns. At lg (1024px+), shows 3 columns. This is correct per spec. However, team member cards with long bios may overflow at 2-col on smaller tablets.
  - **File:** `/src/components/agents/TeamMembersTab.tsx` line 67

---

## E-04: Keyboard & ARIA

### ProfileTabs.tsx -- PASS (excellent)
- `role="tablist"` with `aria-label="Profile sections"` (line 47-48)
- Each tab button has `role="tab"`, `aria-selected`, `aria-controls` (lines 56-58)
- Each panel has `role="tabpanel"`, `aria-labelledby` (lines 76-78)
- Uses `useId()` for unique IDs (line 27)
- **P3-04: Missing keyboard arrow navigation.** Tabs are clickable buttons (keyboard-focusable via Tab key) but do not implement ArrowLeft/ArrowRight keyboard navigation between tabs per WAI-ARIA Tabs pattern. This is a nice-to-have, not a blocker.

### QuoteModal.tsx -- PASS
- Uses Shadcn `Dialog` which wraps `@base-ui/react/dialog` -- provides `role="dialog"`, focus trap, and Escape key dismiss out of the box
- Close button rendered by DialogContent component
- Form inputs have proper `autoComplete` attributes (lines 289, 305, 321)

### PortfolioLightbox.tsx -- PASS
- Button trigger has `aria-label={`View ${item.title}`}` (line 32)
- Dialog has `<DialogTitle className="sr-only">` for screen readers (line 55)
- Uses Shadcn Dialog -- keyboard dismiss via Escape works

### CompareButton.tsx -- PASS
- `aria-label={`Add ${providerName} to comparison`}` (line 41) and `aria-label={`Remove ${providerName} from comparison`}` (line 19)

### Star ratings -- PASS with caveat
- Star components (StarRating in ProviderSearchCard, StarRow in ReviewsTab, FilledStars in StarRatingBreakdown) render visual stars with filled/unfilled styling. The numeric rating value IS rendered as visible text next to the stars (e.g., "4.7") in all contexts where stars appear, so screen readers can access the number. However, the star icons themselves have no `aria-hidden="true"` -- they will be announced as empty text nodes, which is harmless but noisy.

### Images -- PASS
- All Next.js `Image` components have `alt` props
- ProviderSearchCard uses `<img>` (line 56-60) with `alt={business_name}` -- acceptable with eslint-disable comment
- ReviewerAvatar uses `<img>` with `alt={fullName ?? "Reviewer"}` -- acceptable

### CompareBar.tsx -- PASS
- Has `role="status"`, `aria-live="polite"`, descriptive `aria-label` (lines 14-16)

---

## E-05: Dark Mode

### Hero components -- PASS
- ProviderHero: gradient overlay has `dark:from-slate-950` (line 70), text uses `dark:text-white` and `dark:text-slate-400`
- SpecialistHero: `dark:bg-slate-900` container, proper dark text variants
- AgencyHero: `dark:bg-slate-900` container, proper dark text variants

### PricingBadge (ServicesTab.tsx) -- PASS
- Hourly: `dark:bg-green-900/20 dark:text-green-400 dark:border-green-800` (line 23)
- Fixed: `dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800` (line 30)
- Quote: `dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800` (line 37)

### Review cards (ReviewsTab.tsx) -- PASS
- Provider response block: `dark:bg-[#1B4D3E]/10` (line 134) with `dark:text-slate-300` and `dark:text-slate-400`

### Sidebars -- PASS
- ProviderSidebar: `dark:bg-slate-900` cards, `dark:border-slate-700` borders
- SpecialistSidebar: same pattern
- AgentSidebar: same pattern

### Search filter inputs (SearchFilters.tsx) -- PASS with caveat
- Uses semantic Tailwind tokens (`bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`) which inherit dark mode from CSS custom properties. This is correct if globals.css defines dark variants for these tokens.

### CompareTable.tsx -- PASS
- Alternating rows: `dark:bg-slate-900/30` and `dark:bg-slate-800/20` (lines 208-209)
- Header: `dark:bg-slate-800/50` (line 159)
- Footer: `dark:bg-slate-800/50` (line 232)

### ISSUES FOUND:

- **P1-01: CompareBar.tsx has NO dark mode variants.** Uses hardcoded `bg-white/95`, `text-gray-700`, `text-gray-500`, `border-gray-200` throughout (lines 18-43). In dark mode this will render as a bright white bar.
  - **File:** `/src/components/providers/CompareBar.tsx` lines 18-43

- **P1-02: Agents listing page (/agents) has NO dark mode variants.** The entire page uses hardcoded `bg-gray-50`, `bg-white`, `text-gray-900`, `text-gray-500`, `border-gray-200`, etc. (lines 82-349). Hero section and filter section also lack dark variants.
  - **File:** `/src/app/(main)/agents/page.tsx` lines 82-349

- **P2-04: StarRatingBreakdown bar background missing dark variant.** Line 62: `bg-slate-100` on the bar track has no `dark:` variant -- will appear as a light bar on dark background.
  - **File:** `/src/components/providers/StarRatingBreakdown.tsx` line 62

- **P2-05: StarRatingBreakdown large rating text uses brand color without dark variant.** Line 48: `text-[#1B4D3E]` -- this dark green on dark background may be hard to read. Should add `dark:text-green-400` or similar.
  - **File:** `/src/components/providers/StarRatingBreakdown.tsx` line 48

- **P2-06: StarRatingBreakdown star labels missing dark variant.** Line 61: `text-slate-600` with no dark variant.
  - **File:** `/src/components/providers/StarRatingBreakdown.tsx` line 61

- **P2-07: StarRatingBreakdown review count missing dark variant.** Line 52: `text-slate-500` with no dark variant.
  - **File:** `/src/components/providers/StarRatingBreakdown.tsx` line 52

- **P1-03: ProviderSidebar.tsx has `onClick={() => void 0}` on "Send Quote Request" button (line 71).** This is a Server Component with an onClick handler -- it will fail at runtime. The button should either be removed, converted to a link, or the component should be split into a client wrapper.
  - **File:** `/src/components/providers/ProviderSidebar.tsx` line 71
  - NOTE: This is a functionality bug, not just dark mode, but it was encountered during the dark mode audit.

---

## E-06: SEO & Structured Data

### JSON-LD -- PASS (excellent)
- **Provider profiles:** `buildProviderJsonLd` generates `@type: "LocalBusiness"` with `aggregateRating` (jsonld.ts lines 18-55)
- **Agent profiles:** `buildAgentJsonLd` generates `@type: "RealEstateAgent"` with `aggregateRating` (jsonld.ts lines 64-109)
- **Specialist profiles:** `buildSpecialistJsonLd` generates `@type: "FinancialService"` / `"LegalService"` / `"ProfessionalService"` with `aggregateRating` (jsonld.ts lines 120-168)
- All JSON-LD objects include `@context`, `name`, `url`, `address`, `image` where available
- `aggregateRating` includes `ratingValue`, `reviewCount`, `bestRating`, and `worstRating` (provider) or `bestRating` only (agent)

### Location pages JSON-LD -- PASS
- Category location page (`[category]/[slug]/page.tsx` line 157-172): generates `@type: "ItemList"` with `itemListElement` containing `ListItem` objects
- Each list item has `position`, `@type: "LocalBusiness"`, `name`, `url`

### Meta titles -- PASS
- Provider profile: `${provider.business_name} | ${category} | Britestate` (unique per provider)
- Agent profile: `${agencyName} Estate Agents | Britestate` (unique per agent)
- Location pages: `${category} in ${location} | Britestate` (unique per combo)
- Agent listing: `Find an Estate Agent Near You | Britestate`
- Tradespeople search: generated per category

### h1 tags -- PASS
- Each page has a unique h1 reflecting the page content

### Next.js Image CLS prevention -- PASS with issue
- **P3-05: ProviderSearchCard uses `<img>` instead of `next/image`.** Line 57: `<img src={profiles.avatar_url} ... />`. No `width`/`height` attributes set. The image is constrained by its parent `w-20 h-20` container, so CLS is mitigated by the fixed container size. However, using `next/image` would provide optimization.
  - **File:** `/src/components/providers/ProviderSearchCard.tsx` line 57
- **P3-06: ReviewsTab uses `<img>` for reviewer avatars.** Same pattern -- constrained by parent div.
  - **File:** `/src/components/providers/ReviewsTab.tsx` line 33

### Postcode masking -- PASS
- SurveyorCredentials shows `displayPostcodes = servicePostcodes.slice(0, 8)` (line 346). These are postcode prefixes (e.g., "SW1", "EC1"), not full postcodes. Correct.
- CompareTable `formatCoverage` shows first 3 postcodes only (line 71).

### ListingsTab cover images -- PASS with note
- ListingsTab PropertyCard uses `next/image` with `fill` layout (line 55-59). No explicit `sizes` prop is set, which means Next.js defaults to `100vw`. This won't cause CLS (fill + container size) but may load unnecessarily large images.

---

## E-07: Performance

### Server Components -- PASS (excellent)
- ProviderHero.tsx: Server Component (no "use client")
- ProviderSidebar.tsx: Server Component
- ProviderSearchCard.tsx: Server Component
- ServicesTab.tsx: Server Component
- ReviewsTab.tsx: Server Component
- StarRatingBreakdown.tsx: Server Component
- PortfolioTab.tsx: Server Component
- TrustBadges.tsx: Server Component
- SpecialistHero.tsx: Server Component
- SpecialistSidebar.tsx: Server Component
- SpecialistCredentials.tsx: Server Component
- AgencyHero.tsx: Server Component
- AgentSidebar.tsx: Server Component
- TeamMembersTab.tsx: Server Component
- ListingsTab.tsx: Server Component
- Only client components where needed: ProfileTabs, QuoteModal, PortfolioFilter, PortfolioLightbox, CompareButton, CompareBar, CompareTable, ServicesTabWithModal, ProviderSearchPage, SearchFilters

### Images with blur placeholder -- PASS with issue
- **P2-08: PortfolioLightbox lightbox image (line 57-62) has NO blur placeholder.** The thumbnail has `placeholder="blur"` but the full-size lightbox image does not.
  - **File:** `/src/components/providers/PortfolioLightbox.tsx` line 57
- ProviderHero cover photo has `placeholder="blur"` with custom `blurDataURL` (line 63-64). Good.
- Portfolio thumbnail has `placeholder="blur"` with inline blurDataURL (line 40-41). Good.
- AgencyHero cover uses `next/image` with `fill` but no blur placeholder (might flash). Minor.
- ListingsTab PropertyCard uses `next/image` with `fill` but no blur placeholder. Minor.

### Search API caching -- PASS (excellent)
- `/api/providers/search/route.ts`: Redis caching with 5-minute TTL (line 11)
- Stable cache key via sorted params (lines 30-38)
- Graceful degradation when Redis not configured (line 18)
- Cache-Control headers: `public, max-age=300, stale-while-revalidate=60` (line 87)
- Fire-and-forget cache writes (line 100)

### QuoteModal submit button -- PASS
- `disabled={!step2Valid || submitting}` (line 349) -- correctly disabled during submission
- Shows "Sending..." text while submitting (line 353)

### Location pages ISR -- PASS
- `[category]/[slug]/page.tsx` line 54: `export const revalidate = 3600` (1 hour)
- `tradespeople/[category]/[location]/page.tsx` line 9: `export const revalidate = 3600` (1 hour)
- `generateStaticParams` pre-builds top 200 combinations (line 62-79) and 7 categories x 20 locations (line 39-74)

---

## Issue Summary

### P1 -- Must Fix (3)

| ID | Component | Issue |
|----|-----------|-------|
| P1-01 | CompareBar.tsx | No dark mode variants -- renders bright white bar in dark mode |
| P1-02 | agents/page.tsx | Entire agent listing page has no dark mode support |
| P1-03 | ProviderSidebar.tsx | `onClick` handler on Server Component button (line 71) -- will fail at runtime |

### P2 -- Should Fix (8)

| ID | Component | Issue |
|----|-----------|-------|
| P2-01 | PortfolioFilter.tsx | Portfolio grid starts at 2 columns on 375px -- should be 1 column on mobile |
| P2-02 | ProviderSearchCard.tsx | CTA buttons below 44px touch target (py-2 = ~36px) |
| P2-03 | PortfolioFilter.tsx | Filter chip buttons below 44px touch target (py-1.5 = ~32px) |
| P2-04 | StarRatingBreakdown.tsx | Bar track `bg-slate-100` missing dark variant |
| P2-05 | StarRatingBreakdown.tsx | Large rating number `text-[#1B4D3E]` unreadable on dark bg |
| P2-06 | StarRatingBreakdown.tsx | Star labels `text-slate-600` missing dark variant |
| P2-07 | StarRatingBreakdown.tsx | Review count `text-slate-500` missing dark variant |
| P2-08 | PortfolioLightbox.tsx | Full-size lightbox image missing blur placeholder |

### P3 -- Nice to Have (6)

| ID | Component | Issue |
|----|-----------|-------|
| P3-01 | CompareButton.tsx | Small touch target (~28px), acceptable as supplementary |
| P3-02 | agents/page.tsx | Agent card grid may be tight at sm breakpoint (640px) |
| P3-03 | TeamMembersTab.tsx | Long bios may overflow at md 2-col |
| P3-04 | ProfileTabs.tsx | Missing ArrowLeft/ArrowRight keyboard nav between tabs |
| P3-05 | ProviderSearchCard.tsx | Uses `<img>` instead of `next/image` for avatars |
| P3-06 | ReviewsTab.tsx | Uses `<img>` instead of `next/image` for reviewer avatars |

---

## Positive Highlights

1. **ProfileTabs ARIA implementation is excellent** -- role="tablist", role="tab", aria-selected, aria-controls, role="tabpanel", aria-labelledby all present with unique IDs via useId()
2. **Server Components used extensively** -- 15 of ~25 components are Server Components, minimizing client JS
3. **JSON-LD structured data is comprehensive** -- LocalBusiness, RealEstateAgent, FinancialService/LegalService/ProfessionalService types with aggregateRating
4. **Redis caching with graceful degradation** -- 5-minute TTL, fire-and-forget writes, fallback when Redis unavailable
5. **ISR with generateStaticParams** -- pre-builds hundreds of location pages with 1-hour revalidation
6. **CompareBar has aria-live="polite"** -- announces changes to screen readers
7. **PortfolioLightbox has sr-only DialogTitle** -- accessible to screen readers while hidden visually
8. **Dark mode coverage is generally thorough** -- most components have comprehensive dark: variants
