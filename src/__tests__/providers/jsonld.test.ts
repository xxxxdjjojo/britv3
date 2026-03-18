import { describe, it, expect } from "vitest";
import {
  buildProviderJsonLd,
  buildAgentJsonLd,
  buildSpecialistJsonLd,
} from "@/lib/providers/jsonld";
import type { ServiceProviderPublicProfile, AgentPublicProfile, AgentPublicStats } from "@/types/providers";
import type { SpecialistType } from "@/components/providers/SpecialistHero";

// ---------------------------------------------------------------------------
// Shared mock factories
// ---------------------------------------------------------------------------

function makeProvider(
  overrides: Partial<ServiceProviderPublicProfile> = {},
): ServiceProviderPublicProfile {
  return {
    id: "prov-123",
    user_id: "user-abc",
    slug: "london-plumbers-co",
    business_name: "London Plumbers Co",
    tagline: "Expert plumbing since 1990",
    description: "We fix all your plumbing needs.",
    services: ["plumbing"],
    city: "London",
    service_postcodes: ["SW1A", "EC1A"],
    website_url: "https://londonplumbers.co.uk",
    phone: "07700 900000",
    years_experience: 15,
    qualifications: ["City & Guilds"],
    insurance_verified: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-06-01T00:00:00Z",
    profiles: {
      id: "profile-abc",
      avatar_url: "https://cdn.britestate.co.uk/avatars/plumber.jpg",
      full_name: "Jane Smith",
      provider_verification_status: "verified",
      email: "jane@londonplumbers.co.uk",
    },
    provider_rating_stats: {
      provider_id: "prov-123",
      avg_rating: 4.7,
      total_reviews: 42,
      five_star: 30,
      four_star: 8,
      three_star: 3,
      two_star: 1,
      one_star: 0,
    },
    ...overrides,
  };
}

function makeAgent(overrides: Partial<AgentPublicProfile> = {}): AgentPublicProfile {
  return {
    id: "agent-456",
    user_id: "user-def",
    slug: "john-doe-estates",
    display_name: "John Doe",
    bio: "15 years helping London buyers find their dream home.",
    specialisations: ["residential", "lettings"],
    areas_covered: ["Islington", "Hackney"],
    phone: "020 7946 0000",
    email: "john@doeestates.co.uk",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    profiles: {
      id: "profile-def",
      avatar_url: "https://cdn.britestate.co.uk/avatars/agent.jpg",
      full_name: "John Doe",
      email: "john@doeestates.co.uk",
    },
    agency: {
      id: "agency-789",
      name: "Doe Estates Ltd",
      logo_url: "https://cdn.britestate.co.uk/logos/doe-estates.png",
      website_url: "https://doeestates.co.uk",
      address: "12 High Street, London, N1 1AB",
    },
    ...overrides,
  };
}

