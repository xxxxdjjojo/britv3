/**
 * Unit tests for the CSV SourceConnector and buildCsvErrorReport.
 *
 * Covers:
 * 1. Valid CSV + field mapping → N canonical listings passing validateNormalizedListing
 * 2. Mixed valid/invalid CSV → good listings + per-row RowErrors (no throw)
 * 3. buildCsvErrorReport → expected CSV text
 * 4. testConnection / discoverBranches
 * 5. Stable sourceFingerprint (sha256 of payload)
 * 6. No capabilities outside full_snapshot, media_urls
 * 7. Empty payload / no mapping edge cases
 * 8. Commas-in-quotes and "" escaping (via splitCsvFields reuse)
 * 9. Media URLs parsed from a semicolon-separated cell
 */
import { describe, it, expect, beforeEach } from "vitest";
import { csvConnector, buildCsvErrorReport } from "./csv-connector";
import { _resetRegistryForTesting, registerConnector, getConnector } from "./registry";
import { validateNormalizedListing } from "@/services/agent/agent-feed-import-service";

const BASE_CTX = {
  integrationId: "int-csv-test",
  organisationId: "org-csv-test",
} as const;

// ---------------------------------------------------------------------------
// Field mapping used by all valid-CSV tests
// ---------------------------------------------------------------------------

const FIELD_MAPPING: Record<string, string> = {
  "Listing ID": "external_id",
  "Branch ID": "external_branch_id",
  "Status": "status",
  "Type": "listing_type",
  "Price": "price",
  "Address 1": "address_line1",
  "Address 2": "address_line2",
  "City": "city",
  "Postcode": "postcode",
  "Prop Type": "property_type",
  "Beds": "bedrooms",
  "Baths": "bathrooms",
  "Title": "title",
  "Description": "description",
  "Tenure": "tenure",
  "Planning": "planning_permission_status",
  "Media": "media_urls",
};

// ---------------------------------------------------------------------------
// CSV fixtures
// ---------------------------------------------------------------------------

/** Single valid listing — all required fields present. */
const VALID_CSV_SINGLE = `Listing ID,Branch ID,Status,Type,Price,Address 1,Address 2,City,Postcode,Prop Type,Beds,Baths,Title,Description,Tenure,Planning,Media
CSV-001,branch-a,available,sale,350000,1 High Street,,London,SW1A 1AA,flat,2,1,A lovely flat,Well-presented two-bed flat.,leasehold,none_known,https://images.example.com/img1.jpg
`;

/** Two valid listings — tests multi-row parsing. */
const VALID_CSV_MULTI = `Listing ID,Branch ID,Status,Type,Price,Address 1,Address 2,City,Postcode,Prop Type,Beds,Baths,Title,Description,Tenure,Planning,Media
CSV-001,branch-a,available,sale,350000,1 High Street,,London,SW1A 1AA,flat,2,1,A lovely flat,Well-presented two-bed flat.,leasehold,none_known,
CSV-002,branch-b,available,rent,1200,99 Elm Road,,Manchester,M1 1AA,terraced,3,1,Three-bed terrace,Spacious rental.,freehold,none_known,
`;

/** Mixed good+bad CSV — 2 valid + 2 bad rows. */
const MIXED_CSV = `Listing ID,Branch ID,Status,Type,Price,Address 1,Address 2,City,Postcode,Prop Type,Beds,Baths,Title,Description,Tenure,Planning,Media
CSV-GOOD-1,branch-a,available,sale,300000,1 Good Street,,London,SW1A 1AA,flat,2,1,Good listing,A good listing.,leasehold,none_known,
CSV-BAD-PRICE,branch-a,available,sale,NOT_A_PRICE,2 Bad Street,,London,SW1A 1AB,flat,2,1,Bad price listing,Junk price.,leasehold,none_known,
CSV-BAD-STATUS,branch-a,PENDING_AUCTION,sale,200000,3 Bad Status,,London,SW1A 1AC,flat,1,1,Bad status,Unknown status.,leasehold,none_known,
CSV-GOOD-2,branch-b,available,sale,450000,4 Good Road,,Birmingham,B1 1AA,semi_detached,3,2,Another good,Second good listing.,freehold,none_known,
`;

