import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import type { FeaturedExpert } from "@/types/sponsored-placements";

import { FeaturedExpertCard } from "./FeaturedExpertCard";

function expert(overrides: Partial<FeaturedExpert> = {}): FeaturedExpert {
  return {
    placementId: "pl1",
    providerId: "pr1",
    slug: "ealing-plumbing",
    businessName: "Ealing Plumbing Co",
    avatarUrl: null,
    category: "plumber",
    primaryService: "Plumber",
    placementType: "category_leader",
    averageRating: 4.7,
    totalReviews: 32,
    responseTimeHours: 2,
    serviceArea: "W5",
    valueProposition: "Gas Safe registered plumbers covering West London.",
    isVerified: true,
    ...overrides,
  };
}

describe("FeaturedExpertCard", () => {
  it("renders the premium card with business, category, rating and area", () => {
    render(<FeaturedExpertCard expert={expert()} zone="property_sidebar" />);
    expect(screen.getByText("Ealing Plumbing Co")).toBeInTheDocument();
    expect(screen.getByText("Plumber")).toBeInTheDocument();
    expect(screen.getByText("4.7")).toBeInTheDocument();
    expect(screen.getByText("W5")).toBeInTheDocument();
  });

  it("shows a Sponsored label and a verified badge", () => {
    render(<FeaturedExpertCard expert={expert()} zone="property_sidebar" />);
    expect(screen.getByText("Sponsored")).toBeInTheDocument();
    expect(screen.getByLabelText("Verified local expert")).toBeInTheDocument();
  });

  it("hides the Sponsored label when sponsored is false", () => {
    render(<FeaturedExpertCard expert={expert()} zone="search_grid" sponsored={false} />);
    expect(screen.queryByText("Sponsored")).not.toBeInTheDocument();
  });

  it("offers a Request Quote call to action linking to the provider profile", () => {
    render(<FeaturedExpertCard expert={expert()} zone="property_sidebar" />);
    const cta = screen.getByRole("link", { name: "Request Quote" });
    expect(cta).toHaveAttribute(
      "href",
      "/services/pro/ealing-plumbing?intent=quote&source=sponsored_placement",
    );
  });
});
