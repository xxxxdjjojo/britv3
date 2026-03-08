# Phase 02 Property Portal — Stitch Screen Import Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Import 3 existing Stitch screens and generate 5 new ones from britestatestyle.txt prompts, converting all to Next.js App Router TSX with Britestate design tokens.

**Architecture:** Hybrid import — fetch existing Stitch screens via `mcp__stitch__get_screen`, generate missing screens via `mcp__stitch__generate_screen_from_text` with britestatestyle.txt master context, then convert all HTML/CSS output to TSX with Tailwind utility classes mapped to Britestate CSS variables in `globals.css`.

**Tech Stack:** Next.js 16 App Router · TypeScript strict · Tailwind v4 · Shadcn UI (35 components installed) · Lucide React · Recharts · `cn()` from `@/lib/utils`

**Stitch Project:** `5956704101394866719`
**Working directory for all commands:** `/Users/joanflerinbig/Documents/britv3.0`

**Design doc:** `docs/plans/2026-03-08-phase02-stitch-import-design.md`

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
11. **Cards** → use `<Card>` from `@/components/ui/card`
12. **Tabs** → use `<Tabs>` from `@/components/ui/tabs`
13. **Existing components** → reuse `PropertyCardGrid` from `@/components/shared/PropertyCardGrid`, `Logo` from `@/components/shared/Logo`, etc.

---

## Wave 1: Import Existing Stitch Screens (Tasks 1-3, parallel)

---

### Task 1: Saved Properties Management

**Files:**
- Modify: `src/app/(protected)/dashboard/[role]/saved/page.tsx`

**Step 1: Fetch the screen**

Use `mcp__stitch__get_screen` with:
- `name`: `projects/5956704101394866719/screens/4fce8bcc4fd54dc19387982da78a4907`
- `projectId`: `5956704101394866719`
- `screenId`: `4fce8bcc4fd54dc19387982da78a4907`

**Step 2: Read existing file**

Read `src/app/(protected)/dashboard/[role]/saved/page.tsx` to understand current placeholder structure and any existing imports/logic to preserve.

**Step 3: Convert and write**

Apply all Conversion Rules. This page requires `"use client"` (filter, sort, remove state).

