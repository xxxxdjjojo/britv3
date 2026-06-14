/**
 * Truedeed PPD ↔ listing matcher (spec §4.3, trade-offs §4.4).
 *
 * Scores how plausibly a Price Paid Data transaction is the completion of a
 * listing with a Truedeed introduction. All functions are PURE — no I/O, no
 * Date.now(); callers (ppd-match-service, the `ppd:match` Inngest/BullMQ job)
 * supply every fact.
 *
 * Score components (weights pinned from the spec §4.3 table):
 *   - Postcode gate: normalised inequality OR either side null → null
 *   - PAON exact (normalised / range-expanded)        +0.35
 *   - else PAON trigram >= 0.7                        +0.20
 *   - SAON both present and equal (normalised)        +0.10
 *       flats (propertyType 'F') with SAON missing on either side
 *       → total CAPPED at 0.6 (§4.4: PPD flat addressing is unreliable)
 *   - Street trigram >= 0.5                           +0.10
 *   - Date plausibility (max)                         +0.15
 *       full within [occurredAt + 6 weeks, tailExpiresAt + 3 months],
 *       linear decay to 0 over 3 months outside either bound
 *   - Price within ±12.5% of asking                   +0.10
 *       (skipped entirely when askingPricePence is null — weak signal)
 *   - ppdCategory 'B' → total CAPPED at 0.7 (repossession/corporate buyer);
 *     when several caps apply the minimum cap wins.
 */

/** PPD transaction as stored after ingest (spec §4.1 columns the matcher uses). */
export type PpdRow = {
  ppdTuid: string;
  /** Sale price in pence. */
  pricePence: number;
  /** Transfer date as "YYYY-MM-DD". */
  transferDate: string;
  postcode: string | null;
  /** D/S/T/F/O — only 'F' (flat) changes matcher behaviour. */
  propertyType: string;
  paon: string | null;
  saon: string | null;
  street: string | null;
  /** A standard / B additional (spec §4.3: B caps the total at 0.7). */
  ppdCategory: "A" | "B";
};

/** Listing candidate plus the introduction whose window it must fit (spec §4.3). */
export type ListingForMatch = {
  listingId: string;
  postcode: string | null;
  paon: string | null;
  saon: string | null;
  street: string | null;
  propertyType: string | null;
  /** Asking price in pence; null when unknown (price component is skipped). */
  askingPricePence: number | null;
  introduction: {
    introductionId: string;
    /** ISO timestamp the introduction occurred. */
    occurredAt: string;
    /** ISO timestamp the clause-10.2 tail expires. */
    tailExpiresAt: string;
  };
};

/** Per-component contributions; in the uncapped case they sum to the score. */
export type MatchComponents = {
  paon: number;
  saon: number;
  street: number;
  date: number;
  price: number;
};

/** Result of {@link scoreMatch} once the postcode gate has passed. */
export type MatchScore = {
  /** Final score in [0, 1], after any caps. */
  score: number;
  /** True only when a cap actually reduced the summed component score. */
  capped: boolean;
  components: MatchComponents;
};

// ---------------------------------------------------------------------------
// Thresholds (spec §4.3)
// ---------------------------------------------------------------------------

/** Verification mode: >= this → auto-confirm the agent-reported completion. */
export const VERIFICATION_AUTO_CONFIRM = 0.8;
/** Audit mode: >= this → branch query (never an invoice — spec §4.4). */
export const AUDIT_QUERY = 0.65;
/** Audit mode: [this, AUDIT_QUERY) → ops-only watchlist, no branch contact. */
export const WATCHLIST = 0.5;

// ---------------------------------------------------------------------------
// Weights, caps and conventions (spec §4.3 table)
// ---------------------------------------------------------------------------

const WEIGHT_PAON_EXACT = 0.35;
const WEIGHT_PAON_TRIGRAM = 0.2;
const WEIGHT_SAON = 0.1;
const WEIGHT_STREET = 0.1;
const WEIGHT_DATE = 0.15;
const WEIGHT_PRICE = 0.1;

