import { test, expect, type Page } from "@playwright/test";
import {
  readLatestOtp,
  deleteUserByEmail,
  findUserByEmail,
  consentPurposesForUser,
  agentLeadCountForUser,
} from "./fixtures/valuation-otp";

/**
 * Full "Value my property" journey E2E (scenarios 2–12 + accessibility).
 * Runs against LOCAL Supabase (OTP minted via admin.generateLink) with property
 * data from the remote DB. See playwright.valuation.config.ts.
 *
 * Gated: skips entirely unless LOCAL_SUPABASE_SERVICE is provided.
 */
const HAS_LOCAL = Boolean(process.env.LOCAL_SUPABASE_SERVICE);
test.skip(!HAS_LOCAL, "Requires LOCAL_SUPABASE_* env (local Supabase) for OTP verification");

let emailCounter = 0;
function uniqueEmail(): string {
  emailCounter += 1;
  return `vmp-e2e-${Date.now()}-${emailCounter}@example.test`;
}

async function chooseAddress(page: Page, postcode: string): Promise<void> {
  await page.goto("/value-my-property/address");
  await page.getByLabel("Postcode").fill(postcode);
  await page.getByRole("button", { name: "Find" }).click();
  // Either real candidates appear, or the manual-entry radio is offered.
  const firstRadio = page.getByRole("radio").first();
  await firstRadio.waitFor({ state: "visible", timeout: 20_000 });
  const radios = page.getByRole("radio");
  const count = await radios.count();
  // Last radio is always "My address isn't listed"; pick the first real one if present.
  if (count > 1) {
    await radios.first().check();
  } else {
    await radios.first().check(); // manual
    await page.getByLabel("Your address").fill("1 Test Street");
  }
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/value-my-property\/details/);
}

async function fillDetails(page: Page, bedrooms = "3"): Promise<void> {
  await page.getByLabel("Bedrooms").fill(bedrooms);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/value-my-property\/review/);
}

async function calculateToReady(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Get my estimate" }).click();
  await expect(page.getByText(/your estimate is ready/i)).toBeVisible({ timeout: 30_000 });
}

async function verifyEmail(page: Page, email: string): Promise<void> {
  await page.getByRole("button", { name: /verify email & view estimate/i }).click();
  await expect(page).toHaveURL(/\/value-my-property\/verify-email/);
  await page.getByLabel("Email address").fill(email);
  const since = Date.now();
  await page.getByRole("button", { name: /send my code/i }).click();
  const code = await readLatestOtp(email, since);
  await page.getByLabel("Digit 1 of 6").click();
  await page.keyboard.type(code);
  await page.getByRole("button", { name: /verify & view my estimate/i }).click();
}

