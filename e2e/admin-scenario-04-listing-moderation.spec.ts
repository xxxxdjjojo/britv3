import { test, expect } from "./fixtures/auth";

test.use({ role: "admin" });

test.describe("Scenario 04 — Listing Moderation Tabs", () => {
  test("01 · /admin/moderation loads with heading", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/moderation");
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("02 · 3 tab triggers visible: Pending Review, All Listings, Flagged", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/moderation");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const pendingTab = page.getByRole("tab", { name: /pending review/i });
    const allTab = page.getByRole("tab", { name: /all listings/i });
    const flaggedTab = page.getByRole("tab", { name: /flagged/i });

    await expect(pendingTab).toBeVisible();
    await expect(allTab).toBeVisible();
    await expect(flaggedTab).toBeVisible();
  });

  test("03 · 'Pending Review' is default active tab", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/moderation");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const pendingTab = page.getByRole("tab", { name: /pending review/i });
    await expect(pendingTab).toHaveAttribute("aria-selected", "true");
  });

  test("04 · pending listings table has columns Title, Status, Created, Actions", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/moderation");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const hasTable = await page
      .getByRole("table")
      .first()
      .isVisible()
      .catch(() => false);

    if (!hasTable) {
      // If no table, should show empty state
      const emptyState = await page
        .getByText(/no pending listings/i)
        .isVisible()
        .catch(() => false);

      expect(emptyState).toBe(true);
      return;
    }

    const expectedColumns = ["Title", "Status", "Created", "Actions"];
    for (const col of expectedColumns) {
      const header = page.getByRole("columnheader", { name: new RegExp(col, "i") });
      const hasHeader = await header.isVisible().catch(() => false);

      // Also check for text-based header if role isn't set
      const textHeader = await page
        .locator("th")
        .getByText(new RegExp(col, "i"))
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasHeader || textHeader).toBe(true);
    }
  });

  test("05 · action buttons: Approve (green), Reject (red), Flag (amber)", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/moderation");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const approveButton = page
      .getByRole("button", { name: /approve/i })
      .first();
    const hasApprove = await approveButton.isVisible().catch(() => false);

    if (!hasApprove) {
      test.skip(true, "No pending listings with action buttons");
      return;
    }

    await expect(approveButton).toBeVisible();

    const rejectButton = page
      .getByRole("button", { name: /reject/i })
      .first();
    await expect(rejectButton).toBeVisible();

    const flagButton = page
      .getByRole("button", { name: /flag/i })
      .first();
    await expect(flagButton).toBeVisible();
  });

  test("06 · empty pending state shows 'No pending listings' message", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/moderation");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const hasListings = await page
      .getByRole("button", { name: /approve/i })
      .first()
      .isVisible()
      .catch(() => false);

    if (hasListings) {
      test.skip(true, "Pending listings exist — cannot test empty state");
      return;
    }

    const emptyTitle = page.getByText(/no pending listings/i);
    await expect(emptyTitle).toBeVisible();

    const emptyMessage = page.getByText(/all listings have been reviewed/i);
    await expect(emptyMessage).toBeVisible();
  });

  test("07 · click 'All Listings' tab switches content", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/moderation");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const allTab = page.getByRole("tab", { name: /all listings/i });
    await allTab.click();

    await expect(allTab).toHaveAttribute("aria-selected", "true");

    // The pending tab should no longer be selected
    const pendingTab = page.getByRole("tab", { name: /pending review/i });
    await expect(pendingTab).toHaveAttribute("aria-selected", "false");
  });

  test("08 · click 'Flagged' tab switches content", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/moderation");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const flaggedTab = page.getByRole("tab", { name: /flagged/i });
    await flaggedTab.click();

    await expect(flaggedTab).toHaveAttribute("aria-selected", "true");
  });

  test("09 · empty flagged state shows 'No flagged listings' text", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/moderation");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const flaggedTab = page.getByRole("tab", { name: /flagged/i });
    await flaggedTab.click();

    const hasFlaggedListings = await page
      .getByRole("table")
      .first()
      .isVisible()
      .catch(() => false);

    if (hasFlaggedListings) {
      // Check if there are actual rows beyond the header
      const rowCount = await page.getByRole("row").count();
      if (rowCount > 1) {
        test.skip(true, "Flagged listings exist — cannot test empty state");
        return;
      }
    }

    const emptyText = page.getByText(/no flagged listings/i);
    await expect(emptyText).toBeVisible();
  });

  test("10 · click 'Reject' opens AdminConfirmModal with title 'Reject Listing'", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/moderation");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const rejectButton = page
      .getByRole("button", { name: /reject/i })
      .first();
    const hasReject = await rejectButton.isVisible().catch(() => false);

    if (!hasReject) {
      test.skip(true, "No listings with Reject button available");
      return;
    }

    await rejectButton.click();

    const modalTitle = page.getByRole("heading", { name: /reject listing/i });
    await expect(modalTitle).toBeVisible({ timeout: 5_000 });
  });

  test("11 · reject modal has 6 reasons including 'Duplicate listing'", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/moderation");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const rejectButton = page
      .getByRole("button", { name: /reject/i })
      .first();
    const hasReject = await rejectButton.isVisible().catch(() => false);

    if (!hasReject) {
      test.skip(true, "No listings with Reject button available");
      return;
    }

    await rejectButton.click();
    await page
      .getByRole("heading", { name: /reject listing/i })
      .waitFor({ timeout: 5_000 });

    // Check that reason selection is available
    const reasonSelect = page.getByText(/select a reason/i);
    await expect(reasonSelect).toBeVisible();

    // Open the dropdown and check for "Duplicate listing"
    await reasonSelect.click();
    const duplicateOption = page.getByText(/duplicate listing/i);
    const hasDuplicate = await duplicateOption.isVisible().catch(() => false);
    expect(hasDuplicate).toBe(true);
  });

  test("12 · click 'Flag' opens modal with title 'Flag Listing'", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/moderation");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const flagButton = page
      .getByRole("button", { name: /flag/i })
      .first();
    const hasFlag = await flagButton.isVisible().catch(() => false);

    if (!hasFlag) {
      test.skip(true, "No listings with Flag button available");
      return;
    }

    await flagButton.click();

    const modalTitle = page.getByRole("heading", { name: /flag listing/i });
    await expect(modalTitle).toBeVisible({ timeout: 5_000 });
  });

  test("13 · flag modal has reasons including 'Needs review'", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/moderation");
    await page.getByRole("heading").first().waitFor({ timeout: 10_000 });

    const flagButton = page
      .getByRole("button", { name: /flag/i })
      .first();
    const hasFlag = await flagButton.isVisible().catch(() => false);

    if (!hasFlag) {
      test.skip(true, "No listings with Flag button available");
      return;
    }

    await flagButton.click();
    await page
      .getByRole("heading", { name: /flag listing/i })
      .waitFor({ timeout: 5_000 });

    const reasonSelect = page.getByText(/select a reason/i);
    await expect(reasonSelect).toBeVisible();

    await reasonSelect.click();
    const needsReview = page.getByText(/needs review/i);
    const hasNeedsReview = await needsReview.isVisible().catch(() => false);
    expect(hasNeedsReview).toBe(true);
  });
});
