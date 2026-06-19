import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarketMapAreaDetail } from "./MarketMapAreaDetail";
import type {
  MarketMapFeatureProperties,
  AreaPriceDetail,
} from "@/services/market-map/types";

const properties: MarketMapFeatureProperties = {
  area_id: "ZZS01",
  area_name: "Northgate Central A",
  geography_level: "lsoa",
  median_price: 450_000,
  p10_price: 257_000,
  p90_price: 643_000,
  transaction_count: 60,
  latest_transaction_date: "2025-12-15",
  confidence: "High",
  colour_bucket: 5,
  fill_colour: "#C9A84C",
  scale_mode: "national",
  date_from: "2023-06-18",
  date_to: "2026-06-18",
  property_type_mix: { flat: 30, detached: 10, terraced: 20 },
};

function detailWith(
  flat: AreaPriceDetail["flat"],
  house: AreaPriceDetail["house"],
): AreaPriceDetail {
  return {
    area_id: "ZZS01",
    geography_level: "lsoa",
    date_from: "2023-06-18",
    date_to: "2026-06-18",
    overall: {
      median: 450_000,
      p10: 257_000,
      p90: 643_000,
      transaction_count: 60,
      confidence: "High",
      latest_transaction_date: "2025-12-15",
    },
    flat,
    house,
  };
}

describe("MarketMapAreaDetail — flat/house breakdown", () => {
  it("renders distinct flat and house medians with transaction counts", () => {
    const detail = detailWith(
      { median: 300_000, transaction_count: 30, confidence: "High", latest_transaction_date: "2025-12-15" },
      { median: 600_000, transaction_count: 30, confidence: "High", latest_transaction_date: "2025-12-15" },
    );
    render(
      <MarketMapAreaDetail properties={properties} scaleMode="national" detail={detail} />,
    );

    const breakdown = screen.getByTestId("area-detail-breakdown");
    expect(breakdown).toHaveTextContent("Flats / maisonettes");
    expect(breakdown).toHaveTextContent("Houses");
    expect(breakdown).toHaveTextContent("£300,000");
    expect(breakdown).toHaveTextContent("£600,000");
    expect(breakdown).toHaveTextContent("30 sales");
  });

  it("labels a property type with no sales as insufficient — never £0", () => {
    const detail = detailWith(
      { median: null, transaction_count: 0, confidence: "Insufficient", latest_transaction_date: null },
      { median: 400_000, transaction_count: 12, confidence: "Medium", latest_transaction_date: "2025-08-15" },
    );
    render(
      <MarketMapAreaDetail properties={properties} scaleMode="local" detail={detail} />,
    );

    const breakdown = screen.getByTestId("area-detail-breakdown");
    expect(breakdown).toHaveTextContent(
      "Insufficient registered sales for this property type",
    );
    expect(breakdown).not.toHaveTextContent("£0");
    // Houses still render their real median.
    expect(breakdown).toHaveTextContent("£400,000");
  });

  it("omits the breakdown section entirely when no detail is loaded yet", () => {
    render(<MarketMapAreaDetail properties={properties} scaleMode="national" />);
    expect(screen.queryByTestId("area-detail-breakdown")).toBeNull();
  });
});
