import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MarketMapAreaList } from "./MarketMapAreaList";
import type { MarketMapFeatureProperties } from "@/services/market-map/types";

function feat(
  overrides: Partial<MarketMapFeatureProperties>,
): MarketMapFeatureProperties {
  return {
    area_id: "E01001316",
    area_name: "E01001316",
    geography_level: "lsoa",
    median_price: 420_000,
    p10_price: 250_000,
    p90_price: 700_000,
    transaction_count: 42,
    latest_transaction_date: "2026-05-01",
    confidence: "High",
    colour_bucket: 4,
    fill_colour: "#7FB069",
    scale_mode: "national",
    date_from: "2024-06-01",
    date_to: "2026-06-01",
    property_type_mix: { flat: 20, terraced: 22 },
    ...overrides,
  };
}

describe("MarketMapAreaList — links + humanized names", () => {
  it("renders a real link to each area's price page", () => {
    render(
      <MarketMapAreaList
        features={[feat({ area_id: "HA9", area_name: "HA9", geography_level: "postcode_district" })]}
        onSelect={vi.fn()}
      />,
    );
    const link = screen.getByRole("link", { name: /HA9/i });
    expect(link).toHaveAttribute("href", "/search/market-map/HA9");
  });

  it("never shows a raw ONS code in a row", () => {
    render(<MarketMapAreaList features={[feat({})]} onSelect={vi.fn()} />);
    expect(screen.queryByText("E01001316")).not.toBeInTheDocument();
    expect(screen.getByText("Local area")).toBeInTheDocument();
  });

  it("keeps the row selectable (calls onSelect)", async () => {
    const onSelect = vi.fn();
    render(
      <MarketMapAreaList
        features={[feat({ area_id: "W5", area_name: "W5", geography_level: "postcode_district" })]}
        onSelect={onSelect}
      />,
    );
    const row = screen.getByRole("button", { name: /select/i });
    row.click();
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("links each row to the correct area page (multiple rows)", () => {
    render(
      <MarketMapAreaList
        features={[
          feat({ area_id: "W5", area_name: "W5", geography_level: "postcode_district", median_price: 300_000 }),
          feat({ area_id: "HA9", area_name: "HA9", geography_level: "postcode_district", median_price: 500_000 }),
        ]}
        onSelect={vi.fn()}
      />,
    );
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/search/market-map/W5");
    expect(hrefs).toContain("/search/market-map/HA9");
  });
});
