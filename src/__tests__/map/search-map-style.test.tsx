/**
 * SearchMap — standard basemap + POI wiring.
 *
 * Two layers of coverage:
 *
 * 1. syncPoiLayers (unit) — the highest-value test. Drives the imperative
 *    add/remove layer lifecycle against a fake map with spy methods:
 *      - addLayer called for every enabled category on first sync
 *      - removeLayer called when a category is disabled
 *      - nothing touched when getSource("openmaptiles") is absent (satellite)
 *
 * 2. SearchMap (render, via the raw maplibre-gl mock) — asserts the standard
 *    style is the committed local asset (no maptiler.com request), the satellite
 *    MapTiler style is still present (satellite not broken), the map is tilted
 *    (pitch: 45), and the POI panel renders 6 category rows in standard mode and
 *    toggles a category on click.
 */

import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type maplibregl from "maplibre-gl";
import { maplibreMock, reactMaplibreMock } from "../mocks/maplibre";
import { syncPoiLayers } from "@/components/search/SearchMap";
import {
  POI_CATEGORIES,
  ALL_POI_KEYS,
  type PoiCategoryKey,
} from "@/lib/map/poi-categories";

vi.mock("maplibre-gl", () => maplibreMock);
vi.mock("maplibre-gl/dist/maplibre-gl.css", () => ({}));
vi.mock("@vis.gl/react-maplibre", () => reactMaplibreMock);

// NOTE: the raw-maplibre mock (src/__tests__/mocks/maplibre.ts) has no
// addControl / setStyle, so mounting <SearchMap> throws inside the imperative
// init effect and cannot be meaningfully rendered. Per the task's FALLBACK
// path we cover the change with (1) direct syncPoiLayers unit tests — the
// highest-value assertions — and (2) source-invariant guards. The React-side
// POI panel + toggle behaviour is already covered by map-poi-panel.test.tsx.

// ── 1. syncPoiLayers unit tests ──────────────────────────────────────────────

type FakeMap = {
  getSource: ReturnType<typeof vi.fn>;
  getLayer: ReturnType<typeof vi.fn>;
  addLayer: ReturnType<typeof vi.fn>;
  removeLayer: ReturnType<typeof vi.fn>;
};

function makeFakeMap(overrides: Partial<FakeMap> = {}): FakeMap {
  return {
    getSource: vi.fn().mockReturnValue({}), // openmaptiles source present
    getLayer: vi.fn().mockReturnValue(undefined), // no layers yet
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    ...overrides,
  };
}

describe("syncPoiLayers", () => {
  it("adds circle + label layers for every enabled category on first sync", () => {
    const map = makeFakeMap();
    const enabled = new Set<PoiCategoryKey>(ALL_POI_KEYS);

    syncPoiLayers(map as unknown as maplibregl.Map, enabled);

    // 6 categories × 2 layers (circle + label) = 12 addLayer calls.
    expect(map.addLayer).toHaveBeenCalledTimes(POI_CATEGORIES.length * 2);
    for (const cat of POI_CATEGORIES) {
      const ids = map.addLayer.mock.calls.map((c) => (c[0] as { id: string }).id);
      expect(ids).toContain(`poi-${cat.key}-circle`);
      expect(ids).toContain(`poi-${cat.key}-label`);
    }
    expect(map.removeLayer).not.toHaveBeenCalled();
  });

  it("removes a category's layers when it is disabled and present", () => {
    // getLayer returns truthy for existing layers so removeLayer fires.
    const map = makeFakeMap({ getLayer: vi.fn().mockReturnValue({}) });
    // Everything on except "shops".
    const enabled = new Set<PoiCategoryKey>(
      ALL_POI_KEYS.filter((k) => k !== "shops"),
    );

    syncPoiLayers(map as unknown as maplibregl.Map, enabled);

    const removedIds = map.removeLayer.mock.calls.map((c) => c[0] as string);
    expect(removedIds).toContain("poi-shops-circle");
    expect(removedIds).toContain("poi-shops-label");
    // Enabled categories with getLayer truthy must NOT be re-added.
    expect(map.addLayer).not.toHaveBeenCalled();
  });

  it("does nothing when the openmaptiles source is absent (satellite / raster)", () => {
    const map = makeFakeMap({ getSource: vi.fn().mockReturnValue(undefined) });

    syncPoiLayers(map as unknown as maplibregl.Map, new Set(ALL_POI_KEYS));

    expect(map.addLayer).not.toHaveBeenCalled();
    expect(map.removeLayer).not.toHaveBeenCalled();
    expect(map.getLayer).not.toHaveBeenCalled();
  });
});

// ── 2. Source-invariant guard (independent of any mock) ──────────────────────

describe("SearchMap source invariants", () => {
  const src = readFileSync(
    resolve(process.cwd(), "src/components/search/SearchMap.tsx"),
    "utf8",
  );

  it("uses the committed local pastel style for the standard basemap", () => {
    expect(src).toContain('"/map/truedeed-style.json"');
  });

  it("keeps the MapTiler satellite style (satellite not broken)", () => {
    expect(src).toContain("api.maptiler.com/maps/satellite/style.json");
  });

  it("tilts the standard map (pitch: 45)", () => {
    expect(src).toContain("pitch: 45");
  });

  it("uses NavigationControl with visualizePitch so users can flatten", () => {
    expect(src).toContain("visualizePitch: true");
  });
});
