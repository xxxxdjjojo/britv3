# Phase 01 Stitch Screen Import — Design Document

**Date:** 2026-03-08
**Status:** Approved
**Approach:** Sequential screen-by-screen (Approach A)

## Summary

Import 16 Stitch screens from project `5956704101394866719` into the Next.js app as fully functional pages. Each screen is converted to TSX following the Britestate design system (britestatestyle.txt), wired to real Supabase auth or typed mock data, and tested with Vitest + Playwright.

## Scope

- **16 Stitch screens** across 8 tasks (homepage, header/footer, search, property detail + 4 sub-components, 3 auth pages, 2 blog pages, legal page)
- **Test infrastructure** setup (Vitest + Playwright)
- **Mock data layer** for properties, blog, services
- **Real Supabase auth** for verify-email, reset-password, welcome pages
- **Design token enforcement** — zero hardcoded hex values

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Import scope | 16 screens (existing plan) | Foundation phase — get core pages right first |
| Backend wiring | Real auth, mock data | Supabase auth works; no data tables yet |
| Test setup | Vitest + Playwright (new) | Not installed; needed for verification |
| Approach | Sequential per-screen | Each commit is deployable; bugs caught early |
| Mock data structure | Typed arrays in `src/lib/mock-data/` | Easy DB swap later; type-safe |

## Design System Enforcement (britestatestyle.txt)

### Color Tokens (no hardcoded hex)

| Token | Value | Tailwind Class |
|-------|-------|---------------|
| `--brand-primary` | `#1B4D3E` | `bg-brand-primary`, `text-brand-primary` |
| `--brand-primary-light` | `#2D7A5F` | `bg-brand-primary-light` |
| `--brand-primary-lighter` | `#E8F5EE` | `bg-brand-primary-lighter` |
| `--brand-secondary` | `#D4A853` | `bg-brand-secondary`, `text-brand-secondary` |
| `--brand-accent` | `#2563EB` | `bg-brand-accent`, `text-brand-accent` |
| `--neutral-50` to `--neutral-950` | Grey scale | `bg-neutral-50` through `text-neutral-950` |
| `--success` | `#16A34A` | `bg-success`, `text-success` |
| `--warning` | `#CA8A04` | `bg-warning` |
| `--error` | `#DC2626` | `bg-error`, `text-error` |

### Typography

- Headings: Plus Jakarta Sans (600-700 weight)
- Body: Inter (400-500 weight)
- Type scale: 12/14/16(base)/18/20/24/30/36/48/60px

### Spacing

- 4px base unit: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128

### Border Radius

- `--radius-sm`: 6px, `--radius-md`: 8px, `--radius-lg`: 12px, `--radius-xl`: 16px, `--radius-2xl`: 24px, `--radius-full`: 9999px

### Shadows

- `--shadow-xs` through `--shadow-xl` (defined in globals.css)

### Component Rules

- Shadcn UI primitives for buttons, cards, dialogs, etc.
- Lucide React for all icons
- `"use client"` only when client interactivity needed
- Min touch target: 44x44px on mobile
- Animations: subtle, max 300ms
- `cn()` from `@/lib/utils` for className merging

## Conversion Rules (Stitch HTML → TSX)

1. No hardcoded hex values — use Tailwind design token classes
2. No inline `style={{}}` for colors/spacing — use Tailwind utilities
3. Images → `<Image>` from `next/image` with `alt`, `width`, `height`
4. Links → `<Link>` from `next/link`
5. Icons → Lucide React
6. `class=` → `className=`
7. Interactive elements → `"use client"` directive
8. Static/SSR pages → Server Components (no `"use client"`)
9. Buttons → `<Button>` from `@/components/ui/button`
10. `cn()` utility from `@/lib/utils` for conditional classes

## Task Breakdown

### Task 0: Test Infrastructure + Mock Data

**Files:**
- `vitest.config.ts` — jsdom environment, path aliases
- `playwright.config.ts` — localhost:3000, Chromium
- `src/lib/mock-data/properties.ts` — 8+ UK properties
- `src/lib/mock-data/blog.ts` — 9+ blog posts
- `src/lib/mock-data/services.ts` — 6 service categories
- `src/setupTests.ts` — testing-library/jest-dom setup

