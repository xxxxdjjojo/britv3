import { describe, expect, it, vi } from "vitest";
import {
  approveFeedImportItem,
  archiveWithdrawnFeedListings,
  assessFeedSafety,
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

type FlexibleResult = { data?: unknown; error?: unknown };

/**
 * Awaitable Supabase query-chain stub: every builder method returns the chain,
 * the chain is thenable (so `await from().update().eq()` resolves), and
 * single()/maybeSingle() resolve the configured result.
 */
function createFlexibleChain(result: FlexibleResult = { data: null, error: null }) {
  const resolved = { data: null, error: null, ...result };
  const chain: Record<string, unknown> = {};
  const self = () => chain as never;
  Object.assign(chain, {
    insert: vi.fn(self),
    upsert: vi.fn(self),
    update: vi.fn(self),
    delete: vi.fn(self),
    select: vi.fn(self),
    eq: vi.fn(self),
    order: vi.fn(self),
    single: vi.fn().mockResolvedValue(resolved),
    maybeSingle: vi.fn().mockResolvedValue(resolved),
    then: (resolve: (value: FlexibleResult) => unknown) =>
      Promise.resolve(resolved).then(resolve),
  });
  return chain as Record<string, ReturnType<typeof vi.fn>> & FlexibleResult;
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
    const integrationChain = createFlexibleChain({
      data: { organisation_id: "org-1" },
    });
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "feed_import_runs") return runChain;
        if (table === "feed_import_items") return itemChain;
        if (table === "agent_feed_integrations") return integrationChain;
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
        organisation_id: "org-1",
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

  function buildPublishSupabase(options: {
    existingLink: { listing_id: string; property_id: string } | null;
  }) {
    const validListing = normalizeReapitFixture()[0];
    const itemFetchChain = createFlexibleChain({
      data: {
        id: "item-1",
        integration_id: "integration-1",
        agent_id: "agent-1",
        organisation_id: "org-1",
        external_id: validListing.external_id,
        status: "approved",
        normalized_payload: validListing,
      },
    });
    const itemUpdateChain = createFlexibleChain({
      data: { id: "item-1", status: "published" },
    });
    const propertyChain = createFlexibleChain({ data: { id: "property-1" } });
    const listingChain = createFlexibleChain({
      data: { id: "listing-1", status: "active" },
    });
    const mediaChain = createFlexibleChain({ data: [] });
    const listingLinkChain = createFlexibleChain({ data: options.existingLink });
    const mediaLinkChain = createFlexibleChain({ data: null });

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
      rpc: vi.fn(() => ({
        then: (resolve: (value: { data: null; error: null }) => unknown) =>
          Promise.resolve({ data: null, error: null }).then(resolve),
      })),
    };

    return { supabase, validListing, propertyChain, listingChain, listingLinkChain, itemUpdateChain };
  }

  it("publishes approved items into canonical ACTIVE listings (searchable + mappable)", async () => {
    const { supabase, validListing, propertyChain, listingChain } = buildPublishSupabase({
      existingLink: null,
    });

    const result = await publishApprovedImportItem(supabase as never, "agent-1", "item-1");

    expect(result).toMatchObject({
      listing_id: "listing-1",
      property_id: "property-1",
      updated: false,
    });
    expect(propertyChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        address_line1: validListing.address_line1,
        planning_permission_status: "none_known",
      }),
    );
    // Published as PUBLIC, not draft — the three-action "Publish" makes it live,
    // stamped with the owning organisation.
    expect(listingChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "agent-1",
        status: "active",
        organisation_id: "org-1",
      }),
    );
    // Coordinates set (map) + search index refreshed.
    expect(supabase.rpc).toHaveBeenCalledWith(
      "set_property_coordinates",
      expect.objectContaining({ p_property_id: "property-1" }),
    );
    expect(supabase.rpc).toHaveBeenCalledWith("refresh_search_listings");
  });

  it("re-publishing an external listing UPDATES the existing listing (no duplicate)", async () => {
    const { supabase, listingChain, propertyChain } = buildPublishSupabase({
      existingLink: { listing_id: "listing-existing", property_id: "property-existing" },
    });

    const result = await publishApprovedImportItem(supabase as never, "agent-1", "item-1");

    expect(result).toMatchObject({
      listing_id: "listing-existing",
      property_id: "property-existing",
      updated: true,
    });
    // The update path must NOT insert a new property or listing.
    expect(propertyChain.insert).not.toHaveBeenCalled();
    expect(listingChain.insert).not.toHaveBeenCalled();
    expect(listingChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "active" }),
    );
  });

  it("blocks an empty full feed from withdrawing a published portfolio", () => {
    expect(assessFeedSafety({ incomingItemCount: 0, previouslyPublishedCount: 12 })).toEqual({
      safe: false,
      reason: expect.stringContaining("12"),
    });
    expect(assessFeedSafety({ incomingItemCount: 0, previouslyPublishedCount: 0 })).toEqual({
      safe: true,
      reason: null,
    });
    expect(assessFeedSafety({ incomingItemCount: 3, previouslyPublishedCount: 12 })).toEqual({
      safe: true,
      reason: null,
    });
  });

  it("archives canonical listings for withdrawn source records (never deletes)", async () => {
    const runChain = createFlexibleChain({
      data: { id: "run-1", integration_id: "integration-1" },
    });
    const itemsChain = createFlexibleChain({
      data: [{ external_id: "RPT-1003", status: "withdrawn" }],
    });
    const linkChain = createFlexibleChain({
      data: { listing_id: "listing-3", property_id: "property-3" },
    });
    const listingChain = createFlexibleChain({ data: null });

    let itemCallCount = 0;
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "feed_import_runs") return runChain;
        if (table === "feed_import_items") {
          itemCallCount += 1;
          return itemsChain;
        }
        if (table === "feed_listing_links") return linkChain;
        if (table === "listings") return listingChain;
        throw new Error(`Unexpected table ${table}`);
      }),
      rpc: vi.fn(() => ({
        then: (resolve: (value: { data: null; error: null }) => unknown) =>
          Promise.resolve({ data: null, error: null }).then(resolve),
      })),
    };

    const result = await archiveWithdrawnFeedListings(supabase as never, "agent-1", "run-1");

    expect(result).toEqual({ archived_count: 1 });
    expect(listingChain.update).toHaveBeenCalledWith({ status: "archived" });
    expect(listingChain.delete).not.toHaveBeenCalled();
  });
});
