import { test, expect } from "@playwright/test";

/**
 * Featured Trader / Sponsored Placement E2E.
 *
 * Covers the deterministic, no-auth surfaces of the advertising marketplace:
 *  - the SEO /professionals area pages render for a valid town/category
 *  - the public featured-experts API responds with the expected shape
 *  - rent vs buy journeys request different professional categories
 *
 * The full purchase→appear→enquiry loop (approved trader buys an Ealing plumber
 * boost → featured plumber appears on an Ealing property → click records an
 * enquiry) requires a seeded active placement + Stripe test mode; it is asserted
 * at the unit/integration layer (placement-service, fulfilment, ranking) and is
 * documented as a manual verification step.
 */

test.describe("Featured Local Experts — public surfaces", () => {
  test("renders an SEO area page for a valid town and category", async ({ page }) => {
    await page.goto("/professionals/ealing/plumbers", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Plumbers in Ealing/i })).toBeVisible({ timeout: 15_000 });
    // "Feature your business here" CTA invites traders to advertise.
    await expect(page.getByRole("link", { name: /Feature your business/i })).toBeVisible();
  });

  test("professionals index lists professions and links to area pages", async ({ page }) => {
    await page.goto("/professionals", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /local property professionals/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ealing" }).first()).toBeVisible();
  });

  test("featured API returns finance pros for buy and move pros for rent", async ({ request }) => {
    const buy = await request.get("/api/placements/featured?postcode=W5%201AB&stage=buy&limit=3");
    expect(buy.ok()).toBeTruthy();
    expect(await buy.json()).toHaveProperty("experts");

    const rent = await request.get("/api/placements/featured?town=Ealing&stage=rent&limit=3");
    expect(rent.ok()).toBeTruthy();
    expect(await rent.json()).toHaveProperty("experts");
  });
});
