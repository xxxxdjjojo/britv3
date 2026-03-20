# QA Bugfix Sweep — 17 Bugs, 4 Waves

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 17 bugs identified in the 2026-03-20 QA report, restoring health score from 28/100 to 80+.

**Architecture:** Fixes are organized into 4 dependency-ordered waves. Wave 1 (P0 ship-stoppers) unblocks all dashboards. Wave 2 (P1) fixes high-impact UX. Wave 3 (P2) addresses medium-priority issues. Wave 4 (P3) polishes low-priority items. Each task is TDD: write failing test, implement fix, verify.

**Tech Stack:** Next.js 16, Supabase (PostgreSQL), TypeScript, Vitest, React Testing Library

**QA Report:** `.gstack/qa-reports/qa-report-localhost-2026-03-20.md`

---

## Root Cause Summary

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| 001 | DB `document_category` enum missing `electrical_eicr`; `getHealthScore()` RPC throws; error is unhandled | Add enum value via migration + wrap `getHealthScore` in try/catch with graceful fallback |
| 002 | Test user Emma has `profiles.active_role = 'landlord'` instead of `'homebuyer'` | Fix seed data + harden role assignment on signup |
| 003 | No property/listing seed data in DB; search uses mock frontend data but detail page queries real DB | Create property seed migration with matching slugs |
| 004 | Auth pages crash during hydration when authenticated; middleware redirect races with client render | Add server-side auth check in `(auth)/layout.tsx` that redirects before children render |
| 005 | Login error for admin user returns 400 but `handleSupabaseError` maps it correctly — error IS shown but admin user may not exist in test DB | Verify admin test user exists; add explicit 400-status handling |
| 006 | `NEXT_PUBLIC_MAPTILER_API_KEY` env var missing/empty; `SearchMap` constructs malformed tile URL | Add env var guard with user-facing "Map unavailable" fallback |
| 007 | `LandlordSidebar` wraps `<Button>` inside `<SheetTrigger asChild>` creating nested `<button>` | Remove outer `<Button>`, use plain element or pass `asChild` correctly |
| 008+012 | Settings sidebar tab labeled "Profile" but links to `/settings/account`; no "Account" label | Rename label from "Profile" to "Account" |
| 009 | `mustHaves` initial state always includes "Chain Free" even for rent; rendering is correct but state leaks | Reset mustHaves when listing type changes to rent |
| 014 | Search result LCP image missing `loading="eager"` and `priority` | Add `priority` prop to first PropertyCard image |
| 016 | CSS `scroll-behavior: smooth` on `<html>` triggers Next.js warning | Add `data-scroll-behavior="smooth"` to `<html>` element |
| 017 | 404 page hardcodes "Sign In" button; doesn't check auth state | Use shared `Header` component or check auth server-side |

---

## File Map

| File | Action | Tasks |
|------|--------|-------|
| `supabase/migrations/20260320000001_qa_enum_fix.sql` | Create | 1 |
| `supabase/migrations/20260320000002_property_seed_data.sql` | Create | 3 |
| `src/services/landlord/portfolio-service.ts` | Modify (lines 159-193) | 1 |
| `src/app/(auth)/layout.tsx` | Modify (add auth redirect) | 4 |
| `src/app/(protected)/dashboard/landlord/page.tsx` | Modify (error handling) | 1 |
| `src/components/landlord/LandlordSidebar.tsx` | Modify (line 117-118) | 7 |
| `src/app/(protected)/settings/layout.tsx` | Modify (line 36) | 8 |
| `src/app/(main)/search/page.tsx` | Modify (lines 301-348) | 9 |
| `src/components/search/PropertyCard.tsx` | Modify (line 80-86) | 10 |
| `src/components/search/SearchMap.tsx` | Modify (lines 53-54) | 6 |
| `src/app/layout.tsx` | Modify (line 44) | 12 |
| `src/app/globals.css` | Modify (line 227-229) | 12 |
| `src/app/not-found.tsx` | Modify (lines 14-36) | 13 |
| `src/components/shared/PropertyCardGrid.tsx` | Modify (line 26) | 3 |

---

## Wave 1: Ship-Stoppers (P0) — Unblock All Dashboards

### Task 1: Fix `electrical_eicr` Enum + Defensive Health Score [ISSUE-001]

**Context:** The `get_landlord_health_score` RPC filters by `'electrical_eicr'` in the `document_category` enum, but this value doesn't exist in the DB. The existing migration `20260320000000_qa_bugfixes.sql` tries to add it but `ALTER TYPE ADD VALUE` can't run inside a transaction block on some PostgreSQL versions. Additionally, `getHealthScore()` in `portfolio-service.ts` throws unhandled — crashing the entire dashboard.

**Files:**
- Create: `supabase/migrations/20260320000001_qa_enum_fix.sql`
- Modify: `src/services/landlord/portfolio-service.ts:159-193`
- Create: `src/services/landlord/__tests__/portfolio-service.test.ts`