Structure:
- Page heading: "Saved Properties" with property count badge
- Controls bar: Grid/List `<ToggleGroup>` from `@/components/ui/toggle-group` + Sort `<Select>` (Date Saved, Price Low→High, Price High→Low)
- Filter pills row: `<Badge>` components — "All" | "For Sale" | "To Rent" (active state: `bg-brand-primary text-white`)
- PropertyCard grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`
  - Each card: image (16:10 ratio), price, address, beds/baths pills, heart-filled icon (brand-primary), trash icon with confirm `<Dialog>`
- "Compare" button (disabled until 2-3 selected): opens comparison `<Dialog>` with `<Table>` (columns: Property, Price, Beds, Baths, Sq Ft, EPC)
- Empty state (when no saved properties): `<div className="flex flex-col items-center py-16">` with Lucide `Heart` icon (64px, neutral-300), "No saved properties yet" heading, "Start exploring properties" subtext, `<Button>` → `/search`
- Mock data: 6 UK properties with realistic addresses, prices £285k–£675k, 2-4 beds

Write complete TSX to `src/app/(protected)/dashboard/[role]/saved/page.tsx`, replacing existing content.

**Step 4: Verify**

```bash
pnpm build 2>&1 | tail -20
```
Expected: exits 0, no TypeScript errors.

**Step 5: Commit**

```bash
git add src/app/(protected)/dashboard/[role]/saved/page.tsx
git commit -m "feat(dashboard): import saved properties page from Stitch screen 4fce8bc"
```

---

### Task 2: Listing Wizard

**Files:**
- Modify: `src/app/(protected)/dashboard/[role]/listings/new/page.tsx` (if exists, else create)
- Create: `src/components/listings/ListingFormSteps/PropertyDetails.tsx`
- Create: `src/components/listings/ListingFormSteps/Description.tsx`
- Create: `src/components/listings/ListingFormSteps/Pricing.tsx`
- Create: `src/components/listings/ListingFormSteps/MediaUpload.tsx`
- Create: `src/components/listings/ListingFormSteps/Review.tsx`

**Step 1: Fetch both screens**

Fetch screen 1 — Property Type:
- `name`: `projects/5956704101394866719/screens/d00141ad744f4447b1412d3bc2103537`
- `projectId`: `5956704101394866719`
- `screenId`: `d00141ad744f4447b1412d3bc2103537`

Fetch screen 2 — Media Upload:
- `name`: `projects/5956704101394866719/screens/97df5050086b49aa8566c47f1baa39e9`
- `projectId`: `5956704101394866719`
- `screenId`: `97df5050086b49aa8566c47f1baa39e9`

**Step 2: Check existing directory structure**

```bash
ls -la src/app/(protected)/dashboard/[role]/listings/ 2>/dev/null
ls -la src/components/listings/ 2>/dev/null
```

Create any missing directories:
```bash
mkdir -p src/app/\(protected\)/dashboard/\[role\]/listings/new
mkdir -p src/components/listings/ListingFormSteps
```

**Step 3: Write wizard shell page**

`src/app/(protected)/dashboard/[role]/listings/new/page.tsx` — `"use client"`:

Structure:
- Stepper component at top showing 5 steps with labels: "Property", "Details", "Pricing", "Photos", "Review"
- Current step highlighted with `bg-brand-primary` circle, completed steps with green check, future steps with `bg-neutral-200` circle
- Step content area renders the active step component
- Bottom bar: "Back" ghost button (hidden on step 1) + "Continue" primary button (becomes "Publish Listing" on step 5)
- "Save as Draft" secondary button alongside Continue
- State: `currentStep: number`, `formData: object` passed to each step

**Step 4: Write PropertyDetails step**

`src/components/listings/ListingFormSteps/PropertyDetails.tsx` — `"use client"`:

Props: `Readonly<{ data: PropertyFormData; onChange: (data: Partial<PropertyFormData>) => void }>`

Fields:
- Postcode `<Input>` with "Find Address" `<Button>` (mock lookup)
- Address line 1, line 2, city, county `<Input>` fields
- Property type `<Select>`: Detached, Semi-Detached, Terraced, Flat/Apartment, Bungalow, Maisonette, Cottage, Other
- Tenure `<Select>`: Freehold, Leasehold, Share of Freehold
  - If Leasehold: show "Years remaining" `<Input>` + "Service charge (£/year)" `<Input>`

**Step 5: Write Description step**

`src/components/listings/ListingFormSteps/Description.tsx` — `"use client"`:

Fields:
- Bedrooms, Bathrooms, Reception rooms: each a row of number buttons (Studio, 1, 2, 3, 4, 5+) using `<ToggleGroup>`
- Floor area `<Input>` with "sq ft" suffix
- Garden `<Select>`: None, Private, Communal, Shared + Front/Rear/Both
- Parking `<Select>`: None, On-street, Driveway, Garage, Underground
- Heating `<Select>`: Gas Central, Electric, Oil, Other
- Features multi-select: grid of `<Checkbox>` items — Double Glazing, Fireplace, Conservatory, Loft Conversion, Extension, Listed Building, New Build, Chain Free, Period Features
- Council tax band `<Select>`: A through H
- Description `<Textarea>` (large, 8 rows) with character count
- "Generate with AI" `<Button variant="outline">` with Lucide `Sparkles` icon (placeholder, shows toast "AI coming soon")

**Step 6: Write Pricing step**

`src/components/listings/ListingFormSteps/Pricing.tsx` — `"use client"`:

Fields:
- Listing type `<ToggleGroup>`: For Sale | To Rent | Auction
- Price `<Input>` with "£" prefix, auto-formats with commas
- If Rent: Frequency `<Select>` — Per Month, Per Week, Per Year
- Price qualifier `<Select>`: Guide Price, Offers Over, Fixed Price, Offers in Region of, POA
- "Get AI Valuation" `<Button variant="outline">` (placeholder, shows mock range "£400,000–£450,000")

**Step 7: Write MediaUpload step**

`src/components/listings/ListingFormSteps/MediaUpload.tsx` — `"use client"`:

Structure:
- Tips banner: `<Card>` with Lucide `Lightbulb` icon — "Bright, well-lit photos get 60% more views. Minimum 5 photos recommended."
- Photo upload zone: dashed border `<div>`, Lucide `Upload` icon, "Drag photos here or click to browse", "Maximum 30 photos, 10MB each"
- Photo grid: `grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3` with mock placeholder thumbnails, drag handle icon, first image labeled "Main Photo" badge, remove X button per image
- Floor plan upload: separate dashed zone, "Upload Floor Plan (PDF or Image)"
- Virtual tour URL: `<Input>` with placeholder "https://my.matterport.com/show/..."

**Step 8: Write Review step**

`src/components/listings/ListingFormSteps/Review.tsx` — `"use client"`:

Structure:
- Checklist at top: each section with status icon — green `<CheckCircle2>` if complete, amber `<AlertCircle>` if missing optional, red `<XCircle>` if missing required
  - Address, Property Details, Description, Price, Photos (show "12 photos uploaded"), EPC
- Full listing preview rendered as it would appear to buyers: image gallery strip, price, address, features grid, description excerpt
- "Edit" `<Button variant="ghost">` next to each section to jump back to that step
- Bottom: `<Checkbox>` "I confirm this listing is accurate and I have the right to advertise this property"
- "Publish Listing" primary `<Button>` (disabled until checkbox checked) + "Save as Draft" secondary

**Step 9: Verify**

```bash
pnpm build 2>&1 | tail -20
```

**Step 10: Commit**

```bash
git add src/app/(protected)/dashboard/[role]/listings/new/ src/components/listings/ListingFormSteps/
git commit -m "feat(listings): create listing wizard with 5-step form from Stitch screens"
```

---

### Task 3: Listing Performance Analytics

**Files:**
- Modify: `src/app/(protected)/dashboard/[role]/listings/[id]/analytics/page.tsx` (if exists, else create parent dirs)
- Create: `src/components/listings/ListingAnalytics.tsx`

**Step 1: Fetch the screen**

Use `mcp__stitch__get_screen` with:
- `name`: `projects/5956704101394866719/screens/d2e0cda46c2147cf8a36adbf80322c11`
- `projectId`: `5956704101394866719`
- `screenId`: `d2e0cda46c2147cf8a36adbf80322c11`

**Step 2: Create directory if needed**

```bash
mkdir -p src/app/\(protected\)/dashboard/\[role\]/listings/\[id\]/analytics
```

**Step 3: Write ListingAnalytics component**

`src/components/listings/ListingAnalytics.tsx` — `"use client"`:

Props: `Readonly<{ listingId: string }>`

Structure:
- Date range selector: `<ToggleGroup>` with "7d", "30d", "90d", "All Time" options
- Stats row: 4x `<Card>` grid — Total Views (Lucide `Eye`), Unique Viewers (Lucide `Users`), Saves (Lucide `Heart`), Enquiries (Lucide `MessageCircle`)
  - Each card: large number, label, change badge (+12% green or -3% red)
- Views over time: Recharts `<AreaChart>` with `brand-primary` fill, mock data for 30 days
  - Import from `recharts`: `AreaChart`, `Area`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer`
