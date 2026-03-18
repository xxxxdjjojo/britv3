/**
 * Shared SEO configuration constants and helpers.
 *
 * Centralises the canonical URL pattern used across the app so individual
 * pages don't each re-derive the base URL from the environment.
 */

export const SITE_URL: string =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

export const SITE_NAME = "Britestate";

export const DEFAULT_OG_IMAGE = "/images/og/britestate-default.png";

/**
 * Returns an absolute canonical URL for the given path.
 *
 * Rules:
 * - Root path "/" returns SITE_URL with no trailing slash.
 * - All other paths are joined with SITE_URL, de-duping any double slash,
 *   and stripping any trailing slash from the result.
 * - Paths without a leading slash are handled correctly.
 */
export function getCanonicalUrl(path: string): string {
  // Normalise: ensure leading slash, strip trailing slash.
  const normalised = `/${path.replace(/^\/+/, "").replace(/\/+$/, "")}`;

  if (normalised === "/") {
    // Root — return the base URL without a trailing slash.
    return SITE_URL.replace(/\/+$/, "");
  }

  const base = SITE_URL.replace(/\/+$/, "");
  return `${base}${normalised}`;
}
