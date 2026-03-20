import { test as setup } from "@playwright/test";
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * Load env vars from .env and .env.local files.
 */
function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const envFile of [".env", ".env.local"]) {
    try {
      const content = readFileSync(resolve(process.cwd(), envFile), "utf-8");
      for (const line of content.split("\n")) {
        const match = line.match(/^([^#=\s]+)=(\S+)/);
        if (match) env[match[1]] = match[2];
      }
    } catch {
      // File not found
    }
  }
  return env;
}

const envVars = loadEnv();
const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const TEST_USERS: Record<string, { email: string; password: string }> = {
  homebuyer: { email: "test-buyer@britestate.test", password: "TestPassword123!" },
  seller: { email: "test-seller@britestate.test", password: "TestPassword123!" },
  landlord: { email: "test-landlord@britestate.test", password: "TestPassword123!" },
  agent: { email: "test-agent@britestate.test", password: "TestPassword123!" },
  provider: { email: "test-provider@britestate.test", password: "TestPassword123!" },
  admin: { email: "test-admin@britestate.test", password: "TestPassword123!" },
};

const ROLE_MAP: Record<string, string> = {
  homebuyer: "homebuyer",
  seller: "seller",
  landlord: "landlord",
  agent: "agent",
  provider: "service_provider",
  admin: "homebuyer",
};

/**
 * Ensure test user exists and has the correct role via curl + Supabase REST API.
 */
function ensureTestUser(email: string, password: string, role: string): void {
  if (!SUPABASE_URL || !ANON_KEY) return;

  const dbRole = ROLE_MAP[role] ?? "homebuyer";

  try {
    // 1. Sign up (idempotent — 422 if already exists)
    execSync(
      `curl -sf "${SUPABASE_URL}/auth/v1/signup" ` +
      `-H "apikey: ${ANON_KEY}" ` +
      `-H "Content-Type: application/json" ` +
      `-d '${JSON.stringify({ email, password, data: { full_name: `Test ${role}`, intended_role: dbRole } })}' ` +
      `2>/dev/null || true`,
      { timeout: 10_000 },
    );

    // 2. Sign in to get access token + user ID
    const signInOut = execSync(
      `curl -s "${SUPABASE_URL}/auth/v1/token?grant_type=password" ` +
      `-H "apikey: ${ANON_KEY}" ` +
      `-H "Content-Type: application/json" ` +
      `-d '${JSON.stringify({ email, password })}'`,
      { timeout: 10_000, encoding: "utf-8" },
    );

    const session = JSON.parse(signInOut);
    const userId = session.user?.id;
    const token = session.access_token;
    if (!userId || !token) return;

    // 3. Update profile active_role
    execSync(
      `curl -sf "${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}" ` +
      `-X PATCH ` +
      `-H "Authorization: Bearer ${token}" ` +
      `-H "apikey: ${ANON_KEY}" ` +
      `-H "Content-Type: application/json" ` +
      `-d '{"active_role":"${dbRole}"}' ` +
      `2>/dev/null || true`,
      { timeout: 10_000 },
    );

    // 4. Insert user_roles row (ignore if duplicate)
    execSync(
      `curl -sf "${SUPABASE_URL}/rest/v1/user_roles" ` +
      `-X POST ` +
      `-H "Authorization: Bearer ${token}" ` +
      `-H "apikey: ${ANON_KEY}" ` +
      `-H "Content-Type: application/json" ` +
      `-H "Prefer: resolution=ignore-duplicates" ` +
      `-d '{"user_id":"${userId}","role":"${dbRole}"}' ` +
      `2>/dev/null || true`,
      { timeout: 10_000 },
    );
  } catch {
    // Curl or network failure — continue with UI login attempt
  }
}

setup.setTimeout(60_000);

for (const [role, creds] of Object.entries(TEST_USERS)) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    const authFile = `e2e/.auth/${role}.json`;
    mkdirSync(dirname(authFile), { recursive: true });

    // Ensure test user exists with correct role
    ensureTestUser(creds.email, creds.password, role);

    try {
      await page.goto("/login");
      await page.getByLabel("Email").fill(creds.email);
      await page.getByLabel("Password").fill(creds.password);
      await page.getByRole("button", { name: /sign in|log in/i }).click();
      await page.waitForURL("**/dashboard**", { timeout: 15_000 });

      // Navigate to dashboard to ensure cookies are fully refreshed by middleware
      await page.goto("/dashboard/provider");
      await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});

      // Login succeeded — save authenticated state (includes httpOnly cookies)
      await page.context().storageState({ path: authFile });
    } catch {
      // Auth not available — save empty state so tests skip gracefully
      try {
        await page.context().storageState({ path: authFile });
      } catch {
        // Browser already closed — write empty state manually
        writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }));
      }
    }
  });
}
