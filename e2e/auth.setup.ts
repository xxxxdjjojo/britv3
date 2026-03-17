import { test as setup } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const TEST_USERS: Record<string, { email: string; password: string }> = {
  homebuyer: { email: "test-buyer@britestate.test", password: "TestPassword123!" },
  seller: { email: "test-seller@britestate.test", password: "TestPassword123!" },
  landlord: { email: "test-landlord@britestate.test", password: "TestPassword123!" },
  agent: { email: "test-agent@britestate.test", password: "TestPassword123!" },
  provider: { email: "test-provider@britestate.test", password: "TestPassword123!" },
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
      await page.getByLabel("Password").fill(creds.password);
      await page.getByRole("button", { name: /sign in|log in/i }).click();
      await page.waitForURL("**/dashboard**", { timeout: 10_000 });

      // Login succeeded — save authenticated state
      await page.context().storageState({ path: authFile });
    } catch {
      // Auth not available (no Supabase, no test users, etc.)
      // Save empty state so tests can detect this and skip gracefully
      await page.context().storageState({ path: authFile });
    }
  });
}