- Enquiry sources: Recharts `<PieChart>` — Britestate Search (60%), Direct Link (25%), Social Media (10%), Other (5%)
  - Colors: brand-primary, brand-accent, brand-secondary, neutral-400
- Area comparison: `<Card>` with text — "Your listing gets 2.3x more views than the area average"
- "Boost Your Listing" CTA `<Button>` at bottom (brand-secondary variant)
- Mock data: realistic view counts (2,847 total, 1,203 unique), 24 saves, 8 enquiries

**Step 4: Write analytics page**

`src/app/(protected)/dashboard/[role]/listings/[id]/analytics/page.tsx` — Server Component:

```tsx
import { ListingAnalytics } from "@/components/listings/ListingAnalytics";

export default function ListingAnalyticsPage({
  params,
}: {
  params: Promise<{ role: string; id: string }>;
}) {
  // In future: fetch listing data server-side
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-neutral-900">Listing Analytics</h1>
        <p className="text-neutral-500 mt-1">Track your listing&apos;s performance</p>
      </div>
      <ListingAnalytics listingId="mock-id" />
    </div>
  );
}
```

**Step 5: Verify**

```bash
pnpm build 2>&1 | tail -20
```

**Step 6: Commit**

```bash
git add src/app/(protected)/dashboard/[role]/listings/[id]/analytics/ src/components/listings/ListingAnalytics.tsx
git commit -m "feat(listings): import listing analytics page from Stitch screen d2e0cda"
```

---

## Wave 2: Generate Search Results Page (Task 4)

---

### Task 4: Search Results + Map View

**Files:**
- Modify: `src/app/(main)/search/page.tsx`
- Create: `src/components/search/SearchBar.tsx`
- Create: `src/components/search/SearchFilters.tsx`
- Create: `src/components/search/SearchResults.tsx`
- Create: `src/components/search/SearchSortBar.tsx`
- Modify: `src/components/search/PropertyCard.tsx` (if exists, else create)
- Create: `src/components/search/EmptyState.tsx`

**Step 1: Generate screen in Stitch**

Use `mcp__stitch__generate_screen_from_text` with:
- `projectId`: `5956704101394866719`
- `deviceType`: `DESKTOP`
- `modelId`: `GEMINI_3_PRO`
- `prompt`:

