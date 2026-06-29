import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type { ReactNode } from "react";
import type { MarketMapFeatureProperties } from "@/services/market-map/types";
import type { SoldParcel } from "@/lib/market-map/sold-colour";

// ---------------------------------------------------------------------------
// Stubs the mocked MarketMap fires through its callbacks.
// ---------------------------------------------------------------------------

const STUB_AREA: MarketMapFeatureProperties = {
  area_id: "HA9",
  area_name: "HA9",
  geography_level: "postcode_district",
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
};

const STUB_PARCEL: SoldParcel = {
  inspireId: "INSPIRE-1",
  bucket: 6,
  saleCount: 1,
  medianPricePence: 45_000_000,
  medianPricePerSqmPence: 625_000,
  dominantPropertyType: "semi-detached",
  latestTransferDate: "2024-03-12",
  sales: [
    {
      address: "12 Acacia Avenue",
      date: "2024-03-12",
      price: 45_000_000,
      ppsqm: 625_000,
      type: "semi-detached",
      floorArea: 72,
      estimatedLocation: false,
    },
  ],
};

// Mock next/dynamic to bypass lazy-loading and inject a MarketMap stub that
// exposes buttons to fire the map callbacks. The real loader is ignored, so
// MapLibre is never imported.
vi.mock("next/dynamic", () => ({
  default: () =>
    function MarketMapStub(props: {
      onAreaSelect?: (p: unknown, a?: unknown) => void;
      onParcelSelect?: (p: unknown) => void;
    }) {
      return (
        <div data-testid="market-map-stub">
          <button
            type="button"
            onClick={() => props.onParcelSelect?.(STUB_PARCEL)}
          >
            fire-parcel
          </button>
          <button
            type="button"
            onClick={() => {
              props.onParcelSelect?.(null);
              props.onAreaSelect?.(STUB_AREA, { longitude: 0, latitude: 0 });
            }}
          >
            fire-area
          </button>
        </div>
      );
    },
}));

// Mock the three data hooks so no react-query provider / network is needed.
vi.mock("@/hooks/useMarketSearch", () => ({
  useMarketSearch: () => ({ results: [], isLoading: false }),
}));
vi.mock("@/hooks/useMarketAreaDetail", () => ({
  useMarketAreaDetail: () => ({ detail: null, isLoading: false }),
}));
vi.mock("@/hooks/useMarketAreaCard", () => ({
  useMarketAreaCard: () => ({ card: null, isLoading: false }),
}));

import { MarketMapExplorer } from "./MarketMapExplorer";

function renderExplorer() {
  return render(<MarketMapExplorer />, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <NuqsTestingAdapter>{children}</NuqsTestingAdapter>
    ),
  });
}

/** Scope queries to the desktop panel so the (later-mounted) mobile drawer
 *  never causes duplicate matches. */
function desktopPanel() {
  return within(screen.getByLabelText(/search, filters and area prices/i));
}

describe("MarketMapExplorer — Sales/Rent panel routing", () => {
  it("routes a parcel click into the panel with a Back control that clears it", () => {
    renderExplorer();
    const panel = desktopPanel();

    fireEvent.click(screen.getByRole("button", { name: "fire-parcel" }));

    // Parcel detail is shown in the panel.
    expect(panel.getByText("12 Acacia Avenue")).toBeInTheDocument();

    // Back control clears it.
    fireEvent.click(panel.getByRole("button", { name: /back/i }));
    expect(panel.queryByText("12 Acacia Avenue")).not.toBeInTheDocument();
  });

  it("clears the parcel when an area is selected, and clears the area when a parcel is selected", () => {
    renderExplorer();
    const panel = desktopPanel();

    // Select a parcel → parcel detail shown.
    fireEvent.click(screen.getByRole("button", { name: "fire-parcel" }));
    expect(panel.getByText("12 Acacia Avenue")).toBeInTheDocument();

    // Select an area → area content shown, parcel gone.
    fireEvent.click(screen.getByRole("button", { name: "fire-area" }));
    expect(panel.queryByText("12 Acacia Avenue")).not.toBeInTheDocument();
    expect(panel.getByRole("button", { name: /back to all areas/i })).toBeInTheDocument();

    // Select a parcel again → parcel shown, area content gone.
    fireEvent.click(screen.getByRole("button", { name: "fire-parcel" }));
    expect(panel.getByText("12 Acacia Avenue")).toBeInTheDocument();
    expect(
      panel.queryByRole("button", { name: /back to all areas/i }),
    ).not.toBeInTheDocument();
  });

  it("switches between Sales and Rent tabs", () => {
    renderExplorer();
    const panel = desktopPanel();

    fireEvent.click(panel.getByRole("tab", { name: /rent/i }));
    expect(panel.getByRole("heading", { name: /coming soon/i })).toBeInTheDocument();

    fireEvent.click(panel.getByRole("tab", { name: /sales/i }));
    expect(panel.queryByRole("heading", { name: /coming soon/i })).not.toBeInTheDocument();
  });

  it("forces the Sales tab when an area is selected from the Rent tab", () => {
    renderExplorer();
    const panel = desktopPanel();

    fireEvent.click(panel.getByRole("tab", { name: /rent/i }));
    expect(panel.getByRole("heading", { name: /coming soon/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "fire-area" }));
    expect(panel.queryByRole("heading", { name: /coming soon/i })).not.toBeInTheDocument();
    expect(panel.getByRole("button", { name: /back to all areas/i })).toBeInTheDocument();
    expect(panel.getByRole("tab", { name: /sales/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("forces the Sales tab when a parcel is selected from the Rent tab", () => {
    renderExplorer();
    const panel = desktopPanel();

    fireEvent.click(panel.getByRole("tab", { name: /rent/i }));
    expect(panel.getByRole("heading", { name: /coming soon/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "fire-parcel" }));
    expect(panel.getByText("12 Acacia Avenue")).toBeInTheDocument();
    expect(panel.getByRole("tab", { name: /sales/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
