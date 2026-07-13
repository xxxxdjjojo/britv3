import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Search surface form-control sizing guard (PR-3 — F11/F12).
 *
 * Locks the 16px mobile font floor on every raw <input> and <select> in
 * RefineFilters (prevents iOS auto-zoom on focus) and the sort <select>
 * on the search page.
 *
 * Also locks the mobile bottom-sheet pattern for SearchFilters (PR-3 task 2):
 * - side="bottom" for the mobile sheet
 * - sticky Apply footer referencing the result count
 */

const ROOT = join(process.cwd(), "src");

const refineFiltersSrc = readFileSync(
  join(ROOT, "components/search/RefineFilters.tsx"),
  "utf8",
);

const searchPageSrc = readFileSync(
  join(ROOT, "app/(main)/search/page.tsx"),
  "utf8",
);

const searchFiltersSrc = readFileSync(
  join(ROOT, "components/search/SearchFilters.tsx"),
  "utf8",
);

// ---------------------------------------------------------------------------
// RefineFilters font floor
// ---------------------------------------------------------------------------

describe("RefineFilters — mobile font floor", () => {
  it("uses text-base md:text-sm pattern (not bare text-sm) on form controls", () => {
    // Must contain the pattern at least once (location / keywords / selects etc.)
    expect(refineFiltersSrc).toMatch(/text-base md:text-sm/);
  });

  it("does not contain a bare ' text-sm ' class string on input/select className lines", () => {
    // Match lines that set className on a raw <input> or <select> form control.
    // The check ignores <label>, <span>, <button> and other non-input elements
    // since those don't trigger iOS auto-zoom.
    // Strategy: collect the string content of each <input> and <select> element
    // by matching multi-line blocks that start with <input or <select and capture
    // their className value.
    const lines = refineFiltersSrc.split("\n");

    // Find lines that have a className= AND carry 'h-11' or 'h-12' (all our
    // raw inputs/selects have an explicit height class). This reliably targets
    // only the input/select className attributes and excludes labels, spans, buttons.
    const formControlClassLines = lines.filter(
      (line) =>
        /className=/.test(line) &&
        /\bh-(?:11|12)\b/.test(line) &&
        /text-sm/.test(line),
    );

    const bareTextSm = formControlClassLines.filter(
      (line) => /\btext-sm\b/.test(line) && !/\btext-base\b/.test(line),
    );

    expect(
      bareTextSm,
      `Found input/select className lines with bare text-sm (no text-base) in RefineFilters:\n${bareTextSm.join("\n")}`,
    ).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Sort select on search page
// ---------------------------------------------------------------------------

describe("search/page.tsx sort select — mobile font floor", () => {
  it("sort select uses text-base md:text-sm", () => {
    // The sort select has aria-label="Sort results". The line with its className
    // must contain text-base md:text-sm.
    const sortSelectBlock = (() => {
      const idx = searchPageSrc.indexOf('aria-label="Sort results"');
      if (idx === -1) return "";
      // Grab the surrounding ~300 chars to capture the className
      return searchPageSrc.slice(Math.max(0, idx - 50), idx + 300);
    })();

    expect(sortSelectBlock).not.toBe("");
    expect(sortSelectBlock).toMatch(/text-base[\s\S]{0,30}md:text-sm/);
  });
});

// ---------------------------------------------------------------------------
// SearchFilters — mobile bottom sheet (PR-3 task 2)
// ---------------------------------------------------------------------------

describe("SearchFilters — mobile sheet is a bottom sheet", () => {
  it('mobile sheet uses side="bottom" (not side="left")', () => {
    // The mobile branch uses side="bottom" for thumb-reachability.
    expect(searchFiltersSrc).toContain('side="bottom"');
    expect(searchFiltersSrc).not.toContain('side="left"');
  });

  it("mobile sheet has max-h-[85dvh] to cap height on tall phones", () => {
    expect(searchFiltersSrc).toContain("max-h-[85dvh]");
  });

  it("mobile sheet has an Apply footer that references the result count prop", () => {
    // The Apply CTA label must include the resultCount prop reference so the
    // count is surfaced to the user before they close the sheet.
    expect(searchFiltersSrc).toMatch(/resultCount/);
  });

  it("mobile sheet Apply button closes the sheet via onOpenChange(false)", () => {
    // The Apply handler must call onOpenChange(false) to dismiss the sheet.
    expect(searchFiltersSrc).toMatch(/onOpenChange\s*\(\s*false\s*\)/);
  });
});

// ---------------------------------------------------------------------------
// search/page.tsx — bottom-sheet guard (already-implemented reference)
// ---------------------------------------------------------------------------

describe("search/page.tsx — mobile filter sheet is bottom sheet w/ count", () => {
  it('SheetContent uses side="bottom"', () => {
    expect(searchPageSrc).toContain('side="bottom"');
  });

  it("SheetContent has max-h-[85dvh]", () => {
    expect(searchPageSrc).toContain("max-h-[85dvh]");
  });

  it("Apply footer references the preview result count", () => {
    // The sticky footer must show a count (previewCount) to the user.
    expect(searchPageSrc).toMatch(/previewCount/);
  });
});
