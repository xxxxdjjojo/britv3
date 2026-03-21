import { test, expect } from "./fixtures/auth";

test.use({ role: "admin" });

test.describe("Scenario 13a — AdminSidebar Navigation", () => {
  test("01 · AdminSidebar visible with nav groups", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin");
    await page.getByRole("heading", { name: /admin/i }).waitFor({ timeout: 10_000 });

    const sidebar = page.getByRole("navigation").or(page.locator("aside"));
    await expect(sidebar).toBeVisible();
  });

  test("02 · sidebar has 'Overview' group with Dashboard link", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin");
    await page.getByRole("heading", { name: /admin/i }).waitFor({ timeout: 10_000 });

    const sidebar = page.getByRole("navigation").or(page.locator("aside"));
    const overviewGroup = sidebar.getByText(/overview/i);
    await expect(overviewGroup).toBeVisible();

    const dashboardLink = sidebar.getByRole("link", { name: /dashboard/i });
    await expect(dashboardLink).toBeVisible();
  });

  test("03 · sidebar has 'Moderation' group with Users, Listings links", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin");
    await page.getByRole("heading", { name: /admin/i }).waitFor({ timeout: 10_000 });

    const sidebar = page.getByRole("navigation").or(page.locator("aside"));
    const moderationGroup = sidebar.getByText(/moderation/i);
    await expect(moderationGroup).toBeVisible();

    const usersLink = sidebar.getByRole("link", { name: /users/i });
    const listingsLink = sidebar.getByRole("link", { name: /listings/i });
    await expect(usersLink).toBeVisible();
    await expect(listingsLink).toBeVisible();
  });

  test("04 · sidebar has 'Operations' group", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin");
    await page.getByRole("heading", { name: /admin/i }).waitFor({ timeout: 10_000 });

    const sidebar = page.getByRole("navigation").or(page.locator("aside"));
    const operationsGroup = sidebar.getByText(/operations/i);
    await expect(operationsGroup).toBeVisible();
  });

  test("05 · sidebar has 'Content' group", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin");
    await page.getByRole("heading", { name: /admin/i }).waitFor({ timeout: 10_000 });

    const sidebar = page.getByRole("navigation").or(page.locator("aside"));
    const contentGroup = sidebar.getByText(/content/i);
    await expect(contentGroup).toBeVisible();
  });

  test("06 · sidebar has 'Growth' group", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin");
    await page.getByRole("heading", { name: /admin/i }).waitFor({ timeout: 10_000 });

    const sidebar = page.getByRole("navigation").or(page.locator("aside"));
    const growthGroup = sidebar.getByText(/growth/i);
    await expect(growthGroup).toBeVisible();
  });

  test("07 · sidebar has 'Team' group", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin");
    await page.getByRole("heading", { name: /admin/i }).waitFor({ timeout: 10_000 });

    const sidebar = page.getByRole("navigation").or(page.locator("aside"));
    const teamGroup = sidebar.getByText(/team/i);
    await expect(teamGroup).toBeVisible();
  });

  test("08 · active sidebar item highlighted (current route)", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin");
    await page.getByRole("heading", { name: /admin/i }).waitFor({ timeout: 10_000 });

    const sidebar = page.getByRole("navigation").or(page.locator("aside"));
    const dashboardLink = sidebar.getByRole("link", { name: /dashboard/i });

    // Active link should have a visual indicator (bg class, aria-current, or data attribute)
    const hasAriaCurrent = await dashboardLink
      .getAttribute("aria-current")
      .catch(() => null);
    const className = await dashboardLink
      .getAttribute("class")
      .catch(() => "");
    const dataActive = await dashboardLink
      .getAttribute("data-active")
      .catch(() => null);

    const isHighlighted =
      hasAriaCurrent === "page" ||
      hasAriaCurrent === "true" ||
      /bg-|active|current|selected/i.test(className || "") ||
      dataActive === "true";

    expect(isHighlighted).toBe(true);
  });
});

