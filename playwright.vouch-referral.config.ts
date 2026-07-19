import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.VOUCH_E2E_PORT ?? 3014);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;
const isLocal = new Set(["localhost", "127.0.0.1", "::1"]).has(
  new URL(baseURL).hostname,
);

export default defineConfig({
  testDir: "./e2e",
  testMatch: /vouch-referral(?:\.setup|-proof\.spec)\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: process.env.CI
    ? [["line"], ["html", { outputFolder: "playwright-report/vouch-referral", open: "never" }]]
    : [["list"]],
  outputDir: "test-results/evidence/vouch-referral/.playwright-output",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    navigationTimeout: 60_000,
  },
  projects: [
    {
      name: "vouch-referral-setup",
      testMatch: /vouch-referral\.setup\.ts/,
    },
    {
      name: "desktop-1440x900",
      testMatch: /vouch-referral-proof\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
      dependencies: ["vouch-referral-setup"],
    },
    {
      name: "iphone-14-390x844",
      testMatch: /vouch-referral-proof\.spec\.ts/,
      use: {
        ...devices["iPhone 14"],
        viewport: { width: 390, height: 844 },
      },
      dependencies: ["vouch-referral-setup"],
    },
  ],
  webServer: isLocal
    ? {
        command: `PORT=${port} pnpm start`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      }
    : undefined,
});
