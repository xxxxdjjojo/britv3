import { describe, it, expect } from "vitest";
import { escapeHtml } from "../escape-html";

describe("escapeHtml", () => {
  it("escapes angle brackets", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;");
  });
  it("escapes ampersands", () => {
    expect(escapeHtml("foo & bar")).toBe("foo &amp; bar");
  });
  it("escapes quotes", () => {
    expect(escapeHtml('a "b" c')).toBe("a &quot;b&quot; c");
  });
  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });
  it("handles empty string", () => {
    expect(escapeHtml("")).toBe("");
  });
  it("leaves safe strings unchanged", () => {
    expect(escapeHtml("Hello World 123")).toBe("Hello World 123");
  });
  it("handles img onerror injection", () => {
    expect(escapeHtml('<img src=x onerror="fetch()">')).toBe('&lt;img src=x onerror=&quot;fetch()&quot;&gt;');
  });
});
