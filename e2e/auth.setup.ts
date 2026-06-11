import { test as setup } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const TEST_USERS: Record<string, { email: string; password: string }> = {
  homebuyer: { email: "test-buyer@britestate.test", password: "TestPassword123!" },
  renter: { email: "test-renter@britestate.test", password: "TestPassword123!" },
  seller: { email: "test-seller@britestate.test", password: "TestPassword123!" },
  landlord: { email: "test-landlord@britestate.test", password: "TestPassword123!" },
  agent: { email: "test-agent@britestate.test", password: "TestPassword123!" },
  provider: { email: "test-provider@britestate.test", password: "TestPassword123!" },
  mortgage_broker: { email: "test-broker@britestate.test", password: "TestPassword123!" },
  admin: { email: "test-admin@britestate.test", password: "TestPassword123!" },
};

for (const [role, creds] of Object.entries(TEST_USERS)) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    const authFile = `e2e/.auth/${role}.json`;

    // Ensure directory exists
    mkdirSync(dirname(authFile), { recursive: true });

    try {
      await page.goto("/login");
      await page.getByLabel("Email").fill(creds.email);
      await page.getByLabel("Password", { exact: true }).fill(creds.password);
      await page.getByRole("button", { name: /sign in|log in/i }).click();
      await page.waitForURL("**/dashboard**", { timeout: 10_000 });

      // Login succeeded — save authenticated state
      await page.context().storageState({ path: authFile });
    } catch {
      // Auth not available (no Supabase, no test users, etc.)
      // Save an explicit empty state so authenticated specs fail on missing auth
      // instead of inheriting unrelated analytics storage.
      await page.context().storageState({ path: authFile });
      writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }, null, 2));
    }
  });
}
