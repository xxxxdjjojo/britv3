import { defineConfig, devices } from "@playwright/test";

/**
 * Full valuation-journey E2E. Runs the app against LOCAL Supabase (so email OTP
 * can be minted + verified deterministically) while data (price_paid_data, hpi,
 * centroids) still comes from the remote DB via SUPABASE_DB_URL (inherited from
 * .env.local). Pass local creds as LOCAL_SUPABASE_URL/ANON/SERVICE:
 *
 *   eval "$(supabase status -o env | sed 's/^/LOCAL_/')"
 *   LOCAL_SUPABASE_URL=$LOCAL_API_URL LOCAL_SUPABASE_ANON=$LOCAL_ANON_KEY \
 *   LOCAL_SUPABASE_SERVICE=$LOCAL_SERVICE_ROLE_KEY \
 *   npx playwright test --config playwright.valuation.config.ts
 */
const port = Number(process.env.PW_VAL_PORT ?? 3210);
const baseURL = `http://127.0.0.1:${port}`;

const localUrl = process.env.LOCAL_SUPABASE_URL ?? "http://127.0.0.1:54321";
const localAnon = process.env.LOCAL_SUPABASE_ANON ?? "";
const localService = process.env.LOCAL_SUPABASE_SERVICE ?? "";

export default defineConfig({
  testDir: "./e2e",
  testMatch: [/valuation-journey\.spec\.ts/],
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  outputDir: "test-results/evidence/valuation/.pw-output",
  timeout: 90_000,
  use: {
    baseURL,
    navigationTimeout: 60_000,
    trace: "retain-on-failure",
  },
  projects: [{ name: "valuation-chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm exec next dev --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
    // Real env vars take precedence over .env.local, so auth points at local
    // Supabase; SUPABASE_DB_URL (remote) is inherited for the property data.
    env: {
      NEXT_PUBLIC_SUPABASE_URL: localUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: localAnon,
      SUPABASE_SERVICE_ROLE_KEY: localService,
    },
  },
});
