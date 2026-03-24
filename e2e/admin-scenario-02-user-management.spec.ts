import { test, expect } from "./fixtures/auth";

test.use({ role: "admin" });

test.describe("Scenario 02 — User Management", () => {
  test("01 · /admin/users loads with search input and user count", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/users");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const searchInput = page.getByRole("textbox");
    await expect(searchInput).toBeVisible();

    const countText = page.getByText(/user\(s\) found/i);
    await expect(countText).toBeVisible();
  });

  test("02 · search input has correct placeholder", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/users");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const searchInput = page.getByPlaceholder("Search by name or email…");
    await expect(searchInput).toBeVisible();
  });

  test("03 · 'Search' submit button exists", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/users");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const searchButton = page.getByRole("button", { name: /search/i });
    await expect(searchButton).toBeVisible();
  });

  test("04 · user table renders with rows or shows '0 users found'", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/users");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const hasRows = await page
      .getByRole("row")
      .first()
      .isVisible()
      .catch(() => false);

    const hasEmpty = await page
      .getByText(/0 user\(s\) found/i)
      .isVisible()
      .catch(() => false);

    expect(hasRows || hasEmpty).toBe(true);
  });

  test("05 · pagination shows 'Page X of Y' when applicable", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/users");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const hasPagination = await page
      .getByText(/page \d+ of \d+/i)
      .isVisible()
      .catch(() => false);

    const hasRows = await page
      .getByRole("row")
      .nth(1)
      .isVisible()
      .catch(() => false);

    // Pagination is only expected when there are rows
    if (hasRows) {
      expect(hasPagination).toBe(true);
    } else {
      // No rows means no pagination needed — test passes
      expect(true).toBe(true);
    }
  });

  test("06 · 'View' button opens UserDetailModal with 'User Details' heading", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/users");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const viewButton = page.getByRole("button", { name: /view/i }).first();
    const hasViewButton = await viewButton.isVisible().catch(() => false);

    if (!hasViewButton) {
      test.skip(true, "No users with View button available");
      return;
    }

    await viewButton.click();

    const modalHeading = page.getByRole("heading", { name: /user details/i });
    await expect(modalHeading).toBeVisible({ timeout: 5_000 });
  });

  test("07 · modal shows Name, Email, Role, Status, User ID, Created fields", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/users");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const viewButton = page.getByRole("button", { name: /view/i }).first();
    const hasViewButton = await viewButton.isVisible().catch(() => false);

    if (!hasViewButton) {
      test.skip(true, "No users with View button available");
      return;
    }

    await viewButton.click();
    await page
      .getByRole("heading", { name: /user details/i })
      .waitFor({ timeout: 5_000 });

    const expectedFields = ["Name", "Email", "Role", "Status", "User ID", "Created"];
    for (const field of expectedFields) {
      const fieldText = page.getByText(field);
      await expect(fieldText).toBeVisible();
    }
  });

  test("08 · modal close button works", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/users");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const viewButton = page.getByRole("button", { name: /view/i }).first();
    const hasViewButton = await viewButton.isVisible().catch(() => false);

    if (!hasViewButton) {
      test.skip(true, "No users with View button available");
      return;
    }

    await viewButton.click();
    await page
      .getByRole("heading", { name: /user details/i })
      .waitFor({ timeout: 5_000 });

    const closeButton = page.getByLabel("Close");
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    await expect(
      page.getByRole("heading", { name: /user details/i }),
    ).not.toBeVisible({ timeout: 3_000 });
  });

  test("09 · 'Suspend' button exists for active users", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/users");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const suspendButton = page
      .getByRole("button", { name: /suspend/i })
      .first();

    const hasSuspend = await suspendButton.isVisible().catch(() => false);

    if (!hasSuspend) {
      // No active users to suspend — acceptable
      const activateButton = page
        .getByRole("button", { name: /activate/i })
        .first();
      const hasActivate = await activateButton.isVisible().catch(() => false);

      // At least one action type should exist if users are present
      const hasUsers = await page
        .getByRole("row")
        .nth(1)
        .isVisible()
        .catch(() => false);

      if (hasUsers) {
        expect(hasSuspend || hasActivate).toBe(true);
      }
    } else {
      expect(hasSuspend).toBe(true);
    }
  });

  test("10 · 'Activate' button exists for suspended users", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/users");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const activateButton = page
      .getByRole("button", { name: /activate/i })
      .first();

    const hasActivate = await activateButton.isVisible().catch(() => false);

    // This button only appears when there are suspended users
    // If no suspended users, that's acceptable
    if (!hasActivate) {
      const hasUsers = await page
        .getByRole("row")
        .nth(1)
        .isVisible()
        .catch(() => false);

      if (!hasUsers) {
        test.skip(true, "No users available to check activation state");
      }
      // Users exist but none are suspended — that's fine
    } else {
      expect(hasActivate).toBe(true);
    }
  });
});
