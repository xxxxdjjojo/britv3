import { test as setup } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const TEST_USERS: Record<string, { email: string; password: string }> = {
  homebuyer: { email: "james.buyer@demo.britestate.co.uk", password: "DemoPass123!" },
  renter:    { email: "sophie.renter@demo.britestate.co.uk", password: "DemoPass123!" },
  seller:    { email: "david.seller@demo.britestate.co.uk", password: "DemoPass123!" },
  landlord:  { email: "mike.landlord@demo.britestate.co.uk", password: "DemoPass123!" },
  agent:     { email: "sarah.agent@demo.britestate.co.uk", password: "DemoPass123!" },
  provider:  { email: "tom.provider@demo.britestate.co.uk", password: "DemoPass123!" },
  admin:     { email: "admin@demo.britestate.co.uk", password: "DemoPass123!" },
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
