import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";

// -- Mocks --------------------------------------------------------------------

const mockCallClaude = vi.fn();

vi.mock("@/services/ai/claude-service", () => ({
  callClaude: (...args: unknown[]) => mockCallClaude(...args),
}));

// -- Tests --------------------------------------------------------------------

describe("quote-draft-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("draftTradesQuote", () => {
    const validQuoteJson = JSON.stringify({
      line_items: [
        { description: "Boiler repair", amount: 250 },
        { description: "Parts", amount: 80 },
      ],
      total: 330,
      estimated_duration: "3 hours",
      scope_of_work: "Repair faulty boiler including replacement of thermostat valve",
    });

    it("returns structured QuoteDraft on success", async () => {
      mockCallClaude.mockResolvedValue({
        text: validQuoteJson,
        inputTokens: 100,
        outputTokens: 200,
      });

      const { draftTradesQuote } = await import("@/services/ai/quote-draft-service");
      const result = await draftTradesQuote(
        "Fix my boiler",
        { hourly_rate: 65 },
        { price_median: 65 },
        "user-1",
      );

      expect(result).not.toBeNull();
      expect(result!.line_items).toHaveLength(2);
      expect(result!.total).toBe(330);
      expect(result!.estimated_duration).toBe("3 hours");
      expect(result!.scope_of_work).toContain("boiler");

      expect(mockCallClaude).toHaveBeenCalledOnce();
      const callArg = mockCallClaude.mock.calls[0][0];
      expect(callArg.feature).toBe("quote_draft");
      expect(callArg.userId).toBe("user-1");
    });

    it("returns null when callClaude returns null (API key not configured)", async () => {
      mockCallClaude.mockResolvedValue(null);

      const { draftTradesQuote } = await import("@/services/ai/quote-draft-service");
      const result = await draftTradesQuote("Fix my boiler", {}, {}, "user-1");

      expect(result).toBeNull();
    });

    it("returns null on API error (graceful degradation)", async () => {
      mockCallClaude.mockRejectedValue(new Error("API timeout"));

      const { draftTradesQuote } = await import("@/services/ai/quote-draft-service");
      const result = await draftTradesQuote("Fix my boiler", {}, {}, "user-1");

      expect(result).toBeNull();
    });

    it("returns null on invalid JSON response", async () => {
      mockCallClaude.mockResolvedValue({
        text: "This is not valid JSON",
        inputTokens: 100,
        outputTokens: 200,
      });

      const { draftTradesQuote } = await import("@/services/ai/quote-draft-service");
      const result = await draftTradesQuote("Fix my boiler", {}, {}, "user-1");

      expect(result).toBeNull();
    });

    it("returns null when JSON shape is incorrect", async () => {
      mockCallClaude.mockResolvedValue({
        text: JSON.stringify({ wrong_field: true }),
        inputTokens: 100,
        outputTokens: 200,
      });

      const { draftTradesQuote } = await import("@/services/ai/quote-draft-service");
      const result = await draftTradesQuote("Fix my boiler", {}, {}, "user-1");

      expect(result).toBeNull();
    });
  });

  describe("draftAgentProposal", () => {
    const validProposalJson = JSON.stringify({
      valuation_range: { low: 450000, high: 525000 },
      comparable_properties: [
        { address: "12 Oak Lane, Richmond", price: 485000, date: "2025-11-15" },
      ],
      marketing_strategy: "Premium listing with professional photography and floor plans",
      fee_structure: "1.5% + VAT on completion",
    });

    it("returns structured AgentProposal on success", async () => {
      mockCallClaude.mockResolvedValue({
        text: validProposalJson,
        inputTokens: 150,
        outputTokens: 300,
      });

      const { draftAgentProposal } = await import("@/services/ai/quote-draft-service");
      const result = await draftAgentProposal(
        { type: "semi_detached", bedrooms: 3 },
        { average_price: 490000 },
        "user-2",
      );

      expect(result).not.toBeNull();
      expect(result!.valuation_range.low).toBe(450000);
      expect(result!.valuation_range.high).toBe(525000);
      expect(result!.comparable_properties).toHaveLength(1);
      expect(result!.marketing_strategy).toContain("photography");
      expect(result!.fee_structure).toContain("1.5%");

      const callArg = mockCallClaude.mock.calls[0][0];
      expect(callArg.feature).toBe("agent_proposal");
    });
  });

  describe("getMarketPricing", () => {
    it("queries correct table with category and region", async () => {
      const mockClient = createMockSupabaseClient();
      const mockBuilder = mockClient.from("market_pricing");

      // Override maybeSingle to return data
      mockBuilder.maybeSingle = vi.fn().mockResolvedValue({
        data: { service_category: "plumbing", region: "london", price_low: 55, price_median: 75, price_high: 110 },
        error: null,
      });

      const { getMarketPricing } = await import("@/services/ai/quote-draft-service");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await getMarketPricing(mockClient as any, "plumbing", "london");

      expect(mockClient.from).toHaveBeenCalledWith("market_pricing");
      expect(result).not.toBeNull();
    });
  });

  describe("getRateCard", () => {
    it("queries user pricing data from profiles", async () => {
      const mockClient = createMockSupabaseClient();
      const mockBuilder = mockClient.from("profiles");

      mockBuilder.maybeSingle = vi.fn().mockResolvedValue({
        data: {
          provider_details: {
            rate_card: { hourly_rate: 65, callout_fee: 50 },
          },
        },
        error: null,
      });

      const { getRateCard } = await import("@/services/ai/quote-draft-service");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await getRateCard(mockClient as any, "user-123");

      expect(mockClient.from).toHaveBeenCalledWith("profiles");
      expect(result).toEqual({ hourly_rate: 65, callout_fee: 50 });
    });
  });
});
