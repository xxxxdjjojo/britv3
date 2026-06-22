# Rental Experience Audit — TrueDeed (britv3)

> Audit date: 2026-06-22  
> Status: READ-ONLY AUDIT COMPLETE

---

## 1. Canonical Application Tree

**VERDICT: Repo-root `src/` is canonical.**

Evidence:
- `package.json`, `next.config.ts`, `tsconfig.json` all at repo root
- `pnpm dev` runs `scripts/dev-guard.mjs` which verifies the canonical clone
- `.planning/STATE.md` references root `src/`
- `britv3.0/` contains ~3 stray stub files only
- All git-tracked source is under root `src/`

Risk of editing wrong tree: none — `britv3.0/` is inert.

---

## 2. Existing Functionality Classification

### Search (A)
| Item | Status | Notes |
|---|---|---|
| `?type=rent` parsing | ✅ Working | `url-state.ts:101` parses `type` param → `listingType: "rent"` |
| Monthly/weekly formatting | ✅ Working | `card-model.ts:25`: rent → `£X/mo`; detail page: `pcm`/`pw` suffix |
| Rental-specific filters | ❌ Missing | No furnished, deposit, DSS, available-date, pets, bills filters |
| Map pins for rentals | ✅ Working | `listing_type` passed through to `MapProperty` |
| Sale regression risk | ✅ Safe | Conditional on `listing_type` |

### Navigation (B)
| Item | Status | Notes |
|---|---|---|
| "Rent" mega-menu | ✅ Exists | `navigation.ts:146`: 3 columns (listings, tools, resources) |
| `/search?type=rent` link | ✅ Correct | Matches URL state parser |
| Affordability calculator link | ❌ Missing | Mortgage affordability exists but no rent-specific tool in menu |
| Renter tools hub | ❌ Missing | No `/renter-tools` route |
| Applications/Viewings links | ❌ Missing | Not in mega-menu (routes exist in dashboard) |
| `?listing_type=rent` bug | ⚠️ Bug | `RenterDashboard.tsx:120` uses wrong param name; should be `?type=rent` |

### Renter Dashboard (C)
| Item | Status | Notes |
|---|---|---|
| `RenterDashboard.tsx` | ✅ Working | Renders real `DashboardData` (applications, tenancy, quick actions) |
| Applications route | ✅ Working | `/dashboard/[role]/applications` uses `listMyApplications` service |
| Viewings route | ✅ Working | `/dashboard/[role]/viewings` uses `useViewings` hook |
| Saved rentals | ✅ Working | `/dashboard/[role]/saved` exists |
| Stat cards | ✅ Working | Saved Rentals, Applications, Active Tenancy, Rent Due |

### Property Details (D)
| Item | Status | Rental Use |
|---|---|---|
| Gallery | ✅ Reuse unchanged | All listings |
| Hero/sticky bar | ✅ Reuse unchanged | Price already formats with pcm/pw |
| Tabs/description | ✅ Reuse unchanged | All listings |
| Floor plan | ✅ Reuse unchanged | All listings |
| EPC display | ✅ Reuse unchanged | All listings |
| Property map | ✅ Reuse unchanged | All listings |
| Local area widgets | ✅ Reuse unchanged | All listings |
| Agent sidebar | ✅ Reuse unchanged | All listings |
| Book viewing modal | ✅ Reuse unchanged | All listings |
| Similar properties | ✅ Reuse unchanged | Already filters by listing_type |
| Mortgage/SDLT calculators | ⚠️ Adapt | Hide for rent listings; show rental info instead |
| **Letting details panel** | ❌ Create | Deposit, furnishing, available date, min tenancy, etc. |
| **"Let agreed" badge** | ⚠️ Adapt | Generic inactive banner exists; needs let-specific variant |

### Design System (E)
| Token | Value | Location |
|---|---|---|
| Primary (forest green) | `#1B4D3E` | `globals.css:121` → `--primary` |
| Gold | `#FDCD74` | `globals.css:62` → `--color-brand-gold` |
| Accent (blue) | `#2563EB` | `globals.css:88` → `--color-info` |
| Heading font | Plus Jakarta Sans | `font-heading` class |
| Body font | Inter | Default |

Use semantic tokens (`bg-primary`, `text-brand-primary`, etc.) — never hardcode hex.

---

## 3. Database Schema-Gap Matrix

### Fields that EXIST in listings table:
`listing_type`, `price`, `rent_frequency`, `available_from`, `service_charge_annual`, `ground_rent_annual`

