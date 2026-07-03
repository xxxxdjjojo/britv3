import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PostcodeAreaCard } from "@/services/market-map/postcode-card-service";

/* ------------------------------------------------------------------ mocks */

type Row = Record<string, unknown>;

let listingRows: Row[] = [];
const chainCalls: { method: string; args: unknown[] }[] = [];

function makeBuilder() {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq", "neq", "is", "in", "not", "order", "limit", "gt", "gte"]) {
    builder[method] = vi.fn((...args: unknown[]) => {
      chainCalls.push({ method, args });
      return builder;
    });
  }
  (builder as { then: unknown }).then = (
    resolve: (v: { data: Row[]; error: null }) => void,
  ) => resolve({ data: listingRows, error: null });
  return builder;
}

const fromMock = vi.fn(() => makeBuilder());

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

const getPostcodeCardMock = vi.fn();
vi.mock("@/services/market-map/postcode-card-service", () => ({
  getPostcodeCard: (postcode: string) => getPostcodeCardMock(postcode),
}));

/* --------------------------------------------------------------- fixtures */

let rowSeq = 0;

function makeRow(overrides: Partial<Row> = {}, property: Row = {}): Row {
  rowSeq += 1;
  return {
    id: `row-${rowSeq}`,
    slug: `db-home-${rowSeq}-london-sale`,
    price: 450_000,
    listing_type: "sale",
    status: "active",
    deleted_at: null,
    listed_date: "2026-06-25",
    created_at: "2026-06-25T09:00:00Z",
    view_count: 12,
    favorite_count: 3,
    enquiry_count: 1,
    properties: {
      title: `DB Home ${rowSeq}`,
      city: "London",
      postcode: "SE1 2AB",
      property_type: "terraced",
      bedrooms: 3,
      bathrooms: 1,
      square_footage: 950,
      ...property,
    },
    property_media: [
      {
        url: "https://abc.supabase.co/storage/v1/object/public/media/full.jpg",
        thumbnail_url:
          "https://abc.supabase.co/storage/v1/object/public/media/thumb.jpg",
        alt_text: "Terraced house frontage",
        sort_order: 0,
        media_type: "image",
      },
    ],
    price_history: [],
    ...overrides,
  };
}

function card(median: number): PostcodeAreaCard {
  const series = {
    median,
    p10: median * 0.8,
    p90: median * 1.3,
    count: 40,
    latestDate: "2026-05-01",
    confidence: "High" as const,
    insufficient: false,
    levelUsed: "lsoa",
    areaName: "Southwark",
  };
  return { found: true, location: null, flat: series, house: series };
}

/* ------------------------------------------------------------------ tests */

beforeEach(() => {
  vi.resetModules();
  listingRows = [];
  chainCalls.length = 0;
  fromMock.mockClear();
  getPostcodeCardMock.mockReset();
  getPostcodeCardMock.mockResolvedValue({
    found: false,
    location: null,
    flat: null,
    house: null,
  });
});

async function service() {
  return import("@/services/top-properties/top-list-service");
}

