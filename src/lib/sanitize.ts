/**
 * sanitize.ts
 *
 * Lightweight XSS-prevention utilities for user-supplied free-text inputs
 * (display names, company names, bio text, addresses, etc.).
 *
 * Intentionally dependency-free — uses only built-in string methods and
 * a small set of regexes so this module is safe to import in both server
 * and client contexts.
 */

/** Sensible max-length caps for common free-text fields. */
export const MAX_LENGTHS = {
  displayName: 100,
  companyName: 150,
  bio: 500,
  address: 250,
  phone: 20,
  url: 500,
  general: 255,
} as const;

/**
 * Strip HTML/script tags, collapse internal whitespace, and trim.
 *
 * Handles the most common XSS vectors:
 *   - `<script>`, `<img onerror=…>`, `<a href="javascript:…">`, etc.
 *   - HTML entities are left as-is (the DB / ORM handles encoding).
 */
export function sanitize(input: string): string {
  return input
    // Remove all HTML tags (including self-closing and malformed ones)
    .replace(/<[^>]*>/g, "")
    // Collapse multiple whitespace characters (spaces, tabs, newlines) to a
    // single space, then trim leading / trailing whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Truncate a string to `maxLength` characters, appending "…" when truncated.
 */
export function truncate(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input;
  return `${input.slice(0, maxLength - 1)}…`;
}

/**
 * Apply `sanitize()` to the specified string keys of an object, leaving all
 * other keys (including non-string ones) untouched.
 *
 * @example
 *   const clean = sanitizeObject(formData, ["agencyName", "jobTitle"]);
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  keys: (keyof T)[],
): T {
  const result = { ...obj };
  for (const key of keys) {
    const value = result[key];
    if (typeof value === "string") {
      (result as Record<keyof T, unknown>)[key] = sanitize(value);
    }
  }
  return result;
}
