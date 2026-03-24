import { describe, it, expect } from "vitest";
import { sanitizeCmsHtml } from "@/lib/validation/sanitize-cms";

describe("sanitizeCmsHtml", () => {
  it("preserves safe formatting tags", () => {
    const input = "<h2>Title</h2><p>Hello <strong>world</strong></p>";
    expect(sanitizeCmsHtml(input)).toBe(input);
  });

  it("preserves images with src and alt", () => {
    const input = '<img src="https://example.com/photo.jpg" alt="A photo">';
    expect(sanitizeCmsHtml(input)).toContain("src=");
    expect(sanitizeCmsHtml(input)).toContain("alt=");
  });

  it("preserves links with href", () => {
    const input = '<a href="https://example.com" target="_blank" rel="noopener">Link</a>';
    expect(sanitizeCmsHtml(input)).toContain("href=");
  });

  it("preserves blockquotes", () => {
    const input = "<blockquote><p>Quote</p></blockquote>";
    expect(sanitizeCmsHtml(input)).toBe(input);
  });

  it("preserves ordered and unordered lists", () => {
    const input = "<ul><li>One</li></ul><ol><li>Two</li></ol>";
    expect(sanitizeCmsHtml(input)).toBe(input);
  });

  it("strips script tags", () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    expect(sanitizeCmsHtml(input)).toBe("<p>Hello</p>");
  });

  it("strips iframe tags", () => {
    const input = '<p>Hello</p><iframe src="https://evil.com"></iframe>';
    expect(sanitizeCmsHtml(input)).toBe("<p>Hello</p>");
  });

  it("strips event handlers", () => {
    const input = '<p onclick="alert(1)">Click me</p>';
    const result = sanitizeCmsHtml(input);
    expect(result).not.toContain("onclick");
    expect(result).toContain("Click me");
  });

  it("strips javascript: URLs in links", () => {
    const input = '<a href="javascript:alert(1)">Evil</a>';
    const result = sanitizeCmsHtml(input);
    expect(result).not.toContain("javascript:");
  });

  it("strips style tags", () => {
    const input = "<style>body { display: none }</style><p>Hello</p>";
    expect(sanitizeCmsHtml(input)).toBe("<p>Hello</p>");
  });

  it("returns empty string for null/undefined", () => {
    expect(sanitizeCmsHtml(null as unknown as string)).toBe("");
    expect(sanitizeCmsHtml(undefined as unknown as string)).toBe("");
  });
});
