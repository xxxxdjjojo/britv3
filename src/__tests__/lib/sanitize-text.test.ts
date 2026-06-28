import { describe, it, expect } from "vitest";
import {
  sanitizeText,
  sanitizePostgrestInput,
  sanitizeUrl,
} from "@/lib/validation/sanitize-text";

// sanitize-text.ts is the jsdom-free sanitizer used on server hot paths. These
// guard that it strips dangerous markup down to plain text without ever needing
// isomorphic-dompurify / jsdom (whose default-stylesheet.css ENOENTs in lambdas).

describe("sanitizeText (jsdom-free)", () => {
  it("strips formatting tags to plain text", () => {
    expect(sanitizeText("<b>hello</b>")).toBe("hello");
    expect(sanitizeText("<div><p><b>nested</b></p></div>")).toBe("nested");
  });

  it("removes <script> elements together with their contents", () => {
    expect(sanitizeText("<script>alert('xss')</script>")).toBe("");
    expect(sanitizeText("a<script>evil()</script>b")).toBe("ab");
    expect(sanitizeText('<SCRIPT SRC="x">y</SCRIPT>')).toBe("");
  });

  it("removes <style> elements together with their contents", () => {
    expect(sanitizeText("<style>body{display:none}</style>keep")).toBe("keep");
  });

  it("removes an unterminated <script> through to the end", () => {
    expect(sanitizeText("ok<script>still dangling")).toBe("ok");
  });

  it("strips event-handler-bearing tags, leaving inert text", () => {
    // The tag is stripped; any leftover is plain text (escaped on render).
    expect(sanitizeText('<img src=x onerror="alert(1)">')).toBe("");
  });

  it("returns empty string for null/undefined/non-string", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(sanitizeText(null as any)).toBe("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(sanitizeText(undefined as any)).toBe("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(sanitizeText(42 as any)).toBe("");
  });

  it("preserves plain text unchanged", () => {
    expect(sanitizeText("just plain text")).toBe("just plain text");
  });

  it("strips attributes along with their tag", () => {
    expect(
      sanitizeText('<a href="https://evil.test" onclick="x()">click</a>'),
    ).toBe("click");
  });

  it("strips a malformed/unclosed tag with an inline handler", () => {
    const result = sanitizeText("<img src=x onerror=alert(1)");
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
  });

  it("does NOT decode HTML entities (they stay literal, not re-injectable)", () => {
    // A regex strip leaves entities untouched; rendered as React-escaped text
    // they display as the literal characters and cannot reconstitute a tag.
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

describe("sanitizePostgrestInput", () => {
  it("strips PostgREST filter syntax and ILIKE wildcards", () => {
    expect(sanitizePostgrestInput("a,b.c(d)e\\f%g_h")).toBe("abcdefgh");
  });
  it("handles null gracefully", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(sanitizePostgrestInput(null as any)).toBe("");
  });
});

describe("sanitizeUrl", () => {
  it("allows http and https", () => {
    expect(sanitizeUrl("https://example.com/")).toBe("https://example.com/");
    expect(sanitizeUrl("http://example.com/")).toBe("http://example.com/");
  });
  it("rejects javascript: and data: and garbage", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeUrl("data:text/html,<script>")).toBeNull();
    expect(sanitizeUrl("not a url")).toBeNull();
    expect(sanitizeUrl(null)).toBeNull();
  });
});
