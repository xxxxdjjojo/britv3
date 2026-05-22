// e2e/admin-sdr.spec.ts
//
// MEMO PIVOT v2 — admin can enqueue and view SDR campaigns.

import { test, expect } from "./fixtures/auth";

test.use({ role: "admin" });

test.describe("Admin SDR campaign dashboard", () => {
  test("admin SDR page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/admin/sdr");
    await expect(
      page.getByRole("heading", { name: /sdr|outbound|campaign/i }),
    ).toBeVisible();
  });

  test("page exposes a queue summary (total / queued / sent)", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/admin/sdr");
    await expect(page.getByText(/queued/i).first()).toBeVisible();
    await expect(page.getByText(/sent/i).first()).toBeVisible();
  });

  test("admin can enqueue a new outbound batch", async ({
    authenticatedPage: page,
  }) => {
    const post = page.waitForRequest(
      (req) => req.url().includes("/api/admin/sdr") && req.method() === "POST",
    );
    await page.goto("/admin/sdr");
    await page
      .getByRole("button", { name: /enqueue|start batch|create campaign/i })
      .first()
      .click();
    const req = await post;
    expect(req.method()).toBe("POST");
  });
});

test.describe("SDR auth", () => {
  test("non-admin gets 403 on /api/admin/sdr", async ({ page }) => {
    const res = await page.request.post("/api/admin/sdr", {
      data: { audience: "trade" },
    });
    expect([401, 403]).toContain(res.status());
  });
});
