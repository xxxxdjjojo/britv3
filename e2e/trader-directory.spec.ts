import { test, expect } from "@playwright/test";

/**
 * Trader / service-provider directory link & render tests.
 *
 * These assert that the public marketplace surfaces actually render seeded
 * providers and that the links between directory -> category -> profile resolve.
 *
 * Written TEST-FIRST: before the trader test seed is loaded these data-dependent
 * specs FAIL (empty category listings, profile slugs 404). After running
 * supabase/seed/20_trader_test_seed.sql they pass. Smoke tests (static tiles)
 * pass regardless and guard against route regressions.
 */

// A known verified seed provider (idx 1 is always 'verified' with full data).
const SEED_PROFILE = "/services/plumber/seed-plumber-01";
const SEED_CATEGORY = "/services/tradespeople?category=plumber";

test.describe("Marketplace directory (smoke)", () => {
  test("marketplace hub renders with category tiles linking to listings", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const plumberTile = page.getByRole("link", { name: /plumber/i }).first();
    await expect(plumberTile).toBeVisible();
    await expect(plumberTile).toHaveAttribute("href", /category=plumber/);
  });
});

test.describe("Trader directory (data-dependent — needs trader seed)", () => {
  test("plumber category listing shows at least one seeded provider profile link", async ({ page }) => {
    await page.goto(SEED_CATEGORY);
    // a provider card links into /services/plumber/<slug>; seeded slugs are seed-plumber-NN
    const providerLink = page.locator('a[href*="/services/plumber/seed-plumber-"]').first();
    await expect(providerLink).toBeVisible({ timeout: 15_000 });
  });

  test("seeded provider profile page resolves and renders identity", async ({ page }) => {
    const res = await page.goto(SEED_PROFILE);
    expect(res?.status(), "profile slug should resolve (not 404) once seeded").toBeLessThan(400);
    // business-name heading proves the provider resolved and rendered (viewport-independent)
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/Plumbing|Heating/i);
  });

  test("location SEO page lists verified providers in the category", async ({ page }) => {
    await page.goto("/services/plumber/london");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // the SEO landing lists verified providers in the category (location in copy/meta)
    const anyProvider = page.locator('a[href*="/services/plumber/seed-plumber-"]').first();
    await expect(anyProvider).toBeVisible({ timeout: 15_000 });
  });
});
