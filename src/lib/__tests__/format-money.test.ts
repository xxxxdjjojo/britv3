import { describe, it, expect } from "vitest";
import { fmtGbp, penceToPounds, poundsToPence } from "../format-money";

describe("fmtGbp", () => {
  it("formats 12345 pence as £123.45", () => {
    expect(fmtGbp(12345)).toBe("£123.45");
  });

  it("formats 0 pence as £0.00", () => {
    expect(fmtGbp(0)).toBe("£0.00");
  });

  it("handles negative amounts", () => {
    expect(fmtGbp(-500)).toBe("-£5.00");
  });

  it("formats large amounts with commas", () => {
    expect(fmtGbp(1234567)).toBe("£12,345.67");
  });
});

describe("penceToPounds", () => {
  it("converts 12345 pence to 123.45 pounds", () => {
    expect(penceToPounds(12345)).toBe(123.45);
  });

  it("converts 0 pence to 0", () => {
    expect(penceToPounds(0)).toBe(0);
  });
});

describe("poundsToPence", () => {
  it("converts 123.45 pounds to 12345 pence", () => {
    expect(poundsToPence(123.45)).toBe(12345);
  });

  it("rounds to nearest pence", () => {
    expect(poundsToPence(10.999)).toBe(1100);
  });

  it("converts 0 to 0", () => {
    expect(poundsToPence(0)).toBe(0);
  });
});
