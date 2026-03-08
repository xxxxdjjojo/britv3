/**
 * XSS sanitization utilities.
 * Works on both client and server via isomorphic-dompurify.
 */

import DOMPurify from "isomorphic-dompurify";

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

/**
 * Strip ALL HTML tags, returning plain text only.
 * Returns empty string for null/undefined input.
 */
export function sanitizeText(dirty: string): string {
  if (dirty == null) return "";
  if (typeof dirty !== "string") return "";

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}