```
=== BRITESTATE MASTER CONTEXT ===

PROJECT: Britestate — AI-powered UK property platform (PropTech)
COMPETITORS: Rightmove, Zoopla, OnTheMarket, Hemnet (Sweden), Bienici (France)
DESIGN INSPIRATION: Hemnet.se (minimal, organic, content-first), Soho House (premium feel), Airbnb (trust & clarity)

COLOUR TOKENS:
--brand-primary: #1B4D3E (deep forest green — trust, property, nature)
--brand-primary-light: #2D7A5F
--brand-primary-lighter: #E8F5EE
--brand-secondary: #D4A853 (warm gold — premium, quality)
--brand-secondary-light: #F5ECD7
--brand-accent: #2563EB (action blue — CTAs, links)
--neutral-950: #0A0A0B
--neutral-900: #171719
--neutral-700: #46464F
--neutral-500: #7A7A88
--neutral-200: #E2E2E8
--neutral-100: #F1F1F5
--neutral-50: #F8F8FA
--white: #FFFFFF

TYPOGRAPHY:
- Headings: "Plus Jakarta Sans", sans-serif (weight 600–700)
- Body: "Inter", sans-serif (weight 400–500)

BORDER RADIUS: sm: 6px, md: 8px, lg: 12px, xl: 16px
SHADOWS: sm: 0 1px 3px rgba(0,0,0,0.08), md: 0 4px 6px rgba(0,0,0,0.07)

=== END MASTER CONTEXT ===

Create the property search results page for Britestate — the second most important page on the platform.

LAYOUT: Three-panel desktop layout.

TOP BAR (sticky, white bg, 56px height, bottom border neutral-200):
- Compact search input showing "London" with map pin icon left, clear X right
- "Filters (3)" button with badge count
- Sort dropdown: "Most Recent" | "Price (Low–High)" | "Price (High–Low)" | "Most Popular"
- View toggle: Grid | List | Map icons (toggle group)
- Results count: "847 properties for sale in London"

LEFT SIDEBAR (desktop only, 280px, white bg, right border):
- "Save This Search" button with bell icon at top (outline style, brand-primary)
- Collapsible filter sections with smooth chevron animation:
  - Price Range: min/max inputs with "£" prefix
  - Property Type: checkboxes — Detached, Semi-Detached, Terraced, Flat, Bungalow, Land
  - Bedrooms: number selector row — Studio, 1, 2, 3, 4, 5+
  - Bathrooms: number selector row — 1, 2, 3, 4+
  - Must-Haves: toggle switches — Garden, Parking, Garage, Chain Free, New Build
  - Max Days Listed: select — Any, 24h, 3 days, 7 days, 14 days, 30 days
  - Include SSTC: toggle switch
- "Apply Filters" brand-primary button, "Reset" ghost button

MAIN CONTENT (flexible width, between sidebar and map):
- 2-column grid of property cards
- Each property card (white bg, rounded-lg, shadow-sm, hover shadow-md):
  - 16:10 image with lazy loading
  - Top-left badge: "New" or "Price Reduced" (brand-primary or error red bg)
  - Top-right: heart save button (outline, hover: filled brand-primary)
  - Below image: Price large bold (£425,000), property type badge
  - Address line 1 medium weight, address line 2 neutral-500
  - Feature row: bed icon + "3" | bath icon + "2" | ruler icon + "1,200 sq ft"
  - Agent line: small logo + "Listed by Carter Jonas" neutral-400
- Show 12 property cards with realistic UK data

MAP PANEL (right side, 50% width):
- Light grey placeholder area labeled "Map View"
- Text: "Interactive map coming soon"
- Show 3 mock price markers: rounded rectangles with "£425k", "£350k", "£510k"

MOBILE: Show only the main content grid (single column). Sticky bottom bar: "Map" button, "Filters (3)" button, "Sort" button.

Use realistic UK property data — addresses in London (Isleworth, Richmond, Twickenham, Chiswick, Ealing).
```

**Step 2: Fetch generated screen**

Wait for generation to complete, then use `mcp__stitch__get_screen` with the returned screen name/ID.

**Step 3: Read existing search page**

Read `src/app/(main)/search/page.tsx` to check for any existing logic to preserve.

**Step 4: Write SearchBar component**

`src/components/search/SearchBar.tsx` — `"use client"`:

Props: `Readonly<{ location?: string; onSearch?: (query: string) => void }>`

- Compact horizontal bar: `<Input>` with Lucide `MapPin` icon left, value showing location, clear `X` button right
- "Search" button (hidden on desktop, visible on mobile)
- Height: 44px, border neutral-200, radius-lg, focus ring brand-accent

**Step 5: Write SearchFilters component**

`src/components/search/SearchFilters.tsx` — `"use client"`:

Props: `Readonly<{ onApply?: (filters: SearchFilterState) => void; onReset?: () => void }>`

- Collapsible sections using local state (no accordion Shadcn component — use `useState` + `cn()` for open/closed)
- Price Range: two `<Input>` with "£" prefix, side by side
- Property Type: `<Checkbox>` grid — 6 types
- Bedrooms: row of `<Button variant="outline">` — Studio, 1, 2, 3, 4, 5+ (active: `bg-brand-primary text-white`)
- Bathrooms: same pattern — 1, 2, 3, 4+
- Must-Haves: `<Switch>` toggles — Garden, Parking, Garage, Chain Free, New Build
- Max Days Listed: `<Select>` dropdown
- Include SSTC: `<Switch>`
- Bottom: "Apply Filters" `<Button>` + "Reset" `<Button variant="ghost">`

**Step 6: Write SearchSortBar component**

`src/components/search/SearchSortBar.tsx` — `"use client"`:

Props: `Readonly<{ resultCount: number; view: "grid" | "list" | "map"; onViewChange: (view: string) => void; sort: string; onSortChange: (sort: string) => void }>`

- Left: results count text ("847 properties for sale in London")
- Right: Sort `<Select>` + View `<ToggleGroup>` (Grid/List/Map icons from Lucide: `LayoutGrid`, `List`, `Map`)

**Step 7: Write PropertyCard component**

`src/components/search/PropertyCard.tsx` — `"use client"`:

Props:
```typescript
type PropertyCardProps = Readonly<{
  variant?: "grid" | "list" | "map-popup" | "compact" | "featured";
  property: {
    id: string;
    image: string;
    images?: string[];
    price: number;
    priceType: "sale" | "rent" | "auction";
    address1: string;
    address2: string;
    beds: number;
    baths: number;
    sqft?: number;
    propertyType: string;
    agent?: { name: string; logo?: string };
    badge?: "new" | "reduced" | "under-offer" | "sold-stc";
    featured?: boolean;
    listedDays?: number;
    description?: string;
  };
  onSave?: (id: string) => void;
  saved?: boolean;
}>;
```

