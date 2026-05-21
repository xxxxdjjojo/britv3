import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

const VERIFIED_PUBLIC_LINK_FILES = [
  "src/app/(main)/market-trends/page.tsx",
  "src/app/(main)/blog/[slug]/page.tsx",
  "src/app/(main)/tools/rental-yield-calculator/page.tsx",
] as const;

const PLACEHOLDER_HREF_RE =
  /\bhref\s*=\s*(?:"#"|'#'|{\s*(?:"#"|'#'|`#`)\s*})/g;

describe("verified public link placeholders", () => {
  it("does not leave verified public links pointing at href=\"#\"", () => {
    const violations = VERIFIED_PUBLIC_LINK_FILES.flatMap((filePath) => {
      const source = readFileSync(join(ROOT, filePath), "utf8");

      return Array.from(source.matchAll(PLACEHOLDER_HREF_RE)).map((match) => {
        const line = source.slice(0, match.index).split("\n").length;
        return `${filePath}:${line} still uses ${match[0]}`;
      });
    });

    expect(violations).toEqual([]);
  });
});
