# QA Report: Group C -- Interaction Flows (Code Audit)

**Date:** 2026-03-20
**Method:** Source code audit (no browser -- CSP blocked)
**Branch:** `feature/buyer-auth-flow-fixes`

---

## Summary

| Flow | Status | Severity |
|------|--------|----------|
| C-01: Compare providers -- full cycle | PASS (minor gaps) | P3 |
| C-02: Compare persistence | PASS | -- |
| C-03: Quote Modal -- validation & errors | PASS (minor gap) | P3 |
| C-04: Search filters -- URL state persistence | PASS | -- |
| C-05: Sort options | FAIL | P1 |
| C-06: Quote Comparison | PASS | -- |

**Overall verdict:** 1 P1 bug (sort is non-functional end-to-end), 2 P3 minor gaps.

---

## C-01: Compare Providers -- Full Cycle

### Files audited
- `src/components/compare/useCompare.ts`
- `src/components/compare/CompareTable.tsx`
- `src/components/providers/CompareButton.tsx`
- `src/components/providers/CompareBar.tsx`
- `src/app/(main)/compare/page.tsx`

### Findings

**useCompare.ts** -- PASS
- localStorage key: `britestate_compare`
- `MAX_COMPARE = 3` -- correct
- `add()` checks `current.length >= MAX_COMPARE` and `current.includes(id)` before adding -- correct
- `remove()` filters by id, writes back to localStorage -- correct
- `readStorage()` called on mount via `useEffect` -- correct
- Exposes `ids`, `add`, `remove`, `count`, `isFull`, `has`, `clearAll` -- complete API
- Error handling wraps all localStorage access in try/catch -- good

**CompareTable.tsx** -- PASS (minor gaps)
- 3-column layout via `slots` array padded to length 3 -- correct
- Avatar: renders `<img>` with `avatar_url` or fallback initial -- correct
- Name: `full_name` + `business_name` -- correct
- Verification: checks `provider_verification_status === "verified"` with ShieldCheck badge -- correct
- Stars: custom `StarDisplay` component with 5-star fill logic and numeric rating -- correct
- Services row: **MISSING** -- the rows array has Overall Rating, Reviews, Verified, Response Time, Price Range, Coverage Area, Qualifications -- but no explicit "Services" row listing the provider's service types
- Pricing: `formatPricing()` handles hourly, fixed, quote types and fallback -- correct
- Coverage: `formatCoverage()` shows first 3 postcodes with "+N more" -- correct
- EmptySlot: links to `/services` with Plus icon and "Add a Provider" text -- correct

> **P3 Gap:** No "Services" comparison row in CompareTable. The plan specifies comparing services offered, but only qualifications/accreditations are shown.

**CompareButton.tsx** -- PASS
- Toggle state: "Compare" (default) vs "Remove from Compare" (when added) -- correct
- Disabled state: shows "Compare Full" with `disabled` attribute when `isFull` -- correct
- `aria-label`: present on both Add (`Add ${providerName} to comparison`) and Remove (`Remove ${providerName} from comparison`) states -- correct
- Missing `aria-label` on disabled "Compare Full" button -- minor a11y gap but not blocking

**CompareBar.tsx** -- PASS
- Fixed bottom bar (`fixed bottom-0 left-0 right-0 z-50`) -- correct floating behavior
- Shows count: `{count} of 3 providers selected` -- correct
- Links to `/compare` via Next.js `<Link>` -- correct
- "Clear All" button calls `clearAll()` -- correct
- Hidden when `count === 0` -- correct
- `role="status"` + `aria-live="polite"` -- good a11y

**Compare page** -- PASS
- Empty state: `GitCompareArrows` icon, "No providers to compare" heading, "Find Providers" CTA linking to `/services` -- all correct
- Fetches providers from Supabase `service_provider_details` with full select including `profiles` and `provider_rating_stats` -- correct
- Loading spinner shown while fetching -- correct
- Renders `<CompareTable>` when providers exist -- correct

---

## C-02: Compare Persistence

### Findings -- PASS

- `useCompare` reads from localStorage on mount via `useEffect(() => setIds(readStorage()), [])` -- correct
- `CompareButton` calls `useCompare()` which reads localStorage state -- each instance gets fresh state on mount
- `has(id)` checks against the `ids` state array, which is populated from localStorage -- correct
- **Potential issue:** Because `useCompare` is a hook (not a context/store), multiple instances on the same page will each have independent state. If CompareButton A adds a provider, CompareButton B won't reflect the change until navigation/remount. This is a known React pattern limitation but works correctly across page navigations.

---

## C-03: Quote Modal -- Validation & Errors

### File audited
- `src/components/providers/QuoteModal.tsx`

### Findings -- PASS (minor gap)

**3-step form:** Steps 1 (Job Details), 2 (Contact Details), 3 (Confirmation) -- correct

**Step 1 validation:**
- `step1Valid` requires: `budget` non-empty, `timeline` non-empty, `description.length >= 20` -- correct
- Service type: shown only if services array is non-empty, but NOT required for step1Valid -- deviation from plan (plan says service is a required field)
- Date: marked as optional -- correct
- "Next" button disabled when `!step1Valid` -- correct

> **P3 Gap:** `service` and `date` are listed as required Zod validation fields in the plan, but in the implementation: service is optional (only shown if services exist, not validated), date is explicitly optional, and there is NO Zod schema -- validation is done with inline boolean checks instead.

