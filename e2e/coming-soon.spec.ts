// e2e/coming-soon.spec.ts
//
// Public "coming soon" waitlist splash + referral queue page smoke tests.
// Role-based, resilient selectors only — no auth required (public surfaces).

import { test, expect } from "@playwright/test";
import { REWARD_TIERS } from "../src/lib/coming-soon/config";

test.describe("coming-soon splash", () => {
  test("renders the hero, waitlist form, and logo home link", async ({
    page,
  }) => {
    await page.goto("/coming-soon");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("textbox").first()).toBeVisible();
    await expect(page.getByRole("button").first()).toBeVisible();
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
    await expect(
      page.getByText(
        /AI-powered property intelligence\. Verified professionals\. End-to-end moves\./i,
      ),
    ).toBeVisible();
  });
});

test.describe("referral queue", () => {
  test("renders reward tiers, a copy button, and the logo home link", async ({
    page,
  }) => {
    await page.goto("/queue?ref=TESTCODE");

    for (const tier of REWARD_TIERS) {
      await expect(page.getByText(tier.label)).toBeVisible();
    }

    await expect(page.getByRole("button", { name: /copy/i }).first()).toBeVisible();
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
  });
});
