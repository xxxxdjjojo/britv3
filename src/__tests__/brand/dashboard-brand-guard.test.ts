import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Brand-guard: the authenticated dashboard/portal area must use the warm
 * Stitch design tokens, never the legacy cool-grey backgrounds or hardcoded
 * brand-green hex. This test scans the in-scope source dirs and fails on any
 * off-brand signal — RED before the token-sweep, GREEN after.
 *
 * Scope: dashboards/portals only (public marketing + admin are a later pass).
 */

const ROOT = join(process.cwd(), "src");

const IN_SCOPE_DIRS = [
  "app/(protected)/dashboard",
  "app/(protected)/settings",
  "app/(protected)/notifications",
  "components/providers",
  "components/agents",
  "components/seller",
  "components/landlord",
  "components/dashboard",
];

const FORBIDDEN: ReadonlyArray<{ label: string; re: RegExp }> = [
  {
    label: "legacy cool-grey background (use bg-surface)",
    re: /\bbg-(?:slate|gray)-(?:50|100)\b|\bbg-neutral-50\b/,
  },
  {
    label: "hardcoded brand-green hex (use brand tokens)",
    re: /(?:bg|text|border|from|to|via|ring)-\[#1[bB]4[dD]3[eE]\]/,
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

describe("dashboard brand-guard", () => {
  it("has no legacy cool-grey backgrounds or hardcoded brand-green hex in dashboard/portal source", () => {
    const violations: string[] = [];

    for (const rel of IN_SCOPE_DIRS) {
      for (const file of walk(join(ROOT, rel))) {
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
    }

    expect(
      violations,
      `Off-brand signals found (${violations.length}). Replace with warm tokens:\n${violations
        .slice(0, 50)
        .join("\n")}${violations.length > 50 ? `\n…and ${violations.length - 50} more` : ""}`,
    ).toEqual([]);
  });
});
