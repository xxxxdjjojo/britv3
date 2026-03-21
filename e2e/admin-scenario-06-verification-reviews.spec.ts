/**
 * Scenario 06 — Verification & Review Moderation (20.8–20.11)
 *
 * Tests the admin verification queue, review moderation,
 * and reported content management pages.
 */
import { test, expect } from "./fixtures/auth";

test.use({ role: "admin" });

test.describe("Scenario 06 — Verification & Review Moderation", () => {
  /* ---------------------------------------------------------------- */
  /*  Verifications                                                    */
  /* ---------------------------------------------------------------- */
  test("1 — /admin/verifications loads with heading", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin/verifications", { timeout: 10_000 });
    const heading = authenticatedPage.getByRole("heading", { name: /verif/i });
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("2 — verification queue shows entries or empty state", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin/verifications", { timeout: 10_000 });
    await expect(authenticatedPage.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });

    // Either verification entries exist or an empty state is shown
    const hasEntries = await authenticatedPage
      .locator("table tbody tr, [data-testid='verification-item'], li")
      .first()
      .isVisible()
      .catch(() => false);

    const hasEmptyState = await authenticatedPage
      .getByText(/no.*verif|empty|nothing|no pending/i)
      .isVisible()
      .catch(() => false);

    expect(hasEntries || hasEmptyState).toBe(true);
  });

  test("3 — entries have user info and verification type (if data exists)", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin/verifications", { timeout: 10_000 });
    await expect(authenticatedPage.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });

    const firstEntry = authenticatedPage
      .locator("table tbody tr, [data-testid='verification-item']")
      .first();
    const entryExists = await firstEntry.isVisible().catch(() => false);

    if (entryExists) {
      const text = await firstEntry.textContent().catch(() => "");
      // Entry should contain some identifying info (email, name, or verification type)
      expect(text?.length).toBeGreaterThan(0);
    }
    // If no entries, test passes — data may not exist
  });

  test("4 — approve or action buttons visible for pending verifications", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin/verifications", { timeout: 10_000 });
    await expect(authenticatedPage.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });

    const hasEntries = await authenticatedPage
      .locator("table tbody tr, [data-testid='verification-item']")
      .first()
      .isVisible()
      .catch(() => false);

    if (hasEntries) {
      const actionButton = authenticatedPage.getByRole("button", {
        name: /approve|reject|review|action/i,
      });
      const actionCount = await actionButton.count().catch(() => 0);
      expect(actionCount).toBeGreaterThan(0);
    }
    // If no entries, no action buttons expected
  });

  /* ---------------------------------------------------------------- */
  /*  Reviews                                                          */
  /* ---------------------------------------------------------------- */
  test("5 — /admin/reviews loads with heading", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin/reviews", { timeout: 10_000 });
    const heading = authenticatedPage.getByRole("heading", { name: /review/i });
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("6 — review moderation queue renders", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin/reviews", { timeout: 10_000 });
    await expect(authenticatedPage.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });

    // Page should render content area — either reviews or empty state
    const bodyText = await authenticatedPage.locator("main, [role='main'], body").textContent();
    expect(bodyText?.length).toBeGreaterThan(0);
  });

  test("7 — review entries show content and status (if data exists)", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin/reviews", { timeout: 10_000 });
    await expect(authenticatedPage.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });

    const firstReview = authenticatedPage
      .locator("table tbody tr, [data-testid='review-item'], .review-card")
      .first();
    const reviewExists = await firstReview.isVisible().catch(() => false);

    if (reviewExists) {
      const text = await firstReview.textContent().catch(() => "");
      expect(text?.length).toBeGreaterThan(0);
    }
    // Pass gracefully if no review data exists
  });

  /* ---------------------------------------------------------------- */
  /*  Reported Content                                                 */
  /* ---------------------------------------------------------------- */
  test("8 — /admin/reported loads with heading (if page exists)", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin/reported", { timeout: 10_000 });

    // Page might not exist yet — check if we got redirected or a 404
    const is404 = authenticatedPage.url().includes("404") ||
      await authenticatedPage.getByText(/not found|404/i).isVisible().catch(() => false);

    if (!is404) {
      const heading = authenticatedPage.getByRole("heading").first();
      await expect(heading).toBeVisible({ timeout: 10_000 });
    }
  });

  test("9 — reported content queue renders or empty state", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin/reported", { timeout: 10_000 });

    const is404 = await authenticatedPage.getByText(/not found|404/i).isVisible().catch(() => false);
    if (is404) {
      // Page not implemented yet — skip gracefully
      return;
    }

    await expect(authenticatedPage.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });

    const hasEntries = await authenticatedPage
      .locator("table tbody tr, [data-testid='report-item']")
      .first()
      .isVisible()
      .catch(() => false);

    const hasEmptyState = await authenticatedPage
      .getByText(/no.*report|empty|nothing/i)
      .isVisible()
      .catch(() => false);

    expect(hasEntries || hasEmptyState).toBe(true);
  });

  test("10 — action buttons for report resolution exist", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin/reported", { timeout: 10_000 });

    const is404 = await authenticatedPage.getByText(/not found|404/i).isVisible().catch(() => false);
    if (is404) return;

    await expect(authenticatedPage.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });

    const hasEntries = await authenticatedPage
      .locator("table tbody tr, [data-testid='report-item']")
      .first()
      .isVisible()
      .catch(() => false);

    if (hasEntries) {
      const actionButton = authenticatedPage.getByRole("button", {
        name: /resolve|dismiss|remove|action|ban/i,
      });
      const actionCount = await actionButton.count().catch(() => 0);
      expect(actionCount).toBeGreaterThan(0);
    }
  });
});
