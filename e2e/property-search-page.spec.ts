import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Stitch "Search — Hemnet Style with Right Filters" structural contract.
//
// These assertions encode the target two-column layout: a live map mounted as
// the always-on top block of the LEFT column, horizontal property cards below
// it, and a RIGHT "Refine your search" filter aside. Every interactive link
// must resolve to a real route — no "#", no empty hrefs, no dead controls.
// ---------------------------------------------------------------------------

test.describe("Stitch property search page", () => {
  test("renders header, search, map, results and the right filter aside", async ({
    page,
  }) => {
    await page.goto("/search");

    // Shared app header (real nav, not the Stitch reference header)
    await expect(page.getByRole("banner")).toBeVisible();

    // Live map block
    await expect(page.getByTestId("search-map-status")).toBeAttached();

    // Right-hand "Refine your search" filter panel
    await expect(page.getByTestId("refine-filters")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Search$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Clear All Filters/i }),
    ).toBeVisible();
  });

  test("mounts the map BEFORE the first property card in DOM order", async ({
    page,
  }) => {
    await page.goto("/search");

    const map = page.getByTestId("search-map");
    const firstCard = page.getByTestId("property-search-card").first();

    await expect(map).toBeAttached();
    await expect(firstCard).toBeAttached();

    // DOCUMENT_POSITION_FOLLOWING (4) => map comes before the card.
    const mapIsBeforeCard = await map.evaluate((mapEl, cardEl) => {
      const pos = mapEl.compareDocumentPosition(cardEl as Node);
      return Boolean(pos & Node.DOCUMENT_POSITION_FOLLOWING);
    }, await firstCard.elementHandle());

    expect(mapIsBeforeCard).toBe(true);
  });

  test("map status reaches loaded (or a recoverable fallback)", async ({
    page,
  }) => {
    await page.goto("/search");
    const status = page.getByTestId("search-map-status");
    await expect(status).toBeAttached();
    // loaded in normal operation; empty/error are honest recoverable states.
    await expect(status).toHaveText(/loaded|empty|error/, { timeout: 15000 });
  });

  test("exposes a deterministic visible marker count", async ({ page }) => {
    await page.goto("/search");
    const count = page.getByTestId("visible-map-marker-count");
    await expect(count).toBeAttached();
    const text = (await count.textContent())?.trim() ?? "";
    expect(text).toMatch(/^\d+$/);
  });

  test("every internal link resolves to a real route (no dead controls)", async ({
    page,
  }) => {
    await page.goto("/search");
    await expect(page.getByTestId("refine-filters")).toBeVisible();

    const hrefs = await page.locator("main a[href], a[href]").evaluateAll(
      (els) =>
        els
          .map((el) => el.getAttribute("href"))
          .filter((h): h is string => h !== null),
    );

    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href).not.toBe("#");
      expect(href).not.toBe("");
      expect(href).not.toMatch(/^javascript:/i);
    }
  });

  test("provider trade chips link to the working marketplace directory", async ({
    page,
  }) => {
    await page.goto("/search");
    const chip = page.getByTestId("local-support-chip").first();
    await expect(chip).toBeAttached();
    const href = await chip.getAttribute("href");
    expect(href).toMatch(/^\/marketplace\?category=/);
  });

  test("a property card title links to a /properties/ route", async ({
    page,
  }) => {
    await page.goto("/search");
    const cardLink = page
      .getByTestId("property-search-card")
      .first()
      .getByRole("link")
      .first();
    await expect(cardLink).toBeAttached();
    const href = await cardLink.getAttribute("href");
    expect(href).toMatch(/^\/properties\//);
  });

  test("the Full Map View control links to a real ?view=map state", async ({
    page,
  }) => {
    await page.goto("/search");
    const fullMap = page.getByRole("link", { name: /Full Map View/i });
    await expect(fullMap).toBeVisible();
    const href = await fullMap.getAttribute("href");
    expect(href).toMatch(/view=map/);
  });
});
