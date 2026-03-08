# Phase 01 Stitch Screen Import — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Import all Phase 01 Stitch screens (project ID: `5956704101394866719`) into the Next.js app, creating/updating pages to match the Britestate design system.

**Architecture:** Use the `mcp__stitch__get_screen` tool to fetch each screen's code, convert HTML/CSS to Next.js App Router TSX with Tailwind utility classes, wire in Britestate CSS variables from `globals.css`. Foundation (design tokens, Shadcn, Supabase) is already complete — this plan is purely page-level work.

**Tech Stack:** Next.js 16 App Router · TypeScript strict · Tailwind v4 · Shadcn UI · Lucide React · `cn()` from `@/lib/utils`

**Stitch Project:** `projects/5956704101394866719`
**Working directory for all commands:** `/Users/joanflerinbig/Documents/britv3.0`

---

## Screen ID Map

| Page | Stitch Screen ID | Target File |
|------|-----------------|-------------|
| Homepage | `585827f530fd4cd89b299d332eb562b3` | `src/app/(main)/page.tsx` |
| Header (extract from homepage) | `585827f530fd4cd89b299d332eb562b3` | `src/components/layout/Header.tsx` |
| Footer (extract from homepage) | `585827f530fd4cd89b299d332eb562b3` | `src/components/layout/Footer.tsx` |
| Search Results | `3d474a72aaa340bd8c1f72bdee771f5c` | `src/app/(main)/search/page.tsx` |
| Search — No Results | `2571b08c4b484e8981b64d6ed11672b6` | `src/components/search/EmptyState.tsx` |
| Property Detail | `6f7cc8cfb97b44ba954ab792ae96427d` | `src/app/(main)/properties/[slug]/page.tsx` |
| Property Gallery | `0155b1e930e64d4a874b299f5f5b0c25` | `src/components/properties/Gallery.tsx` |
| Floor Plan | `7af9653173d245a58fb0ed61c411044f` | `src/components/properties/FloorPlan.tsx` |
| Price History | `5d4dc18f66744770af0b990a34161f90` | `src/components/properties/PriceHistory.tsx` |
| Book Viewing | `cbe0e5f3ead549dca3b49207399687f1` | `src/components/properties/ViewingBooking.tsx` |
| Verify Email | `cc34494862f94b58b37d309520a748fa` | `src/app/(auth)/verify-email/page.tsx` |
| Reset Password | `5cbb2e24cc7f41c19d8e7d822ee473a2` | `src/app/(auth)/reset-password/page.tsx` |
| Welcome | `82993b148a1543439ff6ed1c7695faa0` | `src/app/(auth)/welcome/page.tsx` |
| Blog Home | `227966d416ca4378bc788d9ea528df8e` | `src/app/(main)/blog/page.tsx` |
| Blog Post | `90d16c9b74574904a947a32ea8b3fa77` | `src/app/(main)/blog/[slug]/page.tsx` |
| Legal | `6b02d6226ca64637903e8e7d1d1fe607` | `src/app/(main)/legal/page.tsx` |

---

## Conversion Rules (apply to EVERY task)

When converting Stitch HTML/CSS output to TSX:

1. **No hardcoded hex values** — replace with Tailwind classes: `bg-brand-primary`, `text-brand-accent`, `border-neutral-200`, etc.
2. **No inline `style={{}}` for colors/spacing** — use Tailwind utilities
3. **Images** → `<Image>` from `next/image` with `alt`, `width`, `height` props
4. **Links** → `<Link>` from `next/link`
5. **Icons** → Lucide React (`import { Home } from "lucide-react"`)
6. **`class=`** → `className=`
7. **Interactive elements** → add `"use client"` directive at top of file
8. **Static/SSR pages** → NO `"use client"` directive (Server Components)
9. **Buttons** → use `<Button>` from `@/components/ui/button` with correct variant
10. **`cn()` utility** → import from `@/lib/utils` for conditional classes

---

## Task 1: Homepage

**Files:**
- Modify: `src/app/(main)/page.tsx`

**Step 1: Fetch the screen**

Use `mcp__stitch__get_screen` with:
- `name`: `projects/5956704101394866719/screens/585827f530fd4cd89b299d332eb562b3`
- `projectId`: `5956704101394866719`
- `screenId`: `585827f530fd4cd89b299d332eb562b3`

**Step 2: Convert and write**

