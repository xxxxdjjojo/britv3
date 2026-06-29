import { test, expect } from "@playwright/test";

// New Homes end-to-end happy path:
//   1. visit /new-homes
//   2. open a development
//   3. request a brochure (lead capture)
//   4. book a viewing
//
// This spec is data-dependent: it requires the new-homes migration + the
// `30_new_homes_demo.sql` seed applied to the target database. When no
// developments are published (e.g. against a fresh/remote DB), it skips
// gracefully so it never breaks CI. Apply the seed locally to run it fully.

test.describe("New Homes — public happy path", () => {
  test("browse → open development → request brochure → book viewing", async ({ page }) => {
    await page.goto("/new-homes");

    // Heading always renders.
    await expect(
      page.getByRole("heading", { name: /regional developers/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Skip when there is no seeded data to drive the flow.
    const firstCard = page.locator('a[href^="/new-homes/"]').first();
    if ((await firstCard.count()) === 0) {
      test.skip(true, "No published developments — apply 30_new_homes_demo.sql to run.");
      return;
    }

    await firstCard.click();
    await expect(page).toHaveURL(/\/new-homes\/.+/);

    // Request brochure.
    await page.getByRole("button", { name: /request brochure/i }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/full name/i).fill("E2E Test Buyer");
    await dialog.getByLabel(/email/i).fill("e2e-buyer@example.com");
    await dialog.getByRole("button", { name: /submit enquiry/i }).click();
    await expect(page.getByText(/enquiry sent/i)).toBeVisible({ timeout: 10_000 });

    // Close and book a viewing.
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /book a viewing/i }).first().click();
    const viewingDialog = page.getByRole("dialog");
    await expect(viewingDialog).toBeVisible();
    await viewingDialog.getByLabel(/full name/i).fill("E2E Test Buyer");
    await viewingDialog.getByLabel(/email/i).fill("e2e-buyer@example.com");
    await viewingDialog.getByRole("button", { name: /submit enquiry/i }).click();
    await expect(page.getByText(/enquiry sent/i)).toBeVisible({ timeout: 10_000 });
  });
});
