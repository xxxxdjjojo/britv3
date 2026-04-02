#!/usr/bin/env tsx
/**
 * Verify Demo — Playwright Dashboard Smoke Test
 *
 * Signs in as each of the 7 demo users and verifies their dashboard
 * loads with real data (no empty states, no 500 errors).
 *
 * Usage:
 *   pnpm seed:verify
 *
 * Requires a running dev server on localhost:3000.
 */

import { chromium, type Browser, type Page } from "@playwright/test";
import { DEMO_USERS, DEMO_PASSWORD } from "./seed-demo/config";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const SCREENSHOT_DIR = "scripts/verify-demo-screenshots";

/** Map config roles to dashboard URL segments */
function roleToDashboardPath(role: string, isAdmin: boolean): string {
  if (isAdmin) return "/dashboard/admin";
  const overrides: Record<string, string> = {
    service_provider: "provider",
    estate_agent: "agent",
  };
  return `/dashboard/${overrides[role] ?? role}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VerifyResult {
  user: string;
  role: string;
  dashboardPath: string;
  pass: boolean;
  issues: string[];
  screenshotPath?: string;
}

// ---------------------------------------------------------------------------
// Verification Logic
// ---------------------------------------------------------------------------

async function verifyUser(
  browser: Browser,
  user: {
    name: string;
    email: string;
    role: string;
    isAdmin: boolean;
    key: string;
  },
): Promise<VerifyResult> {
  const dashboardPath = roleToDashboardPath(user.role, user.isAdmin);
  const issues: string[] = [];
  let screenshotPath: string | undefined;

  const context = await browser.newContext({
    baseURL: BASE_URL,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  try {
    // ── Step 1: Sign in ──────────────────────────────────────────────────
    await page.goto("/login", { waitUntil: "networkidle", timeout: 15_000 });

    // Fill login form
    const emailInput = page.getByLabel("Email");
    const passwordInput = page.getByLabel("Password");

    if (!(await emailInput.isVisible({ timeout: 5_000 }))) {
      issues.push("Login page: email input not found");
      return makeResult(user, dashboardPath, issues, screenshotPath);
    }

    await emailInput.fill(user.email);
    await passwordInput.fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    // Wait for redirect to dashboard
    try {
      await page.waitForURL("**/dashboard**", { timeout: 15_000 });
    } catch {
      issues.push(`Login failed: did not redirect to dashboard (ended at ${page.url()})`);
      screenshotPath = await saveScreenshot(page, user.key, "login-fail");
      return makeResult(user, dashboardPath, issues, screenshotPath);
    }

    // ── Step 2: Navigate to role dashboard ───────────────────────────────
    const dashboardResponse = await page.goto(dashboardPath, {
      waitUntil: "networkidle",
      timeout: 20_000,
    });

    // Check for 500 errors
    const status = dashboardResponse?.status() ?? 0;
    if (status >= 500) {
      issues.push(`Dashboard returned HTTP ${status}`);
      screenshotPath = await saveScreenshot(page, user.key, "500-error");
      return makeResult(user, dashboardPath, issues, screenshotPath);
    }

    // ── Step 3: Verify data is visible ───────────────────────────────────
    // Wait for content to settle
    await page.waitForTimeout(2_000);

    // Check for empty state indicators
    const emptyPatterns = [
      "No data",
      "no results",
      "0 results",
      "Nothing to show",
      "Get started",
      "No items found",
      "empty",
    ];

    const bodyText = await page.locator("main").textContent().catch(() => "");
    const bodyLower = (bodyText ?? "").toLowerCase();

    // Only flag if the page body is dominated by empty state text
    // (some pages may have "empty" in unrelated contexts)
    for (const pattern of emptyPatterns) {
      if (bodyLower.includes(pattern.toLowerCase())) {
        // Check if this is a prominent empty state (in a heading or card)
        const emptyHeading = page.locator(
          `h1:has-text("${pattern}"), h2:has-text("${pattern}"), h3:has-text("${pattern}"), [role="alert"]:has-text("${pattern}")`,
        );
        if ((await emptyHeading.count()) > 0) {
          issues.push(`Empty state detected: "${pattern}" in heading/alert`);
        }
      }
    }

    // Look for at least one non-zero number (KPI card)
    const hasNonZeroKPI = await checkForNonZeroKPI(page);
    if (!hasNonZeroKPI) {
      issues.push("No non-zero KPI numbers found on dashboard");
    }

    // Take screenshot on any issues
    if (issues.length > 0) {
      screenshotPath = await saveScreenshot(page, user.key, "issues");
    }

    // ── Step 4: Log out ──────────────────────────────────────────────────
    // Try clicking a sign-out button or navigating to logout
    try {
      const signOutBtn = page.getByRole("button", { name: /sign out|log out|logout/i });
      if (await signOutBtn.isVisible({ timeout: 2_000 })) {
        await signOutBtn.click();
        await page.waitForTimeout(1_000);
      }
    } catch {
      // If no visible sign-out button, just clear cookies
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    issues.push(`Unexpected error: ${msg}`);
    screenshotPath = await saveScreenshot(page, user.key, "error");
  } finally {
    await context.close();
  }

  return makeResult(user, dashboardPath, issues, screenshotPath);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResult(
  user: { name: string; role: string; isAdmin: boolean },
  dashboardPath: string,
  issues: string[],
  screenshotPath?: string,
): VerifyResult {
  return {
    user: user.name,
    role: user.isAdmin ? "admin" : user.role,
    dashboardPath,
    pass: issues.length === 0,
    issues,
    screenshotPath,
  };
}

async function saveScreenshot(
  page: Page,
  userKey: string,
  label: string,
): Promise<string> {
  const { mkdirSync } = await import("node:fs");
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const path = `${SCREENSHOT_DIR}/${userKey}-${label}.png`;
  await page.screenshot({ path, fullPage: true });
  return path;
}

/**
 * Checks whether the page has at least one visible element containing
 * a non-zero number, suggesting KPI data loaded.
 */
async function checkForNonZeroKPI(page: Page): Promise<boolean> {
  // Look for numbers in common KPI-like elements (cards, stat values)
  // Match patterns like "12", "£1,234", "3.5", "142" etc.
  const selectors = [
    "[data-testid*='kpi'] >> text=/[1-9]/",
    "[data-testid*='stat'] >> text=/[1-9]/",
    ".stat >> text=/[1-9]/",
    "[class*='card'] h2 >> text=/[1-9]/",
    "[class*='card'] h3 >> text=/[1-9]/",
    "[class*='card'] p >> text=/[1-9]/",
    "[class*='metric'] >> text=/[1-9]/",
  ];

  for (const selector of selectors) {
    try {
      const count = await page.locator(selector).count();
      if (count > 0) return true;
    } catch {
      // Selector may not match, try next
    }
  }

  // Fallback: look for any text node with a number > 0 in the main area
  // that looks like a stat (e.g., inside a grid or flex card layout)
  try {
    const mainText = await page.locator("main").textContent();
    if (mainText) {
      // Check for numbers like "12", "£1,234", "3.5k" etc.
      const hasNumbers = /\b[1-9][\d,]*(?:\.\d+)?[kKmM]?\b/.test(mainText);
      if (hasNumbers) return true;
    }
  } catch {
    // Ignore
  }

  return false;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("\n============================================================");
  console.log("  DEMO VERIFICATION — Dashboard Smoke Tests");
  console.log("============================================================");
  console.log(`  Base URL: ${BASE_URL}`);
  console.log("");

  const browser = await chromium.launch({ headless: true });

  const users = Object.entries(DEMO_USERS).map(([key, u]) => ({
    key,
    name: u.name,
    email: u.email,
    role: u.role,
    isAdmin: "isAdmin" in u && u.isAdmin === true,
  }));

  const results: VerifyResult[] = [];

  for (const user of users) {
    const displayRole = user.isAdmin ? "admin" : user.role;
    console.log(`  Testing ${user.name} (${displayRole})...`);
    const result = await verifyUser(browser, user);
    results.push(result);

    const icon = result.pass ? "PASS" : "FAIL";
    console.log(`    ${icon}: ${result.dashboardPath}`);
    for (const issue of result.issues) {
      console.log(`      - ${issue}`);
    }
    if (result.screenshotPath) {
      console.log(`      Screenshot: ${result.screenshotPath}`);
    }
  }

  await browser.close();

  // ── Summary ────────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;

  console.log("\n============================================================");
  console.log("  VERIFICATION SUMMARY");
  console.log("============================================================");

  const nameWidth = 22;
  const roleWidth = 18;
  console.log(
    `  ${"User".padEnd(nameWidth)}${"Role".padEnd(roleWidth)}Status`,
  );
  console.log(
    `  ${"-".repeat(nameWidth)}${"-".repeat(roleWidth)}${"-".repeat(8)}`,
  );

  for (const r of results) {
    const icon = r.pass ? "PASS" : "FAIL";
    console.log(
      `  ${r.user.padEnd(nameWidth)}${r.role.padEnd(roleWidth)}${icon}`,
    );
  }

  console.log("");
  console.log(`  ${passed}/${results.length} dashboards passed${failed > 0 ? `, ${failed} failed` : ""}`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
