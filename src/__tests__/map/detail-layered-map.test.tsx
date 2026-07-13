import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { maplibreMock, reactMaplibreMock } from "@/__tests__/mocks/maplibre";

vi.mock("maplibre-gl", () => maplibreMock);
vi.mock("@vis.gl/react-maplibre", () => reactMaplibreMock);
vi.mock("maplibre-gl/dist/maplibre-gl.css", () => ({}));
vi.mock("@/hooks/useMarketMapVersion", () => ({ useMarketMapVersion: () => "1" }));

// Import the Inner component directly (not the dynamic wrapper)
import DetailLayeredMapInner from "@/components/properties/blocks/DetailLayeredMapInner";

const BASE_PROPS = {
  latitude: 51.5074,
  longitude: -0.1276,
  address: "1 Test Street, London",
};

describe("DetailLayeredMapInner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing with required props", () => {
    const { container } = render(<DetailLayeredMapInner {...BASE_PROPS} />);
    expect(container).toBeTruthy();
  });

  it("does NOT use a maptiler.com mapStyle URL", () => {
    render(<DetailLayeredMapInner {...BASE_PROPS} />);
    // Verify no element in the DOM contains a maptiler URL as an attribute value
    const allElements = document.querySelectorAll("[mapstyle]");
    allElements.forEach((el) => {
      expect(el.getAttribute("mapstyle")).not.toContain("maptiler");
    });
    // Also check the rendered output text contains no maptiler reference
    expect(document.body.innerHTML).not.toContain("maptiler.com");
  });

  it("renders a price chip when priceFormatted is provided", () => {
    render(<DetailLayeredMapInner {...BASE_PROPS} priceFormatted="£450,000" />);
    expect(screen.getByText("£450,000")).toBeInTheDocument();
  });

  it("renders all three layer chips: Area prices, Sold prices, 3D", () => {
    render(<DetailLayeredMapInner {...BASE_PROPS} />);
    expect(screen.getByText("Area prices")).toBeInTheDocument();
    expect(screen.getByText("Sold prices")).toBeInTheDocument();
    expect(screen.getByText("3D")).toBeInTheDocument();
  });

  // ── POI panel ────────────────────────────────────────────────────────────────

  it("renders the POI panel with all 6 category labels", () => {
    render(<DetailLayeredMapInner {...BASE_PROPS} />);
    expect(screen.getByText("Leisure & dining")).toBeInTheDocument();
    expect(screen.getByText("Shops & services")).toBeInTheDocument();
    expect(screen.getByText("Education")).toBeInTheDocument();
    expect(screen.getByText("Transport")).toBeInTheDocument();
    expect(screen.getByText("Health")).toBeInTheDocument();
    expect(screen.getByText("Estate agents")).toBeInTheDocument();
  });

  it("all 6 POI category checkboxes are checked by default", () => {
    render(<DetailLayeredMapInner {...BASE_PROPS} />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(6);
    checkboxes.forEach((cb) => {
      expect(cb).toBeChecked();
    });
  });

  it("unchecks a POI category when its checkbox is clicked", () => {
    render(<DetailLayeredMapInner {...BASE_PROPS} />);

    const leisureCheckbox = screen.getByRole("checkbox", {
      name: /leisure & dining/i,
    });
    expect(leisureCheckbox).toBeChecked();

    fireEvent.click(leisureCheckbox);

    expect(leisureCheckbox).not.toBeChecked();
  });

  // ── POI layers (via MockLayer id attribute) ──────────────────────────────────
  // MockLayer renders a <div data-testid="mock-layer" id="..." /> for each Layer.
  // The id prop from poiSymbolLayerSpec is spread onto the div, so we can query
  // by id to confirm layers are added/removed with category state. The mock Map
  // fires onLoad on mount → pinsReady is true, so the gated pin layers render.

  it("renders POI lollipop pin layers for all enabled categories by default", () => {
    const { container } = render(<DetailLayeredMapInner {...BASE_PROPS} />);
    // All 6 categories on by default → 6 pin layers present
    expect(container.querySelector("#poi-leisure-pin")).toBeInTheDocument();
    expect(container.querySelector("#poi-shops-pin")).toBeInTheDocument();
    expect(container.querySelector("#poi-education-pin")).toBeInTheDocument();
    expect(container.querySelector("#poi-transport-pin")).toBeInTheDocument();
    expect(container.querySelector("#poi-health-pin")).toBeInTheDocument();
    expect(container.querySelector("#poi-estate_agents-pin")).toBeInTheDocument();
  });

  it("removes POI pin layers for a category after toggling it off", () => {
    const { container } = render(<DetailLayeredMapInner {...BASE_PROPS} />);

    // Confirm leisure pin is present initially
    expect(container.querySelector("#poi-leisure-pin")).toBeInTheDocument();

    // Toggle leisure off
    const leisureCheckbox = screen.getByRole("checkbox", {
      name: /leisure & dining/i,
    });
    fireEvent.click(leisureCheckbox);

    // Leisure pin should be gone; others should remain
    expect(container.querySelector("#poi-leisure-pin")).not.toBeInTheDocument();
    expect(container.querySelector("#poi-shops-pin")).toBeInTheDocument();
  });

  // ── Result-flag pins ─────────────────────────────────────────────────────────

  it("renders the td-result-flags layer once pins are ready", () => {
    const { container } = render(<DetailLayeredMapInner {...BASE_PROPS} />);
    expect(container.querySelector("#td-result-flags")).toBeInTheDocument();
  });

  it("feeds nearby listings into the td-results source as price features", () => {
    const { container } = render(
      <DetailLayeredMapInner
        {...BASE_PROPS}
        nearbyListings={[
          { id: "1", slug: "a", priceLabel: "£500,000", lat: 51.5, lng: -0.1 },
        ]}
      />,
    );

    // MockSource exposes the geojson `data` object as a JSON string on
    // data-geojson (a plain object spread would serialize to "[object Object]").
    const source = container.querySelector("#td-results");
    expect(source).toBeInTheDocument();

    const raw = source?.getAttribute("data-geojson");
    expect(raw).toBeTruthy();
    const fc = JSON.parse(raw as string) as {
      features: { properties: { price: string } }[];
    };
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0].properties.price).toBe("£500,000");
  });

  it("renders an empty td-results FeatureCollection when no nearby listings", () => {
    const { container } = render(<DetailLayeredMapInner {...BASE_PROPS} />);
    const source = container.querySelector("#td-results");
    const fc = JSON.parse(source?.getAttribute("data-geojson") as string) as {
      features: unknown[];
    };
    expect(fc.features).toHaveLength(0);
  });
});
