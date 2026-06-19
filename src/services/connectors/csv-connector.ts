/**
 * csv — SourceConnector for agency CRM CSV exports.
 *
 * Reads ctx.payload (the CSV text) and applies ctx.fieldMapping
 * (sourceHeader → canonical field name) to map each row to a
 * NormalizedFeedListing.  Rows that fail mapping/validation surface as
 * RowErrors; they never throw.
 *
 * Capabilities: full_snapshot, media_urls.
 * (CSV removal is "absent = removed" handled downstream by the empty-feed
 * guard — NOT an explicit tombstone signal.  No tombstones/incremental/
 * webhook_push declared.)
 *
 * CSV tokenisation reuses the tested splitCsvFields from ppd-parser.ts —
 * correctly handles commas-in-quotes and "" escaping.
 */
import { sha256 } from "@/lib/hash";
import { splitCsvFields } from "@/lib/truedeed/ppd-parser";
import type { NormalizedFeedListing } from "@/services/agent/agent-feed-import-service";
import type {
  BranchRecord,
  ConnectorCapability,
  ConnectorContext,
  FetchResult,
  RowError,
  SourceConnector,
} from "./source-connector";

// ---------------------------------------------------------------------------
// Capabilities
// ---------------------------------------------------------------------------

const CSV_CAPABILITIES: ReadonlySet<ConnectorCapability> = new Set<ConnectorCapability>([
  "full_snapshot",
  "media_urls",
]);

// ---------------------------------------------------------------------------
// Required canonical fields (missing → RowError for the row)
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS = [
  "external_id",
  "status",
  "listing_type",
  "price",
  "address_line1",
  "city",
  "postcode",
  "property_type",
  "bedrooms",
  "bathrooms",
  "title",
  "description",
  "tenure",
  "planning_permission_status",
] as const;

// ---------------------------------------------------------------------------
// Enum helpers
// ---------------------------------------------------------------------------

type ListingStatus = "available" | "withdrawn";
type ListingType = NormalizedFeedListing["listing_type"];
type PropertyType = NormalizedFeedListing["property_type"];
type TenureType = NormalizedFeedListing["tenure"];
type PlanningStatus = NormalizedFeedListing["planning_permission_status"];
type RentFrequency = NormalizedFeedListing["rent_frequency"];

const STATUS_MAP: Record<string, ListingStatus> = {
  available: "available",
  forsale: "available",
  active: "available",
  tolet: "available",
  withdrawn: "withdrawn",
  removed: "withdrawn",
  let: "withdrawn",
  sold: "withdrawn",
};

const LISTING_TYPE_MAP: Record<string, ListingType> = {
  sale: "sale",
  forsale: "sale",
  rent: "rent",
  tolet: "rent",
  let: "rent",
};

const PROPERTY_TYPE_MAP: Record<string, PropertyType> = {
  detached: "detached",
  semi_detached: "semi_detached",
  semidetached: "semi_detached",
  terraced: "terraced",
  flat: "flat",
  apartment: "flat",
  bungalow: "bungalow",
  land: "land",
  cottage: "cottage",
  penthouse: "penthouse",
  studio: "studio",
  maisonette: "maisonette",
  other: "other",
};

const TENURE_MAP: Record<string, TenureType> = {
  freehold: "freehold",
  leasehold: "leasehold",
  shared_ownership: "shared_ownership",
  sharedownership: "shared_ownership",
};

const PLANNING_MAP: Record<string, PlanningStatus> = {
  granted: "granted",
  pending: "pending",
  refused: "refused",
  none_known: "none_known",
  noneknown: "none_known",
};

const RENT_FREQ_MAP: Record<string, RentFrequency> = {
  weekly: "weekly",
  monthly: "monthly",
  yearly: "yearly",
};

