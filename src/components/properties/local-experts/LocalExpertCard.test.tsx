import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import type { LocalExpert } from "@/types/local-experts";

const trackCardViewed = vi.fn();
const trackClicked = vi.fn();

vi.mock("@/lib/analytics/local-trader-events", () => ({
  trackLocalTraderCardViewed: (...args: unknown[]) => trackCardViewed(...args),
  trackLocalTraderClicked: (...args: unknown[]) => trackClicked(...args),
}));

// Fire the impression callback synchronously so card-viewed is observable.
vi.mock("@/hooks/useImpressionTracking", () => ({
  useImpressionTracking: (cb: () => void) => {
    cb();
    return { current: null };
  },
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { src, alt } = props as { src: string; alt: string };
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} />;
  },
}));

import { LocalExpertCard } from "./LocalExpertCard";

function expert(overrides: Partial<LocalExpert> = {}): LocalExpert {
  return {
    providerId: "prov-1",
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
    valueProposition: "Extensions and full renovations",
    isVerified: true,
    isSponsored: false,
    placementId: null,
    ...overrides,
  };
}

const context = { propertyId: "prop-1", listingId: "listing-1", zone: "property_bottom" as const };

describe("LocalExpertCard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders every required card field", () => {
    render(<LocalExpertCard expert={expert()} context={context} postcode="W5 2AB" />);
    expect(screen.getByText("Ace Builders")).toBeInTheDocument();
    expect(screen.getByText("Builder")).toBeInTheDocument(); // category
    expect(screen.getByText("4.7")).toBeInTheDocument(); // rating
    expect(screen.getByText("(30)")).toBeInTheDocument(); // reviews
    expect(screen.getByText("12 yrs trading")).toBeInTheDocument(); // years
    expect(screen.getByText("W5")).toBeInTheDocument(); // service area
    expect(screen.getByText(/Replies in ~4h/)).toBeInTheDocument(); // response time
    expect(screen.getByText("Extensions and full renovations")).toBeInTheDocument(); // value prop
    expect(screen.getByLabelText("Verified local expert")).toBeInTheDocument(); // verified badge
  });

  it("does not show a Sponsored label for an organic trader", () => {
    render(<LocalExpertCard expert={expert()} context={context} />);
    expect(screen.queryByText("Sponsored")).not.toBeInTheDocument();
  });

  it("shows a Sponsored label for a sponsored trader", () => {
    render(<LocalExpertCard expert={expert({ isSponsored: true, placementId: "pl-1" })} context={context} />);
    expect(screen.getByText("Sponsored")).toBeInTheDocument();
  });

  it("Request Quote deep-links with listing id, category, trader id and source", () => {
    render(<LocalExpertCard expert={expert()} context={context} postcode="W5 2AB" />);
    const quote = screen.getByRole("link", { name: "Request Quote" });
    const href = quote.getAttribute("href") ?? "";
    expect(href.startsWith("/dashboard/rfqs/create?")).toBe(true);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("category")).toBe("builder");
    expect(params.get("provider")).toBe("prov-1");
    expect(params.get("listing")).toBe("listing-1");
    expect(params.get("source")).toBe("property_detail_local_traders");
  });

  it("View Profile links to the canonical provider profile route", () => {
    render(<LocalExpertCard expert={expert()} context={context} />);
    const profile = screen.getByRole("link", { name: "View Profile" });
    expect(profile.getAttribute("href")).toBe("/services/builder/ace-builders");
  });

  it("fires a card-viewed analytics event when it enters view", () => {
    render(<LocalExpertCard expert={expert()} context={context} />);
    expect(trackCardViewed).toHaveBeenCalledTimes(1);
  });

  it("fires a quote-intent click event with the right kind", () => {
    render(<LocalExpertCard expert={expert()} context={context} />);
    fireEvent.click(screen.getByRole("link", { name: "Request Quote" }));
    expect(trackClicked).toHaveBeenCalledWith(expect.anything(), context, "quote");
  });

  it("fires a profile click event with the right kind", () => {
    render(<LocalExpertCard expert={expert()} context={context} />);
    fireEvent.click(screen.getByRole("link", { name: "View Profile" }));
    expect(trackClicked).toHaveBeenCalledWith(expect.anything(), context, "profile");
  });
});