**Step 2 validation:**
- `step2Valid` requires: `name` non-empty, `email` non-empty, email matches regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` -- correct email format validation
- Phone is optional -- correct

**Submit behavior:**
- Button disabled when `!step2Valid || submitting` -- correct
- Button text changes to "Sending..." during submission -- correct
- Error state: `submitError` displayed in red alert box -- correct
- No explicit "Retry" button, but the submit button remains available after error -- functionally equivalent

**Supabase insert:**
- Inserts into `provider_leads` table with `provider_id`, `contact_name`, `contact_email`, `contact_phone`, `service_type`, `preferred_date`, `description`, `source` -- correct
- Budget and timeline from the form are NOT inserted into the database -- data loss bug (form collects budget/timeline but doesn't persist them)

**Step 3:**
- Shows CheckCircle icon, "Request Sent!" heading, "Done" button to close -- correct

---

## C-04: Search Filters -- URL State Persistence

### File audited
- `src/components/providers/ProviderSearchPage.tsx`
- `src/components/marketplace/SearchFilters.tsx`

### Findings -- PASS

**Filters sync to URL params:**
- `buildPageUrl()` constructs URL params from filters: `category`, `postcode`, `radius`, `min_rating`, `q` (search_query), `sort` -- correct
- `router.replace(pageUrl, { scroll: false })` updates URL without page reload -- correct

**URL params pre-fill filters on load:**
- `readFiltersFromSearchParams()` reads from `useSearchParams()`: `category`, `postcode`, `radius`, `min_rating`, `q`, `verification_badges`, `min_hourly_rate`, `max_hourly_rate` -- correct
- Initial state set via `useState(() => readFiltersFromSearchParams(...))` -- correct

**Filter changes update URL:**
- `useEffect` watches `[filters, sort]` and calls `router.replace()` on change -- correct
- First render is skipped via `isFirstRender` ref to avoid double-fetch -- good

---

## C-05: Sort Options

### Findings -- FAIL (P1)

**Frontend sort options exist:**
- `SORT_OPTIONS` array: `best_match`, `highest_rated`, `most_reviews`, `newest` -- matches plan requirements (Highest Rated, Most Reviews, Newest all present)
- Sort `<select>` dropdown renders correctly in the results header

**Sort is NOT passed to the API:**
- `buildSearchUrl()` appends `sort` to the URL query string -- correct
- **BUT** `src/app/api/providers/search/route.ts` NEVER reads the `sort` parameter from the request
- The `providerSearchSchema` (Zod) has no `sort` field
- `searchProviders()` service function has no sort parameter -- it calls `supabase.rpc("search_providers")` which returns results in whatever order the RPC returns
- **Result: The sort dropdown is entirely cosmetic. Changing it triggers a re-fetch, but the results come back in the same order regardless of sort selection.**

> **P1 BUG:** Sort options are non-functional. The sort parameter is sent by the client but ignored by the API route, schema validator, and service layer. Users selecting "Highest Rated" or "Newest" will see no change in results order.

---

## C-06: Quote Comparison

### File audited
- `src/components/marketplace/QuoteComparison.tsx`

### Findings -- PASS

**Cards with provider name and RatingStars:**
- Each `QuoteColumn` renders `CardTitle` with `quote.provider_name` -- correct
- `<RatingStars rating={quote.provider_rating} size="sm" />` with review count -- correct

**GBP total with Intl.NumberFormat:**
- `const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" })` -- correct
- Total displayed as `gbp.format(quote.total_amount)` in 2xl bold -- correct

**Line items table:**
- `LineItemsTable` renders Item, Qty, Price, Total columns -- correct
- Each line item shows `description`, `quantity`, `unit_price`, `total` -- correct

**Cheapest highlighted "Best Value":**
- `findExtremes()` identifies cheapest and most expensive quotes -- correct
- Cheapest gets: `ring-2 ring-green-500/50` card border + green "Best value" badge -- correct
- Most expensive gets: "Highest" outline badge -- bonus feature, not required but nice

**"Accept Quote" button:**
- `<Button onClick={handleAccept} disabled={accepting || quote.status !== "sent"}>` -- correct
- Shows "Accept Quote" text or animated check when accepting -- correct
- Disabled for non-"sent" quotes -- correct

**Empty state:**
- AlertCircle icon + "No quotes to compare yet." -- correct

---

## Bug Summary

| # | Severity | Component | Description |
|---|----------|-----------|-------------|
| 1 | **P1** | ProviderSearchPage + API route | Sort dropdown is non-functional: `sort` param sent by client but never read/used by API route, Zod schema, or `searchProviders()` service. All sort options return identical results. |
| 2 | P3 | QuoteModal | `budget` and `timeline` collected in Step 1 but NOT included in the `provider_leads` insert -- data is lost on submit. |
| 3 | P3 | QuoteModal | No Zod schema validation; uses inline boolean checks. `service` and `date` listed as required in plan but implemented as optional. |
| 4 | P3 | CompareTable | No "Services" comparison row showing each provider's service types. |
| 5 | P3 | CompareButton | "Compare Full" disabled button missing `aria-label` for screen readers. |
| 6 | P3 | useCompare | Multiple hook instances on same page have independent state -- adding via one CompareButton won't reflect in another until remount. Consider a context/store pattern. |

---

## Recommendations

1. **P1 Fix -- Sort:** Add `sort` to `providerSearchSchema`, parse it in the API route, and either pass it to the RPC or apply post-query sorting in `searchProviders()`. Map `highest_rated` to `average_rating DESC`, `most_reviews` to `total_reviews DESC`, `newest` to `created_at DESC`.

2. **P3 Fix -- QuoteModal data loss:** Add `budget` and `timeline` columns to `provider_leads` table (or use a JSON `metadata` column) and include them in the insert payload.

3. **P3 Fix -- CompareTable services row:** Add a row rendering `provider.services.join(", ")` to the rows array.

4. **P3 Fix -- useCompare shared state:** Wrap compare state in a React context provider (or use Zustand) so all CompareButton instances on the same page share state without needing remount.
