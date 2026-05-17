import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const SCREENSHOT_DIR = "test-results/phase-b-link-render";
const INTERNAL_LITERAL_HREF_RE = /\bhref:\s*["'`]([^"'`]+)["'`]/g;

const PROTECTED_PATH_PREFIXES = [
  "/admin",
  "/api",
  "/dashboard",
  "/inbox",
  "/notifications",
  "/profile",
  "/settings",
] as const;

function screenshotName(href: string): string {
  return href
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function capture(page: Page, href: string): Promise<void> {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${screenshotName(href)}.png`,
    fullPage: true,
  });
}

async function collectPublicConfiguredHrefs(): Promise<string[]> {
  const source = await readFile(
    join(process.cwd(), "src/config/navigation.ts"),
    "utf8",
  );
  const hrefs = Array.from(source.matchAll(INTERNAL_LITERAL_HREF_RE))
    .map((match) => match[1])
    .filter((href) => href.startsWith("/") && !href.startsWith("//"))
    .filter((href) => !href.includes("["));

  return [...new Set(hrefs)].filter((href) => {
    const path = new URL(href, "https://britestate.test").pathname;

    return !PROTECTED_PATH_PREFIXES.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`),
    );
  });
}

test.describe("configured public navigation render", () => {
  test("public configured destinations render non-error pages with screenshots", async ({
    page,
  }) => {
    test.setTimeout(180_000);

    const hrefs = await collectPublicConfiguredHrefs();

    expect(hrefs.length).toBeGreaterThan(0);

    for (const href of hrefs) {
      const response = await page.goto(href, { waitUntil: "domcontentloaded" });

      expect(response?.status(), `${href} returned an error status`).toBeLessThan(400);
      await page.waitForLoadState("load", { timeout: 10_000 }).catch(() => undefined);
      await capture(page, href);
      expect(new URL(page.url()).pathname, `${href} should not redirect to login`).not.toBe("/login");
      await expect(page.locator("body"), `${href} should not render an app error`).not.toContainText(
        /Page not found|This page could not be found|Application error/i,
      );
      await expect(
        page.getByRole("heading").first(),
        `${href} should render a visible heading`,
      ).toBeVisible();
    }
  });
});