- [ ] **Step 1: Write failing test for graceful health score fallback**

```typescript
// src/services/landlord/__tests__/portfolio-service.test.ts
import { describe, it, expect, vi } from "vitest";

// We test that getHealthScore returns a safe default when the RPC fails,
// rather than throwing and crashing the dashboard.

describe("getHealthScore", () => {
  it("returns zero-score fallback when RPC throws an error", async () => {
    // Mock supabase client where rpc() returns an error
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "test-user-id" } },
          error: null,
        }),
      },
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'invalid input value for enum document_category: "electrical_eicr"' },
      }),
    };

    // Dynamic import to avoid module caching issues
    const { getHealthScore } = await import("@/services/landlord/portfolio-service");
    const result = await getHealthScore(mockSupabase as any);

    expect(result).toEqual({
      total_score: 0,
      compliance_score: 0,
      compliance_max: 40,
      rent_score: 0,
      rent_max: 30,
      maintenance_score: 0,
      maintenance_max: 20,
      deposit_score: 0,
      deposit_max: 10,
      weakest_area: "compliance",
    });
  });

  it("returns actual score when RPC succeeds", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "test-user-id" } },
          error: null,
        }),
      },
      rpc: vi.fn().mockResolvedValue({
        data: [{
          total_score: 85,
          compliance_score: 35,
          rent_score: 25,
          maintenance_score: 18,
          deposit_score: 7,
          weakest_area: "deposit",
        }],
        error: null,
      }),
    };

    const { getHealthScore } = await import("@/services/landlord/portfolio-service");
    const result = await getHealthScore(mockSupabase as any);

    expect(result.total_score).toBe(85);
    expect(result.weakest_area).toBe("deposit");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd britv3.0 && pnpm vitest run src/services/landlord/__tests__/portfolio-service.test.ts`
Expected: FAIL — first test fails because `getHealthScore` currently throws on RPC error.

- [ ] **Step 3: Create the SQL migration to add the enum value**

```sql
-- supabase/migrations/20260320000001_qa_enum_fix.sql
-- Fix: Ensure 'electrical_eicr' exists in document_category enum.
-- This uses a standalone statement outside DO blocks because
-- ADD VALUE cannot run inside a transaction in PostgreSQL < 16.
-- Supabase runs each migration as a single transaction, so we use
-- the IF NOT EXISTS variant which is safe in PG 12+.

ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'electrical_eicr';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'inspection_report';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'receipt';
```

- [ ] **Step 4: Make `getHealthScore` return safe fallback instead of throwing**

Modify `src/services/landlord/portfolio-service.ts` lines 159-193:

```typescript
const HEALTH_SCORE_FALLBACK: HealthScore = {
  total_score: 0,
  compliance_score: 0,
  compliance_max: 40,
  rent_score: 0,
  rent_max: 30,
  maintenance_score: 0,
  maintenance_max: 20,
  deposit_score: 0,
  deposit_max: 10,
  weakest_area: "compliance",
};

export async function getHealthScore(
  supabase: SupabaseClient,
): Promise<HealthScore> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return HEALTH_SCORE_FALLBACK;
  }

  const { data, error } = await supabase.rpc("get_landlord_health_score", {
    p_landlord_id: user.id,
  });

  if (error) {
    console.error("[getHealthScore] RPC failed:", error.message);
    return HEALTH_SCORE_FALLBACK;
  }

  const result = Array.isArray(data) ? data[0] : data;

  return {
    total_score: Number(result?.total_score ?? 0),
    compliance_score: Number(result?.compliance_score ?? 0),
    compliance_max: 40,
    rent_score: Number(result?.rent_score ?? 0),
    rent_max: 30,
    maintenance_score: Number(result?.maintenance_score ?? 0),
    maintenance_max: 20,
    deposit_score: Number(result?.deposit_score ?? 0),
    deposit_max: 10,
    weakest_area: result?.weakest_area ?? "compliance",
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd britv3.0 && pnpm vitest run src/services/landlord/__tests__/portfolio-service.test.ts`
Expected: PASS — both tests green.

- [ ] **Step 6: Apply the migration to the database**

Run: `cd britv3.0 && npx supabase migration up` (or apply via Supabase dashboard)

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20260320000001_qa_enum_fix.sql \
  src/services/landlord/portfolio-service.ts \
  src/services/landlord/__tests__/portfolio-service.test.ts
git commit -m "fix(dashboard): add missing enum values + defensive health score fallback

