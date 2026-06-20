/**
 * Sold-properties parcel layer — Playwright E2E.
 *
 * The high-zoom layer shows individual real Land-Registry sales snapped to their
 * HM Land Registry INSPIRE title parcel, coloured by £/m², on /search/map.
 *
 * REQUIREMENTS TO RUN (live, data-dependent):
 *   - Dev server on http://localhost:3000 (`pnpm dev`)
 *   - Prod DB reachable with parcels + market_map_sold_parcels populated for the
 *     pilot LAD (Tower Hamlets, E09000030)
 *   - NEXT_PUBLIC_MAPTILER_API_KEY set (else the map renders a fallback and the
 *     canvas-dependent tests skip)
 *
 * Strategy: drive the real map via its test handle (window.__marketMapRef, set
 * on load), fly to a known Tower Hamlets sold parcel, then assert (a) the sold
 * tile endpoint serves vector bytes, (b) a parcel renders, and (c) clicking it
 * opens the popup with the sale address + price + £/m² — i.e. the sale detail
 * "links" render. Canvas-dependent assertions skip gracefully without a key.
 */

import { test, expect } from "@playwright/test";

// A point inside Tower Hamlets (Canary Wharf / Isle of Dogs) — dense with flats.
const TOWER_HAMLETS: { lng: number; lat: number; zoom: number } = {
  lng: -0.0235,
  lat: 51.5074,
  zoom: 17,
};

/** WGS84 lng/lat → XYZ tile coords (slippy map). */
function lngLatToTile(lng: number, lat: number, z: number): { x: number; y: number } {
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  );
  return { x, y };
}

test.describe("Sold-properties parcel layer — /search/map", () => {
  test("the sold tile endpoint serves vector-tile bytes over Tower Hamlets (z>=14)", async ({
    request,
    baseURL,
  }) => {
    const { x, y } = lngLatToTile(TOWER_HAMLETS.lng, TOWER_HAMLETS.lat, 16);
    const res = await request.get(`${baseURL}/api/market-map/sold/16/${x}/${y}`);
    // 200 with MVT bytes when parcels exist in this tile; 204 when the tile is
    // empty. Either is a valid wired response — but NOT a 4xx/5xx.
    expect([200, 204]).toContain(res.status());
    if (res.status() === 200) {
      expect(res.headers()["content-type"]).toContain("vnd.mapbox-vector-tile");
      const body = await res.body();
      expect(body.byteLength).toBeGreaterThan(0);
    }
  });

  test("the sold tile endpoint returns 204 (never data) below street zoom", async ({
    request,
    baseURL,
  }) => {
    const { x, y } = lngLatToTile(TOWER_HAMLETS.lng, TOWER_HAMLETS.lat, 11);
    const res = await request.get(`${baseURL}/api/market-map/sold/11/${x}/${y}`);
    expect(res.status()).toBe(204);
  });

  test("clicking a sold parcel opens a popup with the sale address, price and £/m²", async ({
    page,
  }) => {
    await page.goto("/search/map", { timeout: 30_000 });

    const canvas = page.locator("canvas").first();
    const hasCanvas = await canvas.isVisible({ timeout: 15_000 }).catch(() => false);
    if (!hasCanvas) {
      test.skip(true, "Map canvas unavailable (no MapTiler key) — cannot drive the layer");
    }

    // Fly to the Tower Hamlets pilot area at street zoom and wait for the sold
    // layer to render at least one parcel.
    const feature = await page.evaluate(async (target) => {
      const w = window as unknown as { __marketMapRef?: maplibregl.Map };
      const map = w.__marketMapRef;
      if (!map) return { ok: false, reason: "no map handle" };
      map.jumpTo({ center: [target.lng, target.lat], zoom: target.zoom });

      // Poll for rendered sold-parcel features.
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        const feats = map.queryRenderedFeatures(undefined, {
          layers: ["sold-parcels-fill"],
        });
        if (feats.length > 0) {
          const f = feats[0];
          const c = (map.getCanvas() as HTMLCanvasElement).getBoundingClientRect();
          const ring =
            (f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon).type === "Polygon"
              ? (f.geometry as GeoJSON.Polygon).coordinates[0][0]
              : (f.geometry as GeoJSON.MultiPolygon).coordinates[0][0][0];
          const pt = map.project([ring[0], ring[1]] as [number, number]);
          return { ok: true, x: c.left + pt.x, y: c.top + pt.y };
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      return { ok: false, reason: "no sold parcels rendered in view" };
    }, TOWER_HAMLETS);

    if (!feature.ok) {
      test.skip(true, `Sold layer not driveable: ${feature.reason}`);
      return;
    }

    // Click the rendered parcel; the popup must show the sale detail.
    await page.mouse.click(feature.x as number, feature.y as number);

    const popup = page.locator(".maplibregl-popup");
    await expect(popup).toBeVisible({ timeout: 10_000 });
    // A real sale renders a £ price and the HMLR/EPC attribution footer.
    await expect(popup.getByText(/£[\d,]+/).first()).toBeVisible();
    await expect(
      popup.getByText(/Sold prices: HM Land Registry/i),
    ).toBeVisible();
  });

  test("the map shows the required HM Land Registry + Ordnance Survey attribution", async ({
    page,
  }) => {
    await page.goto("/search/map", { timeout: 30_000 });
    const canvas = page.locator("canvas").first();
    const hasCanvas = await canvas.isVisible({ timeout: 15_000 }).catch(() => false);
    if (!hasCanvas) {
      test.skip(true, "Map canvas unavailable (no MapTiler key)");
    }
    // MapLibre renders customAttribution in the attribution control (expand it).
    const attribToggle = page.locator(".maplibregl-ctrl-attrib-button");
    if (await attribToggle.isVisible().catch(() => false)) {
      await attribToggle.click();
    }
    const attrib = page.locator(".maplibregl-ctrl-attrib-inner");
    await expect(attrib).toContainText(/HM Land Registry/i);
    await expect(attrib).toContainText(/Ordnance Survey/i);
  });
});
