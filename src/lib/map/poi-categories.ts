/**
 * Single source of truth for map POI categories and their MapLibre layer specs.
 * Verified against live OpenFreeMap UK vector tiles.
 */

import type {
  CircleLayerSpecification,
  SymbolLayerSpecification,
} from "maplibre-gl";

export type PoiCategoryKey =
  | "leisure"
  | "shops"
  | "education"
  | "transport"
  | "health"
  | "estate_agents";

export type PoiCategory = Readonly<{
  key: PoiCategoryKey;
  label: string;
  color: string;
  /** MapLibre filter expression over the `poi` source-layer, Point geometry only. */
  filter: unknown;
}>;

// ── Private helpers ───────────────────────────────────────────────────────────

/** Point geometry guard shared by all filters. */
const POINT_GUARD: unknown = ["==", ["geometry-type"], "Point"];

/** Build a simple class-match filter for the poi source-layer. */
function classFilter(classes: string[]): unknown {
  return [
    "all",
    POINT_GUARD,
    ["match", ["get", "class"], classes, true, false],
  ];
}

// ── Category definitions ──────────────────────────────────────────────────────

export const POI_CATEGORIES: readonly PoiCategory[] = [
  {
    key: "leisure",
    label: "Leisure & dining",
    color: "#C26B84",
    filter: classFilter([
      "restaurant",
      "fast_food",
      "cafe",
      "bar",
      "beer",
      "cinema",
      "theatre",
      "museum",
      "ice_cream",
    ]),
  },
  {
    key: "shops",
    label: "Shops & services",
    color: "#C99A3C",
    filter: classFilter([
      "shop",
      "clothing_store",
      "grocery",
      "bakery",
      "alcohol_shop",
      "bank",
      "post",
      "hairdresser",
      "laundry",
    ]),
  },
  {
    key: "education",
    label: "Education",
    color: "#8A6D4B",
    filter: classFilter(["school", "college", "library"]),
  },
  {
    key: "transport",
    label: "Transport",
    color: "#4A7D8C",
    filter: classFilter(["bus", "railway", "ferry_terminal"]),
  },
  {
    key: "health",
    label: "Health",
    color: "#3E7D5A",
    filter: classFilter(["hospital", "pharmacy", "dentist", "doctors"]),
  },
  {
    key: "estate_agents",
    label: "Estate agents",
    color: "#1F2937",
    // Compound filter: class == "office" AND subclass == "estate_agent"
    filter: [
      "all",
      POINT_GUARD,
      ["==", ["get", "class"], "office"],
      ["==", ["get", "subclass"], "estate_agent"],
    ],
  },
] as const;

/** All category keys — convenience for "all on" default. */
export const ALL_POI_KEYS: readonly PoiCategoryKey[] = POI_CATEGORIES.map(
  (c) => c.key,
);

// ── Layer spec factories ──────────────────────────────────────────────────────

/** MapLibre circle layer spec for a category's pins. */
export function poiCircleLayerSpec(
  category: PoiCategory,
): CircleLayerSpecification {
  return {
    id: `poi-${category.key}-circle`,
    type: "circle",
    source: "openmaptiles",
    "source-layer": "poi",
    minzoom: 14,
    filter: category.filter as CircleLayerSpecification["filter"],
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        14,
        3.5,
        17,
        6.5,
      ],
      "circle-color": category.color,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1.5,
      "circle-opacity": 0.9,
    },
  };
}

/** MapLibre symbol (text label) layer spec for a category's pins. */
export function poiTextLayerSpec(
  category: PoiCategory,
): SymbolLayerSpecification {
  return {
    id: `poi-${category.key}-label`,
    type: "symbol",
    source: "openmaptiles",
    "source-layer": "poi",
    minzoom: 16,
    filter: category.filter as SymbolLayerSpecification["filter"],
    layout: {
      "text-field": ["coalesce", ["get", "name:latin"], ["get", "name"]],
      // Must match a glyph name provided by the style's glyphs endpoint (OpenFreeMap Noto Sans).
      "text-font": ["Noto Sans Italic"],
      "text-size": 11,
      "text-offset": [0, 1.1],
      "text-anchor": "top",
      "text-optional": true,
      "text-max-width": 8,
    },
    paint: {
      "text-color": category.color,
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.2,
    },
  };
}