Variants:
- **grid** (default): portrait card, image top, content below (as described in Stitch prompt)
- **list**: horizontal — 40% image left, 60% content right, includes description excerpt + "Listed X days ago"
- **map-popup**: compact 240px wide, single image + price + address + beds/baths, "View Details" link
- **compact**: small card for carousels — smaller image, price + address + beds/baths only
- **featured**: gold border-top (`border-t-4 border-brand-secondary`), "Featured" gold badge, slightly larger

**Step 8: Write EmptyState component**

`src/components/search/EmptyState.tsx`:

Props: `Readonly<{ onCreateAlert?: () => void }>`

- Centered layout: Lucide `SearchX` icon (64px, neutral-300), "No properties match your filters" heading, suggestion bullets, "Set up an alert" CTA `<Button>`

**Step 9: Write Search page**

`src/app/(main)/search/page.tsx` — `"use client"`:

- Import all search components
- State: `filters`, `sort`, `view` ("grid" | "list" | "map"), `showFilters` (mobile)
- Layout:
  - `<SearchBar>` sticky top
  - `<SearchSortBar>` below
  - Desktop: `flex` with `<SearchFilters>` (280px sidebar) + results grid + map placeholder (50%)
  - Results: `<div className="grid grid-cols-1 md:grid-cols-2 gap-6">` with 12 `<PropertyCard>` instances
  - Map placeholder: `<div className="bg-neutral-100 rounded-lg flex items-center justify-center">` with "Map View — Interactive map coming soon" text and 3 mock price marker elements
  - Mobile: single column, `<Sheet>` for filters triggered by bottom bar button
- Mock data: 12 UK properties array with realistic London addresses
- Sticky mobile bottom bar: three `<Button>` — Map (Lucide `Map`), Filters (Lucide `SlidersHorizontal` + badge), Sort (Lucide `ArrowUpDown`)

**Step 10: Verify**

```bash
pnpm build 2>&1 | tail -20
```

**Step 11: Commit**

```bash
git add src/app/(main)/search/page.tsx src/components/search/
git commit -m "feat(search): create search results page with filters, cards, and map placeholder"
```

---

## Wave 3: Generate Property Detail + Import Area/Sold Pages (Tasks 5-7, parallel)

---

### Task 5: Property Detail Page

**Files:**
- Modify: `src/app/(main)/properties/[slug]/page.tsx`
- Create: `src/components/properties/Gallery.tsx`
- Create: `src/components/properties/PropertyFeatures.tsx`
- Create: `src/components/properties/ViewingBooking.tsx`
- Create: `src/components/properties/FloorPlan.tsx`
- Create: `src/components/properties/SaveButton.tsx`
- Create: `src/components/properties/ShareButton.tsx`

Note: `src/components/property/PriceHistory.tsx` may already exist (check `src/components/property/` dir). If so, import from there. If not, create `src/components/properties/PriceHistory.tsx`.

**Step 1: Generate screen in Stitch**

Use `mcp__stitch__generate_screen_from_text` with:
- `projectId`: `5956704101394866719`
- `deviceType`: `DESKTOP`
- `modelId`: `GEMINI_3_PRO`
- `prompt`:

```
=== BRITESTATE MASTER CONTEXT ===

PROJECT: Britestate — AI-powered UK property platform (PropTech)
DESIGN INSPIRATION: Hemnet.se (minimal, organic, content-first), Airbnb (trust & clarity)

COLOUR TOKENS:
--brand-primary: #1B4D3E (deep forest green)
--brand-primary-light: #2D7A5F
--brand-primary-lighter: #E8F5EE
--brand-secondary: #D4A853 (warm gold)
--brand-accent: #2563EB (action blue)
--neutral-950 through --neutral-50 standard scale
--success: #16A34A, --error: #DC2626

TYPOGRAPHY: Headings "Plus Jakarta Sans" 600-700, Body "Inter" 400-500
BORDER RADIUS: sm 6px, md 8px, lg 12px, xl 16px
SHADOWS: sm, md, lg, xl scale

=== END MASTER CONTEXT ===

Create the property detail page for 14 Elm Road, Isleworth, TW7 4PQ — priced at £425,000. This is a 3-bedroom, 2-bathroom semi-detached house, 1,200 sq ft.

SECTION 1: Photo Gallery
- Desktop: 2+2 grid — 1 large image left (60%), 3 smaller right stacked (40%), all rounded-lg
- "View All 24 Photos" overlay button bottom-right of grid
- Images show a British semi-detached house: front exterior, kitchen, living room, garden

SECTION 2: Key Info Bar (white bg, sticky top on scroll, bottom border)
- Left: Price "£425,000" (30px Plus Jakarta Sans 700) + "Semi-Detached" badge (brand-primary-lighter bg)
- Centre: Address "14 Elm Road, Isleworth, TW7 4PQ" (neutral-700)
- Right: "Book Viewing" brand-primary button, heart outline "Save" button, share icon button
- Below: feature pills row: bed icon "3 Beds" | bath icon "2 Baths" | ruler icon "1,200 sq ft" | EPC icon "EPC C"

SECTION 3: Two-column layout (65% main / 35% sidebar)

LEFT COLUMN:
- "About this property" — 3 paragraphs of description about a lovely semi-detached in Isleworth
- "Read more" expand link
- Key features: bullet list — "South-facing rear garden", "Recently refurbished kitchen", "Close to Isleworth station", "Off-street parking", "Chain free"
- Property details grid (2 columns): Tenure: Freehold | Council Tax: Band D | EPC: C (72) | Garden: Rear, South-facing | Parking: Driveway | Heating: Gas Central | Double Glazing: Yes | Floor Area: 1,200 sq ft
- Floor plan: placeholder image with tab buttons "Ground Floor" | "First Floor"
- Location: grey map placeholder with "Interactive map coming soon" + nearby stations list (Isleworth 0.3mi, Syon Lane 0.5mi)
- Price history: simple line chart area with 3 data points — Listed Mar 2026 £450k, Reduced Feb 2026 £435k, Current £425k
- EPC rating display: horizontal bars A through G, C highlighted in green

RIGHT COLUMN (sticky sidebar):
- Agent card: circular avatar placeholder, "Sarah Mitchell", "Carter Jonas — Isleworth", 4.8 star rating (127 reviews), "Contact Agent" brand-primary button, "Call 020 8560 1234" outline button
- Viewing booking widget: scrollable day pills (Mon 10, Tue 11, Wed 12...), time slot grid (9:00, 10:00, 11:00...), "In-person" / "Virtual" toggle, "Book Viewing" button
- Mortgage prompt card: "Could you afford this home?", "Est. £1,847/mo" (based on 10% deposit), "Speak to a Mortgage Broker →" link

BOTTOM: "Similar Properties" — horizontal scroll of 4 compact property cards

Mobile: single column, sticky bottom bar with price + "Book Viewing" button.
```

