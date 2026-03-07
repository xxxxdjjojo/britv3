import { describe, expect, test } from "vitest";
import { containsProfanity, findProfanity } from "./profanity";

describe("containsProfanity", () => {
  test("returns true for text containing profanity", () => {
    expect(containsProfanity("this is shit content")).toBe(true);
  });

  test("returns false for clean text", () => {
    expect(containsProfanity("this is clean content")).toBe(false);
  });

  test("is case-insensitive", () => {
    expect(containsProfanity("This Is SHIT Content")).toBe(true);
  });

  test("does not flag 'class' when 'ass' is in word list (word boundary check)", () => {
    expect(containsProfanity("the student attended class")).toBe(false);
  });

  test("does not flag 'assassin' due to word boundary", () => {
    expect(containsProfanity("the assassin was quiet")).toBe(false);
  });

  test("flags standalone profane word", () => {
    expect(containsProfanity("what the damn problem")).toBe(true);
  });

  test("returns false for empty string", () => {
    expect(containsProfanity("")).toBe(false);
  });

  test("flags profanity at start of text", () => {
    expect(containsProfanity("shit, that was loud")).toBe(true);
  });

  test("flags profanity at end of text", () => {
    expect(containsProfanity("that was absolute crap")).toBe(true);
  });
});

describe("findProfanity", () => {
  test("returns all found profane words", () => {
    const result = findProfanity("damn this shit");
    expect(result).toContain("damn");
    expect(result).toContain("shit");
    expect(result).toHaveLength(2);
  });

  test("returns empty array for clean text", () => {
    expect(findProfanity("this is a nice clean property")).toEqual([]);
  });

  test("returns unique words only (no duplicates)", () => {
    const result = findProfanity("shit shit shit");
    expect(result).toEqual(["shit"]);
  });

  test("is case-insensitive and returns lowercase found words", () => {
    const result = findProfanity("DAMN that was bad");
    expect(result).toContain("damn");
  });

  test("does not return false positive for word boundaries", () => {
    const result = findProfanity("the student attended class");
    expect(result).toEqual([]);
  });
});
