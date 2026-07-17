import { expect, test } from "@playwright/test";
import {
  assertEvidencePage,
  assertNoSensitiveVouchData,
  captureVouchEvidence,
  fixture,
} from "./fixtures/vouch-referral-proof";

test.describe("vouch gate evidence", () => {
  test.describe("empty provider", () => {
    test.use({ storageState: "e2e/.auth/vouch-gate-empty.json" });

    test("shows 0/6 progress before business widgets", async ({ page }, testInfo) => {
      await assertEvidencePage(page, "/dashboard/provider");
      await expect(page.getByText(/0\s*of\s*6|0\s*\/\s*6/i).first()).toBeVisible();
      await expect(page.getByText(/3 peer/i).first()).toBeVisible();
      await expect(page.getByText(/3 client/i).first()).toBeVisible();
      await captureVouchEvidence(page, testInfo, "dashboard-gate-empty", "gate_empty");
    });

    test("blocks jobs but leaves billing and referrals available", async ({ page }, testInfo) => {
      await page.goto("/dashboard/provider/jobs", { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/dashboard\/provider\/verification/);
      await captureVouchEvidence(page, testInfo, "blocked-provider-business-route", "gate_empty");

      await assertEvidencePage(page, "/dashboard/provider/billing");
      await captureVouchEvidence(page, testInfo, "billing-exemption", "gate_empty");
      await assertEvidencePage(page, "/dashboard/provider/referrals");
      await captureVouchEvidence(page, testInfo, "referral-exemption", "gate_empty");
    });
  });

  test.describe("nearly complete provider", () => {
    test.use({ storageState: "e2e/.auth/vouch-gate-3-plus-2.json" });

    test("shows the remaining client slot and all share channels", async ({ page }, testInfo) => {
      await assertEvidencePage(page, "/dashboard/provider");
      await expect(page.getByText(/5\s*of\s*6|5\s*\/\s*6/i).first()).toBeVisible();
      await captureVouchEvidence(page, testInfo, "dashboard-gate-3-plus-2", "gate_3_plus_2");

      await page.getByRole("button", { name: /ask|invite|request.*vouch/i }).first().click();
      await expect(page.getByRole("link", { name: /whatsapp/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /sms|text message/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /email/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /copy/i })).toBeVisible();
      await captureVouchEvidence(page, testInfo, "vouch-composer", "gate_3_plus_2");
    });
  });

  test.describe("complete provider", () => {
    test.use({ storageState: "e2e/.auth/vouch-gate-complete.json" });

    test("shows completed 3+3 trust state", async ({ page }, testInfo) => {
      await assertEvidencePage(page, "/dashboard/provider");
      await expect(page.getByText(/3 peer/i).first()).toBeVisible();
      await expect(page.getByText(/3 client/i).first()).toBeVisible();
      await expect(page.getByText(/complete|vouched/i).first()).toBeVisible();
      await captureVouchEvidence(page, testInfo, "dashboard-gate-complete", "gate_complete");
    });

    test("shows every referral stage and rolling cap usage", async ({ page }, testInfo) => {
      await assertEvidencePage(page, "/dashboard/provider/referrals");
      for (const stage of ["Invited", "Signed up", "Gate complete", "Converted", "Credited"]) {
        await expect(page.getByText(stage, { exact: false }).first()).toBeVisible();
      }
      await expect(page.getByText(/12\s*month|12\s*\/\s*12|cap/i).first()).toBeVisible();
      await expect(page.getByText(/ambassador/i).first()).toBeVisible();
      await captureVouchEvidence(page, testInfo, "referral-all-states", "referral_all_states");
    });
  });

  test.describe("grandfathered provider", () => {
    test.use({ storageState: "e2e/.auth/vouch-grandfathered.json" });

    test("is unlocked without claiming a public 3+3 card", async ({ page }, testInfo) => {
      await assertEvidencePage(page, "/dashboard/provider/jobs");
      await expect(page).not.toHaveURL(/\/verification/);
      await captureVouchEvidence(page, testInfo, "grandfathered-unlocked", "grandfathered");

      const publicResponse = await page.request.get(`/vouched/${fixture("grandfathered").slug}`);
      expect(publicResponse.status()).toBe(404);
    });
  });
});

test.describe("token-bound vouching", () => {
  test("renders client signup-lite consent without leaking private data", async ({ page }, testInfo) => {
    await assertEvidencePage(page, `/vouch/${fixture("valid_client_token").token}`);
    await expect(page.getByText(/client|customer/i).first()).toBeVisible();
    await expect(page.getByRole("checkbox", { name: /consent|public|display/i })).toBeVisible();
    await assertNoSensitiveVouchData(page);
    await captureVouchEvidence(page, testInfo, "client-signup-lite-consent", "valid_client_token");
  });

  test("requires peer authentication", async ({ page }, testInfo) => {
    await assertEvidencePage(page, `/vouch/${fixture("valid_peer_token").token}`);
    await expect(page.getByRole("link", { name: /sign in|log in/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /register|create account/i })).toBeVisible();
    await captureVouchEvidence(page, testInfo, "peer-auth-required", "valid_peer_token");
  });

  test("renders explicit invalid and expired states", async ({ page }, testInfo) => {
    await assertEvidencePage(page, `/vouch/${fixture("invalid_token").token}`);
    await expect(page.getByText(/invalid|not found/i).first()).toBeVisible();
    await captureVouchEvidence(page, testInfo, "invalid-token", "invalid_token");

    await assertEvidencePage(page, `/vouch/${fixture("expired_token").token}`);
    await expect(page.getByText(/expired/i).first()).toBeVisible();
    await captureVouchEvidence(page, testInfo, "expired-token", "expired_token");
  });
});

test("public vouched card is consent-safe", async ({ page }, testInfo) => {
  await assertEvidencePage(page, `/vouched/${fixture("gate_complete").slug}`);
  const card = page.locator("main");
  await expect(card.getByRole("heading", { name: /vouched|verified/i }).first()).toBeVisible();
  await expect(card).toContainText(/(?:3|three)\s+(?:trade\s+)?peer|peer[^\n]{0,20}(?:3|three)/i);
  await expect(card).toContainText(/(?:3|three)\s+client|client[^\n]{0,20}(?:3|three)/i);
  await assertNoSensitiveVouchData(page);
  await captureVouchEvidence(page, testInfo, "public-vouched-card", "gate_complete");
});
