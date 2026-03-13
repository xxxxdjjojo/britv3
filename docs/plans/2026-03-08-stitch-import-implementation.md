# Stitch Screen Import — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Import 16 Stitch screens from project `5956704101394866719`, refining existing pages to match the Stitch designs and creating new pages (blog, legal, welcome) — all fully functional with britestatestyle.txt design tokens, wired backend, and tested.

**Architecture:** Existing pages (homepage, search, property detail, auth) get visual refinements from Stitch screens while preserving backend logic. New pages (blog, legal, welcome) are created from scratch using Stitch HTML converted to TSX. Playwright E2E tests are added for all routes. Vitest tests exist for most services; we add component tests for new components.

**Tech Stack:** Next.js 16 App Router · TypeScript strict · Tailwind v4 · Shadcn UI · Lucide React · Recharts · Supabase Auth · Vitest (happy-dom) · Playwright

**Stitch Project:** `projects/5956704101394866719`
**Working directory:** `/Users/joanflerinbig/Documents/britv3.0`

**Key context for the implementer:**
- Design tokens are in `src/app/globals.css` — use Tailwind classes like `bg-brand-primary`, `text-neutral-700`, NOT hex values
- `cn()` utility at `@/lib/utils` for conditional classNames
- Vitest setup at `src/__tests__/setup.ts` with Supabase mocks already configured
- Fonts: `font-heading` (Plus Jakarta Sans) for headings, default Inter for body
- Existing Supabase auth clients: `@/lib/supabase/client` (browser) and `@/lib/supabase/server` (server)

---

## Conversion Rules (apply to ALL Stitch → TSX conversions)

1. **No hardcoded hex** → use Tailwind design token classes (`bg-brand-primary`, `text-neutral-500`, etc.)
2. **No inline `style={{}}`** for colors/spacing → Tailwind utilities only
3. **Images** → `<Image>` from `next/image` with `alt`, `width`, `height`
4. **Links** → `<Link>` from `next/link`
5. **Icons** → Lucide React (`import { Home } from "lucide-react"`)
6. **`class=`** → `className=`
7. **Interactive elements** → `"use client"` directive
8. **Buttons** → `<Button>` from `@/components/ui/button`
9. **Typography** → headings get `font-heading` class, body uses default `font-sans`
10. **Min touch target** → 44x44px on mobile (`min-h-[44px] min-w-[44px]`)

---