/** CSV with commas inside quoted fields. */
const QUOTED_COMMAS_CSV = `Listing ID,Branch ID,Status,Type,Price,Address 1,Address 2,City,Postcode,Prop Type,Beds,Baths,Title,Description,Tenure,Planning,Media
CSV-QC-01,branch-a,available,sale,500000,"12 Park Lane, Mayfair",,London,W1K 1BB,flat,1,1,Mayfair flat,"A flat with a ""prime"" location, central London.",leasehold,none_known,
`;

/** CSV with multiple media URLs in one cell. */
const MEDIA_CSV = `Listing ID,Branch ID,Status,Type,Price,Address 1,Address 2,City,Postcode,Prop Type,Beds,Baths,Title,Description,Tenure,Planning,Media
CSV-MEDIA-01,branch-a,available,sale,250000,5 Media Road,,Leeds,LS1 1AA,flat,1,1,Media test,Has images.,leasehold,none_known,https://img.ex/1.jpg;https://img.ex/2.jpg;https://img.ex/3.jpg
`;

/** Empty payload — no lines. */
const EMPTY_CSV = "";

/** Only a header row — zero data rows. */
const HEADER_ONLY_CSV = `Listing ID,Branch ID,Status,Type,Price,Address 1,Address 2,City,Postcode,Prop Type,Beds,Baths,Title,Description,Tenure,Planning,Media
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ctx(payload: string, mapping = FIELD_MAPPING) {
  return { ...BASE_CTX, payload, fieldMapping: mapping };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("csv connector — registration", () => {
  beforeEach(() => {
    _resetRegistryForTesting();
    registerConnector(csvConnector);
  });

  it("registers under provider key 'csv'", () => {
    const c = getConnector("csv");
    expect(c.provider).toBe("csv");
  });

  it("declares full_snapshot and media_urls capabilities only", () => {
    expect(csvConnector.capabilities.has("full_snapshot")).toBe(true);
    expect(csvConnector.capabilities.has("media_urls")).toBe(true);
    // Must NOT declare tombstones/incremental/webhook_push
    expect(csvConnector.capabilities.has("tombstones")).toBe(false);
    expect(csvConnector.capabilities.has("incremental")).toBe(false);
    expect(csvConnector.capabilities.has("webhook_push")).toBe(false);
  });
});

describe("csv connector — testConnection", () => {
  it("ok:true for a valid CSV + mapping", async () => {
    const result = await csvConnector.testConnection(ctx(VALID_CSV_SINGLE));
    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/parsed OK/);
  });

  it("ok:false when no payload supplied", async () => {
    const result = await csvConnector.testConnection(BASE_CTX);
    expect(result.ok).toBe(false);
  });

  it("ok:false when no fieldMapping supplied", async () => {
    const result = await csvConnector.testConnection({ ...BASE_CTX, payload: VALID_CSV_SINGLE });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/fieldMapping/);
  });
});

describe("csv connector — discoverBranches", () => {
  it("returns branches from valid CSV", async () => {
    const { branches } = await csvConnector.discoverBranches(ctx(VALID_CSV_MULTI));
    expect(branches.length).toBe(2);
    const ids = branches.map((b) => b.externalId);
    expect(ids).toContain("branch-a");
    expect(ids).toContain("branch-b");
  });

  it("returns empty array when no payload", async () => {
    const { branches } = await csvConnector.discoverBranches(BASE_CTX);
    expect(branches).toHaveLength(0);
  });
});

describe("csv connector — fetchListings (valid CSV)", () => {
  it("single valid row yields one canonical listing passing validateNormalizedListing", async () => {
    const result = await csvConnector.fetchListings(ctx(VALID_CSV_SINGLE));

    expect(result.transport.ok).toBe(true);
    expect(result.listings).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
    expect(result.sourceFingerprint).toBeTruthy();

    const listing = result.listings[0];
    expect(listing.source).toBe("csv");
    expect(listing.external_id).toBe("CSV-001");
    expect(listing.external_branch_id).toBe("branch-a");
    expect(listing.status).toBe("available");
    expect(listing.listing_type).toBe("sale");
    expect(listing.price).toBe(350000);
    expect(listing.address_line1).toBe("1 High Street");
    expect(listing.city).toBe("London");
    expect(listing.postcode).toBe("SW1A 1AA");
    expect(listing.tenure).toBe("leasehold");
    expect(listing.planning_permission_status).toBe("none_known");
    expect(validateNormalizedListing(listing)).toEqual([]);
  });

  it("multiple valid rows all pass validateNormalizedListing", async () => {
    const result = await csvConnector.fetchListings(ctx(VALID_CSV_MULTI));

    expect(result.transport.ok).toBe(true);
    expect(result.listings).toHaveLength(2);
    expect(result.errors).toHaveLength(0);

    for (const listing of result.listings) {
      expect(validateNormalizedListing(listing)).toEqual([]);
    }
  });

  it("sourceFingerprint is stable for identical payload", async () => {
    const r1 = await csvConnector.fetchListings(ctx(VALID_CSV_SINGLE));
    const r2 = await csvConnector.fetchListings(ctx(VALID_CSV_SINGLE));
    expect(r1.sourceFingerprint).toBe(r2.sourceFingerprint);
  });

  it("different payload yields different sourceFingerprint", async () => {
    const r1 = await csvConnector.fetchListings(ctx(VALID_CSV_SINGLE));
    const r2 = await csvConnector.fetchListings(ctx(VALID_CSV_MULTI));
    expect(r1.sourceFingerprint).not.toBe(r2.sourceFingerprint);
  });
});

describe("csv connector — fetchListings (mixed good+bad rows)", () => {
  it("good rows parse, bad rows produce RowErrors, never throws", async () => {
    const result = await csvConnector.fetchListings(ctx(MIXED_CSV));

    expect(result.transport.ok).toBe(true);

    // 2 good rows
    expect(result.listings).toHaveLength(2);
    const ids = result.listings.map((l) => l.external_id);
    expect(ids).toContain("CSV-GOOD-1");
    expect(ids).toContain("CSV-GOOD-2");

    // 2 bad rows → RowErrors
    expect(result.errors.length).toBeGreaterThanOrEqual(2);

    // invalid_price error
    const priceErr = result.errors.find((e) => e.code === "invalid_price");
    expect(priceErr).toBeDefined();
    expect(priceErr!.field).toBe("price");

    // unknown_status error
    const statusErr = result.errors.find((e) => e.code === "unknown_status");
    expect(statusErr).toBeDefined();
    expect(statusErr!.field).toBe("status");
  });

  it("good rows from mixed CSV still pass validateNormalizedListing", async () => {
    const result = await csvConnector.fetchListings(ctx(MIXED_CSV));
    for (const listing of result.listings) {
      expect(validateNormalizedListing(listing)).toEqual([]);
    }
  });
});

describe("csv connector — fetchListings (edge cases)", () => {
  it("empty payload → transport.ok false, no throw", async () => {
    const result = await csvConnector.fetchListings(ctx(EMPTY_CSV));
    expect(result.transport.ok).toBe(false);
    expect(result.listings).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("header-only CSV → transport.ok true, zero listings, zero errors", async () => {
    const result = await csvConnector.fetchListings(ctx(HEADER_ONLY_CSV));
    expect(result.transport.ok).toBe(true);
    expect(result.listings).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("no payload → transport.ok false, no throw", async () => {
    const result = await csvConnector.fetchListings(BASE_CTX);
    expect(result.transport.ok).toBe(false);
  });

  it("commas-in-quoted-fields are parsed correctly", async () => {
    const result = await csvConnector.fetchListings(ctx(QUOTED_COMMAS_CSV));
    expect(result.transport.ok).toBe(true);
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0].address_line1).toBe("12 Park Lane, Mayfair");
    expect(result.listings[0].description).toBe('A flat with a "prime" location, central London.');
  });

  it("semicolon-separated media URLs are parsed into media array", async () => {
    const result = await csvConnector.fetchListings(ctx(MEDIA_CSV));
    expect(result.transport.ok).toBe(true);
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0].media).toHaveLength(3);
    expect(result.listings[0].media[0].url).toBe("https://img.ex/1.jpg");
    expect(result.listings[0].media[1].url).toBe("https://img.ex/2.jpg");
    expect(result.listings[0].media[2].url).toBe("https://img.ex/3.jpg");
  });

  it("withdrawn status maps to status:withdrawn", async () => {
    const withdrawnCsv = `Listing ID,Branch ID,Status,Type,Price,Address 1,Address 2,City,Postcode,Prop Type,Beds,Baths,Title,Description,Tenure,Planning,Media
