/**
 * Contract tests for sandbox + generic_feed connectors.
 *
 * Covers all 6 required behaviours:
 *  1. Full sync — valid fixture yields N canonical listings, validation passes, branches derived, fingerprint stable
 *  2. Incremental price-change — different fixture → different fingerprint, changed price reflected
 *  3. Withdrawal / tombstone — withdrawn listing maps to status:"withdrawn"
 *  4. Unknown enum — unrecognised status/listing_type → RowError (code "unknown_status"), rest still parses
 *  5. Invalid payload — malformed XML/JSON handled gracefully (no throw)
 *  6. Pagination — multi-page assembly produces all listings
 *
 * Also: testConnection, discoverBranches.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { sandboxConnector, genericFeedConnector } from "./sandbox-connector";
import { _resetRegistryForTesting, registerConnector, getConnector } from "./registry";
import { validateNormalizedListing } from "@/services/agent/agent-feed-import-service";

const BASE_CTX = { integrationId: "int-test", organisationId: "org-test" } as const;

// ---------------------------------------------------------------------------
// Reusable XML/JSON payloads (inline, no file I/O in test body)
// ---------------------------------------------------------------------------

/** XML with multiple <feature> children — tests I1 (XML feature extraction). */
const XML_WITH_FEATURES = `<?xml version="1.0" encoding="UTF-8"?>
<listings>
  <listing id="FT-001" branchId="branch-ft">
    <status>forSale</status>
    <listingType>sale</listingType>
    <price>300000</price>
    <address>
      <line1>1 Feature Road</line1>
      <city>London</city>
      <postcode>SW1A 2AA</postcode>
    </address>
    <property>
      <type>flat</type>
      <bedrooms>2</bedrooms>
      <bathrooms>1</bathrooms>
      <tenure>leasehold</tenure>
      <planningPermissionStatus>none_known</planningPermissionStatus>
    </property>
    <marketing>
      <title>Flat with features</title>
      <description>A flat.</description>
      <features>
        <feature>South-facing garden</feature>
        <feature>Off-street parking</feature>
        <feature>Newly fitted kitchen</feature>
      </features>
    </marketing>
    <media/>
  </listing>
</listings>`;

/** XML with an unknown listingType on a non-withdrawn row — tests I2. */
const UNKNOWN_LISTING_TYPE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<listings>
  <listing id="LT-OK" branchId="branch-lt">
    <status>forSale</status>
    <listingType>sale</listingType>
    <price>200000</price>
    <address>
      <line1>1 Good Street</line1>
      <city>Bristol</city>
      <postcode>BS1 1AA</postcode>
    </address>
    <property>
      <type>flat</type>
      <bedrooms>1</bedrooms>
      <bathrooms>1</bathrooms>
      <tenure>leasehold</tenure>
      <planningPermissionStatus>none_known</planningPermissionStatus>
    </property>
    <marketing>
      <title>Good listing</title>
      <description>A good listing.</description>
    </marketing>
    <media/>
  </listing>
  <listing id="LT-BAD" branchId="branch-lt">
    <status>forSale</status>
    <listingType>unknown_kind</listingType>
    <price>150000</price>
    <address>
      <line1>2 Bad Street</line1>
      <city>Leeds</city>
      <postcode>LS1 1AA</postcode>
    </address>
    <property>
      <type>flat</type>
      <bedrooms>1</bedrooms>
      <bathrooms>1</bathrooms>
      <tenure>leasehold</tenure>
      <planningPermissionStatus>none_known</planningPermissionStatus>
    </property>
    <marketing>
      <title>Bad listingType listing</title>
      <description>Non-withdrawn row with junk listingType — should produce unknown_listing_type error.</description>
    </marketing>
    <media/>
  </listing>
