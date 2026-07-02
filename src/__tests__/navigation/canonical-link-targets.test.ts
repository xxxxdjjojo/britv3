import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src/app", "src/components", "src/config"];
const SOURCE_EXTENSIONS = [".ts", ".tsx"] as const;

const FORBIDDEN_INTERNAL_HREFS = [
  "/dashboard/saved",
  "/dashboard/seller/settings",
  "/advice",
] as const;

type Violation = Readonly<{
  file: string;
  line: number;
  excerpt: string;
}>;

function listSourceFiles(dir: string): string[] {
  const absoluteDir = join(ROOT, dir);
  const entries = readdirSync(absoluteDir);
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = join(absoluteDir, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      files.push(...listSourceFiles(relative(ROOT, absolutePath)));
      continue;
    }

    if (
      SOURCE_EXTENSIONS.some((extension) => entry.endsWith(extension)) &&
      !entry.endsWith(".test.ts") &&
      !entry.endsWith(".test.tsx")
    ) {
      files.push(absolutePath);
    }
  }

  return files;
}

function findSourceMatches(pattern: RegExp): Violation[] {
  return SCAN_DIRS.flatMap(listSourceFiles).flatMap((filePath) => {
    const source = readFileSync(filePath, "utf8");
    const matches = Array.from(source.matchAll(pattern));

    return matches.map((match) => {
      const line = source.slice(0, match.index).split("\n").length;
      return {
        file: relative(ROOT, filePath),
        line,
        excerpt: match[0],
      };
    });
  });
}

describe("canonical internal link targets", () => {
  it("does not render stale dashboard, advice, or seller settings hrefs", () => {
    for (const forbiddenHref of FORBIDDEN_INTERNAL_HREFS) {
      const escapedHref = forbiddenHref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Match only internal href literals (quote/backtick-prefixed) so external
      // URLs that merely contain the path (e.g. hoa.org.uk/advice/...) don't
      // false-positive.
      const violations = findSourceMatches(new RegExp(`["'\`]${escapedHref}`, "g"));

      expect(violations, `${forbiddenHref} violations`).toEqual([]);
    }
  });

  it("uses the canonical /properties route for property detail links", () => {
    const violations = findSourceMatches(/[`"']\/property\/\$\{[^`"']+[`"']/g);

    expect(violations).toEqual([]);
  });
});
