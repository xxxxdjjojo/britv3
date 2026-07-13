import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Focus-visible guard.
 *
 * Locks:
 * (a) :focus-visible rule exists and uses var(--ring)
 * (b) .focus-ring uses var(--ring) and NOT #2563EB
 * (c) #2563EB appears ONLY as CSS custom-property values (token defs), never
 *     in outline or .focus-ring context
 * (d) micro type tokens --text-2xs and --text-3xs exist in the @theme block
 */

const globalsCss = readFileSync(
  join(process.cwd(), "src/app/globals.css"),
  "utf8",
);

// Pull the @theme inline { … } block for token assertions
const themeBlock = (() => {
  const start = globalsCss.indexOf("@theme inline {");
  if (start === -1) return "";
  let depth = 0;
  let i = start;
  while (i < globalsCss.length) {
    if (globalsCss[i] === "{") depth++;
    else if (globalsCss[i] === "}") {
      depth--;
      if (depth === 0) return globalsCss.slice(start, i + 1);
    }
    i++;
  }
  return globalsCss.slice(start);
})();

describe("focus-visible ring", () => {
  it("globals.css contains a :focus-visible rule", () => {
    expect(globalsCss).toContain(":focus-visible");
  });

  it(":focus-visible rule uses var(--ring) for outline", () => {
    // Find the :focus-visible block and verify it uses var(--ring)
    const focusVisibleIdx = globalsCss.indexOf(":focus-visible {");
    expect(focusVisibleIdx).toBeGreaterThan(-1);
    const block = globalsCss.slice(focusVisibleIdx, focusVisibleIdx + 200);
    expect(block).toContain("var(--ring)");
  });

  it("[data-slot]:focus-visible opt-out rule exists", () => {
    expect(globalsCss).toContain("[data-slot]:focus-visible");
  });
});

describe(".focus-ring utility", () => {
  it(".focus-ring uses var(--ring) not a hardcoded colour", () => {
    const focusRingIdx = globalsCss.indexOf(".focus-ring {");
    expect(focusRingIdx).toBeGreaterThan(-1);
    const block = globalsCss.slice(focusRingIdx, focusRingIdx + 150);
    expect(block).toContain("var(--ring)");
    expect(block).not.toContain("#2563EB");
  });
});

describe("#2563EB colour usage", () => {
  it("is only used as CSS custom-property values, never in outline or .focus-ring", () => {
    // Split into lines for targeted checks
    const lines = globalsCss.split("\n");

    // Allowlist: lines that define a CSS custom property with #2563EB as a value
    // Pattern: --<word>: #2563EB (with optional whitespace). Case-insensitive so
    // a lowercase `#2563eb` is still both detected and correctly allowlisted.
    const hexPattern = /#2563eb/i;
    const allowPattern = /--[\w-]+\s*:\s*#2563eb/i;

    // Lines that contain #2563EB but are NOT custom-property definitions are banned
    const bannedLines = lines.filter((line) => {
      if (!hexPattern.test(line)) return false;
      // If it's an allowlisted custom-property definition, skip
      if (allowPattern.test(line)) return false;
      // Anything else with #2563EB is a violation
      return true;
    });

    expect(bannedLines).toHaveLength(0);
  });

  it("the four token defs for #2563EB are still present", () => {
    // --color-brand-accent, --color-info, --chart-4 (light), --chart-3 (dark)
    const tokenLines = globalsCss
      .split("\n")
      .filter((l) => l.includes("#2563EB") && /--[\w-]+\s*:\s*#2563EB/.test(l));
    expect(tokenLines.length).toBeGreaterThanOrEqual(4);
  });
});

describe("micro type tokens in @theme block", () => {
  it("defines --text-2xs", () => {
    expect(themeBlock).toContain("--text-2xs");
  });

  it("defines --text-2xs--line-height", () => {
    expect(themeBlock).toContain("--text-2xs--line-height");
  });

  it("defines --text-3xs", () => {
    expect(themeBlock).toContain("--text-3xs");
  });

  it("defines --text-3xs--line-height", () => {
    expect(themeBlock).toContain("--text-3xs--line-height");
  });
});
