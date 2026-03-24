import { test, expect } from "@playwright/test";

test.describe("Admin auth boundary — unauthenticated", () => {
  test("redirects /admin to /login when not authenticated", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /admin/users to /login when not authenticated", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /admin/gdpr to /login when not authenticated", async ({ page }) => {
    await page.goto("/admin/gdpr");
    await expect(page).toHaveURL(/\/login/);
  });

  test("returns 401 for /api/admin/users/test/ban without session", async ({ request }) => {
    const res = await request.post("/api/admin/users/test/ban", {
      data: { reason: "test" },
    });
    expect(res.status()).toBe(401);
  });

  test("returns 401 for /api/admin/team/invite without session", async ({ request }) => {
    const res = await request.post("/api/admin/team/invite", {
      data: { email: "evil@test.com" },
    });
    expect(res.status()).toBe(401);
  });

  test("returns 401 for /api/admin/roles/test/promote without session", async ({ request }) => {
    const res = await request.post("/api/admin/roles/test/promote");
    expect(res.status()).toBe(401);
  });
});

test.describe("Admin auth boundary — non-admin user", () => {
  test.use({ storageState: "e2e/.auth/homebuyer.json" });

  test("redirects /admin to /forbidden for non-admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/forbidden/);
  });

  test("returns 403 for /api/admin/users/test/suspend with non-admin session", async ({ request }) => {
    const res = await request.post("/api/admin/users/test/suspend");
    expect(res.status()).toBe(403);
  });

  test("returns 403 for /api/admin/feature-flags/test/toggle with non-admin session", async ({ request }) => {
    const res = await request.post("/api/admin/feature-flags/test/toggle", {
      data: { enabled: true },
    });
    expect(res.status()).toBe(403);
  });

  test("returns 403 for /api/admin/campaigns with non-admin session", async ({ request }) => {
    const res = await request.post("/api/admin/campaigns", {
      data: { name: "evil", subject: "evil" },
    });
    expect(res.status()).toBe(403);
  });
});

test.describe("Admin dashboard — authenticated admin", () => {
  test.use({ storageState: "e2e/.auth/admin.json" });

  test("admin can access /admin dashboard", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("text=Admin Console")).toBeVisible();
  });

  test("admin sidebar shows navigation groups", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("text=Overview")).toBeVisible();
    await expect(page.locator("text=Moderation")).toBeVisible();
  });

  test("admin can access /admin/users", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/admin\/users/);
  });

  test("admin can access /admin/audit-log", async ({ page }) => {
    await page.goto("/admin/audit-log");
    await expect(page).toHaveURL(/\/admin\/audit-log/);
  });
});