## Task 0: Install Playwright + Mock Data Layer

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/homepage.spec.ts` (smoke test to verify setup)
- Create: `src/lib/mock-data/properties.ts`
- Create: `src/lib/mock-data/blog-posts.ts`
- Create: `src/lib/mock-data/services.ts`
- Modify: `package.json` (add scripts)

**Step 1: Install Playwright**

Run:
```bash
cd /Users/joanflerinbig/Documents/britv3.0 && pnpm add -D @playwright/test
```

**Step 2: Install Playwright browsers**

Run:
```bash
cd /Users/joanflerinbig/Documents/britv3.0 && npx playwright install chromium
```

**Step 3: Create Playwright config**

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 14"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

**Step 4: Create smoke E2E test**

Create `e2e/homepage.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test("homepage loads and shows hero", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Britestate/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
```

**Step 5: Create mock data — properties**

Create `src/lib/mock-data/properties.ts`:

```typescript
export type MockProperty = {
  id: string;
  slug: string;
  title: string;
  price: number;
  priceFormatted: string;
  listingType: "sale" | "rent" | "auction";
  address: { line1: string; line2: string; postcode: string };
  beds: number;
  baths: number;
  receptions: number;
  sqft: number;
  type: string;
  image: string;
  images: string[];
  description: string;
  features: string[];
  agent: { name: string; agency: string; phone: string; avatar: string };
  epc: string;
  tenure: string;
  councilTax: string;
  listedDate: string;
};

export const MOCK_PROPERTIES: MockProperty[] = [
  {
    id: "prop-1",
    slug: "14-elm-road-isleworth",
    title: "3 Bedroom Semi-Detached House",
    price: 425000,
    priceFormatted: "£425,000",
    listingType: "sale",
    address: { line1: "14 Elm Road", line2: "Isleworth, Middlesex", postcode: "TW7 4PQ" },
    beds: 3,
    baths: 2,
    receptions: 1,
    sqft: 1200,
    type: "Semi-Detached",
    image: "/images/properties/property-1.jpg",
    images: [
      "/images/properties/property-1.jpg",
      "/images/properties/property-2.jpg",
      "/images/properties/property-3.jpg",
      "/images/properties/property-4.jpg",
    ],
    description: "A beautifully presented three-bedroom semi-detached house in the heart of Isleworth. Featuring a recently refurbished kitchen, south-facing garden, and modern bathroom. Close to excellent schools and transport links. The property benefits from double glazing throughout and a new gas central heating system. Chain free.",
    features: ["South-facing garden", "Chain free", "Recently refurbished kitchen", "Double glazing", "Gas central heating", "Close to schools"],
    agent: { name: "James Wilson", agency: "Marsh & Parsons", phone: "020 7123 4567", avatar: "/images/agents/agent-1.jpg" },
    epc: "C",
    tenure: "Freehold",
    councilTax: "D",
    listedDate: "2026-02-20",
  },
  {
    id: "prop-2",
    slug: "22-oak-lane-richmond",
    title: "4 Bedroom Detached House",
    price: 850000,
    priceFormatted: "£850,000",
    listingType: "sale",
    address: { line1: "22 Oak Lane", line2: "Richmond, Surrey", postcode: "TW9 2AB" },
    beds: 4,
    baths: 3,
    receptions: 2,
    sqft: 2100,
    type: "Detached",
    image: "/images/properties/property-2.jpg",
    images: ["/images/properties/property-2.jpg", "/images/properties/property-3.jpg"],
    description: "A stunning four-bedroom detached house with large garden, double garage, and panoramic views across Richmond Park. Master bedroom with en-suite, open-plan kitchen/dining area, and home office. Recently renovated to a high standard.",
    features: ["Double garage", "Garden", "Richmond Park views", "Home office", "En-suite master", "Open-plan kitchen"],
    agent: { name: "Sarah Thompson", agency: "Knight Frank", phone: "020 7234 5678", avatar: "/images/agents/agent-2.jpg" },
    epc: "B",
    tenure: "Freehold",
    councilTax: "F",
    listedDate: "2026-03-01",
  },
  {
    id: "prop-3",
    slug: "flat-7-river-court-putney",
    title: "2 Bedroom Flat",
    price: 375000,
    priceFormatted: "£375,000",
    listingType: "sale",
    address: { line1: "Flat 7, River Court", line2: "Putney, London", postcode: "SW15 1QT" },
    beds: 2,
    baths: 1,
    receptions: 1,
    sqft: 750,
    type: "Flat",
    image: "/images/properties/property-3.jpg",
    images: ["/images/properties/property-3.jpg", "/images/properties/property-4.jpg"],
    description: "A bright and spacious two-bedroom flat overlooking the River Thames. Modern kitchen with integrated appliances, generous living room, and private balcony. Secure entry, lift access, and allocated parking space included.",
    features: ["River views", "Balcony", "Allocated parking", "Lift access", "Integrated appliances", "Secure entry"],
    agent: { name: "James Wilson", agency: "Marsh & Parsons", phone: "020 7123 4567", avatar: "/images/agents/agent-1.jpg" },
    epc: "B",
    tenure: "Leasehold",
    councilTax: "C",
    listedDate: "2026-02-15",
  },
  {
    id: "prop-4",
    slug: "the-old-rectory-burford",
    title: "5 Bedroom Country House",
    price: 1200000,
    priceFormatted: "£1,200,000",
    listingType: "sale",
    address: { line1: "The Old Rectory", line2: "Burford, Oxfordshire", postcode: "OX18 4RL" },
    beds: 5,
    baths: 3,
    receptions: 3,
    sqft: 3500,
    type: "Detached",
    image: "/images/properties/property-4.jpg",
    images: ["/images/properties/property-4.jpg", "/images/properties/property-1.jpg"],
    description: "A magnificent Grade II listed country house in the picturesque Cotswolds village of Burford. Period features throughout including original fireplaces, exposed beams, and stone floors. Extensive grounds with mature gardens, paddock, and stable block.",
    features: ["Grade II listed", "Period features", "Mature gardens", "Paddock", "Stable block", "Exposed beams"],
    agent: { name: "Emma Richards", agency: "Savills", phone: "01993 456789", avatar: "/images/agents/agent-3.jpg" },
    epc: "D",
    tenure: "Freehold",
    councilTax: "G",
    listedDate: "2026-01-28",
  },
  {
    id: "prop-5",
    slug: "12-maple-street-manchester",
    title: "3 Bedroom Terraced House",
    price: 285000,
    priceFormatted: "£285,000",
    listingType: "sale",
    address: { line1: "12 Maple Street", line2: "Didsbury, Manchester", postcode: "M20 6RT" },
    beds: 3,
    baths: 1,
    receptions: 2,
    sqft: 1050,
    type: "Terraced",
    image: "/images/properties/property-1.jpg",
    images: ["/images/properties/property-1.jpg"],
    description: "A charming Victorian terraced house in popular Didsbury. Original features complemented by modern updates. Close to village amenities, Didsbury Park, and excellent transport links to Manchester city centre.",
    features: ["Victorian features", "Close to village", "Near transport", "Bay windows", "Rear garden", "Cellar"],
    agent: { name: "Tom Bradley", agency: "Gascoigne Halman", phone: "0161 123 4567", avatar: "/images/agents/agent-1.jpg" },
    epc: "C",
    tenure: "Freehold",
    councilTax: "C",
    listedDate: "2026-03-05",
  },
  {
    id: "prop-6",
    slug: "apt-15-harbourside-bristol",
    title: "1 Bedroom Apartment",
    price: 1250,
    priceFormatted: "£1,250 pcm",
    listingType: "rent",
    address: { line1: "Apt 15, Harbourside", line2: "Bristol", postcode: "BS1 5TY" },
    beds: 1,
    baths: 1,
    receptions: 1,
    sqft: 550,
    type: "Flat",
    image: "/images/properties/property-3.jpg",
    images: ["/images/properties/property-3.jpg"],
    description: "A modern one-bedroom apartment in the heart of Bristol's Harbourside development. Open-plan living, floor-to-ceiling windows, and stunning harbour views. Gym and concierge included.",
    features: ["Harbour views", "Concierge", "Gym access", "Floor-to-ceiling windows", "Furnished", "Parking available"],
    agent: { name: "Sarah Thompson", agency: "Ocean", phone: "0117 234 5678", avatar: "/images/agents/agent-2.jpg" },
    epc: "A",
    tenure: "Leasehold",
    councilTax: "B",
    listedDate: "2026-03-07",
  },
  {
    id: "prop-7",
    slug: "6-willow-close-edinburgh",
    title: "4 Bedroom Detached Bungalow",
    price: 495000,
    priceFormatted: "£495,000",
    listingType: "sale",
    address: { line1: "6 Willow Close", line2: "Corstorphine, Edinburgh", postcode: "EH12 7PL" },
    beds: 4,
    baths: 2,
    receptions: 2,
    sqft: 1800,
    type: "Bungalow",
    image: "/images/properties/property-2.jpg",
    images: ["/images/properties/property-2.jpg"],
    description: "A spacious detached bungalow in the sought-after Corstorphine area. Accessible living on one level with four bedrooms, two bathrooms, and a large conservatory. Low-maintenance garden and driveway parking.",
    features: ["Single level", "Conservatory", "Driveway", "Low maintenance garden", "Accessible", "Close to zoo"],
    agent: { name: "Alistair McGregor", agency: "ESPC", phone: "0131 456 7890", avatar: "/images/agents/agent-3.jpg" },
    epc: "C",
    tenure: "Freehold",
    councilTax: "E",
    listedDate: "2026-02-10",
  },
  {
    id: "prop-8",
    slug: "cottage-lane-bath",
    title: "2 Bedroom Georgian Cottage",
    price: 525000,
    priceFormatted: "£525,000",
    listingType: "sale",
    address: { line1: "3 Cottage Lane", line2: "Widcombe, Bath", postcode: "BA2 4JR" },
    beds: 2,
    baths: 1,
    receptions: 1,
    sqft: 900,
    type: "Cottage",
    image: "/images/properties/property-4.jpg",
    images: ["/images/properties/property-4.jpg"],
    description: "A characterful Georgian cottage in the desirable Widcombe area. Stone exterior, sash windows, and original fireplaces. Courtyard garden with views towards Beechen Cliff. Walking distance to Bath city centre and train station.",
    features: ["Georgian character", "Stone exterior", "Sash windows", "Courtyard garden", "City views", "Walk to station"],
    agent: { name: "James Wilson", agency: "Carter Jonas", phone: "01225 789012", avatar: "/images/agents/agent-1.jpg" },
    epc: "D",
    tenure: "Freehold",
    councilTax: "D",
    listedDate: "2026-02-25",
  },
];
```

**Step 6: Create mock data — blog posts**

Create `src/lib/mock-data/blog-posts.ts`:

```typescript
export type MockBlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: { name: string; avatar: string; role: string };
  date: string;
  readTime: string;
  image: string;
  content: string;
};