const PAON_TRIGRAM_THRESHOLD = 0.7;
const STREET_TRIGRAM_THRESHOLD = 0.5;
const PRICE_TOLERANCE = 0.125;

const FLAT_SAON_CAP = 0.6;
const CATEGORY_B_CAP = 0.7;

const DAY_MS = 86_400_000;
/** Lower date bound: occurredAt + 6 weeks (intro → earliest plausible completion). */
const INTRO_TO_COMPLETION_MIN_DAYS = 42;
/** Upper date bound: tailExpiresAt + 3 calendar months (registration lag). */
const REGISTRATION_GRACE_MONTHS = 3;
/** "3 months" of linear decay outside the window, as a fixed 90 days. */
const DATE_DECAY_DAYS = 90;

/** Floating-point slack so a cap equal to the raw sum never reads as "capped". */
const CAP_EPSILON = 1e-9;

const MAX_PAON_RANGE_SPAN = 100;

// ---------------------------------------------------------------------------
// Normalisers
// ---------------------------------------------------------------------------

/**
 * Normalise a UK postcode: uppercase, strip all whitespace, then re-insert
 * the single space before the 3-character incode.
 */
export function normalisePostcode(raw: string): string {
  const compact = raw.toUpperCase().replace(/\s+/g, "");
  if (compact.length <= 3) return compact;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

/**
 * Normalise a PAON/SAON: uppercase, strip punctuation, collapse internal
 * whitespace to single spaces, trim.
 */
export function normalisePaon(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Variant set used for PAON equality: the normalised string plus, for pure
 * numeric ranges like "12-14", every house number in the range (spec §4.3:
 * "expand ranges").
 */
const paonVariants = (raw: string): Set<string> => {
  const variants = new Set<string>([normalisePaon(raw)]);
  const range = raw.trim().match(/^(\d+)\s*-\s*(\d+)$/);
  if (range) {
    const lo = Number(range[1]);
    const hi = Number(range[2]);
    if (lo <= hi && hi - lo <= MAX_PAON_RANGE_SPAN) {
      for (let n = lo; n <= hi; n++) variants.add(String(n));
    }
  }
  return variants;
};

/** Exact PAON equality after normalisation and numeric-range expansion. */
export function paonsEqual(a: string, b: string): boolean {
  const aVariants = paonVariants(a);
  for (const variant of paonVariants(b)) {
    if (aVariants.has(variant)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Trigram similarity (classic padded 3-gram Jaccard, 0..1)
// ---------------------------------------------------------------------------

const trigramsOf = (normalised: string): Set<string> => {
  const padded = `  ${normalised} `;
  const grams = new Set<string>();
  for (let i = 0; i + 3 <= padded.length; i++) {
    grams.add(padded.slice(i, i + 3));
  }
  return grams;
};

/**
 * Jaccard similarity of padded 3-grams (case- and whitespace-insensitive).
 * Identical strings → 1; strings sharing no trigrams → 0.
 */
export function trigramSimilarity(a: string, b: string): number {
  const normalise = (s: string): string =>
    s.toLowerCase().replace(/\s+/g, " ").trim();
  const na = normalise(a);
  const nb = normalise(b);
  if (na === nb) return 1;

  const gramsA = trigramsOf(na);
  const gramsB = trigramsOf(nb);
  let intersection = 0;
  for (const gram of gramsA) {
    if (gramsB.has(gram)) intersection++;
  }
  const union = gramsA.size + gramsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ---------------------------------------------------------------------------
// Component scorers
// ---------------------------------------------------------------------------

const paonComponent = (
  ppdPaon: string | null,
  listingPaon: string | null,
): number => {
  if (ppdPaon === null || listingPaon === null) return 0;
  if (paonsEqual(ppdPaon, listingPaon)) return WEIGHT_PAON_EXACT;
  const similarity = trigramSimilarity(
    normalisePaon(ppdPaon),
    normalisePaon(listingPaon),
  );
  return similarity >= PAON_TRIGRAM_THRESHOLD ? WEIGHT_PAON_TRIGRAM : 0;
};

/** Normalised SAON, with null/empty collapsed to null ("missing"). */
const normalisedSaonOrNull = (raw: string | null): string | null => {
  if (raw === null) return null;
  const normalised = normalisePaon(raw);
  return normalised === "" ? null : normalised;
};

/** Add whole calendar months to an ISO timestamp, in UTC (with JS rollover). */
const addUtcMonths = (iso: string, months: number): number => {
  const date = new Date(iso);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.getTime();
};

/**
 * Date plausibility factor in [0, 1] (spec §4.3): 1 inside
 * [occurredAt + 6 weeks, tailExpiresAt + 3 calendar months], linearly
 * decaying to 0 over {@link DATE_DECAY_DAYS} days outside either bound.
 */
const datePlausibility = (
  transferDate: string,
  occurredAt: string,
  tailExpiresAt: string,
): number => {
  const transfer = Date.parse(
    transferDate.length === 10
      ? `${transferDate}T00:00:00.000Z`
      : transferDate,
  );
  const lowerBound =
    Date.parse(occurredAt) + INTRO_TO_COMPLETION_MIN_DAYS * DAY_MS;
  const upperBound = addUtcMonths(tailExpiresAt, REGISTRATION_GRACE_MONTHS);
  if (
    Number.isNaN(transfer) ||
    Number.isNaN(lowerBound) ||
    Number.isNaN(upperBound)
  ) {
    return 0;
  }

  const distanceOutside =
    transfer < lowerBound
      ? lowerBound - transfer
      : transfer > upperBound
        ? transfer - upperBound
        : 0;
  return Math.max(0, 1 - distanceOutside / (DATE_DECAY_DAYS * DAY_MS));
};

// ---------------------------------------------------------------------------
// scoreMatch
// ---------------------------------------------------------------------------

/**
 * Score a PPD transaction against a listing+introduction candidate
 * (spec §4.3). Pure: never mutates its inputs.
 *
 * @returns null when the postcode gate fails (either postcode null, or
 *   normalised inequality); otherwise the capped score, a `capped` flag and
 *   the per-component breakdown.
 */
export function scoreMatch(
  ppd: PpdRow,
  listing: ListingForMatch,
): MatchScore | null {
  if (ppd.postcode === null || listing.postcode === null) return null;
  if (normalisePostcode(ppd.postcode) !== normalisePostcode(listing.postcode)) {
    return null;
  }

  const ppdSaon = normalisedSaonOrNull(ppd.saon);
  const listingSaon = normalisedSaonOrNull(listing.saon);

  const paon = paonComponent(ppd.paon, listing.paon);
  const saon =
    ppdSaon !== null && listingSaon !== null && ppdSaon === listingSaon
      ? WEIGHT_SAON
      : 0;
  const street =
    ppd.street !== null &&
    listing.street !== null &&
    trigramSimilarity(ppd.street, listing.street) >= STREET_TRIGRAM_THRESHOLD
      ? WEIGHT_STREET
      : 0;
  const date =
    WEIGHT_DATE *
    datePlausibility(
      ppd.transferDate,
      listing.introduction.occurredAt,
      listing.introduction.tailExpiresAt,
    );
  const price =
    listing.askingPricePence !== null &&
    Math.abs(ppd.pricePence - listing.askingPricePence) <=
      PRICE_TOLERANCE * listing.askingPricePence
      ? WEIGHT_PRICE
      : 0;

  const components: MatchComponents = { paon, saon, street, date, price };
  const rawScore = paon + saon + street + date + price;

  const caps: number[] = [];
  if (ppd.propertyType === "F" && (ppdSaon === null || listingSaon === null)) {
    caps.push(FLAT_SAON_CAP);
  }
  if (ppd.ppdCategory === "B") {
    caps.push(CATEGORY_B_CAP);
  }

  const cap = caps.length > 0 ? Math.min(...caps) : Number.POSITIVE_INFINITY;
  const score = Math.min(rawScore, cap);
  const capped = rawScore - score > CAP_EPSILON;

  return { score, capped, components };
}
