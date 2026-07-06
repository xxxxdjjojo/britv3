import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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
});