Resolves ISSUE-001: All 6 dashboards crashed because 'electrical_eicr'
was missing from the document_category PostgreSQL enum. The RPC
get_landlord_health_score now returns a zero fallback on error instead
of throwing, preventing unhandled exceptions in the dashboard."
```

---

### Task 2: Fix Test User Role Data [ISSUE-002]

**Context:** Emma Thompson (homebuyer) has `profiles.active_role = 'landlord'` in the DB. This causes her to be routed to `/dashboard/landlord` instead of `/dashboard/homebuyer`. The redirect chain is correct — the data is wrong. This also causes ISSUE-013 (dashboard header link shows wrong dashboard). Fix: create a migration that corrects Emma's role, and ensure the default role assignment works.

**Files:**
- Create: `supabase/migrations/20260320000003_fix_test_user_roles.sql`

- [ ] **Step 1: Create migration to fix Emma's role**

```sql
-- supabase/migrations/20260320000003_fix_test_user_roles.sql
-- Fix ISSUE-002: Emma Thompson's active_role was incorrectly set to 'landlord'.
-- Also ensures all test homebuyer users have the correct active_role.

-- Fix Emma specifically
UPDATE profiles
SET active_role = 'homebuyer'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'emma.thompson@test.britestate.co.uk'
)
AND active_role != 'homebuyer';

-- Ensure the homebuyer role exists in user_roles for Emma
INSERT INTO user_roles (user_id, role)
SELECT u.id, 'homebuyer'
FROM auth.users u
WHERE u.email = 'emma.thompson@test.britestate.co.uk'
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role = 'homebuyer'
);
```

- [ ] **Step 2: Apply migration**

Run: `cd britv3.0 && npx supabase migration up`

- [ ] **Step 3: Verify Emma routes to homebuyer dashboard**

Login as emma.thompson@test.britestate.co.uk → should redirect to `/dashboard/homebuyer`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260320000003_fix_test_user_roles.sql
git commit -m "fix(auth): correct Emma's active_role from landlord to homebuyer

Resolves ISSUE-002: Homebuyer Emma was routed to /dashboard/landlord
because profiles.active_role was incorrectly set. Also resolves
ISSUE-013 (dashboard header link) as a cascading fix."
```

---

### Task 3: Fix Auth Page Crash for Authenticated Users [ISSUE-004]

**Context:** Middleware at line 195 correctly tries to redirect authenticated users away from auth pages, but client components hydrate and throw before the redirect completes. Fix: add server-side auth check in `(auth)/layout.tsx` that redirects before rendering children. This is a server component, so `redirect()` from `next/navigation` runs server-side and prevents any client rendering.

**Files:**
- Modify: `src/app/(auth)/layout.tsx`

- [ ] **Step 1: Add server-side auth check to auth layout**

Replace `src/app/(auth)/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RightPanelContent } from "@/components/auth/RightPanelContent";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // Server-side auth check: redirect authenticated users to dashboard
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — 44% on desktop, full width on mobile */}
      <div className="flex w-full flex-col justify-center px-6 py-12 md:w-[44%] md:px-12 lg:px-16">
        {/* Logo */}
        <Link href="/" className="mb-10 flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-brand-primary">
            <span className="font-heading text-base font-bold text-white">B</span>
          </div>
          <span className="font-heading text-xl font-bold text-neutral-900">
            Britestate
          </span>
        </Link>

        {/* Page content */}
        <div className="w-full max-w-[420px]">{children}</div>
      </div>

      {/* Right panel — 56% on desktop only */}
      <div className="hidden md:block md:w-[56%]">
        <RightPanelContent />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd britv3.0 && pnpm vitest run src/app/\\(auth\\)/__tests__/layout.test.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/layout.tsx
git commit -m "fix(auth): redirect authenticated users away from login/register pages

Resolves ISSUE-004: /login, /register, /forgot-password crashed when
user was already authenticated. Added server-side auth check in auth
layout that redirects to /dashboard before any client components render."
```

---

### Task 4: Create Property Seed Data [ISSUE-003]

**Context:** Search page uses hardcoded `MOCK_PROPERTIES` in `src/app/(main)/search/page.tsx` (lines 75-84), but the property detail page at `src/app/(main)/properties/[slug]/page.tsx` queries the real `listings` table via `getPropertyBySlug()`. The DB has zero properties/listings. Fix: create seed data matching the mock slugs. Also fix `PropertyCardGrid` which links by `id` instead of `slug`.

**Files:**
- Create: `supabase/migrations/20260320000002_property_seed_data.sql`
- Modify: `src/components/shared/PropertyCardGrid.tsx:26`

- [ ] **Step 1: Write test for PropertyCardGrid using slug links**

```typescript
// src/components/shared/__tests__/PropertyCardGrid.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PropertyCardGrid } from "@/components/shared/PropertyCardGrid";

const MOCK = [
  { id: 1, price: "£450,000", title: "Test Home", location: "London", beds: 3, baths: 2, rating: 4.5, match: 92, image: "/test.jpg", alt: "Test", slug: "test-home-london-sale" },
] as const;

describe("PropertyCardGrid", () => {
  it("links to /properties/[slug] not /properties/[id]", () => {
    render(<PropertyCardGrid properties={MOCK as any} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/properties/test-home-london-sale");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd britv3.0 && pnpm vitest run src/components/shared/__tests__/PropertyCardGrid.test.tsx`
