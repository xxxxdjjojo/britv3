import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Brand-guard: the public marketing area (the logged-out `(main)` surface) must
 * read as ONE coherent green system using the warm Stitch design tokens. It must
 * never use legacy cool-grey backgrounds, hardcoded brand-green hex, the blue
 * `brand-accent`/blue-family palette, or stray "weird green" tailwind classes
 * (emerald/teal/green/lime). This test scans `src/app/(main)` and fails on any
 * off-brand signal — RED before the token-sweep, GREEN after.
 *
 * Allowed greens (tokens only): brand-primary (#1B4D3E), brand-primary-dark
 * (#003629), brand-primary-light (#2D7A5F), brand-primary-lighter, and the
 * semantic `success` token (#16A34A) for genuine positive states.
 *
 * Justified exception: the EPC energy-rating colours (A–G hex) in
 * `tools/energy-bill-estimator/page.tsx` are standardized rating colours, not
 * brand chrome, so that file is excluded from the scan.
 */

const ROOT = join(process.cwd(), "src");
const IN_SCOPE_DIR = "app/(main)";

const EXCLUDED = ["app/(main)/tools/energy-bill-estimator/page.tsx"];

const FORBIDDEN: ReadonlyArray<{ label: string; re: RegExp }> = [
  {
    label: "legacy cool-grey background (use bg-surface / bg-muted)",
    re: /\bbg-(?:slate|gray)-(?:50|100)\b|\bbg-neutral-50\b/,
  },
  {
    label: "hardcoded brand-green hex (use brand tokens)",
    re: /(?:bg|text|border|from|to|via|ring)-\[#(?:1[bB]4[dD]3[eE]|003629)\]/,
  },
  {
    label: "hardcoded blue accent hex (use brand-primary / brand-gold)",
    re: /\[#2563[eE][bB]\]/,
  },
  {
    label: "blue brand-accent token (it resolves to #2563EB — use brand-primary)",
    re: /(?:bg|text|border|from|to|via|ring)-brand-accent\b/,
  },
  {
    label: "blue-family palette (use brand-primary / brand-gold)",
    re: /\b(?:bg|text|border|from|to|via|ring|fill|stroke|decoration|divide|placeholder|outline)-(?:blue|indigo|sky|cyan)-\d/,
  },
  {
    label: "weird-green tailwind class (use brand-primary / brand greens / success)",
    re: /\b(?:bg|text|border|from|to|via|ring|fill|stroke|decoration|divide|placeholder|outline)-(?:emerald|teal|green|lime)-\d/,
  },
];

function walk(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

function isExcluded(file: string): boolean {
  const rel = file.replace(ROOT + "/", "");
  return EXCLUDED.includes(rel);
}

describe("public marketing brand-guard", () => {
  it("has no off-brand colour tokens (grey bg, hardcoded hex, blue, or weird-green) in (main) source", () => {
    const violations: string[] = [];

    for (const file of walk(join(ROOT, IN_SCOPE_DIR))) {
      if (isExcluded(file)) continue;
      const content = readFileSync(file, "utf8");
      const lines = content.split("\n");
      lines.forEach((line, i) => {
        for (const { label, re } of FORBIDDEN) {
          if (re.test(line)) {
            violations.push(
              `${file.replace(ROOT + "/", "src/")}:${i + 1} — ${label}`,
            );
          }
        }
      });
    }

    expect(
      violations,
      `Off-brand signals found (${violations.length}). Replace with warm brand tokens:\n${violations
        .slice(0, 80)
        .join("\n")}${violations.length > 80 ? `\n…and ${violations.length - 80} more` : ""}`,
    ).toEqual([]);
  });
});
