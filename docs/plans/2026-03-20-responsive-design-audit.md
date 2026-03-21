# Britestate Responsive Design Audit — Decision Matrix

**Date:** 2026-03-20
**Breakpoints:** Mobile (375px) | Tablet (768px) | Desktop (1440px)
**Custom breakpoints defined in `globals.css`:** xs:375px, sm:640px, md:768px, lg:1024px, xl:1280px, 2xl:1536px

---

## Infrastructure Overview

| Component | File | Purpose |
|-----------|------|---------|
| `BreakpointContext` | `src/contexts/BreakpointContext.tsx` | Runtime breakpoint detection (`isMobile`, `isTablet`, `isDesktop`) |
| `useBreakpoint()` | `src/hooks/useBreakpoint.ts` | Hook to consume breakpoint state |
| `useIsMobile()` | `src/hooks/use-mobile.ts` | Simple mobile check (< 768px) |
| `useScrollDirection()` | `src/hooks/useScrollDirection.ts` | Scroll-aware header collapse |
| `DevBreakpointIndicator` | `src/components/responsive/DevBreakpointIndicator.tsx` | Color-coded viewport badge (dev only) |
| Touch utilities | `src/app/globals.css:176-206` | `.pb-safe`, `.pt-safe`, `.touch-target` (44x44), `.scrollbar-hide` |

---

## 1. Global Header / Navigation

**Files:** `src/components/layout/Header.tsx`, `src/components/layout/MobileNav.tsx`

| Aspect | Mobile (375px) | Tablet (768px) | Desktop (1440px) | Notes |
|--------|---------------|----------------|-------------------|-------|
| **Layout** | Logo + hamburger icon, right-aligned | Full horizontal nav bar visible | Full horizontal nav bar + auth buttons | Breakpoint: `md` (768px) switches hamburger → full nav |
| **Nav pattern** | Sheet drawer (slides from left, w-72) via `MobileNav.tsx` | Horizontal bar with all 5 links (Buy, Rent, Find Services, Valuations, Advice) | Same as tablet + Sign In / List Property buttons | Drawer closes on link click |
| **Font size** | Logo text `text-lg` | Logo text `text-lg` | Logo text `text-lg` | No scaling between breakpoints |
| **Height** | `h-14` (56px) | `h-16` (64px) | `h-16` (64px) | Breakpoint: `md` |
| **Padding** | `px-4` | `px-6` (sm+) | `px-8` (lg+) | Progressive padding: `px-4 sm:px-6 lg:px-8` |
| **Sticky behavior** | Sticky top-0, auto-hide on scroll down (via `useScrollDirection`) | Sticky, auto-hide on scroll | Sticky, always visible | `ProtectedHeader` adds scroll-aware hide for mobile/tablet |
| **Content priority** | Only logo + hamburger visible; all nav in drawer | All nav visible, auth buttons may compress | Everything visible | Auth buttons hidden on < md |

**Issues Found:**
- Header height jump (h-14 → h-16) at md could cause layout shift on orientation change
- No scroll-direction-aware collapse on public header (only ProtectedHeader)

---

## 2. Hero Section (Homepage)

**File:** `src/app/(main)/page.tsx` (homepage)

| Aspect | Mobile (375px) | Tablet (768px) | Desktop (1440px) | Notes |
|--------|---------------|----------------|-------------------|-------|
| **Layout** | Full-width stacked: hero image → heading → search bar | Same stacked layout, wider | Full-width hero with centered overlay text + search | Background image with gradient overlay |
| **Heading** | ~24px, centered, 2-3 lines | ~32px, centered, 2 lines | ~48px "Find your perfect British home, intelligently." single line | Scales via responsive text classes |
| **Search bar** | Full-width, stacked tabs (Buy/Rent/Services) | Wider search bar, tabs inline | Wide search bar with inline tabs + search button | Tabs collapse on mobile |
| **Image handling** | Same background image, `object-cover` fills viewport | Same, more width visible | Full panoramic view | CSS `background-size: cover` / `object-fit: cover` |
| **Spacing** | `py-12` to `py-16` | `py-16` to `py-20` | `py-20` to `py-24` | Vertical padding scales up |
| **Quick links** | "For Sale / To Rent / New Builds" pills, horizontal scroll | Same, no scroll needed | Same, spaciously laid out | Overflow-x-auto on smallest screens |

---

## 3. Featured Properties (Homepage)