**Dependencies to install:**
- Vitest: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`
- Playwright: `@playwright/test`

**Scripts to add:**
- `test` → `vitest`
- `test:watch` → `vitest --watch`
- `test:coverage` → `vitest --coverage`
- `test:e2e` → `playwright test`

### Task 1: Homepage

- **Screen:** `585827f530fd4cd89b299d332eb562b3`
- **File:** `src/app/(main)/page.tsx` (Server Component)
- **Sections:** Hero with search tabs, Featured Properties (mock data), How It Works (3 cols), Find Services (6 cards), Trust section (brand-primary bg), Testimonials, Blog preview, CTA banner
- **Tests:** Vitest — renders all sections. Playwright — page loads, CTA links work.

### Task 2: Header + Footer

- **Screen:** Extract from homepage screen
- **Files:** `Header.tsx` (`"use client"` — scroll + mobile state), `Footer.tsx`
- **Header:** Sticky, transparent→solid on scroll, logo, nav links (Buy/Rent/Find Services/Valuations/Advice), Sign In + List Your Property buttons, mobile hamburger
- **Footer:** 5-column layout, social links, bottom bar with copyright
- **Tests:** Vitest — renders nav links, mobile toggle. Playwright — navigation works, mobile menu opens.

### Task 3: Search Results

- **Screens:** `3d474a72...` (search), `2571b08c...` (empty state)
- **Files:** `search/page.tsx` (`"use client"`), `EmptyState.tsx`
- **Features:** Compact search bar, filters sidebar, sort dropdown, view toggle (grid/list/map), 2-col property cards grid (mock data), empty state with suggestions
- **Tests:** Vitest — filters toggle, view switch, empty state renders. Playwright — page loads, filter interaction, card click navigation.

### Task 4: Property Detail + Sub-components

- **Screens:** 5 (detail, gallery, floor plan, price history, viewing booking)
- **Files:** `properties/[slug]/page.tsx`, `Gallery.tsx`, `FloorPlan.tsx`, `PriceHistory.tsx`, `ViewingBooking.tsx`
- **Layout:** 65% main / 35% sticky sidebar
- **Main:** Description, feature grid, gallery, floor plan, price history (Recharts), location placeholder
- **Sidebar:** Agent card, viewing booking widget
- **Mobile:** Sticky bottom bar (price + Book Viewing)
- **Tests:** Vitest — each sub-component renders with props. Playwright — page loads with slug, gallery opens, viewing form submits.

### Task 5: Auth Pages (Real Supabase)

- **Screens:** 3 (verify email, reset password, welcome)
- **Files:** `verify-email/page.tsx`, `reset-password/page.tsx`, `welcome/page.tsx`
- **Verify Email:** Mail icon, resend with 60s cooldown, real Supabase `getUser()`
- **Reset Password:** Password fields with strength meter, show/hide toggle, real Supabase `updateUser()`
- **Welcome:** Success state, role-specific CTA
- **Tests:** Vitest — mock Supabase client, form submission, error states. Playwright — form interaction, navigation.

### Task 6: Blog Pages

- **Screens:** 2 (blog home, blog post)
- **Files:** `blog/page.tsx`, `blog/[slug]/page.tsx`, `blog/layout.tsx`
- **Blog Home:** Hero, category pills, featured post, 3-col grid of BlogCards (mock data)
- **Blog Post:** Breadcrumbs, article header, prose body, related articles sidebar
- **Tests:** Vitest — renders posts, categories. Playwright — page loads, navigation between list and post.

### Task 7: Legal Page

- **Screen:** `6b02d6226ca6...`
- **File:** `legal/page.tsx` (Server Component)
- **Features:** Sidebar nav (Terms, Privacy, Cookies, Accessibility, Complaints), prose content, anchor links
- **Tests:** Vitest — renders sections. Playwright — anchor navigation works.

### Task 8: Token Alignment

- Grep all files for hardcoded hex values
- Replace with Tailwind design token classes
- Final `pnpm build` + `pnpm lint` must pass

## Testing Strategy

**Vitest (unit/component):**
- Every component renders without crashing
- Key elements present (headings, buttons, cards)
- Props reflected in output
- Interactive states (toggle, expand, filter)
- Auth: mock Supabase, test form submission + error states

**Playwright (E2E per route):**
- `/` — homepage loads, all sections visible, CTAs navigate correctly
- `/search` — filters toggle, view switch, empty state triggers
- `/properties/[slug]` — gallery opens, tabs switch, viewing form works
- `/verify-email` — resend button, cooldown timer
- `/reset-password` — password validation, strength meter, submit
- `/welcome` — CTA redirects
- `/blog` — post grid, category filter, card click → post page
- `/blog/[slug]` — article renders, related articles present
- `/legal` — sidebar nav, anchor scroll
- Mobile viewport: hamburger menu, sticky bars, responsive layout

## Done Criteria

- `pnpm build` passes with zero errors
- `pnpm lint` passes with zero warnings
- `pnpm test` passes — all Vitest tests green
- `pnpm test:e2e` passes — all Playwright tests green
- All 16 screens rendered matching Stitch design + britestatestyle.txt tokens
- No hardcoded hex values in any page/component file
- Auth pages wired to real Supabase
- Mock data typed and structured for DB swap