Expected: FAIL — link currently uses `property.id` (numeric).

- [ ] **Step 3: Fix PropertyCardGrid to use slug**

Modify `src/components/shared/PropertyCardGrid.tsx` line 8 (add `slug` to type) and line 26:

Add `slug: string;` to the Property type.
Change line 26 from:
```tsx
href={`/properties/${property.id}`}
```
to:
```tsx
href={`/properties/${property.slug}`}
```

Also update the homepage or wherever `PropertyCardGrid` is called to pass `slug` prop.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd britv3.0 && pnpm vitest run src/components/shared/__tests__/PropertyCardGrid.test.tsx`
Expected: PASS

- [ ] **Step 5: Create property seed migration**

Schema reference (from `003_property_portal.sql`):
- `properties` has: `id UUID PK`, `address_line1`, `city`, `county`, `postcode`, `coordinates GEOGRAPHY`, `property_type` (enum: detached/semi_detached/terraced/flat/etc), `bedrooms INT`, `bathrooms NUMERIC(3,1)`, `reception_rooms INT`, `square_footage INT`, `title TEXT NOT NULL`, `description TEXT NOT NULL`, `features JSONB`, `epc_rating CHAR(1)`, `tenure`, `new_build BOOLEAN`
- `listings` has: `id UUID PK`, `property_id UUID FK→properties`, `user_id UUID FK→auth.users`, `listing_type` (enum: sale/rent), `status` (enum: draft/active/etc), `price NUMERIC(12,2)`, `rent_frequency TEXT` (required for rent), `slug TEXT UNIQUE` (auto-generated by trigger from address+city+listing_type)
- `property_media` has: `id UUID PK`, `listing_id UUID FK→listings`, `media_type` (enum: image/floor_plan/epc_document), `url TEXT`, `sort_order INT`
- Slug trigger `trg_generate_listing_slug` auto-generates slug on INSERT, so we omit slug from INSERT.

```sql
-- supabase/migrations/20260320000002_property_seed_data.sql
-- Seed: 5 buy + 2 rent properties so property detail pages resolve.
-- Slugs are auto-generated by the trg_generate_listing_slug trigger.

DO $$
DECLARE
  v_user_id UUID;
  v_prop_id UUID;
  v_listing_id UUID;