</listings>`;

/**
 * XML with a withdrawn row that has NO listingType field — tests that the tombstone
 * path is never silently dropped (the withdrawn fallback must kick in).
 */
const XML_WITHDRAWN_NO_LISTING_TYPE = `<?xml version="1.0" encoding="UTF-8"?>
<listings>
  <listing id="WR-NT-001" branchId="branch-wr">
    <status>withdrawn</status>
    <price>0</price>
    <address>
      <line1>3 Ghost Lane</line1>
      <city>Sheffield</city>
      <postcode>S1 1AA</postcode>
    </address>
    <property>
      <type>flat</type>
      <bedrooms>1</bedrooms>
      <bathrooms>1</bathrooms>
      <tenure>leasehold</tenure>
      <planningPermissionStatus>none_known</planningPermissionStatus>
    </property>
    <marketing>
      <title>Withdrawn, no type</title>
      <description>Tombstone row with no listingType field.</description>
    </marketing>
    <media/>
  </listing>
</listings>`;

/** XML with a withdrawn to-let listing — tests M4 (explicit listingType honoured). */
const XML_WITHDRAWN_TOLET = `<?xml version="1.0" encoding="UTF-8"?>
<listings>
  <listing id="WR-001" branchId="branch-wr">
    <status>withdrawn</status>
    <listingType>rent</listingType>
    <price>0</price>
    <address>
      <line1>5 Withdrawn Mews</line1>
      <city>Leeds</city>
      <postcode>LS1 2AB</postcode>
    </address>
    <property>
      <type>flat</type>
      <bedrooms>1</bedrooms>
      <bathrooms>1</bathrooms>
      <tenure>leasehold</tenure>
      <planningPermissionStatus>none_known</planningPermissionStatus>
    </property>
    <marketing>
      <title>Withdrawn rental</title>
      <description>Previously to-let, now withdrawn.</description>
    </marketing>
    <media/>
  </listing>
</listings>`;

/** A minimal valid XML listing (BLM-inspired shape). */
const VALID_XML_SINGLE = `<?xml version="1.0" encoding="UTF-8"?>
<listings>
  <listing id="GF-001" branchId="branch-a">
    <status>forSale</status>
    <listingType>sale</listingType>
    <price>350000</price>
    <address>
      <line1>1 High Street</line1>
      <city>London</city>
      <postcode>SW1A 1AA</postcode>
      <latitude>51.5</latitude>
      <longitude>-0.1</longitude>
    </address>
    <property>
      <type>flat</type>
      <bedrooms>2</bedrooms>
      <bathrooms>1</bathrooms>
      <tenure>leasehold</tenure>
      <planningPermissionStatus>none_known</planningPermissionStatus>
    </property>
    <marketing>
      <title>Lovely flat in central London</title>
      <description>A well-presented two-bedroom flat.</description>
    </marketing>
    <media>
      <item id="img-1" sortOrder="1">
        <url>https://example.com/img1.jpg</url>
      </item>
    </media>
  </listing>
</listings>`;

/** Same listing with a different price — for the incremental price-change test. */
const VALID_XML_PRICE_CHANGED = VALID_XML_SINGLE.replace("<price>350000</price>", "<price>375000</price>");

/** XML with a withdrawn listing. */
const VALID_XML_WITHDRAWN = `<?xml version="1.0" encoding="UTF-8"?>
<listings>
  <listing id="GF-W01" branchId="branch-b">
    <status>withdrawn</status>
    <listingType>sale</listingType>
    <price>0</price>
    <address>
      <line1>99 Elm Road</line1>
      <city>Manchester</city>
      <postcode>M1 1AA</postcode>
    </address>
    <property>
      <type>detached</type>
      <bedrooms>4</bedrooms>
      <bathrooms>2</bathrooms>
      <tenure>freehold</tenure>
      <planningPermissionStatus>none_known</planningPermissionStatus>
    </property>
    <marketing>
      <title>Withdrawn property</title>
      <description>No longer for sale.</description>
    </marketing>
    <media/>
  </listing>
