# Phase 17: Service Provider Public Profiles — Research

**Researched:** 2026-03-13
**Domain:** Next.js App Router SSR public profile pages, Supabase data fetching, JSON-LD structured data, masonry gallery, compare-via-localStorage, ISR SEO pages
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- FAANG design quality bar — every page must match or exceed the Stitch reference HTML files
- All 8 Stitch HTML files saved in `.planning/phases/17-service-provider-public-profiles/stitch/`
- All routes are public — no middleware auth required for these pages
- Server Components everywhere — `"use client"` only for interactive islands (quote modal, tab switching, lightbox)
- SSR + `generateMetadata` — dynamic title/description/OG per provider
- JSON-LD structured data — LocalBusiness + Review schema for SEO
- ISR for SEO category pages — `revalidate: 3600` (1 hour)
- Route structure (locked):
  - `/services/[category]/[slug]` — Tradesperson profile
  - `/agents/[slug]` — Estate agent profile
  - `/mortgage-brokers/[slug]` — Mortgage broker profile
  - `/conveyancers/[slug]` — Conveyancer profile
  - `/surveyors/[slug]` — Surveyor profile
  - `/services/[category]/[location]` — SEO category landing pages
  - `/compare` — Compare providers page
- Design tokens: brand-primary #1B4D3E, brand-secondary #D4A853, action-blue #2563EB
- Fonts: Plus Jakarta Sans 700 headings, Inter 400/500 body
- Shadcn/UI components: Card, Badge, Avatar, Tabs, Dialog, Sheet
- Lucide React icons
- radius-lg (12px) cards, shadow-sm → shadow-md hover