**Step 2: Fetch generated screen**

Use `mcp__stitch__get_screen` with the returned screen ID.

**Step 3: Read existing property detail page**

Read `src/app/(main)/properties/[slug]/page.tsx` to check for existing logic.

**Step 4: Write Gallery component**

`src/components/properties/Gallery.tsx` — `"use client"`:

Props: `Readonly<{ images: { src: string; alt: string }[] }>`

- Desktop: CSS grid — `grid-cols-[3fr_2fr] grid-rows-2 gap-2 rounded-xl overflow-hidden h-[480px]`
  - First image spans 2 rows (`row-span-2`)
  - 3 smaller images fill right column
- "View All X Photos" overlay `<Button>` with Lucide `Images` icon
- Click any image → `<Dialog>` fullscreen lightbox with left/right arrow navigation (`<Button variant="ghost">` with Lucide `ChevronLeft`/`ChevronRight`)
- Mobile: single image with swipe indicators, "1/24" badge top-right
- Mock: 4 placeholder images using `/images/` directory or neutral-200 bg divs with Lucide `Home` icon

**Step 5: Write PropertyFeatures component**

`src/components/properties/PropertyFeatures.tsx`:

Props: `Readonly<{ features: Record<string, string | boolean> }>`

- 2-column grid of feature items
- Each item: Lucide icon (muted) + label + value
- Icons: `Bed`, `Bath`, `Ruler`, `Zap` (EPC), `Home` (tenure), `Landmark` (council tax), `Flower2` (garden), `Car` (parking), `Flame` (heating), `Maximize2` (area)

**Step 6: Write ViewingBooking component**

`src/components/properties/ViewingBooking.tsx` — `"use client"`:

Props: `Readonly<{ agentName: string; propertyAddress: string }>`

- State: `selectedDate`, `selectedTime`, `viewingType` ("in-person" | "virtual"), `booked`
- Day pills: horizontal scroll of next 14 days, each a `<Button variant="outline">` showing day name + date number, selected: `bg-brand-primary text-white`
- Time slots: 3-column grid of time buttons (9:00, 9:30, 10:00, ... 17:00), selected: `bg-brand-primary-lighter text-brand-primary border-brand-primary`
- Toggle: `<ToggleGroup>` — "In-person" / "Virtual"
- Form (hidden until time selected): name, email, phone `<Input>` fields + message `<Textarea>`
- "Book Viewing" `<Button>` (disabled until date+time selected)
- Booked state: Lucide `CheckCircle2` green icon, "Viewing booked!", details summary, "Add to Calendar" links

**Step 7: Write FloorPlan component**

`src/components/properties/FloorPlan.tsx` — `"use client"`:

Props: `Readonly<{ floors: { label: string; src: string }[] }>`

- `<Tabs>` with one tab per floor
- Image viewer: `<Image>` with click to expand via `<Dialog>`
- If no floor plans: show "Floor plan not available" with Lucide `SquareStack` icon

**Step 8: Write SaveButton component**

`src/components/properties/SaveButton.tsx` — `"use client"`:

Props: `Readonly<{ propertyId: string; saved?: boolean; onToggle?: (saved: boolean) => void }>`

- Heart icon button: outline when unsaved, filled `text-brand-primary` when saved
- Optimistic toggle with `useState`
- Subtle scale animation on click (`transition-transform active:scale-90`)

