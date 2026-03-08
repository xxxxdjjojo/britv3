# Phase 05 Stitch Screen Import — Design Document

**Date:** 2026-03-08
**Phase:** 5 — Financial Tools & Area Pages
**Stitch Project:** `5956704101394866719`

## Goal

Import all 11 Phase 5 Stitch screens into the Next.js app, creating pages and components that match the Britestate design system. This is purely UI/page-level work — no backend, no Supabase, no API routes. All calculators use client-side state with mock data.

## Stitch Output Format

Each screen returns standalone HTML with:
- Tailwind CDN (`tailwind.config` inline with `primary: #196ee6`)
- Public Sans font
- Material Icons / Material Symbols
- Plain HTML (no React)

All of these must be converted to the Britestate stack.

## Screen-to-File Map

### Financial Calculators (6 screens) — `src/app/(main)/tools/`

| Screen Title | Stitch Screen ID | Target File | Component Type |
|---|---|---|---|
| Mortgage Affordability Calculator | `56283418fa2a41aea87461092ed58194` | `tools/affordability-calculator/page.tsx` | `"use client"` |
| Mortgage Repayment Calculator | `14cf81cb753f41d8b7ac6c0973a6f4dd` | `tools/mortgage-calculator/page.tsx` | `"use client"` |
| Stamp Duty (SDLT) Calculator | `a3c149b3aa5640cebd5986bb55a87928` | `tools/stamp-duty-calculator/page.tsx` | `"use client"` |
| Rental Yield & ROI Calculator | `d518e6b663d04927a8a51197f63eb323` | `tools/rental-yield-calculator/page.tsx` | `"use client"` |
| Buy vs Rent Comparison Tool | `a1aac422c87a4ec4855c7b080000a030` | `tools/buy-vs-rent-calculator/page.tsx` | `"use client"` |
| Energy Bill & EPC Estimator | `6f3e855349ed41209619da42747d7cb3` | `tools/energy-bill-estimator/page.tsx` | `"use client"` |

### Area Guide Pages (4 screens) — `src/app/(main)/`

| Screen Title | Stitch Screen ID | Target File | Component Type |
|---|---|---|---|
| City Area Guide - London | `d5d8601b6b0f4fe2bab81596ee6640b0` | `properties/[city]/page.tsx` | Server Component |
| Borough Guide - Isleworth | `689da03ba0b749f1abf6443cbe73eb33` | `properties/[city]/[area]/page.tsx` | Server Component |
| Sold Prices - Isleworth | `d10d9a08b8ff43878117d7336b33ccf6` | `sold-prices/[area]/page.tsx` | Server Component |
| UK Market Trends Dashboard | `8d309f31ef0348deaeaab173fbc16eac` | `market-trends/page.tsx` | Server Component |

### AI Feature (1 screen)

| Screen Title | Stitch Screen ID | Target File | Component Type |
|---|---|---|---|
| AI Listing Assistant | `d99b9b5bb6f54ef580ebfd0ccb6408d9` | `components/ai/ListingAssistant.tsx` | `"use client"` |

## HTML Download URLs

### Financial Calculators
- Mortgage Affordability: `projects/5956704101394866719/files/0e57ebf0a6ed4266b34247963aaf4a52`
- Mortgage Repayment: `projects/5956704101394866719/files/4b414b79dd454eb4a43178ffa06bfe12`
- SDLT: `projects/5956704101394866719/files/42048010a9774c1da450e3fb9e1106c7`
- Rental Yield: `projects/5956704101394866719/files/a0ea634af873458589f200e1c6d23bc6`
- Buy vs Rent: `projects/5956704101394866719/files/8faba0526d7d4913929e115378590d9f`
- Energy Bill: `projects/5956704101394866719/files/306bdde2b32941a9b33ff871170660b5`

### Area Pages
- City Guide (London): `projects/5956704101394866719/files/42b09980e6c34d209442ac81983c53f9`
- Borough Guide (Isleworth): `projects/5956704101394866719/files/aa0909b40664475dbab850ce3a40f1ac`
- Sold Prices: `projects/5956704101394866719/files/a578299b40af4df7953cba85c59b45ef`
- Market Trends: `projects/5956704101394866719/files/e3eb73b7b5f94a82bd6e0f7b764459cb`

### AI Feature
- AI Listing Assistant: `projects/5956704101394866719/files/017c61de02f3447f9d144a3366802662`

## Conversion Rules

When converting Stitch HTML/CSS output to TSX:

1. **No hardcoded hex values** — replace with Tailwind classes: `bg-brand-primary`, `text-brand-accent`, `border-neutral-200`, etc.
2. **No inline `style={{}}` for colors/spacing** — use Tailwind utilities
3. **Images** -> `<Image>` from `next/image` with `alt`, `width`, `height` props
4. **Links** -> `<Link>` from `next/link`
5. **Icons** -> Lucide React (replace Material Icons with closest Lucide equivalent)
6. **`class=`** -> `className=`
7. **Interactive elements** -> add `"use client"` directive at top of file
8. **Static/SSR pages** -> NO `"use client"` directive (Server Components)
9. **Buttons** -> use `<Button>` from `@/components/ui/button` with correct variant
10. **`cn()` utility** -> import from `@/lib/utils` for conditional classes
11. **Fonts** -> Replace `Public Sans` with `font-heading` (Plus Jakarta Sans) for headings, `font-body` (Inter) for body
12. **Colors** -> `#196ee6` primary -> `brand-primary` (#1B4D3E); `#f6f7f8` bg -> `neutral-50`; all slate-* map to neutral-* tokens

## Shared Tools Layout

`src/app/(main)/tools/layout.tsx` — Server Component wrapping all calculator pages:
- Consistent max-width container
- `bg-neutral-50` background
- Metadata defaults for SEO

## Britestate Style Reference

All pages follow the design system from `britestatestyle.txt`:
- Colors: `--brand-primary: #1B4D3E`, `--brand-secondary: #D4A853`, `--brand-accent: #2563EB`
- Typography: Plus Jakarta Sans (headings 600-700), Inter (body 400-500)
- Spacing: 4px base unit
- Border radius: sm=6px, md=8px, lg=12px, xl=16px, 2xl=24px
- Shadows: xs through xl scale
- Component rules: Shadcn/UI primitives, TypeScript interfaces, Lucide icons, 44x44px mobile touch targets

## Done Criteria

- [ ] `pnpm build` passes with zero errors
- [ ] `pnpm lint` passes with zero warnings
- [ ] All 6 calculator pages render with interactive inputs and real-time results
- [ ] All 4 area guide pages render with mock UK property data
- [ ] AI Listing Assistant component renders
- [ ] No hardcoded hex values in any page/component file
- [ ] All pages use Britestate design tokens (brand-primary, brand-secondary, neutral-*)
- [ ] All Material Icons replaced with Lucide React equivalents
- [ ] All fonts use Plus Jakarta Sans / Inter (no Public Sans)