### Claude's Discretion
- Tab active state persistence via URL hash (#reviews, #portfolio, etc.) — enables shareable deep links
- Lazy loading for portfolio images (Intersection Observer)
- Skeleton loaders for each tab panel on initial load
- Mobile: tabs become horizontal scroll strip, sticky below hero on scroll
- Image optimization via `next/image` with blur placeholder

### Deferred Ideas (OUT OF SCOPE)
- Real-time availability booking calendar on tradesperson profile (Phase 16 handles this)
- Video introduction on profiles — v3.7 if needed
- Provider Q&A section — v3.7
- AI-generated profile summary from review sentiment — v3.7
- Comparison history / saved comparisons — v3.7
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROF-01 | Tradesperson public profile page (13.1) — hero, trust badges, tab shell | Stitch HTML + service_provider_details table confirmed |
| PROF-02 | Tradesperson reviews tab (13.2) — paginated, star breakdown, sort, provider response | reviews + provider_rating_stats tables confirmed |
| PROF-03 | Tradesperson portfolio/gallery tab (13.3) — masonry grid, lightbox, category filter | portfolio_urls in service_provider_details; new portfolio_items table needed |
| PROF-04 | Tradesperson services & pricing tab (13.4) — service cards with pricing | pricing JSONB in service_provider_details |
| PROF-05 | Tradesperson request quote modal (13.5) — 3-step, creates RFQ in Supabase | service_requests table and RFQ flow confirmed |
| PROF-06 | Estate agent public profile (13.6) — agency hero, stat bar, tab shell | agent_agency_profiles + property listings tables |
| PROF-07 | Estate agent active listings tab (13.7) — PropertyCard grid, filter, sort | listings table from Phase 2/3 |
| PROF-08 | Estate agent sold/let tab (13.8) — sold grid with price and % of asking | listings with status='sold'/'let' |
| PROF-09 | Estate agent reviews tab (13.9) — same pattern, property-specific context | reviews table with listing join |
| PROF-10 | Estate agent team members tab (13.10) — agent_team_members table | agent_team_members from Phase 15 migration |
| PROF-11 | Estate agent request valuation (13.11) — slide-in form, lead pipeline | agent_leads table from Phase 15 |
| PROF-12 | Mortgage broker public profile (13.12) — FCA badge, specialisms, reviews | service_provider_details + accreditations[] |
| PROF-13 | Conveyancer/solicitor public profile (13.13) — SRA/CLC badge, quoted fees | service_provider_details + pricing JSONB |
| PROF-14 | Surveyor public profile (13.14) — RICS badge, survey types, coverage map | service_provider_details + service_postcodes[] |
</phase_requirements>

---

## Summary

Phase 17 builds 14 fully public (no auth) SSR provider profile pages, plus SEO category landing pages and a compare feature. All data is sourced from the existing Phase 4 marketplace schema in Supabase — specifically `service_provider_details`, `provider_rating_stats`, and `reviews` tables. For estate agent profiles, Phase 15 created `agent_agency_profiles`, `agent_team_members`, `agent_viewing_slots`, and `agent_leads` tables. The research confirms all core data shapes already exist; Phase 17 needs only a targeted migration extension for `provider_portfolio_items` and `provider_leads` tables (for CTA tracking), plus adding `anon` role SELECT policies to several marketplace tables that currently only allow `authenticated` reads.

The current marketplace at `/marketplace/[slug]` already renders a basic `ProviderProfile` component and uses `generateMetadata`. Phase 17 replaces the minimal `/marketplace/[slug]` profile with the full Stitch-quality redesign under new SEO-friendly routes. The masonry grid from Stitch uses pure CSS `column-count`, which is the correct choice — no library needed. The compare feature uses `localStorage` with a custom hook; the compare page at `/compare` reads from localStorage and renders the table. Tab routing should use URL hash (`#reviews`, `#portfolio`) via a client island component.

**Primary recommendation:** Build on the Phase 4 schema that already exists. Add anon-accessible SELECT RLS policies, create one migration for portfolio items and lead capture, then build the 14 pages as Server Components with narrow client islands for modals, lightbox, tabs, and the compare hook.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.1.6 | SSR pages, `generateMetadata`, ISR | Already in stack — `revalidate` export for ISR |
| Supabase JS | 2.x | Server-side DB queries via `createServerClient` | Already established in lib/supabase/server.ts |
| Tailwind CSS v4 | 4.x | All styling via utility classes | Project standard — no CSS modules |
| Shadcn/UI | latest | Tabs, Dialog, Sheet, Badge, Avatar, Card | Already installed in `src/components/ui/` |
| Lucide React | latest | Icons | Project standard — already used throughout |
| next/image | built-in | Optimized images with blur placeholder | Built-in to Next.js — no extra install |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-intersection-observer` | ^9 | Portfolio image lazy loading | For masonry gallery tab only |
| None for masonry | — | CSS `column-count` grid | Stitch uses pure CSS columns — copy exactly |
| None for compare | — | `localStorage` + custom hook | No library needed for max-3 comparison |
| None for lightbox | — | Native `<dialog>` or Shadcn Dialog | Dialog already in ui/ |

**Installation (only new dependency):**
```bash
cd /Users/joanflerinbig/Documents/britv3.0 && pnpm add react-intersection-observer
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/app/(main)/
├── services/
│   ├── [category]/
│   │   ├── [slug]/
│   │   │   ├── page.tsx          # Tradesperson profile (SSR)
│   │   │   ├── generateStaticParams.ts (optional — ISR preferred)
│   │   │   ├── ProfileTabs.tsx   # "use client" tab switcher island
│   │   │   ├── QuoteModal.tsx    # "use client" multi-step modal
│   │   │   └── LightboxGallery.tsx  # "use client" lightbox island
│   │   └── [location]/
│   │       └── page.tsx          # SEO category landing (ISR, revalidate: 3600)
├── agents/
│   └── [slug]/
│       ├── page.tsx              # Estate agent profile (SSR)
│       ├── ProfileTabs.tsx       # "use client" tab switcher
│       └── ValuationSheet.tsx    # "use client" Sheet modal
├── mortgage-brokers/
│   └── [slug]/page.tsx
├── conveyancers/
│   └── [slug]/page.tsx
├── surveyors/
│   └── [slug]/page.tsx
└── compare/
    └── page.tsx                  # "use client" — reads localStorage

src/components/
├── providers/
│   ├── ProviderHero.tsx          # Hero section (Server)
│   ├── TrustBadges.tsx           # Badge row (Server)
│   ├── ProviderSidebar.tsx       # Sticky CTA sidebar (Server)
│   ├── ReviewsTab.tsx            # Paginated reviews list (Server + Suspense)
│   ├── PortfolioTab.tsx          # Masonry gallery (Server frame, client lightbox)
│   ├── ServicesTab.tsx           # Service cards (Server)
│   ├── CompareButton.tsx         # "use client" — adds to localStorage
│   └── StarRatingBreakdown.tsx   # Donut chart / bar chart (Server)
├── agents/
│   ├── AgencyHero.tsx
│   ├── ListingsTab.tsx
│   ├── SoldLetTab.tsx
│   ├── TeamMembersTab.tsx
│   └── ValuationForm.tsx         # "use client"
└── compare/
    ├── CompareTable.tsx           # "use client" — reads localStorage
    └── useCompare.ts              # Custom hook for localStorage state
```

### Pattern 1: Server Component Profile Page with ISR-ready export
**What:** Each profile page is a React Server Component that fetches data directly from Supabase using `createServerClient`. No API route indirection (unlike the existing `/marketplace/[slug]` which calls `/api/providers/[slug]` — this pattern is slower and error-prone).
**When to use:** All 14 profile pages.

```typescript
// Source: Next.js App Router docs — Server Components data fetching
// src/app/(main)/services/[category]/[slug]/page.tsx
import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Params = { params: Promise<{ category: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("service_provider_details")
    .select("business_name, business_description")
    .eq("slug", slug)
    .single();
  if (!data) return { title: "Provider Not Found | Britestate" };
  return {
    title: `${data.business_name} | Britestate`,
    description: data.business_description ?? undefined,
    openGraph: { title: data.business_name, type: "profile" },
  };
}

export default async function TradespersonProfilePage({ params }: Params) {
  const { slug } = await params;
  const supabase = await createServerClient();
  const { data: provider } = await supabase
    .from("service_provider_details")
    .select(`
      *,
      profiles!inner(avatar_url, full_name, provider_verification_status),
      provider_rating_stats(*)
    `)
    .eq("slug", slug)
    .single();
  if (!provider) notFound();
  // render hero + tabs...
}
```

### Pattern 2: ISR for SEO Category Landing Pages
**What:** Use `export const revalidate = 3600` on SEO landing pages. Use `generateStaticParams` to pre-build the most-common category+location combinations from the DB at build time. Unknown combinations fall back to on-demand SSR then cache.

```typescript
// src/app/(main)/services/[category]/[location]/page.tsx
export const revalidate = 3600; // 1 hour ISR

export async function generateStaticParams() {
  const supabase = await createServerClient();
  // Get top location+category combos from provider data
  const { data } = await supabase.rpc("get_seo_category_locations");
  return data?.map(({ category, location }) => ({ category, location })) ?? [];
}
```

### Pattern 3: URL Hash Tab Routing (Client Island)
**What:** A narrow `"use client"` component that reads `window.location.hash` on mount and switches the active tab, then updates the hash on tab change. Server renders the default tab (Overview/About).

```typescript
// src/app/(main)/services/[category]/[slug]/ProfileTabs.tsx
"use client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEffect, useState } from "react";

const TAB_HASH: Record<string, string> = {
  about: "#about",
  services: "#services",
  portfolio: "#portfolio",
  reviews: "#reviews",
};

export function ProfileTabs({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") || "about";
    if (hash in TAB_HASH) setActiveTab(hash);
  }, []);

  function handleTabChange(value: string) {
    setActiveTab(value);
    history.replaceState(null, "", TAB_HASH[value] ?? "#about");
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      {children}
    </Tabs>
  );
}
```

### Pattern 4: Compare via localStorage Hook
**What:** A `"use client"` hook stores up to 3 provider IDs in localStorage. Any page with a provider card shows an "Add to Compare" button. The `/compare` page reads the IDs from localStorage and fetches provider data on mount.

```typescript
// src/components/compare/useCompare.ts
"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY = "britestate_compare";
const MAX_COMPARE = 3;

export function useCompare() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      setIds(stored);
    } catch {
      setIds([]);
    }
  }, []);

  function add(id: string) {
    if (ids.length >= MAX_COMPARE || ids.includes(id)) return;
    const next = [...ids, id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setIds(next);
  }

  function remove(id: string) {
    const next = ids.filter((x) => x !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setIds(next);
  }

  return { ids, add, remove, count: ids.length, isFull: ids.length >= MAX_COMPARE };
}
```

### Pattern 5: JSON-LD Structured Data
**What:** Inject `LocalBusiness` and `Review` schema as a `<script type="application/ld+json">` in the page `<head>` via Next.js `generateMetadata` or directly in the Server Component layout.

```typescript
// Source: schema.org/LocalBusiness + Google Search Central
function buildJsonLd(provider: ServiceProviderDetails, rating: ProviderRatingStats) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": provider.business_name,
    "description": provider.business_description ?? undefined,
    "url": `https://britestate.co.uk/services/${provider.services[0]}/${provider.slug}`,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": rating.average_rating.toFixed(1),
      "reviewCount": rating.total_reviews.toString(),
      "bestRating": "5",
      "worstRating": "1",
    },
  };
}

