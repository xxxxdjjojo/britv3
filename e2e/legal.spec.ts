import { test, expect } from "@playwright/test";

const LEGAL_PAGES = [
  { path: "/legal/terms", heading: /terms/i },
  { path: "/legal/privacy", heading: /privacy/i },
  { path: "/legal/cookies", heading: /cookie/i },
  { path: "/legal/acceptable-use", heading: /acceptable use/i },
  { path: "/legal/gdpr-rights", heading: /gdpr|data subject/i },
  { path: "/legal/data-processing", heading: /data processing/i },
  { path: "/legal/accessibility", heading: /accessibility/i },
  { path: "/legal/complaints", heading: /complaints/i },
  { path: "/legal/aml-policy", heading: /anti.money|aml/i },
  { path: "/legal/modern-slavery", heading: /modern slavery/i },
  { path: "/legal/disclaimer", heading: /disclaimer/i },
];

test.describe("Legal Pages", () => {
  for (const { path, heading } of LEGAL_PAGES) {
    test(`${path} loads with correct heading`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    });

    test(`${path} has substantive content`, async ({ page }) => {
      await page.goto(path);
      // Legal pages should have multiple paragraphs of content
      const paragraphs = page.locator("p");
      await expect(paragraphs.first()).toBeVisible();
      const count = await paragraphs.count();
      expect(count).toBeGreaterThan(3);
    });
  }
});

test.describe("Legal Index Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/legal");
  });

  test("renders with Legal Hub heading", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Legal Hub");
  });

  test("has links to all sub-pages", async ({ page }) => {
    for (const { path } of LEGAL_PAGES) {
      await expect(page.locator(`a[href="${path}"]`)).toBeVisible();
    }
  });

  test("renders category headings", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /User Agreements/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Privacy & Data Protection/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Compliance/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Platform/i })).toBeVisible();
  });
});

test.describe("Legal Page Layout Consistency", () => {
  test("legal sub-pages share a consistent shell", async ({ page }) => {
    // Check that two different legal pages use the same layout structure
    await page.goto("/legal/terms");
    const hasBackLink = await page.getByRole("link", { name: /legal/i }).count();
    expect(hasBackLink).toBeGreaterThan(0);

    await page.goto("/legal/privacy");
    const hasBackLink2 = await page.getByRole("link", { name: /legal/i }).count();
    expect(hasBackLink2).toBeGreaterThan(0);
  });
});
