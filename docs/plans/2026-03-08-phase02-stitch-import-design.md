# Phase 02 Property Portal — Stitch Screen Import Design

**Date:** 2026-03-08
**Approach:** Hybrid (import 3 existing Stitch screens + generate 5 from britestatestyle.txt prompts)
**Stitch Project:** `5956704101394866719`
**Working directory:** `/Users/joanflerinbig/Documents/britv3.0`

---

## Overview

Import and generate all Phase 02 Property Portal UI screens using Google Stitch, then convert to Next.js App Router TSX with Britestate design tokens. This covers: search results with map, property detail, saved properties, listing wizard, listing analytics, area guides, and sold prices.

## Conversion Rules (apply to every file)

1. No hardcoded hex values — use Tailwind: `bg-brand-primary`, `text-brand-accent`, `border-neutral-200`
2. No inline `style={{}}` for colors/spacing — use Tailwind utilities
3. Images → `<Image>` from `next/image` with `alt`, `width`, `height`
4. Links → `<Link>` from `next/link`
5. Icons → `lucide-react`
6. `class=` → `className=`
7. Interactive elements → add `"use client"` directive
8. Static/SSR pages → NO `"use client"` (Server Components)
9. Buttons → `<Button>` from `@/components/ui/button`
10. `cn()` utility → import from `@/lib/utils`

---

## Group 1: Import Existing Stitch Screens

### Task 1: Saved Properties Management

**Source:** Stitch `4fce8bcc4fd54dc19387982da78a4907`
**File:** `src/app/(protected)/dashboard/[role]/saved/page.tsx`
**Directive:** `"use client"`

**Layout:**
- Top bar: "Saved Properties" heading + Grid/List toggle + Sort dropdown (Date Saved, Price Low→High, Price High→Low)
- Filter pills: For Sale | To Rent | All
- PropertyCard grid (2-col desktop, 1-col mobile) with heart-filled icon + "Remove" trash icon (confirm dialog)
- "Compare" button — select 2-3 properties → comparison table modal (price, beds, baths, sqft, EPC)
- Empty state: heart icon, "No saved properties yet", "Start exploring" CTA → `/search`
- Mock data: 6 saved UK properties

**Steps:**
1. Fetch screen via `mcp__stitch__get_screen`
2. Convert HTML/CSS → TSX with conversion rules
3. `pnpm build` — must pass
4. Commit: `feat(dashboard): import saved properties page from Stitch`

---

### Task 2: Listing Wizard (2 screens)

**Sources:** `d00141ad744f4447b1412d3bc2103537` (Property Type) + `97df5050086b49aa8566c47f1baa39e9` (Media Upload)
**Files:**
- `src/app/(protected)/dashboard/[role]/listings/new/page.tsx` — wizard shell with stepper
- `src/components/listings/ListingFormSteps/PropertyDetails.tsx` — Step 1
- `src/components/listings/ListingFormSteps/Description.tsx` — Step 2
- `src/components/listings/ListingFormSteps/Pricing.tsx` — Step 3
- `src/components/listings/ListingFormSteps/MediaUpload.tsx` — Step 4
- `src/components/listings/ListingFormSteps/Review.tsx` — Step 5
**Directive:** `"use client"` (multi-step form state)

**5-step wizard:**
1. Address & Type — PostcodeInput, property type select, tenure (freehold/leasehold)
2. Details & Description — beds/baths/receptions NumberSteppers, features multi-select, AI-assisted description textarea
3. Pricing — listing type (Sale/Rent/Auction), CurrencyInput, price qualifier dropdown
4. Photos & Media — drag-drop grid (reorder), min 5 / max 30, floor plan upload, virtual tour URL
5. Review & Publish — full preview, checklist with status icons, "Publish" / "Save Draft" buttons

