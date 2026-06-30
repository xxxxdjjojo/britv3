import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PERF_WORKFLOW = join(process.cwd(), ".github", "workflows", "perf-budget.yml");
const PLAYWRIGHT_CONFIG = join(process.cwd(), "playwright.config.ts");

describe("perf workflow contract", () => {
  it("runs public route-status checks without authenticated setup or dev webserver", () => {
    const workflow = readFileSync(PERF_WORKFLOW, "utf8");
    const config = readFileSync(PLAYWRIGHT_CONFIG, "utf8");

    expect(workflow).toContain('PLAYWRIGHT_SKIP_WEB_SERVER: "true"');
    expect(workflow).toContain(
      "pnpm exec playwright test e2e/perf/critical-routes-status.spec.ts --project=chromium --no-deps",
    );
    expect(config).toContain('process.env.PLAYWRIGHT_SKIP_WEB_SERVER !== "true"');
  });
});
