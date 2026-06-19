import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { formatFindings, scanLegacyBrandReferences } from "../../../scripts/check-legacy-brand-references";

const tempRoots: string[] = [];

function createFixture(files: Record<string, string | Buffer>): string {
  const root = mkdtempSync(join(tmpdir(), "legacy-brand-scan-"));
  tempRoots.push(root);

  for (const [relativePath, contents] of Object.entries(files)) {
    const absolutePath = join(root, relativePath);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, contents);
  }

  return root;
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

describe("legacy brand scanner", () => {
  it("reports unapproved Britestate content with exact file and line", async () => {
    const rootDir = createFixture({
      "src/page.tsx": "const currentBrand = \"TrueDeed\";\nconst legacyBrand = \"Britestate\";\n",
    });

    const result = await scanLegacyBrandReferences({
      rootDir,
      trackedFiles: ["src/page.tsx"],
      allowlistPatterns: [],
    });

    expect(result.findings).toEqual([
      expect.objectContaining({
        kind: "content",
        path: "src/page.tsx",
        line: 2,
        match: "Britestate",
      }),
    ]);
    expect(formatFindings(result.findings)).toContain("src/page.tsx:2");
  });

  it("reports legacy brand references in source-controlled filenames", async () => {
    const rootDir = createFixture({
      "src/BritestateBadge.tsx": "export const badge = \"TrueDeed\";\n",
    });

    const result = await scanLegacyBrandReferences({
      rootDir,
      trackedFiles: ["src/BritestateBadge.tsx"],
      allowlistPatterns: [],
    });

    expect(result.findings).toEqual([
      expect.objectContaining({
        kind: "filename",
        path: "src/BritestateBadge.tsx",
        line: 1,
        match: "Britestate",
      }),
    ]);
    expect(formatFindings(result.findings)).toContain("src/BritestateBadge.tsx:1");
  });

  it("honors explicit allowlist patterns", async () => {
    const rootDir = createFixture({
      "docs/legacy.md": "Historical note: Britestate was the previous brand.\n",
    });

    const result = await scanLegacyBrandReferences({
      rootDir,
      trackedFiles: ["docs/legacy.md"],
      allowlistPatterns: ["docs/legacy.md"],
    });

    expect(result.findings).toEqual([]);
  });

  it("reports unknown binary files instead of silently skipping them", async () => {
    const rootDir = createFixture({
      "src/payload.custom": Buffer.from([0, 159, 146, 150]),
    });

    const result = await scanLegacyBrandReferences({
      rootDir,
      trackedFiles: ["src/payload.custom"],
      allowlistPatterns: [],
    });

    expect(result.findings).toEqual([
      expect.objectContaining({
        kind: "unknown-binary",
        path: "src/payload.custom",
      }),
    ]);
    expect(formatFindings(result.findings)).toContain("src/payload.custom");
  });
});
