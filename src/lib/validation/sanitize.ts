/**
 * HTML sanitization (allows safe formatting tags) via isomorphic-dompurify.
 *
 * This module pulls in `isomorphic-dompurify` -> `jsdom`. Only import it where you
 * genuinely need HTML sanitization (e.g. rendering rich text). Server routes that
 * only need plain-text stripping or URL validation must import those helpers from
 * `./sanitize-text`, which is jsdom-free — see the note in that file for why
 * (jsdom's default-stylesheet.css ENOENTs in serverless bundles).
 */

import DOMPurify from "isomorphic-dompurify";

// Re-exported for backwards compatibility — these have no DOMPurify/jsdom
// dependency and live in ./sanitize-text. Prefer importing them from there
// directly on server hot paths so this module's jsdom import isn't pulled in.
export { sanitizeText, sanitizePostgrestInput, sanitizeUrl } from "./sanitize-text";

/** Tags allowed through sanitizeHtml (basic formatting only) */
const ALLOWED_TAGS = ["b", "i", "a", "p", "br", "ul", "ol", "li", "strong", "em"];

/** Attributes allowed on permitted tags */
const ALLOWED_ATTR = ["href", "target", "rel"];

/**
 * Sanitize HTML, keeping only safe formatting tags.
 * Returns empty string for null/undefined input.
 */
export function sanitizeHtml(dirty: string): string {
  if (dirty == null) return "";
  if (typeof dirty !== "string") return "";

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}
