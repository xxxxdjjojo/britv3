/**
 * Plain-text + URL sanitizers that are safe to import on any server route.
 *
 * IMPORTANT: this module must NEVER import `isomorphic-dompurify`. That package
 * pulls in `jsdom`, which reads `default-stylesheet.css` (relative to its own
 * directory) at module load. When webpack bundles jsdom into a serverless route
 * chunk, that path resolves to `.next/browser/default-stylesheet.css`, which is
 * not traced into the Vercel function — so the chunk throws `ENOENT` at
 * evaluation and every request to that route 500s before the handler runs.
 *
 * HTML sanitization (which genuinely needs DOMPurify) lives in `./sanitize`.
 * Server hot paths that only need to strip tags / validate URLs import from here.
 */

/**
 * Strip ALL HTML tags, returning plain text only. Script and style elements are
 * removed together with their contents (matching DOMPurify with an empty
 * allowlist). The result is plain text intended to be rendered as text (and thus
 * escaped by the framework), not re-inserted as HTML.
 *
 * Returns empty string for null/undefined/non-string input.
 */
export function sanitizeText(dirty: string): string {
  if (dirty == null) return "";
  if (typeof dirty !== "string") return "";

  return (
    dirty
      // Drop <script>/<style> elements entirely (opening tag + contents + close).
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
      // Drop any unterminated <script>/<style> (no closing tag) through to the end.
      .replace(/<(script|style)\b[^>]*>[\s\S]*$/gi, "")
      // Strip every remaining tag.
      .replace(/<[^>]*>/g, "")
  );
}

/**
 * Strip PostgREST filter-syntax and ILIKE wildcard characters from user input
 * before interpolating into `.or()` / `.filter()` strings.
 *
 * Removes: , . ( ) \ (PostgREST filter syntax) and % _ (ILIKE wildcards).
 */
export function sanitizePostgrestInput(dirty: string): string {
  if (dirty == null) return "";
  if (typeof dirty !== "string") return "";
  return dirty.replace(/[,().\\%_]/g, "");
}

/**
 * Validate and sanitize a URL string, allowing only http: and https: protocols.
 * Returns null for invalid or dangerous URLs (javascript:, data:, etc.).
 */
export function sanitizeUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}