**Steps:**
1. Fetch both screens via `mcp__stitch__get_screen`
2. Extract wizard patterns from both, merge into 5-step structure
3. Create wizard shell + 5 step components
4. `pnpm build` — must pass
5. Commit: `feat(listings): import listing wizard from Stitch screens`

---

### Task 3: Listing Performance Analytics

**Source:** `d2e0cda46c2147cf8a36adbf80322c11`
**Files:**
- `src/app/(protected)/dashboard/[role]/listings/[id]/analytics/page.tsx`
- `src/components/listings/ListingAnalytics.tsx`
**Directive:** `"use client"` (date range, charts)

**Layout:**
- Date range selector (7d / 30d / 90d / Custom)
- Stat cards row: Total Views, Unique Viewers, Saves, Enquiries
- Line chart: views over time (Recharts)
- Pie chart: enquiry sources
- Comparison to area average (bar chart)
- "Boost Your Listing" CTA if below average

**Steps:**
1. Fetch screen via `mcp__stitch__get_screen`
2. Convert to TSX, install `recharts` if not present
3. `pnpm build` — must pass
4. Commit: `feat(listings): import listing analytics from Stitch`

---

## Group 2: Generate via Stitch + britestatestyle.txt

### Task 4: Search Results + Map View

**Generate with:** `mcp__stitch__generate_screen_from_text` using britestatestyle.txt §1.1 prompt + master context
**Files:**
- `src/app/(main)/search/page.tsx` — page shell
- `src/components/search/SearchBar.tsx` — compact sticky bar with location + "Filters (N)"
- `src/components/search/SearchFilters.tsx` — filter panel (sidebar desktop / bottom sheet mobile)
- `src/components/search/SearchResults.tsx` — card grid with infinite scroll placeholder
- `src/components/search/SearchSortBar.tsx` — sort + view toggle + results count
- `src/components/search/PropertyCard.tsx` — 5 variants (grid/list/map-popup/compact/featured)
- `src/components/search/EmptyState.tsx` — no results with suggestions
**Directive:** `"use client"` for page

**Key design points:**
- Desktop: 3-panel (280px filter sidebar | results | 50% map placeholder)
- View toggle: Grid / List / Map
- Mobile: single-col cards, sticky bottom bar (Map / Filters / Sort)
- Filter sections: price range, property type checkboxes, bedrooms, must-haves, max days listed, include SSTC
- PropertyCard grid variant: 16:10 image carousel, price + type badge, address, feature pills (beds/baths/sqft), agent line, heart save button, hover lift
- PropertyCard list variant: horizontal (40% image, 60% content), description excerpt, "Listed 3 days ago"
- Mock data: 12 UK property cards

**Stitch prompt (to generate):**
```
=== BRITESTATE MASTER CONTEXT ===
[full master context from britestatestyle.txt lines 8-103]
=== END MASTER CONTEXT ===

Create the property search results page — the second most important page.

LAYOUT: SearchLayout template

TOP BAR (sticky):
- Compact PropertySearchBar with location shown
- Filter trigger button showing active count: "Filters (3)"
- Sort dropdown: "Most Recent" | "Price (Low–High)" | "Price (High–Low)" | "Most Popular"
- View toggle: Grid | List | Map (icon buttons)
- Results count: "847 properties for sale in London"

LEFT SIDEBAR (desktop only, 280px):
- FilterPanel with all filter sections
- "Save This Search" button at top with bell icon
- Collapsible sections with smooth animation

MAIN CONTENT AREA:
- Grid View: 2-col desktop, 1-col mobile grid of PropertyCard (grid variant)
- List View: Full-width PropertyCard (list variant) stacked
- Between every 8 results: contextual insert — "Looking for a mortgage? Compare rates →"
- Infinite scroll with skeleton loading (or pagination toggle option)
- "Back to top" floating button after scrolling

MAP PANEL (desktop, 50% right side):
- Map placeholder area with custom MapMarker components
- Markers show price, colour-coded by type
- Click marker → MapInfoWindow popup
- "Search this area" button when map is panned

ZERO RESULTS STATE:
- EmptyState component with friendly illustration
- "No properties match your filters"
- Suggestions: "Try widening your search area", "Adjust your budget range", "Remove some filters"
- "Set up an alert for these criteria" CTA

MOBILE-SPECIFIC:
- Sticky bottom bar: "Map" toggle button, "Filters" button with count, "Sort" button
- Results default to single-column cards
- Filter panel opens as bottom sheet

Use realistic UK property data. 12 property cards minimum.
```

