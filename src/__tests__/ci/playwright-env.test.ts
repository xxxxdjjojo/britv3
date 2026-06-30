import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadPlaywrightEnv } from "../../../e2e/fixtures/playwright-env";

let tempDir: string | null = null;

afterEach(() => {
  delete process.env.PLAYWRIGHT_ENV_TEST_KEY;
  delete process.env.PLAYWRIGHT_ENV_EXISTING_KEY;
  delete process.env.IGNORED_COMMENTED_KEY;

  if (tempDir) {
    rmSync(tempDir, { force: true, recursive: true });
    tempDir = null;
  }
});

describe("Playwright env loader", () => {
  it("loads local dotenv values without overriding exported CI env", () => {
    tempDir = mkdtempSync(join(tmpdir(), "playwright-env-"));
    writeFileSync(
      join(tempDir, ".env.local"),
      [
        "PLAYWRIGHT_ENV_TEST_KEY=from-local",
        "PLAYWRIGHT_ENV_EXISTING_KEY=from-local",
        "IGNORED_COMMENTED_KEY=ignored # inline comment",
      ].join("\n"),
    );
    process.env.PLAYWRIGHT_ENV_EXISTING_KEY = "from-process";

    loadPlaywrightEnv(tempDir);

    expect(process.env.PLAYWRIGHT_ENV_TEST_KEY).toBe("from-local");
    expect(process.env.PLAYWRIGHT_ENV_EXISTING_KEY).toBe("from-process");
    expect(process.env.IGNORED_COMMENTED_KEY).toBe("ignored");
  });
});
