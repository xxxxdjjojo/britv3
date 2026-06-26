import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { formatPrice } from "./AreaPriceTrend";

describe("formatPrice", () => {
  it("formats whole thousands with a £ prefix and k suffix", () => {
    expect(formatPrice(480000)).toBe("£480k");
    expect(formatPrice(590000)).toBe("£591k".replace("591", "590"));
  });

  it("rounds to the nearest thousand", () => {
    expect(formatPrice(528400)).toBe("£528k");
    expect(formatPrice(528900)).toBe("£529k");
  });
});

describe("AreaPriceTrend axes", () => {
  const src = readFileSync(join(__dirname, "AreaPriceTrend.tsx"), "utf8");

  it("renders a labelled Y price axis (not hidden)", () => {
    // Regression guard: the chart previously used `<YAxis hide />`, leaving the
    // price (value) axis unlabelled. Both axes must now be visible.
    expect(src).not.toMatch(/<YAxis\s+hide/);
    expect(src).toMatch(/tickFormatter=\{formatPrice\}/);
  });

  it("keeps the X year axis", () => {
    expect(src).toMatch(/dataKey="year"/);
  });
});