BEGIN
  -- Use the first user as property owner (listings.user_id is required FK)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No users found, skipping property seed';
    RETURN;
  END IF;

  -- Property 1: 12 Kensington Gardens, London (Sale)
  -- Expected slug: 12-kensington-gardens-london-sale
  IF NOT EXISTS (SELECT 1 FROM properties WHERE address_line1 = '12 Kensington Gardens' AND city = 'London') THEN
    INSERT INTO properties (address_line1, city, county, postcode, property_type, bedrooms, bathrooms, reception_rooms, square_footage, title, description, epc_rating, tenure, new_build, coordinates)
    VALUES ('12 Kensington Gardens', 'London', 'Greater London', 'W8 4QU', 'detached', 4, 3.0, 2, 2800,
      'Stunning 4-Bed Victorian in Kensington',
      'A beautifully restored Victorian property with period features, modern kitchen, and private garden. Close to Kensington Palace and Hyde Park.',
      'B', 'freehold', false, ST_SetSRID(ST_MakePoint(-0.1278, 51.5074), 4326)::geography)
    RETURNING id INTO v_prop_id;

    INSERT INTO listings (property_id, user_id, listing_type, status, price)
    VALUES (v_prop_id, v_user_id, 'sale', 'active', 1250000)
    RETURNING id INTO v_listing_id;

    INSERT INTO property_media (listing_id, media_type, url, sort_order)
    VALUES (v_listing_id, 'image', '/images/properties/property-1.jpg', 0);
  END IF;

  -- Property 2: 8 Primrose Hill Road, London (Sale)
  IF NOT EXISTS (SELECT 1 FROM properties WHERE address_line1 = '8 Primrose Hill Road' AND city = 'London') THEN
    INSERT INTO properties (address_line1, city, county, postcode, property_type, bedrooms, bathrooms, reception_rooms, square_footage, title, description, epc_rating, tenure, new_build, coordinates)
    VALUES ('8 Primrose Hill Road', 'London', 'Greater London', 'NW1 8YD', 'semi_detached', 3, 2.0, 1, 1800,
      'Charming 3-Bed Semi in Primrose Hill',
      'Light-filled semi-detached home with garden, close to Regents Park and excellent schools. Recently refurbished throughout.',
      'C', 'freehold', false, ST_SetSRID(ST_MakePoint(-0.1604, 51.5392), 4326)::geography)
    RETURNING id INTO v_prop_id;

    INSERT INTO listings (property_id, user_id, listing_type, status, price)
    VALUES (v_prop_id, v_user_id, 'sale', 'active', 875000)
    RETURNING id INTO v_listing_id;

    INSERT INTO property_media (listing_id, media_type, url, sort_order)
    VALUES (v_listing_id, 'image', '/images/properties/property-2.jpg', 0);
  END IF;

  -- Property 3: 45 Hampstead Lane, London (Sale)
  IF NOT EXISTS (SELECT 1 FROM properties WHERE address_line1 = '45 Hampstead Lane' AND city = 'London') THEN
    INSERT INTO properties (address_line1, city, county, postcode, property_type, bedrooms, bathrooms, reception_rooms, square_footage, title, description, epc_rating, tenure, new_build, coordinates)
    VALUES ('45 Hampstead Lane', 'London', 'Greater London', 'NW3 2QA', 'detached', 5, 4.0, 3, 3500,
      'Grand 5-Bed Detached in Hampstead',
      'Impressive family home with landscaped gardens, wine cellar, and home office. Walking distance to Hampstead Heath.',
      'B', 'freehold', false, ST_SetSRID(ST_MakePoint(-0.1735, 51.5615), 4326)::geography)
    RETURNING id INTO v_prop_id;

    INSERT INTO listings (property_id, user_id, listing_type, status, price)
    VALUES (v_prop_id, v_user_id, 'sale', 'active', 2100000)
    RETURNING id INTO v_listing_id;

    INSERT INTO property_media (listing_id, media_type, url, sort_order)
    VALUES (v_listing_id, 'image', '/images/properties/property-3.jpg', 0);
  END IF;

  -- Property 4: 22 Richmond Terrace, London (Sale)
  IF NOT EXISTS (SELECT 1 FROM properties WHERE address_line1 = '22 Richmond Terrace' AND city = 'London') THEN
    INSERT INTO properties (address_line1, city, county, postcode, property_type, bedrooms, bathrooms, reception_rooms, square_footage, title, description, epc_rating, tenure, new_build, coordinates)
    VALUES ('22 Richmond Terrace', 'London', 'Greater London', 'TW9 1HJ', 'terraced', 3, 2.0, 1, 1600,
      'Elegant 3-Bed Terrace near Richmond Green',
      'Period terraced house with original features, updated kitchen, and south-facing courtyard. Minutes from Richmond station.',
      'C', 'leasehold', false, ST_SetSRID(ST_MakePoint(-0.3037, 51.4613), 4326)::geography)
    RETURNING id INTO v_prop_id;

    INSERT INTO listings (property_id, user_id, listing_type, status, price)
    VALUES (v_prop_id, v_user_id, 'sale', 'active', 725000)
    RETURNING id INTO v_listing_id;

    INSERT INTO property_media (listing_id, media_type, url, sort_order)
    VALUES (v_listing_id, 'image', '/images/properties/property-4.jpg', 0);
  END IF;

  -- Property 5: 15 Islington High Street, London (Sale)
  IF NOT EXISTS (SELECT 1 FROM properties WHERE address_line1 = '15 Islington High Street' AND city = 'London') THEN
    INSERT INTO properties (address_line1, city, county, postcode, property_type, bedrooms, bathrooms, reception_rooms, square_footage, title, description, epc_rating, tenure, new_build, coordinates)
    VALUES ('15 Islington High Street', 'London', 'Greater London', 'N1 9LQ', 'flat', 2, 1.0, 1, 850,
      'Modern 2-Bed Flat in Angel Islington',
      'Stylish apartment with open-plan living, balcony views, and excellent transport links. Chain free.',
      'B', 'leasehold', false, ST_SetSRID(ST_MakePoint(-0.1030, 51.5362), 4326)::geography)
    RETURNING id INTO v_prop_id;

    INSERT INTO listings (property_id, user_id, listing_type, status, price)
    VALUES (v_prop_id, v_user_id, 'sale', 'active', 495000)
    RETURNING id INTO v_listing_id;

    INSERT INTO property_media (listing_id, media_type, url, sort_order)
    VALUES (v_listing_id, 'image', '/images/properties/property-5.jpg', 0);
  END IF;

  -- Rental 1: 3 Camden Passage, London (Rent)
  IF NOT EXISTS (SELECT 1 FROM properties WHERE address_line1 = '3 Camden Passage' AND city = 'London') THEN
    INSERT INTO properties (address_line1, city, county, postcode, property_type, bedrooms, bathrooms, reception_rooms, square_footage, title, description, epc_rating, new_build, coordinates)
    VALUES ('3 Camden Passage', 'London', 'Greater London', 'N1 8EA', 'flat', 1, 1.0, 1, 550,
      'Cosy 1-Bed Flat in Angel',
      'Well-maintained flat with modern finishes, perfect for young professionals. Bills not included.',
      'C', false, ST_SetSRID(ST_MakePoint(-0.1060, 51.5345), 4326)::geography)
    RETURNING id INTO v_prop_id;

    INSERT INTO listings (property_id, user_id, listing_type, status, price, rent_frequency)
    VALUES (v_prop_id, v_user_id, 'rent', 'active', 1800, 'monthly')
    RETURNING id INTO v_listing_id;

    INSERT INTO property_media (listing_id, media_type, url, sort_order)
    VALUES (v_listing_id, 'image', '/images/properties/property-1.jpg', 0);
  END IF;

  -- Rental 2: 7 Shoreditch High Street, London (Rent)
  IF NOT EXISTS (SELECT 1 FROM properties WHERE address_line1 = '7 Shoreditch High Street' AND city = 'London') THEN
    INSERT INTO properties (address_line1, city, county, postcode, property_type, bedrooms, bathrooms, reception_rooms, square_footage, title, description, epc_rating, new_build, coordinates)
    VALUES ('7 Shoreditch High Street', 'London', 'Greater London', 'E1 6JE', 'flat', 2, 1.0, 1, 750,
      'Trendy 2-Bed in Shoreditch',
      'Industrial-chic apartment in the heart of Shoreditch with rooftop access. Furnished.',
      'B', false, ST_SetSRID(ST_MakePoint(-0.0776, 51.5232), 4326)::geography)
    RETURNING id INTO v_prop_id;

    INSERT INTO listings (property_id, user_id, listing_type, status, price, rent_frequency)
    VALUES (v_prop_id, v_user_id, 'rent', 'active', 2200, 'monthly')
    RETURNING id INTO v_listing_id;

    INSERT INTO property_media (listing_id, media_type, url, sort_order)
    VALUES (v_listing_id, 'image', '/images/properties/property-2.jpg', 0);
  END IF;

