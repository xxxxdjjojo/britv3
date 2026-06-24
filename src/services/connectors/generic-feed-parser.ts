/**
 * Shared parser for RTDF/BLM-shaped XML and JSON feed payloads.
 *
 * Returns a { listings, errors, branches } triple. Never throws — all parse
 * failures surface as RowErrors or as a top-level parse failure returned to the
 * caller. Secrets must never appear in RowError.message.
 */
import { XMLParser } from "fast-xml-parser";
import { sha256 } from "@/lib/hash";
import type { NormalizedFeedListing } from "@/services/agent/agent-feed-import-service";
import type { BranchRecord, RowError } from "./source-connector";
import type {
  ListingType,
  PropertyType,
  RentFrequency,
  TenureType,
  PlanningPermissionStatus,
} from "@/types/property";

// ---------------------------------------------------------------------------
// Allowed enum value sets
// ---------------------------------------------------------------------------

const VALID_STATUS_SOURCE = new Set(["forsale", "tolet", "withdrawn"]);
const VALID_LISTING_TYPES = new Set<ListingType>(["sale", "rent"]);
const VALID_PROPERTY_TYPES = new Set<PropertyType>([
  "detached", "semi_detached", "terraced", "flat", "bungalow",
  "land", "cottage", "penthouse", "studio", "maisonette", "other",
]);
const VALID_TENURE = new Set<TenureType>(["freehold", "leasehold", "shared_ownership"]);
const VALID_PLANNING = new Set<PlanningPermissionStatus>([
  "granted", "pending", "refused", "none_known",
]);
const VALID_RENT_FREQ = new Set<RentFrequency>(["weekly", "monthly", "yearly"]);

// ---------------------------------------------------------------------------
// Raw row shape (loose — JSON or XML-parsed object)
// ---------------------------------------------------------------------------

type RawRow = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function str(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizePropertyType(raw: string): PropertyType {
  const mapped: Record<string, PropertyType> = {
    semi_detached: "semi_detached",
    semidetached: "semi_detached",
    terraced: "terraced",
    detached: "detached",
    flat: "flat",
    apartment: "flat",
    bungalow: "bungalow",
    land: "land",
    cottage: "cottage",
    penthouse: "penthouse",
    studio: "studio",
    maisonette: "maisonette",
  };
  const key = raw.toLowerCase().replace(/[^a-z_]/g, "");
  return (VALID_PROPERTY_TYPES.has(raw as PropertyType) && (raw as PropertyType)) ||
    mapped[key] ||
    "other";
}

function normalizeTenure(raw: string): TenureType | null {
  if (VALID_TENURE.has(raw as TenureType)) return raw as TenureType;
  const mapped: Record<string, TenureType> = {
    sharedownership: "shared_ownership",
    shared_ownership: "shared_ownership",
  };
  return mapped[raw.toLowerCase().replace(/[^a-z_]/g, "")] ?? null;
}

function normalizePlanning(raw: string): PlanningPermissionStatus | null {
  if (VALID_PLANNING.has(raw as PlanningPermissionStatus)) return raw as PlanningPermissionStatus;
  const mapped: Record<string, PlanningPermissionStatus> = {
    none_known: "none_known",
    noneknown: "none_known",
    granted: "granted",
    pending: "pending",
    refused: "refused",
  };
  return mapped[raw.toLowerCase().replace(/[^a-z_]/g, "")] ?? null;
}

function normalizeRentFreq(raw: string): RentFrequency {
  if (VALID_RENT_FREQ.has(raw as RentFrequency)) return raw as RentFrequency;
  return "monthly";
}

/**
 * Normalise the `features` field from both XML and JSON shapes.
 *
 * JSON: features is already a string array → use it directly.
 * XML (via fast-xml-parser with isArray:"feature"):
 *   <features><feature>A</feature><feature>B</feature></features>
 *   → { feature: ["A", "B"] }  — object with a "feature" array key
 * XML single item (without isArray guard):
 *   → { feature: "A" }  — object with a "feature" string key
 * Absent → []
 */
function normalizeFeatures(raw: unknown): string[] {
  if (!raw) return [];
  // JSON array of strings
  if (Array.isArray(raw)) return raw.map(String);
  // XML object shape: { feature: string[] | string }
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const inner = obj["feature"];
    if (Array.isArray(inner)) return inner.map(String);
    if (inner != null) return [String(inner)];
  }
  return [];
}

