import { describe, it, expect } from "vitest";
import { analyzeReviewSentiment } from "../sentiment-analyzer";

describe("analyzeReviewSentiment", () => {
  // --- Sentiment classification ---

  it("classifies strongly positive text with intensifiers as very_positive", () => {
    // "very excellent" = 1.5, "absolutely amazing" = 1.5, "incredibly wonderful" = 1.5 → score = 4.5
    const result = analyzeReviewSentiment(
      "very excellent work absolutely amazing service incredibly wonderful experience",
    );
    expect(result.sentiment).toBe("very_positive");
  });

  it("classifies moderately positive text as positive", () => {
    // "great" = 1 → score = 1, which is in [1, 3)
    const result = analyzeReviewSentiment("the team did a great job");
    expect(result.sentiment).toBe("positive");
  });

  it("classifies balanced or bland text as neutral", () => {
    // no keywords matched → score = 0
    const result = analyzeReviewSentiment("the work was carried out on Tuesday");
    expect(result.sentiment).toBe("neutral");
  });

  it("classifies moderately negative text as negative", () => {
    // "poor" = -1 → score = -1, which is in (-3, -1]
    const result = analyzeReviewSentiment("overall a poor experience");
    expect(result.sentiment).toBe("negative");
  });

  it("classifies strongly negative text as very_negative", () => {
    // "terrible" + "awful" + "horrible" = -3 → score = -3 → very_negative
    const result = analyzeReviewSentiment(
      "terrible awful and horrible service from start to finish",
    );
    expect(result.sentiment).toBe("very_negative");
  });

  // --- Edge cases ---

  it("returns neutral with confidence 0 for an empty string", () => {
    const result = analyzeReviewSentiment("");
    expect(result.sentiment).toBe("neutral");
    expect(result.confidence).toBe(0);
  });

  it("returns neutral with confidence 0 for a whitespace-only string", () => {
    const result = analyzeReviewSentiment("   ");
    expect(result.sentiment).toBe("neutral");
    expect(result.confidence).toBe(0);
  });

  // --- Confidence score contract ---

  it("confidence is between 0 and 1 (inclusive) for any input", () => {
    const inputs = [
      "",
      "great",
      "excellent amazing wonderful fantastic superb outstanding brilliant great good professional friendly helpful reliable efficient thorough",
      "terrible awful horrible dreadful appalling disgusting poor bad",
    ];
    for (const text of inputs) {
      const { confidence } = analyzeReviewSentiment(text);
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    }
  });

  it("confidence increases as more sentiment keywords are matched", () => {
    const single = analyzeReviewSentiment("good");
    const multiple = analyzeReviewSentiment("good great professional helpful reliable");
    expect(multiple.confidence).toBeGreaterThan(single.confidence);
  });

  it("confidence is capped at 1 when 5 or more keywords are matched", () => {
    // 6 positive keywords → matchedWords / 5 = 6/5 > 1, clamped to 1
    const result = analyzeReviewSentiment(
      "excellent amazing wonderful fantastic superb outstanding brilliant",
    );
    expect(result.confidence).toBe(1);
  });

  // --- Intensifier behaviour ---

  it("intensifier before a positive word boosts score toward very_positive", () => {
    // Without intensifier: "good" = 1 → positive
    // With two intensifiers: "very good" + "extremely great" = 1.5 + 1.5 = 3 → very_positive
    const result = analyzeReviewSentiment(
      "very good work and extremely great communication",
    );
    expect(result.sentiment).toBe("very_positive");
  });

  it("intensifier before a negative word deepens the negative score", () => {
    // "very terrible" = -1.5, "extremely awful" = -1.5, "incredibly bad" = -1.5 → score = -4.5
    const result = analyzeReviewSentiment(
      "very terrible work extremely awful outcome incredibly bad",
    );
    expect(result.sentiment).toBe("very_negative");
  });
});
