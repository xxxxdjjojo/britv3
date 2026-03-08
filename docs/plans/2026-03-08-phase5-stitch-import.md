# Phase 05 — Financial Tools, Area Pages & AI Listing Assistant — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Import all 11 Phase 5 Stitch screens into the Next.js app as fully-styled pages matching the Britestate design system.

**Architecture:** Fetch each screen's HTML via `mcp__stitch__get_screen`, then download the HTML from the `htmlCode.downloadUrl` using `curl`. Convert the HTML to Next.js App Router TSX with Tailwind utility classes mapped to Britestate CSS variables. Preserve existing calculator logic in `src/lib/calculators/` — only replace the UI layer. All calculator pages are `"use client"` (interactive). Area pages are Server Components with mock data.

**Tech Stack:** Next.js 16 App Router · TypeScript strict · Tailwind v4 · Shadcn UI · Lucide React · `cn()` from `@/lib/utils` · Recharts (for charts)

**Stitch Project:** `5956704101394866719`
**Working directory:** `/Users/joanflerinbig/Documents/britv3.0`

---

## Screen ID Map

| # | Page | Stitch Screen ID | HTML File ID | Target File |
|---|------|-----------------|--------------|-------------|
| 1 | Mortgage Affordability | `56283418fa2a41aea87461092ed58194` | `0e57ebf0a6ed4266b34247963aaf4a52` | `src/app/(main)/tools/affordability-calculator/page.tsx` |
| 2 | Mortgage Repayment | `14cf81cb753f41d8b7ac6c0973a6f4dd` | `4b414b79dd454eb4a43178ffa06bfe12` | `src/app/(main)/tools/mortgage-calculator/page.tsx` (UPDATE) |
| 3 | SDLT Calculator | `a3c149b3aa5640cebd5986bb55a87928` | `42048010a9774c1da450e3fb9e1106c7` | `src/app/(main)/tools/stamp-duty-calculator/page.tsx` (UPDATE) |
| 4 | Rental Yield & ROI | `d518e6b663d04927a8a51197f63eb323` | `a0ea634af873458589f200e1c6d23bc6` | `src/app/(main)/tools/rental-yield-calculator/page.tsx` |
| 5 | Buy vs Rent | `a1aac422c87a4ec4855c7b080000a030` | `8faba0526d7d4913929e115378590d9f` | `src/app/(main)/tools/buy-vs-rent-calculator/page.tsx` |
| 6 | Energy Bill & EPC | `6f3e855349ed41209619da42747d7cb3` | `306bdde2b32941a9b33ff871170660b5` | `src/app/(main)/tools/energy-bill-estimator/page.tsx` |
| 7 | City Guide (London) | `d5d8601b6b0f4fe2bab81596ee6640b0` | `42b09980e6c34d209442ac81983c53f9` | `src/app/(main)/areas/[city]/page.tsx` |
| 8 | Borough Guide (Isleworth) | `689da03ba0b749f1abf6443cbe73eb33` | `aa0909b40664475dbab850ce3a40f1ac` | `src/app/(main)/areas/[city]/[area]/page.tsx` |
| 9 | Sold Prices (Isleworth) | `d10d9a08b8ff43878117d7336b33ccf6` | `a578299b40af4df7953cba85c59b45ef` | `src/app/(main)/sold-prices/[area]/page.tsx` |
| 10 | Market Trends | `8d309f31ef0348deaeaab173fbc16eac` | `e3eb73b7b5f94a82bd6e0f7b764459cb` | `src/app/(main)/market-trends/page.tsx` |
| 11 | AI Listing Assistant | `d99b9b5bb6f54ef580ebfd0ccb6408d9` | `017c61de02f3447f9d144a3366802662` | `src/components/ai/ListingAssistant.tsx` |

---

## Conversion Rules (apply to EVERY task)

When converting Stitch HTML to TSX:

