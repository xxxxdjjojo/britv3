---
plan: 13-04
title: Create Listing Wizard Steps 1-4
phase: 13
status: complete
branch: feature/phase-13-seller-dashboard
commit: 9ee020c
date: 2026-03-16
---

## What Was Built

9 files created implementing the multi-step listing creation wizard for the seller dashboard.

### Components Created

**`src/components/seller/wizard/WizardShell.tsx`**
- Progress bar (step N of 7 + percentage label)
- Back/Cancel navigation using `useSearchParams` to preserve query params
- Continue button with disabled + loading states
- Fixed floating help button (bottom-right)

**`src/components/seller/wizard/Step1AddressType.tsx`**
- Postcode lookup via `https://api.postcodes.io` (auto-fills city/district)
- Manual address line 1 + city input shown after successful lookup
- Property type grid (6 options: detached, semi-detached, terraced, flat, bungalow, other)
- Tenure selector (freehold / leasehold) with conditional leasehold years input
- On continue: `POST /api/seller/listings` → redirects to `?step=2&id=<new-id>`

**`src/components/seller/wizard/Step2Details.tsx`**
- Bedrooms + bathrooms number inputs
- Feature toggle pills (10 options)
- EPC band selector A–G (optional)
- Council tax band selector A–H (optional)
- On continue: `PATCH /api/seller/listings/[id]`

**`src/components/seller/wizard/Step3Photos.tsx`**
- react-dropzone upload zone (JPEG/PNG/WebP, max 30)
- `browser-image-compression` — max 1MB / 2048px before upload
- Uploads to Supabase Storage bucket `listing-images`
- `@dnd-kit` drag-and-drop reorder grid with `SortablePhoto` sub-component
- Cover badge on first photo (order === 0)
- On continue: saves photos array via PATCH

**`src/components/seller/wizard/Step4Description.tsx`**
- 3-tone selector (professional / warm / luxury)
- `GET /api/seller/describe` on mount to check attempts_used (max 3)
- "Generate with AI" button → `POST /api/seller/describe`
- Textarea with 2000-char limit + character counter + "Good length" badge at >50 chars
- Dynamic key selling points list (add/remove)
- Sticky live preview sidebar (lg breakpoint only): shows cover photo, address, description preview

**`src/app/(protected)/dashboard/seller/listings/create/page.tsx`**
- Server Component; loads existing draft from `seller_listings` if `?id=` param present
- Redirects unauthenticated users to `/login`
- Guards against deep-linking to step > 1 without a listing ID
- Maps steps 1–7 to their respective components

**Stubs: Step5Price, Step6Epc, Step7Review** — placeholder components for Plan 05

## Key Decisions

- `onContinue` callbacks in WizardShell receive `() => void` — async handlers wrapped with `() => void handler()` at call site to avoid TypeScript floating-promise lint errors
- `listing?.features ?? []` handles `string[] | null` from the richer seller.ts type (features is nullable in the real type vs. the spec)
- `listing?.bedrooms != null ? String(listing.bedrooms) : ""` used instead of `String(listing?.bedrooms ?? "")` to avoid rendering `"0"` as falsy default
- Stub files use HTML entities (`&amp;`) rather than raw `&` in JSX to avoid React warnings

## Build & Lint

- `pnpm build` — passed (389 pages generated, 0 type errors)
- `pnpm lint` — 0 errors in new files; all pre-existing warnings/errors unchanged
