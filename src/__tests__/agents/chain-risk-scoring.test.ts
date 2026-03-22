import { describe, it, expect } from "vitest";
import {
  computeChainRiskScore,
  scoreToLevel,
  detectCircularChain,
} from "@/services/agent/chain-risk-scoring";

describe("scoreToLevel", () => {
  it("maps 0-19 to low", () => {
    expect(scoreToLevel(0)).toBe("low");
    expect(scoreToLevel(19)).toBe("low");
  });
  it("maps 20-44 to medium", () => {
    expect(scoreToLevel(20)).toBe("medium");
    expect(scoreToLevel(44)).toBe("medium");
  });
  it("maps 45-69 to high", () => {
    expect(scoreToLevel(45)).toBe("high");
    expect(scoreToLevel(69)).toBe("high");
  });
  it("maps 70-100 to critical", () => {
    expect(scoreToLevel(70)).toBe("critical");
    expect(scoreToLevel(100)).toBe("critical");
  });
});

describe("detectCircularChain", () => {
  it("returns false for linear chain A->B->C", () => {
    const links = [
      { upstream_id: "A", downstream_id: "B" },
      { upstream_id: "B", downstream_id: "C" },
    ];
    expect(detectCircularChain(links, "A")).toBe(false);
  });
  it("returns true for cycle A->B->C->A", () => {
    const links = [
      { upstream_id: "A", downstream_id: "B" },
      { upstream_id: "B", downstream_id: "C" },
      { upstream_id: "C", downstream_id: "A" },
    ];
    expect(detectCircularChain(links, "A")).toBe(true);
  });
  it("returns false for empty links", () => {
    expect(detectCircularChain([], "A")).toBe(false);
  });
  it("returns true for direct A->B->A cycle", () => {
    const links = [
      { upstream_id: "A", downstream_id: "B" },
      { upstream_id: "B", downstream_id: "A" },
    ];
    expect(detectCircularChain(links, "A")).toBe(true);
  });
});

describe("computeChainRiskScore", () => {
  it("returns low risk for 2-link chain under 7 days", () => {
    const members = [
      { id: "1", stage: "searches" as const, days_in_stage: 3, updated_at: "" },
      { id: "2", stage: "survey" as const, days_in_stage: 5, updated_at: "" },
    ];
    const result = computeChainRiskScore(members, "1", 1);
    expect(result.risk_level).toBe("low");
    expect(result.risk_score).toBeLessThan(20);
  });

  it("returns high risk for 5-link chain with 16-day stall at exchange", () => {
    const members = [
      { id: "1", stage: "completion" as const, days_in_stage: 2, updated_at: "" },
      { id: "2", stage: "exchange" as const, days_in_stage: 16, updated_at: "" },
      { id: "3", stage: "mortgage" as const, days_in_stage: 5, updated_at: "" },
      { id: "4", stage: "survey" as const, days_in_stage: 3, updated_at: "" },
      { id: "5", stage: "searches" as const, days_in_stage: 4, updated_at: "" },
    ];
    const result = computeChainRiskScore(members, "5", 5);
    expect(result.risk_level).toBe("high");
    expect(result.slowest_link_id).toBe("2");
    expect(result.slowest_link_days).toBe(16);
  });

  it("returns critical for 5+ chain with 22-day stall", () => {
    const members = [
      { id: "1", stage: "exchange" as const, days_in_stage: 22, updated_at: "" },
      { id: "2", stage: "mortgage" as const, days_in_stage: 15, updated_at: "" },
      { id: "3", stage: "survey" as const, days_in_stage: 10, updated_at: "" },
      { id: "4", stage: "searches" as const, days_in_stage: 8, updated_at: "" },
      { id: "5", stage: "solicitors_instructed" as const, days_in_stage: 12, updated_at: "" },
    ];
    const result = computeChainRiskScore(members, "5", 5);
    expect(result.risk_level).toBe("critical");
    expect(result.risk_score).toBeGreaterThanOrEqual(70);
  });

  it("clamps score to max 100", () => {
    const members = Array.from({ length: 8 }, (_, i) => ({
      id: String(i),
      stage: "exchange" as const,
      days_in_stage: 30,
      updated_at: "",
    }));
    const result = computeChainRiskScore(members, "7", 8);
    expect(result.risk_score).toBeLessThanOrEqual(100);
  });

  it("identifies slowest link correctly", () => {
    const members = [
      { id: "A", stage: "searches" as const, days_in_stage: 3, updated_at: "" },
      { id: "B", stage: "survey" as const, days_in_stage: 18, updated_at: "" },
    ];
    const result = computeChainRiskScore(members, "A", 1);
    expect(result.slowest_link_id).toBe("B");
    expect(result.slowest_link_days).toBe(18);
  });
});
