import { defineConfig, devices } from "@playwright/test";

// E2E_BASE_URL lets the local-DB gate (scripts/e2e-local.sh) run the dev server on
// a dedicated port so it never collides with a stray dev server from another
// worktree. Defaults to :3000, so existing usage is unchanged.
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 3,
  reporter: "html",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    // First-hit route compilation under `next dev` (the local-DB gate) can take
    // 30s+ on a large App Router tree. Raise the navigation ceiling so cold
    // `page.goto` doesn't abort mid-compile. Harmless for fast/warm responses.
    navigationTimeout: 60_000,
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 14"] },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    // `next dev` honours the PORT env var; the gate script sets PORT + E2E_BASE_URL.
    command: "pnpm dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
