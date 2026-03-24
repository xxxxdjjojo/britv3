# Britestate v3.0 — Launch Readiness Audit

**Date:** 2026-03-19
**Auditor:** Senior QA Engineer (automated deep audit)
**Scope:** 1,391 source files, 190 API routes, 50+ DB migrations
**Methodology:** Static code analysis across 7 production-readiness dimensions

---

## Executive Summary

| Dimension | Grade | Critical | High | Medium | Low |
|-----------|-------|----------|------|--------|-----|
| **Security** | D | 2 | 3 | 2 | 3 |
| **SEO** | C+ | 2 | 4 | 3 | 2 |
| **Accessibility** | C | 4 | 5 | 5 | — |
| **Performance** | B- | 3 | 3 | 4 | 1 |
| **Mobile Readiness** | B | 1 | 2 | — | — |
| **Analytics** | F | 3 | 3 | — | — |
| **Cross-Browser** | B+ | — | 1 | 1 | — |
| **TOTALS** | — | **15** | **21** | **15** | **6** |

**Overall Launch Readiness: NOT READY — 15 critical findings must be resolved**

---

## 1. SECURITY

### CRITICAL

#### SEC-1: XSS via Unsanitized CMS Content
- **Severity:** CRITICAL
- **Location:** 19 files using `dangerouslySetInnerHTML` without sanitization
  - `src/app/(main)/help/[slug]/page.tsx:82`
  - `src/app/(main)/partners/page.tsx:66`
  - `src/app/(main)/legal/privacy/page.tsx` (and 11 other legal pages)
  - `src/app/(main)/agents/[slug]/page.tsx`
  - `src/components/ui/chart.tsx`
- **Description:** CMS page content rendered directly from database without DOMPurify sanitization. Existing TODO comments acknowledge the issue. An admin (or SQL injection) could inject `<script>` tags executed in every visitor's browser.
- **Fix:** Import `DOMPurify` from `isomorphic-dompurify` (already installed) and wrap all `dangerouslySetInnerHTML` content: `{{ __html: DOMPurify.sanitize(content) }}`

#### SEC-2: Production Secrets Committed to Git
- **Severity:** CRITICAL
- **Location:** `.env` file in repository root
- **Description:** Real Supabase URL, anon key, and STITCH_API_KEY committed to git history. Anyone with repo access can impersonate the application.
- **Fix:**
  1. Rotate all exposed keys immediately (Supabase dashboard, Stitch)
  2. `git rm .env` and add to `.gitignore`
  3. Scrub from git history with `git filter-branch` or BFG
  4. Use `.env.local` (already gitignored) for real values

### HIGH

#### SEC-3: Error Messages Leak Internal Details
- **Severity:** HIGH
- **Location:** 16+ API routes (e.g., `src/app/api/seller/offers/route.ts:17`, `src/app/api/reviews/aggregate/route.ts:39`)
- **Description:** `catch (err) { return NextResponse.json({ error: String(err) }) }` exposes database schema, table names, and internal paths to attackers.
- **Fix:** Log full error server-side, return generic `"Internal server error"` to client.

#### SEC-4: Rate Limiter Fails Closed — Creates DoS Vector
- **Severity:** HIGH
- **Location:** `src/lib/cache/redis.ts:145-170`
- **Description:** When Redis is unavailable, auth rate limiter denies ALL requests (`success: false`). A Redis outage = no user can authenticate.
- **Fix:** Fail open with logging, or use in-memory fallback limiter.

#### SEC-5: Missing HTTPS Cookie Enforcement
- **Severity:** HIGH
- **Location:** `src/middleware.ts:93`
- **Description:** `secure: process.env.NODE_ENV === "production"` — cookies sent over HTTP in staging/preview environments.
- **Fix:** `secure: process.env.NODE_ENV !== "development"`

### MEDIUM

#### SEC-6: No CSRF Protection
- **Severity:** MEDIUM
- **Location:** All forms and state-changing API routes
- **Description:** No CSRF tokens generated or validated. SameSite=Lax mitigates partially but doesn't prevent all CSRF vectors.
- **Fix:** Implement CSRF token middleware or upgrade to SameSite=Strict where feasible.

