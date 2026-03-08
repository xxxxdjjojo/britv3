# Epic 8 (Final): Financial Calculators & Personalized Affordability

Epic Number: E08
Epic Title: Financial Calculators & Personalized Affordability
Date Created: May 13, 2025
Last Updated: March 7, 2026 (Cost-Optimized Rewrite)
Target Release: Phase 5

---

## 1. Description

This Epic delivers the two financial calculators every UK property buyer needs (mortgage payments and stamp duty), plus a personalized affordability display on property listings that shows users their estimated monthly payment based on saved inputs. Every feature is client-side with zero backend infrastructure cost.

The original spec bundled calculators with offer management, transaction tracking, e-signatures, and payment processing. This rewrite strips all of that out:
- Offer management and transaction tracking belong in Phase 6 (Landlord Tools & Transactions) where the full pipeline is designed holistically
- Stripe Connect integration belongs with Epic 4 (Marketplace) execution
- E-signatures are a premium feature post-revenue ($200-600/mo API minimum isn't justified pre-launch)
- Online rent collection via Stripe cards (4% total fees) is user-hostile when bank transfers are free

What remains is a focused, high-impact epic that costs $0/mo in infrastructure and delivers genuine differentiation: "Est. £1,450/mo for you" on every listing.

---

## 2. Goals

- Provide homebuyers with mortgage payment and stamp duty calculators to support their property decisions
- Display personalized estimated monthly payments on property listings based on saved user inputs
- Keep total infrastructure cost at $0/mo (all calculations client-side)
- Deliver in 1-2 weeks of dev time

---

## 3. Scope

### In Scope

**Financial Calculators**
- Mortgage Payment Calculator with option to save inputs for personalized listing estimates
- Stamp Duty Land Tax (SDLT) Calculator for England & Northern Ireland with first-time buyer and additional property toggles

**Personalized Affordability Display**
- Save mortgage parameters (deposit, interest rate, term) to localStorage with optional DB sync
- Display "Est. £X,XXX/mo for you" on property listing cards and detail pages
- Clear/update saved parameters from calculator or profile settings

**PDF Document Generation**
- Generate offer letter PDFs from templates using React PDF
- "Download & Sign" workflow (users sign with OS tools or print-and-scan)
- No third-party e-signature API integration

### Out of Scope

- Offer management system (Phase 6 — TXN-01 through TXN-07)
- Transaction progress timeline (Phase 6)
- Chain visualization (Phase 6)
- Stripe Connect integration (Epic 4 execution)
- E-signature API integration (premium feature post-revenue)
- Online rent collection via payment gateway (manual tracking with reminders instead, Epic 7)
- Rent vs. Buy Calculator (defer — low engagement, niche use case)
- Renovation Cost Calculator (defer — rough estimates don't drive retention)
- Moving Cost Calculator (defer — rough estimates don't drive retention)
- Affordability Calculator (post-launch — similar to mortgage calc, quick add if requested)
- LBTT (Scotland) and LTT (Wales) calculators (link to HMRC instead)

---

## 4. User Stories & Acceptance Criteria

### Mortgage Payment Calculator

**E08-S01: Mortgage Payment Calculator**

As a Homebuyer, I want to calculate estimated monthly mortgage payments, so I can understand what I can afford.

Priority: Must

Acceptance Criteria:
- A "Mortgage Calculator" page/section is available under `/tools/mortgage-calculator`
- Inputs: property price, deposit amount (£ or %), interest rate (%), loan term (years)
- Calculates and displays: monthly payment (principal & interest), total amount repayable, total interest paid
- Amortization breakdown showing principal vs interest split over time (simple table or chart)
- All calculation happens client-side in JavaScript — zero API calls
- Inputs are validated: price > 0, deposit < price, rate 0-25%, term 1-40 years
- Results update in real-time as user adjusts inputs (no submit button needed)
- A disclaimer states: "This is an estimate for illustration purposes only. It does not constitute a mortgage offer."
- Responsive design — works on mobile

**E08-S02: Save Mortgage Parameters**

As a Homebuyer, I want to save my mortgage inputs so I see personalized estimates on property listings.

Priority: Must

Acceptance Criteria:
- Below the calculator results, a "Use these settings for personalized estimates" button/checkbox is available (authenticated users only)
- Clicking saves deposit amount (£), interest rate (%), and loan term (years) to localStorage
- If user is authenticated, parameters are also saved to the `profiles.preferences` JSONB column under key `mortgage_params` (one DB write)
- On login, if localStorage is empty but DB has saved params, sync from DB to localStorage (one DB read on login only)
- Confirmation message: "Your settings have been saved. You'll now see estimated monthly payments on property listings."
- The calculator pre-fills with saved values when revisited (read from localStorage)
- If the user is not authenticated, a prompt suggests signing in to save across devices

**E08-S03: Clear/Update Saved Parameters**

As a Homebuyer, I want to clear or update my saved mortgage settings, so the personalized estimates reflect my current situation.

Priority: Must

Acceptance Criteria:
- On the Mortgage Calculator page, if params are saved, a "Clear saved settings" link is visible
- Clearing removes params from localStorage and sets `profiles.preferences.mortgage_params` to null (one DB write)
- After clearing, personalized estimates stop appearing on listings
- Confirmation message: "Saved settings cleared. Personalized estimates have been removed."
- Updating is done by changing inputs on the calculator and clicking "Save" again — overwrites previous values

---

### Stamp Duty Calculator

**E08-S04: SDLT Calculator**

As a Homebuyer, I want to calculate stamp duty on a property purchase, so I can factor it into my budget.

Priority: Must

Acceptance Criteria:
- A "Stamp Duty Calculator" page/section is available under `/tools/stamp-duty-calculator`
- Inputs: property purchase price (£), buyer type toggle (First-Time Buyer / Home Mover / Additional Property)
- Calculates SDLT based on current HMRC England & Northern Ireland tax bands:
  - Standard rates with thresholds
  - First-time buyer relief (threshold and reduced rates)
  - Additional property surcharge (3% on top of standard rates)
- Results display: total SDLT amount, effective tax rate (%), and band-by-band breakdown table
- All calculation client-side — zero API calls
- Link to HMRC official calculator for verification
- Note: "For Scotland (LBTT) or Wales (LTT), please use the HMRC calculator" with link
- A disclaimer states: "This is an estimate based on current HMRC rates. Please consult a professional for formal advice."
- Responsive design

**E08-S05: SDLT Rate Data**

As a Developer, I need to store SDLT rate bands in a maintainable format so they can be updated when HMRC changes rates.

Priority: Must

Acceptance Criteria:
- SDLT rate bands stored in a TypeScript configuration file (not hardcoded in the calculator component)
- File location: `src/lib/calculators/sdlt-rates.ts`
- Structure: array of band objects with `threshold`, `rate`, and `buyerType` fields
- Separate rate tables for: standard, first-time buyer, additional property
- Comments in the file noting the effective date and HMRC source URL
- When HMRC changes rates, only this file needs updating — calculator logic remains unchanged

---

### Personalized Affordability Display

**E08-S06: Estimated Monthly Payment on Listings**

As a Homebuyer with saved mortgage settings, I want to see estimated monthly payments on property listings, so I can quickly assess affordability.

Priority: Must

Acceptance Criteria:
- If a user has saved mortgage params (in localStorage), property listing cards (search results from Epic 2) and property detail pages display: "Est. £X,XXX/mo" beneath the asking price
- Calculation: `loan_amount = property_price - saved_deposit`, then standard mortgage payment formula using saved rate and term
- If saved deposit exceeds the property price, display: "Within your deposit" or similar positive indicator
- Display is clearly styled as secondary to the asking price (smaller font, different color, italicized or with info icon)
- Tooltip on hover/tap explains: "Based on your saved settings: £X deposit, Y% rate, Z-year term. Not a mortgage offer."
- Calculation happens entirely client-side as listings render — no API calls, no DB queries
- If no saved params exist, no personalized estimate is shown (no placeholder, no prompt — clean UI)
- Performance: calculation adds < 1ms per listing card (simple math formula)

**E08-S07: Mortgage Calculation Utility**

As a Developer, I need a shared mortgage calculation function used by both the calculator page and listing display.

Priority: Must

Acceptance Criteria:
- Utility function location: `src/lib/calculators/mortgage.ts`
- Function signature: `calculateMonthlyPayment(principal: number, annualRate: number, termYears: number): number`
- Uses standard amortization formula: `M = P * [r(1+r)^n] / [(1+r)^n - 1]` where r = monthly rate, n = total months
- Handles edge cases: rate = 0 (divide by months), term = 0, negative values (return 0)
- Exported and used by both the Mortgage Calculator page component and the PropertyCard/PropertyDetail listing components
- Unit tested with known correct values (e.g., £200K loan at 5% over 25 years = £1,169.18/mo)
- Additional exported function: `calculateTotalRepayable(principal, annualRate, termYears): { totalRepayable: number, totalInterest: number }`

---

### PDF Document Generation

**E08-S08: Offer Letter PDF**

As a Homebuyer, I want to generate a professional offer letter PDF for a property, so I can submit a formal written offer.

Priority: Should

Acceptance Criteria:
- On a property detail page, a "Generate Offer Letter" button is available
- Clicking opens a form with: offer price (£), buyer name, buyer solicitor details (optional), mortgage status (Cash / AIP Obtained / Mortgage in Principle), any conditions (free text, max 500 chars)
- On submit, a PDF is generated client-side using React PDF (@react-pdf/renderer)
- PDF includes: Britestate letterhead, date, property address, offer details, buyer details, standard terms text
- PDF is downloaded to the user's device via browser download
- The generated PDF is NOT stored on the server — it's ephemeral, generated on-demand
- A note on the form: "This letter is not legally binding. We recommend having your solicitor review any formal offer."
- No e-signature integration — the user prints and signs, or uses their OS PDF signing tools

---

### Database Schema

**E08-S09: Schema Updates**

As a Developer, I need minimal schema changes to support Epic 8 features.

Priority: Must

Acceptance Criteria:

No new tables required. Epic 8 uses:
- `profiles.preferences` (JSONB, already exists from Epic 1) — stores `mortgage_params` object:
  ```json
  {
    "mortgage_params": {
      "deposit": 50000,
      "interest_rate": 4.5,
      "term_years": 25,
      "saved_at": "2026-03-07T10:30:00Z"
    }
  }
  ```
- No new indexes needed — preferences are fetched by primary key (user ID) which is already indexed
- No new RLS policies needed — profiles table already restricts users to their own row
- No new triggers needed

SDLT rates stored as TypeScript config file, not in database (rates change infrequently, code deployment is the correct update mechanism).

Mortgage params primarily stored in localStorage (JSON):
```json
{
  "britestate_mortgage_params": {
    "deposit": 50000,
    "interest_rate": 4.5,
    "term_years": 25
  }
}
```

---

## 5. Acceptance Criteria (General)

- Mortgage Payment Calculator is functional with real-time results
- SDLT Calculator accurately calculates England & NI stamp duty for all three buyer types
- Authenticated users can save mortgage parameters and see personalized estimates on listings
- Personalized estimates display correctly on property listing cards and detail pages
- Users can clear or update their saved parameters
- Offer letter PDF can be generated and downloaded
- All calculations are client-side with zero API calls
- All features are responsive (mobile, tablet, desktop)
- Total monthly infrastructure cost: $0

---

## 6. Dependencies

- Epic 1: Authentication — for saving mortgage params to user profile
- Epic 2: Property listings — property cards and detail pages need modification to display personalized estimates
- Epic 3: Dashboards — profile settings page needs "Clear mortgage settings" option
- localStorage API — available in all modern browsers
- @react-pdf/renderer — for offer letter PDF generation (npm package, no external service)

---

## 7. Technical Considerations

### Client-Side Architecture
- **All calculations in JavaScript/TypeScript.** No API routes, no server-side computation, no database queries for calculator operations.
- **localStorage as primary store** for mortgage params. Avoids 800K+ DB reads/month at 100K users. DB sync is a nice-to-have for cross-device, triggered only on explicit save and on login.
- **Shared utility functions** in `src/lib/calculators/` — reused by calculator pages and listing components.

### Mortgage Calculation
- Standard amortization formula. Well-documented, deterministic, no edge cases that require server validation.
- Monthly payment = `P * [r(1+r)^n] / [(1+r)^n - 1]` where P = principal, r = monthly interest rate, n = total months.
- Handle r = 0 case separately (simple division: P / n).

### SDLT Calculation
- Band-based progressive tax. Each band has a threshold and rate. Tax = sum of (amount in each band * band rate).
- First-time buyer relief: different thresholds and a purchase price cap (above cap, standard rates apply).
- Additional property: add 3% surcharge to each band rate.
- Rates stored in a config file, not hardcoded in the calculator component. When HMRC updates rates (typically in Budget announcements), update one file.

### Personalized Display on Listings
- Property listing components (from Epic 2) check localStorage for `britestate_mortgage_params`.
- If present, calculate monthly payment using the property's asking price minus saved deposit.
- Render the estimate below the asking price.
- If not present, render nothing — no empty states, no prompts.
- This is a pure rendering concern with no performance impact (sub-millisecond per card).

### PDF Generation
- Use `@react-pdf/renderer` for client-side PDF generation. No server-side processing.
- PDF template is a React component that accepts offer data as props.
- Generated PDFs are not stored — they exist only in the browser's download.
- This avoids all storage costs and data retention concerns.

---

## 8. Design & UX Notes

### Calculator Pages
- Clean, focused layout. Inputs on the left, results on the right (desktop) or inputs above results (mobile).
- Results update in real-time as user adjusts sliders/inputs — no "Calculate" button needed.
- Mortgage calculator: include a simple bar chart or pie chart showing principal vs interest breakdown.
- SDLT calculator: show the band breakdown as a table and the total prominently.
- Both calculators accessible from a "Financial Tools" section in the main navigation or footer.

### Personalized Estimate on Listings
- Display as: "Est. £1,450/mo" in a muted color below the asking price on property cards.
- On property detail pages, show it more prominently with the full breakdown: "Based on £50,000 deposit, 4.5% rate, 25-year term."
- Include a small "Edit" link next to the estimate that takes the user to the Mortgage Calculator with the property's price pre-filled.
- First time a user sees the estimate, a subtle tooltip could explain the feature. Dismiss permanently after first interaction.

### Offer Letter PDF
- Clean, professional template. Britestate logo at top, date, property address, offer terms, buyer details.
- Standard disclaimer text at the bottom.
- "Generate Offer Letter" button should be secondary styling (not the main CTA on a listing — "Contact Agent" remains primary).

---

## 9. Cost Projection

| Component | At 10K users/mo | At 100K users/mo | At 1M users/mo |
|-----------|----------------|-----------------|----------------|
| Mortgage Calculator | $0 (client-side) | $0 | $0 |
| SDLT Calculator | $0 (client-side) | $0 | $0 |
| Personalized display | $0 (localStorage) | $0 | $0 |
| DB sync (mortgage params) | $0 (Supabase plan) | $0 | $0 |
| PDF generation | $0 (client-side) | $0 | $0 |
| **Total** | **$0/mo** | **$0/mo** | **$0/mo** |

Compare to original spec: $200-600/mo + 5-8 weeks dev time for e-signatures, transaction management, and payment processing.

---

## 10. What Was Removed and Where It Lives

| Original Story | Removed From Epic 8 | New Home | Rationale |
|---------------|---------------------|----------|-----------|
| E08-S10: Submit offers | Yes | Phase 6 (TXN-01) | Offer management is part of the full transaction pipeline |
| E08-S11: Manage offers | Yes | Phase 6 (TXN-02) | Needs holistic design with chain visualization |
| E08-S12: Transaction timeline | Yes | Phase 6 (TXN-03) | Already scoped in roadmap Phase 6 |
| E08-S13: Service payments | Yes | Epic 4 execution | Can't pay providers without marketplace bookings |
| E08-S14: Provider payouts | Yes | Epic 4 execution | Stripe Connect belongs with marketplace |
| E08-S15: Online rent collection | Yes | Deferred indefinitely | 4% fees are user-hostile; manual tracking with reminders instead |
| E08-S16: E-signatures | Yes | Premium feature post-revenue | $200-600/mo API cost not justified pre-launch |
| E08-S17: Signed doc storage | Yes | Premium feature post-revenue | Depends on e-signature integration |
| E08-S18: Payment gateway integration | Yes | Epic 4 execution | Stripe Connect is a marketplace concern |
| E08-S19: E-signature API integration | Yes | Premium feature post-revenue | $200-600/mo API cost not justified pre-launch |
| E08-S01 (original): Affordability Calculator | Yes | Post-launch if requested | Very similar to mortgage calc, quick add |
| E08-S04 (original): Rent vs Buy | Yes | Deferred indefinitely | Low engagement, niche use case |
| E08-S05 (original): Renovation Cost | Yes | Deferred indefinitely | Rough estimates don't drive retention |
| E08-S06 (original): Moving Cost | Yes | Deferred indefinitely | Rough estimates don't drive retention |

---

## 11. QA & Testing Strategy

**Unit Tests:**
- Mortgage payment calculation against known correct values (cross-reference with HMRC examples)
- SDLT calculation for all three buyer types at various price points (cross-reference with HMRC calculator)
- Edge cases: zero deposit, zero rate, deposit exceeding property price, very large values
- localStorage read/write/clear operations for mortgage params
- PDF template rendering with various input combinations

**Integration Tests:**
- Save mortgage params -> navigate to listings -> personalized estimate displayed correctly
- Clear mortgage params -> navigate to listings -> no personalized estimate shown
- Update mortgage params -> listing estimates update on next page load
- Login with saved DB params but empty localStorage -> params synced from DB
- SDLT calculator: first-time buyer relief correctly applied/removed at price cap threshold

**E2E Tests:**
- Full flow: user opens mortgage calculator -> enters values -> saves params -> browses listings -> sees "Est. £X,XXX/mo" on each card -> clicks "Edit" -> returns to calculator with property price pre-filled
- Full flow: user opens SDLT calculator -> selects first-time buyer -> enters price -> sees correct SDLT with band breakdown
- Full flow: user generates offer letter PDF -> PDF downloads with correct details
- Mobile: all calculators usable on 375px viewport width

**Performance Tests:**
- Mortgage calculation: < 1ms per invocation (simple math)
- SDLT calculation: < 1ms per invocation (loop through bands)
- Listing page with 20 cards + personalized estimates: no measurable render time increase
- PDF generation: < 2s for single-page offer letter

---

*Original spec: epic8.txt (May 13, 2025)*
*Cost analysis: epic8costanalysis.md (March 7, 2026)*
*This rewrite: March 7, 2026*
*Key changes: Removed offer management (Phase 6), transaction timeline (Phase 6), Stripe Connect (Epic 4), e-signatures (post-revenue premium), rent collection (manual tracking), 4 low-value calculators. Kept: mortgage calculator, SDLT calculator, personalized affordability display, PDF generation. Total infrastructure cost: $0/mo.*