function makeAgentStats(overrides: Partial<AgentPublicStats> = {}): AgentPublicStats {
  return {
    active_listings_count: 24,
    sold_count: 198,
    avg_days_to_sell: 28,
    avg_pct_asking: 98.5,
    avg_rating: 4.8,
    total_reviews: 63,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// buildProviderJsonLd
// ---------------------------------------------------------------------------

describe("buildProviderJsonLd", () => {
  it("includes correct @context and @type for a full provider", () => {
    const result = buildProviderJsonLd(makeProvider(), "plumbers");
    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("LocalBusiness");
  });

  it("builds the correct URL from category and slug", () => {
    const result = buildProviderJsonLd(makeProvider(), "plumbers");
    expect(result.url).toBe("https://britestate.co.uk/services/plumbers/london-plumbers-co");
  });

  it("includes name and description for a full provider", () => {
    const provider = makeProvider();
    const result = buildProviderJsonLd(provider, "plumbers");
    expect(result.name).toBe("London Plumbers Co");
    expect(result.description).toBe("We fix all your plumbing needs.");
  });

  it("includes address when city is present", () => {
    const result = buildProviderJsonLd(makeProvider(), "plumbers");
    expect(result.address).toEqual({
      "@type": "PostalAddress",
      addressLocality: "London",
      addressCountry: "GB",
    });
  });

  it("includes image when avatar_url is present", () => {
    const result = buildProviderJsonLd(makeProvider(), "plumbers");
    expect(result.image).toBe("https://cdn.britestate.co.uk/avatars/plumber.jpg");
  });

  it("includes aggregateRating when total_reviews > 0", () => {
    const result = buildProviderJsonLd(makeProvider(), "plumbers");
    expect(result.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.7,
      reviewCount: 42,
      bestRating: "5",
      worstRating: "1",
    });
  });

  it("omits address when city is null", () => {
    const result = buildProviderJsonLd(makeProvider({ city: null }), "plumbers");
    expect(result.address).toBeUndefined();
  });

  it("omits image when avatar_url is null", () => {
    const provider = makeProvider({
      profiles: {
        id: "profile-abc",
        avatar_url: null,
        full_name: "Jane Smith",
        provider_verification_status: "verified",
        email: "jane@londonplumbers.co.uk",
      },
    });
    const result = buildProviderJsonLd(provider, "plumbers");
    expect(result.image).toBeUndefined();
  });

  it("omits aggregateRating when provider_rating_stats is null", () => {
    const result = buildProviderJsonLd(
      makeProvider({ provider_rating_stats: null }),
      "plumbers",
    );
    expect(result.aggregateRating).toBeUndefined();
  });

  it("omits aggregateRating when total_reviews is 0", () => {
    const result = buildProviderJsonLd(
      makeProvider({
        provider_rating_stats: {
          provider_id: "prov-123",
          avg_rating: null,
          total_reviews: 0,
          five_star: 0,
          four_star: 0,
          three_star: 0,
          two_star: 0,
          one_star: 0,
        },
      }),
      "plumbers",
    );
    expect(result.aggregateRating).toBeUndefined();
  });

  it("handles minimal provider (no description, no city, no avatar, no ratings)", () => {
    const minimal = makeProvider({
      description: null,
      city: null,
      profiles: {
        id: "profile-abc",
        avatar_url: null,
        full_name: null,
        provider_verification_status: null,
        email: null,
      },
      provider_rating_stats: null,
    });
    const result = buildProviderJsonLd(minimal, "electricians");
    expect(result["@type"]).toBe("LocalBusiness");
    expect(result.url).toBe("https://britestate.co.uk/services/electricians/london-plumbers-co");
    expect(result.description).toBeUndefined();
    expect(result.address).toBeUndefined();
    expect(result.image).toBeUndefined();
    expect(result.aggregateRating).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// buildAgentJsonLd
// ---------------------------------------------------------------------------

describe("buildAgentJsonLd", () => {
  it("includes correct @context and @type", () => {
    const result = buildAgentJsonLd(makeAgent(), makeAgentStats());
    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("RealEstateAgent");
  });

  it("builds the correct URL from agent slug", () => {
    const result = buildAgentJsonLd(makeAgent(), makeAgentStats());
    expect(result.url).toBe("https://britestate.co.uk/agents/john-doe-estates");
  });

  it("uses agency name when agency is present", () => {
    const result = buildAgentJsonLd(makeAgent(), makeAgentStats());
    expect(result.name).toBe("Doe Estates Ltd");
  });

  it("falls back to display_name when agency is null", () => {
    const result = buildAgentJsonLd(makeAgent({ agency: null }), makeAgentStats());
    expect(result.name).toBe("John Doe");
  });

  it("includes description from bio when bio is present", () => {
    const result = buildAgentJsonLd(makeAgent(), makeAgentStats());
    expect(result.description).toBe("15 years helping London buyers find their dream home.");
  });

  it("omits description when bio is null", () => {
    const result = buildAgentJsonLd(makeAgent({ bio: null }), makeAgentStats());
    expect(result.description).toBeUndefined();
  });

  it("includes telephone when phone is present", () => {
    const result = buildAgentJsonLd(makeAgent(), makeAgentStats());
    expect(result.telephone).toBe("020 7946 0000");
  });

  it("omits telephone when phone is null", () => {
    const result = buildAgentJsonLd(makeAgent({ phone: null }), makeAgentStats());
    expect(result.telephone).toBeUndefined();
  });

  it("includes address from agency.address when present", () => {
    const result = buildAgentJsonLd(makeAgent(), makeAgentStats());
    expect(result.address).toEqual({
      "@type": "PostalAddress",
      streetAddress: "12 High Street, London, N1 1AB",
      addressCountry: "GB",
    });
  });

  it("omits address when agency.address is null", () => {
    const result = buildAgentJsonLd(
      makeAgent({
        agency: {
          id: "agency-789",
          name: "Doe Estates Ltd",
          logo_url: null,
          website_url: null,
          address: null,
        },
      }),
      makeAgentStats(),
    );
    expect(result.address).toBeUndefined();
  });

  it("omits address when agency is null", () => {
    const result = buildAgentJsonLd(makeAgent({ agency: null }), makeAgentStats());
    expect(result.address).toBeUndefined();
  });

  it("includes image from agency.logo_url when present", () => {
    const result = buildAgentJsonLd(makeAgent(), makeAgentStats());
    expect(result.image).toBe("https://cdn.britestate.co.uk/logos/doe-estates.png");
  });

  it("omits image when agency.logo_url is null", () => {
    const result = buildAgentJsonLd(
      makeAgent({
        agency: {
          id: "agency-789",
          name: "Doe Estates Ltd",
          logo_url: null,
          website_url: null,
          address: null,
        },
      }),
      makeAgentStats(),
    );
    expect(result.image).toBeUndefined();
  });

  it("includes aggregateRating when avg_rating and total_reviews > 0", () => {
    const result = buildAgentJsonLd(makeAgent(), makeAgentStats());
    expect(result.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.8,
      reviewCount: 63,
      bestRating: "5",
    });
  });

  it("omits aggregateRating when avg_rating is null", () => {
    const result = buildAgentJsonLd(
      makeAgent(),
      makeAgentStats({ avg_rating: null, total_reviews: 10 }),
    );
    expect(result.aggregateRating).toBeUndefined();
  });

  it("omits aggregateRating when total_reviews is 0", () => {
    const result = buildAgentJsonLd(
      makeAgent(),
      makeAgentStats({ avg_rating: 4.5, total_reviews: 0 }),
    );
    expect(result.aggregateRating).toBeUndefined();
  });

  it("handles minimal agent (no bio, no phone, no agency)", () => {
    const minimal = makeAgent({ bio: null, phone: null, agency: null });
    const result = buildAgentJsonLd(
      minimal,
      makeAgentStats({ avg_rating: null, total_reviews: 0 }),
    );
    expect(result["@type"]).toBe("RealEstateAgent");
    expect(result.name).toBe("John Doe");
    expect(result.url).toBe("https://britestate.co.uk/agents/john-doe-estates");
    expect(result.description).toBeUndefined();
    expect(result.telephone).toBeUndefined();
    expect(result.address).toBeUndefined();
    expect(result.image).toBeUndefined();
    expect(result.aggregateRating).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// buildSpecialistJsonLd
// ---------------------------------------------------------------------------

describe("buildSpecialistJsonLd", () => {
  const specialistCases: Array<[SpecialistType, string, string]> = [
    ["mortgage_broker", "mortgage-brokers", "FinancialService"],
    ["conveyancer", "conveyancers", "LegalService"],
    ["surveyor", "surveyors", "ProfessionalService"],
  ];

  it.each(specialistCases)(
    "maps %s to @type %s",
    (specialistType, routePrefix, expectedType) => {
      const result = buildSpecialistJsonLd(makeProvider(), specialistType, routePrefix);
      expect(result["@type"]).toBe(expectedType);
    },
  );

  it.each(specialistCases)(
    "builds correct URL for %s using routePrefix",
    (specialistType, routePrefix) => {
      const result = buildSpecialistJsonLd(makeProvider(), specialistType, routePrefix);
      expect(result.url).toBe(
        `https://britestate.co.uk/${routePrefix}/london-plumbers-co`,
      );
    },
  );

  it("includes @context for all specialist types", () => {
    for (const [type, prefix] of specialistCases) {
      const result = buildSpecialistJsonLd(makeProvider(), type, prefix);
      expect(result["@context"]).toBe("https://schema.org");
    }
  });

  it("includes name and description", () => {
    const result = buildSpecialistJsonLd(makeProvider(), "mortgage_broker", "mortgage-brokers");
    expect(result.name).toBe("London Plumbers Co");
    expect(result.description).toBe("We fix all your plumbing needs.");
  });

  it("includes telephone when phone is present", () => {
    const result = buildSpecialistJsonLd(makeProvider(), "conveyancer", "conveyancers");
    expect(result.telephone).toBe("07700 900000");
  });

  it("omits telephone when phone is null", () => {
    const result = buildSpecialistJsonLd(
      makeProvider({ phone: null }),
      "conveyancer",
      "conveyancers",
    );
    expect(result.telephone).toBeUndefined();
  });

  it("includes address when city is present", () => {
    const result = buildSpecialistJsonLd(makeProvider(), "surveyor", "surveyors");
    expect(result.address).toEqual({
      "@type": "PostalAddress",
      addressLocality: "London",
      addressCountry: "GB",
    });
  });

  it("omits address when city is null", () => {
    const result = buildSpecialistJsonLd(
      makeProvider({ city: null }),
      "surveyor",
      "surveyors",
    );
    expect(result.address).toBeUndefined();
  });

  it("includes image when avatar_url is present", () => {
    const result = buildSpecialistJsonLd(makeProvider(), "mortgage_broker", "mortgage-brokers");
    expect(result.image).toBe("https://cdn.britestate.co.uk/avatars/plumber.jpg");
  });

  it("omits image when avatar_url is null", () => {
    const provider = makeProvider({
      profiles: {
        id: "profile-abc",
        avatar_url: null,
        full_name: "Jane Smith",
        provider_verification_status: "verified",
        email: "jane@londonplumbers.co.uk",
      },
    });
    const result = buildSpecialistJsonLd(provider, "mortgage_broker", "mortgage-brokers");
    expect(result.image).toBeUndefined();
  });

  it("includes aggregateRating when reviews > 0", () => {
    const result = buildSpecialistJsonLd(makeProvider(), "conveyancer", "conveyancers");
    expect(result.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.7,
      reviewCount: 42,
      bestRating: "5",
      worstRating: "1",
    });
  });

  it("omits aggregateRating when total_reviews is 0", () => {
    const result = buildSpecialistJsonLd(
      makeProvider({
        provider_rating_stats: {
          provider_id: "prov-123",
          avg_rating: null,
          total_reviews: 0,
          five_star: 0,
          four_star: 0,
          three_star: 0,
          two_star: 0,
          one_star: 0,
        },
      }),
      "surveyor",
      "surveyors",
    );
    expect(result.aggregateRating).toBeUndefined();
  });

  it("omits aggregateRating when provider_rating_stats is null", () => {
    const result = buildSpecialistJsonLd(
      makeProvider({ provider_rating_stats: null }),
      "surveyor",
      "surveyors",
    );
    expect(result.aggregateRating).toBeUndefined();
  });
});
