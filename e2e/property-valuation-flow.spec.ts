import { expect, test } from "@playwright/test";

/**
 * Property valuation journey — E2E.
 *
 * Scenario 1 (CTA routing): every "Value my property" CTA must open the
 * dedicated valuation journey at /value-my-property, NOT the general search page.
 *
 * Written test-first (RED): the journey route does not exist yet and the
 * landing CTA currently points at /search, so these assertions fail until the
 * journey is implemented.
 */
test.describe("Scenario 1 — Value my property CTA routing", () => {
  test("the /valuation landing CTA opens the valuation journey, not search", async ({
    page,
  }) => {
    await page.goto("/valuation");

    const cta = page.getByRole("link", { name: /value my property/i });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/value-my-property");

    await cta.click();
    await expect(page).toHaveURL(/\/value-my-property(\/|$|\?)/);
    await expect(page).not.toHaveURL(/\/search/);
  });

  test("the valuation journey intro renders and announces email verification up front", async ({
    page,
  }) => {
    const response = await page.goto("/value-my-property");
    expect(response?.status(), "/value-my-property should not 404").toBeLessThan(400);

    await expect(page.getByRole("heading").first()).toBeVisible();
    // The user must be told near the beginning that email verification is needed
    // to view and save the estimate (no surprise at the final step).
    await expect(page.locator("body")).toContainText(/verif(y|ication)/i);
    await expect(page.locator("body")).toContainText(/email/i);
  });

  test("the sold-prices area 'thinking of selling' CTA enters the journey", async ({
    page,
  }) => {
    await page.goto("/sold-prices/london/14-south-street-tw7-7bg");
    const cta = page.getByRole("link", { name: /value my property|thinking of selling|get a valuation/i });
    await expect(cta.first()).toBeVisible();
    await expect(cta.first()).toHaveAttribute("href", /\/value-my-property/);
  });
});