function normalise(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

function parseNum(raw: string): number | null {
  const n = Number(raw.trim().replace(/[,£$€\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

// ---------------------------------------------------------------------------
// Per-row normalizer
// ---------------------------------------------------------------------------

type RowData = Record<string, string>;

function normalizeRow(
  source: string,
  row: RowData,
  rowIndex: number,
): { listing: NormalizedFeedListing } | { errors: RowError[] } {
  const rowErrors: RowError[] = [];

  function field(name: string): string {
    return (row[name] ?? "").trim();
  }

  function fieldErr(code: string, message: string, f: string): void {
    rowErrors.push({ row: rowIndex, code, message, field: f });
  }

  // status
  const rawStatus = field("status");
  const status = STATUS_MAP[normalise(rawStatus)];
  if (!status) {
    fieldErr("unknown_status", `Unrecognised status value at row ${rowIndex}`, "status");
  }

  // listing_type
  const rawType = field("listing_type");
  const listingType = LISTING_TYPE_MAP[normalise(rawType)];
  if (!listingType && status !== "withdrawn") {
    fieldErr("unknown_listing_type", `Unrecognised listing_type at row ${rowIndex}`, "listing_type");
  }

  // price
  const rawPrice = field("price");
  const price = parseNum(rawPrice);
  if (price === null) {
    fieldErr("invalid_price", `Unparseable price at row ${rowIndex}`, "price");
  }

  // property_type
  const rawPropType = field("property_type");
  const propertyType: PropertyType =
    PROPERTY_TYPE_MAP[normalise(rawPropType)] ?? "other";

  // bedrooms
  const rawBedrooms = field("bedrooms");
  const bedrooms = parseNum(rawBedrooms);
  if (bedrooms === null) {
    fieldErr("invalid_bedrooms", `Unparseable bedrooms at row ${rowIndex}`, "bedrooms");
  }

  // bathrooms
  const rawBathrooms = field("bathrooms");
  const bathrooms = parseNum(rawBathrooms);
  if (bathrooms === null) {
    fieldErr("invalid_bathrooms", `Unparseable bathrooms at row ${rowIndex}`, "bathrooms");
  }

  // required string fields
  for (const f of ["external_id", "address_line1", "city", "postcode", "title", "description"] as const) {
    if (!field(f)) {
      fieldErr("missing_field", `Required field "${f}" is empty at row ${rowIndex}`, f);
    }
  }

  // tenure (required by validateNormalizedListing)
  const rawTenure = field("tenure");
  const tenure: TenureType | null = TENURE_MAP[normalise(rawTenure)] ?? null;
  if (!rawTenure || !tenure) {
    fieldErr("missing_field", `Required field "tenure" is empty or unrecognised at row ${rowIndex}`, "tenure");
  }

  // planning_permission_status (required by validateNormalizedListing)
  const rawPlanning = field("planning_permission_status");
  const planningStatus: PlanningStatus | null = PLANNING_MAP[normalise(rawPlanning)] ?? null;
  if (!rawPlanning || !planningStatus) {
    fieldErr(
      "missing_field",
      `Required field "planning_permission_status" is empty or unrecognised at row ${rowIndex}`,
      "planning_permission_status",
    );
  }

  if (rowErrors.length > 0) {
    return { errors: rowErrors };
  }

  // Optional fields
  const rawAddressLine2 = field("address_line2");
  const rawLatitude = field("latitude");
  const rawLongitude = field("longitude");
  const rawReception = field("reception_rooms");
  const rawSqFt = field("square_footage");
  const rawRentFreq = field("rent_frequency");
  const rawBranchId = field("external_branch_id");
  const rawMediaUrls = field("media_urls");

  const latitude = rawLatitude ? parseNum(rawLatitude) : null;
  const longitude = rawLongitude ? parseNum(rawLongitude) : null;
  const receptionRooms = rawReception ? parseNum(rawReception) : null;
  const squareFootage = rawSqFt ? parseNum(rawSqFt) : null;
  const rentFrequency: RentFrequency | null =
    listingType === "rent"
      ? (RENT_FREQ_MAP[normalise(rawRentFreq)] ?? "monthly")
      : null;

  // Media: semicolon-separated URLs in the media_urls mapped column
  const media: NormalizedFeedListing["media"] = rawMediaUrls
    ? rawMediaUrls
        .split(";")
        .map((u) => u.trim())
        .filter(Boolean)
        .map((url, idx) => ({
          external_id: `${field("external_id")}-img-${idx}`,
          url,
          caption: null,
          sort_order: idx,
        }))
    : [];

  const listing: NormalizedFeedListing = {
    source,
    external_id: field("external_id"),
    external_branch_id: rawBranchId,
    status: status!,
    listing_type: listingType ?? "sale",
    price: price!,
    rent_frequency: rentFrequency,
    address_line1: field("address_line1"),
    address_line2: rawAddressLine2 || null,
    city: field("city"),
    postcode: field("postcode"),
    latitude,
    longitude,
    property_type: propertyType,
    bedrooms: bedrooms!,
    bathrooms: bathrooms!,
    reception_rooms: receptionRooms,
    square_footage: squareFootage,
    title: field("title"),
    description: field("description"),
    features: { feed_features: [] },
    tenure: tenure!,
    planning_permission_status: planningStatus!,
    media,
    raw_payload: row,
  };

  return { listing };
}

// ---------------------------------------------------------------------------
// CSV parsing — using splitCsvFields from ppd-parser (reused tokenizer)
// ---------------------------------------------------------------------------

type ParseCsvResult = {
  listings: NormalizedFeedListing[];
  errors: RowError[];
  branches: BranchRecord[];
  sourceFingerprint: string;
  /** Top-level parse warning (e.g. no payload, no header). */
  parseWarning?: string;
};

function parseCsvPayload(
  source: string,
  csvText: string,
  fieldMapping: Record<string, string>,
): ParseCsvResult {
  const fingerprint = sha256(csvText);

  // Split into non-empty lines
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return {
      listings: [],
      errors: [],
      branches: [],
      sourceFingerprint: fingerprint,
      parseWarning: "CSV payload is empty",
    };
  }

  // First line is the header row
  const headerFields = splitCsvFields(lines[0]);
  if (!headerFields) {
    return {
      listings: [],
      errors: [],
      branches: [],
      sourceFingerprint: fingerprint,
      parseWarning: "CSV header row has unterminated quoted field",
    };
  }

  // Map CSV header → canonical field using fieldMapping
  // headerFields[i] → fieldMapping[headerFields[i]] → canonical name
  const canonicalHeaders: (string | null)[] = headerFields.map(
    (h) => fieldMapping[h.trim()] ?? null,
  );

  const listings: NormalizedFeedListing[] = [];
  const errors: RowError[] = [];
  const branchMap = new Map<string, BranchRecord>();

  // Data rows start at index 1
  for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
    const csvRowNum = lineIdx + 1; // 1-based, 1 = header
    const rowFields = splitCsvFields(lines[lineIdx]);
    if (!rowFields) {
      errors.push({
        row: csvRowNum,
        code: "malformed_row",
        message: `Row ${csvRowNum} has unterminated quoted field`,
      });
      continue;
    }

    // Build the canonical key→value map for this row
    const rowData: RowData = {};
    for (let col = 0; col < canonicalHeaders.length; col++) {
      const canonical = canonicalHeaders[col];
      if (canonical !== null) {
        rowData[canonical] = rowFields[col] ?? "";
      }
    }

    const result = normalizeRow(source, rowData, csvRowNum);

    if ("errors" in result) {
      errors.push(...result.errors);
    } else {
      listings.push(result.listing);
      const branchId = result.listing.external_branch_id;
      if (branchId && !branchMap.has(branchId)) {
        branchMap.set(branchId, { externalId: branchId, name: branchId });
      }
    }
  }

  return {
    listings,
    errors,
    branches: Array.from(branchMap.values()),
    sourceFingerprint: fingerprint,
  };
}

// ---------------------------------------------------------------------------
// Error report helper
// ---------------------------------------------------------------------------

/**
 * Build a downloadable CSV error report from the row errors of a CSV import.
 * Columns: row, field, code, message.
 * Pure function — the UI wires the file download separately.
 *
 * IMPORTANT: message values must NOT contain secrets.  The normalizeRow
 * function ensures this — it never echoes back cell values.
 */
export function buildCsvErrorReport(errors: ReadonlyArray<RowError>): string {
  const header = "row,field,code,message";
  const dataRows = errors.map((e) => {
    const row = String(e.row);
    const fieldVal = e.field ?? "";
    const code = e.code;
    const message = e.message;
    // Quote each field to handle commas/newlines in message text
    return [row, fieldVal, code, message]
      .map((v) => `"${v.replace(/"/g, '""')}"`)
      .join(",");
  });
  return [header, ...dataRows].join("\n");
}

// ---------------------------------------------------------------------------
// CSV SourceConnector
// ---------------------------------------------------------------------------

function getPayloadString(ctx: ConnectorContext): string | null {
  if (ctx.payload == null) return null;
  if (typeof ctx.payload === "string") return ctx.payload;
  return new TextDecoder().decode(ctx.payload);
}

function getFieldMapping(ctx: ConnectorContext): Record<string, string> {
  return ctx.fieldMapping ?? {};
}

export const csvConnector: SourceConnector = {
  provider: "csv",
  capabilities: CSV_CAPABILITIES,

  async testConnection(ctx: ConnectorContext): Promise<{ ok: boolean; message: string }> {
    const payload = getPayloadString(ctx);
    if (!payload) {
      return { ok: false, message: "No CSV payload supplied" };
    }
    const mapping = getFieldMapping(ctx);
    if (Object.keys(mapping).length === 0) {
      return { ok: false, message: "No fieldMapping supplied for CSV connector" };
    }
    const result = parseCsvPayload("csv", payload, mapping);
    if (result.parseWarning) {
      return { ok: false, message: result.parseWarning };
    }
    return {
      ok: true,
      message: `CSV parsed OK — ${result.listings.length} listings, ${result.errors.length} row errors`,
    };
  },

  async discoverBranches(ctx: ConnectorContext): Promise<{ branches: ReadonlyArray<BranchRecord> }> {
    const payload = getPayloadString(ctx);
    if (!payload) return { branches: [] };
    const mapping = getFieldMapping(ctx);
    const result = parseCsvPayload("csv", payload, mapping);
    return { branches: result.branches };
  },

  async fetchListings(ctx: ConnectorContext): Promise<FetchResult> {
    const payload = getPayloadString(ctx);
    if (!payload) {
      return {
        listings: [],
        errors: [],
        sourceFingerprint: "",
        branches: [],
        transport: { ok: false, itemsSeen: 0, warnings: ["No CSV payload supplied"] },
      };
    }

    const mapping = getFieldMapping(ctx);
    const result = parseCsvPayload("csv", payload, mapping);

    if (result.parseWarning) {
      return {
        listings: [],
        errors: [],
        sourceFingerprint: result.sourceFingerprint,
        branches: [],
        transport: { ok: false, itemsSeen: 0, warnings: [result.parseWarning] },
      };
    }

    return {
      listings: result.listings,
      errors: result.errors,
      sourceFingerprint: result.sourceFingerprint,
      branches: result.branches,
      transport: {
        ok: true,
        itemsSeen: result.listings.length + result.errors.length,
        warnings: [],
      },
    };
  },
};
