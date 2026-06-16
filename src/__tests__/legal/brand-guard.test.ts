import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

const NEW_LEGAL_PAGES = [
  "src/app/(main)/legal/fair-housing/page.tsx",
  "src/app/(main)/legal/refunds/page.tsx",
  "src/app/(main)/legal/third-party-services/page.tsx",
  "src/app/(main)/legal/regulatory/page.tsx",
  "src/app/(main)/legal/professional-standards/page.tsx",
] as const;

const BANNED: ReadonlyArray<{ label: string; re: RegExp }> = [
  { label: "blue brand-accent token", re: /\bbrand-accent\b/ },
  { label: "tailwind blue utility", re: /\b(?:text|bg|border|from|to|via|ring)-blue-\d{2,3}\b/ },
  { label: "hard-coded blue hex #2563EB", re: /#2563eb/i },
  { label: "leftover EstateLegal branding", re: /EstateLegal/ },
  { label: "Material Symbols icon font", re: /material-symbols/i },
  {
    label: 'placeholder href="#"',
    re: /href\s*=\s*(?:"#"|'#'|\{\s*(?:"#"|'#'|`#`)\s*\})/,
  },
];

describe("new legal pages brand guard", () => {
  it.each(NEW_LEGAL_PAGES)("%s contains no banned patterns", (filePath) => {
    const source = readFileSync(join(ROOT, filePath), "utf8");
    const hits = BANNED.filter(({ re }) => re.test(source)).map(({ label }) => label);
    expect(hits).toEqual([]);
  });
});
