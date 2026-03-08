# Design: Phase 01 Foundation + Stitch Screen Import

**Date:** 2026-03-08
**Approach:** Wave-based parallel execution (Stream A + Stream B)

---

## Goal

Build the complete Phase 01 foundation: design system infrastructure AND all public-facing pages extracted from the Stitch project (ID: 5956704101394866719), following the Britestate style guide (`britestatestyle.txt`).

---

## Architecture

### Stream A — Foundation Infrastructure

| File | Purpose |
|------|---------|
| `src/app/globals.css` | Tailwind v4 `@theme` block with all Britestate design tokens |
| `src/lib/utils.ts` | `cn()` utility (clsx + tailwind-merge) |
| `src/lib/supabase/client.ts` | Browser Supabase client (`@supabase/ssr`) |
| `src/lib/supabase/server.ts` | Server Supabase client (async cookies, getAll/setAll) |
| `src/lib/supabase/admin.ts` | Service role client (bypasses RLS) |
| `src/env.ts` | Zod-validated env vars via `@t3-oss/env-nextjs` |
| `src/components/ui/*` | Shadcn components themed with Britestate tokens |

**Design tokens (from britestatestyle.txt):**
- Brand: `#1B4D3E` (primary), `#D4A853` (secondary), `#2563EB` (accent)
- Fonts: Plus Jakarta Sans (headings), Inter (body)
- Radius: sm=6px, md=8px, lg=12px, xl=16px, 2xl=24px
- Shadows: xs through xl per style guide
- All mapped as Tailwind v4 CSS custom properties via `@theme {}`

### Stream B — Pages from Stitch

Stitch `get_screen` extracts HTML/JSX for each screen. Output is adapted to Next.js App Router, TypeScript, and Tailwind utility classes referencing Stream A tokens.

**Convergence rule:** No hardcoded hex values in page files — all colors via CSS variables (`var(--color-brand-primary)`) or Tailwind utility classes (`bg-brand-primary`).

| Stitch Screen Label | Screen ID | Next.js Route |
|---------------------|-----------|---------------|
| Britestate Homepage main landing page | `585827f530fd4cd89b299d332eb562b3` | `app/(main)/page.tsx` |
| filter bar with blury background | `3d474a72aaa340bd8c1f72bdee771f5c` | `app/(main)/search/page.tsx` |
| property details | `6f7cc8cfb97b44ba954ab792ae96427d` | `app/(main)/properties/[id]/page.tsx` |
| listing | `95c24b9841474e0e8418e6108d716434` | `app/(main)/properties/[id]/listing/page.tsx` |
| floor plan | `7af9653173d245a58fb0ed61c411044f` | `components/properties/FloorPlan.tsx` |
| price history and growth | `5d4dc18f66744770af0b990a34161f90` | `components/properties/PriceHistory.tsx` |
| book a viewing calendar | `cbe0e5f3ead549dca3b49207399687f1` | `components/properties/ViewingBooking.tsx` |
| verify your email | `cc34494862f94b58b37d309520a748fa` | `app/(auth)/verify-email/page.tsx` |
| verify your email address | `a7259f9ba897429d87a7757ce9470f8b` | merged into verify-email |
| reset your password | `5cbb2e24cc7f41c19d8e7d822ee473a2` | `app/(auth)/reset-password/page.tsx` |
| welcome to britestate | `82993b148a1543439ff6ed1c7695faa0` | `app/(auth)/welcome/page.tsx` |
| Britestate blog homepage | `227966d416ca4378bc788d9ea528df8e` | `app/(main)/blog/page.tsx` |
| Blog post 1 | `90d16c9b74574904a947a32ea8b3fa77` | `app/(main)/blog/[slug]/page.tsx` |
| legal | `6b02d6226ca64637903e8e7d1d1fe607` | `app/(main)/legal/page.tsx` |
| no property match your filter | `2571b08c4b484e8981b64d6ed11672b6` | `components/search/EmptyState.tsx` |
| picture detailed | `0155b1e930e64d4a874b299f5f5b0c25` | `components/properties/Gallery.tsx` |

### Shared Layout Components

Extract from Stitch screens and place in:
- `components/layout/Header.tsx` — navbar (from homepage top)
- `components/layout/Footer.tsx` — full footer (from homepage bottom)
- `app/(main)/layout.tsx` — wraps Header + Footer around main content

---

## Execution Waves

**Wave 1 (parallel):**
- Task A1: Install deps, init Shadcn, write `globals.css` with Britestate tokens
- Task B1: Fetch Homepage screen from Stitch → write `app/(main)/page.tsx`

**Wave 2 (parallel, after Wave 1):**
- Task A2: Supabase clients + env validation + test infrastructure
- Task B2: Fetch Search + Property Detail screens → write route files
- Task B3: Fetch Auth screens → write auth route files

**Wave 3 (parallel):**
- Task B4: Fetch Blog + Legal screens → write route files
- Task B5: Extract shared components (Header, Footer, FloorPlan, PriceHistory, ViewingBooking, Gallery, EmptyState)

**Wave 4 (sequential):**
- Token alignment pass: verify no hardcoded colors remain in page files
- `pnpm build` verification
- `pnpm lint` verification

---

## Key Constraints

1. Next.js 16 App Router — Server Components by default, `"use client"` only when needed
2. Tailwind v4 — CSS-first config, no `tailwind.config.ts`
3. TypeScript strict mode — all components typed
4. Stitch output is HTML/CSS — must be converted to JSX/TSX with Tailwind classes
5. All images use `next/image` with proper `alt` text
6. No placeholder lorem ipsum — use realistic UK property data per style guide

---

## Success Criteria

- `pnpm build` passes with zero errors
- All 16 pages/components render without runtime errors
- CSS variables from `globals.css` are consumed correctly in page files
- Header and Footer appear on all `(main)` routes
- Auth pages render within `(auth)` layout (centered card, minimal nav)