END
$$;
```

- [ ] **Step 6: Apply the migration**

Run: `cd britv3.0 && npx supabase migration up`

- [ ] **Step 7: Verify property detail page resolves**

Run the dev server and navigate to `/properties/12-kensington-gardens-london-sale` — should render property detail instead of "Not Found".

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/20260320000002_property_seed_data.sql \
  src/components/shared/PropertyCardGrid.tsx \
  src/components/shared/__tests__/PropertyCardGrid.test.tsx
git commit -m "fix(properties): add seed data + fix PropertyCardGrid slug links

Resolves ISSUE-003: Property detail pages showed 'Not Found' because
the DB had no listings. Added 7 seed properties (5 buy, 2 rent) matching
frontend mock data slugs. Fixed PropertyCardGrid to link by slug, not id."
```

---

## Wave 2: High Priority (P1)

### Task 5: Fix Nested Button in LandlordSidebar [ISSUE-007]

**Context:** `LandlordSidebar.tsx` line 117-118 wraps a `<Button>` inside `<SheetTrigger asChild>`. With `asChild`, SheetTrigger renders as its child — but the child is already a `<Button>` which renders `<button>`. The `asChild` prop correctly merges onto the child, so this should work IF Radix's `asChild` is used properly. The issue might be that `SheetTrigger` is imported via a workaround that strips `asChild` functionality.

**Files:**
- Modify: `src/components/landlord/LandlordSidebar.tsx:116-121`

- [ ] **Step 1: Read the SheetTrigger import to understand the workaround**

Check how SheetTrigger is imported and whether `asChild` is properly forwarded.

- [ ] **Step 2: Fix the nested button**

Replace lines 116-121 in `LandlordSidebar.tsx`:

```tsx
<Sheet>
  <SheetTrigger asChild>
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-md border bg-background p-2 text-foreground shadow-sm hover:bg-accent"
      aria-label="Open navigation menu"
    >
      <Menu className="size-5" />
    </button>
  </SheetTrigger>
```

This uses a native `<button>` element instead of the `<Button>` component, avoiding double button nesting.

- [ ] **Step 3: Verify no hydration errors**

Run: `cd britv3.0 && pnpm build`
Expected: No warnings about nested buttons.

- [ ] **Step 4: Commit**

```bash
git add src/components/landlord/LandlordSidebar.tsx
git commit -m "fix(a11y): replace nested button with plain element in LandlordSidebar

Resolves ISSUE-007: SheetTrigger + Button created nested <button>
elements causing hydration errors and WCAG 4.1.1 violations."
```

---

### Task 6: Fix Settings Sidebar Navigation [ISSUE-008 + ISSUE-012]

**Context:** `src/app/(protected)/settings/layout.tsx` line 36 has a tab labeled "Profile" that links to `/settings/account`. Users see "Profile" in nav but no "Account" option. The actual page lives at `/settings/account`.

