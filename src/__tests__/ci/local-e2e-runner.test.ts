import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const E2E_LOCAL_SCRIPT = join(process.cwd(), "scripts", "e2e-local.sh");

describe("local E2E runner contract", () => {
  it("starts only the Supabase services required by auth-backed dashboard smoke tests", () => {
    const script = readFileSync(E2E_LOCAL_SCRIPT, "utf8");

    expect(script).toContain("SUPABASE_E2E_EXCLUDE_SERVICES");
    expect(script).toContain("supabase start --exclude");

    for (const service of [
      "realtime",
      "storage-api",
      "imgproxy",
      "mailpit",
      "postgres-meta",
      "studio",
      "edge-runtime",
      "logflare",
      "vector",
      "supavisor",
    ]) {
      expect(script).toContain(service);
    }

    for (const requiredService of ["gotrue", "kong", "postgrest"]) {
      expect(script).not.toContain(`${requiredService},`);
    }
  });

  it("fails loudly when Supabase did not start before resetting the database", () => {
    const script = readFileSync(E2E_LOCAL_SCRIPT, "utf8");

    const statusIndex = script.indexOf("supabase status -o env");
    const resetIndex = script.indexOf("supabase db reset");

    expect(script).not.toContain("supabase start >/dev/null 2>&1 || true");
    expect(script).toContain("[e2e-local] FATAL: Supabase local stack is not running");
    expect(statusIndex).toBeGreaterThan(-1);
    expect(resetIndex).toBeGreaterThan(-1);
    expect(statusIndex).toBeLessThan(resetIndex);
  });

  it("waits for PostgREST readiness without depending on table-level grants", () => {
    const script = readFileSync(E2E_LOCAL_SCRIPT, "utf8");

    expect(script).toContain('"$API_URL/rest/v1/"');
    expect(script).not.toContain("profiles?select=id&limit=1");
  });
});