#### SEC-7: Incomplete Admin Audit Logging
- **Severity:** MEDIUM
- **Location:** `src/lib/audited-admin-action.ts:32-40`
- **Description:** Admin audit logs missing IP address, user agent, and change details — only action name and success/failure recorded.
- **Fix:** Capture `x-forwarded-for`, `user-agent`, and before/after state of changed records.

### LOW

#### SEC-8: CSP Allows `style-src 'unsafe-inline'`
- **Severity:** LOW
- **Location:** `src/middleware.ts:20`
- **Description:** Inline styles permitted, enabling CSS-based exfiltration attacks when combined with XSS.

#### SEC-9: Analytics Event Injection
- **Severity:** LOW
- **Location:** `src/app/api/analytics/event/route.ts`
- **Description:** Accepts any `listing_id` without ownership validation — attackers can poison analytics data.

#### SEC-10: Referral Code Minimum Length Arbitrary
- **Severity:** LOW
- **Location:** `src/middleware.ts:87-99`
- **Description:** 6-character minimum allows brute-force enumeration of referral codes.

---

## 2. SEO

### CRITICAL

#### SEO-1: No robots.txt
- **Severity:** CRITICAL
- **Location:** Missing `src/app/robots.ts`
- **Description:** No robots.txt means search engines have zero crawl guidance. Protected routes, API endpoints, and admin pages may be indexed.
- **Fix:** Create `src/app/robots.ts` with Allow/Disallow rules and sitemap URL.

#### SEO-2: No XML Sitemap
- **Severity:** CRITICAL
- **Location:** Missing `src/app/sitemap.ts`
- **Description:** No sitemap means search engines must discover pages by crawling alone. With 100+ dynamic routes, many pages will never be indexed.
- **Fix:** Create `src/app/sitemap.ts` generating URLs from database (properties, areas, agents, blog, legal pages).

### HIGH

#### SEO-3: No Title Template
- **Severity:** HIGH
- **Location:** `src/app/layout.tsx` metadata
- **Description:** No consistent title suffix. Some pages use `"... | Britestate"`, others omit it. Inconsistent brand presence in SERPs.
- **Fix:** Add `title: { template: "%s | Britestate", default: "Britestate — UK Property Portal" }` to root metadata.

#### SEO-4: Missing Organization Schema
- **Severity:** HIGH
- **Location:** No root-level JSON-LD
- **Description:** No Organization schema means no Knowledge Panel eligibility. Missing: company name, logo, social profiles, contact info.
- **Fix:** Add Organization JSON-LD to root layout.

#### SEO-5: Missing Article Schema on Blog
- **Severity:** HIGH
- **Location:** `src/app/(main)/blog/[slug]/page.tsx`
- **Description:** Blog posts lack Article/NewsArticle structured data. Misses Google News and rich result eligibility.
- **Fix:** Add Article JSON-LD with author, datePublished, headline, image.

#### SEO-6: No Twitter Card Meta Tags
- **Severity:** HIGH
- **Location:** All pages
- **Description:** No `twitter:card`, `twitter:site`, or `twitter:creator` tags. Social sharing on X/Twitter shows generic previews.
- **Fix:** Add twitter metadata to root layout and key pages.

### MEDIUM

#### SEO-7: Missing BreadcrumbList JSON-LD
- **Severity:** MEDIUM
- **Location:** Breadcrumb components (HTML only, no schema)
- **Description:** Breadcrumbs render visually but lack BreadcrumbList structured data for SERP breadcrumb trails.

#### SEO-8: No VideoObject Schema
- **Severity:** MEDIUM
- **Location:** Property detail virtual tour / video components
- **Description:** Video content lacks VideoObject markup for Google Video indexing.

#### SEO-9: 160 Pages Missing Metadata
- **Severity:** MEDIUM
- **Location:** 160 of 291 page files lack explicit metadata exports
- **Description:** Many pages rely on inherited/default metadata. Dynamic pages especially need custom titles/descriptions.

### LOW

#### SEO-10: Missing Default OpenGraph Image
- **Severity:** LOW
- **Location:** Root layout metadata
- **Description:** Most pages lack OG images. Default should be set site-wide.

#### SEO-11: No Trailing Slash Configuration
- **Severity:** LOW
- **Location:** `next.config.ts`
- **Description:** No trailing slash policy could cause duplicate content issues.

