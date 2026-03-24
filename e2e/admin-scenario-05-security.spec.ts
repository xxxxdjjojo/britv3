/**
 * Scenario 05 — Security: 3-Layer Auth & Privilege Escalation
 *
 * Validates that admin routes are protected at three layers:
 * 1. Unauthenticated users are redirected to /login
 * 2. Non-admin users cannot access admin content
 * 3. Admin users can access admin content
 * 4. API endpoints return 401 for unauthenticated requests
 */
import { test as base, expect as baseExpect } from "@playwright/test";
import { test, expect } from "./fixtures/auth";

/* ------------------------------------------------------------------ */
/*  Layer 1 — Unauthenticated Access                                  */
/* ------------------------------------------------------------------ */
base.describe("Security — Unauthenticated Access", () => {
  base("unauthenticated → /admin redirects to /login", async ({ page }) => {
    await page.goto("/admin", { timeout: 10_000 });
    await page.waitForURL(/\/login/, { timeout: 10_000 }).catch(() => false);
    expect(page.url()).toContain("/login");
  });

  base("unauthenticated → /admin/users redirects to /login", async ({ page }) => {
    await page.goto("/admin/users", { timeout: 10_000 });
    await page.waitForURL(/\/login/, { timeout: 10_000 }).catch(() => false);
    expect(page.url()).toContain("/login");
  });

  base("unauthenticated → /admin/moderation redirects to /login", async ({ page }) => {
    await page.goto("/admin/moderation", { timeout: 10_000 });
    await page.waitForURL(/\/login/, { timeout: 10_000 }).catch(() => false);
    expect(page.url()).toContain("/login");
  });
});

/* ------------------------------------------------------------------ */
/*  Layer 2 — Non-Admin Access (privilege escalation guard)           */
/* ------------------------------------------------------------------ */
test.describe("Security — Non-Admin Access", () => {
  test.use({ role: "homebuyer" });

  test("non-admin → /admin redirects away from admin dashboard", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin", { timeout: 10_000 });
    // Should either redirect or not show admin dashboard content
    const hasAdminDashboard = await authenticatedPage
      .getByRole("heading", { name: /admin dashboard/i })
      .isVisible()
      .catch(() => false);
    expect(hasAdminDashboard).toBe(false);
  });

  test("non-admin → /admin/users should not render admin content", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin/users", { timeout: 10_000 });
    // Should redirect away or show access denied — admin user management should not render
    const hasUserManagement = await authenticatedPage
      .getByRole("heading", { name: /user management|users/i })
      .isVisible()
      .catch(() => false);

    // Either redirected (URL no longer /admin/users) or content not shown
    const isStillOnAdminUsers = authenticatedPage.url().includes("/admin/users");
    expect(hasUserManagement && isStillOnAdminUsers).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  Layer 3 — Admin Access (authorized)                               */
/* ------------------------------------------------------------------ */
test.describe("Security — Admin Access", () => {
  test.use({ role: "admin" });

  test("admin → /admin loads successfully with Admin Dashboard", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin", { timeout: 10_000 });
    const heading = authenticatedPage.getByRole("heading", { name: /admin dashboard/i });
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("admin → sidebar navigation visible with admin sections", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin", { timeout: 10_000 });
    await expect(authenticatedPage.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });

    // Sidebar should contain key admin navigation items
    const sidebar = authenticatedPage.locator("nav, aside, [role='navigation']").first();
    const hasSidebar = await sidebar.isVisible().catch(() => false);

    if (hasSidebar) {
      const sidebarText = await sidebar.textContent().catch(() => "");
      // At least one admin section should be visible in navigation
      const hasAdminSection =
        /users|moderation|verif|review|feature|system|audit|cms/i.test(sidebarText ?? "");
      expect(hasAdminSection).toBe(true);
    } else {
      // Navigation might be rendered differently — check for admin links anywhere
      const adminLinks = authenticatedPage.getByRole("link", { name: /users|moderation|verif/i });
      const linkCount = await adminLinks.count().catch(() => 0);
      expect(linkCount).toBeGreaterThan(0);
    }
  });
});

/* ------------------------------------------------------------------ */
/*  Layer 4 — API Guards (unauthenticated)                            */
/* ------------------------------------------------------------------ */
base.describe("Security — API Guards", () => {
  base("POST /api/admin/users/fake-id/suspend returns 401", async ({ request }) => {
    const response = await request.post("/api/admin/users/fake-id/suspend");
    expect(response.status()).toBe(401);
  });

  base("POST /api/admin/listings/fake-id/approve returns 401", async ({ request }) => {
    const response = await request.post("/api/admin/listings/fake-id/approve");
    expect(response.status()).toBe(401);
  });

  base("POST /api/admin/roles/fake-id/promote returns 401", async ({ request }) => {
    const response = await request.post("/api/admin/roles/fake-id/promote");
    expect(response.status()).toBe(401);
  });
});
