import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PW_PORT ?? 3107);
const baseURL = process.env.PW_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: [
    /checklist-link-render\.spec\.ts/,
    /configured-navigation-render\.spec\.ts/,
    /homepage-link-audit\.spec\.ts/,
    /property-valuation-flow\.spec\.ts/,
    /public-page-screenshots\.spec\.ts/,
  ],
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  outputDir: "test-results/evidence/link-render/.playwright-output",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "link-render-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm exec next dev --webpack --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
