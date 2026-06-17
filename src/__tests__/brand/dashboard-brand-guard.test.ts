import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Brand-guard: the authenticated dashboard/portal AND admin back-office areas
 * must use the warm Stitch design tokens, never the legacy cool-grey
 * backgrounds or hardcoded brand-green hex. This test scans the in-scope
 * source dirs and fails on any off-brand signal — RED before the token-sweep,
 * GREEN after.
 *
 * Scope: dashboards/portals + admin back-office. The admin area additionally
 * forbids off-brand blue/purple hues (it is migrating onto the green Stitch
 * system; public marketing pages remain a separate pass).
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
  "app/(admin)",
  "components/admin",
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

// The admin back-office is migrating onto the green Stitch system; off-brand
// blue/purple has no place there. These rules apply ONLY to the admin dirs —
// the consumer dashboards still carry blue accents cleared by a separate pass.
const ADMIN_DIRS = ["app/(admin)", "components/admin"];

const ADMIN_FORBIDDEN: ReadonlyArray<{ label: string; re: RegExp }> = [
  {
    label: "off-brand hue (use brand green/gold + semantic tokens)",
    re: /\b(?:bg|text|border|from|to|via|ring|fill|stroke|divide)-(?:blue|indigo|sky|violet|purple)-\d{2,3}\b/,
  },
  {
    label: "off-brand blue hex (use brand tokens)",
    re: /#2563[eE][bB]\b|#EEF2FB\b/i,
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

    const scan = (
      dirs: ReadonlyArray<string>,
      rules: ReadonlyArray<{ label: string; re: RegExp }>,
    ) => {
      for (const rel of dirs) {
        for (const file of walk(join(ROOT, rel))) {
          const content = readFileSync(file, "utf8");
          const lines = content.split("\n");
          lines.forEach((line, i) => {
            for (const { label, re } of rules) {
              if (re.test(line)) {
                violations.push(
                  `${file.replace(ROOT + "/", "src/")}:${i + 1} — ${label}`,
                );
              }
            }
          });
        }
      }
    };

    scan(IN_SCOPE_DIRS, FORBIDDEN);
    scan(ADMIN_DIRS, ADMIN_FORBIDDEN);

    expect(
      violations,
      `Off-brand signals found (${violations.length}). Replace with warm tokens:\n${violations
        .slice(0, 50)
        .join("\n")}${violations.length > 50 ? `\n…and ${violations.length - 50} more` : ""}`,
    ).toEqual([]);
  });
});
