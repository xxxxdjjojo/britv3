import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Every `/tools/*` calculator page must render its title through the shared
 * `CalculatorPageHeader` component so size, weight, and alignment stay
 * consistent. The original bug was each page hand-rolling its own <h1>:
 * Stamp Duty was centered `text-4xl font-bold`, Mortgage was left
 * `md:text-5xl font-extrabold`, etc. This guards against regression.
 */
const TOOL_SLUGS = [
  "stamp-duty-calculator",
  "mortgage-calculator",
  "affordability-calculator",
  "rental-yield-calculator",
  "buy-vs-rent-calculator",
  "energy-bill-estimator",
  "mortgage-comparison",
  "remortgage-calculator",
  "moving-cost-estimator",
  "first-time-buyer-guide",
  "rent-affordability-calculator",
] as const;

const TOOLS_DIR = join(process.cwd(), "src/app/(main)/tools");

function readToolPage(slug: string): string {
  return readFileSync(join(TOOLS_DIR, slug, "page.tsx"), "utf8");
}

describe("calculator page header consistency", () => {
  it.each(TOOL_SLUGS)("%s renders its title via CalculatorPageHeader", (slug) => {
    const src = readToolPage(slug);
    expect(src).toContain("CalculatorPageHeader");
  });

  it.each(TOOL_SLUGS)("%s has no hand-rolled <h1> heading", (slug) => {
    const src = readToolPage(slug);
    // The page title <h1> now lives inside CalculatorPageHeader. A raw <h1>
    // in the page means a drifting, hand-rolled title.
    expect(src).not.toMatch(/<h1[\s>]/);
  });

  it.each(TOOL_SLUGS)("%s does not centre-align its hero", (slug) => {
    const src = readToolPage(slug);
    const heroRegion = src.slice(0, src.indexOf("CalculatorPageHeader"));
    // No `text-center` should wrap the title region above the shared header.
    expect(heroRegion).not.toMatch(/text-center[^"]*"\s*>\s*\n\s*<h1/);
  });
});