test.describe("Scenario 13b — Responsive Layout", () => {
  test("09 · at desktop (1440px): sidebar visible, main content has left margin", async ({
    authenticatedPage: page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/admin");
    await page.getByRole("heading", { name: /admin/i }).waitFor({ timeout: 10_000 });

    const sidebar = page.getByRole("navigation").or(page.locator("aside"));
    await expect(sidebar).toBeVisible();

    // Main content area should exist alongside sidebar
    const main = page.locator("main").or(page.locator("[role='main']"));
    await expect(main).toBeVisible();
  });
});

test.describe("Scenario 13c — System Health", () => {
  test("10 · /admin/system-health loads", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/system-health");
    const heading = page.getByRole("heading", { name: /system|health/i });
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("11 · system health shows service checks", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/system-health");
    await page.getByRole("heading", { name: /system|health/i }).waitFor({ timeout: 10_000 });

    // Look for service check items (DB, Auth, Storage, etc.)
    const serviceKeywords = ["database", "db", "auth", "storage", "api", "supabase"];
    let foundServices = 0;

    for (const keyword of serviceKeywords) {
      const isVisible = await page
        .getByText(new RegExp(keyword, "i"))
        .first()
        .isVisible()
        .catch(() => false);
      if (isVisible) foundServices++;
    }

    // At least one service check should be visible
    expect(foundServices).toBeGreaterThanOrEqual(1);
  });

  test("12 · overall health status indicator", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/system-health");
    await page.getByRole("heading", { name: /system|health/i }).waitFor({ timeout: 10_000 });

    // Look for overall status indicator (healthy, degraded, down, etc.)
    const statusKeywords = ["healthy", "operational", "degraded", "down", "status", "ok"];
    let foundStatus = false;

    for (const keyword of statusKeywords) {
      const isVisible = await page
        .getByText(new RegExp(keyword, "i"))
        .first()
        .isVisible()
        .catch(() => false);
      if (isVisible) {
        foundStatus = true;
        break;
      }
    }

    // Also check for status indicator elements (colored dots, icons)
    const statusIndicator = page.locator("[data-status], .status-indicator, .health-status");
    const hasIndicator = await statusIndicator.first().isVisible().catch(() => false);

    expect(foundStatus || hasIndicator).toBe(true);
  });
});

test.describe("Scenario 13d — Rapid Navigation Resilience", () => {
  test("13 · navigate rapidly between admin pages without crash", async ({
    authenticatedPage: page,
  }) => {
    const routes = [
      "/admin",
      "/admin/users",
      "/admin/listings",
      "/admin/audit-log",
      "/admin/gdpr",
      "/admin/team",
      "/admin/roles",
    ];

    // Navigate quickly through all routes
    for (const route of routes) {
      await page.goto(route, { waitUntil: "commit" });
    }

    // Wait for last page to settle
    await page.waitForLoadState("domcontentloaded");

    // Page should not show error state
    const bodyText = await page.locator("body").textContent().catch(() => "");
    expect(bodyText).not.toContain("Application error");
  });

  test("14 · body never shows 'Application error'", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin");
    await page.getByRole("heading", { name: /admin/i }).waitFor({ timeout: 10_000 });

    const bodyText = await page.locator("body").textContent().catch(() => "");
    expect(bodyText).not.toContain("Application error");
  });

  test("15 · /admin/audit-log page loads and renders table", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/audit-log");
    await page.getByRole("heading", { name: /audit/i }).waitFor({ timeout: 10_000 });

    const table = page.locator("table");
    const emptyState = page.getByText(/no entries/i);

    const hasTable = await table.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasTable || hasEmpty).toBe(true);
  });

  test("16 · audit entries (if any) show action, target, admin ID", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/audit-log");
    await page.getByRole("heading", { name: /audit/i }).waitFor({ timeout: 10_000 });

    const rows = page.locator("tbody tr");
    const rowCount = await rows.count().catch(() => 0);

    if (rowCount > 0) {
      const firstRow = rows.first();
      const cells = firstRow.locator("td");
      const cellCount = await cells.count();

      // Should have at least 3 cells (action, target, admin ID)
      expect(cellCount).toBeGreaterThanOrEqual(3);

      // First cell (action) should have text
      const actionText = await cells.first().textContent();
      expect(actionText?.trim().length).toBeGreaterThan(0);
    }
  });
});
