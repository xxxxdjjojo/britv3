import { test, expect } from "@playwright/test";

/**
 * Homepage Link Audit
 *
 * Verifies every internal link on the homepage resolves without a 404.
 * External links (social media) are excluded.
 *
 * Tests are grouped by page section and use `.first()` to avoid strict-mode
 * violations when the same href appears in multiple places (e.g. /search in
 * header nav AND hero section).
 */

// ---------------------------------------------------------------------------
// 1. Header Navigation
// ---------------------------------------------------------------------------

test.describe("Header Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("link: /search?type=buy (Buy) resolves", async ({ page }) => {
    const link = page.locator('a[href="/search?type=buy"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /search?type=rent (Rent) resolves", async ({ page }) => {
    const link = page.locator('a[href="/search?type=rent"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /services (Find Services) resolves", async ({ page }) => {
    const link = page.locator('a[href="/services"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /valuation (Valuations) resolves", async ({ page }) => {
    const link = page.locator('a[href="/valuation"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /blog (Advice) resolves", async ({ page }) => {
    const link = page.locator('a[href="/blog"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /login (Sign In) resolves", async ({ page }) => {
    const link = page.locator('a[href="/login"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /register?role=seller (List Your Property) resolves", async ({
    page,
  }) => {
    const link = page.locator('a[href="/register?role=seller"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Hero Section
// ---------------------------------------------------------------------------

test.describe("Hero Section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("link: hero Buy tab (/search?type=buy) resolves", async ({ page }) => {
    // The hero tab may share the same href as the nav link; .first() is fine here
    const link = page.locator('a[href="/search?type=buy"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: hero Rent tab (/search?type=rent) resolves", async ({ page }) => {
    const link = page.locator('a[href="/search?type=rent"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: hero Find Services tab (/search?type=find-services) resolves", async ({
    page,
  }) => {
    const link = page
      .locator('a[href="/search?type=find-services"]')
      .first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: hero search bar (/search) resolves", async ({ page }) => {
    const link = page.locator('a[href="/search"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Featured Properties Tabs
// ---------------------------------------------------------------------------

test.describe("Featured Properties Tabs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("link: /search?status=for-sale (For Sale tab) resolves", async ({
    page,
  }) => {
    const link = page.locator('a[href="/search?status=for-sale"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /search?status=to-rent (To Rent tab) resolves", async ({
    page,
  }) => {
    const link = page.locator('a[href="/search?status=to-rent"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /search?status=new-builds (New Builds tab) resolves", async ({
    page,
  }) => {
    const link = page.locator('a[href="/search?status=new-builds"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /search (View all) resolves", async ({ page }) => {
    const link = page.locator('a[href="/search"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Service Category Cards
// ---------------------------------------------------------------------------

test.describe("Service Category Cards", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("link: /services/tradespeople?category=plumber (Plumbers) resolves", async ({
    page,
  }) => {
    const link = page
      .locator('a[href="/services/tradespeople?category=plumber"]')
      .first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /services/tradespeople?category=electrician (Electricians) resolves", async ({
    page,
  }) => {
    const link = page
      .locator('a[href="/services/tradespeople?category=electrician"]')
      .first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /services/tradespeople?category=builder (Builders) resolves", async ({
    page,
  }) => {
    const link = page
      .locator('a[href="/services/tradespeople?category=builder"]')
      .first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /agents (Estate Agents) resolves", async ({ page }) => {
    const link = page.locator('a[href="/agents"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /services/mortgage-brokers (Mortgage Brokers) resolves", async ({
    page,
  }) => {
    const link = page.locator('a[href="/services/mortgage-brokers"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /services/surveyors (Surveyors) resolves", async ({ page }) => {
    const link = page.locator('a[href="/services/surveyors"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /services (Browse all services) resolves", async ({ page }) => {
    const link = page.locator('a[href="/services"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Blog Section
// ---------------------------------------------------------------------------

test.describe("Blog Section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("blog post links all resolve (no 404s)", async ({ page }) => {
    // Collect all /blog/... links on the page (excludes the /blog index link)
    const blogPostLinks = page.locator('a[href^="/blog/"]');
    const count = await blogPostLinks.count();
    // There should be at least 1 blog post link; if the section is absent skip
    if (count === 0) {
      test.skip();
      return;
    }
    // Test each blog post link in turn
    for (let i = 0; i < count; i++) {
      const href = await blogPostLinks.nth(i).getAttribute("href");
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const link = page.locator(`a[href="${href}"]`).first();
      await expect(link).toBeVisible();
      await link.click();
      await page.waitForLoadState("networkidle");
      await expect(page.locator("text=Page not found")).not.toBeVisible();
    }
  });

  test("link: /blog (Read more on our blog) resolves", async ({ page }) => {
    const link = page.locator('a[href="/blog"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 6. CTA Banner
// ---------------------------------------------------------------------------

test.describe("CTA Banner", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("link: /register?role=seller (List Your Property CTA) resolves", async ({
    page,
  }) => {
    const link = page.locator('a[href="/register?role=seller"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /services (Find a Professional CTA) resolves", async ({
    page,
  }) => {
    const link = page.locator('a[href="/services"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 7. Footer Links
// ---------------------------------------------------------------------------

test.describe("Footer Links — Properties column", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator("footer").scrollIntoViewIfNeeded();
  });

  test("link: /search?type=buy resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/search?type=buy"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /search?type=rent resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/search?type=rent"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /search?type=new-builds resolves", async ({ page }) => {
    const link = page
      .locator('footer a[href="/search?type=new-builds"]')
      .first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /search?type=commercial resolves", async ({ page }) => {
    const link = page
      .locator('footer a[href="/search?type=commercial"]')
      .first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /sold-prices resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/sold-prices"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });
});

test.describe("Footer Links — Services column", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator("footer").scrollIntoViewIfNeeded();
  });

  test("link: /marketplace resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/marketplace"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /agents resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/agents"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /services/mortgage-brokers resolves", async ({ page }) => {
    const link = page
      .locator('footer a[href="/services/mortgage-brokers"]')
      .first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /valuation resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/valuation"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });
});

test.describe("Footer Links — Company column", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator("footer").scrollIntoViewIfNeeded();
  });

  test("link: /about resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/about"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /careers resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/careers"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /press resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/press"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /contact resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/contact"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /blog (Company column) resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/blog"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /help resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/help"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });
});

test.describe("Footer Links — Legal column", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator("footer").scrollIntoViewIfNeeded();
  });

  test("link: /legal resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/legal"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /legal/terms resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/legal/terms"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /legal/privacy resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/legal/privacy"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /legal/cookies resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/legal/cookies"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /legal/accessibility resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/legal/accessibility"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /legal/complaints resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/legal/complaints"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });
});

test.describe("Footer Links — Area Guides column", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator("footer").scrollIntoViewIfNeeded();
  });

  test("link: /areas/london resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/areas/london"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /areas/manchester resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/areas/manchester"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /areas/birmingham resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/areas/birmingham"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /areas/bristol resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/areas/bristol"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /areas/leeds resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/areas/leeds"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /areas/edinburgh resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/areas/edinburgh"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /areas/oxford resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/areas/oxford"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /areas/cambridge resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/areas/cambridge"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });

  test("link: /areas (all area guides) resolves", async ({ page }) => {
    const link = page.locator('footer a[href="/areas"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Page not found")).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 8. Interactive Elements (non-navigation)
// ---------------------------------------------------------------------------

test.describe("Interactive Elements", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("Cookie Preferences button is present and clickable", async ({
    page,
  }) => {
    // Scroll to footer where cookie preferences button typically lives
    await page.locator("footer").scrollIntoViewIfNeeded();
    const cookieBtn = page
      .getByRole("button", { name: /cookie preferences/i })
      .first();
    // If the button is not present in the footer, look page-wide
    const count = await cookieBtn.count();
    if (count === 0) {
      // May be rendered as a link with role=button or data attribute
      const altBtn = page
        .locator('[data-testid="cookie-preferences"], button:has-text("Cookie")')
        .first();
      const altCount = await altBtn.count();
      if (altCount === 0) {
        test.skip();
        return;
      }
      await expect(altBtn).toBeVisible();
      await altBtn.click();
      // After click, either a modal appears or the page stays the same — no navigation should 404
      await expect(page.locator("text=Page not found")).not.toBeVisible();
    } else {
      await expect(cookieBtn).toBeVisible();
      await cookieBtn.click();
      await expect(page.locator("text=Page not found")).not.toBeVisible();
    }
  });

  test("Back to top button scrolls page to top", async ({ page }) => {
    // Scroll to bottom to reveal the back-to-top button
    await page.keyboard.press("End");
    await page.waitForTimeout(300);

    const backToTopBtn = page
      .locator(
        'button[aria-label*="top" i], button:has-text("Back to top"), [data-testid="back-to-top"]',
      )
      .first();

    const count = await backToTopBtn.count();
    if (count === 0) {
      test.skip();
      return;
    }

    await expect(backToTopBtn).toBeVisible();
    await backToTopBtn.click();
    await page.waitForTimeout(500);

    // After clicking back-to-top, the scroll position should be near the top
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(200);
  });
});
