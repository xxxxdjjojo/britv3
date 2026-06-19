import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ValuationResult } from "@/components/seller/valuation/ValuationResult";
import { makeComparable } from "./_fixtures";

const baseProps = {
  postcode: "SW1A 1AA",
  aiEstimate: 35000000, // £350,000
  estimateLow: 33000000,
  estimateHigh: 37000000,
  confidence: 82,
  basedOn: 5,
  comparables: [makeComparable()],
};

describe("ValuationResult render-with-data", () => {
  it("renders the headline estimate and postcode", () => {
    render(<ValuationResult {...baseProps} />);
    expect(screen.getByText("£350,000")).toBeInTheDocument();
    expect(screen.getByText(/Estimated Value for SW1A 1AA/)).toBeInTheDocument();
  });

  it("renders the low–high range", () => {
    render(<ValuationResult {...baseProps} />);
    expect(screen.getByText(/£330,000 — £370,000/)).toBeInTheDocument();
  });

  it("renders confidence percentage", () => {
    render(<ValuationResult {...baseProps} />);
    expect(screen.getByText("82%")).toBeInTheDocument();
  });

  it("pluralises the comparable-sales count", () => {
    render(<ValuationResult {...baseProps} basedOn={5} />);
    expect(screen.getByText("Based on 5 comparable sales in the area")).toBeInTheDocument();
  });

  it("uses singular wording for exactly one comparable sale", () => {
    render(<ValuationResult {...baseProps} basedOn={1} />);
    expect(screen.getByText("Based on 1 comparable sale in the area")).toBeInTheDocument();
  });

  it("lists comparable sales with formatted price", () => {
    render(
      <ValuationResult
        {...baseProps}
        comparables={[makeComparable({ address: "12 Elm Road", price: 34000000 })]}
      />,
    );
    expect(screen.getByText("12 Elm Road")).toBeInTheDocument();
    expect(screen.getByText("£340,000")).toBeInTheDocument();
  });

  it("falls back to 'Address withheld' for blank comparable addresses", () => {
    render(<ValuationResult {...baseProps} comparables={[makeComparable({ address: "" })]} />);
    expect(screen.getByText("Address withheld")).toBeInTheDocument();
  });
});

describe("ValuationResult EMPTY comparables", () => {
  it("renders the no-recent-sales notice and hides the sales list", () => {
    render(<ValuationResult {...baseProps} comparables={[]} basedOn={0} />);
    expect(screen.getByText("No recent sales found")).toBeInTheDocument();
    expect(screen.queryByText("Recent Sales Nearby")).not.toBeInTheDocument();
  });
});
