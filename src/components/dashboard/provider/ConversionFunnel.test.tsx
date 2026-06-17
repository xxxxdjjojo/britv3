import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConversionFunnel } from "./ConversionFunnel";
import type { ConversionFunnel as ConversionFunnelType } from "@/types/provider-dashboard";

const fullFunnel: ConversionFunnelType = {
  viewed: 400,
  enquired: 80,
  quoted: 40,
  booked: 20,
};

const emptyFunnel: ConversionFunnelType = {
  viewed: 0,
  enquired: 0,
  quoted: 0,
  booked: 0,
};

describe("ConversionFunnel", () => {
  it("renders the Conversion Funnel heading", () => {
    render(<ConversionFunnel funnel={fullFunnel} />);
    expect(
      screen.getByRole("heading", { name: /conversion funnel/i }),
    ).toBeInTheDocument();
  });

  it("renders all four stage labels", () => {
    render(<ConversionFunnel funnel={fullFunnel} />);
    // getAllByText to handle desktop+mobile duplicated layout
    expect(screen.getAllByText("Profile Views").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Enquiries").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Quotes Sent").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bookings").length).toBeGreaterThan(0);
  });

  it("renders the correct count for Profile Views", () => {
    render(<ConversionFunnel funnel={fullFunnel} />);
    expect(screen.getAllByText("400").length).toBeGreaterThan(0);
  });

  it("renders conversion rate badges for stages with a predecessor", () => {
    render(<ConversionFunnel funnel={fullFunnel} />);
    // enquired/viewed = 20%, quoted/enquired = 50%, booked/quoted = 50%
    const twentyPct = screen.getAllByText(/20%/);
    expect(twentyPct.length).toBeGreaterThan(0);
  });

  it("shows empty state message when all counts are zero", () => {
    render(<ConversionFunnel funnel={emptyFunnel} />);
    expect(
      screen.getByText(/build your history to see conversion data/i),
    ).toBeInTheDocument();
  });

  it("does not show empty state when data exists", () => {
    render(<ConversionFunnel funnel={fullFunnel} />);
    expect(
      screen.queryByText(/build your history/i),
    ).not.toBeInTheDocument();
  });
});
