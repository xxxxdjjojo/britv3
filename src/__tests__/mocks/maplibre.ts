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
  return React.createElement(
    "div",
    { "data-testid": "mock-source", ...props },
    children as React.ReactNode,
  );
}

function MockLayer(props: Record<string, unknown>) {
  return React.createElement("div", {
    "data-testid": "mock-layer",
    ...props,
  });
}

export const reactMaplibreMock = {
  Map: MockMapComponent,
  Source: MockSource,
  Layer: MockLayer,
  useMap: vi.fn().mockReturnValue({ current: new MockMap() }),
  Marker: MockMapComponent,
  Popup: MockMapComponent,
  NavigationControl: MockMapComponent,
  ScaleControl: MockMapComponent,
};
