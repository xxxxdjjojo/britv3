// e2e/dashboard-upgrade-links.spec.ts
//
// MEMO PIVOT v2 — every role dashboard exposes upgrade CTAs that link to
// /api/billing/checkout with the right plan id for the role.

import { test, expect } from "./fixtures/auth";

const UPGRADE_CASES: ReadonlyArray<{
  role: "agent" | "landlord" | "provider";
  upgradeTo: string;
}> = [
  { role: "agent", upgradeTo: "agent_pro" },
  { role: "landlord", upgradeTo: "landlord_essential" },
  { role: "provider", upgradeTo: "provider_pro" },
];

for (const { role, upgradeTo } of UPGRADE_CASES) {
  test.describe(`${role} dashboard upgrade link`, () => {
    test.use({ role });

    test(`shows an Upgrade CTA pointing to checkout with planId=${upgradeTo}`, async ({
      authenticatedPage: page,
    }) => {
      await page.goto(`/dashboard/${role}/billing`);
      // Look for an Upgrade button or link
      const upgrade = page
        .getByRole("link", { name: /upgrade|change plan|choose plan/i })
        .or(page.getByRole("button", { name: /upgrade|change plan|choose plan/i }))
        .first();
      await expect(upgrade).toBeVisible();

      const href = await upgrade.getAttribute("href").catch(() => null);
      if (href) {
        // Direct link path: must contain the segment or the target plan id
        expect(href).toMatch(
          new RegExp(`${upgradeTo}|/dashboard/${role}/billing/checkout`, "i"),
        );
      } else {
        // Button path: clicking it should issue a POST to /api/billing/checkout
        const checkoutPromise = page.waitForRequest(
          (req) =>
            req.url().includes("/api/billing/checkout") && req.method() === "POST",
          { timeout: 5_000 },
        );
        await upgrade.click();
        const req = await checkoutPromise;
        const body = req.postData();
        expect(body ?? "").toMatch(new RegExp(upgradeTo, "i"));
      }
    });
  });
}
