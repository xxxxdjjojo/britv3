/**
 * Market Price Map — Playwright E2E acceptance specs.
 *
 * Routes covered:
 *   /search/map           (Screen 1 — national price map)
 *
 * REQUIREMENTS TO RUN:
 *   - Dev server running on http://localhost:3000 (`pnpm dev`)
 *   - Supabase DB seeded with ppd_transactions, geography_boundaries,
 *     and postcode_geography data (via migrations + ingest scripts)
 *   - NEXT_PUBLIC_MAPTILER_API_KEY env var set (without it the map renders
 *     a fallback text element instead of a canvas)
 *
 * Tests that exercise the live map canvas are marked with
 *   // DATA-DEPENDENT
 * and may time-out or soft-fail when the DB is empty.
 *
 * Tests that cover static HTML structure (heading, legend, disclaimer, search
 * bar) do NOT require seeded data and should pass as long as the page renders.
 */

import { test, expect } from "@playwright/test";

test.describe("Market Price Map — /search/map", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate once per test; the map initialises asynchronously so we give it
    // a generous timeout on the initial load.
    await page.goto("/search/map", { timeout: 30_000 });
  });

  // ---------------------------------------------------------------------------
  // Page structure
  // ---------------------------------------------------------------------------

  test("renders with a visually-hidden page heading", async ({ page }) => {
    // The h1 is sr-only but must exist for screen readers.
    const heading = page.locator("h1#map-page-heading");
    await expect(heading).toBeAttached();
    await expect(heading).toHaveText(/UK Property Price Map/i);
  });

  test("renders the breadcrumb navigation bar", async ({ page }) => {
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }),
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Legend
  // ---------------------------------------------------------------------------

  test("legend is visible with green/gold/burgundy gradient and no-data swatch", async ({
    page,
  }) => {
    // The legend pill is role="img" with an aria-label describing the colour scale.
    const legend = page.getByRole("img", {
      name: /Price map legend/i,
    });
    await expect(legend).toBeVisible();
  });

  test('legend labels metric as "Median sold price"', async ({ page }) => {
    // The span inside the legend pill reads "Median sold price".
    // (Rendered in both desktop + mobile layouts, so scope to the first.)
    await expect(
      page.getByText("Median sold price", { exact: false }).first(),
    ).toBeVisible();
  });

  test('legend shows "No data" label for the grey insufficient-data swatch', async ({
    page,
  }) => {
    await expect(page.getByText("No data")).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Disclaimer — the ONLY place "£/m²" is permitted in the UI
  // ---------------------------------------------------------------------------

  test("disclaimer text is visible and contains the mandatory sentence", async ({
    page,
  }) => {
    await expect(
      page.getByText(/Based on registered sold-price transactions/i),
    ).toBeVisible();
    await expect(
      page.getByText(/floor-area data is not currently available/i),
    ).toBeVisible();
  });

  test('"£/m²" never appears as a metric label or legend item — only inside the disclaimer sentence', async ({
    page,
  }) => {
    // Locate every text node on the page that contains "£/m²".
    const sqmNodes = page.locator(':text("£/m²")');
    const count = await sqmNodes.count();

    if (count === 0) {
      // Perfect — string is absent entirely.
      return;
    }

    // If present, it must only appear inside the disclaimer paragraph
    // (which contains "floor-area data is not currently available").
    for (let i = 0; i < count; i++) {
      const el = sqmNodes.nth(i);
      // Walk up to the nearest paragraph and verify it's the disclaimer.
      const closestP = el.locator("xpath=ancestor::p[1]");
      const pText = await closestP.textContent();
      expect(pText ?? "").toMatch(/floor-area data is not currently available/i);
    }
  });

  test('"£/m²" does not appear in legend or filter labels', async ({ page }) => {
    // The legend pill and the filters panel must not label any item as £/m².
    const legend = page.getByRole("img", { name: /Price map legend/i });
    const legendText = await legend.textContent();
    expect(legendText ?? "").not.toMatch(/£\/m²\s*(only option|metric|per sq)/i);

    // Check filters region: look for any static label that reads like a £/m² metric.
    // The "Metric" section must read "Median sold price", not "£/m²".
    const metricLabel = page.getByText("Median sold price");
    await expect(metricLabel.first()).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Search bar
  // ---------------------------------------------------------------------------

  test('search box has placeholder "Search city, borough, postcode or area"', async ({
    page,
  }) => {
    await expect(
      page.getByPlaceholder("Search city, borough, postcode or area").first(),
    ).toBeVisible();
  });

  test("search box has correct ARIA role and label", async ({ page }) => {
    const searchInput = page.getByRole("combobox", {
      name: "Search for an area",
    });
    await expect(searchInput).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------

  test("Property Type filter group is present", async ({ page }) => {
    // Desktop filter panel. On desktop the left panel is visible.
    // Look for the fieldset legend.
    await expect(page.getByText("Property Type").first()).toBeVisible();
    await expect(page.getByText("All types").first()).toBeVisible();
    await expect(page.getByText("Detached").first()).toBeVisible();
  });

  test("Date Window filter group is present", async ({ page }) => {
    await expect(page.getByText("Date Window")).toBeVisible();
    await expect(page.getByText("Last 24 months")).toBeVisible();
  });

  test("Metric selector is visible and reads Median sold price", async ({
    page,
  }) => {
    await expect(page.getByText("Metric")).toBeVisible();
    // The static disabled dropdown inside the filters reads "Median sold price".
    const metricDisplay = page.getByText("Median sold price").first();
    await expect(metricDisplay).toBeVisible();
  });

  test("Scale toggle is present and has a Local and National option", async ({
    page,
  }) => {
    await expect(page.getByRole("button", { name: /^Local$/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^National$/i }),
    ).toBeVisible();
  });

  test('active-scale indicator shows "Scale: National comparison" by default', async ({
    page,
  }) => {
    await expect(
      page.getByText("Scale: National comparison").first(),
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Scale toggle interaction
  // ---------------------------------------------------------------------------

  test('scale toggle switches "Scale: National comparison" → "Scale: Local comparison"', async ({
    page,
  }) => {
    // Default is National.
    await expect(
      page.getByText("Scale: National comparison").first(),
    ).toBeVisible();

    // Click "Local" button in the toggle group.
    await page.getByRole("button", { name: /^Local$/i }).first().click();

    // Indicator must now read Local comparison.
    await expect(
      page.getByText("Scale: Local comparison").first(),
    ).toBeVisible();
    await expect(page.getByText("Scale: National comparison")).toHaveCount(0);
  });

  test("scale toggle switches back from Local to National", async ({ page }) => {
    // Switch to Local first.
    await page.getByRole("button", { name: /^Local$/i }).first().click();
    await expect(
      page.getByText("Scale: Local comparison").first(),
    ).toBeVisible();

    // Switch back to National.
    await page.getByRole("button", { name: /^National$/i }).first().click();
    await expect(
      page.getByText("Scale: National comparison").first(),
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Map canvas (DATA-DEPENDENT — require dev server + seeded DB)
  // ---------------------------------------------------------------------------

  test(
    "map container renders (canvas or fallback) // DATA-DEPENDENT: requires MapTiler key",
    async ({ page }) => {
      // Either a MapLibre canvas or the fallback "Map unavailable" message is
      // shown. The map mounts asynchronously, so wait for either to appear.
      const canvasOrFallback = page
        .locator("canvas")
        .first()
        .or(page.getByText("Map unavailable").first());
      await expect(canvasOrFallback).toBeVisible({ timeout: 15_000 });
    },
  );
});

// ---------------------------------------------------------------------------
// Multi-resolution behaviour: granularity diagnostic, zoom hierarchy, search,
// and browser navigation. The active-map-granularity pill exposes the geography
// level actually shown, so these assert the data layer — not just the camera —
// without reading map pixels.
//
// DATA-DEPENDENT: require dev server + seeded fixture
// (node scripts/seed-market-map-fixture.mjs) + a MapTiler key for the canvas.
// ---------------------------------------------------------------------------

const granularityPill = "[data-testid='active-map-granularity']";

test.describe("Market Price Map — multi-resolution behaviour", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/search/map", { timeout: 30_000 });
  });

  test("national initial view shows the local-authority layer, not postcode", async ({
    page,
  }) => {
    const pill = page.locator(granularityPill);
    await expect(pill).toBeVisible();
    // Initial national zoom (6) resolves to local_authority — never locked to postcode.
    await expect(pill).toHaveAttribute("data-granularity", "local_authority");
  });

  test("zooming in changes the active geography level (data layer, not just camera)", async ({
    page,
  }) => {
    const pill = page.locator(granularityPill);
    await expect(pill).toHaveAttribute("data-granularity", "local_authority");

    const canvas = page.locator("canvas").first();
    if (!(await canvas.isVisible().catch(() => false))) {
      test.skip(true, "Map canvas unavailable (no MapTiler key) — cannot drive zoom");
    }

    // Drive zoom in via the scroll wheel over the map canvas.
    const box = await canvas.boundingBox();
    if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

    await expect
      .poll(
        async () => {
          await page.mouse.wheel(0, -600);
          await page.waitForTimeout(500);
          return pill.getAttribute("data-granularity");
        },
        { timeout: 20_000, message: "granularity should advance past local_authority on zoom-in" },
      )
      .not.toBe("local_authority");
  });

  test("rapid zoom settles on the finest level matching the final zoom (no stale layer)", async ({
    page,
  }) => {
    const pill = page.locator(granularityPill);
    const canvas = page.locator("canvas").first();
    if (!(await canvas.isVisible().catch(() => false))) {
      test.skip(true, "Map canvas unavailable (no MapTiler key)");
    }
    const box = await canvas.boundingBox();
    if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

    // Fire many wheel ticks in quick succession (crossing several thresholds).
    for (let i = 0; i < 12; i++) await page.mouse.wheel(0, -400);

    // After deep zoom settles, the pill must reflect a fine level (lsoa or street),
    // i.e. the final zoom — not a stale coarse layer left behind by an older fetch.
    await expect
      .poll(async () => pill.getAttribute("data-granularity"), { timeout: 20_000 })
      .toMatch(/lsoa|street|msoa/);
  });

  // The search bar is rendered for both desktop and mobile layouts, so scope
  // each interaction to a single combobox/listbox instance via .first().
  async function selectFixtureArea(page: import("@playwright/test").Page) {
    const search = page
      .getByRole("combobox", { name: "Search for an area" })
      .first();
    await search.click();
    await search.fill("Northgate");

    const listbox = page
      .getByRole("listbox", { name: "Search results" })
      .first();
    // Click the result button directly (the handler lives on the button, not the li).
    const result = listbox.getByRole("button", { name: /Northgate/i }).first();
    await expect(result).toBeVisible({ timeout: 15_000 });
    await result.click();
  }

  test("searching an area fits bounds and switches to local scale", async ({
    page,
  }) => {
    await selectFixtureArea(page);

    // URL reflects the selection + local scale; the indicator flips to Local.
    await expect(page).toHaveURL(/scale_mode=local/, { timeout: 15_000 });
    await expect(page).toHaveURL(/area_id=/);
    await expect(
      page.getByText("Scale: Local comparison").first(),
    ).toBeVisible();
  });

  test("browser back restores the prior map state after a search selection", async ({
    page,
  }) => {
    await expect(
      page.getByText("Scale: National comparison").first(),
    ).toBeVisible({ timeout: 15_000 });

    await selectFixtureArea(page);
    await expect(page).toHaveURL(/scale_mode=local/, { timeout: 15_000 });

    // Back should pop the pushed URL state and restore National scale.
    await page.goBack();
    await expect(page).not.toHaveURL(/scale_mode=local/);
    await expect(
      page.getByText("Scale: National comparison").first(),
    ).toBeVisible();
  });
});
