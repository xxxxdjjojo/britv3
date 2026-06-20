import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarketMapTooltip } from "./MarketMapTooltip";
import type { MarketMapFeatureProperties } from "@/services/market-map/types";

function props(
  overrides: Partial<MarketMapFeatureProperties> = {},
): MarketMapFeatureProperties {
  return {
    area_id: "E02000244",
    area_name: "E02000244",
    geography_level: "msoa",
    median_price: 530_000,
    p10_price: 300_000,
    p90_price: 800_000,
    transaction_count: 80,
    latest_transaction_date: "2026-05-01",
    confidence: "High",
    colour_bucket: 6,
    fill_colour: "#C9A84C",
    scale_mode: "national",
    date_from: "2024-06-01",
    date_to: "2026-06-01",
    property_type_mix: { flat: 58, terraced: 15, detached: 7 },
    ...overrides,
  };
}

describe("MarketMapTooltip — normal-user hover card", () => {
  it("shows the median sold price prominently", () => {
    render(<MarketMapTooltip properties={props()} />);
    expect(screen.getByText("£530,000")).toBeInTheDocument();
    expect(screen.getByText(/median sold price/i)).toBeInTheDocument();
  });

  it("shows the postcode as the heading at postcode level", () => {
    render(
      <MarketMapTooltip
        properties={props({
          area_id: "HA9",
          area_name: "HA9",
          geography_level: "postcode_district",
        })}
      />,
    );
    expect(screen.getByText("HA9")).toBeInTheDocument();
  });

  it("never shows a raw ONS area code", () => {
    render(<MarketMapTooltip properties={props()} />);
    expect(screen.queryByText("E02000244")).not.toBeInTheDocument();
    // friendly fallback instead
    expect(screen.getByText("Neighbourhood")).toBeInTheDocument();
  });

  it("drops the jargon: no confidence, no scale, no type breakdown", () => {
    render(<MarketMapTooltip properties={props()} />);
    expect(screen.queryByText(/confidence/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/national/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/scale/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/type breakdown/i)).not.toBeInTheDocument();
  });

  it("handles insufficient data without showing £0", () => {
    render(
      <MarketMapTooltip
        properties={props({
          median_price: 0,
          confidence: "Insufficient",
          transaction_count: 1,
        })}
      />,
    );
    expect(screen.queryByText("£0")).not.toBeInTheDocument();
    expect(screen.getByText(/not enough recent sales/i)).toBeInTheDocument();
  });
});
