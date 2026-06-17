/**
 * M3-A8 — Buyer/Renter discovery & tools: documented test gaps.
 *
 * This file records logic that *should* be unit-tested but cannot be tested
 * deterministically without editing source (which the M3 brief forbids).
 * Each gap is an `it.todo` carrying a `// FINDING:` note so the gap is visible
 * in the test report rather than silently skipped.
 *
 * No assertions are faked here — gaps are explicit.
 */

import { describe, it } from "vitest";

// ---------------------------------------------------------------------------
// Affordability calculator (income × 4.5 stress test)
// ---------------------------------------------------------------------------

describe("affordability calculator — income multiple + stress test", () => {
  // FINDING: The affordability logic (income multiplier 4.5 single / 4.0 joint,
  // 7% stress-rate monthly payment, commitment deductions, max borrowing & max
  // property price) lives INLINE in a useMemo inside the client page
  // src/app/(protected)/dashboard/[role]/calculators/page.tsx
  // (also (main)/tools/affordability-calculator/page.tsx). It is NOT extracted
  // into an exported pure function, so it cannot be unit-tested without editing
  // source. Recommend extracting to src/lib/calculators/affordability.ts.
  it.todo(
    "applies a 4.5x income multiple for a single applicant (needs extraction)",
  );
  it.todo(
    "applies a 4.0x income multiple for joint applicants (needs extraction)",
  );
  it.todo(
    "computes the 7% stress-rate monthly payment (needs extraction)",
  );
  it.todo(
    "reduces max borrowing by monthly financial commitments (needs extraction)",
  );
});

// ---------------------------------------------------------------------------
// Buy-vs-rent calculator
// ---------------------------------------------------------------------------

describe("buy-vs-rent calculator — multi-year projection", () => {
  // FINDING: The buy-vs-rent year-by-year projection (property growth, equity,
  // remaining mortgage balance, rent inflation, investment return on the
  // would-be deposit, and the SDLT cost via calculateSdlt) lives INLINE in a
  // useMemo inside the client page
  // src/app/(main)/tools/buy-vs-rent-calculator/page.tsx. It reads inputs from
  // URL params and useState and is not exported. Cannot be unit-tested without
  // editing source. Recommend extracting the projection loop to
  // src/lib/calculators/buy-vs-rent.ts. (The SDLT leg IS covered in
  // calculators.test.ts.)
  it.todo("projects equity vs invested-deposit over N years (needs extraction)");
  it.todo("includes SDLT in the total cost of buying (needs extraction)");
});

// ---------------------------------------------------------------------------
// Rental application apply form (zod validation)
// ---------------------------------------------------------------------------

describe("rental application apply form — zod validation", () => {
  // FINDING: applicationSchema (zod) is defined as a NON-exported const inside
  // the client page
  // src/app/(protected)/dashboard/[role]/applications/apply/[listingId]/page.tsx
  // and consumed via react-hook-form's zodResolver. The schema validates:
  //   applicant_name (1..200), applicant_email (email), employment_status (>=1),
  //   annual_income (coerced positive number), move_in_date (>=1),
  //   notes (optional, <=2000 chars).
  // Because the schema is not exported, its field-error behaviour cannot be unit
  // tested without editing source. Recommend exporting the schema (e.g. to
  // src/lib/validation/rental-application.ts) so both the form and tests can
  // import it.
  it.todo("rejects an empty applicant name (needs exported schema)");
  it.todo("rejects an invalid email (needs exported schema)");
  it.todo("rejects a non-positive annual income (needs exported schema)");
  it.todo("rejects a cover letter over 2000 chars (needs exported schema)");
  it.todo("accepts a fully valid application (needs exported schema)");
});

// ---------------------------------------------------------------------------
// AI-match preferences form + results scoring
// ---------------------------------------------------------------------------

describe("ai-match preferences form + match-score rendering", () => {
  // FINDING: The AI-match page
  // src/app/(protected)/dashboard/[role]/ai-match/page.tsx holds preferences
  // form state and match-score rendering inline; the scoring itself
  // (runMatchAnalysis) lives in src/services/ai/ai-match-service.ts and calls
  // the Anthropic SDK + Supabase (async, non-deterministic, network-bound).
  // The currency boundary helpers (gbpToPence/penceToGBP) used by the form ARE
  // covered in currency.test.ts. The form's own validation/score rendering is
  // not unit-testable deterministically here without mocking the full service
  // chain and editing the page to accept injected data. Recommend extracting a
  // presentational AiMatchResultCard component that takes match_score as a prop.
  it.todo("renders the match_score band/label for a given result (needs presentational extraction)");
  it.todo("validates the preferences form before submit (needs extraction)");
});

// ---------------------------------------------------------------------------
// Moving checklist (phase tabs + checkbox toggle)
// ---------------------------------------------------------------------------

describe("moving checklist — phase grouping + toggle", () => {
  // FINDING: The phase config (PHASES) and getPhaseForItem mapping are
  // NON-exported module-locals inside the client page
  // src/app/(protected)/dashboard/[role]/moving/page.tsx. The default checklist
  // template (DEFAULT_ITEMS) is a non-exported const in
  // src/services/moving/moving-checklist-service.ts, and the toggle/create
  // paths are async Supabase service functions. None are importable for
  // deterministic unit tests without editing source. Recommend exporting
  // getPhaseForItem + DEFAULT_ITEMS.
  it.todo("maps each offer_stage to its phase (needs exported getPhaseForItem)");
  it.todo("groups checklist items under the correct phase tab (needs extraction)");
});

// ---------------------------------------------------------------------------
// Viewings list (upcoming / past tabs, cancel)
// ---------------------------------------------------------------------------

describe("viewings list — upcoming/past tabs + cancel", () => {
  // FINDING: The renter/buyer viewings page
  // src/app/(protected)/dashboard/[role]/viewings/page.tsx renders server-fetched
  // viewing data with no exported presentational component splitting
  // upcoming vs past or owning the cancel action as a unit. The cancel flow is a
  // server action. Not deterministically unit-testable here without editing
  // source. Recommend a presentational ViewingsList component taking a viewings
  // array + onCancel callback.
  it.todo("splits viewings into upcoming and past tabs (needs presentational extraction)");
  it.todo("fires cancel for an upcoming viewing (needs presentational extraction)");
});

// ---------------------------------------------------------------------------
// Mock-only pages (KNOWN per brief) — do NOT assert these as working
// ---------------------------------------------------------------------------

describe("renter tenancy page — MOCK ONLY", () => {
  // FINDING: src/app/(protected)/dashboard/[role]/tenancy/page.tsx is fully
  // hardcoded static JSX (e.g. "2 Bed Flat, Stratford", "£1,750/mo",
  // "1 Mar 2026 — 28 Feb 2027"). No data wiring, no props. Marked mock-only by
  // the M3 brief; intentionally NOT tested as working.
  it.todo("renders real tenancy data (currently hardcoded mock — do not test as working)");
});

describe("generic offers page — MOCK ONLY", () => {
  // FINDING: src/app/(protected)/dashboard/[role]/offers/page.tsx builds its
  // list from a hardcoded `const offers: BuyerOffer[] = [...]` array (line ~95)
  // rather than fetched data. Marked mock-only by the M3 brief; intentionally
  // NOT tested as working.
  it.todo("renders real offers data (currently hardcoded mock — do not test as working)");
});
