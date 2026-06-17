import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const LEGAL_DIR = join(ROOT, "src/app/(main)/legal");
const HUB_PATH = join(ROOT, "src/app/(main)/legal/page.tsx");
const LEFT_NAV_PATH = join(ROOT, "src/components/legal/LegalLeftNav.tsx");

function discoverLegalSubRoutes(): string[] {
  const entries = readdirSync(LEGAL_DIR);
  const routes: string[] = [];

  for (const entry of entries) {
    const absolutePath = join(LEGAL_DIR, entry);
    const stats = statSync(absolutePath);

    if (!stats.isDirectory()) continue;

    const pageFile = join(absolutePath, "page.tsx");
    try {
      statSync(pageFile);
      routes.push(`/legal/${entry}`);
    } catch {
      // No page.tsx in this directory — skip
    }
  }

  return routes.sort();
}

describe("legal pages linking guardrail", () => {
  it("every /legal/* route is linked from both the hub page and LegalLeftNav", () => {
    const routes = discoverLegalSubRoutes();
    const hubSource = readFileSync(HUB_PATH, "utf-8");
    const navSource = readFileSync(LEFT_NAV_PATH, "utf-8");

    const violations = routes
      .filter((route) => !hubSource.includes(`"${route}"`) && !hubSource.includes(`'${route}'`))
      .map((route) => `${route} — missing from hub (src/app/(main)/legal/page.tsx)`)
      .concat(
        routes
          .filter((route) => !navSource.includes(`"${route}"`) && !navSource.includes(`'${route}'`))
          .map((route) => `${route} — missing from LegalLeftNav (src/components/legal/LegalLeftNav.tsx)`),
      );

    expect(violations, [
      "",
      "ORPHANED LEGAL ROUTES DETECTED:",
      ...violations.map((v) => `  • ${v}`),
      "",
      "Every directory under src/app/(main)/legal/ that contains a page.tsx",
      "must be linked from BOTH the hub page AND LegalLeftNav.",
      "Add the missing href(s) to fix this failure.",
    ].join("\n")).toEqual([]);
  });
});