</listings>`;

/** XML with an unknown status value. */
const UNKNOWN_STATUS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<listings>
  <listing id="GF-OK" branchId="branch-a">
    <status>forSale</status>
    <listingType>sale</listingType>
    <price>200000</price>
    <address>
      <line1>5 Oak Avenue</line1>
      <city>Bristol</city>
      <postcode>BS1 1AA</postcode>
    </address>
    <property>
      <type>terraced</type>
      <bedrooms>3</bedrooms>
      <bathrooms>1</bathrooms>
      <tenure>freehold</tenure>
      <planningPermissionStatus>none_known</planningPermissionStatus>
    </property>
    <marketing>
      <title>Three-bed terrace</title>
      <description>A lovely terraced house.</description>
    </marketing>
    <media/>
  </listing>
  <listing id="GF-BAD" branchId="branch-a">
    <status>PENDING_AUCTION</status>
    <listingType>unknown_listing_kind</listingType>
    <price>150000</price>
    <address>
      <line1>2 Bad Lane</line1>
      <city>Leeds</city>
      <postcode>LS1 1AA</postcode>
    </address>
    <property>
      <type>flat</type>
      <bedrooms>1</bedrooms>
      <bathrooms>1</bathrooms>
      <tenure>leasehold</tenure>
      <planningPermissionStatus>none_known</planningPermissionStatus>
    </property>
    <marketing>
      <title>Unknown status listing</title>
      <description>This should be a RowError.</description>
    </marketing>
    <media/>
  </listing>
</listings>`;

/** A minimal valid JSON listing. */
const VALID_JSON_SINGLE = JSON.stringify({
  listings: [
    {
      id: "GF-J01",
      branchId: "branch-j",
      status: "forSale",
      listingType: "sale",
      price: 450000,
      address: {
        line1: "10 JSON Street",
        city: "Birmingham",
        postcode: "B1 1AA",
        latitude: 52.48,
        longitude: -1.9,
      },
      property: {
        type: "semi_detached",
        bedrooms: 3,
        bathrooms: 2,
        tenure: "freehold",
        planningPermissionStatus: "none_known",
      },
      marketing: {
        title: "Semi-detached in Birmingham",
        description: "A superb three-bedroom semi.",
      },
      media: [{ id: "jimg-1", url: "https://example.com/jimg1.jpg", sortOrder: 1 }],
    },
  ],
});

/** Multi-page JSON payload (array of page objects). */
const PAGINATED_JSON = JSON.stringify([
  {
    page: 1,
    listings: [
      {
        id: "GF-P01",
        branchId: "branch-p",
        status: "forSale",
        listingType: "sale",
        price: 300000,
        address: { line1: "1 Page One", city: "Leeds", postcode: "LS2 1AA" },
        property: {
          type: "flat",
          bedrooms: 1,
          bathrooms: 1,
          tenure: "leasehold",
          planningPermissionStatus: "none_known",
        },
        marketing: { title: "Page one listing", description: "First page." },
        media: [],
      },
    ],
  },
  {
    page: 2,
    listings: [
      {
        id: "GF-P02",
        branchId: "branch-p",
        status: "forSale",
        listingType: "sale",
        price: 350000,
        address: { line1: "2 Page Two", city: "Leeds", postcode: "LS2 2AA" },
        property: {
          type: "detached",
          bedrooms: 3,
          bathrooms: 2,
          tenure: "freehold",
          planningPermissionStatus: "none_known",
        },
        marketing: { title: "Page two listing", description: "Second page." },
        media: [],
      },
    ],
  },
]);

// ---------------------------------------------------------------------------
// sandbox connector tests
// ---------------------------------------------------------------------------

