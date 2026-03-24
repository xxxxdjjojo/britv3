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
