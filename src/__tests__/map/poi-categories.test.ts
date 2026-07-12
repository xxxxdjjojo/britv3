/**
 * Tests for POI category definitions and MapLibre layer specs.
 * Write first (RED), then implement (GREEN).
 */

import { describe, it, expect } from "vitest";
import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";
import {
  POI_CATEGORIES,
  ALL_POI_KEYS,
  POI_MINZOOM,
  poiCircleLayerSpec,
  poiTextLayerSpec,
  poiSymbolLayerSpec,
  type PoiCategoryKey,
} from "../../lib/map/poi-categories";

// ── 1. POI_CATEGORIES shape ──────────────────────────────────────────────────

describe("POI_CATEGORIES", () => {
  it("has exactly 6 categories", () => {
    expect(POI_CATEGORIES.length).toBe(6);
  });

  it("has unique keys", () => {
    const keys = POI_CATEGORIES.map((c) => c.key);
    expect(new Set(keys).size).toBe(6);
  });

  it("has unique colors", () => {
    const colors = POI_CATEGORIES.map((c) => c.color);
    expect(new Set(colors).size).toBe(6);
  });

  it("every label is a non-empty string", () => {
    for (const cat of POI_CATEGORIES) {
      expect(typeof cat.label).toBe("string");
      expect(cat.label.length).toBeGreaterThan(0);
    }
  });
});

// ── 2. ALL_POI_KEYS ──────────────────────────────────────────────────────────

describe("ALL_POI_KEYS", () => {
  it("equals the six expected keys", () => {
    const expected: PoiCategoryKey[] = [
      "leisure",
      "shops",
      "education",
      "transport",
      "health",
      "estate_agents",
    ];
    expect([...ALL_POI_KEYS].sort()).toEqual([...expected].sort());
  });
});

// ── 3. Filter shape ───────────────────────────────────────────────────────────

describe("category filters", () => {
  it("every filter is an array starting with 'all'", () => {
    for (const cat of POI_CATEGORIES) {
      const filter = cat.filter as unknown[];
      expect(Array.isArray(filter)).toBe(true);
      expect(filter[0]).toBe("all");
    }
  });

  it("every filter contains a Point geometry-type guard", () => {
    for (const cat of POI_CATEGORIES) {
      const filterStr = JSON.stringify(cat.filter);
      expect(filterStr).toContain("geometry-type");
      expect(filterStr).toContain("Point");
    }
  });
});

// ── 4. Regression guards (verified UK tile classes) ──────────────────────────

function flattenExpr(expr: unknown): unknown[] {
  if (!Array.isArray(expr)) return [];
  const out: unknown[] = [...expr];
  for (const item of expr) {
    if (Array.isArray(item)) out.push(...flattenExpr(item));
  }
  return out;
}

describe("filter regression guards", () => {
  const byKey = Object.fromEntries(POI_CATEGORIES.map((c) => [c.key, c]));

  it("transport includes 'railway' and 'bus', NOT 'rail'", () => {
    const flat = flattenExpr(byKey["transport"].filter);
    expect(flat).toContain("railway");
    expect(flat).toContain("bus");
    expect(flat).not.toContain("rail");
  });

  it("education includes 'college'", () => {
    const flat = flattenExpr(byKey["education"].filter);
    expect(flat).toContain("college");
  });

  it("health includes 'hospital'", () => {
    const flat = flattenExpr(byKey["health"].filter);
    expect(flat).toContain("hospital");
  });

  it("leisure includes 'beer'", () => {
    const flat = flattenExpr(byKey["leisure"].filter);
    expect(flat).toContain("beer");
  });

  it("estate_agents filter references 'office' and 'estate_agent'", () => {
    const flat = flattenExpr(byKey["estate_agents"].filter);
    expect(flat).toContain("office");
    expect(flat).toContain("estate_agent");
  });
});

// ── 5. poiCircleLayerSpec ─────────────────────────────────────────────────────

describe("poiCircleLayerSpec", () => {
  it("returns valid circle layer for every category", () => {
    for (const cat of POI_CATEGORIES) {
      const spec = poiCircleLayerSpec(cat);
      expect(spec["type"]).toBe("circle");
      expect(spec["source"]).toBe("openmaptiles");
      expect(spec["source-layer"]).toBe("poi");
      expect(String(spec["id"])).toContain(cat.key);
      const paint = spec["paint"] as Record<string, unknown>;
      expect(paint["circle-color"]).toBe(cat.color);
    }
  });

  it("minzoom is 14", () => {
    for (const cat of POI_CATEGORIES) {
      expect(poiCircleLayerSpec(cat)["minzoom"]).toBe(14);
    }
  });
});

// ── 6. poiTextLayerSpec ───────────────────────────────────────────────────────

describe("poiTextLayerSpec", () => {
  it("returns valid symbol layer for every category", () => {
    for (const cat of POI_CATEGORIES) {
      const spec = poiTextLayerSpec(cat);
      expect(spec["type"]).toBe("symbol");
      expect(spec["source"]).toBe("openmaptiles");
      expect(spec["source-layer"]).toBe("poi");
      expect(String(spec["id"])).toContain(cat.key);
      const paint = spec["paint"] as Record<string, unknown>;
      expect(paint["text-color"]).toBe(cat.color);
    }
  });

  it("text minzoom (16) is >= circle minzoom (14)", () => {
    for (const cat of POI_CATEGORIES) {
      const circleZoom = poiCircleLayerSpec(cat)["minzoom"] as number;
      const textZoom = poiTextLayerSpec(cat)["minzoom"] as number;
      expect(textZoom).toBeGreaterThanOrEqual(circleZoom);
    }
  });

  it("text minzoom is 16", () => {
    for (const cat of POI_CATEGORIES) {
      expect(poiTextLayerSpec(cat)["minzoom"]).toBe(16);
    }
  });
});