describe("sandbox connector", () => {
  beforeEach(() => {
    _resetRegistryForTesting();
    registerConnector(sandboxConnector);
  });

  it("registers under provider key 'sandbox'", () => {
    const c = getConnector("sandbox");
    expect(c.provider).toBe("sandbox");
  });

  it("declares honest capabilities (full_snapshot, tombstones, branches, media_urls)", () => {
    expect(sandboxConnector.capabilities.has("full_snapshot")).toBe(true);
    expect(sandboxConnector.capabilities.has("tombstones")).toBe(true);
    expect(sandboxConnector.capabilities.has("branches")).toBe(true);
    expect(sandboxConnector.capabilities.has("media_urls")).toBe(true);
    // Should NOT declare webhook_push (not implemented)
    expect(sandboxConnector.capabilities.has("webhook_push")).toBe(false);
  });

  it("testConnection returns ok:true (fixture always reachable)", async () => {
    const result = await sandboxConnector.testConnection(BASE_CTX);
    expect(result.ok).toBe(true);
    expect(result.message).toBeTruthy();
  });

  it("discoverBranches returns at least one branch", async () => {
    const { branches } = await sandboxConnector.discoverBranches(BASE_CTX);
    expect(branches.length).toBeGreaterThan(0);
    expect(branches[0]).toMatchObject({ externalId: expect.any(String), name: expect.any(String) });
  });

  // Behaviour 1 — full sync
  it("B1: full sync — yields canonical listings that pass validateNormalizedListing", async () => {
    const result = await sandboxConnector.fetchListings(BASE_CTX);

    expect(result.transport.ok).toBe(true);
    expect(result.listings.length).toBeGreaterThan(0);
    expect(result.branches.length).toBeGreaterThan(0);
    expect(result.sourceFingerprint).toBeTruthy();

    // All available listings must pass validation
    for (const listing of result.listings) {
      expect(listing.source).toBe("sandbox");
      if (listing.status === "available") {
        const errs = validateNormalizedListing(listing);
        expect(errs).toEqual([]);
      }
    }
  });

  // Behaviour 1 (cont.) — sourceFingerprint is stable for identical input
  it("B1: sourceFingerprint is stable for repeated calls with the same fixture", async () => {
    const r1 = await sandboxConnector.fetchListings(BASE_CTX);
    const r2 = await sandboxConnector.fetchListings(BASE_CTX);
    expect(r1.sourceFingerprint).toBe(r2.sourceFingerprint);
  });

  // Behaviour 3 — withdrawal
  it("B3: the sandbox fixture includes a withdrawn listing that maps to status:'withdrawn'", async () => {
    const result = await sandboxConnector.fetchListings(BASE_CTX);
    const withdrawn = result.listings.filter((l) => l.status === "withdrawn");
    expect(withdrawn.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// generic_feed connector tests
// ---------------------------------------------------------------------------

describe("generic_feed connector", () => {
  beforeEach(() => {
    _resetRegistryForTesting();
    registerConnector(genericFeedConnector);
  });

  it("registers under provider key 'generic_feed'", () => {
    const c = getConnector("generic_feed");
    expect(c.provider).toBe("generic_feed");
  });

  it("declares honest capabilities (full_snapshot, tombstones, branches, media_urls)", () => {
    expect(genericFeedConnector.capabilities.has("full_snapshot")).toBe(true);
    expect(genericFeedConnector.capabilities.has("tombstones")).toBe(true);
    expect(genericFeedConnector.capabilities.has("branches")).toBe(true);
    expect(genericFeedConnector.capabilities.has("media_urls")).toBe(true);
    expect(genericFeedConnector.capabilities.has("webhook_push")).toBe(false);
  });

  // testConnection
  it("testConnection returns ok:true for a valid XML payload", async () => {
    const result = await genericFeedConnector.testConnection({ ...BASE_CTX, payload: VALID_XML_SINGLE });
    expect(result.ok).toBe(true);
  });

  it("testConnection returns ok:false for a malformed payload", async () => {
    const result = await genericFeedConnector.testConnection({ ...BASE_CTX, payload: "<<<not xml or json>>>" });
    expect(result.ok).toBe(false);
    expect(result.message).toBeTruthy();
  });

  it("testConnection returns ok:false when no payload is supplied", async () => {
    const result = await genericFeedConnector.testConnection(BASE_CTX);
    expect(result.ok).toBe(false);
  });

  // discoverBranches
  it("discoverBranches returns branches derived from a valid XML payload", async () => {
    const { branches } = await genericFeedConnector.discoverBranches({ ...BASE_CTX, payload: VALID_XML_SINGLE });
    expect(branches.length).toBeGreaterThan(0);
    expect(branches[0].externalId).toBe("branch-a");
  });

  // Behaviour 1 — full sync (XML)
  it("B1 (XML): full sync from valid XML payload yields canonical listings", async () => {
    const result = await genericFeedConnector.fetchListings({ ...BASE_CTX, payload: VALID_XML_SINGLE });

    expect(result.transport.ok).toBe(true);
    expect(result.listings).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
    expect(result.sourceFingerprint).toBeTruthy();

    const listing = result.listings[0];
    expect(listing.source).toBe("generic_feed");
    expect(listing.external_id).toBe("GF-001");
    expect(listing.status).toBe("available");
    expect(listing.price).toBe(350000);
    expect(listing.city).toBe("London");
    expect(validateNormalizedListing(listing)).toEqual([]);
  });

  // Behaviour 1 — full sync (JSON)
  it("B1 (JSON): full sync from valid JSON payload yields canonical listings", async () => {
    const result = await genericFeedConnector.fetchListings({ ...BASE_CTX, payload: VALID_JSON_SINGLE });

    expect(result.transport.ok).toBe(true);
    expect(result.listings).toHaveLength(1);
    expect(result.errors).toHaveLength(0);

    const listing = result.listings[0];
    expect(listing.source).toBe("generic_feed");
    expect(listing.external_id).toBe("GF-J01");
    expect(listing.status).toBe("available");
    expect(listing.price).toBe(450000);
    expect(validateNormalizedListing(listing)).toEqual([]);
  });

  // Behaviour 2 — incremental price-change
  it("B2: price-changed payload produces a different sourceFingerprint and updated price", async () => {
    const r1 = await genericFeedConnector.fetchListings({ ...BASE_CTX, payload: VALID_XML_SINGLE });
    const r2 = await genericFeedConnector.fetchListings({ ...BASE_CTX, payload: VALID_XML_PRICE_CHANGED });

    expect(r1.sourceFingerprint).not.toBe(r2.sourceFingerprint);
    expect(r1.listings[0].price).toBe(350000);
    expect(r2.listings[0].price).toBe(375000);
  });

  // Behaviour 3 — withdrawal / tombstone
  it("B3: withdrawn listing maps to status:'withdrawn'", async () => {
    const result = await genericFeedConnector.fetchListings({ ...BASE_CTX, payload: VALID_XML_WITHDRAWN });

    expect(result.listings).toHaveLength(1);
    expect(result.listings[0].status).toBe("withdrawn");
    expect(result.errors).toHaveLength(0);
  });

  // Behaviour 4 — unknown enum
  it("B4: unknown status produces a RowError and the rest of the feed still parses", async () => {
    const result = await genericFeedConnector.fetchListings({ ...BASE_CTX, payload: UNKNOWN_STATUS_XML });

    // One valid listing should parse
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0].external_id).toBe("GF-OK");

    // One RowError for the unknown-status row
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("unknown_status");
    expect(result.errors[0].row).toBe("GF-BAD");

    // transport is still ok (partial parse is ok)
    expect(result.transport.ok).toBe(true);
  });

  // Behaviour 5 — invalid payload
  it("B5 (malformed XML): handled gracefully — no throw, transport.ok false", async () => {
    const result = await genericFeedConnector.fetchListings({ ...BASE_CTX, payload: "<<<garbage>>>" });
    expect(result.transport.ok).toBe(false);
    expect(result.listings).toHaveLength(0);
    expect(result.transport.warnings.length).toBeGreaterThan(0);
  });

  it("B5 (malformed JSON): handled gracefully — no throw, transport.ok false", async () => {
    const result = await genericFeedConnector.fetchListings({ ...BASE_CTX, payload: '{"listings": [BROKEN}' });
    expect(result.transport.ok).toBe(false);
    expect(result.listings).toHaveLength(0);
  });

  it("B5 (empty payload): handled gracefully — no throw, transport.ok false", async () => {
    const result = await genericFeedConnector.fetchListings(BASE_CTX);
    expect(result.transport.ok).toBe(false);
    expect(result.listings).toHaveLength(0);
  });

  // Behaviour 6 — pagination
  it("B6: multi-page JSON payload assembles all listings from all pages", async () => {
    const result = await genericFeedConnector.fetchListings({ ...BASE_CTX, payload: PAGINATED_JSON });

    expect(result.transport.ok).toBe(true);
    expect(result.listings).toHaveLength(2);

    const ids = result.listings.map((l) => l.external_id);
    expect(ids).toContain("GF-P01");
    expect(ids).toContain("GF-P02");
  });

  // sourceFingerprint stability
  it("B1 (cont.): identical payload produces identical sourceFingerprint", async () => {
    const r1 = await genericFeedConnector.fetchListings({ ...BASE_CTX, payload: VALID_XML_SINGLE });
    const r2 = await genericFeedConnector.fetchListings({ ...BASE_CTX, payload: VALID_XML_SINGLE });
    expect(r1.sourceFingerprint).toBe(r2.sourceFingerprint);
  });

  // I1 — XML features must not be silently dropped
  it("I1 (XML features): multiple <feature> children parsed into feed_features string array", async () => {
    const result = await genericFeedConnector.fetchListings({ ...BASE_CTX, payload: XML_WITH_FEATURES });
    expect(result.transport.ok).toBe(true);
    expect(result.listings).toHaveLength(1);
    const features = (result.listings[0].features["feed_features"] ?? []) as string[];
    expect(features.length).toBeGreaterThan(0);
    expect(features).toContain("South-facing garden");
    expect(features).toContain("Off-street parking");
    expect(features).toContain("Newly fitted kitchen");
  });

  // I1 — sandbox fixture SB-001 has features that must survive
  it("I1 (sandbox XML): SB-001 feed_features are non-empty", async () => {
    const result = await sandboxConnector.fetchListings(BASE_CTX);
    const sb001 = result.listings.find((l) => l.external_id === "SB-001");
    expect(sb001).toBeDefined();
    const features = (sb001!.features["feed_features"] ?? []) as string[];
    expect(features.length).toBeGreaterThan(0);
    expect(features).toContain("South-facing garden");
  });

  // I2 — a row with a valid status and an unrecognised listingType field infers
  //       the type from status (forsale → "sale"); it does NOT produce a RowError.
  it("I2 (unknown listingType field, valid status): row infers listing_type from status, no RowError", async () => {
    const result = await genericFeedConnector.fetchListings({ ...BASE_CTX, payload: UNKNOWN_LISTING_TYPE_XML });
    expect(result.errors).toHaveLength(0);
    expect(result.listings).toHaveLength(2);
    const bad = result.listings.find((l) => l.external_id === "LT-BAD");
    expect(bad).toBeDefined();
    expect(bad!.listing_type).toBe("sale");
  });

  // M1 — BOM-prefixed JSON payload must parse correctly
  it("M1 (BOM): BOM-prefixed JSON payload parses as JSON, not XML", async () => {
    const bom = "﻿";
    const result = await genericFeedConnector.fetchListings({ ...BASE_CTX, payload: bom + VALID_JSON_SINGLE });
    expect(result.transport.ok).toBe(true);
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0].external_id).toBe("GF-J01");
  });

  // M4 — withdrawn to-let row must keep listing_type:"rent"
  it("M4 (withdrawn to-let): explicit listingType:rent is honoured even for withdrawn status", async () => {
    const result = await genericFeedConnector.fetchListings({ ...BASE_CTX, payload: XML_WITHDRAWN_TOLET });
    expect(result.transport.ok).toBe(true);
    expect(result.listings).toHaveLength(1);
    const listing = result.listings[0];
    expect(listing.status).toBe("withdrawn");
    expect(listing.listing_type).toBe("rent");
  });

  // M5 — withdrawn row with NO listingType must still produce a withdrawn listing (tombstone path)
  it("M5 (withdrawn, no listingType): row yields a withdrawn listing, never a RowError", async () => {
    const result = await genericFeedConnector.fetchListings({ ...BASE_CTX, payload: XML_WITHDRAWN_NO_LISTING_TYPE });
    expect(result.transport.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.listings).toHaveLength(1);
    const listing = result.listings[0];
    expect(listing.external_id).toBe("WR-NT-001");
    expect(listing.status).toBe("withdrawn");
  });
});
