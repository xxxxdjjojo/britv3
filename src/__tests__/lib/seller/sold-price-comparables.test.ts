import { describe, it, expect } from "vitest";
import {
  POUNDS_TO_PENCE,
  parseCsvLine,
  parseLandRegistryComparables,
  averageSoldPrice,
  soldPriceRange,
  classifyComparableEvidence,
} from "@/lib/seller/sold-price-comparables";

// Synthetic Land Registry PPD rows (no header — the live feed omits one).
// Columns: 0 guid, 1 price (pounds), 2 date, 3 postcode, 4 type, 5 old/new,
// 6 duration, 7 PAON, 8 SAON, 9 street, ...
function row(price: number, postcode = "SW1A 1AA", date = "2024-03-01 00:00"): string {
  return `"{guid}","${price}","${date}","${postcode}","T","N","F","12","","ELM ROAD","","LONDON","CITY OF WESTMINSTER","GREATER LONDON","A","A"`;
}

describe("parseCsvLine", () => {
  it("splits a simple quoted row into trimmed fields", () => {
    expect(parseCsvLine('"a","b","c"')).toEqual(["a", "b", "c"]);
  });

  it("keeps commas inside quoted fields", () => {
    const fields = parseCsvLine('"12, FLAT B","350000","ELM ROAD, LONDON"');
    expect(fields[0]).toBe("12, FLAT B");
    expect(fields[2]).toBe("ELM ROAD, LONDON");
  });

  it("unescapes doubled double-quotes", () => {
    expect(parseCsvLine('"the ""old"" mill","100"')).toEqual(['the "old" mill', "100"]);
  });
});

describe("parseLandRegistryComparables — price scaling", () => {
  it("scales whole-pound prices into pence (£350,000 -> 35,000,000)", () => {
    const [comp] = parseLandRegistryComparables(row(350000), "SW1A 1AA");
    expect(comp.price).toBe(350000 * POUNDS_TO_PENCE);
    expect(comp.price).toBe(35000000);
  });

  it("maps property type and tenure codes to labels", () => {
    const [comp] = parseLandRegistryComparables(row(350000), "SW1A 1AA");
    expect(comp.property_type).toBe("Terraced");
    expect(comp.tenure).toBe("Freehold");
  });

  it("normalises the sale date to YYYY-MM-DD", () => {
    const [comp] = parseLandRegistryComparables(row(350000, "SW1A 1AA", "2024-03-01 00:00"), "SW1A 1AA");
    expect(comp.sale_date).toBe("2024-03-01");
  });
});

describe("parseLandRegistryComparables — header handling", () => {
  it("skips a header row when the price column is non-numeric", () => {
    const header = '"transaction_id","price_paid","date","postcode","type","oldnew","duration","paon","saon","street"';
    const comps = parseLandRegistryComparables(`${header}\n${row(350000)}`, "SW1A 1AA");
    expect(comps).toHaveLength(1);
    expect(comps[0].price).toBe(35000000);
  });

  it("does NOT drop the first record when there is no header", () => {
    const comps = parseLandRegistryComparables(`${row(350000)}\n${row(400000)}`, "SW1A 1AA");
    expect(comps).toHaveLength(2);
  });

  it("returns an empty array for empty input", () => {
    expect(parseLandRegistryComparables("", "SW1A 1AA")).toEqual([]);
  });

  it("skips rows with a missing or non-positive price", () => {
    const comps = parseLandRegistryComparables(`${row(0)}\n${row(350000)}`, "SW1A 1AA");
    expect(comps).toHaveLength(1);
    expect(comps[0].price).toBe(35000000);
  });

  it("respects the limit", () => {
    const csv = [row(100000), row(200000), row(300000)].join("\n");
    expect(parseLandRegistryComparables(csv, "SW1A 1AA", 2)).toHaveLength(2);
  });
});

describe("averageSoldPrice", () => {
  it("returns the rounded mean in pence", () => {
    const comps = parseLandRegistryComparables(`${row(300000)}\n${row(400000)}`, "SW1A 1AA");
    expect(averageSoldPrice(comps)).toBe(35000000);
  });

  it("returns 0 for no comparables", () => {
    expect(averageSoldPrice([])).toBe(0);
  });
});

describe("soldPriceRange", () => {
  it("reports the actual lowest and highest sale, not a fabricated +/-10%", () => {
    const comps = parseLandRegistryComparables(
      [row(300000), row(500000), row(420000)].join("\n"),
      "SW1A 1AA",
    );
    expect(soldPriceRange(comps)).toEqual({ low: 30000000, high: 50000000 });
  });

  it("returns zeros for no comparables", () => {
    expect(soldPriceRange([])).toEqual({ low: 0, high: 0 });
  });
});

describe("classifyComparableEvidence", () => {
  it("buckets the count into honest evidence strength", () => {
    expect(classifyComparableEvidence(0)).toBe("unavailable");
    expect(classifyComparableEvidence(1)).toBe("low");
    expect(classifyComparableEvidence(2)).toBe("low");
    expect(classifyComparableEvidence(3)).toBe("medium");
    expect(classifyComparableEvidence(4)).toBe("medium");
    expect(classifyComparableEvidence(5)).toBe("high");
    expect(classifyComparableEvidence(20)).toBe("high");
  });
});
