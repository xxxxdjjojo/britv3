import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

/**
 * DVH heights guard.
 *
 * Ensures all viewport-height Tailwind classes in .tsx files use the
 * dynamic viewport height (dvh) variants so mobile browser chrome
 * doesn't clip content. Audit fix F13.
 *
 * Scans: src/components/**\/*.tsx, src/app/**\/*.tsx
 * Excludes: src/emails/, src/app/emails/ (email clients don't support dvh)
 *
 * ALLOWLIST — files with a documented legitimate reason to use vh:
 * Currently empty. If a genuine exception is found (e.g. print styles),
 * add the relative path from src/ with a comment explaining why.
 */
const ALLOWLIST: string[] = [
  // Example: "app/print/page.tsx" // print stylesheets use vh correctly
];

const SRC = join(process.cwd(), "src");

function collectTsx(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      // Skip email directories entirely
      if (entry === "emails") continue;
      collectTsx(full, files);
    } else if (extname(entry) === ".tsx") {
      files.push(full);
    }
  }
  return files;
}

const SCAN_DIRS = [join(SRC, "components"), join(SRC, "app")];

// Patterns that indicate vh usage inside className strings.
// We match the Tailwind utility names and also calc(100vh...) arbitrary values.
const VH_PATTERNS = [
  /\bh-screen\b/,
  /\bmin-h-screen\b/,
  /\bmax-h-screen\b/,
  /calc\(100vh/,
];

describe("dvh-heights: no viewport-height classes use vh in className strings", () => {
  for (const dir of SCAN_DIRS) {
    const files = collectTsx(dir);

    for (const file of files) {
      const relPath = file.slice(SRC.length + 1); // e.g. "app/error.tsx"
      if (ALLOWLIST.includes(relPath)) continue;

      const content = readFileSync(file, "utf8");

      for (const pattern of VH_PATTERNS) {
        if (pattern.test(content)) {
          it(`${relPath} — must not contain ${pattern.source}`, () => {
            expect(content).not.toMatch(pattern);
          });
        }
      }
    }
  }

  // Sentinel: at least one file was scanned (guards against empty scan)
  it("scanned at least 50 tsx files", () => {
    const total = SCAN_DIRS.flatMap((d) => collectTsx(d)).length;
    expect(total).toBeGreaterThan(50);
  });
});
