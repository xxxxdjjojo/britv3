// src/lib/seo/postcode-service-matrix.ts
//
// Memo Pivot v2 — programmatic SEO. Cartesian product of UK postcode
// areas × service categories. Used to generate /services/[service]/[postcode]
// landing pages and entries in sitemap.xml.
//
// The cap is intentionally conservative: `next build` would balk at
// 100K SSG routes. We curate the top-10K pairs at build time and let
// the rest fall through to on-demand rendering with cache.

export const MATRIX_HARD_CAP = 10_000;

export const TOP_SERVICES: ReadonlyArray<string> = [
  "plumber",
  "electrician",
  "roofer",
  "builder",
  "decorator",
  "gas-engineer",
  "surveyor",
  "conveyancer",
  "mortgage-broker",
  "architect",
  "gardener",
  "cleaner",
] as const;

/**
 * Curated subset of UK postcode AREAS (the alpha prefix, not the full
 * postcode). About 120 of these exist in real UK postal data. The set
 * shipped here is a representative slice ordered roughly by population
 * — full coverage is built at deploy time from Land Registry data via
 * scripts/seo/build-postcode-service-matrix.mjs.
 */
export const DEFAULT_POSTCODE_AREAS: ReadonlyArray<string> = [
  "SW1A", "EC1N", "M1", "B1", "LS1",
  "BS1", "L1", "G1", "EH1", "NE1",
  "CF1", "BT1", "OX1", "CB1", "BA1",
  "BN1", "BR1", "CT1", "DA1", "E1",
  "EN1", "GU1", "HA1", "IG1", "KT1",
  "ME1", "N1", "NW1", "RG1", "RH1",
  "RM1", "SE1", "SL1", "SM1", "SS1",
  "ST1", "SW2", "TN1", "TW1", "UB1",
  "W1", "WC1", "WD1",
] as const;

export interface PostcodeServicePair {
  readonly postcode: string;
  readonly service: string;
  readonly slug: string;
}

interface MatrixArgs {
  readonly postcodeAreas: ReadonlyArray<string>;
  readonly services: ReadonlyArray<string>;
  readonly cap?: number;
}

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
}

export function buildPostcodeServiceMatrix(
  args: MatrixArgs,
): ReadonlyArray<PostcodeServicePair> {
  const cap = args.cap ?? MATRIX_HARD_CAP;
  const seen = new Set<string>();
  const out: PostcodeServicePair[] = [];

  // Stable iteration: services outer, postcodes inner — gives us a
  // service-balanced sitemap when truncating to the cap.
  for (const service of args.services) {
    if (out.length >= cap) break;
    const cleanService = slugify(service);
    if (!cleanService) continue;
    for (const postcode of args.postcodeAreas) {
      if (out.length >= cap) break;
      const cleanPostcode = postcode.trim().toUpperCase();
      if (!cleanPostcode) continue;
      const slug = `services-${cleanService}-${slugify(cleanPostcode)}`;
      if (seen.has(slug)) continue;
      seen.add(slug);
      out.push({ postcode: cleanPostcode, service: cleanService, slug });
    }
  }
  return out;
}

/**
 * Convenience — builds the default matrix using TOP_SERVICES and
 * DEFAULT_POSTCODE_AREAS. Replace with build-time data from Land Registry
 * for the full ~10K matrix in production.
 */
export function buildDefaultMatrix(): ReadonlyArray<PostcodeServicePair> {
  return buildPostcodeServiceMatrix({
    postcodeAreas: DEFAULT_POSTCODE_AREAS,
    services: TOP_SERVICES,
  });
}
