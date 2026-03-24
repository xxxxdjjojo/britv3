import { test, expect } from "./fixtures/auth";

test.use({ role: "admin" });

test.describe("Scenario 01 — Admin Dashboard KPI & Activity Feed", () => {
  test("01 · /admin loads with 'Admin Dashboard' heading", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin");
    const heading = page.getByRole("heading", { name: /admin dashboard/i });
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("02 · 5 KPI CountCards visible", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin");
    await page.getByRole("heading", { name: /admin dashboard/i }).waitFor({ timeout: 10_000 });

    const kpiLabels = [
      "Total Users",
      "Active Listings",
      "Pending Verifications",
      "Open Reports",
      "Total Reviews",
    ];

    for (const label of kpiLabels) {
      const card = page.getByText(label);
      await expect(card).toBeVisible();
    }
  });

  test("03 · each KPI card has a numeric value (not NaN/undefined)", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin");
    await page.getByRole("heading", { name: /admin dashboard/i }).waitFor({ timeout: 10_000 });

    const kpiLabels = [
      "Total Users",
      "Active Listings",
      "Pending Verifications",
      "Open Reports",
      "Total Reviews",
    ];

    for (const label of kpiLabels) {
      const card = page.getByText(label).locator("..");
      const text = await card.textContent();
      expect(text).toBeDefined();
      // The card text should contain at least one digit and not contain NaN or undefined
      expect(text).not.toContain("NaN");
      expect(text).not.toContain("undefined");
      expect(text).toMatch(/\d/);
    }
  });

  test("04 · 'Total Users' card is a link to /admin/users", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin");
    await page.getByRole("heading", { name: /admin dashboard/i }).waitFor({ timeout: 10_000 });

    const link = page.getByRole("link", { name: /total users/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", /\/admin\/users/);
  });

  test("05 · revenue chart section visible", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin");
    await page.getByRole("heading", { name: /admin dashboard/i }).waitFor({ timeout: 10_000 });

    const revenueHeading = page.getByRole("heading", {
      name: /platform revenue \(mock\)/i,
    });
    await expect(revenueHeading).toBeVisible();
  });

  test("06 · activity feed heading visible", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin");
    await page.getByRole("heading", { name: /admin dashboard/i }).waitFor({ timeout: 10_000 });

    const activityHeading = page.getByRole("heading", {
      name: /recent activity/i,
    });
    await expect(activityHeading).toBeVisible();
  });

  test("07 · activity feed shows entries OR empty text", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin");
    await page.getByRole("heading", { name: /admin dashboard/i }).waitFor({ timeout: 10_000 });

    const hasEntries = await page
      .locator("[data-testid='activity-entry'], li")
      .first()
      .isVisible()
      .catch(() => false);

    const hasEmptyText = await page
      .getByText(/no recent activity/i)
      .isVisible()
      .catch(() => false);

    expect(hasEntries || hasEmptyText).toBe(true);
  });

  test("08 · suspense skeletons resolve (page fully loaded)", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin");
    await page.getByRole("heading", { name: /admin dashboard/i }).waitFor({ timeout: 10_000 });

    // After timeout, no skeleton/loading indicators should remain
    const skeletons = page.locator(".animate-pulse, [data-testid='skeleton']");
    const skeletonCount = await skeletons.count().catch(() => 0);

    // Allow a brief moment for any remaining skeletons to resolve
    if (skeletonCount > 0) {
      await page.waitForTimeout(2_000);
      const remaining = await skeletons.count();
      expect(remaining).toBe(0);
    }
  });
});