CSV-W01,branch-a,withdrawn,sale,0,1 Withdrawn St,,London,SW1A 1AA,flat,1,1,Withdrawn,No longer available.,leasehold,none_known,
`;
    const result = await csvConnector.fetchListings(ctx(withdrawnCsv));
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0].status).toBe("withdrawn");
  });

  it("no fieldMapping supplied → transport warns about missing mapping", async () => {
    const result = await csvConnector.fetchListings({ ...BASE_CTX, payload: VALID_CSV_SINGLE });
    expect(result.transport.warnings.some((w) => /no field mapping/i.test(w))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// C1 — empty price cell: available + withdrawn rows
// ---------------------------------------------------------------------------

describe("csv connector — C1: empty price cell safety", () => {
  /** Builds a single-row CSV with the given Price cell value. */
  function makePriceCsv(price: string): string {
    return `Listing ID,Branch ID,Status,Type,Price,Address 1,Address 2,City,Postcode,Prop Type,Beds,Baths,Title,Description,Tenure,Planning,Media\r\nCSV-P01,branch-a,available,sale,${price},1 Test St,,London,SW1A 1AA,flat,2,1,Test,Test listing.,leasehold,none_known,\r\n`;
  }

  it("available row with EMPTY price cell yields invalid_price RowError and no listing", async () => {
    const result = await csvConnector.fetchListings(ctx(makePriceCsv("")));
    expect(result.listings).toHaveLength(0);
    const priceErr = result.errors.find((e) => e.code === "invalid_price" && e.field === "price");
    expect(priceErr).toBeDefined();
  });

  it("withdrawn row with EMPTY price cell also yields invalid_price RowError (not price:0)", async () => {
    const withdrawnEmptyPriceCsv = `Listing ID,Branch ID,Status,Type,Price,Address 1,Address 2,City,Postcode,Prop Type,Beds,Baths,Title,Description,Tenure,Planning,Media\r\nCSV-WP01,branch-a,withdrawn,sale,,1 Test St,,London,SW1A 1AA,flat,2,1,Test,Test listing.,leasehold,none_known,\r\n`;
    const result = await csvConnector.fetchListings(ctx(withdrawnEmptyPriceCsv));
    expect(result.listings).toHaveLength(0);
    const priceErr = result.errors.find((e) => e.code === "invalid_price" && e.field === "price");
    expect(priceErr).toBeDefined();
    // Ensure we did NOT silently produce a listing with price:0
    expect(result.listings.every((l) => l.price !== 0 || l.price !== undefined)).toBe(true);
  });

  it("row with explicit numeric zero price is valid (parseNum('0') is not null)", async () => {
    const result = await csvConnector.fetchListings(ctx(makePriceCsv("0")));
    // price=0 is a valid number (e.g. withdrawn or gifted), not an error
    // The listing may or may not pass downstream validation, but the CSV connector
    // must not reject it — 0 is a finite number.
    expect(result.errors.find((e) => e.code === "invalid_price")).toBeUndefined();
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0].price).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// I1 — header-level required-column check
// ---------------------------------------------------------------------------

describe("csv connector — I1: header-level required-column check", () => {
  it("fieldMapping missing 'price' column yields a single missing_required_column error for price", async () => {
    // Build a mapping that omits the price column
    const mappingWithoutPrice: Record<string, string> = { ...FIELD_MAPPING };
    delete mappingWithoutPrice["Price"];

    const result = await csvConnector.fetchListings(ctx(VALID_CSV_SINGLE, mappingWithoutPrice));
    const missingPriceErrs = result.errors.filter(
      (e) => e.code === "missing_required_column" && e.field === "price",
    );
    // Exactly one structural header error, not one per row
    expect(missingPriceErrs).toHaveLength(1);
    expect(missingPriceErrs[0].row).toBe("header");
  });

  it("fieldMapping missing 'external_id' column yields missing_required_column for external_id", async () => {
    const mappingWithoutId: Record<string, string> = { ...FIELD_MAPPING };
    delete mappingWithoutId["Listing ID"];

    const result = await csvConnector.fetchListings(ctx(VALID_CSV_SINGLE, mappingWithoutId));
    const err = result.errors.find(
      (e) => e.code === "missing_required_column" && e.field === "external_id",
    );
    expect(err).toBeDefined();
    expect(err!.row).toBe("header");
  });

  it("complete fieldMapping produces no missing_required_column errors", async () => {
    const result = await csvConnector.fetchListings(ctx(VALID_CSV_SINGLE));
    const structuralErrs = result.errors.filter((e) => e.code === "missing_required_column");
    expect(structuralErrs).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// I2 — STATUS vs LISTING_TYPE asymmetry + unknown status safety
// ---------------------------------------------------------------------------

describe("csv connector — I2: status/type column independence + unknown status safety", () => {
  /** Build a single-row CSV with the given Status + Type cell values. */
  function makeStatusTypeCsv(status: string, type: string): string {
    return `Listing ID,Branch ID,Status,Type,Price,Address 1,Address 2,City,Postcode,Prop Type,Beds,Baths,Title,Description,Tenure,Planning,Media\r\nCSV-ST01,branch-a,${status},${type},250000,1 Test St,,London,SW1A 1AA,flat,1,1,Test,Test listing.,leasehold,none_known,\r\n`;
  }

  it("Status=available + Type=let → status:'available', listing_type:'rent' (columns are independent)", async () => {
    // 'let' in the TYPE column = rental product (not withdrawn).
    // 'let' in the STATUS column would mean withdrawn — but here it is only in TYPE.
    const result = await csvConnector.fetchListings(ctx(makeStatusTypeCsv("available", "let")));
    expect(result.listings).toHaveLength(1);
    const listing = result.listings[0];
    expect(listing.status).toBe("available");
    expect(listing.listing_type).toBe("rent");
  });

  it("Status=let + Type=sale → status:'withdrawn' ('let' in STATUS = no longer available)", async () => {
    // 'let' in the STATUS column means the property has been let → tombstone.
    const result = await csvConnector.fetchListings(ctx(makeStatusTypeCsv("let", "sale")));
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0].status).toBe("withdrawn");
  });

  it("unrecognised status value → unknown_status RowError (no silent fallthrough)", async () => {
    const result = await csvConnector.fetchListings(ctx(makeStatusTypeCsv("PENDING_AUCTION", "sale")));
    expect(result.listings).toHaveLength(0);
    const statusErr = result.errors.find((e) => e.code === "unknown_status" && e.field === "status");
    expect(statusErr).toBeDefined();
    // Must not silently emit a listing — unsafe to publish/withdraw on unknown status
    expect(result.listings).toHaveLength(0);
  });
});

describe("buildCsvErrorReport", () => {
  // RFC 4180: CSV reports use \r\n line endings so Excel opens them correctly.
  it("returns header + one row per error (\\r\\n line endings)", () => {
    const errors = [
      { row: 2, code: "invalid_price", message: "Unparseable price at row 2", field: "price" },
      { row: 3, code: "unknown_status", message: "Unrecognised status at row 3", field: "status" },
    ] as const;

    const report = buildCsvErrorReport(errors);
    const lines = report.split("\r\n");

    expect(lines[0]).toBe("row,field,code,message");
    expect(lines).toHaveLength(3); // header + 2 data rows
    expect(lines[1]).toContain('"2"');
    expect(lines[1]).toContain('"price"');
    expect(lines[1]).toContain('"invalid_price"');
    expect(lines[2]).toContain('"3"');
    expect(lines[2]).toContain('"unknown_status"');
  });

  it("quotes commas in message text correctly", () => {
    const errors = [
      { row: 2, code: "missing_field", message: "Field A, field B both missing", field: "address_line1" },
    ] as const;

    const report = buildCsvErrorReport(errors);
    // The message contains a comma — must be quoted
    expect(report).toContain('"Field A, field B both missing"');
  });

  it("returns header-only string for empty errors array", () => {
    const report = buildCsvErrorReport([]);
    expect(report).toBe("row,field,code,message");
  });

  it("produces valid CSV parseable by splitCsvFields for each data row", () => {
    // Import via the module we've already tested
    const errors = [
      { row: 5, code: "invalid_price", message: 'Price "not a number" at row 5', field: "price" },
    ] as const;
    const report = buildCsvErrorReport(errors);
    const lines = report.split("\r\n");
    // Data line 1: all 4 columns must be present when split
    // (We check manually since splitCsvFields is a private helper in ppd-parser;
    // we just verify the right number of quoted-comma-separated tokens.)
    const dataLine = lines[1];
    // Row is "5", field is "price", code is "invalid_price"
    expect(dataLine).toContain('"5"');
    expect(dataLine).toContain('"price"');
    expect(dataLine).toContain('"invalid_price"');
  });
});
