import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const BUN_TEST_ALLOWLIST = new Set([
  "test/gstack/integration.test.ts",
  "test/gstack/workflow.test.ts",
]);

const RUNNERS = [
  {
    name: "vitest",
    matches: (path) => /^src\/.+\.test\.(?:ts|tsx)$/.test(path),
  },
  {
    name: "vitest-db",
    matches: (path) => /^db-tests\/.+\.test\.ts$/.test(path),
  },
  {
    name: "playwright",
    matches: (path) => /^e2e\/.+\.spec\.(?:ts|tsx)$/.test(path),
  },
  {
    name: "bun",
    matches: (path) => BUN_TEST_ALLOWLIST.has(path),
  },
];

const TEST_FILE_PATTERN = /\.(?:test|spec)\.(?:[cm]?[jt]sx?)$/;

const trackedTestFiles = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard"],
  { encoding: "utf8" },
)
  .split("\n")
  .filter((path) => existsSync(path) && TEST_FILE_PATTERN.test(path));

const violations = trackedTestFiles.flatMap((path) => {
  const owners = RUNNERS.filter((runner) => runner.matches(path)).map(
    (runner) => runner.name,
  );

  if (owners.length === 1) return [];

  return [
    owners.length === 0
      ? `${path}: not collected by any configured test runner`
      : `${path}: collected by multiple runners (${owners.join(", ")})`,
  ];
});

if (violations.length > 0) {
  console.error("Test collection contract failed:\n");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Test collection contract passed: ${trackedTestFiles.length} tracked test files have exactly one runner.`,
  );
}
