import { test, expect } from "./fixtures/auth";

test.use({ role: "admin" });

test.describe("Scenario 11a — Promo Codes", () => {
  test("01 · /admin/promo-codes loads with heading", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/promo-codes");
    const heading = page.getByRole("heading", { name: /promo/i });
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("02 · 'New Promo Code' button visible", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/promo-codes");
    await page.getByRole("heading", { name: /promo/i }).waitFor({ timeout: 10_000 });

    const newBtn = page.getByRole("button", { name: /new promo code/i });
    await expect(newBtn).toBeVisible();
  });

  test("03 · click 'New Promo Code' shows create form with heading", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/promo-codes");
    await page.getByRole("heading", { name: /promo/i }).waitFor({ timeout: 10_000 });

    await page.getByRole("button", { name: /new promo code/i }).click();

    const formHeading = page.getByRole("heading", { name: /create promo code/i });
    await expect(formHeading).toBeVisible();
  });

  test("04 · form has Code input, Discount Type select, Discount Value input, Max Uses input", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/promo-codes");
    await page.getByRole("heading", { name: /promo/i }).waitFor({ timeout: 10_000 });

    await page.getByRole("button", { name: /new promo code/i }).click();
    await page.getByRole("heading", { name: /create promo code/i }).waitFor();

    // Code input
    const codeInput = page.getByLabel(/code/i).first();
    await expect(codeInput).toBeVisible();

    // Discount Type select
    const typeSelect = page.getByLabel(/discount type/i)
      .or(page.locator("select").filter({ hasText: /percentage|fixed/i }));
    await expect(typeSelect).toBeVisible();

    // Discount Value input
    const valueInput = page.getByLabel(/discount value/i)
      .or(page.getByLabel(/value/i));
    await expect(valueInput).toBeVisible();

    // Max Uses input
    const maxUsesInput = page.getByLabel(/max uses/i);
    await expect(maxUsesInput).toBeVisible();
  });

  test("05 · 'Create Code' submit button exists", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/promo-codes");
    await page.getByRole("heading", { name: /promo/i }).waitFor({ timeout: 10_000 });

    await page.getByRole("button", { name: /new promo code/i }).click();
    await page.getByRole("heading", { name: /create promo code/i }).waitFor();

    const submitBtn = page.getByRole("button", { name: /create code/i });
    await expect(submitBtn).toBeVisible();
  });

  test("06 · cancel button in form closes it", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/promo-codes");
    await page.getByRole("heading", { name: /promo/i }).waitFor({ timeout: 10_000 });

    await page.getByRole("button", { name: /new promo code/i }).click();
    await page.getByRole("heading", { name: /create promo code/i }).waitFor();

    const cancelBtn = page.getByRole("button", { name: /cancel/i });
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // Form heading should no longer be visible
    const formHeading = page.getByRole("heading", { name: /create promo code/i });
    await expect(formHeading).not.toBeVisible();
  });

  test("07 · promo code table or empty state 'No promo codes' visible", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/promo-codes");
    await page.getByRole("heading", { name: /promo/i }).waitFor({ timeout: 10_000 });

    const table = page.locator("table");
    const emptyState = page.getByText(/no promo codes/i);

    const hasTable = await table.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasTable || hasEmpty).toBe(true);
  });
});

test.describe("Scenario 11b — Email Campaigns", () => {
  test("08 · /admin/email-campaigns loads with heading", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/email-campaigns");
    const heading = page.getByRole("heading", { name: /campaign/i });
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("09 · 'New Campaign' button visible", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/email-campaigns");
    await page.getByRole("heading", { name: /campaign/i }).waitFor({ timeout: 10_000 });

    const newBtn = page.getByRole("button", { name: /new campaign/i });
    await expect(newBtn).toBeVisible();
  });

  test("10 · click shows form with 'Create Email Campaign' heading", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/email-campaigns");
    await page.getByRole("heading", { name: /campaign/i }).waitFor({ timeout: 10_000 });

    await page.getByRole("button", { name: /new campaign/i }).click();

    const formHeading = page.getByRole("heading", { name: /create email campaign/i });
    await expect(formHeading).toBeVisible();
  });

  test("11 · Campaign Name and Subject Line inputs exist", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/email-campaigns");
    await page.getByRole("heading", { name: /campaign/i }).waitFor({ timeout: 10_000 });

    await page.getByRole("button", { name: /new campaign/i }).click();
    await page.getByRole("heading", { name: /create email campaign/i }).waitFor();

    const nameInput = page.getByLabel(/campaign name/i);
    const subjectInput = page.getByLabel(/subject line/i);

    await expect(nameInput).toBeVisible();
    await expect(subjectInput).toBeVisible();
  });

  test("12 · target roles toggles visible", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/email-campaigns");
    await page.getByRole("heading", { name: /campaign/i }).waitFor({ timeout: 10_000 });

    await page.getByRole("button", { name: /new campaign/i }).click();
    await page.getByRole("heading", { name: /create email campaign/i }).waitFor();

    const roles = ["homebuyer", "renter", "seller", "landlord"];
    for (const role of roles) {
      const toggle = page.getByLabel(new RegExp(role, "i"))
        .or(page.getByText(new RegExp(role, "i")));
      await expect(toggle).toBeVisible();
    }
  });

  test("13 · campaign table or empty state 'No campaigns' visible", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/email-campaigns");
    await page.getByRole("heading", { name: /campaign/i }).waitFor({ timeout: 10_000 });

    const table = page.locator("table");
    const emptyState = page.getByText(/no campaigns/i);

    const hasTable = await table.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasTable || hasEmpty).toBe(true);
  });

  test("14 · 'Send' button only on draft campaign rows", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/email-campaigns");
    await page.getByRole("heading", { name: /campaign/i }).waitFor({ timeout: 10_000 });

    const rows = page.locator("tbody tr");
    const rowCount = await rows.count().catch(() => 0);

    if (rowCount > 0) {
      const sendButtons = page.getByRole("button", { name: /^send$/i });
      const sendCount = await sendButtons.count().catch(() => 0);

      // Each Send button should be in a row with "draft" status
      for (let i = 0; i < sendCount; i++) {
        const row = sendButtons.nth(i).locator("ancestor::tr").first()
          .or(sendButtons.nth(i).locator("..").locator(".."));
        const rowText = await row.textContent().catch(() => "");
        expect(rowText?.toLowerCase()).toContain("draft");
      }
    }
    // No rows or no send buttons is acceptable
  });
});
