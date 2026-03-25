/**
 * Safely serialise a JSON-LD object for embedding in a <script> tag.
 *
 * `JSON.stringify` does NOT escape `</` sequences, which means a value like
 * `"Acme</script><script>alert(1)</script>"` would break out of the
 * `<script type="application/ld+json">` block and execute arbitrary JS.
 *
 * Replacing every `<` with the unicode escape `\u003c` is safe in JSON
 * (parsers treat `\uXXXX` escapes identically to the literal character)
 * and prevents the HTML parser from seeing a closing tag.
 */
export function safeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