test.describe("Valuation journey", () => {
  test("Scenario 2 — new user completes the journey to a saved result", async ({ page }) => {
    const email = uniqueEmail();
    try {
      await chooseAddress(page, "SW18 4QN");
      await fillDetails(page);
      await calculateToReady(page);
      await verifyEmail(page, email);
      await expect(page).toHaveURL(/\/value-my-property\/result\//, { timeout: 30_000 });
      await expect(page.getByText(/indicative automated estimate/i)).toBeVisible();
      await expect(page.locator("body")).toContainText("£");
    } finally {
      await deleteUserByEmail(email);
    }
  });

  test("Scenario 3 — returning user signs in and gets a new valuation", async ({ page }) => {
    const email = uniqueEmail();
    try {
      // First valuation.
      await chooseAddress(page, "SW18 4QN");
      await fillDetails(page);
      await calculateToReady(page);
      await verifyEmail(page, email);
      await expect(page).toHaveURL(/\/result\//, { timeout: 30_000 });
      const firstUrl = page.url();

      // Second valuation, same email -> signs in, new result.
      await page.context().clearCookies();
      await chooseAddress(page, "SW17 0AA");
      await fillDetails(page, "2");
      await calculateToReady(page);
      await verifyEmail(page, email);
      await expect(page).toHaveURL(/\/result\//, { timeout: 30_000 });
      expect(page.url()).not.toBe(firstUrl);
    } finally {
      await deleteUserByEmail(email);
    }
  });

  test("Scenario 4 — wrong code shows an error, resend + correct code succeeds", async ({ page }) => {
    const email = uniqueEmail();
    try {
      await chooseAddress(page, "SW18 4QN");
      await fillDetails(page);
      await calculateToReady(page);
      await page.getByRole("button", { name: /verify email & view estimate/i }).click();
      await page.getByLabel("Email address").fill(email);
      await page.getByRole("button", { name: /send my code/i }).click();

      await page.getByLabel("Digit 1 of 6").click();
      await page.keyboard.type("000000");
      await page.getByRole("button", { name: /verify & view my estimate/i }).click();
      await expect(page.getByText(/invalid or has expired/i)).toBeVisible();

      // Resend + use a fresh valid code.
      const sinceResend = Date.now();
      await page.getByRole("button", { name: /resend code/i }).click();
      const code = await readLatestOtp(email, sinceResend);
      await page.getByLabel("Digit 1 of 6").click();
      await page.keyboard.type(code);
      await page.getByRole("button", { name: /verify & view my estimate/i }).click();
      await expect(page).toHaveURL(/\/result\//, { timeout: 30_000 });
    } finally {
      await deleteUserByEmail(email);
    }
  });

  test("Scenario 5 — refresh preserves state; back doesn't duplicate", async ({ page }) => {
    await chooseAddress(page, "SW18 4QN");
    await fillDetails(page);
    // Refresh on review keeps the persisted summary.
    await page.reload();
    await expect(page.getByText(/review and calculate/i)).toBeVisible();
    await expect(page.locator("body")).toContainText("SW18 4QN");
    // Back to details then forward — no error.
    await page.goBack();
    await expect(page).toHaveURL(/\/details/);
    await page.goForward();
    await expect(page).toHaveURL(/\/review/);
  });

  test("Scenario 6 — strong comparables show estimate, range, evidence + comps", async ({ page }) => {
    const email = uniqueEmail();
    try {
      await chooseAddress(page, "SW18 4QN");
      await fillDetails(page);
      await calculateToReady(page);
      await verifyEmail(page, email);
      await expect(page).toHaveURL(/\/result\//, { timeout: 30_000 });
      await expect(page.getByText(/estimated range/i).first()).toBeVisible();
      await expect(page.getByText(/evidence:/i)).toBeVisible();
      await expect(page.getByText(/comparable registered sales/i)).toBeVisible();
    } finally {
      await deleteUserByEmail(email);
    }
  });

  test("Scenario 7 — weak/low evidence makes no unsupported accuracy claim", async ({ page }) => {
    const email = uniqueEmail();
    try {
      await chooseAddress(page, "LL57 4AA"); // rural Welsh outward, lower volume
      await fillDetails(page);
      await calculateToReady(page);
      await verifyEmail(page, email);
      await expect(page).toHaveURL(/\/result\//, { timeout: 30_000 });
      // Never claim a guaranteed price or an accuracy percentage.
      await expect(page.locator("body")).not.toContainText(/guaranteed/i);
      await expect(page.locator("body")).not.toContainText(/% accurate/i);
    } finally {
      await deleteUserByEmail(email);
    }
  });

  test("Scenario 8 — no responsible estimate (Scotland) recommends an agent", async ({ page }) => {
    const email = uniqueEmail();
    try {
      await chooseAddress(page, "EH1 1BB"); // Scotland — absent from the data
      await fillDetails(page);
      await calculateToReady(page);
      await verifyEmail(page, email);
      await expect(page).toHaveURL(/\/result\//, { timeout: 30_000 });
      await expect(page.getByText(/can't give a reliable instant estimate/i)).toBeVisible();
      await expect(page.getByRole("link", { name: /local expert valuation/i })).toBeVisible();
    } finally {
      await deleteUserByEmail(email);
    }
  });

  test("Scenario 9 — correcting details stores a new versioned result", async ({ page }) => {
    const email = uniqueEmail();
    try {
      await chooseAddress(page, "SW18 4QN");
      await fillDetails(page, "3");
      await calculateToReady(page);
      await verifyEmail(page, email);
      await expect(page).toHaveURL(/\/result\//, { timeout: 30_000 });
      const firstUrl = page.url();

      await page.getByRole("link", { name: /correct details/i }).click();
      await expect(page).toHaveURL(/\/details/);
      await page.getByLabel("Bedrooms").fill("4");
      await page.getByRole("button", { name: "Continue" }).click();
      await calculateToReady(page);
      // Already authenticated -> the new versioned result is owned immediately,
      // so the ready step links straight to it (no re-verification).
      await page.getByRole("button", { name: /view my estimate/i }).click();
      await expect(page).toHaveURL(/\/result\//, { timeout: 30_000 });
      expect(page.url()).not.toBe(firstUrl);
    } finally {
      await deleteUserByEmail(email);
    }
  });

  test("Scenario 10 — agent handoff records a lead + consent only on explicit submit", async ({ page }) => {
    const email = uniqueEmail();
    try {
      await chooseAddress(page, "SW18 4QN");
      await fillDetails(page);
      await calculateToReady(page);
      await verifyEmail(page, email);
      await expect(page).toHaveURL(/\/result\//, { timeout: 30_000 });

      const user = await findUserByEmail(email);
      expect(user).not.toBeNull();
      expect(await agentLeadCountForUser(user!.id)).toBe(0); // nothing shared yet

      await page.getByRole("link", { name: /local expert valuation/i }).click();
      await expect(page).toHaveURL(/\/expert/);
      // Submit disabled until explicit consent.
      const submit = page.getByRole("button", { name: /request a local expert valuation/i });
      await expect(submit).toBeDisabled();
      await page.getByRole("checkbox").check();
      await submit.click();
      await expect(page.getByText(/request sent/i)).toBeVisible({ timeout: 15_000 });

      expect(await agentLeadCountForUser(user!.id)).toBe(1);
      expect(await consentPurposesForUser(user!.id)).toContain("agent_contact");
    } finally {
      await deleteUserByEmail(email);
    }
  });

  test("Scenario 11 — verification does not create marketing consent", async ({ page }) => {
    const email = uniqueEmail();
    try {
      await chooseAddress(page, "SW18 4QN");
      await fillDetails(page);
      await calculateToReady(page);
      await verifyEmail(page, email);
      await expect(page).toHaveURL(/\/result\//, { timeout: 30_000 });

      const user = await findUserByEmail(email);
      const purposes = await consentPurposesForUser(user!.id);
      expect(purposes.some((p) => p.includes("marketing"))).toBe(false);
    } finally {
      await deleteUserByEmail(email);
    }
  });

  test("Scenario 12 — another (unauthenticated) visitor cannot open a result", async ({ page, browser }) => {
    const email = uniqueEmail();
    try {
      await chooseAddress(page, "SW18 4QN");
      await fillDetails(page);
      await calculateToReady(page);
      await verifyEmail(page, email);
      await expect(page).toHaveURL(/\/result\//, { timeout: 30_000 });
      const resultUrl = page.url();

      // Fresh anonymous context must not see the result — it redirects to verify.
      const anon = await browser.newContext();
      const anonPage = await anon.newPage();
      await anonPage.goto(resultUrl);
      await expect(anonPage).toHaveURL(/verify-email|login/, { timeout: 30_000 });
      await anon.close();
    } finally {
      await deleteUserByEmail(email);
    }
  });

  test("Accessibility — labels, OTP semantics, keyboard, colour-independent evidence", async ({ page }) => {
    const email = uniqueEmail();
    try {
      // Address step: labelled input, keyboard operable.
      await page.goto("/value-my-property/address");
      await expect(page.getByLabel("Postcode")).toBeVisible();
      await expect(page.getByRole("progressbar")).toBeVisible();

      await chooseAddress(page, "SW18 4QN");
      await expect(page.getByLabel("Bedrooms")).toBeVisible();
      await fillDetails(page);
      await calculateToReady(page);
      await page.getByRole("button", { name: /verify email & view estimate/i }).click();

      // OTP group is properly labelled.
      await page.getByLabel("Email address").fill(email);
      const since = Date.now();
      await page.getByRole("button", { name: /send my code/i }).click();
      await expect(page.getByRole("group", { name: /one-time password/i })).toBeVisible();
      await expect(page.getByLabel("Digit 1 of 6")).toBeVisible();

      const code = await readLatestOtp(email, since);
      await page.getByLabel("Digit 1 of 6").click();
      await page.keyboard.type(code);
      await page.getByRole("button", { name: /verify & view my estimate/i }).click();
      await expect(page).toHaveURL(/\/result\//, { timeout: 30_000 });

      // Evidence rating carries a text label (not colour-only).
      await expect(page.getByText(/evidence:\s*(high|medium|low)/i)).toBeVisible();
    } finally {
      await deleteUserByEmail(email);
    }
  });
});
