import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FeaturedExpertRow } from "@/types/sponsored-placements";

import { getFeaturedExperts } from "./placement-service";

function expertRow(overrides: Partial<FeaturedExpertRow> = {}): FeaturedExpertRow {
  return {
    placement_id: "pl",
    provider_id: "pr",
    business_name: "Biz",
    slug: "biz",
    avatar_url: null,
    services: ["plumber"],
    service_postcodes: ["W5"],
    category: "plumber",
    placement_type: "category_leader",
    region_scope: "London",
    town: "Ealing",
    postcode_district: "W5",
    average_rating: 4.5,
    total_reviews: 10,
    response_rate: 80,
    response_time_hours: 3,
    years_in_business: 5,
    completed_jobs_count: 30,
    business_description: "desc",
    qualifications: ["Gas Safe"],
    portfolio_urls: ["x.jpg"],
    location_match: "postcode",
    admin_featured: false,
    priority_override: null,
    budget_remaining: true,
    ...overrides,
  };
}

function rpcMock(rows: FeaturedExpertRow[]) {
  return { rpc: vi.fn().mockResolvedValue({ data: rows, error: null }) };
}

describe("getFeaturedExperts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls the featured_experts_for RPC with location and category params", async () => {
    const supabase = rpcMock([expertRow()]);
    await getFeaturedExperts(supabase as never, {
      postcodeDistrict: "W5",
      town: "Ealing",
      region: "London",
      categories: ["plumber"],
      limit: 3,
    });
    expect(supabase.rpc).toHaveBeenCalledWith(
      "featured_experts_for",
      expect.objectContaining({
        p_postcode_district: "W5",
        p_town: "Ealing",
        p_categories: ["plumber"],
      }),
    );
  });

  it("ranks experts and limits to the requested count", async () => {
    const supabase = rpcMock([
      expertRow({ placement_id: "a", provider_id: "a", average_rating: 2.0 }),
      expertRow({ placement_id: "b", provider_id: "b", average_rating: 4.9 }),
      expertRow({ placement_id: "c", provider_id: "c", average_rating: 4.0 }),
    ]);
    const experts = await getFeaturedExperts(supabase as never, { postcodeDistrict: "W5", limit: 2 });
    expect(experts).toHaveLength(2);
    expect(experts[0]?.providerId).toBe("b"); // best rated first
  });

  it("shows each provider only once even with multiple active placements", async () => {
    const supabase = rpcMock([
      expertRow({ placement_id: "p1", provider_id: "dup", placement_type: "town_boost" }),
      expertRow({ placement_id: "p2", provider_id: "dup", placement_type: "category_leader" }),
    ]);
    const experts = await getFeaturedExperts(supabase as never, { postcodeDistrict: "W5", limit: 3 });
    expect(experts).toHaveLength(1);
    expect(experts[0]?.providerId).toBe("dup");
  });

  it("returns an empty array when nothing is eligible", async () => {
    const supabase = rpcMock([]);
    const experts = await getFeaturedExperts(supabase as never, { town: "Nowhere", limit: 3 });
    expect(experts).toEqual([]);
  });
});