---

## 3. ACCESSIBILITY (WCAG 2.2 AA)

### CRITICAL

#### A11Y-1: Color Contrast Failures
- **Severity:** CRITICAL
- **Location:** `src/app/globals.css` (brand colors)
- **Description:**
  - Secondary gold (#D4A853) on white: ~3.1:1 ratio (requires 4.5:1) — **FAILS**
  - Neutral-400 (#9E9EAB) on white: ~3.5:1 ratio — **FAILS**
  - Used across footer, badges, secondary text
- **Fix:** Darken secondary to #B8902F (~4.6:1). Use neutral-500+ for body text.

#### A11Y-2: Touch Targets Below 44px Minimum
- **Severity:** CRITICAL
- **Location:** `src/components/ui/button.tsx:26-36`
- **Description:** WCAG 2.5.8 Target Size (Minimum) requires 24px, 2.5.5 Enhanced requires 44px. Current button sizes:
  - `icon`: 32px, `icon-sm`: 28px, `icon-lg`: 36px, `sm`: 28px, `default`: 32px
- **Fix:** Set minimum `min-h-11 min-w-11` (44px) on all interactive elements, or add padding to hit zone.

#### A11Y-3: No `prefers-reduced-motion` Support
- **Severity:** CRITICAL
- **Location:** `src/app/globals.css:224` and animation classes throughout
- **Description:** `scroll-behavior: smooth` applied globally with no motion preference check. Hover animations (`scale-105`), dialog transitions, and confetti effects ignore user preference.
- **Fix:** Add `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; scroll-behavior: auto !important; transition-duration: 0.01ms !important; } }`

#### A11Y-4: Non-Semantic Modal Implementations
- **Severity:** CRITICAL
- **Location:**
  - `src/components/seller/offers/OfferActionModal.tsx:59`
  - `src/components/seller/viewings/ViewingActionModal.tsx:59`
- **Description:** Overlay is a plain `<div>` with `onClick` — no keyboard dismiss (Escape), no focus trap, no ARIA dialog role. Correct pattern exists in `ReportListingModal.tsx`.
- **Fix:** Replace with proper Dialog component (Radix/Base UI) or add `role="dialog"`, `aria-modal="true"`, focus trap, and Escape handler.

### HIGH

#### A11Y-5: Missing Skip Navigation Link
- **Severity:** HIGH
- **Location:** `src/components/layout/Header.tsx`
- **Description:** No skip-to-main-content link. Keyboard users must tab through entire navigation on every page.
- **Fix:** Add `<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to main content</a>` as first element.

#### A11Y-6: Unlinked Form Labels
- **Severity:** HIGH
- **Location:** `src/components/seller/offers/OfferActionModal.tsx:82`, `ViewingActionModal.tsx`
- **Description:** `<label>` elements missing `htmlFor` attribute, `<input>` elements missing matching `id`. Screen readers can't associate labels with inputs.
- **Fix:** Add `htmlFor="field-id"` on labels and `id="field-id"` on inputs.

#### A11Y-7: Missing `aria-invalid` and `aria-describedby` on Form Errors
- **Severity:** HIGH
- **Location:** Seller modals, onboarding forms
- **Description:** Error states not communicated to assistive technology. Correct pattern exists in `contact/page.tsx`.
- **Fix:** Add `aria-invalid={!!error}` and `aria-describedby="field-error"` with matching error message IDs.

#### A11Y-8: Missing `required` / `aria-required` on Form Inputs
- **Severity:** HIGH
- **Location:** Multiple form components
- **Description:** Required fields show visual asterisks but lack `required` attribute and `aria-required="true"`.

#### A11Y-9: Incomplete Keyboard Support in Kanban
- **Severity:** HIGH
- **Location:** `src/components/dashboard/agent/sales/SaleProgressionKanban.tsx:110-113`
- **Description:** Draggable cards handle Enter key but not Space key (required for `role="button"`).

### MEDIUM

#### A11Y-10 through A11Y-14:
- Heading hierarchy inconsistencies (h2 without h1 on some pages)
- Image alt text quality depends on database content
- Focus indicators not universally applied
- Limited `aria-live` regions for dynamic content
- Dark mode focus ring contrast may be insufficient

---

## 4. PERFORMANCE (Core Web Vitals)

### CRITICAL

#### PERF-1: 8 Raw `<img>` Tags Instead of `next/image`
- **Severity:** CRITICAL
- **Location:**
  - `src/app/(protected)/dashboard/seller/agents/compare/page.tsx:73`
  - `src/app/(protected)/dashboard/seller/agents/[id]/page.tsx:54`
  - `src/components/seller/wizard/Step7Review.tsx:90`
  - `src/components/seller/wizard/Step3Photos.tsx:43`
  - `src/components/seller/viewings/ViewingCard.tsx:34`
  - `src/components/seller/SellerSidebar.tsx:71`
  - `src/components/auth/TwoFactorSetupFlow.tsx:220`
  - `src/components/dashboard/agent/listings/ArchivedDraftListings.tsx:82`
- **Description:** Raw `<img>` tags bypass Next.js image optimization — no lazy loading, no responsive formats (WebP/AVIF), no srcset. Direct LCP impact.
- **Fix:** Replace all with `<Image>` from `next/image` with proper `width`, `height`, and `sizes` attributes.

#### PERF-2: 475 "use client" Components — Excessive Client Bundle
- **Severity:** CRITICAL
- **Location:** 475 files across `src/`
- **Description:** 475 of ~1,391 source files are marked `"use client"`. This sends massive JavaScript to the browser, slowing hydration and increasing INP. Many components (static dashboards, data displays) could be Server Components.
- **Fix:** Audit each `"use client"` file — target converting 50%+ to Server Components. Extract interactive parts into small client islands.

#### PERF-3: TypeScript Build Errors Suppressed
- **Severity:** CRITICAL
- **Location:** `next.config.ts` — `typescript.ignoreBuildErrors: true`
- **Description:** Build errors are silently ignored. This masks potential runtime failures, type-safety violations, and optimization issues. Production builds may include broken code.
- **Fix:** Remove `ignoreBuildErrors: true`, fix all TS errors, enforce strict builds in CI.

### HIGH

#### PERF-4: MapLibre CSS Imported Eagerly in 5 Components
- **Severity:** HIGH
- **Location:** `SearchMap.tsx`, `MapEmbed.tsx`, `PropertyMap.tsx`, `MapDrawTool.tsx`, `PropertyMapInner.tsx`
- **Description:** `import "maplibre-gl/dist/maplibre-gl.css"` blocks rendering even when map is not visible. Combined with large MapLibre JS bundle.
- **Fix:** Dynamically import CSS alongside lazy-loaded map components.

#### PERF-5: No Link Prefetching
- **Severity:** HIGH
- **Location:** All `<Link>` components across the app
- **Description:** Zero uses of `prefetch` attribute on Next.js Links. High-traffic navigation paths (search → property detail, dashboard tabs) load on-demand only.
- **Fix:** Add `prefetch={true}` to common navigation Links (top nav, search results, dashboard sidebar).

#### PERF-6: Heavy Libraries Not Code-Split
- **Severity:** HIGH
- **Location:** recharts, @tiptap/*, maplibre-gl
- **Description:** Only 15 files use `next/dynamic` for code splitting. Heavy charting and rich-text libraries loaded eagerly on pages that include them.
- **Fix:** Wrap recharts and Tiptap components with `next/dynamic({ ssr: false })`.

### MEDIUM

#### PERF-7: Missing `loading.tsx` on Most Routes
- **Severity:** MEDIUM
- **Location:** Only 4 of 100+ routes have `loading.tsx` skeleton screens
- **Description:** Most routes show no visual feedback during server-side data fetch.

#### PERF-8: Limited API Response Caching
- **Severity:** MEDIUM
- **Location:** Only 4 cache directives found across 190 API routes
- **Description:** Most API responses lack `Cache-Control` headers. Repeated requests always hit the server.

#### PERF-9: PostHog Initialized on Every Page
- **Severity:** MEDIUM
- **Location:** `src/components/providers/PostHogProvider.tsx`
- **Description:** Analytics SDK loaded and initialized on every route, even where tracking isn't needed.

#### PERF-10: No `optimizePackageImports` Configuration
- **Severity:** MEDIUM
- **Location:** `next.config.ts`
- **Description:** Missing `optimizePackageImports` for large libraries (lucide-react, recharts, date-fns). Entire libraries may be bundled instead of tree-shaken imports.

### LOW

#### PERF-11: Image Quality/Priority Inconsistent
- **Severity:** LOW
- **Description:** Most `<Image>` components don't specify `quality` or `priority` attributes.

---

## 5. MOBILE READINESS

### CRITICAL

#### MOB-1: Missing Viewport Meta Tag in Root Layout
- **Severity:** CRITICAL
- **Location:** `src/app/layout.tsx`
- **Description:** Root layout does NOT export a viewport configuration. Only `global-error.tsx` has one. Without it, mobile browsers may render at desktop width or allow unwanted zoom behavior.
- **Fix:** Add `export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" }` to root layout.

### HIGH

#### MOB-2: Button/Interactive Touch Targets Below 44px
- **Severity:** HIGH
- **Location:** `src/components/ui/button.tsx`
- **Description:** (Same as A11Y-2) Default button heights are 28-36px. `.touch-target` class exists in CSS but is not applied to button component.
- **Fix:** Apply `min-h-11 min-w-11` to all button variants, or add touch-target padding.

#### MOB-3: PostHogProvider Not Mounted in Layout
- **Severity:** HIGH (Analytics)
- **Location:** `src/components/providers/PostHogProvider.tsx` defined but not imported in any layout
- **Description:** PostHog provider component exists but is never rendered. No analytics are being captured at all.
- **Fix:** Import and render `<PostHogProvider>` in root or (main) layout.

---

## 6. ANALYTICS

### CRITICAL

#### ANA-1: PostHogProvider Not Mounted — Zero Analytics Captured
- **Severity:** CRITICAL
- **Location:** `src/components/providers/PostHogProvider.tsx` (unused)
- **Description:** The analytics provider component exists but is never imported into any layout. **No page views, no events, no user identification is happening.**
- **Fix:** Add `<PostHogProvider>` to root `layout.tsx` or `(main)/layout.tsx`.

#### ANA-2: No User Identification
- **Severity:** CRITICAL
- **Location:** No `posthog.identify()` calls found anywhere
- **Description:** Even when PostHog is mounted, users are anonymous. Cannot track user journeys, segment by role, or attribute conversions.
- **Fix:** Call `posthog.identify(user.id, { role, plan, ... })` after authentication in auth context/hook.

#### ANA-3: No Conversion Funnel Tracking
- **Severity:** CRITICAL
- **Location:** Entire codebase
- **Description:** No conversion goals defined. No funnel tracking for: Signup → Onboarding → First Property View → Contact Agent → Offer. Cannot measure business KPIs.
- **Fix:** Define key funnels in PostHog dashboard and instrument each step with `posthog.capture()`.

### HIGH

#### ANA-4: 6 Key Events Are TODOs
- **Severity:** HIGH
- **Location:** Various hooks and API routes
- **Description:** These events have TODO comments but no implementation:
  - `offer.submitted` (`src/hooks/useOffers.ts`)
  - `viewing.booked` (`src/hooks/useViewings.ts`)
  - `viewing.cancelled`, `viewing.rescheduled`
  - `document.uploaded`, `document.upload_failed`

#### ANA-5: Major User Actions Completely Untracked
- **Severity:** HIGH
- **Location:** Throughout
- **Description:** No tracking for: signup, login, search queries, property detail views, contact agent, save/favorite, application submit, payment completion, calculator usage.

#### ANA-6: Cookie Consent Not Integrated with PostHog
- **Severity:** HIGH
- **Location:** `src/contexts/CookieConsentContext.tsx` + `src/lib/posthog.ts`
- **Description:** PostHog initializes regardless of cookie consent preferences. GDPR non-compliance risk — analytics cookies set before user consents.
- **Fix:** Gate `posthog.init()` behind analytics consent check. Call `posthog.opt_out_capturing()` when consent is denied.

---

## 7. CROSS-BROWSER SUPPORT

### HIGH

#### XBROW-1: CSS `env()` for Safe Areas — Limited Browser Support
- **Severity:** HIGH
- **Location:** `src/app/globals.css:174-182`
- **Description:** `env(safe-area-inset-bottom)` requires `viewport-fit=cover` which is missing from the viewport meta tag (see MOB-1). Without it, safe area values are always 0.
- **Fix:** Add `viewportFit: "cover"` to viewport export.

### MEDIUM

#### XBROW-2: Tailwind v4 CSS Features
- **Severity:** MEDIUM
- **Location:** `src/app/globals.css`
- **Description:** Tailwind CSS v4 uses modern CSS features (CSS custom properties, `@layer`, `oklch()`) that may not render identically in older browsers. Verify baseline browser support targets.

---

## Findings Summary Table

```
+=====================================================================+
|        LAUNCH READINESS AUDIT — FINDINGS REGISTRY                   |
+=====================================================================+
| Category        | CRITICAL | HIGH | MEDIUM | LOW  | TOTAL          |
|-----------------|----------|------|--------|------|----------------|
| Security        |    2     |   3  |    2   |   3  |    10          |
| SEO             |    2     |   4  |    3   |   2  |    11          |
| Accessibility   |    4     |   5  |    5   |   —  |    14          |
| Performance     |    3     |   3  |    4   |   1  |    11          |
| Mobile          |    1     |   2  |    —   |   —  |     3          |
| Analytics       |    3     |   3  |    —   |   —  |     6          |
| Cross-Browser   |    —     |   1  |    1   |   —  |     2          |
+---------------------------------------------------------------------+
| TOTALS          |   15     |  21  |   15   |   6  |    57          |
+=====================================================================+
```

---

## Priority Fix Order (Top 15 — All Critical)

| # | ID | Finding | Effort |
|---|----|---------|--------|
| 1 | SEC-2 | Rotate exposed secrets, scrub .env from git | S |
| 2 | SEC-1 | Sanitize all `dangerouslySetInnerHTML` with DOMPurify | S |
| 3 | ANA-1 | Mount PostHogProvider in layout | S |
| 4 | MOB-1 | Add viewport export to root layout | S |
| 5 | SEO-1 | Create robots.ts | S |
| 6 | SEO-2 | Create sitemap.ts | M |
| 7 | PERF-3 | Fix TS errors, remove ignoreBuildErrors | M |
| 8 | PERF-1 | Replace 8 raw `<img>` with next/image | S |
| 9 | A11Y-1 | Fix color contrast (darken secondary/neutral) | S |
| 10 | A11Y-3 | Add prefers-reduced-motion media query | S |
| 11 | A11Y-2 | Enforce 44px min touch targets on buttons | S |
| 12 | A11Y-4 | Replace custom modals with proper Dialog | M |
| 13 | ANA-2 | Add posthog.identify() after auth | S |
| 14 | ANA-3 | Instrument key conversion funnels | M |
| 15 | PERF-2 | Audit "use client" — convert 50%+ to Server Components | XL |

**S = Small (< 1 hour) | M = Medium (1-4 hours) | L = Large (1-2 days) | XL = Extra Large (3+ days)**

---

## What's Already Good

- Row-Level Security on all Supabase tables
- CSP headers with nonce generation in middleware
- Service worker with intelligent caching strategy (Serwist)
- PWA manifest with proper icons
- Font optimization (next/font with display swap)
- Suspense boundaries and skeleton screens on key pages
- JSON-LD structured data for agents, providers, FAQs
- Cookie consent infrastructure (CookieConsentContext)
- Canonical URLs on dynamic pages
- ISR on area and service pages
- Pull-to-refresh and bottom tab navigation for mobile
- Semantic HTML landmarks (header, main, footer, nav)
- Safe area padding utilities
- Input sanitization utility exists (just needs wider application)
- Proper auth middleware with role guards

---

## Recommended Launch Blockers

These 8 findings are **launch blockers** — ship without them at your peril:

1. **SEC-2** — Secrets in git (legal/compliance risk)
2. **SEC-1** — XSS in CMS pages (exploitable today)
3. **SEO-1** — No robots.txt (admin/API pages may get indexed)
4. **SEO-2** — No sitemap (invisible to search engines)
5. **MOB-1** — No viewport tag (broken mobile rendering)
6. **ANA-1** — Analytics not mounted (flying blind)
7. **PERF-3** — TS errors suppressed (hidden runtime failures)
8. **A11Y-1** — Color contrast failures (legal risk under Equality Act 2010)
