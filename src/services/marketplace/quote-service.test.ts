import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createQuote,
  acceptQuote,
  declineQuote,
} from "./quote-service";

// -- Helpers ------------------------------------------------------------------

const validQuoteInput = {
  service_request_id: "rfq-1",
  line_items: [
    {
      description: "Pipe repair",
      quantity: 1,
      unit_price: 150,
      total: 150,
    },
    {
      description: "Call-out fee",
      quantity: 1,
      unit_price: 50,
      total: 50,
    },
  ],
  scope_of_work:
    "Fix leaking pipe under bathroom sink. Includes diagnosis, replacement of damaged section, and testing for leaks after repair.",
  estimated_duration: "2 hours",
  payment_terms: "50% upfront, 50% on completion",
  validity_date: new Date("2026-04-01"),
  vat_included: true,
};

// -- Tests --------------------------------------------------------------------

describe("quote-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createQuote", () => {
    it("should check provider exists and prevent duplicate quotes", async () => {
      const mockQuote = {
        id: "quote-1",
        service_request_id: "rfq-1",
        provider_id: "prov-1",
        total_amount: 200,
        status: "sent",
      };

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
          // First call: check existing, second call: insert
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  not: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: [], // No existing quote
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockQuote,
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

      const supabase = { from: fromMock } as unknown;

      const result = await createQuote(
        supabase as never,
        "prov-1",
        validQuoteInput,
      );

      expect(result.id).toBe("quote-1");
      expect(result.status).toBe("sent");
    });

    it("should throw when provider not found", async () => {
      const fromMock = vi.fn().mockImplementation((table: string) => {
        if (table === "service_provider_details") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "not found" },
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      });

      const supabase = { from: fromMock } as unknown;

      await expect(
        createQuote(supabase as never, "prov-1", validQuoteInput),
      ).rejects.toThrow("Provider profile not found");
    });

    it("includes a quote_signature (64-char hex) in the insert payload", async () => {
      let capturedInsertData: Record<string, unknown> | null = null;

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
            insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
              capturedInsertData = data;
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: "quote-new",
                      service_request_id: "rfq-1",
                      provider_id: "prov-1",
                      total_amount: 200,
                      status: "sent",
                      quote_signature: "placeholder",
                    },
                    error: null,
                  }),
                }),
              };
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
        return { select: vi.fn() };
      });

      const mockSupabase = { from: fromMock } as unknown as import("@supabase/supabase-js").SupabaseClient;

      await createQuote(mockSupabase, "prov-1", validQuoteInput);

      expect(capturedInsertData).not.toBeNull();
      expect(typeof capturedInsertData!.quote_signature).toBe("string");
      expect(capturedInsertData!.quote_signature as string).toMatch(/^[0-9a-f]{64}$/);
    });

    it("should throw when duplicate active quote exists", async () => {
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
                    data: [],
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
                    limit: vi.fn().mockResolvedValue({
                      data: [{ id: "existing-quote" }], // Existing active quote
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      });

      const supabase = { from: fromMock } as unknown;

      await expect(
        createQuote(supabase as never, "prov-1", validQuoteInput),
      ).rejects.toThrow("Active quote already exists");
    });
  });

  describe("acceptQuote", () => {
    it("should accept quote and decline others", async () => {
      const acceptedQuote = {
        id: "quote-1",
        service_request_id: "rfq-1",
        status: "accepted",
      };

      const fromMock = vi.fn().mockImplementation((table: string) => {
        if (table === "quotes") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "quote-1",
                    service_request_id: "rfq-1",
                    service_requests: { user_id: "user-1" },
                  },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: acceptedQuote,
                    error: null,
                  }),
                }),
                neq: vi.fn().mockReturnValue({
                  neq: vi.fn().mockResolvedValue({ error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "service_requests") {
          return {
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

      const supabase = { from: fromMock } as unknown;
      const result = await acceptQuote(supabase as never, "user-1", "quote-1");

      expect(result.status).toBe("accepted");
    });

    it("should throw when user does not own the RFQ", async () => {
      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "quote-1",
                service_request_id: "rfq-1",
                service_requests: { user_id: "other-user" },
              },
              error: null,
            }),
          }),
        }),
      });

      const supabase = { from: fromMock } as unknown;

      await expect(
        acceptQuote(supabase as never, "user-1", "quote-1"),
      ).rejects.toThrow("Only the RFQ owner can accept quotes");
    });

    it("should throw on unique constraint violation (race condition)", async () => {
      const fromMock = vi.fn().mockImplementation((table: string) => {
        if (table === "quotes") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "quote-1",
                    service_request_id: "rfq-1",
                    service_requests: { user_id: "user-1" },
                  },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: "23505", message: "unique violation" },
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      });

      const supabase = { from: fromMock } as unknown;

      await expect(
        acceptQuote(supabase as never, "user-1", "quote-1"),
      ).rejects.toThrow("already been accepted");
    });
  });

  describe("declineQuote", () => {
    it("should decline quote with reason", async () => {
      const declinedQuote = {
        id: "quote-1",
        status: "declined",
      };

      const fromMock = vi.fn().mockImplementation((table: string) => {
        if (table === "quotes") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "quote-1",
                    service_request_id: "rfq-1",
                    service_requests: { user_id: "user-1" },
                  },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: declinedQuote,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      });

      const supabase = { from: fromMock } as unknown;
      const result = await declineQuote(
        supabase as never,
        "user-1",
        "quote-1",
        "Too expensive",
      );

      expect(result.status).toBe("declined");
    });
  });
});
