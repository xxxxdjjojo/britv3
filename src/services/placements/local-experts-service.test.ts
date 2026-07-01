import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FeaturedExpertRow } from "@/types/sponsored-placements";
import type { LocalExpertRow } from "@/types/local-experts";
import { getLocalExperts } from "./local-experts-service";

function organicRow(overrides: Partial<LocalExpertRow> = {}): LocalExpertRow {
  return {
    provider_id: "org-1",
    business_name: "Organic Trader",
    slug: "organic-trader",
    avatar_url: null,
    services: ["builder"],
    service_postcodes: ["W5"],
    primary_category: "builder",
    average_rating: 4.5,
    total_reviews: 20,
    response_rate: 90,
    response_time_hours: 2,
    years_in_business: 10,
    completed_jobs_count: 60,
    business_description: "Trusted local builder",
    qualifications: ["FMB"],
    portfolio_urls: [],
    location_match: "postcode",
    ...overrides,
  };
}

function sponsoredRow(overrides: Partial<FeaturedExpertRow> = {}): FeaturedExpertRow {
  return {
    placement_id: "pl-1",
    provider_id: "spon-1",
    business_name: "Sponsored Builder",
    slug: "sponsored-builder",
    avatar_url: null,
    services: ["builder"],
    service_postcodes: ["W5"],
    category: "builder",
    placement_type: "category_leader",
    region_scope: "London",
    town: "Ealing",
    postcode_district: "W5",
    average_rating: 4.0,
    total_reviews: 8,
    response_rate: 70,
    response_time_hours: 5,
    years_in_business: 6,
    completed_jobs_count: 25,
    business_description: "Featured builder",
    qualifications: [],
    portfolio_urls: [],
    location_match: "postcode",
    admin_featured: false,
    priority_override: null,
    budget_remaining: true,
    ...overrides,
  };
}

/** Mock a supabase client whose .rpc dispatches by function name. */
function mockSupabase(opts: {
  featured?: FeaturedExpertRow[];
  organic?: LocalExpertRow[];
  featuredError?: string;
  organicError?: string;
}) {
  const rpc = vi.fn((fn: string) => {
    if (fn === "featured_experts_for") {
      return Promise.resolve({
        data: opts.featured ?? [],
        error: opts.featuredError ? { message: opts.featuredError } : null,
      });
    }
    if (fn === "local_experts_for_property") {
      return Promise.resolve({
        data: opts.organic ?? [],
        error: opts.organicError ? { message: opts.organicError } : null,
      });
    }
    return Promise.resolve({ data: [], error: null });
  });
  return { rpc } as never;
}

const baseQuery = {
  postcode: "W5 2AB",
  postcodeDistrict: "W5",
  lat: 51.51,
  lng: -0.3,
  town: "Ealing",
  region: "London",
  listingType: "sale" as const,
  hasRenovationPotential: true,
  limit: 3,
  sponsoredLimit: 2,
};

describe("getLocalExperts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns organic verified traders even when no trader has paid for placement", async () => {
    const supabase = mockSupabase({ featured: [], organic: [organicRow({ provider_id: "a" }), organicRow({ provider_id: "b" })] });
    const result = await getLocalExperts(supabase, baseQuery);
    expect(result).toHaveLength(2);
    expect(result.every((e) => !e.isSponsored)).toBe(true);
  });

  it("calls the organic RPC with location + prioritised renovation categories", async () => {
    const supabase = mockSupabase({ organic: [organicRow()] });
    await getLocalExperts(supabase, baseQuery);
    const organicCall = (supabase as unknown as { rpc: ReturnType<typeof vi.fn> }).rpc.mock.calls.find(
      (c) => c[0] === "local_experts_for_property",
    );
    expect(organicCall).toBeDefined();
    const params = organicCall?.[1] as Record<string, unknown>;
    expect(params.p_postcode_district).toBe("W5");
    expect(params.p_lat).toBe(51.51);
    expect(params.p_lng).toBe(-0.3);
    // Renovation potential → renovation trades lead.
    expect((params.p_categories as string[])[0]).toBe("builder");
  });

  it("blends a sponsored card first with organic cards beneath it", async () => {
    const supabase = mockSupabase({ featured: [sponsoredRow()], organic: [organicRow({ provider_id: "a" }), organicRow({ provider_id: "b" })] });
    const result = await getLocalExperts(supabase, baseQuery);
    expect(result).toHaveLength(3);
    expect(result[0]?.isSponsored).toBe(true);
    expect(result.filter((e) => !e.isSponsored)).toHaveLength(2);
  });

  it("still surfaces organic traders when the sponsored fetch fails", async () => {
    const supabase = mockSupabase({ featuredError: "boom", organic: [organicRow()] });
    const result = await getLocalExperts(supabase, baseQuery);
    expect(result).toHaveLength(1);
    expect(result[0]?.isSponsored).toBe(false);
  });

  it("returns an empty array when nothing matches", async () => {
    const supabase = mockSupabase({ featured: [], organic: [] });
    const result = await getLocalExperts(supabase, baseQuery);
    expect(result).toEqual([]);
  });

  it("uses rental categories for a rental listing", async () => {
    const supabase = mockSupabase({ organic: [organicRow()] });
    await getLocalExperts(supabase, { ...baseQuery, listingType: "rent", hasRenovationPotential: false });
    const organicCall = (supabase as unknown as { rpc: ReturnType<typeof vi.fn> }).rpc.mock.calls.find(
      (c) => c[0] === "local_experts_for_property",
    );
    const params = organicCall?.[1] as Record<string, unknown>;
    expect((params.p_categories as string[])[0]).toBe("moving_company");
  });
});