| Aspect | Mobile (375px) | Tablet (768px) | Desktop (1440px) | Notes |
|--------|---------------|----------------|-------------------|-------|
| **Layout** | Single column, vertical stack | 2-column grid | 4-column grid | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| **Card size** | Full width | ~50% width each | ~25% width each | Property cards with image, price, details |
| **Image** | Full-width, aspect-ratio preserved | Same | Same | `aspect-[4/3]` or similar ratio |
| **Font** | Price `text-lg`, details `text-sm` | Same | Same | No font scaling on cards |
| **Spacing** | `gap-4` between cards | `gap-6` | `gap-6` | |
| **Content priority** | All info shown; "Match %" badge, save button | Same | Same | No content hidden at any breakpoint |
| **Scroll behavior** | Vertical scroll (stacked) | Grid, no scroll | Grid, no scroll | Could benefit from horizontal scroll on mobile |

---

## 4. How It Works / Social Proof Section

| Aspect | Mobile (375px) | Tablet (768px) | Desktop (1440px) | Notes |
|--------|---------------|----------------|-------------------|-------|
| **Layout** | Single column stack | 2-column grid | 3-column grid | Step cards with icons |
| **Icons** | Centered above text | Same | Same | Icon + heading + description pattern |
| **Font** | Section heading `text-2xl`, body `text-sm` | `text-3xl` | `text-3xl` to `text-4xl` | Responsive heading sizes |
| **Spacing** | `gap-6` | `gap-8` | `gap-8` | |

---

## 5. Service Provider Cards (Homepage + /services)

**File:** `src/app/(main)/services/page.tsx`

| Aspect | Mobile (375px) | Tablet (768px) | Desktop (1440px) | Notes |
|--------|---------------|----------------|-------------------|-------|
| **Browse by profession** | Single column list | 2-column grid | 3-column grid | Cards: Tradespeople, Estate Agents, Mortgage Brokers, etc. |
| **Popular trades** | Single column list | 2-column grid | 3-column grid | Plumbers, Electricians, Builders, etc. |
| **Card content** | Icon + title + description, full width | Side by side | 3 across | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| **Font** | Card title `text-base`, desc `text-sm` | Same | Same | |
| **Spacing** | `gap-4` | `gap-6` | `gap-6` | |
| **CTA banner** | Full width, stacked text + button | Same, more padding | Centered with generous whitespace | "Post a Job — Get Free Quotes" banner |
| **Image handling** | Icons only (no images to handle) | Same | Same | SVG icons scale naturally |

---

## 6. Trust / Stats Section (Homepage)

| Aspect | Mobile (375px) | Tablet (768px) | Desktop (1440px) | Notes |
|--------|---------------|----------------|-------------------|-------|
| **Layout** | 2x2 grid of stats | 4 inline | 4 inline | "350+ Properties, £1.2B, 4.8/5, 5,000+" |
| **Font** | Stat number `text-2xl`, label `text-xs` | `text-3xl` | `text-4xl` | Numbers scale significantly |
| **Spacing** | Compact, `gap-4` | `gap-8` | `gap-12` | |
| **Background** | Dark green/teal band, full width | Same | Same | Contrasting section |

---

## 7. Community Stories / Testimonials

| Aspect | Mobile (375px) | Tablet (768px) | Desktop (1440px) | Notes |
|--------|---------------|----------------|-------------------|-------|
| **Layout** | Single testimonial card, horizontal scroll or stacked | 2 visible | 3 visible | Carousel or grid pattern |
| **Card size** | Full width | ~50% | ~33% | |
| **Avatar** | Small (32px) | Medium (40px) | Medium (40px) | |
| **Quote text** | `text-sm`, 3-4 lines | `text-base` | `text-base` | |
| **Content priority** | May show fewer testimonials | All shown | All shown | |

---

## 8. Blog / Latest Articles Section

| Aspect | Mobile (375px) | Tablet (768px) | Desktop (1440px) | Notes |
|--------|---------------|----------------|-------------------|-------|
| **Layout** | Single column | 2-column | 3-column or featured + 2 sidebar | |
| **Image** | Full width, aspect-ratio maintained | Same | Same | Article thumbnail |
| **Font** | Title `text-lg`, excerpt `text-sm` | Same | Same | |
| **Content priority** | Category tag + date + title + excerpt | Same | Same + read time | |

---

## 9. CTA Section ("Ready to get started?")

| Aspect | Mobile (375px) | Tablet (768px) | Desktop (1440px) | Notes |
|--------|---------------|----------------|-------------------|-------|
| **Layout** | Stacked: heading → description → 2 buttons vertically | Same but buttons inline | Centered, buttons inline with spacing | |
| **Font** | Heading `text-2xl` | `text-3xl` | `text-4xl` | |
| **Buttons** | Full width, stacked | Inline, auto width | Inline, larger padding | "List Your Property" + "Find a Professional" |
| **Background** | Dark section (black/dark green) | Same | Same | |
| **Spacing** | `py-12 px-4` | `py-16 px-6` | `py-20 px-8` | Standard progressive padding |

---

## 10. Footer

**File:** `src/components/layout/Footer.tsx`

