/**
 * Single source of truth for the canonical tradesperson public-profile URL.
 *
 * Historically, trader cards hand-built `/services/tradespeople/${slug}` (no such
 * route existed → 404) or a bare `/services/${slug}` (missing the category
 * segment → 404). Every link to an individual tradesperson profile must now go
 * through this helper so the URL can never drift out of sync with the route again.
 *
 * The canonical route lives at `src/app/(main)/services/pro/[slug]/page.tsx`.
 * A literal `pro` segment (not `tradespeople`, which already has a dynamic
 * `[category]` child) avoids a two-dynamic-sibling Next.js route conflict, and
 * ties to the "Verified Pro" identity used across the profile UI.
 */

export const TRADESPERSON_PROFILE_BASE = "/services/pro";

type ProfilePathOptions = Readonly<{
  /** Attribution/intent flag consumed by analytics on the destination page. */
  intent?: string;
  /** In-page anchor (e.g. "quote", "services", "reviews"). */
  hash?: string;
}>;

export function tradespersonProfilePath(
  slug: string,
  options: ProfilePathOptions = {},
): string {
  const base = `${TRADESPERSON_PROFILE_BASE}/${slug}`;
  const query = options.intent ? `?intent=${encodeURIComponent(options.intent)}` : "";
  const hash = options.hash ? `#${options.hash}` : "";
  return `${base}${query}${hash}`;
}