// In the page Server Component:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(provider, rating)) }}
/>
```

### Pattern 6: CSS Masonry Grid (No Library)
**What:** The Stitch reference uses `column-count: 2; column-gap: 1rem` with `.masonry-item { break-inside: avoid; margin-bottom: 1rem; }`. Replicate exactly with Tailwind v4 arbitrary-value utilities or a `<style>` block in the component.

```tsx
// Masonry gallery — pure CSS, no JS layout library needed
<div className="[column-count:2] [column-gap:1rem] md:[column-count:3]">
  {items.map((item) => (
    <div key={item.id} className="[break-inside:avoid] mb-4">
      <Image ... />
    </div>
  ))}
</div>
```

### Anti-Patterns to Avoid
- **Calling internal API routes from Server Components:** The existing `/marketplace/[slug]` page calls `/api/providers/[slug]`. Do NOT replicate this — call Supabase directly in Server Components with `createServerClient`. This eliminates a network hop and the risk of missing headers.
- **Loading all tab content on page load:** Only render the active tab's data on SSR. Subsequent tab switches fetch via Suspense boundaries or small RSC re-fetches.
- **Fetching provider data in multiple components independently:** Fetch once at the page level, pass as props to child components (prop-drilling or React context is fine for this depth).
- **Using `authenticated` Supabase role for public pages:** Public profile pages must work for unauthenticated visitors. The current RLS on `service_provider_details` uses `TO authenticated` — needs an `anon` policy addition.

---

## Database Schema: What Exists vs What's Needed

### Existing Tables (Phase 4 — `002_marketplace.sql`)

| Table | Key Columns for Phase 17 | Notes |
|-------|--------------------------|-------|
| `service_provider_details` | `slug`, `business_name`, `business_description`, `services[]`, `service_postcodes[]`, `pricing JSONB`, `qualifications[]`, `accreditations[]`, `insurance_details JSONB`, `portfolio_urls[]`, `years_in_business`, `completed_jobs_count`, `response_time_hours` | `portfolio_urls[]` is a flat URL array — insufficient for gallery metadata. Needs extension. |
| `provider_rating_stats` | `average_rating`, `total_reviews`, `count_5_star` through `count_1_star`, `avg_punctuality`, `avg_quality`, `avg_value`, `avg_professionalism` | All data needed for star breakdown donut/bar chart is here. |
| `reviews` | `overall_rating`, `title`, `review_text`, `provider_response`, `helpful_count`, `created_at`, `reviewer_id` | Moderation: only `moderation_status = 'approved'` rows shown. |
| `profiles` | `avatar_url`, `full_name` | Joined to get reviewer display info. |

### Existing Tables (Phase 15 — `agent_dashboard.sql`)

| Table | Key Columns for Phase 17 | Notes |
|-------|--------------------------|-------|
| `agent_agency_profiles` | `agency_name`, `logo_url`, `contact_email`, `contact_phone`, `address_line_1`, `city`, `postcode`, `description`, `specializations[]`, `coverage_areas[]` | All data for agency hero section. |
| `agent_team_members` | `user_id`, `name`, `role`, `status`, `email` | Team members tab needs profile photos — join to `profiles.avatar_url`. |
| `agent_leads` | `stage`, `source`, `contact_name`, `contact_email`, `contact_phone` | Request valuation (13.11) inserts here with `stage='new_enquiry'`. |

### Missing — Needs New Migration

| Need | Table to Create | Key Columns |
|------|----------------|-------------|
| Portfolio gallery metadata | `provider_portfolio_items` | `id`, `provider_id` (FK service_provider_details), `image_url`, `title`, `description`, `category`, `sort_order`, `created_at`. RLS: public SELECT. |
| CTA lead capture (tradespeople) | `provider_leads` | `id`, `provider_id`, `contact_name`, `contact_email`, `contact_phone`, `service_type`, `preferred_date`, `description`, `source TEXT DEFAULT 'profile_page'`, `created_at`. RLS: INSERT for `anon` role, SELECT for provider only. |
| SEO category page data | `seo_category_locations` RPC | Returns `(category, location, provider_count)` tuples for `generateStaticParams`. |

### Critical RLS Fix Needed

The current `service_provider_details` RLS policy is `TO authenticated` — it does NOT allow anonymous visitors to read provider profiles. Phase 17 is explicitly public (no login required). A new migration must add `TO anon` policies:

```sql
-- CRITICAL: Allow anon reads for public profile pages
CREATE POLICY "Anon can view verified provider details"
  ON service_provider_details FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = service_provider_details.user_id
        AND provider_verification_status = 'verified'
        AND deleted_at IS NULL
    )
  );

