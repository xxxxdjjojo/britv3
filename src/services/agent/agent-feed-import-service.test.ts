import { describe, expect, it, vi } from "vitest";
import {
  approveFeedImportItem,
  createDeterministicReapitImportRun,
  isPublishEligible,
  normalizeReapitFixture,
  publishApprovedImportItem,
  validateNormalizedListing,
} from "./agent-feed-import-service";

function createMutationChain(result: unknown) {
  const chain = {
    insert: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue(result),
  };

  return chain;
}

describe("agent-feed-import-service", () => {
  it("normalizes the deterministic Reapit-shaped fixture", () => {
    const listings = normalizeReapitFixture();

    expect(listings).toHaveLength(3);
    expect(listings[0]).toMatchObject({
      source: "reapit",
      external_id: "RPT-1001",
      external_branch_id: "LDN-CEN",
      address_line1: "12 Queen Street",
      city: "London",
      postcode: "SW1A 1AA",
      listing_type: "sale",
      status: "available",
      planning_permission_status: "none_known",
    });
  });

  it("validates material information before publish eligibility", () => {
    const [, invalidListing] = normalizeReapitFixture();
    const errors = validateNormalizedListing(invalidListing);

    expect(errors).toContain("planning_permission_status is required");
    expect(isPublishEligible(invalidListing)).toBe(false);
  });

  it("treats withdrawn source listings as tombstones, not publishable listings", () => {
    const withdrawnListing = normalizeReapitFixture()[2];

    expect(withdrawnListing.status).toBe("withdrawn");
    expect(isPublishEligible(withdrawnListing)).toBe(false);
    expect(validateNormalizedListing(withdrawnListing)).toEqual([]);
  });

  it("creates idempotent import run and item rows", async () => {
    const runChain = createMutationChain({
      data: { id: "run-1", status: "needs_review" },
      error: null,
    });
    const itemChain = createMutationChain({ data: [], error: null });
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "feed_import_runs") return runChain;
        if (table === "feed_import_items") return itemChain;
        throw new Error(`Unexpected table ${table}`);
      }),
    };

    await createDeterministicReapitImportRun(
      supabase as never,
      "agent-1",
      "integration-1",
    );

    expect(runChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        agent_id: "agent-1",
        integration_id: "integration-1",
        source_fingerprint: expect.any(String),
        status: "needs_review",
      }),
      { onConflict: "integration_id,source_fingerprint" },
    );
    expect(itemChain.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          run_id: "run-1",
          item_type: "listing",
          external_id: "RPT-1001",
          status: "needs_review",
        }),
        expect.objectContaining({
          run_id: "run-1",
          item_type: "listing",
          external_id: "RPT-1003",
          status: "withdrawn",
        }),
      ]),
      { onConflict: "run_id,item_type,external_id" },
    );
  });

  it("approves review items through an agent-scoped update", async () => {
    const chain = createMutationChain({
      data: { id: "item-1", status: "approved" },
      error: null,
    });
    const supabase = { from: vi.fn(() => chain) };

    await approveFeedImportItem(supabase as never, "agent-1", "item-1");

    expect(supabase.from).toHaveBeenCalledWith("feed_import_items");
    expect(chain.update).toHaveBeenCalledWith({ status: "approved" });
    expect(chain.eq).toHaveBeenCalledWith("agent_id", "agent-1");
    expect(chain.eq).toHaveBeenCalledWith("id", "item-1");
  });

  it("publishes approved items into canonical draft listing tables", async () => {
    const validListing = normalizeReapitFixture()[0];
    const itemFetchChain = {
      select: vi.fn(() => itemFetchChain),
      eq: vi.fn(() => itemFetchChain),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "item-1",
          integration_id: "integration-1",
          agent_id: "agent-1",
          external_id: validListing.external_id,
          status: "approved",
          normalized_payload: validListing,
        },
        error: null,
      }),
    };
    const itemUpdateChain = createMutationChain({
      data: { id: "item-1", status: "published" },
      error: null,
    });
    const propertyChain = createMutationChain({
      data: { id: "property-1" },
      error: null,
    });
    const listingChain = createMutationChain({
      data: { id: "listing-1", status: "draft" },
      error: null,
    });
    const mediaChain = {
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    const listingLinkChain = {
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    const mediaLinkChain = {
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    let itemCallCount = 0;
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "feed_import_items") {
          itemCallCount += 1;
          return itemCallCount === 1 ? itemFetchChain : itemUpdateChain;
        }
        if (table === "properties") return propertyChain;
        if (table === "listings") return listingChain;
        if (table === "property_media") return mediaChain;
        if (table === "feed_listing_links") return listingLinkChain;
        if (table === "feed_media_links") return mediaLinkChain;
        throw new Error(`Unexpected table ${table}`);
      }),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    const result = await publishApprovedImportItem(
      supabase as never,
      "agent-1",
      "item-1",
    );

    expect(result).toMatchObject({ listing_id: "listing-1", property_id: "property-1" });
    expect(propertyChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        address_line1: validListing.address_line1,
        planning_permission_status: "none_known",
      }),
    );
    expect(listingChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        property_id: "property-1",
        user_id: "agent-1",
        status: "draft",
      }),
    );
    expect(listingLinkChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        integration_id: "integration-1",
        external_listing_id: "RPT-1001",
        listing_id: "listing-1",
      }),
      { onConflict: "integration_id,external_listing_id" },
    );
    expect(itemUpdateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "published", canonical_listing_id: "listing-1" }),
    );
  });
});
