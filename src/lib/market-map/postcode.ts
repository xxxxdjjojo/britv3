/**
 * UK postcode normalisation and area-key derivation.
 *
 * Land Registry and postcode-geography data are joined on a normalised key, but
 * the original display format is preserved for the UI.
 */

/**
 * Normalise a postcode for display: uppercase, trim, collapse internal runs of
 * whitespace to a single space. Does NOT remove the inward/outward space.
 */
export function normalisePostcode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, " ");
}

/**
 * Normalised join key with all internal spacing removed (e.g. "SW18 1AA" and
 * "sw181aa" both become "SW181AA").
 */
export function postcodeJoinKey(raw: string): string {
  return normalisePostcode(raw).replace(/\s+/g, "");
}

/**
 * Outward code (postcode district), e.g. "SW18" from "SW18 1AA".
 * Falls back to stripping the 3-character inward code when no space is present.
 * Returns "" for empty/whitespace input.
 */
export function outwardCode(raw: string): string {
  const norm = normalisePostcode(raw);
  if (norm.length === 0) return "";
  if (norm.includes(" ")) return norm.slice(0, norm.indexOf(" "));
  // No space: a valid UK postcode's inward code is always 3 chars.
  if (norm.length > 3) return norm.slice(0, norm.length - 3);
  return norm;
}
