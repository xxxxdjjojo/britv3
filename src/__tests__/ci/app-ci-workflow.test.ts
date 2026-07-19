import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const WORKFLOWS_DIR = join(process.cwd(), ".github", "workflows");
const PACKAGE_JSON = join(process.cwd(), "package.json");

function readWorkflowSources(): string[] {
  if (!existsSync(WORKFLOWS_DIR)) return [];

  return readdirSync(WORKFLOWS_DIR)
    .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
    .map((file) => readFileSync(join(WORKFLOWS_DIR, file), "utf8"));
}

describe("app CI workflow contract", () => {
  it("runs app lint, unit tests, build, and Chromium link E2E on pull requests", () => {
    const workflows = readWorkflowSources();
    const appCiWorkflow = workflows.find((source) =>
      source.includes("pnpm install --frozen-lockfile") &&
      source.includes("pnpm lint") &&
      source.includes("pnpm test -- --run") &&
      source.includes("pnpm build"),
    );

    expect(appCiWorkflow, "missing app CI workflow").toBeDefined();
    expect(appCiWorkflow).toContain("npx playwright install --with-deps chromium");
    expect(appCiWorkflow).toContain("e2e/homepage-link-audit.spec.ts");
    expect(appCiWorkflow).toContain("e2e/navigation.spec.ts");
    expect(appCiWorkflow).toContain("e2e/dashboard-navigation.spec.ts");
    expect(appCiWorkflow).toContain("--project=chromium");
  });

  it("runs route integrity as an independently requireable pull-request check", () => {
    const packageJson = JSON.parse(readFileSync(PACKAGE_JSON, "utf8")) as {
      scripts?: Record<string, string>;
    };
    const workflows = readWorkflowSources();
    const appCiWorkflow = workflows.find((source) => source.includes("name: App CI"));

    expect(packageJson.scripts?.["test:routes"]).toBe("vitest run src/__tests__/routes");
    expect(appCiWorkflow, "missing app CI workflow").toBeDefined();
    expect(appCiWorkflow).toContain("route-integrity:");
    expect(appCiWorkflow).toContain("pnpm test:routes");
  });

  it("runs landlord maintenance/compliance smoke against seeded auth state", () => {
    const workflows = readWorkflowSources();
    const appCiWorkflow = workflows.find((source) => source.includes("name: App CI"));

    expect(appCiWorkflow, "missing app CI workflow").toBeDefined();
    expect(appCiWorkflow).toContain("landlord-smoke:");
    expect(appCiWorkflow).toContain("supabase/setup-cli@v1");
    // The Supabase CLI must stay PINNED (never floating `latest`, which was a
    // past reproducibility bug). The vouch/referral CI slice advanced the pin
    // to 2.109.1 across every job that installs the CLI.
    expect(appCiWorkflow).toContain("version: 2.109.1");
    expect(appCiWorkflow).not.toContain("version: latest");
    expect(appCiWorkflow).toContain(
      "scripts/e2e-local.sh landlord-maintenance-compliance-smoke",
    );
    expect(appCiWorkflow).toContain("test-results/");
  });
});
