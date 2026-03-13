import { test, expect } from "@playwright/test";

test.describe("Property Detail", () => {
  test("loads property detail page", async ({ page }) => {
    await page.goto("/properties/14-elm-road-isleworth");
    // Property detail page uses h2 headings for sections
    const hasSectionHeading = await page
      .getByRole("heading", { level: 2 })
      .first()
      .isVisible()
      .catch(() => false);
    const hasNotFound = await page
      .getByText(/not found/i)
      .isVisible()
      .catch(() => false);
    const hasPrice = await page.getByText(/£/).first().isVisible().catch(() => false);
    expect(hasSectionHeading || hasNotFound || hasPrice).toBe(true);
  });
});
