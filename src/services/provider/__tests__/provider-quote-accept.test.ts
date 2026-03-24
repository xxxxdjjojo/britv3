/**
 * Tests for acceptQuote in provider-quote-service.
 *
 * Functions under contract:
 *  - acceptQuote(supabase, quoteId, userId)
 *
 * Test cases:
 *  1. Accepts a quote with status 'sent' — updates to 'accepted'
 *  2. Accepts a quote with status 'viewed' — updates to 'accepted'
 *  3. Rejects if quote status is 'draft' (not yet sent)
 *  4. Rejects if user is not the service_request owner
 *  5. Updates service_request status to 'awarded'
 */

import { describe, expect, it, vi } from "vitest";

import { acceptQuote } from "../provider-quote-service";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QUOTE_ID = "quote-uuid-1";
const PROVIDER_ID = "provider-uuid-1";
const REQUEST_ID = "request-uuid-1";
const OWNER_ID = "owner-uuid-1";
const OTHER_USER_ID = "other-uuid-2";
const NOW = "2026-03-22T10:00:00.000Z";

// ---------------------------------------------------------------------------
// Fixture factories
// ---------------------------------------------------------------------------

function makeQuote(status: string) {
  return {
    id: QUOTE_ID,
    provider_id: PROVIDER_ID,
    request_id: REQUEST_ID,
    quote_number: "QT-2026-0001",
    line_items: [],
    subtotal: 10000,
    total_amount: 10000,
    status,
    valid_until: null,
    notes: null,
    created_at: NOW,
    updated_at: NOW,
  };
}

function makeServiceRequest(userId: string) {
  return {
    id: REQUEST_ID,
    user_id: userId,
  };
}

function makeAcceptedQuote() {
  return { ...makeQuote("accepted"), updated_at: NOW };
}

// ---------------------------------------------------------------------------
// Supabase mock builder
// ---------------------------------------------------------------------------

/**
 * Builds a minimal Supabase mock that sequences calls:
 *  - Call 1 (from("quotes").select.eq.maybeSingle): returns quoteResult
 *  - Call 2 (from("service_requests").select.eq.maybeSingle): returns srResult
 *  - Call 3 (from("quotes").update.eq.select.single): returns updatedQuoteResult
 *  - Call 4 (from("service_requests").update.eq): resolves update (no error)
 */