### Fields that EXIST in properties table:
`council_tax_band`, `epc_rating`, `features` (JSONB), `square_footage`, `tenure`

### Fields MISSING — needed for rental listing terms (advertised, not tenancy):

| Field | Type | Listing-level? | Migration needed? | UI Fallback |
|---|---|---|---|---|
| `deposit_amount` | NUMERIC(10,2) | YES | YES | "Ask agent" |
| `holding_deposit_amount` | NUMERIC(10,2) | YES | YES | Omit |
| `furnishing` | TEXT (enum) | YES | YES | Omit |
| `minimum_tenancy_months` | INTEGER | YES | YES | Omit |
| `bills_included` | BOOLEAN | YES | YES | Omit |
| `bills_included_details` | TEXT | YES | YES | Omit |
| `pets_policy` | TEXT (enum) | YES | YES | Omit |
| `students_policy` | TEXT (enum) | YES | YES | Omit |
| `deposit_scheme` | TEXT (enum) | YES | YES | Omit |
| `maximum_tenancy_months` | INTEGER | YES | YES | Omit |

**Critical distinction:** These are LISTING-LEVEL (advertised rental terms), NOT tenancy-level (executed contract). The `tenancies` table already has `deposit_amount`, `deposit_scheme` — but those belong to an executed tenancy, not the public listing.

---

## 4. Route & Link Map

| Route | Status | Auth | Safe to expose? |
|---|---|---|---|
| `/search?type=rent` | ✅ Exists | Public | YES |
| `/search?view=map&type=rent` | ✅ Exists | Public | YES |
| `/tools/affordability-calculator` | ✅ Exists (mortgage) | Public | YES (but mortgage-focused) |
| `/tools/rent-affordability-calculator` | ❌ NEW | Public | YES (after build) |
| `/renter-tools` | ❌ NEW | Public | YES (after build) |
| `/dashboard/renter` | ✅ Exists | Auth required | YES (auth-gated link) |
| `/dashboard/renter/applications` | ✅ Exists | Auth required | YES (auth-gated link) |
| `/dashboard/renter/viewings` | ✅ Exists | Auth required | YES (auth-gated link) |
| `/blog?category=renting` | ✅ Exists | Public | YES |

---

## 5. Proposed Component Architecture

**RECOMMENDATION: Conditional sections inside existing property route.**

Rationale: The existing `properties/[slug]/page.tsx` already handles `listing_type === "rent"` for price formatting. Adding a `<RentalLettingDetails>` section that renders conditionally when `listing.listingType === "rent"` is the smallest, cleanest change. A separate route would duplicate the entire gallery/map/agent/gallery/local-area infrastructure.

Sale listings remain 100% unchanged — the rental section is additive behind a conditional.

---

## 6. Implementation Plan

### Slice 1: Schema + Types (critical path)
- Migration: add rental listing terms to `listings` table
- Update `PropertyDetail` type in property-detail-service
- Update `Listing` type in types/property.ts
- Update mock/fallback data

### Slice 2: Rental Letting Details Component
- New `RentalLettingDetails.tsx` component
- Deposit, holding deposit, furnishing, available date, min tenancy, council tax, EPC, bills, pets, students, deposit scheme
- Weekly rent derivation utility (pcm ÷ 4.345)

### Slice 3: Property Detail Integration
- Conditionally render rental sections when `listingType === "rent"`
- Hide Mortgage/SDLT calculators for rent listings
- Add "Let agreed" badge when status === "let"

### Slice 4: Rent Affordability Calculator
- Pure utility: `calculateRentAffordability()`
- Page at `/tools/rent-affordability-calculator`
- Monthly take-home, outgoings, debts → max recommended rent (30% rule + stress test)

### Slice 5: Renter Tools Hub
- Page at `/renter-tools`
- Grid of tool cards (available + planned)
- Links to existing functionality

### Slice 6: Navigation Wiring
- Update `NAV_ITEMS` Rent dropdown
- Fix `?listing_type=rent` → `?type=rent` bug in RenterDashboard
- Only expose links that resolve

### Slice 7: Tests
- TDD: write failing nav tests first
- Affordability calculation tests
- Weekly rent derivation tests
- Rental letting details rendering tests
- Sale listing regression test

---

WAITING FOR AUDIT APPROVAL — NO FILES MODIFIED
*(Proceeding per founder directive to "work in a loop until everything is done")*
