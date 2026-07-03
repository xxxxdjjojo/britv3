import { describe, expect, it } from "vitest";
import {
  buildPressPack,
  formatCount,
  formatPounds,
  formatSignedGapPct,
  pressPackToPlainText,
  type PressPackInput,
} from "./templates";

function input(overrides: Partial<PressPackInput> = {}): PressPackInput {
  return {
    areaName: "Ealing",
    areaId: "ealing",
    period: "2026-Q2",
    gapPct: 4.25,
    medianAsking: 512500,
    medianSold: 491000,
    sampleAsking: 1234,
    sampleSold: 5678,
    rank: 12,
    totalRanked: 87,
    ...overrides,
  };
}

describe("formatting helpers", () => {
  it("formats pounds with commas and no pence", () => {
    expect(formatPounds(512500)).toBe("£512,500");
    expect(formatPounds(950)).toBe("£950");
  });

  it("formats the gap signed to one decimal place", () => {
    expect(formatSignedGapPct(4.25)).toBe("+4.3%");
    expect(formatSignedGapPct(-1.34)).toBe("−1.3%");
    expect(formatSignedGapPct(0)).toBe("0.0%");
  });

  it("formats counts with commas", () => {
    expect(formatCount(5678)).toBe("5,678");
  });
});

describe("buildPressPack", () => {
  it("writes an 'above' headline for a positive gap", () => {
    const pack = buildPressPack(input({ gapPct: 4.25 }));
    expect(pack.headline).toBe(
      "Asking prices in Ealing were 4.3% above what buyers actually paid",
    );
  });

  it("writes a 'below' headline for a negative gap", () => {
    const pack = buildPressPack(input({ gapPct: -2.1 }));
    expect(pack.headline).toBe(
      "Asking prices in Ealing were 2.1% below what buyers actually paid",
    );
  });

  it("writes a 'matched' headline for a zero gap", () => {
    const pack = buildPressPack(input({ gapPct: 0 }));
    expect(pack.headline).toBe(
      "Asking prices in Ealing matched what buyers actually paid",
    );
  });

  it("p1 carries the local finding with formatted medians, gap and samples", () => {
    const [p1] = buildPressPack(input()).paragraphs;
    expect(p1).toContain("In 2026-Q2");
    expect(p1).toContain("£512,500");
    expect(p1).toContain("£491,000");
    expect(p1).toContain("+4.3%");
    expect(p1).toContain("1,234 asking prices");
    expect(p1).toContain("5,678 recorded sales");
  });

  it("p2 states the league position", () => {
    const [, p2] = buildPressPack(input()).paragraphs;
    expect(p2).toContain(
      "12 of 87 districts ranked in TrueDeed's Postcode Truth League",
    );
  });

  it("p3 is hedged and flips meaning with the sign", () => {
    const above = buildPressPack(input({ gapPct: 3 })).paragraphs[2];
    expect(above).toContain("sell for less than their asking prices");
    expect(above).toContain("not a guarantee");

    const below = buildPressPack(input({ gapPct: -3 })).paragraphs[2];
    expect(below).toContain("sell for more than their asking prices");
    expect(below).toContain("not a guarantee");
  });

  it("carries the fixed methodology boilerplate and TrueDeed attribution", () => {
    const pack = buildPressPack(input());
    expect(pack.boilerplate).toContain("HM Land Registry Price Paid Data");
    expect(pack.boilerplate).toContain("trailing 12-month window");
    expect(pack.boilerplate).toContain("at least 20 asking prices");
    expect(pack.boilerplate).toContain("at least 100");
    expect(pack.boilerplate).toContain("three");
    expect(pack.attribution).toBe(
      "Data: TrueDeed (truedeed.co.uk/reports/reality-gap)",
    );
  });

  it("never invents figures — every number in the copy traces to an input", () => {
    const data = input();
    const pack = buildPressPack(data);
    const allowed = new Set([
      // Formatted forms of every numeric input (comma groups split below).
      ...formatPounds(data.medianAsking).replace("£", "").split(","),
      ...formatPounds(data.medianSold).replace("£", "").split(","),
      ...formatSignedGapPct(data.gapPct).replace(/[+−%]/g, "").split("."),
      ...formatCount(data.sampleAsking).split(","),
      ...formatCount(data.sampleSold).split(","),
      String(data.rank),
      String(data.totalRanked),
      // Period components ("2026-Q2").
      ...data.period.match(/\d+/g)!,
    ]);

    const copy = [pack.headline, ...pack.paragraphs].join(" ");
    for (const token of copy.match(/\d+/g) ?? []) {
      expect(allowed.has(token), `untraceable number "${token}"`).toBe(true);
    }
  });

  it("pressPackToPlainText stitches headline, paragraphs, boilerplate and attribution", () => {
    const pack = buildPressPack(input());
    const text = pressPackToPlainText(pack);
    expect(text.startsWith(pack.headline)).toBe(true);
    for (const paragraph of pack.paragraphs) expect(text).toContain(paragraph);
    expect(text).toContain(pack.boilerplate);
    expect(text.trimEnd().endsWith(pack.attribution)).toBe(true);
  });
});
