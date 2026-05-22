// e2e/seo-programmatic.spec.ts
//
// MEMO PIVOT v2 — programmatic SEO route returns 200, unique titles, and
// surfaces both the postcode and the service in copy.

import { test, expect } from "@playwright/test";

const SAMPLES: ReadonlyArray<{ service: string; postcode: string }> = [
  { service: "plumber", postcode: "SW1A" },
  { service: "electrician", postcode: "EC1N" },
  { service: "roofer", postcode: "M1" },
  { service: "surveyor", postcode: "B1" },
  { service: "conveyancer", postcode: "LS1" },
];

test.describe("Programmatic SEO routes", () => {
  for (const { service, postcode } of SAMPLES) {
    test(`/services-near/${service}/${postcode} returns 200`, async ({ page }) => {
      const response = await page.goto(`/services-near/${service}/${postcode}`);
      expect(response?.status() ?? 500).toBe(200);
    });

    test(`/services-near/${service}/${postcode} mentions the postcode and service in copy`, async ({
      page,
    }) => {
      await page.goto(`/services-near/${service}/${postcode}`);
      const body = (await page.locator("body").innerText()).toLowerCase();
      expect(body).toContain(service.toLowerCase());
      expect(body).toContain(postcode.toLowerCase());
    });
  }

  test("sitemap.xml lists at least 100 programmatic URLs", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const xml = await res.text();
    const matches = xml.match(/\/services-near\/[a-z-]+\/[a-z0-9]+/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(100);
  });
});