**Steps:**
1. Generate screen in Stitch with above prompt
2. Fetch generated screen via `mcp__stitch__get_screen`
3. Convert to TSX, split into component files
4. `pnpm build` — must pass
5. Commit: `feat(search): create search results page from Stitch generation`

---

### Task 5: Property Detail Page

**Generate with:** `mcp__stitch__generate_screen_from_text` using britestatestyle.txt §1.2 prompt + master context
**Files:**
- `src/app/(main)/properties/[slug]/page.tsx` — Server Component page
- `src/components/properties/Gallery.tsx` — `"use client"`: 2+2 grid desktop, carousel mobile, lightbox
- `src/components/properties/PropertyFeatures.tsx` — icon grid (beds/baths/sqft/EPC/tenure/council tax)
- `src/components/properties/ViewingBooking.tsx` — `"use client"`: day pills, time slots, form
- `src/components/properties/PriceHistory.tsx` — `"use client"`: Recharts line chart with event markers
- `src/components/properties/FloorPlan.tsx` — `"use client"`: image viewer with floor tabs
- `src/components/properties/SaveButton.tsx` — `"use client"`: heart toggle
- `src/components/properties/ShareButton.tsx` — `"use client"`: copy link, email, WhatsApp

**Layout:**
- Breadcrumbs → Gallery → Sticky key info bar (price + address + features + CTA buttons)
- 65% main: description (expandable), features grid, floor plan, location map placeholder, price history chart, EPC display, stamp duty + mortgage calculators
- 35% sidebar (sticky): agent card (avatar, name, agency, rating, contact), viewing booking widget, mortgage prompt
- Mobile: single column, sticky bottom bar (price + "Book Viewing"), tab bar (Overview | Photos | Area | Financial | Agent)
- Mock: 14 Elm Road, Isleworth, TW7 4PQ, £425,000, 3 bed 2 bath semi-detached, 1,200 sq ft

**Stitch prompt (to generate):**
```
=== BRITESTATE MASTER CONTEXT ===
[full master context from britestatestyle.txt lines 8-103]
=== END MASTER CONTEXT ===

Create the property detail page — where buying decisions are made.

TOP: Breadcrumbs (Home > London > Isleworth > 14 Elm Road)

SECTION 1: Gallery
- Desktop: 2+2 grid (1 large left + 3 smaller right), "View All 24 Photos" button overlay
- Mobile: Full-width swipeable carousel with dot indicators + count badge "1/24"

SECTION 2: Key Info Bar (sticky on scroll)
- Price: "£425,000" large bold
- Address: "14 Elm Road, Isleworth, TW7 4PQ"
- Features: 3 beds | 2 baths | Semi-Detached | 1,200 sq ft
- "Book Viewing" primary button, heart save button, share button
- Mobile: sticky bottom bar with price + "Book Viewing"

SECTION 3: Main Content (left, 65%)
- Description with "Read more" expand
- Key features bullets
- Property features grid (tenure, council tax, EPC, garden, parking)
- Floor plan viewer
- Location map placeholder with transport + schools sections
- Price history line chart with event markers
- EPC rating bar chart (A-G)
- Stamp duty calculator + mortgage calculator (pre-filled £425,000)

SECTION 4: Sidebar (right, 35%, sticky)
- Agent card: avatar, agency logo, name, phone, "Contact Agent" + "Request Viewing" buttons
- Viewing booking widget: day pills, time slots, form
- "Could you afford this home?" mortgage prompt

SECTION 5: Similar properties carousel (4 compact cards)

Use realistic UK property data. Semi-detached in Isleworth, 3 bed 2 bath.
```