**Files:**
- Modify: `src/app/(protected)/settings/layout.tsx:36`

- [ ] **Step 1: Rename "Profile" to "Account" in settings tabs**

Change line 36 in `src/app/(protected)/settings/layout.tsx`:

From:
```typescript
label: "Profile",
```
To:
```typescript
label: "Account",
```

- [ ] **Step 2: Verify sidebar renders "Account" label**

Run: `cd britv3.0 && pnpm build`
Navigate to `/settings/account` and verify sidebar shows "Account" with active state.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/settings/layout.tsx
git commit -m "fix(settings): rename sidebar 'Profile' label to 'Account'

Resolves ISSUE-008 and ISSUE-012: Settings sidebar showed 'Profile' label
linking to /settings/account. Renamed to 'Account' for clarity."
```

---

### Task 7: Add MapTiler API Key Guard [ISSUE-006]

**Context:** `SearchMap.tsx` lines 53-54 construct MapTiler URLs using `process.env.NEXT_PUBLIC_MAPTILER_API_KEY`. If the key is missing, the URLs are malformed and no map renders. The component is a client component using `useRef`, `useEffect`, and `maplibregl.Map`.

**Files:**
- Modify: `src/components/search/SearchMap.tsx:53-54, 89-96`

- [ ] **Step 1: Move API key to a checked constant and add early return**

Replace lines 53-54:
```typescript
// Old:
const STREETS_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`;
const SATELLITE_STYLE = `https://api.maptiler.com/maps/satellite/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`;
```

With:
```typescript
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY ?? "";
const STREETS_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;
const SATELLITE_STYLE = `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`;
```

Then at the top of the `SearchMap` function component body (line ~96, after all hooks and refs but before the first `useEffect`), add:

```typescript
// Guard: if no API key, show fallback instead of blank map
if (!MAPTILER_KEY) {
  return (
    <div className={cn("flex h-full items-center justify-center rounded-lg bg-muted", className)}>
      <p className="text-sm text-muted-foreground">
        Map unavailable — MapTiler API key not configured.
      </p>
    </div>
  );
}
```

**Important:** This early return MUST come AFTER all hook calls (`useRef`, `useEffect`) since React hooks must be called unconditionally. Move the guard AFTER the hooks block but BEFORE the JSX return.

- [ ] **Step 2: Verify `.env.local` has the key**

Check that `NEXT_PUBLIC_MAPTILER_API_KEY` is set in `.env.local`. If missing, add it.

- [ ] **Step 3: Commit**

```bash
git add src/components/search/SearchMap.tsx
git commit -m "fix(map): add API key guard with fallback UI for SearchMap

Resolves ISSUE-006: Map view rendered blank when MapTiler API key was
missing. Now shows a clear 'Map unavailable' message instead."
```

---

## Wave 3: Medium Priority (P2)

### Task 8: Fix Must-Haves State Reset on Type Change [ISSUE-009]

**Context:** The must-haves rendering at lines 481 and 617 in `search/page.tsx` correctly uses `MUST_HAVES_RENT` (without "Chain Free") for rent. However, the `mustHaves` state (line 301-306) always initializes with "Chain Free", and `resetFilters()` (line 348) resets to include it. When switching from buy to rent, the state retains the stale "Chain Free" key.

**Files:**
- Modify: `src/app/(main)/search/page.tsx:301-348`

- [ ] **Step 1: Derive initial mustHaves from listing type**

Add a helper and update state initialization:

```typescript
function getDefaultMustHaves(type: ListingType): Record<string, boolean> {
  const keys = type === "rent" ? MUST_HAVES_RENT : MUST_HAVES_ALL;
  return Object.fromEntries(keys.map((k) => [k, false]));
}
```

Update state initialization (line 301):
```typescript
const [mustHaves, setMustHaves] = useState<Record<string, boolean>>(
  getDefaultMustHaves(initialListingType),
);
```

- [ ] **Step 2: Reset mustHaves when listingType changes**

Add an effect or update the listingType setter to also reset mustHaves:

```typescript
function handleListingTypeChange(newType: ListingType) {
  setListingType(newType);
  setMustHaves(getDefaultMustHaves(newType));
}
```

Replace all `setListingType(...)` calls with `handleListingTypeChange(...)`.

- [ ] **Step 3: Update resetFilters to use the helper**

```typescript
function resetFilters() {
  setListingType("all");
  setMinPrice("");
  setMaxPrice("");
  setSelectedTypes([]);
  setSelectedBedrooms("Any");
  setMustHaves(getDefaultMustHaves("all"));
}
```

- [ ] **Step 4: Verify Chain Free doesn't appear for rent**

Run dev server, navigate to `/search?type=rent`, confirm "Chain Free" is not in must-haves.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(main\)/search/page.tsx
git commit -m "fix(search): reset must-haves state when switching listing type

Resolves ISSUE-009: 'Chain Free' filter appeared on rental search because
mustHaves state wasn't reset when switching between buy/rent."
```