export const MOCK_BLOG_POSTS: MockBlogPost[] = [
  {
    slug: "uk-property-market-forecast-2026",
    title: "UK Property Market Forecast: What to Expect in 2026",
    excerpt: "As interest rates stabilise, we analyse the potential growth areas and investment opportunities across major UK cities for the upcoming year.",
    category: "Market Trends",
    author: { name: "Emma Richards", avatar: "/images/agents/agent-3.jpg", role: "Property Analyst" },
    date: "2026-02-28",
    readTime: "8 min read",
    image: "/images/blog/blog-1.jpg",
    content: "The UK property market is entering an exciting phase in 2026. After a period of adjustment following the Bank of England's interest rate changes, the market is showing signs of renewed confidence.\n\n## Key Trends for 2026\n\nFirst-time buyers are returning to the market in force, buoyed by improved mortgage affordability and government support schemes. The average house price across England and Wales stands at £305,000, with regional variations continuing to play a significant role.\n\n### Northern Powerhouse Growth\n\nManchester, Leeds, and Liverpool continue to outperform London in terms of price growth. Manchester has seen a 6.2% increase year-on-year, driven by significant regeneration projects and growing tech sector employment.\n\n### London's Recovery\n\nAfter several years of subdued growth, London's property market is stabilising. Prime central London has seen renewed interest from international buyers, while outer boroughs like Bromley and Croydon offer better value for families.\n\n## What This Means for Buyers\n\nIf you're looking to buy in 2026, the fundamentals are improving. Mortgage rates have settled around 4-4.5% for a standard 5-year fix, making monthly payments more predictable. Our advice: focus on areas with strong transport links and regeneration investment.\n\n## Investment Opportunities\n\nBuy-to-let landlords should consider university cities where rental demand remains strong. Birmingham, Nottingham, and Bristol all show rental yields above 5%, making them attractive for portfolio growth.",
  },
  {
    slug: "first-time-buyer-checklist",
    title: "First-Time Buyer's Checklist: From Viewing to Keys",
    excerpt: "Navigating your first property purchase can be daunting. Our comprehensive guide breaks down every step of the process.",
    category: "Buying Guide",
    author: { name: "Sarah Thompson", avatar: "/images/agents/agent-2.jpg", role: "Senior Editor" },
    date: "2026-02-18",
    readTime: "12 min read",
    image: "/images/blog/blog-2.jpg",
    content: "Buying your first home is one of the biggest financial decisions you'll make. This guide walks you through every stage of the process.\n\n## Before You Start Searching\n\n1. **Get your finances in order** — Review your credit score, save for a deposit (typically 5-20% of the property price), and research government help-to-buy schemes.\n\n2. **Get a mortgage Agreement in Principle (AIP)** — This shows sellers you're a serious buyer. Most lenders will provide one within 24-48 hours.\n\n3. **Calculate your budget** — Don't forget stamp duty, solicitor fees (£1,000-2,000), survey costs (£300-1,500), and moving costs.\n\n## The Search\n\n4. **Define your must-haves** — Location, number of bedrooms, garden, parking. Be clear about non-negotiables vs nice-to-haves.\n\n5. **Set up alerts** — Use Britestate's AI-powered search to get instant notifications for matching properties.\n\n6. **View strategically** — Visit properties at different times of day. Check the area on foot. Talk to neighbours if possible.\n\n## Making an Offer\n\n7. **Research comparable sales** — Use Britestate's price history tool to see what similar properties sold for recently.\n\n8. **Make your offer** — Start below asking price if the market allows. Your estate agent can advise on strategy.\n\n## After the Offer\n\n9. **Instruct a solicitor** — They'll handle searches, contracts, and the legal transfer. Budget 8-12 weeks for conveyancing.\n\n10. **Get a survey** — Choose between a basic Homebuyer Report or a full Building Survey for older properties.",
  },
  {
    slug: "eco-friendly-upgrades",
    title: "Eco-Friendly Upgrades That Add Value to Your Home",
    excerpt: "Discover which sustainable improvements offer the best return on investment while lowering your carbon footprint.",
    category: "Sustainability",
    author: { name: "Tom Bradley", avatar: "/images/agents/agent-1.jpg", role: "Property Writer" },
    date: "2026-02-12",
    readTime: "6 min read",
    image: "/images/blog/blog-3.jpg",
    content: "With energy costs remaining high and buyers increasingly eco-conscious, green home improvements are a smart investment.\n\n## Top 5 Value-Adding Green Upgrades\n\n### 1. Solar Panels (ROI: 10-15 years)\nSolar panel costs have dropped significantly. A typical 4kW system costs £5,000-8,000 and can save £800-1,000 per year on energy bills. Plus, you can sell excess energy back to the grid.\n\n### 2. Heat Pump Installation (ROI: 7-12 years)\nAir source heat pumps are eligible for the Boiler Upgrade Scheme grant of £7,500. They're 3-4x more efficient than gas boilers and can add £10,000-15,000 to your property value.\n\n### 3. EPC Improvements\nMoving from an EPC rating of D to C can add 5-10% to your property value. Focus on loft insulation (£300-500), cavity wall insulation (£500-1,500), and draught-proofing.\n\n### 4. Double or Triple Glazing\nReplacing single glazing with double glazing can save £100-200 per year and significantly improve comfort. Triple glazing is worth considering for north-facing rooms.\n\n### 5. Smart Home Energy Management\nSmart thermostats, automated lighting, and energy monitoring systems appeal to tech-savvy buyers and typically cost £200-500 to install.\n\n## The EPC Factor\n\nFrom 2028, all rental properties will need a minimum EPC rating of C. Landlords should start planning upgrades now to avoid compliance issues and potential penalties.",
  },
  {
    slug: "finding-trusted-tradesperson",
    title: "How to Find a Trusted Tradesperson in 2026",
    excerpt: "From verification checks to reading reviews, here's how to find reliable professionals for your home projects.",
    category: "Advice",
    author: { name: "Emma Richards", avatar: "/images/agents/agent-3.jpg", role: "Property Analyst" },
    date: "2026-02-05",
    readTime: "7 min read",
    image: "/images/blog/blog-1.jpg",
    content: "Finding a reliable tradesperson can feel like a minefield. Here's how to protect yourself and find the right professional.\n\n## The Britestate Verification Standard\n\nEvery tradesperson on Britestate undergoes our rigorous verification process: identity checks, insurance verification, qualification validation, and 3 client + 3 peer references. This means you can book with confidence.\n\n## Red Flags to Watch For\n\n- Demands cash-only payment\n- No written quote or contract\n- Pressures you to decide immediately\n- Can't provide references\n- Unusually low quotes\n\n## Getting Quotes Right\n\nAlways get at least 3 quotes for any job over £500. Make sure each quote covers the same scope of work so you can compare fairly. The cheapest isn't always the best — look at reviews, qualifications, and how professional their communication is.",
  },
  {
    slug: "stamp-duty-guide-2026",
    title: "Stamp Duty Land Tax: Complete Guide for 2026",
    excerpt: "Everything you need to know about stamp duty rates, exemptions, and how to calculate what you'll pay.",
    category: "Legal",
    author: { name: "Sarah Thompson", avatar: "/images/agents/agent-2.jpg", role: "Senior Editor" },
    date: "2026-01-30",
    readTime: "10 min read",
    image: "/images/blog/blog-2.jpg",
    content: "Stamp Duty Land Tax (SDLT) is a tax paid when you buy property or land in England and Northern Ireland above a certain price.\n\n## Current Rates (2026)\n\n| Property Price Band | Rate |\n|---|---|\n| Up to £250,000 | 0% |\n| £250,001 - £925,000 | 5% |\n| £925,001 - £1,500,000 | 10% |\n| Over £1,500,000 | 12% |\n\n## First-Time Buyer Relief\n\nFirst-time buyers pay no stamp duty on the first £425,000 of a property priced up to £625,000. This can save up to £8,750.\n\n## Additional Property Surcharge\n\nBuying a second home or buy-to-let? You'll pay an additional 3% on top of standard rates. On a £300,000 property, that's an extra £9,000.\n\n## Use Our Calculator\n\nTry Britestate's free stamp duty calculator to see exactly what you'll pay. Just enter your property price and buyer type for an instant breakdown.",
  },
  {
    slug: "landlord-compliance-checklist",
    title: "Landlord Compliance Checklist: Stay Legal in 2026",
    excerpt: "From gas safety certificates to deposit protection, ensure you meet every legal requirement as a UK landlord.",
    category: "Landlord Tips",
    author: { name: "Tom Bradley", avatar: "/images/agents/agent-1.jpg", role: "Property Writer" },
    date: "2026-01-22",
    readTime: "9 min read",
    image: "/images/blog/blog-3.jpg",
    content: "UK landlord regulations continue to evolve. Here's your complete compliance checklist for 2026.\n\n## Essential Certificates\n\n### Gas Safety Certificate (CP12)\n- **Required:** Annually\n- **Cost:** £60-90\n- Must be carried out by a Gas Safe registered engineer\n\n### Energy Performance Certificate (EPC)\n- **Required:** Valid for 10 years, minimum E rating (C from 2028)\n- **Cost:** £60-120\n\n### Electrical Installation Condition Report (EICR)\n- **Required:** Every 5 years\n- **Cost:** £150-300\n\n### Smoke and CO Alarms\n- Smoke alarms on every floor, CO alarms in rooms with solid fuel appliances\n- Test at the start of each tenancy\n\n## Deposit Protection\n\nYou must protect tenants' deposits in a government-approved scheme within 30 days. Failure to do so can result in penalties of 1-3x the deposit amount.\n\n## Right to Rent Checks\n\nVerify every adult tenant's right to rent in England before the tenancy starts. Keep copies of documents for at least one year after the tenancy ends.\n\nUse Britestate's compliance dashboard to track all certificates, set reminders, and find verified professionals for inspections.",
  },
  {
    slug: "best-areas-remote-workers-2026",
    title: "Best UK Areas for Remote Workers: Space, Speed & Value",
    excerpt: "Where to find the perfect balance of fast broadband, affordable housing, and quality of life outside the city.",
    category: "Market Trends",
    author: { name: "Emma Richards", avatar: "/images/agents/agent-3.jpg", role: "Property Analyst" },
    date: "2026-01-15",
    readTime: "8 min read",
    image: "/images/blog/blog-1.jpg",
    content: "Remote working has permanently changed where people choose to live. Here are the top areas combining fast broadband, affordability, and lifestyle.\n\n## Our Top 5 Picks\n\n### 1. Frome, Somerset\nAverage price: £325,000. Fibre broadband available. Creative community, independent shops, and the stunning Mendip Hills on your doorstep.\n\n### 2. Hebden Bridge, West Yorkshire\nAverage price: £250,000. Full fibre broadband. A vibrant arts scene, excellent walking, and just 40 minutes from Manchester by train.\n\n### 3. Margate, Kent\nAverage price: £275,000. Superfast broadband widely available. Beach lifestyle, Turner Contemporary gallery, and high-speed rail to London St Pancras in 76 minutes.\n\n### 4. Shrewsbury, Shropshire\nAverage price: £280,000. Good connectivity. A beautiful medieval town with excellent schools, riverside walks, and a thriving food scene.\n\n### 5. Stroud, Gloucestershire\nAverage price: £350,000. Fibre broadband expanding. Cotswolds location, famous farmers' market, and a strong community of creative professionals.",
  },
  {
    slug: "mortgage-guide-self-employed",
    title: "Getting a Mortgage When Self-Employed: A Practical Guide",
    excerpt: "Self-employed? Here's how to improve your chances of mortgage approval and what lenders actually look for.",
    category: "Buying Guide",
    author: { name: "Sarah Thompson", avatar: "/images/agents/agent-2.jpg", role: "Senior Editor" },
    date: "2026-01-08",
    readTime: "7 min read",
    image: "/images/blog/blog-2.jpg",
    content: "Getting a mortgage when you're self-employed isn't as difficult as you might think — but it does require more preparation.\n\n## What Lenders Want to See\n\n1. **2-3 years of accounts or tax returns** — SA302 forms from HMRC are essential\n2. **A stable or growing income** — Lenders average your last 2-3 years of income\n3. **A good credit score** — Check yours before applying and fix any issues\n4. **A reasonable deposit** — 10-15% is typical; some lenders accept 5%\n\n## Tips for Improving Your Chances\n\n- Keep business and personal finances separate\n- File your tax returns early\n- Avoid taking large dividends one year and small the next\n- Work with a mortgage broker who specialises in self-employed applicants\n\nBritestate connects you with verified mortgage brokers who understand self-employed income. Use our 'Find a Broker' tool to compare options.",
  },
  {
    slug: "property-renovation-planning-permission",
    title: "Do You Need Planning Permission? A Homeowner's Guide",
    excerpt: "From loft conversions to garden offices, understand when you need planning permission and when permitted development applies.",
    category: "Advice",
    author: { name: "Tom Bradley", avatar: "/images/agents/agent-1.jpg", role: "Property Writer" },
    date: "2026-01-02",
    readTime: "6 min read",
    image: "/images/blog/blog-3.jpg",
    content: "Planning to extend or renovate? Understanding when you need planning permission can save you time, money, and legal headaches.\n\n## Permitted Development (No Planning Needed)\n\n- Single-storey rear extensions up to 3m (semi) or 4m (detached)\n- Loft conversions up to 40m³ (terraced/semi) or 50m³ (detached)\n- Garden offices under 2.5m height near a boundary\n- Internal alterations (non-listed buildings)\n- Solar panels (with conditions)\n\n## You WILL Need Planning Permission For\n\n- Extensions exceeding permitted development limits\n- Building in front of the principal elevation\n- Any work in a Conservation Area beyond basic maintenance\n- Listed building alterations (even internal)\n- Change of use (e.g., residential to commercial)\n\n## The Application Process\n\n1. Pre-application advice (optional but recommended): £50-600\n2. Submit application via Planning Portal: £234 for householder applications\n3. Wait for decision: typically 8 weeks\n4. Appeal if refused: free, but takes 6+ months\n\nNeed an architect or planning consultant? Find verified professionals on Britestate.",
  },
];
```

**Step 7: Create mock data — services**

Create `src/lib/mock-data/services.ts`:

```typescript
export type MockServiceCategory = {
  slug: string;
  title: string;
  icon: string;
  count: number;
  description: string;
};

