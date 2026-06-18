import { describe, it, expect } from "vitest";
import { valuate } from "./engine";
import type { RawComparable } from "./engine";
import type { ValuationSubject } from "@/types/valuation";

const subject: ValuationSubject = {
  postcode: "SW18 4QN",
  outwardCode: "SW18",
  propertyType: "T",
  tenure: "F",
  newBuild: false,
  bedrooms: 3,
  bathrooms: 1,
  floorAreaSqm: null,
  condition: "average",
  paon: "10",
  saon: null,
  street: "DUNTSHILL ROAD",
};

function comp(partial: Partial<RawComparable> & { transactionId: string; price: number; saleDate: string }): RawComparable {
  return {
    postcode: "SW18 4QN",
    outwardCode: "SW18",
    propertyType: "T",
    newBuild: false,
    tenure: "F",
    paon: "1",
    saon: null,
    street: "DUNTSHILL ROAD",
    distanceMetres: 120,
    ppdCategory: "A",
    recordStatus: "A",
    bedrooms: 3,
    ...partial,
  };
}

const OPTS = { valuationDate: "2026-02-27", dataCutoffDate: "2026-02-27" };

describe("valuate", () => {
  it("returns a rounded estimate with a range from strong comparables", () => {
    const candidates: RawComparable[] = [
      comp({ transactionId: "t1", price: 600_000, saleDate: "2025-12-01" }),
      comp({ transactionId: "t2", price: 610_000, saleDate: "2025-11-01" }),
      comp({ transactionId: "t3", price: 595_000, saleDate: "2025-10-01" }),
      comp({ transactionId: "t4", price: 605_000, saleDate: "2026-01-15" }),
      comp({ transactionId: "t5", price: 590_000, saleDate: "2025-09-01" }),
      comp({ transactionId: "t6", price: 615_000, saleDate: "2026-02-01" }),
    ];
    const r = valuate(subject, candidates, OPTS);
    expect(r.estimatedValue).not.toBeNull();
    expect(r.estimatedValue! % 5000).toBe(0); // rounded, no false precision
    expect(r.estimatedValue!).toBeGreaterThan(560_000);
    expect(r.estimatedValue!).toBeLessThan(650_000);
    expect(r.estimatedLow!).toBeLessThan(r.estimatedValue!);
    expect(r.estimatedHigh!).toBeGreaterThan(r.estimatedValue!);
    expect(r.modelVersion).toBe("vmp-comparables-1.0.0");
    expect(r.comparableSales.length).toBeGreaterThan(0);
  });

  it("declines to invent a price when there is no usable evidence (Level E)", () => {
    const r = valuate(subject, [], OPTS);
    expect(r.estimatedValue).toBeNull();
    expect(r.fallbackLevel).toBe("E");
    expect(r.evidenceQuality).toBe("unavailable");
    expect(r.limitations.join(" ").toLowerCase()).toContain("agent");
  });

  it("is not blown up by one anomalous sale and excludes ineligible records", () => {
    const candidates: RawComparable[] = [
      comp({ transactionId: "t1", price: 600_000, saleDate: "2025-12-01" }),
      comp({ transactionId: "t2", price: 610_000, saleDate: "2025-11-01" }),
      comp({ transactionId: "t3", price: 595_000, saleDate: "2025-10-01" }),
      comp({ transactionId: "t4", price: 9_000_000, saleDate: "2026-01-15" }), // anomaly
      comp({ transactionId: "tB", price: 250_000, saleDate: "2026-01-10", ppdCategory: "B" }), // excluded
      comp({ transactionId: "tD", price: 250_000, saleDate: "2026-01-10", recordStatus: "D" }), // excluded
    ];
    const r = valuate(subject, candidates, OPTS);
    expect(r.estimatedValue!).toBeLessThan(1_000_000);
    // category B and deleted records must not appear as evidence
    const ids = r.comparableSales.map((c) => c.transactionId);
    expect(ids).not.toContain("tB");
    expect(ids).not.toContain("tD");
  });

  it("widens the range and lowers evidence quality for weak evidence", () => {
    const strong: RawComparable[] = Array.from({ length: 8 }, (_, i) =>
      comp({ transactionId: `s${i}`, price: 600_000 + i * 2000, saleDate: "2026-01-01", distanceMetres: 100 }),
    );
    const weak: RawComparable[] = [
      comp({ transactionId: "w1", price: 600_000, saleDate: "2023-04-01", distanceMetres: 3000, propertyType: "F" }),
      comp({ transactionId: "w2", price: 650_000, saleDate: "2023-06-01", distanceMetres: 3500, propertyType: "F" }),
    ];
    const strongR = valuate(subject, strong, OPTS);
    const weakR = valuate(subject, weak, OPTS);
    const strongWidth = strongR.estimatedHigh! - strongR.estimatedLow!;
    const weakWidth = weakR.estimatedHigh! - weakR.estimatedLow!;
    expect(weakWidth / weakR.estimatedValue!).toBeGreaterThan(strongWidth / strongR.estimatedValue!);
  });

  it("is deterministic for the same inputs and model version", () => {
    const candidates: RawComparable[] = [
      comp({ transactionId: "t1", price: 600_000, saleDate: "2025-12-01" }),
      comp({ transactionId: "t2", price: 610_000, saleDate: "2025-11-01" }),
      comp({ transactionId: "t3", price: 595_000, saleDate: "2025-10-01" }),
    ];
    const a = valuate(subject, candidates, OPTS);
    const b = valuate(subject, candidates, OPTS);
    expect(a).toEqual(b);
  });
});
