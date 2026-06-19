import { mkdir } from "node:fs/promises";
import { ROLE_NAV_ITEMS, TAB_CONFIG } from "../src/config/navigation";
import { dashboardPathForRole, savedDashboardPathForRole } from "../src/lib/routes";
import type { UserRole as AppRole } from "../src/types/auth";
import type { Page } from "@playwright/test";
import { test, expect, type UserRole as AuthRole } from "./fixtures/auth";

const SCREENSHOT_DIR = "test-results/dashboard-nav";

type DashboardCase = Readonly<{
  appRole: AppRole;
  authRole: AuthRole;
  basePath: string;
  slug: string;
}>;

const DASHBOARD_CASES: DashboardCase[] = [
  {
    appRole: "homebuyer",
    authRole: "homebuyer",
    basePath: dashboardPathForRole("homebuyer"),
    slug: "homebuyer",
  },
  {
    appRole: "renter",
    authRole: "renter",
    basePath: dashboardPathForRole("renter"),
    slug: "renter",
  },
  {
    appRole: "seller",
    authRole: "seller",
    basePath: dashboardPathForRole("seller"),
    slug: "seller",
  },
  {
    appRole: "landlord",
    authRole: "landlord",
    basePath: dashboardPathForRole("landlord"),
    slug: "landlord",
  },
  {
    appRole: "agent",
    authRole: "agent",
    basePath: dashboardPathForRole("agent"),
    slug: "agent",
  },
  {
    appRole: "service_provider",
    authRole: "provider",
    basePath: dashboardPathForRole("service_provider"),
    slug: "provider",
  },
  {
    appRole: "mortgage_broker",
    authRole: "mortgage_broker",
    basePath: dashboardPathForRole("mortgage_broker"),
    slug: "mortgage-broker",
  },
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function capture(page: Page, name: string): Promise<void> {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${name}.png`,
    fullPage: true,
  });
}

async function expectNoAppError(page: Page): Promise<void> {
  await expect(page.locator("body")).not.toContainText(
    /Page not found|This page could not be found|Application error|Something went wrong/i,
  );
}

async function expectDashboardDestinationToRender(
  page: Page,
  href: string,
  screenshotName: string,
): Promise<void> {
  const response = await page.goto(href, { waitUntil: "domcontentloaded" });
  expect(response?.status(), `${href} returned an error status`).toBeLessThan(400);
  await page.waitForLoadState("load", { timeout: 10_000 }).catch(() => undefined);
  await expectNoAppError(page);
  await expect(page.getByRole("heading").first()).toBeVisible();
  await capture(page, screenshotName);
}

for (const roleCase of DASHBOARD_CASES) {
  test.describe(`${roleCase.slug} dashboard navigation`, () => {
    test.use({ role: roleCase.authRole });

    test("desktop dashboard sidebar renders configured links", async ({
      authenticatedPage,
    }) => {
      test.skip(
        test.info().project.name === "mobile",
        "Desktop sidebar is hidden on the mobile project.",
      );

      await authenticatedPage.goto(roleCase.basePath);
      await authenticatedPage.waitForLoadState("networkidle");

      const nav = authenticatedPage.getByRole("navigation", {
        name: /dashboard navigation/i,
      });
      await expect(nav).toBeVisible();
      await capture(authenticatedPage, `${roleCase.slug}-desktop-sidebar`);

      for (const item of ROLE_NAV_ITEMS[roleCase.appRole]) {
        const link = nav
          .getByRole("link", {
            name: new RegExp(`^${escapeRegExp(item.label)}$`, "i"),
          })
          .first();

        await expect(link, `${roleCase.slug} should render ${item.label}`).toHaveAttribute(
          "href",
          item.href,
        );
      }

      await expectNoAppError(authenticatedPage);

      for (const item of ROLE_NAV_ITEMS[roleCase.appRole]) {
        await expectDashboardDestinationToRender(
          authenticatedPage,
          item.href,
          `${roleCase.slug}-desktop-${item.label}`,
        );
      }
    });

    test("mobile bottom tabs render configured links", async ({
      authenticatedPage,
    }) => {
      test.skip(
        test.info().project.name !== "mobile",
        "Bottom tabs are mobile-only.",
      );

      await authenticatedPage.goto(roleCase.basePath);
      await authenticatedPage.waitForLoadState("networkidle");
      await capture(authenticatedPage, `${roleCase.slug}-mobile-tabs`);

      for (const tab of TAB_CONFIG[roleCase.appRole]) {
        const link = authenticatedPage
          .getByRole("link", {
            name: new RegExp(`^${escapeRegExp(tab.label)}$`, "i"),
          })
          .first();

        await expect(link, `${roleCase.slug} should render ${tab.label}`).toHaveAttribute(
          "href",
          tab.href,
        );
      }

      await expectNoAppError(authenticatedPage);

      for (const tab of TAB_CONFIG[roleCase.appRole]) {
        await expectDashboardDestinationToRender(
          authenticatedPage,
          tab.href,
          `${roleCase.slug}-mobile-${tab.label}`,
        );
      }
    });

    test("authenticated mobile drawer Saved quick link routes to role-specific saved page", async ({
      authenticatedPage,
    }) => {
      test.skip(
        test.info().project.name !== "mobile",
        "Public drawer quick links are validated on the mobile project.",
      );

      const expectedHref = savedDashboardPathForRole(roleCase.appRole);
      const expectedFinalPath =
        expectedHref === "/dashboard" ? roleCase.basePath : expectedHref;

      await authenticatedPage.goto("/");
      await authenticatedPage.getByLabel(/open menu/i).click();

      const drawer = authenticatedPage.getByRole("dialog");
      const savedLink = drawer.getByRole("link", { name: /^saved$/i });
      await expect(savedLink).toHaveAttribute("href", expectedHref);
      await capture(authenticatedPage, `${roleCase.slug}-mobile-drawer-before`);

      await savedLink.click();
      await expect(authenticatedPage).toHaveURL(
        new RegExp(`${escapeRegExp(expectedFinalPath)}$`),
      );
      await expectNoAppError(authenticatedPage);
      await capture(authenticatedPage, `${roleCase.slug}-mobile-saved-after`);
    });
  });
}
