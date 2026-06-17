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

describe("Seller market analytics (coming-soon placeholder)", () => {
  it("renders the coming-soon notice", () => {
    render(<MarketAnalyticsPage />);
    expect(screen.getByRole("heading", { name: "Market Analytics" })).toBeInTheDocument();
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it.todo("renders market-wide analytics charts once implemented");
});