---

### Task 9: Add LCP Image Priority [ISSUE-014]

**Context:** `PropertyCard.tsx` line 80-86 renders property images without `priority` prop. Next.js detected the first card's image as LCP.

**Files:**
- Modify: `src/components/search/PropertyCard.tsx:80-86`

- [ ] **Step 1: Add `index` prop to PropertyCard and set priority for first image**

Add an optional `priority` prop:

```typescript
type PropertyCardProps = Readonly<{
  listing: SearchListing;
  href: string;
  priority?: boolean;
}>;
```

Then in the Image component:

```tsx
<Image
  src={listing.thumbnail_url}
  alt={listing.title || "Property image"}
  fill
  priority={priority}
  className="object-cover transition-transform group-hover:scale-105"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
```

Pass `priority={index === 0}` from the parent that maps over results.

- [ ] **Step 2: Commit**

```bash
git add src/components/search/PropertyCard.tsx src/app/\(main\)/search/page.tsx
git commit -m "perf(search): add priority loading to first property card image

Resolves ISSUE-014: LCP image was lazy-loaded. First property card now
uses priority loading for faster Largest Contentful Paint."
```

---

## Wave 4: Low Priority (P3)

### Task 10: Fix scroll-behavior Warning [ISSUE-016]

**Context:** `globals.css` line 227-229 sets `scroll-behavior: smooth` on `html`. Next.js wants `data-scroll-behavior="smooth"` attribute on the `<html>` element instead.

**Files:**
- Modify: `src/app/globals.css:227-229`
- Modify: `src/app/layout.tsx:44`

- [ ] **Step 1: Remove CSS scroll-behavior and add data attribute**

In `globals.css`, change:
```css
html {
  scroll-behavior: smooth;
  overflow-x: hidden;
}
```
to:
```css
html {
  overflow-x: hidden;
}
html[data-scroll-behavior="smooth"] {
  scroll-behavior: smooth;
}
```

In `layout.tsx` line 44, change:
```tsx
<html lang="en">
```
to:
```tsx
<html lang="en" data-scroll-behavior="smooth">
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "fix(ux): use data-scroll-behavior attribute per Next.js docs

Resolves ISSUE-016: Eliminates scroll-behavior console warning on every page."
```

---

### Task 11: Fix 404 Page Auth State [ISSUE-017]

**Context:** `not-found.tsx` hardcodes a "Sign In" button (line 34-36). Authenticated users see "Sign In" on 404 pages. Since `not-found.tsx` is a server component, we can check auth state server-side.

**Files:**
- Modify: `src/app/not-found.tsx:14-36`

- [ ] **Step 1: Add conditional auth header to 404 page**

```tsx
import { createClient } from "@/lib/supabase/server";

export default async function NotFound() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="flex items-center justify-between border-b border-brand-primary/10 bg-white px-6 py-5 lg:px-20">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {/* ... existing nav links ... */}
        </nav>
        {user ? (
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline">
            <Link href="/login">Sign In</Link>
          </Button>
        )}
      </header>
      {/* ... rest of page unchanged ... */}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/not-found.tsx
git commit -m "fix(404): show Dashboard link for authenticated users

Resolves ISSUE-017: 404 page showed 'Sign In' even when logged in.
Now conditionally shows 'Dashboard' button for authenticated users."
```

---

## Verification Checklist

After all tasks are complete:

- [ ] Run `cd britv3.0 && pnpm build` — should complete with zero errors
- [ ] Run `cd britv3.0 && pnpm lint` — should pass
- [ ] Run `cd britv3.0 && pnpm vitest run` — all tests should pass
- [ ] Run `/qa quick` against localhost:3000 to verify health score improvement
- [ ] Manually verify each P0 fix:
  - [ ] Navigate to `/dashboard/homebuyer` — renders without crash
  - [ ] Navigate to `/dashboard/landlord` — renders with health score (0 fallback is fine)
  - [ ] Navigate to `/properties/12-kensington-gardens-london-sale` — shows property detail
  - [ ] While logged in, navigate to `/login` — redirects to `/dashboard`

---

## Issues Deferred (Require Separate Work)

| Issue | Reason | Action Needed |
|-------|--------|---------------|
| 005 (admin login) | Admin test user may not exist in DB | Verify admin user exists; if not, seed admin account |
| 010 (London only) | Search uses frontend mock data, not real DB queries | Future: replace mocks with actual Supabase queries |
| 011 (no pagination) | Search uses static mock array | Future: implement server-side pagination |
| 013 (dashboard link) | Depends on 001 + 002 being resolved | Auto-resolves when both are fixed |
| 015 (cookie overlap) | Visual polish; needs design review | Future: adjust z-index or margin on cookie banner |