export const MOCK_SERVICE_CATEGORIES: MockServiceCategory[] = [
  { slug: "plumbers", title: "Plumbers", icon: "Wrench", count: 142, description: "Emergency repairs, installations, and maintenance." },
  { slug: "electricians", title: "Electricians", icon: "Zap", count: 98, description: "Rewiring, inspections, and smart home setups." },
  { slug: "builders", title: "Builders", icon: "HardHat", count: 210, description: "Renovations, extensions, and new builds." },
  { slug: "estate-agents", title: "Estate Agents", icon: "Building2", count: 354, description: "Local experts for buying, selling, and letting." },
  { slug: "mortgage-brokers", title: "Mortgage Brokers", icon: "Calculator", count: 156, description: "Find the best rates and tailored financial advice." },
  { slug: "surveyors", title: "Surveyors", icon: "Ruler", count: 87, description: "RICS valuations, homebuyer reports, and audits." },
];
```

**Step 8: Add scripts to package.json**

Add to `"scripts"`:
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

**Step 9: Verify setup**

Run:
```bash
pnpm test --run 2>&1 | tail -5
```
Expected: existing tests pass.

Run:
```bash
pnpm build 2>&1 | tail -5
```
Expected: build passes.

**Step 10: Commit**

```bash
git add playwright.config.ts e2e/ src/lib/mock-data/ package.json pnpm-lock.yaml
git commit -m "chore: add Playwright E2E setup and typed mock data layer"
```

---

## Task 1: Refine Homepage from Stitch Screen

**Files:**
- Modify: `src/app/(main)/page.tsx`

**Step 1: Fetch the Stitch homepage screen**

Use `mcp__stitch__get_screen` with:
- `name`: `projects/5956704101394866719/screens/585827f530fd4cd89b299d332eb562b3`
- `projectId`: `5956704101394866719`
- `screenId`: `585827f530fd4cd89b299d332eb562b3`

**Step 2: Compare Stitch output with current implementation**

The current homepage at `src/app/(main)/page.tsx` already has all 8 sections. Compare the Stitch design against the current code and identify visual differences:
- Check spacing, padding, and margins match britestatestyle.txt (4px base unit)
- Check typography sizes and weights match the spec
- Check border radii match (`--radius-sm` through `--radius-2xl`)
- Check shadow classes match (`shadow-xs` through `shadow-xl`)
- Check any visual elements from Stitch that are missing

**Step 3: Apply design refinements**

Update `src/app/(main)/page.tsx` with visual changes from the Stitch design. Preserve all existing content data (FEATURED_PROPERTIES, HOW_IT_WORKS, SERVICE_CATEGORIES, TESTIMONIALS, BLOG_POSTS).

Key things to check/fix:
- Hero: background overlay, search bar styling, tab styling matches Stitch
- Property cards: ensure spacing, shadow, hover effects match
- Service cards: icon containers, badge styling match Stitch
- Stats section: number formatting, divider styling
- CTA section: button sizes and spacing

**Step 4: Verify build**

Run:
```bash
pnpm build 2>&1 | tail -10
```
Expected: exits 0.

**Step 5: Write homepage E2E test**

Add to `e2e/homepage.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders hero section with search", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Find your perfect");
    await expect(page.getByText("Search by school")).toBeVisible();
    await expect(page.getByText("Buy")).toBeVisible();
    await expect(page.getByText("Rent")).toBeVisible();
  });

  test("renders featured properties section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Featured Properties/i })).toBeVisible();
    await expect(page.getByText("For Sale")).toBeVisible();
  });

  test("renders how it works section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /How It Works/i })).toBeVisible();
    await expect(page.getByText("Search & Discover")).toBeVisible();
    await expect(page.getByText("Connect with Verified Pros")).toBeVisible();
    await expect(page.getByText("Move In with Confidence")).toBeVisible();
  });

  test("renders services section", async ({ page }) => {
    await expect(page.getByText("Trusted professionals")).toBeVisible();
    await expect(page.getByText("Plumbers")).toBeVisible();
    await expect(page.getByText("Electricians")).toBeVisible();
  });

  test("renders trust section with stats", async ({ page }) => {
    await expect(page.getByText("50k+")).toBeVisible();
    await expect(page.getByText("4.9/5")).toBeVisible();
  });

  test("renders testimonials", async ({ page }) => {
    await expect(page.getByText("Community Stories")).toBeVisible();
  });

  test("renders blog preview", async ({ page }) => {
    await expect(page.getByText("Latest from the Blog")).toBeVisible();
  });

  test("renders CTA banner with links", async ({ page }) => {
    await expect(page.getByText("Ready to get started?")).toBeVisible();
    const listLink = page.getByRole("link", { name: /List Your Property/i });
    await expect(listLink).toBeVisible();
    await expect(listLink).toHaveAttribute("href", "/register?role=seller");
  });

  test("search bar links to /search", async ({ page }) => {
    const searchLink = page.getByLabel("Search properties");
    await expect(searchLink).toHaveAttribute("href", "/search");
  });
});

