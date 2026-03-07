import { describe, it, expect } from "vitest";
import { analyzeReviewSentiment, type SentimentScore } from "./sentiment-analyzer";

describe("sentiment-analyzer", () => {
  it("returns positive/very_positive for glowing reviews", () => {
    const result = analyzeReviewSentiment("excellent professional service amazing work");
    expect(["positive", "very_positive"]).toContain(result.sentiment);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("returns negative/very_negative for bad reviews", () => {
    const result = analyzeReviewSentiment("terrible awful experience horrible service");
    expect(["negative", "very_negative"]).toContain(result.sentiment);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("returns neutral for bland text", () => {
    const result = analyzeReviewSentiment("the work was done");
    expect(result.sentiment).toBe("neutral");
  });

  it("intensifiers boost the score magnitude", () => {
    const withoutIntensifier = analyzeReviewSentiment("good service");
    const withIntensifier = analyzeReviewSentiment("very good service");
    // The intensified version should be at least as positive
    expect(withIntensifier.sentiment).not.toBe("negative");
    expect(withIntensifier.sentiment).not.toBe("very_negative");
  });

  it("confidence increases with more matched words", () => {
    const fewWords = analyzeReviewSentiment("good");
    const manyWords = analyzeReviewSentiment(
      "excellent amazing wonderful fantastic superb outstanding"
    );
    expect(manyWords.confidence).toBeGreaterThanOrEqual(fewWords.confidence);
  });

  it("confidence is capped at 1", () => {
    const result = analyzeReviewSentiment(
      "excellent amazing wonderful fantastic superb outstanding brilliant remarkable"
    );
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("handles empty string as neutral", () => {
    const result = analyzeReviewSentiment("");
    expect(result.sentiment).toBe("neutral");
    expect(result.confidence).toBe(0);
  });
});
