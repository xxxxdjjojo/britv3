/**
 * Mock for maplibre-gl and @vis.gl/react-maplibre.
 * WebGL is not available in test environments, so we mock the map classes.
 *
 * Usage:
 *   vi.mock("maplibre-gl", () => maplibreMock);
 *   vi.mock("@vis.gl/react-maplibre", () => reactMaplibreMock);
 */

import { vi } from "vitest";
import React from "react";

// -- maplibre-gl mock -------------------------------------------------------

class MockMap {
  on = vi.fn().mockReturnThis();
  off = vi.fn().mockReturnThis();
  once = vi.fn().mockReturnThis();
  addSource = vi.fn().mockReturnThis();
  removeSource = vi.fn().mockReturnThis();
  getSource = vi.fn().mockReturnValue(null);
  addLayer = vi.fn().mockReturnThis();
  removeLayer = vi.fn().mockReturnThis();
  getLayer = vi.fn().mockReturnValue(null);
  flyTo = vi.fn().mockReturnThis();
  fitBounds = vi.fn().mockReturnThis();
  setCenter = vi.fn().mockReturnThis();
  setZoom = vi.fn().mockReturnThis();
  getBounds = vi.fn().mockReturnValue({
    getNorth: () => 51.6,
    getSouth: () => 51.4,
    getEast: () => -0.0,
    getWest: () => -0.3,
    toArray: () => [[-0.3, 51.4], [-0.0, 51.6]],
  });
  getZoom = vi.fn().mockReturnValue(10);
  getCenter = vi.fn().mockReturnValue({ lng: -0.1276, lat: 51.5074 });
  remove = vi.fn();
  resize = vi.fn();
  loaded = vi.fn().mockReturnValue(true);
  queryRenderedFeatures = vi.fn().mockReturnValue([]);
}

class MockMarker {
  setLngLat = vi.fn().mockReturnThis();
  addTo = vi.fn().mockReturnThis();
  remove = vi.fn().mockReturnThis();
  getElement = vi.fn().mockReturnValue(document.createElement("div"));
}

class MockPopup {
  setLngLat = vi.fn().mockReturnThis();
  setHTML = vi.fn().mockReturnThis();
  addTo = vi.fn().mockReturnThis();
  remove = vi.fn().mockReturnThis();
}

export const maplibreMock = {
  default: {
    Map: MockMap,
    Marker: MockMarker,
    Popup: MockPopup,
    NavigationControl: vi.fn(),
    ScaleControl: vi.fn(),
    supported: vi.fn().mockReturnValue(true),
  },
  Map: MockMap,
  Marker: MockMarker,
  Popup: MockPopup,
  NavigationControl: vi.fn(),
  ScaleControl: vi.fn(),
  supported: vi.fn().mockReturnValue(true),
};

// -- @vis.gl/react-maplibre mock --------------------------------------------

function MockMapComponent({ children, ...props }: Record<string, unknown>) {
  return React.createElement(
    "div",
    { "data-testid": "mock-map", ...props },
    children as React.ReactNode,
  );
}

function MockSource({ children, ...props }: Record<string, unknown>) {
  // A geojson `data` prop is an object — spreading it onto a DOM div serializes
  // to "[object Object]". Also expose it as a JSON string so tests can assert on
  // the FeatureCollection contents. Additive; leaves the original spread intact.
  const geojson =
    props.data && typeof props.data === "object"
      ? JSON.stringify(props.data)
      : undefined;
  return React.createElement(
    "div",
    { "data-testid": "mock-source", ...props, "data-geojson": geojson },
    children as React.ReactNode,
  );
}

function MockLayer(props: Record<string, unknown>) {
  return React.createElement("div", {
    "data-testid": "mock-layer",
    ...props,
  });
}

// The detail map gates pin layers behind onLoad → pinsReady. The react-wrapper
// Map must fire onLoad once on mount with a stub map so those layers render in
// tests. Only the Map alias uses this — Marker/Popup/NavigationControl keep the
// plain MockMapComponent.
function MockMapWithLoad({ children, onLoad, ...props }: Record<string, unknown>) {
  React.useEffect(() => {
    if (typeof onLoad === "function") {
      // hasImage → true so registerPinImages short-circuits: jsdom has no real
      // canvas 2D context, so createFlagImage/createLollipopImage would throw.
      const stub = { addImage: vi.fn(), hasImage: () => true, on: vi.fn(), off: vi.fn(), easeTo: vi.fn() };
      (onLoad as (e: { target: unknown }) => void)({ target: stub });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return React.createElement("div", { "data-testid": "mock-map", ...props }, children as React.ReactNode);
}

export const reactMaplibreMock = {
  Map: MockMapWithLoad,
  Source: MockSource,
  Layer: MockLayer,
  useMap: vi.fn().mockReturnValue({ current: new MockMap() }),
  Marker: MockMapComponent,
  Popup: MockMapComponent,
  NavigationControl: MockMapComponent,
  ScaleControl: MockMapComponent,
};
