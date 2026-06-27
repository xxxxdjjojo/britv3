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

  it("strips script tags, leaving inner text inert (no executable markup)", () => {
    // DOM-free strip keeps the literal inner text but removes all <…> markup,
    // so rendered as React-escaped text it cannot execute.
    const result = sanitizeText("<script>alert('xss')</script>");
    expect(result).toBe("alert('xss')");
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
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

  // --- DOM-free reimplementation: safety/equivalence coverage -------------
  // sanitizeText is now a regex strip (no isomorphic-dompurify/jsdom). Exact
  // byte-equivalence with DOMPurify is NOT required (DOMPurify drops <script>
  // inner text; a strip keeps "alert(1)" as inert literal text). What IS
  // required: output has no <…>-delimited markup and is safe rendered as
  // React-escaped text. Every caller renders the result as text, never HTML.
  it("strips attributes along with their tag", () => {
    const result = sanitizeText('<a href="https://evil.test" onclick="x()">click</a>');
    expect(result).toBe("click");
  });

  it("strips a malformed/unclosed tag with an inline handler", () => {
    const result = sanitizeText("<img src=x onerror=alert(1)");
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
  });

  it("keeps script inner text as inert literal (no executable markup)", () => {
    const result = sanitizeText("<script>alert(1)</script>");
    expect(result).toBe("alert(1)");
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
  });

  it("does NOT decode HTML entities (they stay literal, not re-injectable)", () => {
    // A regex strip leaves entities untouched; rendered as text they display
    // as the literal characters and cannot reconstitute a tag.
    expect(sanitizeText("&lt;b&gt;x&lt;/b&gt; &amp; more")).toBe(
      "&lt;b&gt;x&lt;/b&gt; &amp; more",
    );
  });

  it("leaves no <…>-delimited tags for a mixed adversarial payload", () => {
    const payload =
      '<div><script>alert(1)</script><img src=x onerror=alert(2)><b>bold</b></div>';
    const result = sanitizeText(payload);
    expect(result).not.toMatch(/<[^>]*>/);
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
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
