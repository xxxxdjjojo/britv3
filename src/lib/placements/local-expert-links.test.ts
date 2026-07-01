import { describe, it, expect } from "vitest";

import type { LocalExpert } from "@/types/local-experts";
import {
  LOCAL_TRADERS_SOURCE,
  buildProfileHref,
  buildQuoteHref,
  buildViewAllHref,
} from "./local-expert-links";

function expert(overrides: Partial<LocalExpert> = {}): LocalExpert {
  return {
    providerId: "prov-123",
    slug: "ace-builders",
    businessName: "Ace Builders",
    avatarUrl: null,
    category: "builder",
    primaryService: "Builder",
    averageRating: 4.7,
    totalReviews: 30,
    responseTimeHours: 4,
    yearsInBusiness: 12,
    completedJobsCount: 80,
    serviceArea: "W5",
    valueProposition: "Extensions and renovations",
    isVerified: true,
    isSponsored: false,
    placementId: null,
    ...overrides,
  };
}

describe("buildQuoteHref", () => {
  it("passes listing id, trade category, trader id and source", () => {
    const href = buildQuoteHref(expert(), { listingId: "listing-99", postcode: "W5 2AB", address: "1 High St" });
    expect(href.startsWith("/dashboard/rfqs/create?")).toBe(true);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("category")).toBe("builder");
    expect(params.get("provider")).toBe("prov-123");
    expect(params.get("listing")).toBe("listing-99");
    expect(params.get("postcode")).toBe("W5 2AB");
    expect(params.get("address")).toBe("1 High St");
    expect(params.get("source")).toBe(LOCAL_TRADERS_SOURCE);
  });

  it("omits optional params when absent and falls back category to 'other'", () => {
    const href = buildQuoteHref(expert({ category: null }), {});
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("category")).toBe("other");
    expect(params.get("listing")).toBeNull();
    expect(params.get("postcode")).toBeNull();
  });
});

describe("buildProfileHref", () => {
  it("points at the canonical /services/{category}/{slug} route", () => {
    expect(buildProfileHref(expert())).toBe("/services/builder/ace-builders");
  });
});

describe("buildViewAllHref", () => {
  it("builds a filter-aware tradespeople link", () => {
    expect(buildViewAllHref({ postcode: "W5 2AB", category: "builder" })).toBe(
      "/services/tradespeople?postcode=W5+2AB&category=builder",
    );
  });
  it("falls back to the bare directory with no filters", () => {
    expect(buildViewAllHref({})).toBe("/services/tradespeople");
  });
});
