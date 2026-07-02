import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Guard: cooperative touch gestures on embedded maps (audit F2) and
 * thumb-zone navigation control placement on the full-viewport market map (F19).
 *
 * Source-scanning style — mirrors form-control-sizing.test.ts pattern.
 */

const ROOT = join(process.cwd(), "src");

const mapEmbed = readFileSync(join(ROOT, "components/maps/MapEmbed.tsx"), "utf8");
const propertyMapInner = readFileSync(join(ROOT, "components/properties/detail/PropertyMapInner.tsx"), "utf8");
const detailLayeredMapInner = readFileSync(join(ROOT, "components/properties/blocks/DetailLayeredMapInner.tsx"), "utf8");
const serviceAreaMapEditor = readFileSync(join(ROOT, "components/dashboard/provider/ServiceAreaMapEditor.tsx"), "utf8");
const propertyMap = readFileSync(join(ROOT, "components/map/PropertyMap.tsx"), "utf8");
const marketMap = readFileSync(join(ROOT, "components/market-map/MarketMap.tsx"), "utf8");
const marketMapLegend = readFileSync(join(ROOT, "components/market-map/MarketMapLegend.tsx"), "utf8");

describe("cooperative gestures on embedded maps (F2)", () => {
  it("MapEmbed passes cooperativeGestures to <Map>", () => {
    expect(mapEmbed).toContain("cooperativeGestures");
  });

  it("PropertyMapInner passes cooperativeGestures to <Map>", () => {
    expect(propertyMapInner).toContain("cooperativeGestures");
  });

  it("DetailLayeredMapInner passes cooperativeGestures to <MapGL>", () => {
    expect(detailLayeredMapInner).toContain("cooperativeGestures");
  });

  it("ServiceAreaMapEditor passes cooperativeGestures: true to imperative Map constructor", () => {
    expect(serviceAreaMapEditor).toContain("cooperativeGestures");
  });

  it("PropertyMap declares a cooperativeGestures prop defaulting to true", () => {
    // Matches: cooperativeGestures = true  (destructured default)
    expect(propertyMap).toMatch(/cooperativeGestures\s*=\s*true/);
  });
});

describe("thumb-zone navigation control placement (F19)", () => {
  it("MarketMap NavigationControl uses position=\"bottom-right\"", () => {
    expect(marketMap).toContain('position="bottom-right"');
  });
});

describe("legend text size floor (F19)", () => {
  it("MarketMapLegend does not use text-[10px] (too small for mobile)", () => {
    expect(marketMapLegend).not.toContain("text-[10px]");
  });
});