test.describe("Homepage Mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("renders hero on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
```

**Step 6: Run E2E tests**

Run:
```bash
pnpm test:e2e e2e/homepage.spec.ts
```
Expected: all tests pass.

**Step 7: Commit**

```bash
git add src/app/(main)/page.tsx e2e/homepage.spec.ts
git commit -m "feat(pages): refine homepage from Stitch screen + add E2E tests"
```

---

## Task 2: Refine Header + Footer from Stitch

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/Footer.tsx`

**Step 1: Fetch homepage Stitch screen** (header/footer are embedded in it)

Reuse screen `585827f530fd4cd89b299d332eb562b3` (already fetched in Task 1).

**Step 2: Compare and refine Header**

Current header at `src/components/layout/Header.tsx` has: sticky, scroll detection, logo, nav links, auth buttons, mobile hamburger.

Check Stitch design for:
- Nav link labels: ensure Buy, Rent, Find Services, Valuations, Advice match (currently Buy, Rent, Sell, Services)
- Button variants: "Sign In" should be ghost, "List Your Property" should be primary (currently "Sign In" ghost, "Get Started" primary)
- Height: 64px desktop, 56px mobile
- Any additional visual details from Stitch

Update nav links and button labels to match Stitch if different.

**Step 3: Compare and refine Footer**

Current footer at `src/components/layout/Footer.tsx` has: 5 columns, social links, back-to-top, copyright.

Check Stitch design for:
- Column labels match britestatestyle.txt spec (Properties, Services, Company, Legal)
- Footer link labels
- Social icon styling
- Bottom bar content

**Step 4: Write E2E tests for navigation**

Create `e2e/navigation.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Header Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows logo and nav links on desktop", async ({ page }) => {
    await expect(page.getByRole("navigation", { name: /Main/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Buy/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Rent/i }).first()).toBeVisible();
  });

  test("shows sign in and get started buttons", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Sign In/i })).toBeVisible();
  });

  test("header becomes sticky with shadow on scroll", async ({ page }) => {
    const header = page.locator("header");
    await page.evaluate(() => window.scrollTo(0, 100));
    await expect(header).toHaveClass(/shadow-sm/);
  });
});

test.describe("Header Mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("shows hamburger menu on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByLabel("Open menu")).toBeVisible();
  });
});

test.describe("Footer", () => {
  test("shows footer sections and links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Discover")).toBeVisible();
    await expect(page.getByText("Services").last()).toBeVisible();
    await expect(page.getByText("Company").last()).toBeVisible();
  });

  test("shows copyright", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Britestate Ltd/)).toBeVisible();
  });
});
```

**Step 5: Verify build**

Run:
```bash
pnpm build 2>&1 | tail -10
```

**Step 6: Run E2E**

Run:
```bash
pnpm test:e2e e2e/navigation.spec.ts
```

**Step 7: Commit**

```bash
git add src/components/layout/Header.tsx src/components/layout/Footer.tsx e2e/navigation.spec.ts
git commit -m "feat(layout): refine Header and Footer from Stitch + add E2E tests"
```

---

## Task 3: Refine Search Page + Create EmptyState

**Files:**
- Modify: `src/components/search/SearchPage.tsx` (visual refinements)
- Create: `src/components/search/SearchEmptyState.tsx`

**Step 1: Fetch Stitch search screens**

Fetch two screens:
- Search: `mcp__stitch__get_screen` with screenId `3d474a72aaa340bd8c1f72bdee771f5c`
- Empty state: `mcp__stitch__get_screen` with screenId `2571b08c4b484e8981b64d6ed11672b6`

**Step 2: Read current SearchPage component**

Read `src/components/search/SearchPage.tsx` and all its sub-components (`SearchBar.tsx`, `SearchFilters.tsx`, `SearchSortBar.tsx`, `SearchResults.tsx`, `PropertyCard.tsx`).

**Step 3: Apply Stitch visual refinements to SearchPage**

Compare Stitch design against current implementation. Focus on:
- Filter panel layout and styling
- Sort bar layout (results count, view toggles)
- Property card grid spacing
- Mobile bottom bar with Map/Filters/Sort buttons

Only change visual aspects — preserve all React Query logic, filter state management, and data fetching.

**Step 4: Create SearchEmptyState component**

Create `src/components/search/SearchEmptyState.tsx`:

```typescript
import { SearchX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SearchEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-neutral-100 mb-6">
        <SearchX className="size-10 text-neutral-400" />
      </div>
      <h2 className="font-heading text-2xl font-bold text-neutral-900 mb-2">
        No properties match your filters
      </h2>
      <p className="text-neutral-500 text-base max-w-md mb-8 leading-relaxed">
        Try adjusting your search criteria to find more results.
      </p>
      <ul className="text-neutral-600 text-sm space-y-2 mb-8 text-left">
        <li>• Try widening your search area</li>
        <li>• Adjust your budget range</li>
        <li>• Remove some filters</li>
      </ul>
      <Button asChild>
        <Link href="/search">Set up an alert for these criteria</Link>
      </Button>
    </div>
  );
}
```

**Step 5: Write component test**

Create `src/__tests__/search/empty-state.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SearchEmptyState } from "@/components/search/SearchEmptyState";

describe("SearchEmptyState", () => {
  it("renders the empty state message", () => {
    render(<SearchEmptyState />);
    expect(screen.getByText("No properties match your filters")).toBeInTheDocument();
  });

  it("shows suggestion bullets", () => {
    render(<SearchEmptyState />);
    expect(screen.getByText(/widening your search area/)).toBeInTheDocument();
    expect(screen.getByText(/Adjust your budget/)).toBeInTheDocument();
  });

  it("shows alert CTA", () => {
    render(<SearchEmptyState />);
    expect(screen.getByRole("link", { name: /alert/i })).toHaveAttribute("href", "/search");
  });
});
```

**Step 6: Write E2E test**

Create `e2e/search.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Search Page", () => {
  test("loads search page", async ({ page }) => {
    await page.goto("/search");
    await expect(page).toHaveTitle(/Search|Properties/i);
  });

  test("shows search results or empty state", async ({ page }) => {
    await page.goto("/search");
    const hasResults = await page.getByText(/properties/i).first().isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/No properties match/i).isVisible().catch(() => false);
    expect(hasResults || hasEmpty).toBe(true);
  });
});
```

**Step 7: Run tests**

```bash
pnpm test --run src/__tests__/search/empty-state.test.tsx
pnpm build 2>&1 | tail -10
```

**Step 8: Commit**

```bash
git add src/components/search/ src/__tests__/search/empty-state.test.tsx e2e/search.spec.ts
git commit -m "feat(search): refine search page from Stitch + add EmptyState component"
```

---

## Task 4: Property Detail + Sub-Components from Stitch

**Files:**
- Modify: `src/components/properties/PropertyDetail.tsx` (visual refinements)
- Create: `src/components/properties/FloorPlan.tsx`
- Create: `src/components/properties/PriceHistory.tsx`
- Create: `src/components/properties/ViewingBooking.tsx`

**Step 1: Fetch Stitch property screens**

Fetch five screens in parallel:
- Property Detail: screenId `6f7cc8cfb97b44ba954ab792ae96427d`
- Gallery/Picture: screenId `0155b1e930e64d4a874b299f5f5b0c25`
- Floor Plan: screenId `7af9653173d245a58fb0ed61c411044f`
- Price History: screenId `5d4dc18f66744770af0b990a34161f90`
- Viewing Booking: screenId `cbe0e5f3ead549dca3b49207399687f1`

**Step 2: Read current PropertyDetail and PropertyGallery**

Read `src/components/properties/PropertyDetail.tsx`, `PropertyGallery.tsx`, and `PropertyFeatures.tsx` to understand existing structure.

**Step 3: Refine PropertyDetail visual layout from Stitch**

Compare the Stitch property detail design with the current implementation. Apply visual refinements:
- 65%/35% main/sidebar layout
- Gallery grid (2+2 layout on desktop)
- Feature grid with property icons
- Agent card in sidebar
- Mobile sticky bottom bar

Preserve all existing Supabase data fetching and typing.

**Step 4: Create FloorPlan component**

Create `src/components/properties/FloorPlan.tsx` — `"use client"`:

```typescript
"use client";

import { useState } from "react";
import Image from "next/image";
import { Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

type FloorPlanProps = Readonly<{
  floors: { label: string; src: string }[];
}>;

export function FloorPlan({ floors }: FloorPlanProps) {
  const [activeFloor, setActiveFloor] = useState(0);

  if (floors.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-xl font-bold text-neutral-900">Floor Plan</h3>

      {floors.length > 1 && (
        <div className="flex gap-2">
          {floors.map((floor, i) => (
            <button
              key={floor.label}
              onClick={() => setActiveFloor(i)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                i === activeFloor
                  ? "bg-brand-primary text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              )}
            >
              {floor.label}
            </button>
          ))}
        </div>
      )}

      <Dialog>
        <DialogTrigger asChild>
          <button className="relative w-full rounded-xl border border-neutral-200 overflow-hidden bg-white group cursor-zoom-in">
            <Image
              src={floors[activeFloor].src}
              alt={`Floor plan - ${floors[activeFloor].label}`}
              width={800}
              height={600}
              className="w-full h-auto object-contain"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <Maximize2 className="size-5 text-neutral-700" />
              </div>
            </div>
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <Image
            src={floors[activeFloor].src}
            alt={`Floor plan - ${floors[activeFloor].label}`}
            width={1200}
            height={900}
            className="w-full h-auto object-contain"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

**Step 5: Create PriceHistory component**

Create `src/components/properties/PriceHistory.tsx` — `"use client"`:

```typescript
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";

type PriceHistoryEntry = {
  date: string;
  price: number;
  event?: string;
};

type PriceHistoryProps = Readonly<{
  history: PriceHistoryEntry[];
}>;

function formatPrice(value: number): string {
  if (value >= 1_000_000) return `£${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `£${(value / 1_000).toFixed(0)}k`;
  return `£${value}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

export function PriceHistory({ history }: PriceHistoryProps) {
  if (history.length === 0) return null;

  const chartData = history.map((h) => ({
    ...h,
    dateLabel: formatDate(h.date),
  }));

  const events = chartData.filter((d) => d.event);

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-xl font-bold text-neutral-900">Price History</h3>
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E8" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 12, fill: "#7A7A88" }}
              tickLine={false}
              axisLine={{ stroke: "#E2E2E8" }}
            />
            <YAxis
              tickFormatter={formatPrice}
              tick={{ fontSize: 12, fill: "#7A7A88" }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip
              formatter={(value: number) => [`£${value.toLocaleString()}`, "Price"]}
              labelFormatter={(label: string) => label}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #E2E2E8",
                boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#1B4D3E"
              strokeWidth={2}
              dot={{ r: 4, fill: "#1B4D3E" }}
              activeDot={{ r: 6, fill: "#2D7A5F" }}
            />
            {events.map((e) => (
              <ReferenceDot
                key={e.date}
                x={e.dateLabel}
                y={e.price}
                r={6}
                fill="#D4A853"
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {events.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-neutral-100">
            {events.map((e) => (
              <div key={e.date} className="flex items-center gap-2 text-sm">
                <div className="size-3 rounded-full bg-brand-secondary" />
                <span className="text-neutral-500">{formatDate(e.date)}:</span>
                <span className="font-medium text-neutral-700">{e.event}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 6: Create ViewingBooking component**

Create `src/components/properties/ViewingBooking.tsx` — `"use client"`:

```typescript
"use client";

import { useState } from "react";
import { Calendar, Clock, Check, User, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ViewingBookingProps = Readonly<{
  agentName: string;
  propertyAddress: string;
}>;

function getNextDays(count: number) {
  const days = [];
  const now = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    days.push({
      date: d.toISOString().split("T")[0],
      dayName: d.toLocaleDateString("en-GB", { weekday: "short" }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString("en-GB", { month: "short" }),
    });
  }
  return days;
}

const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

export function ViewingBooking({ agentName, propertyAddress }: ViewingBookingProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [viewingType, setViewingType] = useState<"in-person" | "virtual">("in-person");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const days = getNextDays(14);

  if (submitted) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center space-y-4">
        <div className="flex justify-center">
          <div className="size-16 rounded-full bg-success-light flex items-center justify-center">
            <Check className="size-8 text-success" />
          </div>
        </div>
        <h3 className="font-heading text-lg font-bold text-neutral-900">Viewing Booked!</h3>
        <p className="text-sm text-neutral-500">
          {viewingType === "in-person" ? "In-person" : "Virtual"} viewing on{" "}
          {days.find((d) => d.date === selectedDate)?.dayName} {days.find((d) => d.date === selectedDate)?.dayNum}{" "}
          {days.find((d) => d.date === selectedDate)?.month} at {selectedTime}
        </p>
        <p className="text-sm text-neutral-500">
          {agentName} will confirm your booking shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-5">
      <h3 className="font-heading text-lg font-bold text-neutral-900 flex items-center gap-2">
        <Calendar className="size-5 text-brand-primary" />
        Book a Viewing
      </h3>

      {/* Viewing type toggle */}
      <div className="flex gap-2">
        {(["in-person", "virtual"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setViewingType(type)}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
              viewingType === type
                ? "bg-brand-primary text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            )}
          >
            {type === "in-person" ? "In-Person" : "Virtual"}
          </button>
        ))}
      </div>

      {/* Date selector */}
      <div>
        <p className="text-sm font-medium text-neutral-700 mb-2">Select a date</p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {days.map((day) => (
            <button
              key={day.date}
              onClick={() => setSelectedDate(day.date)}
              className={cn(
                "flex flex-col items-center min-w-[56px] py-2 px-3 rounded-lg text-sm transition-colors shrink-0",
                selectedDate === day.date
                  ? "bg-brand-primary text-white"
                  : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
              )}
            >
              <span className="text-xs font-medium">{day.dayName}</span>
              <span className="text-lg font-bold">{day.dayNum}</span>
              <span className="text-xs">{day.month}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <p className="text-sm font-medium text-neutral-700 mb-2">Select a time</p>
          <div className="grid grid-cols-4 gap-2">
            {TIME_SLOTS.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={cn(
                  "flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium transition-colors",
                  selectedTime === time
                    ? "bg-brand-primary text-white"
                    : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                )}
              >
                <Clock className="size-3.5" />
                {time}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contact fields */}
      {selectedDate && selectedTime && (
        <div className="space-y-3">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <input
              type="tel"
              placeholder="Your phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Submit */}
      <Button
        className="w-full"
        size="lg"
        disabled={!selectedDate || !selectedTime || !name || !email}
        onClick={() => setSubmitted(true)}
      >
        Book Viewing
      </Button>

      <p className="text-xs text-neutral-400 text-center">
        With {agentName} at {propertyAddress}
      </p>
    </div>
  );
}
```

**Step 7: Write component tests**

Create `src/__tests__/properties/sub-components.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FloorPlan } from "@/components/properties/FloorPlan";
import { PriceHistory } from "@/components/properties/PriceHistory";
import { ViewingBooking } from "@/components/properties/ViewingBooking";

describe("FloorPlan", () => {
  it("renders nothing when no floors", () => {
    const { container } = render(<FloorPlan floors={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders floor plan heading", () => {
    render(<FloorPlan floors={[{ label: "Ground Floor", src: "/floor.jpg" }]} />);
    expect(screen.getByText("Floor Plan")).toBeInTheDocument();
  });

  it("shows floor tabs when multiple floors", () => {
    render(
      <FloorPlan
        floors={[
          { label: "Ground Floor", src: "/g.jpg" },
          { label: "First Floor", src: "/f.jpg" },
        ]}
      />
    );
    expect(screen.getByText("Ground Floor")).toBeInTheDocument();
    expect(screen.getByText("First Floor")).toBeInTheDocument();
  });
});

describe("PriceHistory", () => {
  it("renders nothing when empty", () => {
    const { container } = render(<PriceHistory history={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders heading when data present", () => {
    render(
      <PriceHistory
        history={[{ date: "2025-01-01", price: 400000 }, { date: "2025-06-01", price: 425000 }]}
      />
    );
    expect(screen.getByText("Price History")).toBeInTheDocument();
  });
});

describe("ViewingBooking", () => {
  it("renders booking heading", () => {
    render(<ViewingBooking agentName="James Wilson" propertyAddress="14 Elm Road" />);
    expect(screen.getByText("Book a Viewing")).toBeInTheDocument();
  });

  it("shows in-person and virtual options", () => {
    render(<ViewingBooking agentName="James Wilson" propertyAddress="14 Elm Road" />);
    expect(screen.getByText("In-Person")).toBeInTheDocument();
    expect(screen.getByText("Virtual")).toBeInTheDocument();
  });

  it("shows agent info", () => {
    render(<ViewingBooking agentName="James Wilson" propertyAddress="14 Elm Road" />);
    expect(screen.getByText(/James Wilson/)).toBeInTheDocument();
  });
});
```

**Step 8: Write E2E test**

Create `e2e/property-detail.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Property Detail", () => {
  test("loads property detail page", async ({ page }) => {
    // Navigate to a property — may 404 if no real data, which is expected
    await page.goto("/properties/14-elm-road-isleworth");
    // Either shows the property or a not-found page
    const hasTitle = await page.getByRole("heading", { level: 1 }).isVisible().catch(() => false);
    const hasNotFound = await page.getByText(/not found/i).isVisible().catch(() => false);
    expect(hasTitle || hasNotFound).toBe(true);
  });
});
```

**Step 9: Verify**

```bash
pnpm test --run src/__tests__/properties/sub-components.test.tsx
pnpm build 2>&1 | tail -10
```

**Step 10: Commit**

```bash
git add src/components/properties/ src/__tests__/properties/sub-components.test.tsx e2e/property-detail.spec.ts
git commit -m "feat(properties): add FloorPlan, PriceHistory, ViewingBooking from Stitch + refine detail page"
```

---

## Task 5: Refine Auth Pages + Create Welcome Page

**Files:**
- Modify: `src/app/(auth)/verify-email/page.tsx` (visual refinements from Stitch)
- Modify: `src/app/(auth)/reset-password/page.tsx` (visual refinements from Stitch)
- Create: `src/app/(auth)/welcome/page.tsx`

**Step 1: Fetch Stitch auth screens**

Fetch three screens:
- Verify Email: screenId `cc34494862f94b58b37d309520a748fa`
- Reset Password: screenId `5cbb2e24cc7f41c19d8e7d822ee473a2`
- Welcome: screenId `82993b148a1543439ff6ed1c7695faa0`

**Step 2: Refine verify-email page**

Current implementation at `src/app/(auth)/verify-email/page.tsx` already has real Supabase auth logic. Compare with Stitch and apply any visual refinements — icon size, spacing, button styling. Preserve all `createClient()`, `resend()`, cooldown logic.

**Step 3: Refine reset-password page**

Current implementation uses `ResetPasswordForm` component. Compare Stitch design and refine the page layout. Preserve the form component and its Supabase `updateUser()` logic.

**Step 4: Create welcome page**

Create `src/app/(auth)/welcome/page.tsx`:

```typescript
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Welcome to Britestate",
  description: "Your account is ready. Let's get started.",
};

export default function WelcomePage() {
  return (
    <div className="space-y-8 text-center">
      {/* Success icon */}
      <div className="flex justify-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-success-light">
          <CheckCircle2 className="size-10 text-success" />
        </div>
      </div>

      {/* Welcome message */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Welcome to Britestate!
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Your account is ready. Let&apos;s get started.
        </p>
      </div>

      {/* CTA buttons */}
      <div className="space-y-3">
        <Button asChild className="w-full" size="lg">
          <Link href="/search">
            <Search className="size-4" />
            Start Searching
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full" size="lg">
          <Link href="/services">
            <ShieldCheck className="size-4" />
            Find Professionals
          </Link>
        </Button>
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-neutral-100">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <ShieldCheck className="size-4 text-brand-primary" />
          <span>Verified Listings</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Sparkles className="size-4 text-brand-secondary" />
          <span>AI-Powered Match</span>
        </div>
      </div>
    </div>
  );
}
```

**Step 5: Write E2E tests**

Create `e2e/auth.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Auth Pages", () => {
  test("verify email page renders", async ({ page }) => {
    await page.goto("/verify-email");
    await expect(page.getByText("Check your email")).toBeVisible();
  });

  test("reset password page renders", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByText(/password/i)).toBeVisible();
  });

  test("welcome page renders", async ({ page }) => {
    await page.goto("/welcome");
    await expect(page.getByText("Welcome to Britestate")).toBeVisible();
    await expect(page.getByRole("link", { name: /Start Searching/i })).toHaveAttribute("href", "/search");
  });
});
```

**Step 6: Verify**

```bash
pnpm build 2>&1 | tail -10
```

**Step 7: Commit**

```bash
git add src/app/(auth)/ e2e/auth.spec.ts
git commit -m "feat(auth): refine verify-email/reset-password from Stitch + create welcome page"
```

---

## Task 6: Create Blog Pages from Stitch

**Files:**
- Create: `src/app/(main)/blog/page.tsx`
- Create: `src/app/(main)/blog/[slug]/page.tsx`
- Create: `src/app/(main)/blog/layout.tsx`

**Step 1: Fetch Stitch blog screens**

Fetch two screens:
- Blog Home: screenId `227966d416ca4378bc788d9ea528df8e`
- Blog Post: screenId `90d16c9b74574904a947a32ea8b3fa77`

**Step 2: Create blog layout**

Create `src/app/(main)/blog/layout.tsx`:

```typescript
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-neutral-50">{children}</div>;
}
```

**Step 3: Create blog home page**

Create `src/app/(main)/blog/page.tsx`. Convert Stitch HTML to TSX. Use `MOCK_BLOG_POSTS` from `@/lib/mock-data/blog-posts`. Structure:
- Hero: "Britestate Advice & Insights" heading with search input and category pills
- Featured post: large card (first post)
- Grid: 3-col grid of blog cards (remaining posts)
- Categories: Market Trends, Buying Guide, Sustainability, Advice, Legal, Landlord Tips

Server Component — no `"use client"`.

**Step 4: Create blog post page**

Create `src/app/(main)/blog/[slug]/page.tsx`. Convert Stitch HTML to TSX. Structure:
- Breadcrumbs: Home > Blog > [Category] > [Title]
- Article header: category badge, title (H1), author card, date, read time
- Article body: prose content with proper heading hierarchy
- Sidebar: "Related Articles" (3 cards)
- Bottom: author bio card

Server Component. Use `MOCK_BLOG_POSTS` — find by slug from params or show `notFound()`.

**Step 5: Write E2E tests**

Create `e2e/blog.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Blog", () => {
  test("blog home page loads", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("shows blog post cards", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByText("UK Property Market Forecast")).toBeVisible();
  });

  test("blog post page loads", async ({ page }) => {
    await page.goto("/blog/uk-property-market-forecast-2026");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("UK Property Market");
  });

  test("navigating from blog list to post", async ({ page }) => {
    await page.goto("/blog");
    await page.getByText("UK Property Market Forecast").first().click();
    await expect(page).toHaveURL(/blog\/uk-property-market/);
  });
});
```

**Step 6: Verify**

```bash
pnpm build 2>&1 | tail -10
```

**Step 7: Commit**

```bash
git add src/app/(main)/blog/ e2e/blog.spec.ts
git commit -m "feat(pages): create blog home and post pages from Stitch screens"
```

---

## Task 7: Create Legal Page from Stitch

**Files:**
- Create: `src/app/(main)/legal/page.tsx`

**Step 1: Fetch Stitch legal screen**

Fetch: screenId `6b02d6226ca64637903e8e7d1d1fe607`

**Step 2: Create legal page**

Create `src/app/(main)/legal/page.tsx`. Convert Stitch HTML to TSX. Structure:
- Left sidebar nav: Terms of Service, Privacy Policy, Cookie Policy, Accessibility, Complaints
- Main content area with section headings and prose text
- Anchor links from sidebar to sections
- "Last updated: January 2026" per section

Server Component. Use realistic placeholder legal content with `{/* TODO: real legal text */}` comments.

**Step 3: Write E2E test**

Create `e2e/legal.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Legal Page", () => {
  test("legal page loads", async ({ page }) => {
    await page.goto("/legal");
    await expect(page.getByText("Terms of Service")).toBeVisible();
    await expect(page.getByText("Privacy Policy")).toBeVisible();
  });
});
```

**Step 4: Verify**

```bash
pnpm build 2>&1 | tail -10
```

**Step 5: Commit**

```bash
git add src/app/(main)/legal/ e2e/legal.spec.ts
git commit -m "feat(pages): create legal page from Stitch screen"
```

---

## Task 8: Token Alignment + Final Verification

**Files:** Any file modified in Tasks 1–7

**Step 1: Scan for hardcoded hex colors**

Run:
```bash
grep -rn "#[0-9A-Fa-f]\{3,6\}" src/app src/components --include="*.tsx" | grep -v "node_modules" | grep -v ".test." | grep -v "globals.css"
```

**Step 2: Replace hardcoded values**

For each hit, replace with the appropriate Tailwind class:
- `#1B4D3E` → `bg-brand-primary` / `text-brand-primary`
- `#2D7A5F` → `bg-brand-primary-light`
- `#E8F5EE` → `bg-brand-primary-lighter`
- `#D4A853` → `bg-brand-secondary` / `text-brand-secondary`
- `#2563EB` → `bg-brand-accent` / `text-brand-accent`
- `#F8F8FA` → `bg-neutral-50`
- `#E2E2E8` → `border-neutral-200`
- `#171719` → `text-neutral-900`
- Any other hex → find matching token in `globals.css`

**Step 3: Final build + lint**

Run:
```bash
pnpm build 2>&1 | tail -20
pnpm lint 2>&1 | tail -20
```
Both must exit 0.

**Step 4: Run all Vitest tests**

Run:
```bash
pnpm test --run 2>&1 | tail -30
```
Expected: all tests pass.

**Step 5: Run all Playwright E2E tests**

Run:
```bash
pnpm test:e2e 2>&1 | tail -30
```
Expected: all tests pass.

**Step 6: Final commit**

```bash
git add -u
git commit -m "style: replace hardcoded hex values with Britestate design tokens"
```

---

## Done Criteria

- [ ] `pnpm build` passes with zero errors
- [ ] `pnpm lint` passes with zero warnings
- [ ] `pnpm test --run` passes — all Vitest tests green
- [ ] `pnpm test:e2e` passes — all Playwright tests green
- [ ] Homepage refined from Stitch screen, all 8 sections present
- [ ] Header/Footer refined from Stitch design
- [ ] Search page refined with EmptyState component
- [ ] Property detail page has Gallery, FloorPlan, PriceHistory, ViewingBooking
- [ ] Auth pages (verify-email, reset-password) refined, welcome page created
- [ ] Blog home + blog post pages created from Stitch
- [ ] Legal page created from Stitch
- [ ] No hardcoded hex values in any page/component file
- [ ] All pages use britestatestyle.txt design tokens (fonts, colors, spacing, radii, shadows)
