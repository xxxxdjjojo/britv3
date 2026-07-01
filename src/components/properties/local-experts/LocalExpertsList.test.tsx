import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import type { LocalExpert } from "@/types/local-experts";

const trackSectionViewed = vi.fn();

vi.mock("@/lib/analytics/local-trader-events", () => ({
  trackLocalTradersSectionViewed: (...args: unknown[]) => trackSectionViewed(...args),
}));

vi.mock("@/hooks/useImpressionTracking", () => ({
  useImpressionTracking: (cb: () => void) => {
    cb();
    return { current: null };
  },
}));

vi.mock("./LocalExpertCard", () => ({
  LocalExpertCard: ({ expert }: { expert: LocalExpert }) => (
    <div data-testid="expert-card">{expert.businessName}</div>
  ),
}));

import { LocalExpertsList } from "./LocalExpertsList";

function expert(id: string): LocalExpert {
  return {
    providerId: id,
    slug: id,
    businessName: `Trader ${id}`,
    avatarUrl: null,
    category: "builder",
    primaryService: "Builder",
    averageRating: 4.5,
    totalReviews: 10,
    responseTimeHours: 3,
    yearsInBusiness: 5,
    completedJobsCount: 20,
    serviceArea: "W5",
    valueProposition: "desc",
    isVerified: true,
    isSponsored: false,
    placementId: null,
  };
}

const context = { propertyId: "prop-1", listingId: "listing-1", zone: "property_bottom" as const };

describe("LocalExpertsList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders one card per expert", () => {
    render(<LocalExpertsList experts={[expert("a"), expert("b"), expert("c")]} context={context} />);
    expect(screen.getAllByTestId("expert-card")).toHaveLength(3);
  });

  it("uses a snap-scroll carousel on mobile and a grid on desktop", () => {
    const { container } = render(<LocalExpertsList experts={[expert("a")]} context={context} />);
    const rail = container.firstElementChild as HTMLElement;
    expect(rail.className).toContain("overflow-x-auto");
    expect(rail.className).toContain("snap-x");
    expect(rail.className).toContain("sm:grid");
    expect(rail.className).toContain("lg:grid-cols-3");
  });

  it("fires a single section-viewed event with the card count", () => {
    render(<LocalExpertsList experts={[expert("a"), expert("b")]} context={context} />);
    expect(trackSectionViewed).toHaveBeenCalledTimes(1);
    expect(trackSectionViewed).toHaveBeenCalledWith(context, 2);
  });
});