CREATE POLICY "Anon can view approved reviews"
  ON reviews FOR SELECT TO anon
  USING (moderation_status = 'approved' AND deleted_at IS NULL);

CREATE POLICY "Anon can view rating stats"
  ON provider_rating_stats FOR SELECT TO anon
  USING (TRUE);

CREATE POLICY "Anon can view portfolio items"
  ON provider_portfolio_items FOR SELECT TO anon
  USING (TRUE);

CREATE POLICY "Anon can submit leads"
  ON provider_leads FOR INSERT TO anon
  WITH CHECK (TRUE);
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image optimization | Manual resize/WebP pipeline | `next/image` with `sizes` + `placeholder="blur"` | Built-in to Next.js; handles WebP, lazy loading, blur automatically |
| Star rating display | Custom SVG stars | Existing `RatingStars` component at `src/components/reviews/RatingStars.tsx` | Already exists; reuse it |
| Rating breakdown bars | Custom bar chart | Existing `RatingDistribution` at `src/components/reviews/RatingDistribution.tsx` | Already exists with the data shape from `ProviderRatingStats` |
| Modal dialog | Custom overlay | `<Dialog>` from `src/components/ui/dialog.tsx` | Already installed Shadcn Dialog |
| Slide-in panel (valuation) | Custom CSS panel | `<Sheet>` from `src/components/ui/sheet.tsx` | Already installed Shadcn Sheet |
| Tab navigation | Custom button group | `<Tabs>` from `src/components/ui/tabs.tsx` | Already installed Shadcn Tabs |
| Breadcrumb nav | Custom links | `<Breadcrumb>` from `src/components/ui/breadcrumb.tsx` | Already installed Shadcn Breadcrumb |
| Accordion FAQ | Custom toggle | Wrap with `<details>/<summary>` or add Shadcn Accordion | Simple enough; no new library |
| Masonry grid | JS masonry library (Masonry.js, react-masonry-css) | Pure CSS `column-count` | Stitch uses this; no hydration cost; works perfectly for image galleries |

