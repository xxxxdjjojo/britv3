// e2e/admin-pricing-review.spec.ts
//
// MEMO PIVOT v2 — Week 12-13 pricing-review dashboard for admins.

import { test, expect } from "./fixtures/auth";

test.use({ role: "admin" });

test.describe("Admin pricing-review dashboard", () => {
  test("page loads with hero heading", async ({ authenticatedPage: page }) => {
    await page.goto("/admin/pricing-review");
    await expect(
      page.getByRole("heading", { level: 1, name: /pricing review/i }),
    ).toBeVisible();
  });

  test("renders MRR by segment for all 7 segments", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/pricing-review");
    for (const segment of [
      /sellers/i,
      /agents/i,
      /landlords/i,
      /providers/i,
      /professionals|niche/i,
      /developers/i,
      /traders/i,
    ]) {
      await expect(page.getByText(segment).first()).toBeVisible();
    }
  });

  test("shows scenario targets (conservative 120 / base 600 / bull 2,000)", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/pricing-review");
    await expect(page.getByText(/120/).first()).toBeVisible();
    await expect(page.getByText(/600/).first()).toBeVisible();
    await expect(page.getByText(/2[,.]?000/).first()).toBeVisible();
  });

  test("shows churn estimate", async ({ authenticatedPage: page }) => {
    await page.goto("/admin/pricing-review");
    await expect(page.getByText(/churn/i).first()).toBeVisible();
  });
});

test.describe("Pricing-review auth", () => {
  test("unauthenticated user is denied", async ({ page }) => {
    const res = await page.goto("/admin/pricing-review");
    // Either a redirect to login OR a 401/403 response
    if (res && res.status() >= 400) {
      expect([401, 403, 404]).toContain(res.status());
    } else {
      expect(page.url()).toMatch(/login|sign[-_]?in|auth/i);
    }
  });
});
