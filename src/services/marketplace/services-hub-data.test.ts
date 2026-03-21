import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "@/__tests__/mocks/supabase";
import type { ServiceProviderPublicProfile } from "@/types/providers";

import {
  fetchTopRatedProviders,
  fetchCategoryCounts,
  FALLBACK_PROVIDERS,
  FALLBACK_COUNTS,
} from "./services-hub-data";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockProvider(
  overrides: Partial<ServiceProviderPublicProfile> = {}
): ServiceProviderPublicProfile {
  return {
    id: "prov-1",
    user_id: "user-1",
    slug: "test-plumber",
    business_name: "Test Plumber",
    tagline: "Best plumber in town",
    description: "We fix pipes.",
    services: ["plumber"],
    city: "London",
    service_postcodes: ["SW1A 1AA"],
    website_url: null,
    phone: null,
    years_experience: 10,
    qualifications: ["City & Guilds"],
    insurance_verified: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    profiles: {
      id: "user-1",
      avatar_url: null,
      full_name: "John Smith",
      provider_verification_status: "verified",
      email: "john@example.com",
    },
    provider_rating_stats: {
      provider_id: "prov-1",
      avg_rating: 4.8,
      total_reviews: 25,
      five_star: 20,
      four_star: 3,
      three_star: 1,
      two_star: 1,
      one_star: 0,
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("services-hub-data", () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockSupabaseClient();
  });

  // -------------------------------------------------------------------------
  // fetchTopRatedProviders
  // -------------------------------------------------------------------------

  describe("fetchTopRatedProviders", () => {
    it("returns providers from supabase ordered by rating", async () => {
      const providers = [
        makeMockProvider({ id: "p1", business_name: "Top Co", provider_rating_stats: { provider_id: "p1", avg_rating: 5.0, total_reviews: 10, five_star: 10, four_star: 0, three_star: 0, two_star: 0, one_star: 0 } }),
        makeMockProvider({ id: "p2", business_name: "Great Co", provider_rating_stats: { provider_id: "p2", avg_rating: 4.5, total_reviews: 8, five_star: 5, four_star: 3, three_star: 0, two_star: 0, one_star: 0 } }),
      ];

      // Override the mock chain to resolve with providers
      const chainable = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: providers, error: null }),
      };
      mockClient.from = vi.fn().mockReturnValue(chainable);

      const result = await fetchTopRatedProviders(mockClient as never);

      expect(result).toEqual(providers);
      expect(mockClient.from).toHaveBeenCalledWith("service_provider_details");
      expect(chainable.eq).toHaveBeenCalledWith(
        "profiles.provider_verification_status",
        "verified"
      );
      expect(chainable.limit).toHaveBeenCalledWith(6);
      expect(chainable.order).toHaveBeenCalledWith(
        "avg_rating",
        { referencedTable: "provider_rating_stats", ascending: false }
      );
    });

    it("returns empty array on error", async () => {
      const chainable = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "DB down", code: "500" },
        }),
      };
      mockClient.from = vi.fn().mockReturnValue(chainable);

      const result = await fetchTopRatedProviders(mockClient as never);

      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // fetchCategoryCounts
  // -------------------------------------------------------------------------

  describe("fetchCategoryCounts", () => {
    it("returns correct counts per category", async () => {
      const rows = [
        { services: ["plumber", "handyman"] },
        { services: ["plumber"] },
        { services: ["electrician", "handyman"] },
        { services: null },
      ];

      const chainable = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: rows, error: null }),
      };
      mockClient.from = vi.fn().mockReturnValue(chainable);

      const result = await fetchCategoryCounts(mockClient as never);

      expect(result).toEqual({
        plumber: 2,
        handyman: 2,
        electrician: 1,
      });
    });

    it("returns empty object on error", async () => {
      const chainable = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "DB error", code: "500" },
        }),
      };
      mockClient.from = vi.fn().mockReturnValue(chainable);

      const result = await fetchCategoryCounts(mockClient as never);

      expect(result).toEqual({});
    });
  });

  // -------------------------------------------------------------------------
  // Fallback constants
  // -------------------------------------------------------------------------

  describe("FALLBACK_PROVIDERS", () => {
    it("has 4 items", () => {
      expect(FALLBACK_PROVIDERS).toHaveLength(4);
    });

    it("each item matches ServiceProviderPublicProfile shape", () => {
      for (const p of FALLBACK_PROVIDERS) {
        expect(p).toHaveProperty("id");
        expect(p).toHaveProperty("user_id");
        expect(p).toHaveProperty("slug");
        expect(p).toHaveProperty("business_name");
        expect(p).toHaveProperty("services");
        expect(p).toHaveProperty("profiles");
        expect(p).toHaveProperty("provider_rating_stats");
        expect(p.profiles).toHaveProperty("provider_verification_status", "verified");
        expect(Array.isArray(p.services)).toBe(true);
        expect(p.services.length).toBeGreaterThan(0);
      }
    });
  });

  describe("FALLBACK_COUNTS", () => {
    it("has entries for 8 popular categories", () => {
      const keys = Object.keys(FALLBACK_COUNTS);
      expect(keys.length).toBe(8);
    });

    it("all values are positive numbers", () => {
      for (const count of Object.values(FALLBACK_COUNTS)) {
        expect(typeof count).toBe("number");
        expect(count).toBeGreaterThan(0);
      }
    });
  });
});