**Step 9: Write ShareButton component**

`src/components/properties/ShareButton.tsx` — `"use client"`:

Props: `Readonly<{ url: string; title: string }>`

- `<Popover>` trigger: Lucide `Share2` icon button
- Popover content: "Copy Link" (Lucide `Link`), "Email" (Lucide `Mail`), "WhatsApp" (Lucide `MessageCircle`)
- Copy link: uses `navigator.clipboard.writeText()`, shows "Copied!" toast

**Step 10: Write Property Detail page**

`src/app/(main)/properties/[slug]/page.tsx` — Server Component:

- Import all sub-components
- Mock property data object at top of file (14 Elm Road, Isleworth, £425,000, 3 bed, 2 bath, etc.)
- `<Breadcrumb>` from `@/components/ui/breadcrumb`: Home > London > Isleworth > 14 Elm Road
- `<Gallery images={...} />`
- Key info bar: price, address, feature pills, action buttons (Book Viewing, SaveButton, ShareButton)
- Two-column layout: `flex flex-col lg:flex-row gap-8`
  - Main (65%): description with "Read more" `<Button variant="link">`, key features bullets, `<PropertyFeatures>`, `<FloorPlan>`, location placeholder, price history placeholder, EPC display
  - Sidebar (35%): agent `<Card>`, `<ViewingBooking>`, mortgage prompt `<Card>`
- "Similar Properties" section: horizontal scroll of 4 `<PropertyCard variant="compact">` from `@/components/search/PropertyCard`
- Mobile sticky bottom bar: `fixed bottom-0 left-0 right-0 bg-white border-t p-4 lg:hidden` with price + "Book Viewing" button

**Step 11: Verify**

```bash
pnpm build 2>&1 | tail -20
```

**Step 12: Commit**

```bash
git add src/app/(main)/properties/[slug]/page.tsx src/components/properties/
git commit -m "feat(properties): create property detail page with gallery, features, booking from Stitch"
```

---

### Task 6: Area Guide Pages

**Files:**
- Modify: `src/app/(main)/areas/page.tsx`
- Create: `src/app/(main)/areas/[slug]/page.tsx`

**Step 1: Fetch both existing screens**

Screen 1 — Borough Guide:
- `name`: `projects/5956704101394866719/screens/689da03ba0b749f1abf6443cbe73eb33`
- `projectId`: `5956704101394866719`
- `screenId`: `689da03ba0b749f1abf6443cbe73eb33`

Screen 2 — City Area Guide:
- `name`: `projects/5956704101394866719/screens/d5d8601b6b0f4fe2bab81596ee6640b0`
- `projectId`: `5956704101394866719`
- `screenId`: `d5d8601b6b0f4fe2bab81596ee6640b0`

**Step 2: Read existing areas page**

Read `src/app/(main)/areas/page.tsx` to check current content.

**Step 3: Write Areas browse page**

`src/app/(main)/areas/page.tsx` — Server Component:

