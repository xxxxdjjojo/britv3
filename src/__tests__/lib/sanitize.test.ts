import { describe, it, expect } from "vitest";
import { sanitizeHtml, sanitizeText } from "@/lib/validation/sanitize";

describe("sanitizeText", () => {
  it("strips HTML tags and returns plain text", () => {
    expect(sanitizeText("<b>hello</b>")).toBe("hello");
  });

  it("handles null input gracefully", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(sanitizeText(null as any)).toBe("");
  });

  it("handles undefined input gracefully", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(sanitizeText(undefined as any)).toBe("");
  });

  it("strips script tags completely", () => {
    expect(sanitizeText("<script>alert('xss')</script>")).toBe("");
  });

  it("strips nested HTML tags", () => {
    expect(sanitizeText("<div><p><b>nested</b></p></div>")).toBe("nested");
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeText("")).toBe("");
  });

  it("preserves plain text without tags", () => {
    expect(sanitizeText("just plain text")).toBe("just plain text");
  });
});

describe("sanitizeHtml", () => {
  it("allows safe formatting tags", () => {
    expect(sanitizeHtml("<b>bold</b>")).toBe("<b>bold</b>");
  });

  it("allows italic tags", () => {
    expect(sanitizeHtml("<i>italic</i>")).toBe("<i>italic</i>");
  });

  it("allows anchor tags with href", () => {
    const input = '<a href="https://example.com">link</a>';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it("allows list tags", () => {
    const input = "<ul><li>item 1</li><li>item 2</li></ul>";
    expect(sanitizeHtml(input)).toBe(input);
  });

  it("strips script tags completely", () => {
    expect(sanitizeHtml("<script>alert('xss')</script>")).toBe("");
  });

  it("strips dangerous attributes like onerror", () => {
    const result = sanitizeHtml('<img onerror="alert(1)" src="x">');
    expect(result).not.toContain("onerror");
  });

  it("strips div and span tags (not in allowed list)", () => {
    expect(sanitizeHtml("<div>content</div>")).toBe("content");
  });

  it("handles null input gracefully", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(sanitizeHtml(null as any)).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeHtml("")).toBe("");
  });
});
