import { test as setup } from "@playwright/test";
import { loadPlaywrightEnv } from "./fixtures/playwright-env";
import {
  assertSupabaseAuthStateFile,
  writeSupabaseAuthState,
} from "./fixtures/supabase-auth-state";

loadPlaywrightEnv(process.cwd());

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
  setup(`authenticate as ${role}`, async ({ baseURL }) => {
    // Auth setup talks directly to Supabase and writes the same SSR cookie
    // format the browser client writes. That keeps auth deterministic under
    // cold `next dev` starts and makes setup failures fail the setup project.
    setup.setTimeout(90_000);

    const authFile = `e2e/.auth/${role}.json`;
    await writeSupabaseAuthState({
      authFile,
      role,
      email: creds.email,
      password: creds.password,
      baseURL: baseURL ?? process.env.E2E_BASE_URL ?? "http://localhost:3000",
    });
    assertSupabaseAuthStateFile(authFile, role);
  });
}