**Key insight:** The project already has most UI primitives installed. Zero new Shadcn components need installing for Phase 17.

---

## Common Pitfalls

### Pitfall 1: Anon Role Not Allowed by RLS
**What goes wrong:** Pages render a blank profile or throw 400/403 errors for logged-out visitors despite valid slugs.
**Why it happens:** All current `service_provider_details` and `reviews` RLS policies use `TO authenticated`. Anonymous Supabase clients are the `anon` role.
**How to avoid:** Add `TO anon` SELECT policies in the Phase 17 migration (see SQL above). Test with a fresh incognito browser session.
**Warning signs:** Profile page works in dev if you're logged into Supabase dashboard but fails in preview deployment.

### Pitfall 2: URL Hash Tabs Break SSR/Hydration
**What goes wrong:** Tab content flashes or hydration mismatch warnings because `window.location.hash` is only available client-side.
**Why it happens:** Server renders the default tab. Client tries to switch immediately, causing a layout flash.
**How to avoid:** In the `ProfileTabs` client island, only read the hash inside a `useEffect` (after hydration). The initial `useState("about")` default always matches the server-rendered output.
**Warning signs:** React "hydration mismatch" errors in console; tab content jumps on page load.

### Pitfall 3: ISR Category Pages Stale Data
**What goes wrong:** A new provider registers in London plumbers but doesn't appear on `/services/plumbers/london` for up to an hour.
**Why it happens:** `revalidate: 3600` means pages cache for up to 1 hour.
**How to avoid:** This is acceptable for SEO pages. Document clearly in comments. For testing, use `revalidate: 1` in dev.
**Warning signs:** Provider dashboard shows them as active but public page doesn't list them.

### Pitfall 4: Compare Page Hydration Mismatch
**What goes wrong:** Compare page throws "Text content does not match server-rendered HTML" because localStorage is read client-side but `<html>` is server-rendered.
**Why it happens:** Server has no localStorage; it always renders an empty state. Client reads 2 providers. React sees a mismatch.
**How to avoid:** Mark the entire `/compare/page.tsx` as `"use client"` and use `useEffect` to hydrate localStorage state. Do not render compare data on the server.
**Warning signs:** Next.js console error: "Hydration failed because the initial UI does not match."

