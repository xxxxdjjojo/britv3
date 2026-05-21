import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src/app", "src/components"];
const INTERNAL_ANCHOR_RE = /<a\b[^>]*\bhref=(["'`])\/(?!\/)(.*?)\1/gs;
const SKIP_FILE_RE = /\.(test|spec)\.tsx$/;
const STALE_INTERNAL_HREFS = [
  {
    label: "/dashboard/saved",
    pattern: /(?:href\s*=\s*|href:\s*)["'`]\/dashboard\/saved["'`]/g,
  },
  {
    label: "/dashboard/seller/settings",
    pattern: /(?:href\s*=\s*|href:\s*)["'`]\/dashboard\/seller\/settings["'`]/g,
  },
  {
    label: "/property/*",
    pattern: /href\s*=\s*(?:["'`]\/property\/|\{`\/property\/)/g,
  },
] as const;

function listTsxFiles(dir: string): string[] {
  const absoluteDir = join(ROOT, dir);
  const entries = readdirSync(absoluteDir);
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = join(absoluteDir, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      files.push(...listTsxFiles(relative(ROOT, absolutePath)));
      continue;
    }

    if (entry.endsWith(".tsx") && !SKIP_FILE_RE.test(entry)) {
      files.push(absolutePath);
    }
  }

  return files;
}

describe("internal app navigation", () => {
  it("renders internal routes with next/link instead of plain anchor tags", () => {
    const violations = SCAN_DIRS.flatMap(listTsxFiles).flatMap((filePath) => {
      const source = readFileSync(filePath, "utf8");
      const matches = Array.from(source.matchAll(INTERNAL_ANCHOR_RE));

      return matches.map((match) => {
        const line = source.slice(0, match.index).split("\n").length;
        const href = `/${match[2]}`;
        return `${relative(ROOT, filePath)}:${line} uses <a href="${href}"> for an internal route`;
      });
    });

    expect(violations).toEqual([]);
  });

  it("does not point app or component links at stale internal routes", () => {
    const violations = SCAN_DIRS.flatMap(listTsxFiles).flatMap((filePath) => {
      const source = readFileSync(filePath, "utf8");

      return STALE_INTERNAL_HREFS.flatMap(({ label, pattern }) =>
        Array.from(source.matchAll(pattern)).map((match) => {
          const line = source.slice(0, match.index).split("\n").length;
          return `${relative(ROOT, filePath)}:${line} links to stale ${label}`;
        }),
      );
    });

    expect(violations).toEqual([]);
  });
});
