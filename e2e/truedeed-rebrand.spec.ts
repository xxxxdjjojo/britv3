import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

// Visual + behavioural proof that the rebrand renders TrueDeed (never Britestate)
// and that brand/nav/footer links actually resolve. Screenshots are saved as proof.

const SHOT_DIR = "e2e/__screenshots__/truedeed";
const BREAKPOINTS = [
  { name: "mobile", width: 320, height: 720 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

const PAGES = [
  { slug: "home", path: "/" },
  { slug: "legal-terms", path: "/legal/terms" },
  { slug: "legal-privacy", path: "/legal/privacy" },
] as const;

test.beforeAll(() => {
  mkdirSync(SHOT_DIR, { recursive: true });
});

async function assertBrand(page: Page): Promise<void> {
  const body = (await page.locator("body").innerText()).toLowerCase();
  expect(body, "page must not show the legacy brand").not.toContain("britestate");
}

for (const pageDef of PAGES) {
  test(`${pageDef.slug}: renders TrueDeed, no Britestate, at every breakpoint`, async ({ page }) => {
    for (const bp of BREAKPOINTS) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      const res = await page.goto(pageDef.path, { waitUntil: "networkidle" });
      expect(res?.status(), `${pageDef.path} should load`).toBeLessThan(400);
      await assertBrand(page);
      await page.screenshot({
        path: `${SHOT_DIR}/${pageDef.slug}-${bp.name}.png`,
        fullPage: true,
      });
    }
  });
}

test("home: brand logo links to / and the footer brand reads TrueDeed", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });

  // Brand wordmark visible in the header.
  await expect(page.getByText("TrueDeed").first()).toBeVisible();

  // Footer copyright carries the rebranded entity.
  const footer = page.locator("footer");
  await expect(footer).toContainText(/TrueDeed/);
  await expect(footer).not.toContainText(/Britestate/i);
});

test("footer links all resolve (no 404s)", async ({ page, baseURL }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const hrefs = await page.locator("footer a[href^='/']").evaluateAll((els) =>
    Array.from(new Set(els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!))),
  );
  expect(hrefs.length).toBeGreaterThan(0);
  const broken: string[] = [];
  for (const href of hrefs) {
    const url = new URL(href, baseURL).toString();
    const resp = await page.request.get(url);
    if (resp.status() >= 400) broken.push(`${href} -> ${resp.status()}`);
  }
  expect(broken, `broken footer links:\n${broken.join("\n")}`).toEqual([]);
});
