import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EnquiriesPage from "@/app/(protected)/dashboard/seller/enquiries/page";
import MarketAnalyticsPage from "@/app/(protected)/dashboard/seller/analytics/page";

// FINDING: seller/enquiries and seller/analytics are intentional "coming soon"
// placeholders (no data, no interaction). We assert the placeholder renders and
// mark the real feature behaviour as todo until it is built.
describe("Seller enquiries (coming-soon placeholder)", () => {
  it("renders the coming-soon notice", () => {
    render(<EnquiriesPage />);
    expect(screen.getByRole("heading", { name: "Enquiries" })).toBeInTheDocument();
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it.todo("lists received enquiries with status (sent/responded/booked)");
  it.todo("filters enquiries and supports reply actions");
});

// The seller analytics route is no longer a coming-soon placeholder — it has
// been built out into the "Listing Analytics" page with KPI tiles, trend
// chart sections, lead distribution and a recent-activity table.
describe("Seller listing analytics", () => {
  it("renders the analytics heading and KPI tiles", () => {
    render(<MarketAnalyticsPage />);
    expect(
      screen.getByRole("heading", { name: "Listing Analytics" }),
    ).toBeInTheDocument();
    // KPI stat tiles.
    expect(screen.getByText("Total Views")).toBeInTheDocument();
    expect(screen.getByText("12,482")).toBeInTheDocument();
    expect(screen.getByText("Enquiries")).toBeInTheDocument();
  });

  it("renders the engagement, lead distribution and activity sections", () => {
    render(<MarketAnalyticsPage />);
    expect(
      screen.getByRole("heading", { name: "Engagement Trends" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Lead Distribution" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Recent Viewing Activity" }),
    ).toBeInTheDocument();
    // The lead-distribution breakdown shows each source's share; 46% is unique
    // to the "Property Search" row.
    expect(screen.getByText("46%")).toBeInTheDocument();
  });
});
