import { readFileSync } from "fs";
import { join } from "path";
import { describe, it, expect } from "vitest";
import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";

const STYLE_PATH = join(process.cwd(), "public/map/truedeed-style.json");

describe("truedeed-style.json", () => {
  let style: ReturnType<typeof JSON.parse>;

  // Load the file once — if it doesn't exist the parse will throw, failing all tests.
  try {
    style = JSON.parse(readFileSync(STYLE_PATH, "utf8"));
  } catch {
    // Will be caught per-test via the undefined style reference.
  }

  it("file exists and is valid JSON", () => {
    expect(style).toBeDefined();
  });

  it("(a) background layer has paint.background-color === #f1ead9", () => {
    const bg = style.layers.find((l: { type: string }) => l.type === "background");
    expect(bg).toBeDefined();
    expect(bg.paint["background-color"]).toBe("#f1ead9");
  });

  it("(b) exactly one visible building layer: td-buildings-3d, fill-extrusion, minzoom 13, coalesce height", () => {
    const visibleBuildingLayers = style.layers.filter(
      (l: { "source-layer"?: string; layout?: { visibility?: string } }) =>
        l["source-layer"] === "building" &&
        l?.layout?.visibility !== "none"
    );
    expect(visibleBuildingLayers).toHaveLength(1);

    const layer = visibleBuildingLayers[0];
    expect(layer.id).toBe("td-buildings-3d");
    expect(layer.type).toBe("fill-extrusion");
    expect(layer.minzoom).toBe(13);

    const heightExpr = layer.paint["fill-extrusion-height"];
    expect(Array.isArray(heightExpr)).toBe(true);
    expect(heightExpr[0]).toBe("coalesce");
  });

  it("(c) td-buildings-3d appears immediately before the first visible symbol layer", () => {
    const layers = style.layers as Array<{
      id: string;
      type: string;
      layout?: { visibility?: string };
    }>;

    const tdIdx = layers.findIndex((l) => l.id === "td-buildings-3d");
    expect(tdIdx).toBeGreaterThanOrEqual(0);

    // First visible symbol layer
    const firstVisibleSymIdx = layers.findIndex(
      (l) =>
        l.type === "symbol" &&
        (!l.layout?.visibility || l.layout.visibility !== "none")
    );
    expect(firstVisibleSymIdx).toBeGreaterThanOrEqual(0);

    expect(tdIdx + 1).toBe(firstVisibleSymIdx);
  });

  it("(d) all visible symbol layers have source-layer in [place, transportation_name, water_name]", () => {
    const allowed = new Set(["place", "transportation_name", "water_name"]);
    const visibleSymLayers = style.layers.filter(
      (l: { type: string; layout?: { visibility?: string } }) =>
        l.type === "symbol" &&
        (!l.layout?.visibility || l.layout.visibility !== "none")
    );
    for (const layer of visibleSymLayers) {
      expect(allowed.has(layer["source-layer"]), `layer ${layer.id} has source-layer ${layer["source-layer"]}`).toBe(true);
    }
  });

  it("(e) glyphs and sprite contain openfreemap.org; vector tile source URL contains openfreemap.org", () => {
    expect(style.glyphs).toContain("openfreemap.org");
    expect(style.sprite).toContain("openfreemap.org");

    const sources = Object.values(style.sources) as Array<{
      type: string;
      url?: string;
    }>;
    const vectorSource = sources.find((s) => s.type === "vector");
    expect(vectorSource).toBeDefined();
    expect(vectorSource!.url).toContain("openfreemap.org");
  });

  it("(f) validateStyleMin returns zero errors", () => {
    const errors = validateStyleMin(style);
    expect(errors).toHaveLength(0);
  });
});