function extractMedia(raw: unknown): NormalizedFeedListing["media"] {
  if (!raw || typeof raw !== "object") return [];
  // XML: media.item (array or single object); JSON: media (array)
  const mediaObj = raw as Record<string, unknown>;
  let items: unknown[];
  if (Array.isArray(raw)) {
    items = raw;
  } else if (Array.isArray(mediaObj["item"])) {
    items = mediaObj["item"] as unknown[];
  } else if (mediaObj["item"] && typeof mediaObj["item"] === "object") {
    items = [mediaObj["item"]];
  } else {
    return [];
  }

  return items.map((item, idx) => {
    const i = item as Record<string, unknown>;
    return {
      external_id: str(i["id"] ?? i["external_id"]) || `media-${idx}`,
      url: str(i["url"]),
      caption: str(i["caption"]) || null,
      sort_order: num(i["sortOrder"] ?? i["sort_order"], idx),
    };
  });
}

// ---------------------------------------------------------------------------
// Single-row normalizer
// ---------------------------------------------------------------------------

function normalizeRow(
  source: string,
  row: RawRow,
  rowIndex: number | string,
): { listing: NormalizedFeedListing } | { error: RowError } {
  const rawId = str(row["id"] ?? row["external_id"]);
  const rowKey = rawId || String(rowIndex);

  const rawStatus = str(row["status"]).toLowerCase();
  if (!VALID_STATUS_SOURCE.has(rawStatus)) {
    return {
      error: {
        row: rowKey,
        code: "unknown_status",
        message: `Unrecognised status value. Row id: ${rawId || rowIndex}`,
        field: "status",
      },
    };
  }

  const status: NormalizedFeedListing["status"] =
    rawStatus === "withdrawn" ? "withdrawn" : "available";

  // listing_type: from explicit field or infer from status
  const rawListingType = str(row["listingType"] ?? row["listing_type"]).toLowerCase();
  let listingType: ListingType;
  if (rawListingType === "sale" || rawListingType === "forsale") {
    listingType = "sale";
  } else if (rawListingType === "rent" || rawListingType === "tolet") {
    listingType = "rent";
  } else if (VALID_LISTING_TYPES.has(rawListingType as ListingType)) {
    listingType = rawListingType as ListingType;
  } else if (rawStatus === "tolet") {
    listingType = "rent";
  } else if (rawStatus === "forsale") {
    listingType = "sale";
  } else if (rawStatus === "withdrawn") {
    // For tombstones the listing_type is moot — archival matches by external_id.
    // Default to "sale" so the withdrawal always flows through instead of being
    // silently dropped as a RowError.
    listingType = "sale";
  } else {
    return {
      error: {
        row: rowKey,
        code: "unknown_listing_type",
        message: `Unrecognised listingType value. Row id: ${rawId || rowIndex}`,
        field: "listingType",
      },
    };
  }

  const addr = (row["address"] ?? {}) as Record<string, unknown>;
  const prop = (row["property"] ?? {}) as Record<string, unknown>;
  const marketing = (row["marketing"] ?? {}) as Record<string, unknown>;

  const listing: NormalizedFeedListing = {
    source,
    external_id: rawId,
    external_branch_id: str(row["branchId"] ?? row["external_branch_id"]),
    status,
    listing_type: listingType,
    price: num(row["price"] ?? (listingType === "rent" ? prop["rent"] : prop["price"])),
    rent_frequency: listingType === "rent"
      ? normalizeRentFreq(str(row["rentFrequency"] ?? row["rent_frequency"] ?? "monthly"))
      : null,
    address_line1: str(addr["line1"] ?? addr["address_line1"]),
    address_line2: str(addr["line2"] ?? addr["address_line2"]) || null,
    city: str(addr["city"]),
    postcode: str(addr["postcode"]),
    latitude: addr["latitude"] != null ? num(addr["latitude"]) : null,
    longitude: addr["longitude"] != null ? num(addr["longitude"]) : null,
    property_type: normalizePropertyType(str(prop["type"] ?? prop["property_type"])),
    bedrooms: num(prop["bedrooms"]),
    bathrooms: num(prop["bathrooms"]),
    reception_rooms: prop["receptionRooms"] != null ? num(prop["receptionRooms"]) : null,
    square_footage: prop["floorAreaSqFt"] != null ? num(prop["floorAreaSqFt"]) : null,
    title: str(marketing["title"]),
    description: str(marketing["description"]),
    features: { feed_features: normalizeFeatures(marketing["features"]) },
    tenure: normalizeTenure(str(prop["tenure"])),
    planning_permission_status: normalizePlanning(str(prop["planningPermissionStatus"] ?? prop["planning_permission_status"])),
    media: extractMedia(row["media"]),
    raw_payload: row,
  };

  return { listing };
}