1. **No hardcoded hex values** — replace with Tailwind classes: `bg-brand-primary`, `text-brand-accent`, `border-neutral-200`, etc.
2. **No inline `style={{}}` for colors/spacing** — use Tailwind utilities only
3. **Images** → `<Image>` from `next/image` with `alt`, `width`, `height` props
4. **Links** → `<Link>` from `next/link`
5. **Material Icons** → Lucide React equivalents (`material-icons home` → `<Home />` from `lucide-react`)
6. **`class=`** → `className=`
7. **Interactive pages** → `"use client"` at top of file
8. **Static/SSR pages** → NO `"use client"` (Server Components)
9. **Buttons** → `<Button>` from `@/components/ui/button`
10. **Cards** → `<Card>` from `@/components/ui/card`
11. **`cn()` utility** → `import { cn } from "@/lib/utils"` for conditional classes
12. **Fonts** → `Public Sans` → use `font-heading` for headings, default body font for text
13. **Color mapping:**
    - `#196ee6` (Stitch primary) → `brand-primary` (#1B4D3E)
    - `bg-primary` → `bg-brand-primary`
    - `text-primary` → `text-brand-primary`
    - `bg-primary/10` → `bg-brand-primary/10`
    - `hover:text-primary` → `hover:text-brand-primary`
    - `focus:ring-primary` → `focus:ring-brand-primary`
    - `bg-background-light` / `#f6f7f8` → `bg-neutral-50`
    - `slate-900` → `neutral-900`
    - `slate-600` → `neutral-600`
    - `slate-400` → `neutral-400`
    - `gray-100`, `gray-200` → `neutral-100`, `neutral-200`
14. **Nav/Header/Footer** → REMOVE from Stitch output (already handled by main layout)
15. **Tailwind CDN config block** → REMOVE entirely
16. **`<script>` tags** → REMOVE
17. **`<html>`, `<head>`, `<body>`** → REMOVE (keep only main content)

---

## How to Fetch a Screen's HTML

For each task, run:

```bash
curl -sL "<downloadUrl from mcp__stitch__get_screen>" -o /tmp/stitch-<name>.html
```

Then read `/tmp/stitch-<name>.html` to get the full HTML structure. Convert to TSX following the rules above.

---

## Existing Code to Preserve

These files contain calculator LOGIC that must NOT be replaced — only the UI components wrapping them change:

- `src/lib/calculators/mortgage.ts` — `calculateMonthlyPayment()`, `calculateTotalRepayable()`
- `src/lib/calculators/sdlt.ts` — SDLT calculation logic
- `src/lib/calculators/sdlt-rates.ts` — SDLT rate band config
- `src/hooks/useMortgageParams.ts` — localStorage persistence hook

---

## Task 1: Tools Layout

**Files:**
- Create: `src/app/(main)/tools/layout.tsx`

**Step 1: Create the shared tools layout**

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Britestate Tools",
    default: "Property Tools | Britestate",
  },
  description: "Free property calculators and tools to help you make informed decisions about buying, selling, and renting in the UK.",
};

