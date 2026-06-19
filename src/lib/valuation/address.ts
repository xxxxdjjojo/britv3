/**
 * Address normalisation for deterministic property matching.
 *
 * Two addresses are only the same property if their full normalised key matches.
 * We never merge two records just because they share a postcode and house number
 * — flats in the same building are distinguished by SAON.
 */
import { normalisePostcode } from "./postcode";

/** Common UK street-type abbreviations (applied to non-leading tokens only, so
 *  a leading "St" meaning Saint is not turned into "Street"). */
const ABBREVIATIONS: Readonly<Record<string, string>> = {
  RD: "ROAD",
  ST: "STREET",
  AVE: "AVENUE",
  AV: "AVENUE",
  LN: "LANE",
  CL: "CLOSE",
  DR: "DRIVE",
  CRES: "CRESCENT",
  CT: "COURT",
  PL: "PLACE",
  SQ: "SQUARE",
  GDNS: "GARDENS",
  TER: "TERRACE",
  PK: "PARK",
  HSE: "HOUSE",
  APT: "APARTMENT",
  FLT: "FLAT",
};

export function normaliseAddressToken(value: string | null | undefined): string {
  if (!value) return "";
  const cleaned = value
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned === "") return "";
  return cleaned
    .split(" ")
    .map((word, index) => (index > 0 ? (ABBREVIATIONS[word] ?? word) : word))
    .join(" ");
}

export type AddressParts = Readonly<{
  paon: string | null;
  saon: string | null;
  street: string | null;
  postcode: string | null;
}>;

/** Stable canonical key: PAON | SAON | STREET | POSTCODE (all normalised). */
export function buildAddressKey(parts: AddressParts): string {
  const postcode =
    normalisePostcode(parts.postcode) ?? normaliseAddressToken(parts.postcode);
  return [
    normaliseAddressToken(parts.paon),
    normaliseAddressToken(parts.saon),
    normaliseAddressToken(parts.street),
    postcode,
  ].join("|");
}
