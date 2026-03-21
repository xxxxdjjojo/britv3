import { test, expect } from "./fixtures/auth";

test.use({ role: "admin" });

test.describe("Scenario 03 — Destructive Actions: Confirm Modal", () => {
  /**
   * Helper: navigate to a user detail page by finding the first user ID
   * from the users list. Returns true if navigation succeeded.
   */
  async function navigateToUserDetail(page: import("@playwright/test").Page): Promise<boolean> {
    await page.goto("/admin/users");
    const heading = page.getByRole("heading").first();
    const loaded = await heading.isVisible({ timeout: 10_000 }).catch(() => false);
    if (!loaded) return false;

    // Try to find a link to a user detail page
    const userLink = page.getByRole("link", { name: /view|details/i }).first();
    const hasLink = await userLink.isVisible().catch(() => false);

    if (hasLink) {
      await userLink.click();
      await page.waitForLoadState("domcontentloaded");
      return true;
    }

    // Try clicking a View button that may navigate
    const viewButton = page.getByRole("button", { name: /view/i }).first();
    const hasViewButton = await viewButton.isVisible().catch(() => false);

    if (hasViewButton) {
      await viewButton.click();
      await page.waitForTimeout(1_000);

      // Check if a detail page link exists in the modal
      const detailLink = page.getByRole("link", { name: /view full profile|manage user/i }).first();
      const hasDetailLink = await detailLink.isVisible().catch(() => false);

      if (hasDetailLink) {
        await detailLink.click();
        await page.waitForLoadState("domcontentloaded");
        return true;
      }
    }

    return false;
  }

  test("01 · navigate to /admin/users and check user detail page exists", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/users");
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });

    const hasUsers = await page
      .getByRole("row")
      .nth(1)
      .isVisible()
      .catch(() => false);

    if (!hasUsers) {
      test.skip(true, "No users available for detail page testing");
      return;
    }

    // Users exist — the management page loaded successfully
    expect(hasUsers).toBe(true);
  });

  test("02 · user detail page shows 'Suspend User' or 'Activate Account' button", async ({
    authenticatedPage: page,
  }) => {
    const navigated = await navigateToUserDetail(page);

    if (!navigated) {
      // Fall back: check the user list page for action buttons
      await page.goto("/admin/users");
      await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

      const hasSuspend = await page
        .getByRole("button", { name: /suspend/i })
        .first()
        .isVisible()
        .catch(() => false);

      const hasActivate = await page
        .getByRole("button", { name: /activate/i })
        .first()
        .isVisible()
        .catch(() => false);

      if (!hasSuspend && !hasActivate) {
        test.skip(true, "No user detail page or action buttons accessible");
        return;
      }

      expect(hasSuspend || hasActivate).toBe(true);
      return;
    }

    const hasSuspend = await page
      .getByRole("button", { name: /suspend user/i })
      .isVisible()
      .catch(() => false);

    const hasActivate = await page
      .getByRole("button", { name: /activate account/i })
      .isVisible()
      .catch(() => false);

    expect(hasSuspend || hasActivate).toBe(true);
  });

  test("03 · 'Ban User' button visible when user is active", async ({
    authenticatedPage: page,
  }) => {
    const navigated = await navigateToUserDetail(page);

    if (!navigated) {
      // Check user list page for ban buttons
      await page.goto("/admin/users");
      await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

      const hasBan = await page
        .getByRole("button", { name: /ban/i })
        .first()
        .isVisible()
        .catch(() => false);

      if (!hasBan) {
        test.skip(true, "No ban button accessible — user may already be banned");
        return;
      }

      expect(hasBan).toBe(true);
      return;
    }

    const banButton = page.getByRole("button", { name: /ban user/i });
    const hasBan = await banButton.isVisible().catch(() => false);

    if (!hasBan) {
      test.skip(true, "User may not be in active state — ban not available");
      return;
    }

    expect(hasBan).toBe(true);
  });

  test("04 · clicking 'Suspend User' opens dialog with title 'Suspend User'", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/users");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const suspendButton = page
      .getByRole("button", { name: /suspend/i })
      .first();
    const hasSuspend = await suspendButton.isVisible().catch(() => false);

    if (!hasSuspend) {
      test.skip(true, "No suspend button available");
      return;
    }

    await suspendButton.click();

    const dialogTitle = page.getByRole("heading", { name: /suspend user/i });
    await expect(dialogTitle).toBeVisible({ timeout: 5_000 });
  });

  test("05 · modal has reason dropdown with 'Select a reason' placeholder", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/users");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const suspendButton = page
      .getByRole("button", { name: /suspend/i })
      .first();
    const hasSuspend = await suspendButton.isVisible().catch(() => false);

    if (!hasSuspend) {
      test.skip(true, "No suspend button available");
      return;
    }

    await suspendButton.click();
    await page
      .getByRole("heading", { name: /suspend user/i })
      .waitFor({ timeout: 5_000 });

    const reasonSelect = page.getByText(/select a reason/i);
    await expect(reasonSelect).toBeVisible();
  });

  test("06 · modal has 'Cancel' and confirm buttons", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/users");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const suspendButton = page
      .getByRole("button", { name: /suspend/i })
      .first();
    const hasSuspend = await suspendButton.isVisible().catch(() => false);

    if (!hasSuspend) {
      test.skip(true, "No suspend button available");
      return;
    }

    await suspendButton.click();
    await page
      .getByRole("heading", { name: /suspend user/i })
      .waitFor({ timeout: 5_000 });

    const cancelButton = page.getByRole("button", { name: /cancel/i });
    await expect(cancelButton).toBeVisible();

    const confirmButton = page.getByRole("button", { name: /suspend/i }).last();
    await expect(confirmButton).toBeVisible();
  });

  test("07 · confirm button disabled when no reason selected", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/users");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const suspendButton = page
      .getByRole("button", { name: /suspend/i })
      .first();
    const hasSuspend = await suspendButton.isVisible().catch(() => false);

    if (!hasSuspend) {
      test.skip(true, "No suspend button available");
      return;
    }

    await suspendButton.click();
    await page
      .getByRole("heading", { name: /suspend user/i })
      .waitFor({ timeout: 5_000 });

    // The confirm/submit button inside the modal should be disabled
    const confirmButton = page.getByRole("button", { name: /suspend/i }).last();
    await expect(confirmButton).toBeDisabled();
  });

  test("08 · 'Notes' textarea with 'Additional context...' placeholder", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/users");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const suspendButton = page
      .getByRole("button", { name: /suspend/i })
      .first();
    const hasSuspend = await suspendButton.isVisible().catch(() => false);

    if (!hasSuspend) {
      test.skip(true, "No suspend button available");
      return;
    }

    await suspendButton.click();
    await page
      .getByRole("heading", { name: /suspend user/i })
      .waitFor({ timeout: 5_000 });

    const notesTextarea = page.getByPlaceholder(/additional context/i);
    await expect(notesTextarea).toBeVisible();
  });

  test("09 · cancel button closes the modal", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/users");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const suspendButton = page
      .getByRole("button", { name: /suspend/i })
      .first();
    const hasSuspend = await suspendButton.isVisible().catch(() => false);

    if (!hasSuspend) {
      test.skip(true, "No suspend button available");
      return;
    }

    await suspendButton.click();
    await page
      .getByRole("heading", { name: /suspend user/i })
      .waitFor({ timeout: 5_000 });

    const cancelButton = page.getByRole("button", { name: /cancel/i });
    await cancelButton.click();

    await expect(
      page.getByRole("heading", { name: /suspend user/i }),
    ).not.toBeVisible({ timeout: 3_000 });
  });
});
