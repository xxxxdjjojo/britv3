import { containsProfanity, findProfanity } from "@/lib/profanity";

export type ModerationFlag = {
  reason: "profanity" | "price_anomaly" | "duplicate";
  severity: "low" | "medium" | "high";
  details: string;
};

type PropertyPriceRange = {
  min: number;
  max: number;
};

const PROPERTY_PRICE_RANGES: Record<string, PropertyPriceRange> = {
  flat: { min: 50_000, max: 2_000_000 },
  apartment: { min: 50_000, max: 2_000_000 },
  house: { min: 80_000, max: 5_000_000 },
  terraced: { min: 80_000, max: 3_000_000 },
  semi_detached: { min: 80_000, max: 4_000_000 },
  detached: { min: 100_000, max: 5_000_000 },
  bungalow: { min: 80_000, max: 2_000_000 },
  cottage: { min: 80_000, max: 2_000_000 },
  studio: { min: 30_000, max: 1_000_000 },
  room: { min: 10_000, max: 500_000 },
  land: { min: 5_000, max: 10_000_000 },
  commercial: { min: 10_000, max: 20_000_000 },
  default: { min: 10_000, max: 10_000_000 },
};

export function detectPriceAnomaly(
  price: number,
  propertyType: string,
  _region?: string,
): ModerationFlag | null {
  const range =
    PROPERTY_PRICE_RANGES[propertyType.toLowerCase()] ??
    PROPERTY_PRICE_RANGES.default;

  const isAnomaly = price < range.min || price > range.max;
  if (!isAnomaly) return null;

  const severity: ModerationFlag["severity"] =
    price <= 0 || price < range.min / 10 || price > range.max * 5
      ? "high"
      : "medium";

  return {
    reason: "price_anomaly",
    severity,
    details: `Price £${price.toLocaleString()} is outside expected range £${range.min.toLocaleString()} – £${range.max.toLocaleString()} for ${propertyType}`,
  };
}

function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/[,.\-#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarityScore(a: string, b: string): number {
  const normalA = normalizeAddress(a);
  const normalB = normalizeAddress(b);

  if (normalA === normalB) return 1;

  const setA = new Set(normalA.split(" ").filter(Boolean));
  const setB = new Set(normalB.split(" ").filter(Boolean));

  const intersection = new Set([...setA].filter((word) => setB.has(word)));
  const union = new Set([...setA, ...setB]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

const DUPLICATE_THRESHOLD = 0.7;

export function detectDuplicate(
  address: string,
  existingAddresses: string[],
): { isDuplicate: boolean; matchedAddress?: string; score: number } {
  if (existingAddresses.length === 0) {
    return { isDuplicate: false, score: 0 };
  }

  let bestScore = 0;
  let bestMatch: string | undefined;

  for (const existing of existingAddresses) {
    const score = similarityScore(address, existing);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = existing;
    }
  }

  return {
    isDuplicate: bestScore >= DUPLICATE_THRESHOLD,
    matchedAddress: bestScore >= DUPLICATE_THRESHOLD ? bestMatch : undefined,
    score: bestScore,
  };
}

type ListingInput = {
  title: string;
  description: string;
  price: number;
  property_type: string;
  address: string;
};

export function flagListing(listing: ListingInput): {
  flags: ModerationFlag[];
} {
  const flags: ModerationFlag[] = [];

  const combinedText = `${listing.title} ${listing.description}`;
  if (containsProfanity(combinedText)) {
    const found = findProfanity(combinedText);
    flags.push({
      reason: "profanity",
      severity: "high",
      details: `Profanity detected in listing content: ${found.join(", ")}`,
    });
  }

  const priceFlag = detectPriceAnomaly(listing.price, listing.property_type);
  if (priceFlag) {
    flags.push(priceFlag);
  }

  return { flags };
}