**Steps:**
1. Generate screen in Stitch
2. Fetch generated screen
3. Convert to TSX, split into 8 component files
4. `pnpm build` — must pass
5. Commit: `feat(properties): create property detail page from Stitch generation`

---

### Task 6: Area Guide Pages (Hybrid)

**Import:** `689da03ba0b749f1abf6443cbe73eb33` (Borough Guide) + `d5d8601b6b0f4fe2bab81596ee6640b0` (City Area Guide)
**Files:**
- `src/app/(main)/areas/page.tsx` — city-level browse (London boroughs grid)
- `src/app/(main)/areas/[slug]/page.tsx` — individual area guide

**Area guide layout:**
- Hero: area photo + name + "X properties for sale" + "X verified tradespeople"
- Stats bar: avg price, price change YoY, avg days on market
- Transport section: nearest stations with walk times
- Schools section: nearby schools with Ofsted ratings
- Property market chart + recent sales table
- "Properties in [Area]" carousel
- "Tradespeople in [Area]" carousel

**Steps:**
1. Fetch both existing screens
2. Merge designs, convert to TSX
3. `pnpm build` — must pass
4. Commit: `feat(areas): create area guide pages from Stitch`

---

### Task 7: Sold Prices (Hybrid)

**Import:** `d10d9a08b8ff43878117d7336b33ccf6` (Sold Prices - Isleworth)
**File:** `src/app/(main)/sold-prices/[area]/page.tsx`

**Layout:**
- Search bar: postcode/area input
- Results table: address, price, date, type, beds
- Map placeholder with sold price markers
- Area average bar chart (Recharts)
- Filters: property type, date range, price range

**Steps:**
1. Fetch existing screen
2. Convert to TSX
3. `pnpm build` — must pass
4. Commit: `feat(sold-prices): create sold prices page from Stitch`

---

### Task 8: Token Alignment + Build Verification

**Files:** All files from Tasks 1-7

**Steps:**
1. Scan for hardcoded hex: `grep -rn "#[0-9A-Fa-f]\{3,6\}" src/ --include="*.tsx"`
2. Replace all with Tailwind design token classes
3. `pnpm build` — must exit 0
4. `pnpm lint` — must exit 0
5. Commit: `style: replace hardcoded hex values with Britestate design tokens`

---

## Execution Order

Tasks 1-3 can run in parallel (independent imports).
Task 4 (Search) should run before Task 5 (Property Detail) since PropertyCard is shared.
Tasks 6-7 can run in parallel after Task 4.
Task 8 runs last.

```
Wave 1: [Task 1] [Task 2] [Task 3]
Wave 2: [Task 4 — Search Results]
Wave 3: [Task 5 — Property Detail] [Task 6 — Area Guides] [Task 7 — Sold Prices]
Wave 4: [Task 8 — Token Alignment]
```

## Done Criteria

- [ ] `pnpm build` passes with zero errors
- [ ] `pnpm lint` passes with zero warnings
- [ ] Search page renders: filter sidebar, property card grid (12 cards), sort bar, empty state, mobile bottom bar
- [ ] Property detail renders: gallery, features, description, floor plan, price history, viewing booking, agent sidebar
- [ ] Saved properties renders: grid with remove/compare, empty state
- [ ] Listing wizard renders: 5-step form with stepper
- [ ] Listing analytics renders: charts and stat cards
- [ ] Area guide pages render: city browse + individual area
- [ ] Sold prices page renders: table, map placeholder, chart
- [ ] No hardcoded hex values in any file
- [ ] All PropertyCard variants work (grid, list, map-popup, compact, featured)