### Pitfall 5: Missing `generateStaticParams` for ISR
**What goes wrong:** ISR revalidation works but the page is never pre-built, so the first visitor to `/services/plumbers/london` gets a slow cold render.
**Why it happens:** `revalidate` without `generateStaticParams` means all pages are on-demand SSR initially.
**How to avoid:** Implement `generateStaticParams` to pre-build the top ~50 most-common category+location combos at build time.

### Pitfall 6: Estate Agent Profile Missing Data
**What goes wrong:** Agent profile hero stat bar (active listings count, avg days to sell) is empty because no listings data is joined.
**Why it happens:** `agent_agency_profiles` doesn't store computed stats — these must be calculated from the `listings` table (Phase 2/3) filtered by agent.
**How to avoid:** Create an RPC function `get_agent_public_stats(agent_slug TEXT)` that returns computed stats in one query.

### Pitfall 7: Portfolio URLs Array Insufficient for Gallery
**What goes wrong:** `portfolio_urls TEXT[]` in `service_provider_details` only stores URLs — no title, description, category, or sort order. Portfolio tab has no structured metadata to display.
**Why it happens:** Phase 4 stored portfolios as a flat URL array for simplicity.
**How to avoid:** Create `provider_portfolio_items` table in the Phase 17 migration.

---

## Code Examples

### Fetch Provider with Rating Stats (Direct Supabase — No API Route)
```typescript
// Source: Supabase JS v2 docs — select with joins
const { data: provider, error } = await supabase
  .from("service_provider_details")
  .select(`
    *,
    profiles!inner(
      id,
      avatar_url,
      full_name,
      provider_verification_status
    ),
    provider_rating_stats(
      average_rating,
      total_reviews,
      count_5_star,
      count_4_star,
      count_3_star,
      count_2_star,
      count_1_star,
      avg_punctuality,
      avg_quality,
      avg_value,
      avg_professionalism
    )
  `)
  .eq("slug", slug)
  .eq("profiles.provider_verification_status", "verified")
  .single();

if (error || !provider) notFound();
```

### Fetch Paginated Reviews
```typescript
// Paginated reviews with reviewer info
const { data: reviews } = await supabase
  .from("reviews")
  .select(`
    id, overall_rating, title, review_text,
    provider_response, provider_response_at,
    helpful_count, created_at,
    profiles!reviewer_id(full_name, avatar_url)
  `)
  .eq("provider_id", provider.user_id)
  .eq("moderation_status", "approved")
  .is("deleted_at", null)
  .order("created_at", { ascending: false })
  .range(offset, offset + PAGE_SIZE - 1);
```

### JSON-LD Output Pattern
```typescript
// In a Server Component — no hydration cost
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": provider.business_name,
  "url": `https://britestate.co.uk/services/${category}/${slug}`,
  "aggregateRating": ratingStats ? {
    "@type": "AggregateRating",
    "ratingValue": ratingStats.average_rating.toFixed(1),
    "reviewCount": String(ratingStats.total_reviews),
    "bestRating": "5",
    "worstRating": "1",
  } : undefined,
};

// In the page JSX:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

### ServiceCategory to URL Slug Mapping
```typescript
// Maps DB enum values to URL segments
export const CATEGORY_SLUGS: Record<ServiceCategory, string> = {
  plumber: "plumbers",
  electrician: "electricians",
  handyman: "handymen",
  landscaping: "landscaping",
  interior_design: "interior-designers",
  architect: "architects",
  cleaning: "cleaning",
  pest_control: "pest-control",
  locksmith: "locksmiths",
  property_management: "property-management",
  home_inspector: "home-inspectors",
  moving_company: "removal-companies",
  conveyancing: "conveyancers",
  surveying: "surveyors",
  mortgage_broker: "mortgage-brokers",
  other: "other",
};

// Reverse map for DB lookup from URL param
export const SLUG_TO_CATEGORY = Object.fromEntries(
  Object.entries(CATEGORY_SLUGS).map(([k, v]) => [v, k])
) as Record<string, ServiceCategory>;
```