export default function ToolsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {children}
    </div>
  );
}
```

Write to `src/app/(main)/tools/layout.tsx`.

**Step 2: Verify**

```bash
pnpm build 2>&1 | tail -20
```

Expected: exits 0.

**Step 3: Commit**

```bash
git add src/app/(main)/tools/layout.tsx
git commit -m "feat(tools): add shared tools layout with SEO metadata"
```

---

## Task 2: Mortgage Affordability Calculator (NEW page)

**Files:**
- Create: `src/app/(main)/tools/affordability-calculator/page.tsx`

**Step 1: Fetch the Stitch screen HTML**

```bash
curl -sL "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzYxOTZlMDAzNWZlMzQzNjJiZmVhNjY3MWJlZmEzOWE4EgsSBxCNr6324BYYAZIBIwoKcHJvamVjdF9pZBIVQhM1OTU2NzA0MTAxMzk0ODY2NzE5&filename=&opi=89354086" -o /tmp/stitch-affordability.html
```

Read `/tmp/stitch-affordability.html` to understand the layout structure.

**Step 2: Convert and write the page**

This is a `"use client"` page. Structure from the Stitch screen:
- Breadcrumbs: Tools > Affordability Calculator
- Hero: title "Mortgage Affordability" + description
- Two-column layout: form (left 7-col) + results sidebar (right 5-col)
- Form sections: Applicant 1 (salary, bonus, other income), Applicant 2 (optional toggle), Monthly Outgoings (credit, loans, childcare), Deposit
- Results sidebar (sticky): "You could borrow up to £X", monthly payment, budget breakdown donut chart, "Find properties in your budget" CTA link to `/search?maxPrice=X`
- FAQ section below

Import existing mortgage logic from `@/lib/calculators/mortgage` where applicable. Use `<Input>`, `<Label>`, `<Card>`, `<Button>` from Shadcn. Use Lucide icons (`User`, `Users`, `Wallet`, `PiggyBank`, `Calculator`, `Home`, `ChevronRight`).

Apply ALL conversion rules. Write complete TSX to `src/app/(main)/tools/affordability-calculator/page.tsx`.

**Step 3: Verify**

```bash
pnpm build 2>&1 | tail -20
```

Expected: exits 0, no TypeScript errors.

**Step 4: Commit**

```bash
git add src/app/(main)/tools/affordability-calculator/
git commit -m "feat(tools): import affordability calculator from Stitch screen 5628341"
```

---

## Task 3: Mortgage Repayment Calculator (UPDATE existing)

**Files:**
- Modify: `src/app/(main)/tools/mortgage-calculator/page.tsx`
- Modify: `src/components/calculators/MortgageCalculator.tsx`

**Step 1: Fetch the Stitch screen HTML**

```bash
curl -sL "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAzYjQ1MWRmY2Q3YTRlNjA4NzIyMWMzZDkxNDE2NjczEgsSBxCNr6324BYYAZIBIwoKcHJvamVjdF9pZBIVQhM1OTU2NzA0MTAxMzk0ODY2NzE5&filename=&opi=89354086" -o /tmp/stitch-mortgage-repayment.html
```

Read `/tmp/stitch-mortgage-repayment.html`.

**Step 2: Update the page wrapper**

Read existing `src/app/(main)/tools/mortgage-calculator/page.tsx`. Replace the simple layout with the Stitch design:
- Breadcrumbs: Tools > Mortgage Calculator
- Hero section with title + description (matching Stitch)
- Two-column layout matching the Stitch screen
- "How is this calculated?" expandable section
- FAQ section
- Related tools links (SDLT calculator, affordability calculator)

**Step 3: Update the MortgageCalculator component**

Read existing `src/components/calculators/MortgageCalculator.tsx`. Update the UI to match the Stitch design while PRESERVING:
- Import of `calculateMonthlyPayment`, `calculateTotalRepayable` from `@/lib/calculators/mortgage`
- Import of `useMortgageParams` hook
- All existing calculation logic and state

Only change the JSX layout/styling to match the Stitch screen design. Apply all conversion rules.

**Step 4: Verify**

```bash
pnpm build 2>&1 | tail -20
```

**Step 5: Commit**

```bash
git add src/app/(main)/tools/mortgage-calculator/page.tsx src/components/calculators/MortgageCalculator.tsx
git commit -m "feat(tools): update mortgage calculator UI from Stitch screen 14cf81c"
```

---

## Task 4: SDLT Calculator (UPDATE existing)

**Files:**
- Modify: `src/app/(main)/tools/stamp-duty-calculator/page.tsx`
- Modify: `src/components/calculators/SdltCalculator.tsx`

**Step 1: Fetch the Stitch screen HTML**

```bash
curl -sL "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2E1MGIzYmZiMTJlYzQzZGNiZThiZGNmYTE5MWM2NDQzEgsSBxCNr6324BYYAZIBIwoKcHJvamVjdF9pZBIVQhM1OTU2NzA0MTAxMzk0ODY2NzE5&filename=&opi=89354086" -o /tmp/stitch-sdlt.html
```

Read `/tmp/stitch-sdlt.html`.

**Step 2: Update the page wrapper**

Read existing `src/app/(main)/tools/stamp-duty-calculator/page.tsx`. Replace layout with Stitch design:
- Breadcrumbs, hero, two-column layout
- Buyer type selector tabs (First-time buyer / Moving home / Additional property / Non-UK resident)
- Band breakdown table
- FAQ section
- Related tools links

**Step 3: Update the SdltCalculator component**

Read existing `src/components/calculators/SdltCalculator.tsx`. Update UI to match Stitch while PRESERVING:
- Import of SDLT calculation logic from `@/lib/calculators/sdlt`
- Import of rate bands from `@/lib/calculators/sdlt-rates`
- All calculation state and logic

**Step 4: Verify**

```bash
pnpm build 2>&1 | tail -20
```

**Step 5: Commit**

```bash
git add src/app/(main)/tools/stamp-duty-calculator/page.tsx src/components/calculators/SdltCalculator.tsx
git commit -m "feat(tools): update SDLT calculator UI from Stitch screen a3c149b"
```

---

## Task 5: Rental Yield & ROI Calculator (NEW)

**Files:**
- Create: `src/app/(main)/tools/rental-yield-calculator/page.tsx`

**Step 1: Fetch the Stitch screen HTML**

```bash
curl -sL "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2VmNmFhYzU2ZDc1ODQ2NDQ4MDY5Njc3MmJmZDE5MTc0EgsSBxCNr6324BYYAZIBIwoKcHJvamVjdF9pZBIVQhM1OTU2NzA0MTAxMzk0ODY2NzE5&filename=&opi=89354086" -o /tmp/stitch-rental-yield.html
```

Read `/tmp/stitch-rental-yield.html`.

**Step 2: Convert and write the page**

`"use client"` page. Structure from britestatestyle.txt:
- Inputs: Property purchase price, Monthly rent, Annual costs (maintenance, insurance, management fees, void periods)
- Results: Gross yield %, Net yield %, Annual profit/loss, Comparison to area average yield, ROI timeline chart
- Sidebar: "Speak to a Mortgage Broker" CTA, related calculators
- FAQ section

All calculation logic is client-side — implement inline with `useState` + `useMemo`. Gross yield = (annual rent / purchase price) * 100. Net yield = ((annual rent - annual costs) / purchase price) * 100.

Apply ALL conversion rules.

**Step 3: Verify**

```bash
pnpm build 2>&1 | tail -20
```

**Step 4: Commit**

```bash
git add src/app/(main)/tools/rental-yield-calculator/
git commit -m "feat(tools): import rental yield calculator from Stitch screen d518e6b"
```

---

## Task 6: Buy vs Rent Comparison Tool (NEW)

**Files:**
- Create: `src/app/(main)/tools/buy-vs-rent-calculator/page.tsx`

**Step 1: Fetch the Stitch screen HTML**

```bash
curl -sL "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzc1YjVjNjFkMmQ1ZjQ4YTBiZGIxODJmMjcwZWQ1MzViEgsSBxCNr6324BYYAZIBIwoKcHJvamVjdF9pZBIVQhM1OTU2NzA0MTAxMzk0ODY2NzE5&filename=&opi=89354086" -o /tmp/stitch-buy-vs-rent.html
```

Read `/tmp/stitch-buy-vs-rent.html`.

**Step 2: Convert and write the page**

`"use client"` page. Structure from britestatestyle.txt:
- Inputs: Monthly rent, Property price, Deposit, Mortgage rate, Expected property growth rate, Investment return rate
- Results: Break-even timeline chart, cumulative cost comparison over 1/5/10/25 years
- Verdict: "Buying becomes cheaper than renting after X years"
- Sidebar with related tools

All math is client-side. Use Recharts `LineChart` if installed, or simple table comparison if not.

Apply ALL conversion rules.

**Step 3: Verify**

```bash
pnpm build 2>&1 | tail -20
```

**Step 4: Commit**

```bash
git add src/app/(main)/tools/buy-vs-rent-calculator/
git commit -m "feat(tools): import buy vs rent calculator from Stitch screen a1aac42"
```

---

## Task 7: Energy Bill & EPC Estimator (NEW)

**Files:**
- Create: `src/app/(main)/tools/energy-bill-estimator/page.tsx`

**Step 1: Fetch the Stitch screen HTML**

```bash
curl -sL "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2FlMmViNDM5ODU1YjRhYTJiYjEzY2ZkZmYzZjhhNzMyEgsSBxCNr6324BYYAZIBIwoKcHJvamVjdF9pZBIVQhM1OTU2NzA0MTAxMzk0ODY2NzE5&filename=&opi=89354086" -o /tmp/stitch-energy.html
```

Read `/tmp/stitch-energy.html`.

**Step 2: Convert and write the page**

`"use client"` page. Structure from britestatestyle.txt:
- Inputs: Property type (select), Bedrooms (number stepper), EPC rating (A-G select), Heating type (gas/electric/oil/heat pump)
- Results: Estimated monthly energy cost, comparison to area average, tips to reduce bills
- "Find an Energy Assessor" CTA linking to `/services?category=energy`
- Sidebar with related tools
- FAQ section

All estimates are client-side based on lookup tables (average energy costs by property type/EPC rating). Mock the lookup data inline.

Apply ALL conversion rules.

**Step 3: Verify**

```bash
pnpm build 2>&1 | tail -20
```

**Step 4: Commit**

```bash
git add src/app/(main)/tools/energy-bill-estimator/
git commit -m "feat(tools): import energy bill estimator from Stitch screen 6f3e855"
```

---

## Task 8: City Area Guide (NEW — dynamic route)

**Files:**
- Create: `src/app/(main)/areas/[city]/page.tsx`

**Step 1: Fetch the Stitch screen HTML**

```bash
curl -sL "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzMzMzk3MWZiNzQ2MTQ5NmE5N2VjNDU2MWE0ODRmNWRiEgsSBxCNr6324BYYAZIBIwoKcHJvamVjdF9pZBIVQhM1OTU2NzA0MTAxMzk0ODY2NzE5&filename=&opi=89354086" -o /tmp/stitch-city-guide.html
```

Read `/tmp/stitch-city-guide.html`.

**Step 2: Convert and write the page**

Server Component (NO `"use client"`). Structure from britestatestyle.txt and Stitch screen:
- Hero: city photo placeholder + "Properties in London" (H1) — use `params.city` capitalised
- Stats bar: average price (£725,400), YoY change (+4.2%), number of listings (12,400), avg days to sell (34)
- Popular boroughs grid: thumbnail + name + avg price (mock 8 boroughs linking to `/areas/london/[area]`)
- "Properties For Sale" preview: 4 PropertyCard-style cards + "View All Results →" link to `/search?city=X`
- "Properties To Rent" preview: similar
- Market overview: 5-year price trend (mock data table or placeholder chart area)
- Area description (editorial SEO content — realistic mock text about London property market)
- Transport overview section
- "Find Local Services" section linking to `/services?area=X`

Use mock data with realistic London property stats. Dynamic `[city]` param accessed via `params`.

Apply ALL conversion rules.

**Step 3: Verify**

```bash
pnpm build 2>&1 | tail -20
```

**Step 4: Commit**

```bash
git add src/app/(main)/areas/
git commit -m "feat(areas): import city area guide from Stitch screen d5d8601"
```

---

## Task 9: Borough Guide (NEW — nested dynamic route)

**Files:**
- Create: `src/app/(main)/areas/[city]/[area]/page.tsx`

**Step 1: Fetch the Stitch screen HTML**

```bash
curl -sL "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2NhOTQxOTc0OGRlZTRlM2ViMGE1YzdjMDIzZDJkMzY3EgsSBxCNr6324BYYAZIBIwoKcHJvamVjdF9pZBIVQhM1OTU2NzA0MTAxMzk0ODY2NzE5&filename=&opi=89354086" -o /tmp/stitch-borough-guide.html
```

Read `/tmp/stitch-borough-guide.html`.

**Step 2: Convert and write the page**

Server Component. Structure from britestatestyle.txt:
- Hero: area photo + "Properties in Isleworth, TW7" (H1) — use `params.area` + `params.city`
- Stats: avg price, listings count, most common property type, avg price by type table
- Map placeholder (div with bg-neutral-200 and "Map — coming soon" text)
- Property listings grid (mock 6 compact cards)
- Area data dashboard sections:
  - Price trends (mock data table or chart placeholder)
  - Property type distribution
  - Demographics: population, age, household types
  - Schools table with Ofsted ratings (mock 5 schools)
  - Transport: nearest stations, journey times
  - Amenities counts
  - Crime stats comparison
  - Broadband average speed
- Local professionals section linking to `/services?area=X`
- Editorial area description (mock)

Use Isleworth as the mock data example. All data is hardcoded mock.

Apply ALL conversion rules.

**Step 3: Verify**

```bash
pnpm build 2>&1 | tail -20
```

**Step 4: Commit**

```bash
git add src/app/(main)/areas/[city]/[area]/
git commit -m "feat(areas): import borough guide from Stitch screen 689da03"
```

---

## Task 10: Sold Prices Page (NEW — dynamic route)

**Files:**
- Create: `src/app/(main)/sold-prices/[area]/page.tsx`

**Step 1: Fetch the Stitch screen HTML**

```bash
curl -sL "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAyNDQ2MjM3OWI3NTQ5YmNhYmYwMDg0YmVhMjVmYWU3EgsSBxCNr6324BYYAZIBIwoKcHJvamVjdF9pZBIVQhM1OTU2NzA0MTAxMzk0ODY2NzE5&filename=&opi=89354086" -o /tmp/stitch-sold-prices.html
```

Read `/tmp/stitch-sold-prices.html`.

**Step 2: Convert and write the page**

Server Component. Structure from britestatestyle.txt:
- Search bar: postcode or address input (static, no functionality yet)
- Results table: address, type, beds, sold price, sold date, price paid vs asking (mock 15+ rows with realistic Isleworth addresses)
- Map placeholder
- Stats cards: average sold price, total transactions, price vs listing price gap
- Trend section: sold prices over time (placeholder chart or data table)

Use mock Isleworth sold price data (realistic TW7 addresses, prices £300k-£800k range).

Apply ALL conversion rules.

**Step 3: Verify**

```bash
pnpm build 2>&1 | tail -20
```

**Step 4: Commit**

```bash
git add src/app/(main)/sold-prices/
git commit -m "feat(areas): import sold prices page from Stitch screen d10d9a0"
```

---

## Task 11: UK Market Trends Dashboard (NEW)

**Files:**
- Create: `src/app/(main)/market-trends/page.tsx`

**Step 1: Fetch the Stitch screen HTML**

```bash
curl -sL "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzY0ZTkwZWY5ODFjNTRjMmViMTY5NDE5NmY5NzllOThiEgsSBxCNr6324BYYAZIBIwoKcHJvamVjdF9pZBIVQhM1OTU2NzA0MTAxMzk0ODY2NzE5&filename=&opi=89354086" -o /tmp/stitch-market-trends.html
```

Read `/tmp/stitch-market-trends.html`.

**Step 2: Convert and write the page**

Server Component. Structure from britestatestyle.txt:
- National overview hero with key KPIs: average UK house price, YoY change, transaction volume, avg days to sell
- Regional selector (static pills/tabs: London, South East, South West, Midlands, North West, North East, Scotland, Wales, NI)
- Charts section (placeholder areas for): average prices by region, transaction volumes, time to sell, asking vs sold gap
- "Hot" and "Cold" market indicator cards (mock: "Bristol +8.2% YoY" hot, "Aberdeen -2.1% YoY" cold)
- Month-on-month and year-on-year comparison tables
- Commentary/editorial section (mock)

Use realistic 2025-2026 UK property market data for mocks.

Apply ALL conversion rules.

**Step 3: Verify**

```bash
pnpm build 2>&1 | tail -20
```

**Step 4: Commit**

```bash
git add src/app/(main)/market-trends/
git commit -m "feat(areas): import market trends dashboard from Stitch screen 8d309f3"
```

---

## Task 12: AI Listing Assistant Component (NEW)

**Files:**
- Create: `src/components/ai/ListingAssistant.tsx`

**Step 1: Fetch the Stitch screen HTML**

```bash
curl -sL "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2MzZThiN2MzNGM0NDQ4ZTViM2Q4ODM0Nzc0ZTdiZGVmEgsSBxCNr6324BYYAZIBIwoKcHJvamVjdF9pZBIVQhM1OTU2NzA0MTAxMzk0ODY2NzE5&filename=&opi=89354086" -o /tmp/stitch-ai-listing.html
```

Read `/tmp/stitch-ai-listing.html`.

**Step 2: Convert and write the component**

`"use client"` component. This is the AI property description generator UI:
- Props: `propertyAddress: string; propertyDetails: { beds: number; baths: number; type: string }`
- Tone selector: "Professional" / "Friendly" / "Luxury" (3 toggle buttons)
- "Generate Description" primary button with Sparkles icon
- Loading state: skeleton text animation
- Generated text area: editable textarea showing the AI-generated description
- Toolbar: Copy, Regenerate (max 3), thumbs up/down feedback
- Regeneration counter: "2 of 3 regenerations remaining"
- Character/word count below textarea

This is UI-only — no actual Claude API calls. The button click sets a mock generated description string. Wire up the `AiFeedback` component from `@/components/ai/AiFeedback.tsx` if it has a compatible interface.

Apply ALL conversion rules.

**Step 3: Verify**

```bash
pnpm build 2>&1 | tail -20
```

**Step 4: Commit**

```bash
git add src/components/ai/ListingAssistant.tsx
git commit -m "feat(ai): import listing assistant UI from Stitch screen d99b9b5"
```

---

## Task 13: Token Alignment Scan

**Files:** Any file modified or created in Tasks 1–12

**Step 1: Scan for hardcoded colors**

```bash
grep -rn "#[0-9A-Fa-f]\{3,8\}" src/app/(main)/tools src/app/(main)/areas src/app/(main)/sold-prices src/app/(main)/market-trends src/components/ai/ListingAssistant.tsx --include="*.tsx" | grep -v "node_modules"
```

**Step 2: Scan for Stitch-specific classes**

```bash
grep -rn "bg-primary\b\|text-primary\b\|border-primary\b\|ring-primary\b" src/app/(main)/tools src/app/(main)/areas src/app/(main)/sold-prices src/app/(main)/market-trends src/components/ai/ListingAssistant.tsx --include="*.tsx"
```

These should be `bg-brand-primary`, `text-brand-primary`, etc.

**Step 3: Scan for Material Icons**

```bash
grep -rn "material-icons\|material_icons\|Material Icons" src/ --include="*.tsx"
```

Should return zero results.

**Step 4: Scan for Public Sans font**

```bash
grep -rn "Public Sans\|public-sans" src/ --include="*.tsx" --include="*.css"
```

Should return zero results.

**Step 5: Fix any issues found**

Replace each hardcoded value with the correct Britestate token per the color mapping in the Conversion Rules above.

**Step 6: Verify**

```bash
pnpm build 2>&1 | tail -20
pnpm lint 2>&1 | tail -20
```

Both must exit 0.

**Step 7: Commit (only if changes were made)**

```bash
git add -u
git commit -m "style: replace hardcoded values with Britestate design tokens in Phase 5 pages"
```

---

## Task 14: Final Build Verification

**Step 1: Full build**

```bash
pnpm build
```

Must exit 0 with no TypeScript errors.

**Step 2: Lint**

```bash
pnpm lint
```

Must exit 0 with no warnings.

**Step 3: Spot-check routes**

Start dev server and verify these routes render without errors:

```bash
pnpm dev &
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/tools/affordability-calculator
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/tools/mortgage-calculator
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/tools/stamp-duty-calculator
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/tools/rental-yield-calculator
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/tools/buy-vs-rent-calculator
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/tools/energy-bill-estimator
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/areas/london
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/areas/london/isleworth
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/sold-prices/isleworth
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/market-trends
```

All should return `200`.

---

## Done Criteria

- [ ] `pnpm build` passes with zero errors
- [ ] `pnpm lint` passes with zero warnings
- [ ] 6 calculator pages render with interactive inputs and real-time results
- [ ] 4 area guide pages render with mock UK property data
- [ ] AI Listing Assistant component created
- [ ] No hardcoded hex values in any new/modified file
- [ ] All pages use Britestate design tokens
- [ ] All Material Icons replaced with Lucide React equivalents
- [ ] All fonts use project font stack (no Public Sans)
- [ ] All routes return HTTP 200
