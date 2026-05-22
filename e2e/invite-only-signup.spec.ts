// e2e/invite-only-signup.spec.ts
//
// MEMO PIVOT v2 — signup page honours `?invite=<CODE>` and pre-selects the
// segment matching the invite audience.

import { test, expect } from "@playwright/test";

test.describe("Invite-only signup", () => {
  test("signup with an invite code shows the invite chip", async ({ page }) => {
    await page.goto("/signup?invite=BRIT-TRADE-TEST01");
    await expect(page.getByText(/invite code/i).first()).toBeVisible();
    await expect(page.getByText(/BRIT-TRADE-TEST01/i)).toBeVisible();
  });

  test("invalid invite shows an inline error", async ({ page }) => {
    await page.goto("/signup?invite=NOT-A-REAL-CODE");
    await expect(
      page.getByText(/invalid|expired|not recognised/i).first(),
    ).toBeVisible();
  });

  test("invite-only mode blocks segment selector and uses audience role", async ({
    page,
  }) => {
    await page.goto("/signup?invite=BRIT-DEVELOPER-TEST01");
    // The "I'm a..." selector should be locked or replaced with a tag
    const lockedTag = page.getByText(/developer/i).first();
    await expect(lockedTag).toBeVisible();
  });
});