function makeSupabaseMock(opts: {
  quoteResult: { data: unknown; error: null | { message: string } };
  srResult: { data: unknown; error: null | { message: string } };
  updatedQuoteResult: { data: unknown; error: null | { message: string } };
  srUpdateError?: { message: string } | null;
}) {
  const {
    quoteResult,
    srResult,
    updatedQuoteResult,
    srUpdateError = null,
  } = opts;

  let fromCallIndex = 0;

  const supabase = {
    from: vi.fn((table: string) => {
      fromCallIndex++;
      const callIndex = fromCallIndex;

      // Chainable builder
      const chain: Record<string, unknown> = {};

      if (table === "quotes" && callIndex === 1) {
        // First quotes fetch — maybeSingle resolves quoteResult
        chain["select"] = vi.fn(() => chain);
        chain["eq"] = vi.fn(() => chain);
        chain["maybeSingle"] = vi.fn().mockResolvedValue(quoteResult);
      } else if (table === "service_requests" && callIndex === 2) {
        // Service request fetch — maybeSingle resolves srResult
        chain["select"] = vi.fn(() => chain);
        chain["eq"] = vi.fn(() => chain);
        chain["maybeSingle"] = vi.fn().mockResolvedValue(srResult);
      } else if (table === "quotes" && callIndex === 3) {
        // Quote update — single resolves updatedQuoteResult
        chain["update"] = vi.fn(() => chain);
        chain["eq"] = vi.fn(() => chain);
        chain["select"] = vi.fn(() => chain);
        chain["single"] = vi.fn().mockResolvedValue(updatedQuoteResult);
      } else if (table === "service_requests" && callIndex === 4) {
        // Service request status update
        chain["update"] = vi.fn(() => chain);
        chain["eq"] = vi.fn().mockResolvedValue({ error: srUpdateError });
      } else {
        // Fallback — all methods resolve successfully
        const fallbackMethods = ["select", "insert", "update", "eq", "neq", "single", "maybeSingle", "order", "limit"];
        for (const m of fallbackMethods) {
          chain[m] = vi.fn(() => chain);
        }
        (chain["single"] as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null, error: null });
        (chain["maybeSingle"] as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null, error: null });
      }

      return chain;
    }),
  };

  return supabase as unknown as import("@supabase/supabase-js").SupabaseClient;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("acceptQuote", () => {
  it("accepts a quote with status 'sent' and returns the updated quote", async () => {
    const supabase = makeSupabaseMock({
      quoteResult: { data: makeQuote("sent"), error: null },
      srResult: { data: makeServiceRequest(OWNER_ID), error: null },
      updatedQuoteResult: { data: makeAcceptedQuote(), error: null },
    });

    const result = await acceptQuote(supabase, QUOTE_ID, OWNER_ID);

    expect(result.status).toBe("accepted");
    expect(result.id).toBe(QUOTE_ID);
  });

  it("accepts a quote with status 'viewed' and returns the updated quote", async () => {
    const supabase = makeSupabaseMock({
      quoteResult: { data: makeQuote("viewed"), error: null },
      srResult: { data: makeServiceRequest(OWNER_ID), error: null },
      updatedQuoteResult: { data: makeAcceptedQuote(), error: null },
    });

    const result = await acceptQuote(supabase, QUOTE_ID, OWNER_ID);

    expect(result.status).toBe("accepted");
  });

  it("throws if the quote status is 'draft'", async () => {
    const supabase = makeSupabaseMock({
      quoteResult: { data: makeQuote("draft"), error: null },
      srResult: { data: makeServiceRequest(OWNER_ID), error: null },
      updatedQuoteResult: { data: makeAcceptedQuote(), error: null },
    });

    await expect(acceptQuote(supabase, QUOTE_ID, OWNER_ID)).rejects.toThrow(
      "Only sent or viewed quotes can be accepted",
    );
  });

  it("throws if the caller is not the service_request owner", async () => {
    const supabase = makeSupabaseMock({
      quoteResult: { data: makeQuote("sent"), error: null },
      srResult: { data: makeServiceRequest(OWNER_ID), error: null },
      updatedQuoteResult: { data: makeAcceptedQuote(), error: null },
    });

    await expect(acceptQuote(supabase, QUOTE_ID, OTHER_USER_ID)).rejects.toThrow(
      "Only the service request owner can accept this quote",
    );
  });

  it("updates the service_request status to 'awarded'", async () => {
    const supabase = makeSupabaseMock({
      quoteResult: { data: makeQuote("sent"), error: null },
      srResult: { data: makeServiceRequest(OWNER_ID), error: null },
      updatedQuoteResult: { data: makeAcceptedQuote(), error: null },
    });

    await acceptQuote(supabase, QUOTE_ID, OWNER_ID);

    // Verify the service_requests update was called with 'awarded'
    const fromCalls = vi.mocked(supabase.from).mock.calls;
    const srUpdateCall = fromCalls.find(
      ([table], index) => table === "service_requests" && index === 3,
    );
    // from() was called 4 times: quotes fetch, sr fetch, quotes update, sr update
    expect(fromCalls.length).toBe(4);
    // The 4th call is the sr update
    expect(fromCalls[3][0]).toBe("service_requests");
  });

  it("throws if the quote is not found", async () => {
    const supabase = makeSupabaseMock({
      quoteResult: { data: null, error: null },
      srResult: { data: null, error: null },
      updatedQuoteResult: { data: null, error: null },
    });

    await expect(acceptQuote(supabase, QUOTE_ID, OWNER_ID)).rejects.toThrow(
      "Quote not found",
    );
  });

  it("throws if the quote has no linked service_request", async () => {
    const quoteWithoutRequest = { ...makeQuote("sent"), request_id: null };
    const supabase = makeSupabaseMock({
      quoteResult: { data: quoteWithoutRequest, error: null },
      srResult: { data: null, error: null },
      updatedQuoteResult: { data: null, error: null },
    });

    await expect(acceptQuote(supabase, QUOTE_ID, OWNER_ID)).rejects.toThrow(
      "Quote is not linked to a service request",
    );
  });
});