### Trust Badge Component (Verified Badge Logic)
```typescript
// Badge types map to accreditations[] field in service_provider_details
type BadgeType = "gas_safe" | "niceic" | "fca" | "rics" | "sra" | "clc" | "insured" | "britestate_verified";

const BADGE_CONFIG: Record<BadgeType, {
  label: string;
  color: string;
  icon: string; // Lucide icon name
}> = {
  britestate_verified: { label: "Britestate Verified", color: "bg-[#1B4D3E]", icon: "ShieldCheck" },
  gas_safe: { label: "Gas Safe", color: "bg-orange-600", icon: "Flame" },
  niceic: { label: "NICEIC", color: "bg-orange-500", icon: "Zap" },
  fca: { label: "FCA Regulated", color: "bg-navy-800", icon: "BadgeCheck" },
  rics: { label: "RICS Member", color: "bg-[#1B4D3E]", icon: "Building" },
  sra: { label: "SRA Regulated", color: "bg-blue-700", icon: "Scale" },
  clc: { label: "CLC Regulated", color: "bg-blue-600", icon: "Scale" },
  insured: { label: "Insured", color: "bg-green-600", icon: "ShieldCheck" },
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Calling API route from Server Component | Direct Supabase query in Server Component | Next.js 13+ | Eliminates network hop; simpler error handling |
| `getServerSideProps` | Server Components + `generateMetadata` | Next.js 13 App Router | Per-page metadata without extra data fetch |
| JS masonry libraries (Masonry.js) | CSS `column-count` | CSS3 support widespread ~2018 | Zero JS cost, no hydration, works immediately |
| `window.location.hash` router | URL hash read in `useEffect` after hydration | React 18 | Avoids hydration mismatch |
| ISR with `getStaticProps + revalidate` | `export const revalidate = N` in Server Components | Next.js 13 App Router | File-level export, no extra function |

**Deprecated/outdated in this project:**
- The existing `/marketplace/[slug]` fetch pattern (calls internal API) — Phase 17 should NOT replicate this. Use direct Supabase client.
- `portfolio_urls TEXT[]` — insufficient for gallery; superceded by `provider_portfolio_items` table in Phase 17 migration.

---

## Open Questions

1. **Estate agent "active listings" data source**
   - What we know: `agent_agency_profiles` stores agency info but not listings. Listings live in the `listings` table (Phase 2/3 migration).
   - What's unclear: The `listings` table FK to agent — is it via `agent_id` column or via the `user_id` of the listing creator? Need to verify `003_property_portal.sql` column names.
   - Recommendation: Check `003_property_portal.sql` before building the listings tab. Create an RPC `get_agent_public_stats(slug TEXT)` to avoid complex joins in the Server Component.

2. **"Sold/Let" properties data**
   - What we know: Properties likely have a `status` field indicating sold/let.
   - What's unclear: Whether sold price and original asking price are stored separately, or only the current price.
   - Recommendation: Review the listings table schema; if sold price isn't stored, the sold/let tab shows listing price with "Sale Agreed" status only.

3. **Specialist profiles (Mortgage Broker, Conveyancer, Surveyor) — separate entity or service_provider_details**
   - What we know: These categories exist as `service_category` enum values (`mortgage_broker`, `conveyancing`, `surveying`). All three are stored in `service_provider_details` using the same table.
   - What's unclear: FCA registration number, SRA number, RICS membership number — are these stored in `accreditations[]` as plain strings or in `insurance_details JSONB`?
   - Recommendation: Treat `accreditations[]` as the source for regulatory registration numbers. Define a convention: `["FCA:FRN123456", "RICS:member"]`. Add a migration to add a `regulatory_registrations JSONB` column if the string array is insufficient for expiry dates.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.x + happy-dom |
| Config file | `vitest.config.mts` |
| Quick run command | `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm test --run` |
| Full suite command | `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROF-01 | Tradesperson profile hero renders name, rating, badges | unit | `pnpm test --run src/__tests__/providers/TradespersonProfile.test.tsx` | ❌ Wave 0 |
| PROF-02 | Reviews tab renders paginated approved reviews, skips rejected | unit | `pnpm test --run src/__tests__/providers/ReviewsTab.test.tsx` | ❌ Wave 0 |
| PROF-03 | Portfolio tab renders masonry items from provider_portfolio_items | unit | `pnpm test --run src/__tests__/providers/PortfolioTab.test.tsx` | ❌ Wave 0 |
| PROF-04 | Services tab renders service cards with pricing from JSONB | unit | `pnpm test --run src/__tests__/providers/ServicesTab.test.tsx` | ❌ Wave 0 |
| PROF-05 | Quote modal form submits RFQ with correct service_category | unit | `pnpm test --run src/__tests__/providers/QuoteModal.test.tsx` | ❌ Wave 0 |
| PROF-06 | Agency profile hero renders stat bar values | unit | `pnpm test --run src/__tests__/agents/AgencyProfile.test.tsx` | ❌ Wave 0 |
| PROF-07–08 | Listings/Sold tabs render PropertyCard components | unit | `pnpm test --run src/__tests__/agents/ListingsTab.test.tsx` | ❌ Wave 0 |
| PROF-09–10 | Agent reviews + team tabs render correctly | unit | included in AgencyProfile.test.tsx | ❌ Wave 0 |
| PROF-11 | Valuation form submits lead to agent_leads table | unit | `pnpm test --run src/__tests__/agents/ValuationForm.test.tsx` | ❌ Wave 0 |
| PROF-12–14 | Specialist profile pages render regulatory badges | unit | `pnpm test --run src/__tests__/providers/SpecialistProfile.test.tsx` | ❌ Wave 0 |
| PROF-01–14 | Compare: useCompare hook adds/removes up to 3 IDs in localStorage | unit | `pnpm test --run src/__tests__/compare/useCompare.test.ts` | ❌ Wave 0 |
| PROF-01–14 | JSON-LD output contains correct schema.org fields | unit | `pnpm test --run src/__tests__/providers/jsonld.test.ts` | ❌ Wave 0 |
| PROF-01 | URL hash tab persistence — switching tab updates hash | unit | included in TradespersonProfile.test.tsx | ❌ Wave 0 |
| PROF-01–14 | `generateMetadata` returns provider name in title | unit | `pnpm test --run src/__tests__/providers/metadata.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm test --run`
- **Per wave merge:** `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm test && pnpm build`
- **Phase gate:** Full suite green + `pnpm build` succeeds before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/providers/TradespersonProfile.test.tsx` — covers PROF-01
- [ ] `src/__tests__/providers/ReviewsTab.test.tsx` — covers PROF-02
- [ ] `src/__tests__/providers/PortfolioTab.test.tsx` — covers PROF-03
- [ ] `src/__tests__/providers/ServicesTab.test.tsx` — covers PROF-04
- [ ] `src/__tests__/providers/QuoteModal.test.tsx` — covers PROF-05
- [ ] `src/__tests__/agents/AgencyProfile.test.tsx` — covers PROF-06, PROF-09, PROF-10
- [ ] `src/__tests__/agents/ListingsTab.test.tsx` — covers PROF-07, PROF-08
- [ ] `src/__tests__/agents/ValuationForm.test.tsx` — covers PROF-11
- [ ] `src/__tests__/providers/SpecialistProfile.test.tsx` — covers PROF-12, PROF-13, PROF-14
- [ ] `src/__tests__/compare/useCompare.test.ts` — covers compare hook
- [ ] `src/__tests__/providers/jsonld.test.ts` — covers JSON-LD output
- [ ] `src/__tests__/providers/metadata.test.ts` — covers generateMetadata

---

## Sources

### Primary (HIGH confidence)
- Codebase: `supabase/migrations/002_marketplace.sql` — complete Phase 4 schema including all tables, RLS policies, and `search_providers` RPC
- Codebase: `src/types/marketplace.ts` — TypeScript shapes confirmed matching SQL exactly
- Codebase: `.planning/phases/15-estate-agent-dashboard/15-01-PLAN.md` — confirmed `agent_agency_profiles`, `agent_team_members`, `agent_leads` tables from Phase 15
- Codebase: `src/components/ui/` — confirmed Shadcn Tabs, Dialog, Sheet, Badge, Avatar, Card are all installed
- Codebase: `src/components/reviews/RatingStars.tsx`, `RatingDistribution.tsx`, `ReviewsList.tsx` — confirmed existing review components to reuse
- Codebase: `vitest.config.mts` — confirmed Vitest test framework with happy-dom environment
- Stitch files: All 6 HTML reference files read — confirmed CSS masonry pattern, tab navigation pattern, compare table pattern, localized page structure

### Secondary (MEDIUM confidence)
- Next.js App Router docs (training data, Aug 2025) — `generateMetadata`, `revalidate` export, Server Components data fetching patterns
- Supabase RLS anon role behavior (training data) — anon vs authenticated role policies

### Tertiary (LOW confidence)
- `get_seo_category_locations` RPC function — does not yet exist; needs creation in Phase 17 migration
- Estate agent listings tab data — depends on `003_property_portal.sql` schema not yet read

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from existing codebase
- Database schema: HIGH — migrations read directly
- Architecture patterns: HIGH — established by existing code and Stitch reference
- RLS anon policy gap: HIGH — confirmed by reading actual RLS policy SQL
- Estate agent listings data model: MEDIUM — listings table schema not fully inspected
- Specialist profile regulatory fields: MEDIUM — `accreditations[]` exists but schema for FCA/RICS numbers needs convention decision

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable stack; 30-day validity)
