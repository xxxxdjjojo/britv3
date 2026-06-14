import { test, expect, type Page, type TestInfo } from "@playwright/test";
import {
  PUBLIC_LINK_RENDER_ROUTES,
  PROTECTED_LINK_RENDER_ROUTES,
  type LinkRenderRoute,
} from "./fixtures/link-render-routes";

const APP_ERROR_RE =
  /Page not found|This page could not be found|Application error/i;

function screenshotName(route: LinkRenderRoute): string {
  return `${route.group}-${route.label}-${route.path}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

async function capture(page: Page, route: LinkRenderRoute, testInfo: TestInfo) {
  const path = testInfo.outputPath(`${screenshotName(route)}.png`);
  await page.screenshot({ path, fullPage: true });
  await testInfo.attach(`${route.group}: ${route.label}`, {
    path,
    contentType: "image/png",
  });
}

test.describe("checklist-derived public routes render", () => {
  for (const route of PUBLIC_LINK_RENDER_ROUTES) {
    test(`${route.group}: ${route.label} renders ${route.path}`, async ({
      page,
    }, testInfo) => {
      const response = await page.goto(route.path, {
        waitUntil: "domcontentloaded",
      });

      expect(
        response?.status(),
        `${route.label} (${route.path}) returned an error status`,
      ).toBeLessThan(400);

      await page.waitForLoadState("load", { timeout: 10_000 }).catch(() => undefined);
      await capture(page, route, testInfo);
      await expect(page.locator("body")).not.toContainText(APP_ERROR_RE);

      if (!route.allowLoginPath) {
        expect(
          new URL(page.url()).pathname,
          `${route.label} should not fall through to login`,
        ).not.toBe("/login");
      }

      await expect(
        page.getByRole("heading").first(),
        `${route.label} should render a visible heading`,
      ).toBeVisible();
    });
  }
});

test.describe("protected routes redirect to a rendered login surface", () => {
  for (const route of PROTECTED_LINK_RENDER_ROUTES) {
    test(`${route.group}: ${route.label} redirects from ${route.path}`, async ({
      page,
    }, testInfo) => {
      const response = await page.goto(route.path, {
        waitUntil: "domcontentloaded",
      });

      expect(
        response?.status(),
        `${route.label} (${route.path}) should render a login redirect target`,
      ).toBeLessThan(400);

      await page.waitForLoadState("load", { timeout: 10_000 }).catch(() => undefined);
      await capture(page, route, testInfo);

      const currentUrl = new URL(page.url());
      expect(currentUrl.pathname, `${route.label} should redirect to login`).toBe(
        "/login",
      );
      expect(
        currentUrl.searchParams.get("redirectTo"),
        `${route.label} should preserve the original target`,
      ).toBe(new URL(route.path, "https://britestate.test").pathname);
      await expect(page.locator("body")).not.toContainText(APP_ERROR_RE);
      await expect(
        page.getByRole("heading").first(),
        `${route.label} login redirect should render a visible heading`,
      ).toBeVisible();
    });
  }
});
