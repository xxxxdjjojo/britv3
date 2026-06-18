import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BOROUGH_AREAS } from "./areas";

/**
 * Guards the trap that made adding a new borough fragile: areas.ts declared a
 * `geojsonName` ending in `.geojson` while the bundled file was `.json`. Each
 * area's `geojsonName` must resolve to a real, loadable GeoJSON file under
 * src/data/geo so a new entry (Manchester, etc.) fails fast in CI, not silently
 * at runtime.
 */

const GEO_DIR = join(process.cwd(), "src/data/geo");

describe("BOROUGH_AREAS geojson integrity", () => {
  for (const [slug, area] of Object.entries(BOROUGH_AREAS)) {
    it(`${slug}: geojsonName resolves to a real GeoJSON file`, async () => {
      const filePath = join(GEO_DIR, area.geojsonName);
      expect(existsSync(filePath), `missing ${area.geojsonName}`).toBe(true);

      const mod = await import(/* @vite-ignore */ filePath);
      const geo = mod.default ?? mod;
      expect(geo.type).toBe("FeatureCollection");
      expect(Array.isArray(geo.features)).toBe(true);
      expect(geo.features.length).toBeGreaterThan(0);
    });
  }
});