Apply all Conversion Rules. The homepage is a Server Component (no `"use client"`). Structure:
- Hero section with search bar (Buy/Rent/Find Services tabs) — static mock, no live data yet
- Featured Properties grid — use `PropertyCardGrid` component if it exists, else mock 4 cards
- "How it works" section — 3 columns
- "Find Services" section — 6 service category cards
- Trust/verification section (brand-primary bg)
- Testimonials section
- Blog preview (3 cards — will link to `/blog`)
- CTA banner

Write complete TSX to `src/app/(main)/page.tsx`, replacing the existing file.

**Step 3: Verify**

```bash
pnpm build 2>&1 | tail -20
```
Expected: exits 0, no TypeScript errors.

**Step 4: Commit**

```bash
git add src/app/(main)/page.tsx
git commit -m "feat(pages): import homepage from Stitch screen 585827f"
```

---

## Task 2: Header + Footer

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/Footer.tsx`

**Step 1: Fetch the screen** (reuse homepage screen — it contains nav and footer)

Same screen as Task 1: `585827f530fd4cd89b299d332eb562b3`

**Step 2: Extract and write Header**

The header from the Stitch design should be:
- Sticky, white bg, 64px height desktop / 56px mobile
- Left: Britestate logo (use `<Logo>` from `@/components/shared/Logo`)
- Centre: nav links — Buy, Rent, Find Services, Valuations, Advice
- Right: "Sign In" ghost button + "List Your Property" primary button
- Mobile: logo left, hamburger right
- Transparent on homepage hero, becomes solid on scroll (`scrolled` state)
- `"use client"` required (scroll listener + mobile state)

Write complete TSX to `src/components/layout/Header.tsx`.

**Step 3: Extract and write Footer**

The footer from the Stitch design should be:
- 5-column layout: Logo+socials | Properties | Services | Company | Legal
- Bottom bar: © 2025 Britestate Ltd · Company No. XXXXXXXX
- Mobile: accordion collapsible columns
- `"use client"` if accordion state needed, else Server Component

Write complete TSX to `src/components/layout/Footer.tsx`.

**Step 4: Verify**

```bash
pnpm build 2>&1 | tail -20
```

**Step 5: Commit**

```bash
git add src/components/layout/Header.tsx src/components/layout/Footer.tsx
git commit -m "feat(layout): update Header and Footer from Stitch design"
```

---

## Task 3: Search Results Page

**Files:**
- Modify: `src/app/(main)/search/page.tsx`
- Create: `src/components/search/EmptyState.tsx`

**Step 1: Fetch Search screen**

Use `mcp__stitch__get_screen` with screenId: `3d474a72aaa340bd8c1f72bdee771f5c`

**Step 2: Fetch Empty State screen**

Use `mcp__stitch__get_screen` with screenId: `2571b08c4b484e8981b64d6ed11672b6`

**Step 3: Convert and write Search page**

Structure for `src/app/(main)/search/page.tsx`:
- `"use client"` required (filters, view toggle state)
- Sticky compact search bar at top with "Filters (N)" button and sort dropdown
- View toggle: Grid | List | Map
- Results count: "847 properties for sale in London"
- Left sidebar (desktop): filter panel with collapsible sections — Price range, Property type checkboxes, Bedrooms selector, Must-haves toggles
- Main content: 2-col grid of property cards (mock data, 8 cards minimum)
- Each property card: image, price, address, beds/baths/sqft icons, agent name
- Mobile: sticky bottom bar with Map/Filters/Sort buttons

**Step 4: Convert and write EmptyState**

`src/components/search/EmptyState.tsx` — centred illustration (use a Lucide `SearchX` icon), "No properties match your filters" heading, suggestion bullets, "Set up an alert" CTA button.

**Step 5: Verify**

```bash
pnpm build 2>&1 | tail -20
```

**Step 6: Commit**

```bash
git add src/app/(main)/search/page.tsx src/components/search/EmptyState.tsx
git commit -m "feat(pages): import search results page and empty state from Stitch"
```

---

## Task 4: Property Detail + Sub-components

**Files:**
- Modify: `src/app/(main)/properties/[slug]/page.tsx`
- Create: `src/components/properties/Gallery.tsx`
- Create: `src/components/properties/FloorPlan.tsx`
- Create: `src/components/properties/PriceHistory.tsx`
- Create: `src/components/properties/ViewingBooking.tsx`

**Step 1: Fetch all 4 screens in parallel**

Fetch these screen IDs:
- Property Detail: `6f7cc8cfb97b44ba954ab792ae96427d`
- Gallery: `0155b1e930e64d4a874b299f5f5b0c25`
- Floor Plan: `7af9653173d245a58fb0ed61c411044f`
- Price History: `5d4dc18f66744770af0b990a34161f90`
- Viewing Booking: `cbe0e5f3ead549dca3b49207399687f1`

**Step 2: Write Gallery component**

`src/components/properties/Gallery.tsx` — `"use client"`:
- Props: `images: { src: string; alt: string }[]`
- Desktop: 2+2 grid (1 large left, 3 thumbnails right), "View All X Photos" overlay button
- Mobile: swipeable carousel with dot indicators + "1/24" count badge
- Click → fullscreen lightbox (use Dialog from `@/components/ui/dialog`) with arrow navigation

**Step 3: Write FloorPlan component**

`src/components/properties/FloorPlan.tsx` — `"use client"`:
- Props: `floors: { label: string; src: string }[]`
- Image viewer with tab per floor
- Click to expand (Dialog)

**Step 4: Write PriceHistory component**

`src/components/properties/PriceHistory.tsx` — `"use client"`:
- Props: `history: { date: string; price: number; event?: string }[]`
- Line chart using Recharts `LineChart`
- Event markers: "Listed", "Reduced", "SSTC"
- Mock data if no Recharts installed: install with `pnpm add recharts`

**Step 5: Write ViewingBooking component**

`src/components/properties/ViewingBooking.tsx` — `"use client"`:
- Props: `agentName: string; propertyAddress: string`
- Day pills (next 14 days, horizontal scroll)
- Time slot grid for selected date
- In-person / Virtual toggle
- Name, email, phone fields
- "Book Viewing" primary button
- Confirmation state: green check + "Add to Calendar" links

**Step 6: Write Property Detail page**

`src/app/(main)/properties/[slug]/page.tsx` — Server Component (no `"use client"`):
- Import and compose: `<Gallery>`, `<FloorPlan>`, `<PriceHistory>`, `<ViewingBooking>`
- Layout: 65% main content | 35% sticky sidebar
- Main: description, feature grid (beds/baths/sqft/EPC with icons), location map placeholder, insights
- Sidebar: agent card (avatar, name, agency, rating, contact buttons), `<ViewingBooking>`
- Sticky bottom bar on mobile: price + "Book Viewing" button
- Use mock property data (UK address, price £425,000, 3 beds, 2 baths)

**Step 7: Verify**

```bash
pnpm build 2>&1 | tail -20
```

**Step 8: Commit**

```bash
git add src/app/(main)/properties/[slug]/page.tsx src/components/properties/
git commit -m "feat(pages): import property detail page and sub-components from Stitch"
```

---

## Task 5: Auth Pages

**Files:**
- Modify: `src/app/(auth)/verify-email/page.tsx`
- Modify: `src/app/(auth)/reset-password/page.tsx`
- Create: `src/app/(auth)/welcome/page.tsx`

**Step 1: Fetch Auth screens**

Fetch:
- Verify Email: `cc34494862f94b58b37d309520a748fa`
- Reset Password: `5cbb2e24cc7f41c19d8e7d822ee473a2`
- Welcome: `82993b148a1543439ff6ed1c7695faa0`

**Step 2: Update Verify Email page**

`src/app/(auth)/verify-email/page.tsx` — `"use client"` (resend timer):
- Large animated mail icon (use Lucide `Mail`, add Tailwind animation)
- "Check your email" heading
- "We've sent a verification link to [email]"
- "Didn't receive it? Resend" link with 60s cooldown timer
- "Change email address" link back to register

Preserve existing Supabase `getUser()` logic — only update the visual layout.

**Step 3: Update Reset Password page**

`src/app/(auth)/reset-password/page.tsx` — `"use client"`:
- "Create a new password" heading
- New Password field with show/hide toggle (eye icon)
- Password strength meter (4 levels: weak/fair/good/strong, coloured bar)
- Confirm Password field
- "Reset Password" primary button
- Success state: green check, "Password updated. Sign in →"

Preserve existing Supabase `updateUser()` logic.

**Step 4: Create Welcome page**

`src/app/(auth)/welcome/page.tsx` — Server Component:
- Green animated check circle
- "Welcome to Britestate!" heading
- "Your account is ready. Let's get started."
- Role-specific CTA buttons (for now: "Start Searching" → `/search`)
- Trust badges row below

**Step 5: Verify**

```bash
pnpm build 2>&1 | tail -20
```

**Step 6: Commit**

```bash
git add src/app/(auth)/verify-email/page.tsx src/app/(auth)/reset-password/page.tsx src/app/(auth)/welcome/page.tsx
git commit -m "feat(auth): update auth pages from Stitch screens"
```

---

## Task 6: Blog Pages (New)

**Files:**
- Create: `src/app/(main)/blog/page.tsx`
- Create: `src/app/(main)/blog/[slug]/page.tsx`
- Create: `src/app/(main)/blog/layout.tsx`

**Step 1: Fetch Blog screens**

Fetch:
- Blog Home: `227966d416ca4378bc788d9ea528df8e`
- Blog Post: `90d16c9b74574904a947a32ea8b3fa77`

**Step 2: Create blog layout**

`src/app/(main)/blog/layout.tsx` — Server Component:
```tsx
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-neutral-50">{children}</div>;
}
```

**Step 3: Create Blog Home page**

`src/app/(main)/blog/page.tsx` — Server Component:
- Hero: "Britestate Advice & Insights" heading, search input, category filter pills
- Featured post: large card (image + category badge + title + excerpt + author + read time)
- Grid: 3-col grid of `BlogCard` components (mock 9 posts minimum)
- Each BlogCard: 16:9 image, category badge, title, excerpt (2 lines), author avatar + name + date + read time
- Categories: Buying, Renting, Selling, Landlord Tips, Market News, Legal
- Mock posts with realistic UK property titles: "First-Time Buyer's Guide to Stamp Duty 2025", "How to Find a Trusted Tradesperson", etc.

**Step 4: Create Blog Post page**

`src/app/(main)/blog/[slug]/page.tsx` — Server Component:
- Breadcrumbs: Home > Blog > [Category] > [Title]
- Article header: category badge, title (H1), author card, date, read time, share buttons
- Article body: well-formatted prose (use `prose` Tailwind typography class if available, else manual styles)
- Sidebar: "Related Articles" (3 cards), newsletter signup widget
- Bottom: author bio card, "More from [Category]" section
- Mock content: realistic 800-word article body

**Step 5: Verify**

```bash
pnpm build 2>&1 | tail -20
```

**Step 6: Commit**

```bash
git add src/app/(main)/blog/
git commit -m "feat(pages): create blog home and post pages from Stitch screens"
```

---

## Task 7: Legal Page (New)

**Files:**
- Create: `src/app/(main)/legal/page.tsx`

**Step 1: Fetch Legal screen**

Fetch: `6b02d6226ca64637903e8e7d1d1fe607`

**Step 2: Create Legal page**

`src/app/(main)/legal/page.tsx` — Server Component:
- Left sidebar nav: Terms of Service, Privacy Policy, Cookie Policy, Accessibility, Complaints
- Main content area with section headings and prose text
- Anchor links from sidebar to sections
- "Last updated: January 2026" timestamp per section
- Mock legal content — realistic but clearly placeholder (add `{/* TODO: real legal text */}` comment)

**Step 3: Verify**

```bash
pnpm build 2>&1 | tail -20
```

**Step 4: Commit**

```bash
git add src/app/(main)/legal/page.tsx
git commit -m "feat(pages): create legal page from Stitch screen"
```

---

## Task 8: Final Token Alignment + Build Verification

**Files:** Any file modified in Tasks 1–7 that has hardcoded hex values

**Step 1: Scan for hardcoded colors**

```bash
grep -rn "#[0-9A-Fa-f]\{3,6\}" src/app src/components --include="*.tsx" | grep -v "node_modules" | grep -v ".test."
```

**Step 2: Replace hardcoded values**

For each hit, replace with the appropriate Tailwind class:
- `#1B4D3E` → `bg-brand-primary` or `text-brand-primary`
- `#D4A853` → `bg-brand-secondary` or `text-brand-secondary`
- `#2563EB` → `bg-brand-accent` or `text-brand-accent`
- `#F8F8FA` → `bg-neutral-50`
- `#E2E2E8` → `border-neutral-200`
- `#171719` → `text-neutral-900`

**Step 3: Final build + lint**

```bash
pnpm build 2>&1 | tail -20
pnpm lint 2>&1 | tail -20
```
Both must exit 0.

**Step 4: Final commit**

```bash
git add -u
git commit -m "style: replace hardcoded hex values with Britestate design tokens"
```

---

## Done Criteria

- [ ] `pnpm build` passes with zero errors
- [ ] `pnpm lint` passes with zero warnings
- [ ] Homepage renders with hero, featured properties, how-it-works, services, testimonials, blog preview, CTA
- [ ] Search page renders with filter sidebar, property card grid, empty state
- [ ] Property detail renders with gallery, feature grid, floor plan, price history, viewing booking, agent sidebar
- [ ] Auth pages (verify-email, reset-password, welcome) render correctly
- [ ] Blog home + blog post pages render
- [ ] Legal page renders
- [ ] No hardcoded hex values in any page/component file
- [ ] Header and Footer match Stitch design on all routes
