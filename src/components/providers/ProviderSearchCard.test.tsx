import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProviderSearchCard } from "@/components/providers/ProviderSearchCard";
import type { ServiceProviderPublicProfile } from "@/types/providers";

/**
 * Regression for the app-wide `/services/tradespeople` 500.
 *
 * `searchProviders` returns the flat `search_providers` RPC rows (avatar_url,
 * average_rating, review_count, business_name, slug, services) force-cast to
 * the nested `ServiceProviderPublicProfile`. The card used to deref
 * `provider.profiles.provider_verification_status` unguarded, so every
 * non-empty result set crashed the whole page. The card must render any
 * provider shape without throwing.
 */
describe("ProviderSearchCard", () => {
  it("renders without crashing for a flat RPC row (no nested profiles/stats)", () => {
    const flat = {
      id: "p1",
      business_name: "Joe's Plumbing",
      slug: "joes-plumbing",
      services: ["plumber"],
      avatar_url: "https://example.com/a.jpg",
      average_rating: 4.5,
      review_count: 12,
    } as unknown as ServiceProviderPublicProfile;

    expect(() =>
      render(<ProviderSearchCard provider={flat} category="plumber" />),
    ).not.toThrow();
    expect(screen.getByText("Joe's Plumbing")).toBeInTheDocument();
  });

  it("shows the verified badge and rating for a fully nested provider", () => {
    const nested = {
      id: "p2",
      business_name: "Spark Electrics",
      slug: "spark-electrics",
      services: ["electrician"],
      profiles: {
        avatar_url: null,
        provider_verification_status: "verified",
      },
      provider_rating_stats: { average_rating: 4.8, total_reviews: 30 },
    } as unknown as ServiceProviderPublicProfile;

    render(<ProviderSearchCard provider={nested} category="electrician" />);
    expect(screen.getByText("Spark Electrics")).toBeInTheDocument();
    expect(screen.getByText(/Verified/)).toBeInTheDocument();
    expect(screen.getByText("4.8")).toBeInTheDocument();
  });
});
