import { describe, it, expect } from "vitest";
import { confidenceFor } from "./confidence";
import type { ConfidenceLevel } from "./confidence";

describe("confidenceFor", () => {
  // Exact boundary values per DESIGN.md §6
  it("returns 'High' when count is exactly 30", () => {
    const result: ConfidenceLevel = confidenceFor(30);
    expect(result).toBe("High");
  });

  it("returns 'High' when count is above 30", () => {
    expect(confidenceFor(31)).toBe("High");
    expect(confidenceFor(1000)).toBe("High");
  });

  it("returns 'Medium' when count is exactly 29 (boundary below High)", () => {
    expect(confidenceFor(29)).toBe("Medium");
  });

  it("returns 'Medium' when count is exactly 10", () => {
    expect(confidenceFor(10)).toBe("Medium");
  });

  it("returns 'Medium' when count is between 10 and 29 inclusive", () => {
    expect(confidenceFor(15)).toBe("Medium");
    expect(confidenceFor(20)).toBe("Medium");
  });

  it("returns 'Low' when count is exactly 9 (boundary below Medium)", () => {
    expect(confidenceFor(9)).toBe("Low");
  });

  it("returns 'Low' when count is exactly 5", () => {
    expect(confidenceFor(5)).toBe("Low");
  });

  it("returns 'Low' when count is between 5 and 9 inclusive", () => {
    expect(confidenceFor(6)).toBe("Low");
    expect(confidenceFor(7)).toBe("Low");
    expect(confidenceFor(8)).toBe("Low");
  });

  it("returns 'Insufficient' when count is exactly 4 (boundary below Low)", () => {
    expect(confidenceFor(4)).toBe("Insufficient");
  });

  it("returns 'Insufficient' when count is 0", () => {
    expect(confidenceFor(0)).toBe("Insufficient");
  });

  it("returns 'Insufficient' when count is 1", () => {
    expect(confidenceFor(1)).toBe("Insufficient");
  });

  it("returns 'Insufficient' when count is 3", () => {
    expect(confidenceFor(3)).toBe("Insufficient");
  });
});
