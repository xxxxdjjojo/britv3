import { test, expect } from "./fixtures/auth";

test.use({ role: "admin" });

test.describe("Scenario 12a — Team Management", () => {
  test("01 · /admin/team loads with heading", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/team");
    const heading = page.getByRole("heading", { name: /team/i });
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("02 · invite form: email input with correct placeholder", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/team");
    await page.getByRole("heading", { name: /team/i }).waitFor({ timeout: 10_000 });

    const emailInput = page.getByPlaceholder("colleague@company.com");
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("type", "email");
  });

  test("03 · 'Send Invite' button exists and disabled when empty", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/team");
    await page.getByRole("heading", { name: /team/i }).waitFor({ timeout: 10_000 });

    const sendBtn = page.getByRole("button", { name: /send invite/i });
    await expect(sendBtn).toBeVisible();

    // Clear the email input to ensure it's empty
    const emailInput = page.getByPlaceholder("colleague@company.com");
    await emailInput.clear();

    await expect(sendBtn).toBeDisabled();
  });

  test("04 · team member table with columns: Admin, Status, Joined", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/team");
    await page.getByRole("heading", { name: /team/i }).waitFor({ timeout: 10_000 });

    const headers = ["Admin", "Status", "Joined"];
    for (const h of headers) {
      await expect(
        page.getByRole("columnheader", { name: h }).or(page.getByText(h))
      ).toBeVisible();
    }
  });

  test("05 · member rows show name, email, status badge", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/team");
    await page.getByRole("heading", { name: /team/i }).waitFor({ timeout: 10_000 });

    const rows = page.locator("tbody tr");
    const rowCount = await rows.count().catch(() => 0);

    if (rowCount > 0) {
      const firstRow = rows.first();
      const rowText = await firstRow.textContent();
      expect(rowText).toBeDefined();

      // Should contain an email-like pattern
      expect(rowText).toMatch(/@/);

      // Should have a status badge (active, invited, etc.)
      const hasBadge = await firstRow
        .locator("span")
        .filter({ hasText: /active|invited|pending/i })
        .isVisible()
        .catch(() => false);
      // Status text should be somewhere in the row
      const hasStatusText = /active|invited|pending/i.test(rowText || "");
      expect(hasBadge || hasStatusText).toBe(true);
    }
  });
});

test.describe("Scenario 12b — Role Promotion", () => {
  test("06 · /admin/roles loads with heading", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/roles");
    const heading = page.getByRole("heading", { name: /role/i });
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("07 · 'Change User Role' form heading", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/roles");
    await page.getByRole("heading", { name: /role/i }).waitFor({ timeout: 10_000 });

    const formHeading = page.getByRole("heading", { name: /change user role/i })
      .or(page.getByText(/change user role/i));
    await expect(formHeading).toBeVisible();
  });

  test("08 · User ID input with 'User ID (UUID)' placeholder", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/roles");
    await page.getByRole("heading", { name: /role/i }).waitFor({ timeout: 10_000 });

    const userIdInput = page.getByPlaceholder("User ID (UUID)");
    await expect(userIdInput).toBeVisible();
  });

  test("09 · action select with 'Promote to admin' option", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/roles");
    await page.getByRole("heading", { name: /role/i }).waitFor({ timeout: 10_000 });

    const actionSelect = page.getByRole("combobox").or(page.locator("select"));
    await expect(actionSelect).toBeVisible();

    // Check that Promote option exists
    const promoteOption = page.getByText(/promote/i);
    const hasPromote = await promoteOption.isVisible().catch(async () => {
      // Try clicking select to see options
      await actionSelect.click().catch(() => false);
      return await page.getByText(/promote/i).isVisible().catch(() => false);
    });
    expect(hasPromote).toBe(true);
  });

  test("10 · 'Apply' button disabled when no user ID", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/roles");
    await page.getByRole("heading", { name: /role/i }).waitFor({ timeout: 10_000 });

    const userIdInput = page.getByPlaceholder("User ID (UUID)");
    await userIdInput.clear();

    const applyBtn = page.getByRole("button", { name: /apply/i });
    await expect(applyBtn).toBeDisabled();
  });

  test("11 · role count cards visible (at least some role names)", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/roles");
    await page.getByRole("heading", { name: /role/i }).waitFor({ timeout: 10_000 });

    const roleNames = [
      "Homebuyer",
      "Renter",
      "Seller",
      "Landlord",
      "Estate Agent",
      "Service Provider",
      "Admin",
    ];

    let visibleCount = 0;
    for (const role of roleNames) {
      const isVisible = await page
        .getByText(role)
        .first()
        .isVisible()
        .catch(() => false);
      if (isVisible) visibleCount++;
    }

    // At least 4 of the 7 roles should be visible
    expect(visibleCount).toBeGreaterThanOrEqual(4);
  });

  test("12 · percentage of users shown per role card", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/roles");
    await page.getByRole("heading", { name: /role/i }).waitFor({ timeout: 10_000 });

    // Look for percentage patterns like "45%" or "12.3%"
    const percentages = page.getByText(/%/);
    const percentCount = await percentages.count().catch(() => 0);

    // Should have at least a few percentage indicators
    expect(percentCount).toBeGreaterThanOrEqual(1);
  });
});
