import { describe, it, expect } from "vitest";
import { classifyConfidence, hasSufficientData } from "./confidence";

describe("classifyConfidence", () => {
  it("classifies High at >= 30", () => {
    expect(classifyConfidence(30)).toBe("High");
    expect(classifyConfidence(42)).toBe("High");
  });
  it("classifies Medium at >= 10 and < 30", () => {
    expect(classifyConfidence(10)).toBe("Medium");
    expect(classifyConfidence(29)).toBe("Medium");
  });
  it("classifies Low at >= 5 and < 10", () => {
    expect(classifyConfidence(5)).toBe("Low");
    expect(classifyConfidence(9)).toBe("Low");
  });
  it("classifies Insufficient below 5", () => {
    expect(classifyConfidence(4)).toBe("Insufficient");
    expect(classifyConfidence(0)).toBe("Insufficient");
  });
});

describe("hasSufficientData", () => {
  it("is true at the Low threshold and above", () => {
    expect(hasSufficientData(5)).toBe(true);
    expect(hasSufficientData(100)).toBe(true);
  });
  it("is false below the Low threshold", () => {
    expect(hasSufficientData(4)).toBe(false);
  });
});
