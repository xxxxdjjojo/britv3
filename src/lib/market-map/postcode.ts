/**
 * UK postcode normalisation and component extraction.
 *
 * Operates defensively: PPD postcodes can be missing, terminated, or malformed.
 * All functions return `null` rather than throwing for invalid input.
 *
 * No IO, no side effects. Safe to import in any context.
 */

/**
 * Fully normalised representation of a UK postcode.
 *
 * - `joinKey` — letters and digits only, no spaces (e.g. `"M14BH"`).
 *              Use this as a database/join key.
 * - `display` — canonical single space before the 3-character inward code
 *              (e.g. `"M1 4BH"`, `"SW1A 1AA"`).
 * - `area`    — leading alpha prefix, 1–2 letters (e.g. `"M"`, `"SW"`).
 * - `district` — outward code, everything before the inward 3 chars
 *               (e.g. `"M1"`, `"SW1A"`).
 * - `sector`  — district + space + first inward character
 *              (e.g. `"M1 4"`, `"SW1A 1"`).
 */
export type NormalisedPostcode = {
  joinKey: string;
  display: string;
  area: string;
  district: string;
  sector: string;
};

/**
 * Standard UK postcode regex (full postcode required — outward + inward).
 *
 * Matches the Royal Mail PAF format, covering all valid formats:
 *   AN NAA    e.g. M1 4BH
 *   ANN NAA   e.g. M14 4BH (not valid but structurally matched)
 *   AAN NAA   e.g. SW1 1AA
 *   AANN NAA  e.g. SW1A 1AA
 *   ANA NAA   e.g. W1A 0AX
 *   AANA NAA  e.g. EC1A 1BB
 *
 * The regex captures:
 *   group 1 = outward code (district)
 *   group 2 = inward code (3 chars: digit + 2 letters)
 */
const UK_POSTCODE_RE =
  /^([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})$/;

/**
 * Normalises a raw UK postcode string into its components.
 *
 * Returns `null` if the input is `null`, `undefined`, empty, whitespace-only,
 * or does not match the standard UK postcode format.
 *
 * Does NOT throw.
 */
export function normalisePostcode(
  raw: string | null | undefined,
): NormalisedPostcode | null {
  if (raw == null) return null;

  // Uppercase, trim surrounding whitespace, collapse internal whitespace
  const cleaned = raw.toUpperCase().trim().replace(/\s+/g, " ");

  if (!cleaned) return null;

  // Remove all spaces for the regex match (handles no-space input too)
  const compact = cleaned.replace(/\s/g, "");

  const match = UK_POSTCODE_RE.exec(compact);
  if (!match) return null;

  const district = match[1]; // outward code, e.g. "M1", "SW1A"
  const inward = match[2];   // 3-char inward code, e.g. "4BH"

  const joinKey = district + inward;
  const display = `${district} ${inward}`;

  // Area = leading alpha characters only (1–2 letters)
  const areaMatch = /^[A-Z]+/.exec(district);
  const area = areaMatch![0]; // safe: district always starts with alpha

  // Sector = district + space + first char of inward code
  const sector = `${district} ${inward[0]}`;

  return { joinKey, display, area, district, sector };
}

/**
 * Returns the postcode area (1–2 letter alpha prefix) for a raw postcode,
 * or `null` if the postcode is invalid.
 *
 * Example: `"M1 4BH"` → `"M"`, `"SW1A 1AA"` → `"SW"`.
 */
export function postcodeArea(raw: string | null | undefined): string | null {
  return normalisePostcode(raw)?.area ?? null;
}

/**
 * Returns the postcode district (outward code) for a raw postcode,
 * or `null` if the postcode is invalid.
 *
 * Example: `"M1 4BH"` → `"M1"`, `"SW1A 1AA"` → `"SW1A"`.
 */
export function postcodeDistrict(
  raw: string | null | undefined,
): string | null {
  return normalisePostcode(raw)?.district ?? null;
}

/**
 * Returns the postcode sector (district + space + first inward char) for a raw
 * postcode, or `null` if the postcode is invalid.
 *
 * Example: `"M1 4BH"` → `"M1 4"`, `"SW1A 1AA"` → `"SW1A 1"`.
 */
export function postcodeSector(
  raw: string | null | undefined,
): string | null {
  return normalisePostcode(raw)?.sector ?? null;
}
