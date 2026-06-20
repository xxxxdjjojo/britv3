/**
 * scripts/shot-sold-parcels.mjs
 *
 * Drives the live /search/map with a real WebGL (SwiftShader) Chromium, flies to
 * the Tower Hamlets pilot area at street zoom, and screenshots the sold-parcels
 * layer + a sale popup as proof. Output PNGs go to the repo root.
 *
 *   node scripts/shot-sold-parcels.mjs
 */
import { chromium } from "@playwright/test";

const BASE = process.env.SHOT_BASE ?? "http://localhost:3000";
const OUT = process.env.SHOT_OUT ?? ".";

const VIEWS = [
  { name: "01-bow-z16", lng: -0.0467, lat: 51.5309, zoom: 16 },
  { name: "02-bow-z17", lng: -0.0467, lat: 51.5309, zoom: 17.4 },
];
// Where to fly for the popup capture (dense, flat-block-rich).
const POPUP_VIEW = { lng: -0.0467, lat: 51.5309, zoom: 17.4 };

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--ignore-gpu-blocklist",
      "--enable-webgl",
    ],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("console", (m) => {
    if (m.type() === "error") console.log("  [browser error]", m.text().slice(0, 160));
  });

  await page.goto(`${BASE}/search/map`, { waitUntil: "domcontentloaded", timeout: 45_000 });
  // Dismiss the cookie banner so it doesn't obscure the bottom-left legend.
  await page
    .getByRole("button", { name: /Accept All/i })
    .click({ timeout: 4000 })
    .catch(() => {});
  // Hide the Next.js dev-mode indicator so it doesn't obscure the legend.
  await page.addStyleTag({
    content: "nextjs-portal,[data-nextjs-toast],#__next-build-watcher{display:none !important}",
  }).catch(() => {});
  await page.waitForSelector("canvas", { timeout: 30_000 });
  // Wait for the map handle + style load.
  await page.waitForFunction(
    () => {
      const m = window.__marketMapRef;
      return m && m.isStyleLoaded && m.isStyleLoaded();
    },
    { timeout: 30_000 },
  );

  for (const v of VIEWS) {
    const featureCount = await page.evaluate(async (view) => {
      const m = window.__marketMapRef;
      m.jumpTo({ center: [view.lng, view.lat], zoom: view.zoom });
      const deadline = Date.now() + 20_000;
      let n = 0;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 500));
        n = m.queryRenderedFeatures(undefined, { layers: ["sold-parcels-fill"] }).length;
        if (n > 0 && m.areTilesLoaded()) break;
      }
      return n;
    }, v);

    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/sold-${v.name}.png` });
    // Hero clip: just the map canvas region (the page reserves ~half for filters).
    const canvasBox = await page.locator("canvas").first().boundingBox();
    if (canvasBox) {
      await page.screenshot({ path: `${OUT}/sold-${v.name}-map.png`, clip: canvasBox });
    }
    console.log(`  ${v.name}: ${featureCount} sold parcels rendered → sold-${v.name}.png`);
  }

  // Fly back to the dense view, then click a flat-block parcel and screenshot.
  const clicked = await page.evaluate(async (view) => {
    const m = window.__marketMapRef;
    m.jumpTo({ center: [view.lng, view.lat], zoom: view.zoom });
    const deadline = Date.now() + 20_000;
    let feats = [];
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 500));
      feats = m.queryRenderedFeatures(undefined, { layers: ["sold-parcels-fill"] });
      if (feats.length > 0 && m.areTilesLoaded()) break;
    }
    // Prefer a flat block to show the sale list.
    const target =
      feats.find((f) => Number(f.properties.sale_count) > 3) ?? feats[0];
    if (!target) return null;
    const geom = target.geometry;
    const ring = geom.type === "Polygon" ? geom.coordinates[0] : geom.coordinates[0][0];
    // Rough centroid of the exterior ring, so the click lands inside the fill.
    let sx = 0, sy = 0;
    for (const [lng, lat] of ring) { sx += lng; sy += lat; }
    const pt = m.project([sx / ring.length, sy / ring.length]);
    const rect = m.getCanvas().getBoundingClientRect();
    return { x: rect.left + pt.x, y: rect.top + pt.y, saleCount: Number(target.properties.sale_count) };
  }, POPUP_VIEW);

  const legendVisible = await page
    .getByRole("img", { name: /Sold price per square metre/i })
    .isVisible()
    .catch(() => false);
  console.log(`  street-zoom £/m² legend visible: ${legendVisible}`);

  if (clicked) {
    await page.mouse.click(clicked.x, clicked.y);
    const popup = page.locator(".maplibregl-popup-content").first();
    await popup.waitFor({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/sold-03-popup.png` });
    // Crisp, cropped popup proof.
    const pbox = await popup.boundingBox().catch(() => null);
    if (pbox) {
      const pad = 8;
      await page.screenshot({
        path: `${OUT}/sold-04-popup-clip.png`,
        clip: { x: pbox.x - pad, y: pbox.y - pad, width: pbox.width + 2 * pad, height: pbox.height + 2 * pad },
      });
    }
    console.log(`  popup (sale_count=${clicked.saleCount}) → sold-03-popup.png + sold-04-popup-clip.png`);
  } else {
    console.log("  no parcel to click for popup");
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
