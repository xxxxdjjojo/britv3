import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SoldParcelPopup } from "./SoldParcelPopup";
import type { SoldParcel, SoldSale } from "@/lib/market-map/sold-colour";

function sale(overrides: Partial<SoldSale> = {}): SoldSale {
  return {
    address: "12 Acacia Avenue",
    date: "2024-03-12",
    price: 45_000_000,
    ppsqm: 625_000,
    type: "semi-detached",
    floorArea: 72,
    estimatedLocation: false,
    ...overrides,
  };
}

function parcel(overrides: Partial<SoldParcel> = {}): SoldParcel {
  return {
    inspireId: "INSPIRE-1",
    bucket: 6,
    saleCount: 1,
    medianPricePence: 45_000_000,
    medianPricePerSqmPence: 625_000,
    dominantPropertyType: "semi-detached",
    latestTransferDate: "2024-03-12",
    sales: [sale()],
    ...overrides,
  };
}

describe("SoldParcelPopup", () => {
  it("renders a single sale with address, formatted £ and £/m²", () => {
    render(<SoldParcelPopup parcel={parcel()} />);

    expect(screen.getByText("12 Acacia Avenue")).toBeInTheDocument();
    expect(screen.getByText("£450,000")).toBeInTheDocument();
    expect(screen.getByText("£6,250/m²")).toBeInTheDocument();
    expect(screen.getByText("12 Mar 2024")).toBeInTheDocument();
    expect(screen.getByText("Semi-Detached")).toBeInTheDocument();
  });

  it("renders the 'no £/m²' path when ppsqm is null", () => {
    render(
      <SoldParcelPopup
        parcel={parcel({
          medianPricePerSqmPence: null,
          sales: [sale({ ppsqm: null, floorArea: null })],
        })}
      />,
    );

    expect(screen.getByText("Floor area unknown — no £/m²")).toBeInTheDocument();
    expect(screen.queryByText(/£6,250\/m²/)).not.toBeInTheDocument();
  });

  it("renders the approx-location note when estimatedLocation is true", () => {
    render(
      <SoldParcelPopup parcel={parcel({ sales: [sale({ estimatedLocation: true })] })} />,
    );

    expect(
      screen.getByText("Approx. location (postcode centroid)"),
    ).toBeInTheDocument();
  });

  it("renders 'Address withheld' when the single sale address is null", () => {
    render(<SoldParcelPopup parcel={parcel({ sales: [sale({ address: null })] })} />);
    expect(screen.getByText("Address withheld")).toBeInTheDocument();
  });

  it("renders a multi-sale block with the header and every address", () => {
    const sales: SoldSale[] = [
      sale({ address: "Flat 1", date: "2023-06-01", price: 28_000_000 }),
      sale({ address: "Flat 2", date: "2024-02-14", price: 30_000_000 }),
      sale({ address: "Flat 3", date: "2025-01-09", price: 32_000_000 }),
    ];
    render(
      <SoldParcelPopup
        parcel={parcel({
          saleCount: 3,
          medianPricePence: 30_000_000,
          dominantPropertyType: "flat",
          sales,
        })}
      />,
    );

    expect(screen.getByText("3 sales in this building")).toBeInTheDocument();
    expect(screen.getByText("Flat 1")).toBeInTheDocument();
    expect(screen.getByText("Flat 2")).toBeInTheDocument();
    expect(screen.getByText("Flat 3")).toBeInTheDocument();
  });

  it("always shows the source-attribution footer", () => {
    render(<SoldParcelPopup parcel={parcel()} />);
    expect(
      screen.getByText("Sold prices: HM Land Registry. Floor areas: EPC."),
    ).toBeInTheDocument();
  });
});
