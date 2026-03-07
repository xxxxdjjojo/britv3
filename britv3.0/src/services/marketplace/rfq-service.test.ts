import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createRfq,
  listUserRfqs,
  matchProvidersForRfq,
} from "./rfq-service";

// Mock geocoding
vi.mock("@/services/geocoding/postcodes-io", () => ({
  geocodePostcode: vi.fn().mockResolvedValue({
    postcode: "SW1A 1AA",
    latitude: 51.5014,
    longitude: -0.1419,
    admin_district: "Westminster",
    region: "London",
  }),
}));

// Mock inngest
vi.mock("@/inngest/client", () => ({
  inngest: {
    send: vi.fn().mockResolvedValue({ ids: ["test-event-id"] }),
  },
}));

// -- Helpers ------------------------------------------------------------------

function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const defaultChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  return {
    from: vi.fn().mockReturnValue({ ...defaultChain, ...overrides }),
  } as unknown;
}

const validRfqInput = {
  service_category: "plumber" as const,
  title: "Fix leaking pipe in bathroom urgently",
  description:
    "There is a leaking pipe under the bathroom sink that needs fixing as soon as possible. Water is dripping constantly and causing water damage.",
  property_postcode: "SW1A 1AA",
  urgency_level: "high" as const,
  budget_min: 100,
  budget_max: 500,
};

// -- Tests --------------------------------------------------------------------

describe("rfq-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createRfq", () => {
    it("should geocode postcode, insert, and send inngest event", async () => {
      const mockRfq = {
        id: "rfq-1",
        user_id: "user-1",
        ...validRfqInput,
        status: "open",
        quote_count: 0,
        view_count: 0,
      };

      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockRfq, error: null }),
        }),
      });

      const supabase = createMockSupabase({ insert: insertMock });
      const { geocodePostcode } = await import(
        "@/services/geocoding/postcodes-io"
      );
      const { inngest } = await import("@/inngest/client");

      const result = await createRfq(
        supabase as never,
        "user-1",
        validRfqInput,
      );

      expect(geocodePostcode).toHaveBeenCalledWith("SW1A 1AA");
      expect(insertMock).toHaveBeenCalled();
      expect(inngest.send).toHaveBeenCalledWith({
        name: "marketplace/rfq.created",
        data: { rfqId: "rfq-1" },
      });
      expect(result.id).toBe("rfq-1");
    });

    it("should throw on insert error", async () => {
      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "insert failed" },
          }),
        }),
      });

      const supabase = createMockSupabase({ insert: insertMock });

      await expect(
        createRfq(supabase as never, "user-1", validRfqInput),
      ).rejects.toThrow("Failed to create RFQ");
    });
  });

  describe("listUserRfqs", () => {
    it("should return paginated results", async () => {
      const mockRfqs = [
        { id: "rfq-1", title: "Test 1" },
        { id: "rfq-2", title: "Test 2" },
      ];

      const rangeMock = vi.fn().mockResolvedValue({
        data: mockRfqs,
        error: null,
        count: 2,
      });
      const orderMock = vi.fn().mockReturnValue({ range: rangeMock });
      const eqMock = vi.fn().mockReturnValue({ order: orderMock, eq: vi.fn().mockReturnValue({ order: orderMock }) });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      const supabase = {
        from: vi.fn().mockReturnValue({ select: selectMock }),
      } as unknown;

      const result = await listUserRfqs(
        supabase as never,
        "user-1",
        undefined,
        20,
        0,
      );

      expect(result.data).toHaveLength(2);
      expect(result.count).toBe(2);
    });
  });

  describe("matchProvidersForRfq", () => {
    it("should score providers by category, postcode, radius, and rating", async () => {
      const rfqData = {
        id: "rfq-1",
        service_category: "plumber",
        property_postcode: "SW1A 1AA",
      };

      const providers = [
        {
          user_id: "prov-1",
          business_name: "Plumber A",
          services: ["plumber"],
          service_postcodes: ["SW1A"],
          service_radius: 25,
        },
        {
          user_id: "prov-2",
          business_name: "Plumber B",
          services: ["plumber"],
          service_postcodes: ["E1"],
          service_radius: 10,
        },
      ];

      const ratingStats = [
        { provider_id: "prov-1", average_rating: 4.5 },
      ];

      const fromMock = vi.fn().mockImplementation((table: string) => {
        if (table === "service_requests") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: rfqData,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "service_provider_details") {
          return {
            select: vi.fn().mockReturnValue({
              contains: vi.fn().mockResolvedValue({
                data: providers,
                error: null,
              }),
            }),
          };
        }
        if (table === "provider_rating_stats") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: ratingStats,
                error: null,
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

      const result = await matchProvidersForRfq(supabase as never, "rfq-1");

      expect(result).toHaveLength(2);
      // Prov-1: category(50) + postcode(30) + proximity(20) + rating(10) = 110
      expect(result[0].user_id).toBe("prov-1");
      expect(result[0].score).toBe(110);
      // Prov-2: category(50) + proximity(20) = 70
      expect(result[1].user_id).toBe("prov-2");
      expect(result[1].score).toBe(70);
    });

    it("should return empty array when no providers match", async () => {
      const fromMock = vi.fn().mockImplementation((table: string) => {
        if (table === "service_requests") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "rfq-1",
                    service_category: "plumber",
                    property_postcode: "SW1A 1AA",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "service_provider_details") {
          return {
            select: vi.fn().mockReturnValue({
              contains: vi.fn().mockResolvedValue({
                data: [],
                error: null,
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
      const result = await matchProvidersForRfq(supabase as never, "rfq-1");
      expect(result).toHaveLength(0);
    });
  });
});
