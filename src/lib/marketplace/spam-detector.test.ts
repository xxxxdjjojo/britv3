import { describe, it, expect } from "vitest";
import { detectSpam, type SpamIndicators } from "./spam-detector";

describe("spam-detector", () => {
  it("detects UK phone numbers", () => {
    const result = detectSpam("Call me on 07700 900123 for a quote");
    expect(result.has_contact_info).toBe(true);
    expect(result.spam_score).toBeGreaterThan(0);
  });

  it("detects email addresses", () => {
    const result = detectSpam("Email me at spam@example.com for details");
    expect(result.has_contact_info).toBe(true);
  });

  it("detects URLs", () => {
    const result = detectSpam("Visit https://example.com for more info");
    expect(result.has_links).toBe(true);
  });

  it("detects excessive ALL CAPS (>50%)", () => {
    const result = detectSpam("THIS IS ALL CAPS TEXT AND IT IS VERY LOUD short bit");
    expect(result.has_excessive_caps).toBe(true);
  });

  it("does not flag normal capitalization", () => {
    const result = detectSpam("The service was Good and Professional overall");
    expect(result.has_excessive_caps).toBe(false);
  });

  it("detects promotional language", () => {
    const result = detectSpam("Get a free discount if you call now, click here!");
    expect(result.has_promotional).toBe(true);
  });

  it("detects repeated characters", () => {
    const result = detectSpam("This was amaziiiiing service");
    expect(result.has_repeated_chars).toBe(true);
  });

  it("detects excessive punctuation", () => {
    const result = detectSpam("Great service!!!!!! Amazing!!!!!!!");
    expect(result.has_excessive_punctuation).toBe(true);
  });

  it("clean review passes with 0 spam_score", () => {
    const result = detectSpam(
      "The plumber arrived on time and fixed the leak quickly. Very professional and reasonably priced."
    );
    expect(result.spam_score).toBe(0);
    expect(result.has_contact_info).toBe(false);
    expect(result.has_links).toBe(false);
    expect(result.has_excessive_caps).toBe(false);
    expect(result.has_promotional).toBe(false);
    expect(result.has_repeated_chars).toBe(false);
    expect(result.has_excessive_punctuation).toBe(false);
  });

  it("spam_score equals sum of boolean flags", () => {
    // Text with multiple spam indicators
    const result = detectSpam(
      "CALL NOW 07700 900123 visit https://spam.com FREE DISCOUNT!!!!!!!"
    );
    const expectedScore =
      (result.has_contact_info ? 1 : 0) +
      (result.has_links ? 1 : 0) +
      (result.has_excessive_caps ? 1 : 0) +
      (result.has_promotional ? 1 : 0) +
      (result.has_repeated_chars ? 1 : 0) +
      (result.has_excessive_punctuation ? 1 : 0);
    expect(result.spam_score).toBe(expectedScore);
  });
});