- Hero: "Explore London Boroughs" heading, "Discover property prices, schools, transport and more" subtext
- Borough grid: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`
  - Each borough card: `<Card>` with placeholder image, borough name, avg price, property count
  - Mock 12 boroughs: Isleworth, Richmond, Twickenham, Chiswick, Ealing, Hounslow, Brentford, Kew, Barnes, Putney, Wimbledon, Kingston
  - Each links to `/areas/[slug]`

**Step 4: Create area slug directory and write individual area page**

```bash
mkdir -p src/app/\(main\)/areas/\[slug\]
```

`src/app/(main)/areas/[slug]/page.tsx` — Server Component:

- `<Breadcrumb>`: Home > Areas > [Area Name]
- Hero: area name heading + "X properties for sale" + "X verified tradespeople" badges
- Stats bar: 3x `<Card>` — Avg Property Price (£485,000), Price Change YoY (+4.2%), Avg Days on Market (34)
- Transport section: `<Card>` with Lucide `Train` icon, list of nearest stations with walk times
  - Mock: "Isleworth — 5 min walk", "Syon Lane — 8 min walk", "Hounslow East — 12 min walk"
- Schools section: `<Card>` with Lucide `GraduationCap`, list of schools with Ofsted `<Badge>` (Outstanding=green, Good=brand-primary, Requires Improvement=warning)
  - Mock: 4 schools
- Property market section: placeholder chart area + "Recent Sales" `<Table>` (address, price, date, type)
  - Mock: 6 recent sales
- "Properties in [Area]" carousel: horizontal scroll of 4 `<PropertyCard variant="compact">`
- "Tradespeople in [Area]" carousel: 4 mock provider cards (name, trade, rating, "Get Quote" button)

**Step 5: Verify**

```bash
pnpm build 2>&1 | tail -20
```

**Step 6: Commit**

```bash
git add src/app/(main)/areas/
git commit -m "feat(areas): create area guide pages from Stitch screens"
```

---

### Task 7: Sold Prices Page

**Files:**
- Modify: `src/app/(main)/sold-prices/page.tsx`
- Create: `src/app/(main)/sold-prices/[area]/page.tsx`

**Step 1: Fetch existing screen**

- `name`: `projects/5956704101394866719/screens/d10d9a08b8ff43878117d7336b33ccf6`
- `projectId`: `5956704101394866719`
- `screenId`: `d10d9a08b8ff43878117d7336b33ccf6`

**Step 2: Read existing sold-prices page**

Read `src/app/(main)/sold-prices/page.tsx` to check current content.

**Step 3: Write Sold Prices search page**

`src/app/(main)/sold-prices/page.tsx` — Server Component:

- Hero: "Sold Prices" heading, "See what properties have sold for in your area" subtext
- Search bar: `<Input>` with "Enter a postcode or area" placeholder + "Search" `<Button>`
- Popular areas: grid of `<Badge>` links — Isleworth, Richmond, Twickenham, etc.

**Step 4: Create area slug directory and write area sold prices page**

```bash
mkdir -p src/app/\(main\)/sold-prices/\[area\]
```

`src/app/(main)/sold-prices/[area]/page.tsx` — `"use client"` (filters):

- `<Breadcrumb>`: Home > Sold Prices > [Area]
- Heading: "Sold prices in Isleworth" + "Based on Land Registry data"
- Filter bar: Property type `<Select>`, Date range `<Select>` (Last 12 months, Last 3 years, Last 5 years, All time), Price range `<Select>`
- Stats row: 3x `<Card>` — Average Price (£485,000), Properties Sold (127), Price Change YoY (+4.2%)
- Results `<Table>`:
  - Columns: Address, Price, Date, Type, Beds
  - Mock: 10 rows with realistic Isleworth addresses and prices
  - Alternating row colors: white / neutral-50
- Map placeholder: grey area with "Map view coming soon"
- Area average chart placeholder: `<Card>` with "Average prices over time" heading and Recharts `<BarChart>` showing monthly averages
  - Mock: 12 months of data

**Step 5: Verify**

```bash
pnpm build 2>&1 | tail -20
```

**Step 6: Commit**

```bash
git add src/app/(main)/sold-prices/
git commit -m "feat(sold-prices): create sold prices pages from Stitch screen d10d9a0"
```

---

## Wave 4: Final Cleanup (Task 8)

---

### Task 8: Token Alignment + Build Verification

**Files:** All files modified in Tasks 1-7

**Step 1: Scan for hardcoded hex colors**

```bash
grep -rn '#[0-9A-Fa-f]\{3,8\}' src/app src/components --include='*.tsx' | grep -v node_modules | grep -v '.test.' | grep -v globals.css | grep -v 'chart.tsx'
```

**Step 2: Replace hardcoded values**

For each hit, replace with the appropriate Tailwind class:
- `#1B4D3E` / `#1b4d3e` → `bg-brand-primary` or `text-brand-primary`
- `#2D7A5F` → `bg-brand-primary-light` or `text-brand-primary-light`
- `#E8F5EE` → `bg-brand-primary-lighter`
- `#D4A853` → `bg-brand-secondary` or `text-brand-secondary`
- `#F5ECD7` → `bg-brand-secondary-light`
- `#2563EB` → `bg-brand-accent` or `text-brand-accent`
- `#F8F8FA` → `bg-neutral-50`
- `#F1F1F5` → `bg-neutral-100`
- `#E2E2E8` → `border-neutral-200`
- `#171719` → `text-neutral-900`
- `#46464F` → `text-neutral-700`
- `#7A7A88` → `text-neutral-500`
- `#16A34A` → `text-success` or `bg-success`
- `#DC2626` → `text-error` or `bg-error`

**Step 3: Final build + lint**

```bash
pnpm build 2>&1 | tail -30
pnpm lint 2>&1 | tail -30
```

Both must exit 0.

**Step 4: Final commit**

```bash
git add -u
git commit -m "style: replace hardcoded hex values with Britestate design tokens in Phase 02 pages"
```

---

## Execution Order Summary

```
Wave 1 (parallel): Task 1 (Saved Properties) | Task 2 (Listing Wizard) | Task 3 (Analytics)
Wave 2 (sequential): Task 4 (Search Results — generates PropertyCard used by others)
Wave 3 (parallel): Task 5 (Property Detail) | Task 6 (Area Guides) | Task 7 (Sold Prices)
Wave 4 (sequential): Task 8 (Token Alignment)
```

## Done Criteria

- [ ] `pnpm build` passes with zero errors
- [ ] `pnpm lint` passes with zero warnings
- [ ] Search page: filter sidebar, 12 property cards (grid/list), sort bar, empty state, map placeholder, mobile bottom bar
- [ ] Property detail: gallery (2+2 grid), features grid, description, floor plan, viewing booking, agent sidebar, price history, mobile sticky bar
- [ ] Saved properties: grid with remove/compare, empty state, filter/sort
- [ ] Listing wizard: 5-step form with stepper, all field types, review/publish
- [ ] Listing analytics: stat cards, view chart, enquiry pie chart
- [ ] Area guide: borough browse grid + individual area page with stats/transport/schools
- [ ] Sold prices: search page + area results with table/chart
- [ ] No hardcoded hex values in any page/component file
- [ ] All PropertyCard variants work (grid, list, map-popup, compact, featured)
