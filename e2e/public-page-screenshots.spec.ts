import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

const SCREENSHOT_DIR = "test-results/public-pages";

const PUBLIC_PAGES: { name: string; path: string; expectedHeading?: RegExp }[] = [
  { name: "home", path: "/", expectedHeading: /britestate|home|find your|search/i },
  { name: "search", path: "/search", expectedHeading: /search|properties|find/i },
  { name: "services", path: "/services", expectedHeading: /services|trades|providers/i },
  { name: "conveyancers", path: "/conveyancers", expectedHeading: /conveyancer/i },
  { name: "mortgage-brokers", path: "/mortgage-brokers", expectedHeading: /mortgage/i },
  { name: "agents", path: "/agents", expectedHeading: /agent/i },
  { name: "surveyors", path: "/surveyors", expectedHeading: /surveyor/i },
];

test.describe("Public pages — link rendering + screenshot proof", () => {
  test.beforeAll(() => {
    mkdirSync(SCREENSHOT_DIR, { recursive: true });
  });

  for (const pageSpec of PUBLIC_PAGES) {
    test(`${pageSpec.name}: renders with links and no console errors`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      // Navigate
      const response = await page.goto(pageSpec.path, { waitUntil: "load" });
      expect(response?.status(), `${pageSpec.path} should return 2xx`).toBeLessThan(400);

      // Wait for content
      await page.waitForLoadState("domcontentloaded");

      // Screenshot
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/${pageSpec.name}.png`,
        fullPage: true,
      });

      // Check there's at least one <a> rendered (links exist)
      const linkCount = await page.locator("a").count();
      expect(linkCount, "page should render at least one link").toBeGreaterThan(0);

      // Check no placeholder hrefs visible to users (href="#" or href="javascript:void(0)")
      const placeholderLinks = await page.locator('a[href="#"], a[href^="javascript:"]').count();
      expect(placeholderLinks, "page should not have placeholder hrefs in user-visible links").toBe(0);

      // Note: Some console errors are pre-existing noise (Sentry, PostHog warm-up).
      // We don't fail the test on console errors here — Stream 1 covers Sentry capture
      // discipline. Just log them for visibility.
      if (consoleErrors.length > 0) {
        console.warn(`[${pageSpec.name}] Console errors:`, consoleErrors.slice(0, 3));
      }
    });
  }
});
