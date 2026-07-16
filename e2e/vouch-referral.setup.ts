import { test as setup } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { loadPlaywrightEnv } from "./fixtures/playwright-env";
import {
  assertSupabaseAuthStateFile,
  writeSupabaseAuthState,
} from "./fixtures/supabase-auth-state";

loadPlaywrightEnv(process.cwd());

const PASSWORD = "VouchEvidence123!";
const PROVIDERS = [
  ["vouch-gate-empty", "vouch-gate-empty@truedeed.test"],
  ["vouch-gate-3-plus-2", "vouch-gate-3-plus-2@truedeed.test"],
  ["vouch-gate-complete", "vouch-gate-complete@truedeed.test"],
  ["vouch-grandfathered", "vouch-grandfathered@truedeed.test"],
] as const;

setup("seed deterministic vouch and referral evidence", async ({ baseURL }) => {
  setup.setTimeout(120_000);
  const resolvedBaseURL = baseURL ?? "http://127.0.0.1:3014";
  const target = new URL(resolvedBaseURL);
  if (!new Set(["localhost", "127.0.0.1", "::1"]).has(target.hostname)) {
    throw new Error(`Vouch evidence seeding is localhost-only; received ${resolvedBaseURL}`);
  }

  if (process.env.VOUCH_FIXTURES_SEEDED !== "true") {
    execFileSync("node", ["scripts/e2e-vouch-referral-seed.mjs"], {
      stdio: "inherit",
      env: process.env,
    });
  }

  for (const [name, email] of PROVIDERS) {
    const authFile = `e2e/.auth/${name}.json`;
    await writeSupabaseAuthState({
      authFile,
      role: name,
      email,
      password: PASSWORD,
      baseURL: resolvedBaseURL,
    });
    assertSupabaseAuthStateFile(authFile, name);
  }
});