| Aspect | Mobile (375px) | Tablet (768px) | Desktop (1440px) | Notes |
|--------|---------------|----------------|-------------------|-------|
| **Layout** | Single column, sections stacked | 2-column grid | 6-column grid | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6` |
| **Sections** | Brand → Properties → Services → Company → Legal → Area Guides (vertical) | 2 per row | All 6 inline | |
| **Font** | Section headers `text-sm font-semibold`, links `text-sm` | Same | Same | |
| **Social icons** | Row of 4 icons below brand | Same | Same, in brand column | Twitter, LinkedIn, Instagram, Facebook |
| **Spacing** | `gap-8` | `gap-12` | `gap-12` | |
| **Bottom bar** | Stacked: copyright → legal links → back-to-top | Inline | Inline, spread with `justify-between` | |
| **Content priority** | All sections visible, just stacked | Same | Same | No content hidden |
| **Area Guides** | London, Manchester, Birmingham... all listed | Same | Same | 8 cities + "Browse all areas →" |

---

## 11. Login / Auth Pages

**File:** `src/app/(auth)/login/page.tsx`

| Aspect | Mobile (375px) | Tablet (768px) | Desktop (1440px) | Notes |
|--------|---------------|----------------|-------------------|-------|
| **Layout** | Single column, form only (full screen) | Split layout: form left, hero panel right | Split 50/50: form left, dark hero panel right | Hero panel hidden on mobile |
| **Hero panel** | **HIDDEN** | Visible, dark gradient with testimonial card | Same, larger | Shows stats: "250+ Properties, 90+ Verified Pros, 4.8 Rating" |
| **Form width** | Full width with `px-6` padding | ~50% of viewport | ~50%, max-width constrained | |
| **Font** | "Welcome back" `text-2xl` | Same | `text-3xl` | |
| **OAuth button** | Full width "Continue with Google" | Same | Same | |
| **Spacing** | `gap-4` between form elements | `gap-6` | `gap-6` | |
| **Content priority** | Form only — logo, OAuth, email/pass, forgot password, sign up link | Form + testimonial panel | Full experience | Mobile drops the marketing panel entirely |

**Issues Found:**
- Mobile login shows breakpoint indicator badge ("xs 375px") in bottom-right — dev-only, confirm it's stripped in production

---

## 12. Protected Layout (Dashboard / Settings)

**Files:** `src/components/layout/Sidebar.tsx`, `src/components/responsive/ResponsiveSidebar.tsx`, `src/app/(protected)/settings/layout.tsx`

| Aspect | Mobile (375px) | Tablet (768px) | Desktop (1440px) | Notes |
|--------|---------------|----------------|-------------------|-------|
| **Sidebar** | **HIDDEN** — hamburger button (top-4 left-4, z-50) opens Sheet drawer | **HIDDEN** — same hamburger drawer | Fixed left sidebar (w-64), collapsible to w-16 | `hidden lg:flex` — sidebar only on lg+ (1024px+) |
| **Main content** | Full width | Full width | Content area beside sidebar | |
| **Settings nav** | Horizontal scrolling pill nav (`overflow-x-auto`) | Same horizontal scroll | Vertical sidebar nav (w-56, `lg:flex-col`) | Settings layout uses `lg:flex-row` breakpoint |
| **Header** | `ProtectedHeader` with auto-hide on scroll (inbox + notifications) | Same | No ProtectedHeader — sidebar has nav | |
| **Spacing** | `px-4` | `px-6` | `px-8` with sidebar margin | |
| **Content priority** | Security badges hidden on < lg | Same | Shown inline in settings nav | `hidden lg:block` |
| **Scroll gradient** | Visible (hints more content scrollable) | Visible | **HIDDEN** (`lg:hidden`) | Guides mobile users to scroll nav |

---

## 13. Property Search / Listing Grid

| Aspect | Mobile (375px) | Tablet (768px) | Desktop (1440px) | Notes |
|--------|---------------|----------------|-------------------|-------|
| **Layout** | Filters above → single column results | Filters above → 2-column grid | Sidebar filters (left) → 3-column grid | Auth-gated, pattern from codebase analysis |
| **Filter panel** | Full-width collapsible accordion | Same | Fixed left sidebar filter | |
| **Map view** | Hidden or toggle (list ↔ map) | Split or toggle | Side-by-side with list | MapTiler/MapLibre |
| **Card layout** | Full-width cards, image on top | Image left, details right or grid | Grid cards | |
| **Sorting** | Dropdown, full width | Inline with result count | Inline toolbar | |

---

## 14. Cookie Consent Banner

| Aspect | Mobile (375px) | Tablet (768px) | Desktop (1440px) | Notes |
|--------|---------------|----------------|-------------------|-------|
| **Layout** | Full-width bottom bar, buttons stacked | Same, buttons inline | Same, buttons inline with more padding | |
| **Buttons** | "Reject" / "Manage" / "Accept All" stacked vertically | Inline row | Inline with generous spacing | |
| **Font** | `text-xs` to `text-sm` | `text-sm` | `text-sm` | |
| **Position** | Fixed bottom, z-50 | Same | Same | |

---

## Summary: Responsive Pattern Inventory

### Consistent Patterns (Well Implemented)

| Pattern | Implementation | Files |
|---------|---------------|-------|
| Progressive padding | `px-4 sm:px-6 lg:px-8` | Header, Footer, sections |
| Grid collapse | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/4/6` | Property cards, services, footer |
| Nav transformation | Horizontal bar → hamburger + Sheet drawer | Header.tsx → MobileNav.tsx |
| Sidebar transformation | Fixed sidebar → Sheet drawer | Sidebar.tsx, ResponsiveSidebar.tsx |
| Scroll-aware header | Auto-hide on scroll down (mobile/tablet only) | ProtectedHeader.tsx |
| Touch targets | `.touch-target` min 44x44px | globals.css |
| Safe area padding | `.pb-safe` / `.pt-safe` for notched devices | globals.css |
| Breakpoint context | `useBreakpoint()` + `useIsMobile()` hooks | BreakpointContext.tsx |

