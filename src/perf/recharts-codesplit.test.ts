import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Budget guard for R3 (PERFORMANCE_AUDIT.md): the heavy Recharts library
 * (~362 KB minified chunk) must NOT be in the property-detail route's
 * first-load JS. We enforce this by requiring the chart to be loaded via a
 * dynamic import (registered in Next's react-loadable-manifest), which makes
 * Recharts an async chunk fetched on demand instead of at page load.
 *
 * Requires a production build (`pnpm build`) to exist; the CI perf job runs
 * this after building. Skips with a clear message when no build is present so
 * it never gives a false red in plain unit-test runs.
 */
const MANIFEST = resolve(process.cwd(), ".next/react-loadable-manifest.json");

describe("R3: Recharts is code-split out of the property-detail first load", () => {
  it("loads CrimeStatsChart via a dynamic import (async chunk)", () => {
    if (!existsSync(MANIFEST)) {
      console.warn(
        `[perf] ${MANIFEST} not found — run \`pnpm build\` first. Skipping.`,
      );
      return;
    }
    const manifest = readFileSync(MANIFEST, "utf8");
    expect(
      manifest.includes("CrimeStatsChart"),
      "CrimeStatsChart must be a dynamic import (react-loadable entry) so Recharts stays out of the detail route's first-load JS",
    ).toBe(true);
  });
});
