import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks (before importing the services under test)
// ---------------------------------------------------------------------------

const createPlatformEvent = vi.fn().mockResolvedValue({ id: 1 });
vi.mock(
  "@/services/notifications/notification-service",
  async (importOriginal) => {
    const original = await importOriginal<Record<string, unknown>>();
    return {
      ...original,
      createPlatformEvent: (...a: unknown[]) => createPlatformEvent(...a),
    };
  },
);

vi.mock("@/lib/marketplace/quote-signer", () => ({
  signQuote: vi.fn(() => "sig"),
}));

vi.mock("@/lib/observability/capture-exception", () => ({
  captureException: vi.fn(),
  getErrorMessage: (e: unknown) => (e instanceof Error ? e.message : String(e)),
}));

import { createQuote } from "@/services/marketplace/quote-service";
import { sendQuote } from "@/services/provider/provider-quote-service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_QUOTE_INPUT = {
  service_request_id: "rfq-1",
  line_items: [
    { description: "Pipe repair", quantity: 1, unit_price: 150, total: 150 },
    { description: "Call-out fee", quantity: 1, unit_price: 50, total: 50 },
  ],
  scope_of_work:
    "Fix leaking pipe under bathroom sink. Includes diagnosis, replacement of damaged section, and testing for leaks after repair.",
  estimated_duration: "2 hours",
  payment_terms: "50% upfront, 50% on completion",
  validity_date: new Date("2099-04-01"),
  vat_included: true,
};

/**
 * Per-table supabase mock for the marketplace createQuote flow
 * (provider lookup, verification docs, duplicate check + insert, RFQ counters).
 */
function makeCreateQuoteSupabase() {
  const fromMock = vi.fn().mockImplementation((table: string) => {
    if (table === "service_provider_details") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { user_id: "prov-1" },
              error: null,
            }),
          }),
        }),
      };
    }
    if (table === "provider_documents") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [{ verification_status: "approved" }],
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    if (table === "quotes") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "quote-1",
                service_request_id: "rfq-1",
                provider_id: "prov-1",
                total_amount: 200,
                status: "sent",
              },
              error: null,
            }),
          }),
        }),
      };
    }
    if (table === "service_requests") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { quote_count: 0, status: "open" },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    }
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };
  });
  return { from: fromMock };
}

/**
 * Per-table supabase mock for the provider sendQuote flow
 * (draft fetch via maybeSingle, then update -> sent).
 */
function makeSendQuoteSupabase(draftQuote: Record<string, unknown>) {
  const fromMock = vi.fn().mockImplementation(() => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: draftQuote,
            error: null,
          }),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...draftQuote, status: "sent" },
              error: null,
            }),
          }),
        }),
      }),
    }),
  }));
  return { from: fromMock };
}

beforeEach(() => {
  createPlatformEvent.mockClear();
  createPlatformEvent.mockResolvedValue({ id: 1 });
  process.env.QUOTE_SIGNING_SECRET = "test-secret";
});

// ---------------------------------------------------------------------------
// createQuote (marketplace quote-service)
// ---------------------------------------------------------------------------

describe("createQuote emits quote_received", () => {
  it("fires a quote_received platform event for the RFQ after insert", async () => {
    const supabase = makeCreateQuoteSupabase();

    const result = await createQuote(
      supabase as never,
      "prov-1",
      VALID_QUOTE_INPUT,
    );

    expect(result.id).toBe("quote-1");
    expect(createPlatformEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        event_type: "quote_received",
        entity_type: "rfq",
        entity_id: "rfq-1",
        actor_id: "prov-1",
        metadata: expect.objectContaining({
          quote_id: "quote-1",
          total_amount: 200,
        }),
      }),
    );
  });

  it("never blocks quote creation when the notification fails", async () => {
    createPlatformEvent.mockRejectedValueOnce(new Error("notify boom"));
    const supabase = makeCreateQuoteSupabase();

    const result = await createQuote(
      supabase as never,
      "prov-1",
      VALID_QUOTE_INPUT,
    );

    expect(result.id).toBe("quote-1");
    expect(createPlatformEvent).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// sendQuote (provider-quote-service)
// ---------------------------------------------------------------------------

describe("sendQuote emits quote_received", () => {
  const DRAFT_QUOTE = {
    id: "quote-7",
    provider_id: "prov-1",
    service_request_id: "rfq-9",
    quote_number: "QT-2026-0001",
    line_items: [],
    total_amount: 45000,
    status: "draft",
    validity_date: null,
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
  };

  it("fires a quote_received platform event when a draft quote is sent", async () => {
    const supabase = makeSendQuoteSupabase(DRAFT_QUOTE);

    const result = await sendQuote(supabase as never, "prov-1", "quote-7");

    expect(result.status).toBe("sent");
    expect(createPlatformEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        event_type: "quote_received",
        entity_type: "rfq",
        entity_id: "rfq-9",
        actor_id: "prov-1",
        metadata: expect.objectContaining({
          quote_id: "quote-7",
          total_amount: 45000,
        }),
      }),
    );
  });

  it("does not emit for standalone quotes with no linked RFQ", async () => {
    const supabase = makeSendQuoteSupabase({
      ...DRAFT_QUOTE,
      service_request_id: null,
    });

    const result = await sendQuote(supabase as never, "prov-1", "quote-7");

    expect(result.status).toBe("sent");
    expect(createPlatformEvent).not.toHaveBeenCalled();
  });

  it("never blocks sending when the notification fails", async () => {
    createPlatformEvent.mockRejectedValueOnce(new Error("notify boom"));
    const supabase = makeSendQuoteSupabase(DRAFT_QUOTE);

    const result = await sendQuote(supabase as never, "prov-1", "quote-7");

    expect(result.status).toBe("sent");
    expect(createPlatformEvent).toHaveBeenCalled();
  });
});