### Issues & Gaps Found

| # | Issue | Severity | Section | Recommendation |
|---|-------|----------|---------|----------------|
| 1 | **Header height shift** (h-14 → h-16 at md) | Low | Header | Consider consistent height or CSS transition |
| 2 | **No horizontal scroll on mobile property cards** | Medium | Featured Properties | Add horizontal scroll with snap points for mobile property browsing |
| 3 | **Breakpoint indicator visible in screenshots** | Low | Login | Confirm `DevBreakpointIndicator` is dev-only and stripped in prod build |
| 4 | **Settings nav scroll hint only on mobile** | Low | Settings | Works correctly — gradient hint guides users |
| 5 | **Two mobile detection hooks** (`useBreakpoint` vs `useIsMobile`) | Low | Infrastructure | Consider consolidating — currently `useIsMobile` uses 768px while `BreakpointContext.isTablet` includes md. Slightly different boundaries. |
| 6 | **Login hero panel hides entirely on mobile** | Info | Login | Intentional — form-first on mobile is correct UX |
| 7 | **No intermediate tablet sidebar state** | Medium | Protected layout | Tablet (768-1023px) has no sidebar at all — goes straight from hamburger to full sidebar at lg (1024px). Consider a collapsed icon-only sidebar at md. |
| 8 | **Cookie banner buttons stack on mobile** | Low | Cookie banner | Verify buttons don't overflow viewport width on 320px devices |
| 9 | **Footer 6-column jump** | Low | Footer | Goes from 2 cols (sm) straight to 6 cols (lg) — consider 3 cols at md for smoother transition |

### Breakpoint Decision Summary

```
┌──────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ Component    │ xs/375   │ sm/640   │ md/768   │ lg/1024  │ xl/1440  │
├──────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ Nav          │ Hamburger│ Hamburger│ Full bar │ Full bar │ Full bar │
│ Sidebar      │ Hidden   │ Hidden   │ Hidden   │ Full     │ Full     │
│ Grids        │ 1 col    │ 2 col    │ 2 col    │ 3-4 col  │ 4-6 col  │
│ Footer       │ 1 col    │ 2 col    │ 2 col    │ 6 col    │ 6 col    │
│ Login hero   │ Hidden   │ Hidden   │ Visible  │ Visible  │ Visible  │
│ Header h     │ 56px     │ 56px     │ 64px     │ 64px     │ 64px     │
│ Padding x    │ 16px     │ 24px     │ 24px     │ 32px     │ 32px     │
│ Settings nav │ H-scroll │ H-scroll │ H-scroll │ V-sidebar│ V-sidebar│
│ Scroll hide  │ Yes      │ Yes      │ Yes      │ No       │ No       │
└──────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

### Content Priority Rules

| Content | Mobile | Tablet | Desktop | Rule |
|---------|--------|--------|---------|------|
| Nav links | In drawer | Visible | Visible | Show at md+ |
| Auth buttons | In drawer | Visible | Visible | Show at md+ |
| Login hero panel | Hidden | Visible | Visible | Form-first on mobile |
| Sidebar | Drawer on demand | Drawer on demand | Always visible | Show at lg+ |
| Security badges (settings) | Hidden | Hidden | Visible | Show at lg+ |
| Scroll gradient hint | Visible | Visible | Hidden | Hide at lg+ |
| Back-to-top button | Visible | Visible | Visible | Always present |
| Cookie banner | Stacked buttons | Inline buttons | Inline buttons | Stack below sm |
| Property grid | 1 col vertical | 2 col grid | 4 col grid | Progressive columns |
| Footer columns | Stacked | 2-wide | 6-wide | Progressive columns |