describe("getTopList", () => {
  it("queries only active, non-deleted listings", async () => {
    listingRows = Array.from({ length: 6 }, () => makeRow());
    const { getTopList } = await service();
    await getTopList("newly-listed-homes");

    expect(fromMock).toHaveBeenCalledWith("listings");
    expect(
      chainCalls.some(
        (c) => c.method === "eq" && c.args[0] === "status" && c.args[1] === "active",
      ),
    ).toBe(true);
    expect(
      chainCalls.some(
        (c) => c.method === "is" && c.args[0] === "deleted_at" && c.args[1] === null,
      ),
    ).toBe(true);
  });

  it("maps rows to real items and marks the list indexable at 5+", async () => {
    listingRows = Array.from({ length: 6 }, () => makeRow());
    const { getTopList } = await service();
    const result = await getTopList("newly-listed-homes");

    expect(result).not.toBeNull();
    expect(result!.itemCount).toBe(6);
    expect(result!.isIndexable).toBe(true);
    expect(result!.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const item = result!.items[0];
    expect(item.listingSlug).toMatch(/^db-home-/);
    expect(item.price).toBe(450_000);
    expect(item.city).toBe("London");
    expect(item.imageUrl).toBe(
      "https://abc.supabase.co/storage/v1/object/public/media/thumb.jpg",
    );
    expect(item.imageAlt).toBe("Terraced house frontage");
  });

  it("marks thin lists non-indexable but still returns the items", async () => {
    listingRows = [makeRow(), makeRow()];
    const { getTopList } = await service();
    const result = await getTopList("newly-listed-homes");
    expect(result!.itemCount).toBe(2);
    expect(result!.isIndexable).toBe(false);
  });

  it("defensively drops non-active or deleted rows even if the query returns them", async () => {
    listingRows = [
      makeRow(),
      makeRow({ status: "draft" }),
      makeRow({ deleted_at: "2026-06-01T00:00:00Z" }),
    ];
    const { getTopList } = await service();
    const result = await getTopList("newly-listed-homes");
    expect(result!.itemCount).toBe(1);
  });

  it("picks the first 'image' media and never a floor plan (real media_type enum)", async () => {
    listingRows = [
      makeRow({
        property_media: [
          {
            url: "https://abc.supabase.co/storage/v1/object/public/media/plan.jpg",
            thumbnail_url: null,
            alt_text: "Floor plan",
            sort_order: 0,
            media_type: "floor_plan",
          },
          {
            url: "https://abc.supabase.co/storage/v1/object/public/media/exterior.jpg",
            thumbnail_url:
              "https://abc.supabase.co/storage/v1/object/public/media/thumbs/exterior.jpg",
            alt_text: "Front exterior",
            sort_order: 1,
            media_type: "image",
          },
        ],
      }),
    ];
    const { getTopList } = await service();
    const result = await getTopList("newly-listed-homes");
    expect(result!.items[0].imageUrl).toBe(
      "https://abc.supabase.co/storage/v1/object/public/media/thumbs/exterior.jpg",
    );
    expect(result!.items[0].imageAlt).toBe("Front exterior");
  });

  it("drops image URLs next/image cannot render (unconfigured hosts) instead of crashing", async () => {
    listingRows = [
      makeRow({
        property_media: [
          {
            url: "https://placehold.co/400x300?text=Photo",
            thumbnail_url: "https://placehold.co/100x75?text=Thumb",
            alt_text: "Placeholder",
            sort_order: 0,
            media_type: "image",
          },
        ],
      }),
    ];
    const { getTopList } = await service();
    const result = await getTopList("newly-listed-homes");
    expect(result!.items[0].imageUrl).toBeNull();
  });

  it("returns null for an unknown slug", async () => {
    const { getTopList } = await service();
    expect(await getTopList("not-a-real-list")).toBeNull();
  });

  it("attaches sold-price benchmarks for the value list, deduping postcode lookups", async () => {
    listingRows = [
      makeRow({ price: 400_000 }, { postcode: "SE1 2AB", property_type: "terraced" }),
      makeRow({ price: 480_000 }, { postcode: "SE1 2AB", property_type: "terraced" }),
      makeRow({ price: 380_000 }, { postcode: "N1 4XY", property_type: "flat" }),
      ...Array.from({ length: 4 }, () => makeRow({ price: 430_000 })),
    ];
    getPostcodeCardMock.mockImplementation(async () => card(500_000));

    const { getTopList } = await service();
    const result = await getTopList("below-local-benchmark");

    // 3 distinct postcodes among candidates → exactly 3 RPC lookups (2 unique + default SE1 2AB shared)
    const lookups = getPostcodeCardMock.mock.calls.map((c) => c[0]);
    expect(new Set(lookups).size).toBe(lookups.length);

    // 400k vs 500k median = 20% below → included and first
    expect(result!.items.length).toBeGreaterThan(0);
    expect(result!.items[0].price).toBe(380_000);
    expect(result!.items[0].benchmark?.deltaPct).toBeCloseTo(-0.24, 2);
    expect(result!.items[0].reason).toContain("below local benchmark");
  });

  it("value list excludes homes whose benchmark is insufficient", async () => {
    listingRows = [makeRow({ price: 100_000 })];
    getPostcodeCardMock.mockResolvedValue({
      found: false,
      location: null,
      flat: null,
      house: null,
    });
    const { getTopList } = await service();
    const result = await getTopList("below-local-benchmark");
    expect(result!.itemCount).toBe(0);
    expect(result!.isIndexable).toBe(false);
  });
});

describe("getAllTopLists / getIndexableTopListSlugs", () => {
  it("returns a result for every configured category from one candidate fetch", async () => {
    listingRows = Array.from({ length: 8 }, () => makeRow());
    const { getAllTopLists } = await service();
    const { TOP_LIST_CATEGORIES } = await import(
      "@/lib/top-properties/top-list-config"
    );
    const all = await getAllTopLists();
    expect(all.size).toBe(TOP_LIST_CATEGORIES.length);
    // one listings fetch shared by all categories
    expect(fromMock.mock.calls.filter((c) => c[0] === "listings").length).toBe(1);
  });

  it("sitemap helper returns only slugs meeting the indexability threshold", async () => {
    listingRows = Array.from({ length: 6 }, () =>
      makeRow({ view_count: 50, favorite_count: 10, enquiry_count: 2 }),
    );
    const { getIndexableTopListSlugs } = await service();
    const slugs = await getIndexableTopListSlugs();
    expect(slugs).toContain("newly-listed-homes");
    expect(slugs).toContain("strongest-buyer-interest");
    // no price drops in the data → never indexable
    expect(slugs).not.toContain("biggest-price-drops");
  });
});
