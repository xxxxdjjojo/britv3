import { test, expect, type Page } from "@playwright/test";

/**
 * Phase 1 data-completeness checks for the public property detail page.
 *
 * Asserts (for both a SALE and a RENT listing) that:
 *  - the page renders with real price/address data
 *  - the Location map section renders (coordinates + tile key present)
 *  - the categorized "Facts & features" section renders with real values
 *  - layers we have no data for are ABSENT entirely (graceful absence),
 *    never shown as a blank/placeholder widget
 *
 * Uses mock slugs (search_live_data is off in this environment), so the data
 * is deterministic.
 */

const SALE_SLUG = "12-kensington-gardens-london-sale";
const RENT_SLUG = "45-bermondsey-street-london-rent";

// Empty-state strings emitted by the dead local-area widgets. None of these
// must ever appear: the section is gated off and degrades by absence.
const PLACEHOLDER_STRINGS = [
  "Transport information not available",
  "School catchment data unavailable",
  "Broadband data unavailable",
  "Flood risk data unavailable",
  "Crime data unavailable",
];

async function assertNoEmptyWidgets(page: Page) {
  // The flag-gated Local Area Intelligence section must be absent, not blank.
  await expect(
    page.getByRole("heading", { name: /Local Area Intelligence/i }),
  ).toHaveCount(0);
  for (const text of PLACEHOLDER_STRINGS) {
    await expect(page.getByText(text)).toHaveCount(0);
  }
}

test.describe("Property detail — data completeness", () => {
  test.use({ viewport: { width: 1440, height: 1024 } });

  test("SALE listing: map, facts, photos-by-room all backed by data", async ({
    page,
  }) => {
    await page.goto(`/properties/${SALE_SLUG}`);

    // Price (asking) is real
    await expect(page.getByText("£485,000").first()).toBeVisible();

    // Location map section renders (coordinates + MapTiler key present).
    // The section heading was renamed to "Local intelligence".
    await expect(
      page.getByRole("heading", { name: /^Local intelligence$/ }),
    ).toBeVisible();

    // Facts & features renders with real, non-placeholder values
    await expect(
      page.getByRole("heading", { name: /Facts & features/i }),
    ).toBeVisible();
    await expect(page.getByText("Freehold").first()).toBeVisible();
    // Exact match: a bare "Band X" value (avoids matching hidden
    // "Tax Band Breakdown" copy elsewhere on the page).
    await expect(page.getByText(/^Band [A-H]$/).first()).toBeVisible();

    // Enriched mock has room-captioned photos → grouped gallery appears.
    // Scope to the section so we don't collide with the ROI "Kitchen" heading.
    const photosSection = page.locator("section", {
      has: page.getByRole("heading", { name: "Photos by room" }),
    });
    await expect(
      photosSection.getByRole("heading", { name: "Photos by room" }),
    ).toBeVisible();
    await expect(
      photosSection.getByRole("heading", { name: /^Kitchen/ }),
    ).toBeVisible();

    await assertNoEmptyWidgets(page);

    await page.screenshot({
      path: "playwright-report/property-sale-1440.png",
      fullPage: true,
    });
  });

  test("RENT listing: facts + availability render; absent layers stay absent", async ({
    page,
  }) => {
    await page.goto(`/properties/${RENT_SLUG}`);

    // Rental price with frequency suffix
    await expect(page.getByText(/£1,850\s*pcm/).first()).toBeVisible();

    // Map present (section heading renamed to "Local intelligence").
    await expect(
      page.getByRole("heading", { name: /^Local intelligence$/ }),
    ).toBeVisible();

    // Facts include rental-specific availability + leasehold running costs
    await expect(
      page.getByRole("heading", { name: /Facts & features/i }),
    ).toBeVisible();
    await expect(page.getByText("Leasehold").first()).toBeVisible();
    await expect(page.getByText("Available from").first()).toBeVisible();

    // This mock has a single, non-room photo and no floor plan media:
    // both the floor-plan and photos-by-room sections must be ABSENT.
    await expect(
      page.getByRole("heading", { name: /Floor plans/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: /Photos by room/i }),
    ).toHaveCount(0);

    await assertNoEmptyWidgets(page);

    await page.screenshot({
      path: "playwright-report/property-rent-1440.png",
      fullPage: true,
    });
  });
});

/**
 * Task 4 — proves the "Nearest schools" widget now renders with REAL data.
 *
 * The area services (schools/crime/transport/…) always query the live prod
 * Supabase DB regardless of the mock flag, so a mock London listing (which
 * carries real coordinates near real schools) renders REAL nearby schools via
 * the get_nearby_schools RPC (20,748 GIAS/Ofsted rows). We assert:
 *  - the "Local area" section heading is visible
 *  - the "Nearest schools" widget heading is visible with ≥1 school <li>
 *  - the "Source: GIAS / Ofsted" attribution is visible
 *  - the MapLibre canvas (dynamically-imported Location map) is visible
 *  - graceful absence preserved (no blank/placeholder widgets)
 * and captures full-page screenshots at 1440 and 375 for both listings.
 */

const SCHOOLS_SHOTS_DIR = "schools-e2e-shots";

async function assertSchoolsAndMap(page: Page) {
  // "Local area" section is present (it renders only when a layer has data).
  await expect(
    page.getByRole("heading", { name: /^Local area$/ }),
  ).toBeVisible();

  // Nearest schools widget renders with at least one school row.
  const schoolsCard = page.locator("div", {
    has: page.getByRole("heading", { name: /Nearest schools/i }),
  });
  await expect(
    page.getByRole("heading", { name: /Nearest schools/i }),
  ).toBeVisible();
  const schoolItems = schoolsCard.first().locator("li");
  await expect(schoolItems.first()).toBeVisible();
  expect(await schoolItems.count()).toBeGreaterThan(0);

  // Source attribution proves the data came from the real GIAS/Ofsted layer.
  await expect(page.getByText(/Source: GIAS \/ Ofsted/i).first()).toBeVisible();

  // MapLibre canvas is a dynamically-imported client component; give it room.
  await expect(page.locator("canvas.maplibregl-canvas").first()).toBeVisible({
    timeout: 30_000,
  });
}

test.describe("Property detail — nearest schools render with real data", () => {
  const CASES = [
    { label: "sale", slug: SALE_SLUG },
    { label: "rent", slug: RENT_SLUG },
  ] as const;

  for (const { label, slug } of CASES) {
    test(`${label} listing: Local area + Nearest schools + map render, no empty widgets`, async ({
      page,
    }) => {
      await page.goto(`/properties/${slug}`);

      await assertSchoolsAndMap(page);
      await assertNoEmptyWidgets(page);

      // Full-page screenshots at desktop and mobile widths.
      await page.setViewportSize({ width: 1440, height: 1024 });
      await page.screenshot({
        path: `${SCHOOLS_SHOTS_DIR}/${label}-1440.png`,
        fullPage: true,
      });

      await page.setViewportSize({ width: 375, height: 812 });
      await page.screenshot({
        path: `${SCHOOLS_SHOTS_DIR}/${label}-375.png`,
        fullPage: true,
      });
    });
  }
});
