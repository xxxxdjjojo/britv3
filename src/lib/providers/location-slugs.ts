/**
 * UK location slug disambiguation for /services/[category]/[slug] routes.
 *
 * The [slug] segment serves dual purpose:
 *   - Provider slugs: "smith-plumbing-london", "j-b-electricals"
 *   - Location slugs: "london", "south-london", "manchester"
 *
 * isLocationSlug() disambiguates between these two cases so the page
 * can render either a provider profile or an SEO category landing page.
 */

// Known UK city/region slugs that appear in /services/[category]/[location] URLs.
// Provider slugs typically contain business names with multiple hyphens and are longer.
const UK_LOCATION_SLUGS = new Set([
  "london", "manchester", "birmingham", "leeds", "glasgow", "sheffield",
  "bradford", "edinburgh", "liverpool", "bristol", "wakefield", "cardiff",
  "coventry", "nottingham", "leicester", "sunderland", "belfast",
  "newcastle", "brighton", "hull", "plymouth", "wolverhampton", "derby",
  "stoke", "southampton", "salford", "oxford", "cambridge", "reading",
  "exeter", "york", "norwich", "ipswich", "luton", "poole", "swindon",
  "southend", "peterborough", "middlesbrough", "telford", "eastbourne",
  "hastings", "shrewsbury", "cheltenham", "gloucester", "worcester",
  "hereford", "bath", "salisbury", "winchester", "guildford", "maidstone",
  "colchester", "chelmsford", "stevenage", "watford", "hemel",
  "north-london", "south-london", "east-london", "west-london",
  "central-london", "greater-manchester", "west-yorkshire", "south-yorkshire",
  "west-midlands", "east-midlands", "north-west", "north-east", "south-east",
  "south-west", "east-anglia", "home-counties",
]);

/**
 * Returns true if the URL segment looks like a UK location slug
 * (city, region, or London area), false if it looks like a provider slug.
 */
export function isLocationSlug(segment: string): boolean {
  const lower = segment.toLowerCase();

  // Exact match against known UK locations
  if (UK_LOCATION_SLUGS.has(lower)) return true;

  // Heuristic: location slugs are short (≤ 25 chars) and contain 0-2 hyphens.
  // Provider slugs are longer with business names (e.g. "smith-plumbing-and-heating-london").
  const hyphenCount = (segment.match(/-/g) ?? []).length;
  if (segment.length <= 25 && hyphenCount <= 2) {
    // Looks like a place name: only letters and hyphens, no digits, 3-25 chars
    return /^[a-z-]{3,25}$/.test(lower) && !/\d/.test(lower);
  }

  return false;
}
