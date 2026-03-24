import { test, expect } from "./fixtures/auth";

test.use({ role: "admin" });

test.describe("Scenario 09 — GDPR Queue", () => {
  test("01 · /admin/gdpr loads with heading", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/gdpr");
    const heading = page.getByRole("heading", { name: /gdpr/i });
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("02 · request count visible: '{N} request(s)' or '0 requests'", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/gdpr");
    await page.getByRole("heading", { name: /gdpr/i }).waitFor({ timeout: 10_000 });

    const count = page.getByText(/\d+ requests?\b/i);
    await expect(count).toBeVisible();
  });

  test("03 · status filter dropdown exists", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/gdpr");
    await page.getByRole("heading", { name: /gdpr/i }).waitFor({ timeout: 10_000 });

    const filter = page.getByRole("combobox").or(page.locator("select"));
    await expect(filter).toBeVisible();
  });

  test("04 · table headers: Request ID, Type, Status, Submitted, Fulfilled At", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/gdpr");
    await page.getByRole("heading", { name: /gdpr/i }).waitFor({ timeout: 10_000 });

    const headers = ["Request ID", "Type", "Status", "Submitted", "Fulfilled At"];
    for (const h of headers) {
      await expect(
        page.getByRole("columnheader", { name: h }).or(page.getByText(h))
      ).toBeVisible();
    }
  });

  test("05 · if requests exist: rows show truncated IDs and formatted types", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/gdpr");
    await page.getByRole("heading", { name: /gdpr/i }).waitFor({ timeout: 10_000 });

    const rows = page.locator("tbody tr");
    const rowCount = await rows.count().catch(() => 0);

    if (rowCount > 0) {
      // Truncated ID: 8 hex chars followed by ellipsis
      const firstRowText = await rows.first().textContent();
      expect(firstRowText).toBeDefined();
      // IDs are truncated to 8 chars + "..."
      expect(firstRowText).toMatch(/[a-f0-9]{8}\u2026|[a-f0-9]{8}\.\.\./i);
    } else {
      // No data is acceptable — check empty state instead
      await expect(page.getByText(/no requests/i)).toBeVisible();
    }
  });

  test("06 · 'Fulfil' button only on pending rows (or none if no pending)", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/gdpr");
    await page.getByRole("heading", { name: /gdpr/i }).waitFor({ timeout: 10_000 });

    const fulfilButtons = page.getByRole("button", { name: /fulfil/i });
    const buttonCount = await fulfilButtons.count().catch(() => 0);

    if (buttonCount > 0) {
      // Each Fulfil button should be in a row with "Pending" status
      for (let i = 0; i < buttonCount; i++) {
        const row = fulfilButtons.nth(i).locator("ancestor::tr").first()
          .or(fulfilButtons.nth(i).locator("..").locator(".."));
        const rowText = await row.textContent().catch(() => "");
        expect(rowText?.toLowerCase()).toContain("pending");
      }
    }
    // No fulfil buttons is acceptable (no pending requests)
  });

  test("07 · empty filter result shows 'No requests match the selected filter.'", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/gdpr");
    await page.getByRole("heading", { name: /gdpr/i }).waitFor({ timeout: 10_000 });

    // Select "Failed" filter — least likely to have entries
    const filter = page.getByRole("combobox").or(page.locator("select"));
    const filterExists = await filter.isVisible().catch(() => false);

    if (filterExists) {
      await filter.selectOption({ label: "Failed" }).catch(async () => {
        // If it's a custom combobox, click and select
        await filter.click();
        await page.getByText("Failed").click().catch(() => false);
      });

      // Either rows or empty state should appear
      const emptyState = page.getByText("No requests match the selected filter.");
      const rows = page.locator("tbody tr");
      const hasRows = await rows.count().catch(() => 0);

      if (hasRows === 0) {
        await expect(emptyState).toBeVisible();
      }
    }
  });

  test("08 · StatusBadge renders for each request", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/gdpr");
    await page.getByRole("heading", { name: /gdpr/i }).waitFor({ timeout: 10_000 });

    const rows = page.locator("tbody tr");
    const rowCount = await rows.count().catch(() => 0);

    if (rowCount > 0) {
      // Each row should contain a status badge with valid status text
      const validStatuses = ["pending", "in progress", "fulfilled", "failed"];
      for (let i = 0; i < Math.min(rowCount, 5); i++) {
        const rowText = await rows.nth(i).textContent();
        const hasStatus = validStatuses.some((s) =>
          rowText?.toLowerCase().includes(s)
        );
        expect(hasStatus).toBe(true);
      }
    }
  });
});
