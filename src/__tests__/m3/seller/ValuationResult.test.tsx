import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ValuationResult } from "@/components/seller/valuation/ValuationResult";
import { makeComparable } from "./_fixtures";

const baseProps = {
  postcode: "SW1A 1AA",
  estimate: 35000000, // £350,000
  rangeLow: 33000000,
  rangeHigh: 37000000,
  evidence: "high" as const,
  basedOn: 5,
  comparables: [makeComparable()],
};

describe("ValuationResult render-with-data", () => {
  it("renders the headline average and postcode", () => {
    render(<ValuationResult {...baseProps} />);
    expect(screen.getByText("£350,000")).toBeInTheDocument();
    expect(screen.getByText(/Average recent sold price near SW1A 1AA/)).toBeInTheDocument();
  });

  it("renders the low–high range as actual recent sales", () => {
    render(<ValuationResult {...baseProps} />);
    expect(screen.getByText(/£330,000 — £370,000/)).toBeInTheDocument();
  });

  it("states this is an average, not a property valuation", () => {
    render(<ValuationResult {...baseProps} />);
    expect(
      screen.getByText(/not a valuation of any specific property/),
    ).toBeInTheDocument();
  });

  it("pluralises the nearby-sales count", () => {
    render(<ValuationResult {...baseProps} basedOn={5} />);
    expect(screen.getByText("Based on 5 sales nearby")).toBeInTheDocument();
  });

  it("uses singular wording for exactly one nearby sale", () => {
    render(<ValuationResult {...baseProps} basedOn={1} />);
    expect(screen.getByText("Based on 1 sale nearby")).toBeInTheDocument();
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
