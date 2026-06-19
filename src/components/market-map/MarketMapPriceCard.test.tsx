import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MarketMapPriceCard } from "./MarketMapPriceCard";
import type {
  MarketAreaCard,
  MarketCardSeries,
} from "@/services/market-map/area-detail-service";

function series(overrides: Partial<MarketCardSeries>): MarketCardSeries {
  return {
    median: 400_000,
    p10: 280_000,
    p90: 620_000,
    count: 60,
    latestDate: "2025-12-15",
    confidence: "High",
    insufficient: false,
    ...overrides,
  };
}

function cardWith(
  flat: Partial<MarketCardSeries>,
  house: Partial<MarketCardSeries>,
): MarketAreaCard {
  return { flat: series(flat), house: series(house) };
}

describe("MarketMapPriceCard", () => {
  it("renders a high-confidence flat band with its median and 3 filled dots", () => {
    const card = cardWith(
      { median: 400_000, confidence: "High", insufficient: false },
      { median: 600_000, confidence: "Medium", insufficient: false },
    );
    render(<MarketMapPriceCard card={card} areaName="Northgate" />);

    const flatBand = screen.getByTestId("price-card-band-flat");
    expect(flatBand).toHaveTextContent("£400,000");
    expect(within(flatBand).getAllByTestId("confidence-dot-filled")).toHaveLength(3);
  });

  it("renders an insufficient house band as 'Insufficient sales', never £0", () => {
    const card = cardWith(
      { median: 400_000, confidence: "High", insufficient: false },
      { median: null, count: 0, confidence: "Insufficient", insufficient: true },
    );
    render(<MarketMapPriceCard card={card} areaName="Northgate" />);

    const houseBand = screen.getByTestId("price-card-band-house");
    expect(houseBand).toHaveTextContent("Insufficient sales");
    expect(houseBand).not.toHaveTextContent("£0");
    expect(houseBand).not.toHaveTextContent("£null");
    expect(within(houseBand).queryAllByTestId("confidence-dot-filled")).toHaveLength(0);
  });

  it("shows a skeleton placeholder while loading", () => {
    render(
      <MarketMapPriceCard card={undefined} areaName="Northgate" isLoading />,
    );
    expect(screen.getByTestId("price-card-skeleton")).toBeInTheDocument();
  });
});
