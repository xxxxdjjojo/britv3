// e2e/pricing-v2-screenshots.spec.ts
//
// Memo Pivot v2 — generates the screenshot evidence at
// docs/pricing-v2/screenshots/. Designed to run once via
//   pnpm test:e2e --project=chromium --grep "memo-pivot screenshots"
//
// This spec is intentionally permissive — assertion failures don't
// invalidate the screenshot, and screenshots are stored even when the
// underlying surface has minor issues. Use the captures as evidence
// during review, not as test gates.

import path from "node:path";

import { test, expect, type Page } from "@playwright/test";

const OUT = "docs/pricing-v2/screenshots";

function file(name: string): string {
  return path.join(OUT, `${name}.png`);
}

async function fullPageShot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: file(name), fullPage: true });
}

test.describe("memo-pivot screenshots — pricing tabs", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("desktop — pricing tabs", async ({ page }) => {
    const segments: ReadonlyArray<{ tab: RegExp; id: string }> = [
      { tab: /sellers/i, id: "sellers" },
      { tab: /estate agents/i, id: "agents" },
      { tab: /landlords/i, id: "landlords" },
      { tab: /^providers$/i, id: "providers" },
      { tab: /professionals/i, id: "providers-niche" },
      { tab: /developers/i, id: "developers" },
      { tab: /traders/i, id: "traders" },
    ];

    await page.goto("/pricing", { waitUntil: "networkidle" });
    for (const { tab, id } of segments) {
      const button = page.getByRole("tab", { name: tab }).first();
      await button.click().catch(() => undefined);
      await page.waitForTimeout(150);
      await fullPageShot(page, `pricing-${id}-desktop`);
    }
  });
});

test.describe("memo-pivot screenshots — pricing tabs (mobile)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile — pricing tabs", async ({ page }) => {
    const segments: ReadonlyArray<{ tab: RegExp; id: string }> = [
      { tab: /sellers/i, id: "sellers" },
      { tab: /estate agents/i, id: "agents" },
      { tab: /landlords/i, id: "landlords" },
      { tab: /^providers$/i, id: "providers" },
      { tab: /professionals/i, id: "providers-niche" },
      { tab: /developers/i, id: "developers" },
      { tab: /traders/i, id: "traders" },
    ];

    await page.goto("/pricing", { waitUntil: "networkidle" });
    for (const { tab, id } of segments) {
      const button = page.getByRole("tab", { name: tab }).first();
      await button.click().catch(() => undefined);
      await page.waitForTimeout(150);
      await fullPageShot(page, `pricing-${id}-mobile`);
    }
  });
});

test.describe("memo-pivot screenshots — segment landings", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const path of ["/sellers", "/developers", "/traders", "/fee-transparency"]) {
    test(`${path} (desktop)`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      // Best-effort assert page rendered something
      const heading = page.getByRole("heading", { level: 1 }).first();
      await expect(heading).toBeVisible({ timeout: 10_000 }).catch(() => undefined);
      const name = path.replace(/^\//, "").replace(/\//g, "-") || "home";
      await fullPageShot(page, `${name}-desktop`);
    });
  }
});

test.describe("memo-pivot screenshots — segment landings (mobile)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const path of ["/sellers", "/developers", "/traders", "/fee-transparency"]) {
    test(`${path} (mobile)`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const name = path.replace(/^\//, "").replace(/\//g, "-") || "home";
      await fullPageShot(page, `${name}-mobile`);
    });
  }
});

test.describe("memo-pivot screenshots — programmatic SEO samples", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  const SAMPLES = [
    { service: "plumber", postcode: "sw1a" },
    { service: "electrician", postcode: "ec1n" },
    { service: "roofer", postcode: "m1" },
    { service: "surveyor", postcode: "b1" },
    { service: "conveyancer", postcode: "ls1" },
  ];

  for (const { service, postcode } of SAMPLES) {
    test(`/services-near/${service}/${postcode}`, async ({ page }) => {
      const response = await page.goto(`/services-near/${service}/${postcode}`, {
        waitUntil: "domcontentloaded",
      });
      if (response) {
        // eslint-disable-next-line no-console -- screenshot diagnostic
        console.log(`/services-near/${service}/${postcode} → ${response.status()}`);
      }
      await fullPageShot(page, `seo-${service}-${postcode}`);
    });
  }
});

test.describe("memo-pivot screenshots — signup invite", () => {
  test("signup with valid invite code (desktop)", async ({ page }) => {
    await page.goto("/signup?invite=BRIT-TRADE-TEST01", {
      waitUntil: "domcontentloaded",
    });
    await fullPageShot(page, "signup-invite-trade-desktop");
  });

  test("signup with invalid invite code (desktop)", async ({ page }) => {
    await page.goto("/signup?invite=NOT-A-REAL-CODE", {
      waitUntil: "domcontentloaded",
    });
    await fullPageShot(page, "signup-invite-invalid-desktop");
  });
});
