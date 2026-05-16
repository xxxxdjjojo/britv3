import { mkdir } from "node:fs/promises";
import { test, expect, type Page } from "./fixtures/auth";

const SCREENSHOT_DIR = "test-results/dashboard-nav";

async function capture(page: Page, name: string): Promise<void> {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${name}.png`,
    fullPage: true,
  });
}

async function expectNoAppError(page: Page): Promise<void> {
  await expect(page.locator("body")).not.toContainText(
    /Page not found|This page could not be found|Application error/i,
  );
}

test.describe("authenticated dashboard navigation", () => {
  test.use({ role: "homebuyer" });

  test("homebuyer desktop dashboard sidebar links render and route", async ({
    authenticatedPage,
  }) => {
    test.skip(
      test.info().project.name === "mobile",
      "Desktop sidebar is hidden on the mobile project.",
    );

    await authenticatedPage.goto("/dashboard/homebuyer");
    await authenticatedPage.waitForLoadState("networkidle");

    const nav = authenticatedPage.getByRole("navigation", {
      name: /dashboard navigation/i,
    });
    await expect(nav).toBeVisible();
    await capture(authenticatedPage, "homebuyer-desktop-sidebar");

    const savedLink = nav.getByRole("link", { name: /saved properties/i });
    await expect(savedLink).toHaveAttribute("href", "/dashboard/homebuyer/saved");
    await savedLink.click();
    await expect(authenticatedPage).toHaveURL(/\/dashboard\/homebuyer\/saved$/);
    await expectNoAppError(authenticatedPage);
  });

  test("homebuyer mobile bottom tabs render and route", async ({
    authenticatedPage,
  }) => {
    test.skip(
      test.info().project.name !== "mobile",
      "Bottom tabs are mobile-only.",
    );

    await authenticatedPage.goto("/dashboard/homebuyer");
    await authenticatedPage.waitForLoadState("networkidle");
    await capture(authenticatedPage, "homebuyer-mobile-tabs");

    const savedTab = authenticatedPage.getByRole("link", { name: /^saved$/i });
    await expect(savedTab).toHaveAttribute("href", "/dashboard/homebuyer/saved");
    await savedTab.click();
    await expect(authenticatedPage).toHaveURL(/\/dashboard\/homebuyer\/saved$/);
    await expectNoAppError(authenticatedPage);
  });

  test("public mobile drawer Saved quick link routes to role-specific saved page", async ({
    authenticatedPage,
  }) => {
    test.skip(
      test.info().project.name !== "mobile",
      "Public drawer quick links are validated on the mobile project.",
    );

    await authenticatedPage.goto("/");
    await authenticatedPage.getByLabel(/open menu/i).click();

    const drawer = authenticatedPage.getByRole("dialog");
    const savedLink = drawer.getByRole("link", { name: /^saved$/i });
    await expect(savedLink).toHaveAttribute("href", "/dashboard/homebuyer/saved");
    await capture(authenticatedPage, "homebuyer-mobile-drawer-before");

    await savedLink.click();
    await expect(authenticatedPage).toHaveURL(/\/dashboard\/homebuyer\/saved$/);
    await expectNoAppError(authenticatedPage);
    await capture(authenticatedPage, "homebuyer-mobile-saved-after");
  });
});
