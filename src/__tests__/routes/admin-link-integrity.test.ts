import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveAppRoute } from "./route-manifest";

const SRC_ROOT = path.resolve(__dirname, "../..");
const SCAN_DIRS = [
  path.join(SRC_ROOT, "app/(admin)"),
  path.join(SRC_ROOT, "components/admin"),
];

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") continue;
      collectSourceFiles(full, acc);
    } else if (
      /\.tsx?$/.test(entry.name) &&
      !/\.test\.[tj]sx?$/.test(entry.name) &&
      !/\.stories\.[tj]sx?$/.test(entry.name)
    ) {
      acc.push(full);
    }
  }
  return acc;
}

function extractNavigationTargets(src: string): string[] {
  const out: string[] = [];
  const patterns = [
    /\bhref\s*[:=]\s*\{?\s*[`"']([^`"']+)[`"']/g,
    /\b(?:router\.(?:push|replace)|redirect)\(\s*[`"']([^`"']+)[`"']/g,
  ];

  for (const re of patterns) {
    let match: RegExpExecArray | null;
    while ((match = re.exec(src))) out.push(match[1]);
  }

  return out;
}

function toResolvableAdminPath(raw: string): string | null {
  let href = raw.split("?")[0].split("#")[0];
  if (!href.startsWith("/admin")) return null;
  href = href.replace(/\$\{[^}]*\}/g, "_p_").replace(/\[[^\]]*\]/g, "_p_");
  if (href.includes("${") || href.includes("`")) return null;
  return href.replace(/\/+$/, "") || "/";
}

describe("admin link integrity", () => {
  it("every hard-coded admin navigation href resolves to a real route", () => {
    const files = SCAN_DIRS.flatMap((dir) => collectSourceFiles(dir));
    expect(files.length).toBeGreaterThan(20);

    const broken = new Map<string, Set<string>>();
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      for (const raw of extractNavigationTargets(src)) {
        const urlPath = toResolvableAdminPath(raw);
        if (!urlPath) continue;
        if (resolveAppRoute(urlPath)) continue;
        if (!broken.has(urlPath)) broken.set(urlPath, new Set());
        broken.get(urlPath)!.add(path.relative(SRC_ROOT, file));
      }
    }

    const report = [...broken.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([href, srcs]) => `  ${href}\n      <- ${[...srcs].sort().join(", ")}`)
      .join("\n");

    expect(
      broken.size,
      `Admin links pointing at non-existent routes:\n${report}`,
    ).toBe(0);
  });
});
