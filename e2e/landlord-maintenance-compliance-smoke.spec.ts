import { mkdir } from "node:fs/promises";
import path from "node:path";
import { test, expect } from "./fixtures/auth";
import {
  captureConsoleErrors,
  expectNoAppError,
} from "./fixtures/smoke-helpers";

test.describe.configure({ retries: 2, timeout: 90_000 });
test.use({ role: "landlord" });

const SCREENSHOT_DIR = path.join(
  process.cwd(),
  "test-results",
  "landlord-maintenance-compliance",
);

const LANDLORD_ROUTES = [
  {
    href: "/dashboard/landlord/maintenance",
    heading: "Maintenance Requests",
    screenshot: "01-maintenance-inbox.png",
  },
  {
    href: "/dashboard/landlord/maintenance/new",
    heading: "New Maintenance Request",
    screenshot: "02-maintenance-new.png",
  },
  {
    href: "/dashboard/landlord/compliance",
    heading: "Compliance Dashboard",
    screenshot: "03-compliance-dashboard.png",
  },
  {
    href: "/dashboard/landlord/compliance/matrix",
    heading: "Compliance Matrix",
    screenshot: "04-compliance-matrix.png",
  },
] as const;

test.describe("landlord maintenance and compliance smoke", () => {
  for (const route of LANDLORD_ROUTES) {
    test(`renders ${route.href}`, async ({ authenticatedPage }) => {
      test.skip(
        test.info().project.name === "mobile",
        "Landlord route smoke runs on desktop.",
      );

      const consoleErrors = captureConsoleErrors(authenticatedPage);
      consoleErrors.reset();

      const response = await authenticatedPage.goto(route.href, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status(), `${route.href} returned an error status`).toBeLessThan(400);
      await authenticatedPage
        .waitForLoadState("load", { timeout: 10_000 })
        .catch(() => undefined);

      expect(new URL(authenticatedPage.url()).pathname).toBe(route.href);
      await expectNoAppError(authenticatedPage);
      await expect(
        authenticatedPage.getByRole("heading", { name: route.heading }),
      ).toBeVisible();
      expect(
        consoleErrors.errors,
        `${route.href} logged unexpected console errors:\n${consoleErrors.errors.join("\n")}`,
      ).toEqual([]);

      await mkdir(SCREENSHOT_DIR, { recursive: true });
      await authenticatedPage.screenshot({
        path: path.join(SCREENSHOT_DIR, route.screenshot),
        fullPage: true,
      });
    });
  }
});
