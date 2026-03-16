---
plan: 13-05
title: "Wizard Steps 5-7 (Price, EPC, Review/Publish) + Edit Listing Page"
phase: 13
status: done
commit: e231ca8
date: 2026-03-16
---

## What Was Built

### Step5Price (`src/components/seller/wizard/Step5Price.tsx`)
- Asking price input with £ prefix, numeric-only filtering, formatted preview (en-GB locale)
- Three listing type selectors: For Sale, Auction, Expressions of Interest — radio-card style
- Optional price qualifier dropdown (offers over, guide price, fixed price, POA, etc.)
- Validation: price must be ≥ £1,000 before Continue is enabled
- Saves via `PATCH /api/seller/listings/[id]` with `asking_price` (in pence), `listing_type`, `price_qualifier`
- Navigates to step 6 on success

### Step6Epc (`src/components/seller/wizard/Step6Epc.tsx`)
- `react-dropzone` upload zone accepting PDF, JPEG, PNG
- Uploads to Supabase Storage bucket `listing-documents` at path `listings/[id]/epc-[timestamp].[ext]`
- Success state shows public URL link + Remove button
- Step is skippable — continue label reads "Skip for now" when no EPC is uploaded, "Continue" when one is
- Amber info box explains legal requirement (EPB Regulations 2012)
- `useMemo` pattern for Supabase client (best practice from Plan 04)

### Step7Review (`src/components/seller/wizard/Step7Review.tsx`)
- Listing preview card: cover photo (or placeholder), address, price, bed/bath/type, description excerpt
- Publication checklist with 6 required + 2 optional items using CheckCircle / XCircle / AlertCircle icons
- Publish button disabled until all required items complete
- Calls `PATCH /api/seller/listings/[id]` with `action: "publish"` → redirects to `/dashboard/seller/listings?published=1`

### EditListingPage (`src/app/(protected)/dashboard/seller/listings/[id]/edit/page.tsx`)
- Server Component — fetches listing with `.eq("seller_id", user.id)` ownership check
- Redirects to `/login` if unauthenticated, to `/dashboard/seller/listings` if listing not found
- Accepts `?step=1-7` query param, clamps to valid range
- Renders the correct step component with listing data pre-populated

## Key Decisions
- Price stored in pence (integer × 100) consistent with existing SellerListing type
- EPC step is optional (skippable) to avoid blocking sellers who don't have EPC ready
- Step7Review renders listing.photos[0].url via `<img>` with eslint-disable comment (consistent with existing codebase pattern)
- Edit page uses same wizard step components as the create flow — no duplication

## Build & Lint
- `pnpm build`: compiled successfully, no TypeScript errors in new files
- `pnpm lint`: no errors in new files; pre-existing warnings in unrelated files unchanged
