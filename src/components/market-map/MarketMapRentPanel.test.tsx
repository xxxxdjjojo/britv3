import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarketMapRentPanel } from "./MarketMapRentPanel";

describe("MarketMapRentPanel — honest rent empty state", () => {
  it("renders the 'coming soon' heading", () => {
    render(<MarketMapRentPanel />);
    expect(
      screen.getByRole("heading", { name: /coming soon/i }),
    ).toBeInTheDocument();
  });

  it("attributes both planned data sources (ONS PIPR and VOA)", () => {
    render(<MarketMapRentPanel />);
    expect(screen.getByText(/ONS Price Index of Private Rents/i)).toBeInTheDocument();
    expect(screen.getByText(/VOA Private Rental Market Statistics/i)).toBeInTheDocument();
  });

  it("shows no fabricated pound-denominated figures", () => {
    render(<MarketMapRentPanel />);
    expect(screen.queryByText(/£\d/)).not.toBeInTheDocument();
    expect(screen.queryByText(/£X/i)).not.toBeInTheDocument();
  });
});