// ---------------------------------------------------------------------------
// Exported parse result
// ---------------------------------------------------------------------------

export type ParseResult = {
  listings: NormalizedFeedListing[];
  errors: RowError[];
  branches: BranchRecord[];
  /** SHA-256 over the raw payload string — stable idempotency key. */
  sourceFingerprint: string;
};

export type ParseOptions = {
  source: string;
};

// ---------------------------------------------------------------------------
// BOM stripping
// ---------------------------------------------------------------------------

/** Strip a leading UTF-8 BOM (U+FEFF) so XML/JSON detection works correctly. */
function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

// ---------------------------------------------------------------------------
// XML detection + parsing
// ---------------------------------------------------------------------------

function looksLikeXml(payload: string): boolean {
  return payload.trimStart().startsWith("<");
}

const XML_PARSER = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  parseAttributeValue: true,
  isArray: (name) => ["listing", "item", "feature"].includes(name),
});

function parseXmlRows(payload: string): RawRow[] | { parseError: string } {
  try {
    const parsed = XML_PARSER.parse(payload) as Record<string, unknown>;
    const root = parsed["listings"] as Record<string, unknown> | undefined;
    if (!root) {
      return { parseError: "No <listings> root element found in XML" };
    }
    const rows = root["listing"];
    if (!rows) return [];
    if (Array.isArray(rows)) return rows as RawRow[];
    return [rows as RawRow];
  } catch (e) {
    return { parseError: e instanceof Error ? e.message : "XML parse error" };
  }
}

// ---------------------------------------------------------------------------
// JSON parsing — supports flat {listings:[]} or paginated [{page:N, listings:[]}]
// ---------------------------------------------------------------------------

function parseJsonRows(payload: string): RawRow[] | { parseError: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch (e) {
    return { parseError: e instanceof Error ? e.message : "JSON parse error" };
  }

  // Paginated: array of page objects, each with a "listings" array
  if (Array.isArray(parsed)) {
    const rows: RawRow[] = [];
    for (const page of parsed) {
      const p = page as Record<string, unknown>;
      if (Array.isArray(p["listings"])) {
        rows.push(...(p["listings"] as RawRow[]));
      }
    }
    return rows;
  }

  // Flat: { listings: [...] }
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj["listings"])) return obj["listings"] as RawRow[];
  }

  return { parseError: "Unrecognised JSON feed shape: expected {listings:[]} or [{page,listings:[]}]" };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function parseFeedPayload(
  payload: string,
  opts: ParseOptions,
): ParseResult & { ok: boolean; parseError?: string } {
  const cleaned = stripBom(payload);
  const fingerprint = sha256(cleaned);

  const rowsResult = looksLikeXml(cleaned)
    ? parseXmlRows(cleaned)
    : parseJsonRows(cleaned);

  if ("parseError" in rowsResult) {
    return {
      ok: false,
      parseError: rowsResult.parseError,
      listings: [],
      errors: [],
      branches: [],
      sourceFingerprint: fingerprint,
    };
  }

  const listings: NormalizedFeedListing[] = [];
  const errors: RowError[] = [];
  const branchMap = new Map<string, BranchRecord>();

  for (let i = 0; i < rowsResult.length; i++) {
    const row = rowsResult[i];
    const result = normalizeRow(opts.source, row, i + 1);

    if ("error" in result) {
      errors.push(result.error);
    } else {
      listings.push(result.listing);
      const branchId = result.listing.external_branch_id;
      if (branchId && !branchMap.has(branchId)) {
        branchMap.set(branchId, { externalId: branchId, name: branchId });
      }
    }
  }

  return {
    ok: true,
    listings,
    errors,
    branches: Array.from(branchMap.values()),
    sourceFingerprint: fingerprint,
  };
}