// ── 7. MapLibre style validation ──────────────────────────────────────────────

describe("validateStyleMin", () => {
  it("accepts a minimal style containing all POI layers", () => {
    const circleSpecs = POI_CATEGORIES.map(poiCircleLayerSpec);
    const textSpecs = POI_CATEGORIES.map(poiTextLayerSpec);

    const style = {
      version: 8 as const,
      sources: {
        openmaptiles: {
          type: "vector" as const,
          tiles: ["https://x/{z}/{x}/{y}.pbf"],
        },
      },
      layers: [...circleSpecs, ...textSpecs],
    };

    // validateStyleMin returns an array of error objects; expect no errors
    const errors = validateStyleMin(style as Parameters<typeof validateStyleMin>[0]);
    expect(errors).toEqual([]);
  });
});

// ── 8. POI_MINZOOM ────────────────────────────────────────────────────────────

describe("POI_MINZOOM", () => {
  it("equals 15", () => {
    expect(POI_MINZOOM).toBe(15);
  });
});

// ── 9. poiSymbolLayerSpec ─────────────────────────────────────────────────────

describe("poiSymbolLayerSpec", () => {
  it("returns id `poi-{key}-pin` for every category", () => {
    for (const cat of POI_CATEGORIES) {
      const spec = poiSymbolLayerSpec(cat);
      expect(spec.id).toBe(`poi-${cat.key}-pin`);
    }
  });

  it("type is symbol for every category", () => {
    for (const cat of POI_CATEGORIES) {
      expect(poiSymbolLayerSpec(cat).type).toBe("symbol");
    }
  });

  it("source is openmaptiles for every category", () => {
    for (const cat of POI_CATEGORIES) {
      expect(poiSymbolLayerSpec(cat).source).toBe("openmaptiles");
    }
  });

  it("source-layer is poi for every category", () => {
    for (const cat of POI_CATEGORIES) {
      expect(poiSymbolLayerSpec(cat)["source-layer"]).toBe("poi");
    }
  });

  it("minzoom equals POI_MINZOOM for every category", () => {
    for (const cat of POI_CATEGORIES) {
      expect(poiSymbolLayerSpec(cat).minzoom).toBe(POI_MINZOOM);
    }
  });

  it("filter is the same reference/value as cat.filter for every category", () => {
    for (const cat of POI_CATEGORIES) {
      expect(poiSymbolLayerSpec(cat).filter).toEqual(cat.filter);
    }
  });

  it("layout icon-image is `poi-pin-{key}` for every category", () => {
    for (const cat of POI_CATEGORIES) {
      const layout = poiSymbolLayerSpec(cat).layout as Record<string, unknown>;
      expect(layout["icon-image"]).toBe(`poi-pin-${cat.key}`);
    }
  });

  it("layout icon-anchor is bottom for every category", () => {
    for (const cat of POI_CATEGORIES) {
      const layout = poiSymbolLayerSpec(cat).layout as Record<string, unknown>;
      expect(layout["icon-anchor"]).toBe("bottom");
    }
  });

  it("layout icon-allow-overlap is true for every category", () => {
    for (const cat of POI_CATEGORIES) {
      const layout = poiSymbolLayerSpec(cat).layout as Record<string, unknown>;
      expect(layout["icon-allow-overlap"]).toBe(true);
    }
  });

  it("layout text-font deep-equals ['Noto Sans Regular'] (glyph name regression guard)", () => {
    for (const cat of POI_CATEGORIES) {
      const layout = poiSymbolLayerSpec(cat).layout as Record<string, unknown>;
      expect(layout["text-font"]).toEqual(["Noto Sans Regular"]);
    }
  });

  it("layout text-field deep-equals coalesce expression", () => {
    for (const cat of POI_CATEGORIES) {
      const layout = poiSymbolLayerSpec(cat).layout as Record<string, unknown>;
      expect(layout["text-field"]).toEqual([
        "coalesce",
        ["get", "name:latin"],
        ["get", "name"],
      ]);
    }
  });
});

// ── 10. Regression guard: existing circle/text factories unchanged ─────────────

describe("existing factory regression guards (SearchMap compatibility)", () => {
  it("poiCircleLayerSpec id ends with -circle", () => {
    for (const cat of POI_CATEGORIES) {
      expect(poiCircleLayerSpec(cat).id).toBe(`poi-${cat.key}-circle`);
    }
  });

  it("poiCircleLayerSpec type is circle", () => {
    for (const cat of POI_CATEGORIES) {
      expect(poiCircleLayerSpec(cat).type).toBe("circle");
    }
  });

  it("poiTextLayerSpec id ends with -label", () => {
    for (const cat of POI_CATEGORIES) {
      expect(poiTextLayerSpec(cat).id).toBe(`poi-${cat.key}-label`);
    }
  });

  it("poiTextLayerSpec type is symbol", () => {
    for (const cat of POI_CATEGORIES) {
      expect(poiTextLayerSpec(cat).type).toBe("symbol");
    }
  });
});
