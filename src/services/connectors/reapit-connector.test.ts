/**
 * Connector-driven import run test.
 *
 * Resolves the Reapit connector from the registry (via the barrel),
 * calls fetchListings, passes the result into createImportRunFromListings,
 * and asserts run + items are created with provider:"reapit".
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { reapitConnector } from "./reapit-connector";
import { _resetRegistryForTesting, registerConnector, getConnector } from "./registry";
import { createImportRunFromListings } from "@/services/agent/agent-feed-import-service";

// ---------------------------------------------------------------------------
// Supabase mock helpers (mirrors the approach in agent-feed-import-service.test.ts)
// ---------------------------------------------------------------------------

type FlexibleResult = { data?: unknown; error?: unknown };

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

function createMutationChain(result: unknown) {
  const chain = {
    insert: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return chain;
}

// ---------------------------------------------------------------------------

describe("reapit connector — connector-driven import run", () => {
  beforeEach(() => {
    // Reset the registry then re-register the reapit connector so each test
    // starts from a clean slate without relying on barrel side-effects.
    _resetRegistryForTesting();
    registerConnector(reapitConnector);
  });

  it("resolves the reapit connector from the registry", () => {
    const connector = getConnector("reapit");

    expect(connector.provider).toBe("reapit");
    expect(connector.capabilities.has("full_snapshot")).toBe(true);
    expect(connector.capabilities.has("branches")).toBe(true);
    expect(connector.capabilities.has("media_urls")).toBe(true);
  });

  it("testConnection returns ok:true for the fixture-backed connector", async () => {
    const connector = getConnector("reapit");
    const result = await connector.testConnection({
      integrationId: "int-1",
      organisationId: "org-1",
    });

    expect(result.ok).toBe(true);
    expect(result.message).toBeTruthy();
  });

  it("discoverBranches derives branch records from fixture listings", async () => {
    const connector = getConnector("reapit");
    const { branches } = await connector.discoverBranches({
      integrationId: "int-1",
      organisationId: "org-1",
    });

    expect(branches.length).toBeGreaterThan(0);
    expect(branches[0]).toMatchObject({ externalId: expect.any(String), name: expect.any(String) });
  });

  it("fetchListings returns listings + fingerprint + branches from fixture", async () => {
    const connector = getConnector("reapit");
    const result = await connector.fetchListings({
      integrationId: "int-1",
      organisationId: "org-1",
    });

    expect(result.listings.length).toBe(3);
    expect(result.errors).toHaveLength(0);
    expect(result.sourceFingerprint).toBeTruthy();
    expect(result.branches.length).toBeGreaterThan(0);
    expect(result.transport.ok).toBe(true);
    expect(result.transport.itemsSeen).toBe(3);
    // All listings carry provider "reapit"
    for (const listing of result.listings) {
      expect(listing.source).toBe("reapit");
    }
  });

  it("creates an import run with provider:'reapit' via createImportRunFromListings", async () => {
    const runChain = createMutationChain({
      data: { id: "run-connector-1", status: "needs_review" },
      error: null,
    });
    const itemChain = createMutationChain({ data: [], error: null });
    const integrationChain = createFlexibleChain({
      data: { organisation_id: "org-connector-1" },
    });

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "feed_import_runs") return runChain;
        if (table === "feed_import_items") return itemChain;
        if (table === "agent_feed_integrations") return integrationChain;
        throw new Error(`Unexpected table: ${table}`);
      }),
    };

    // Resolve connector → fetch listings → run pipeline
    const connector = getConnector("reapit");
    const fetchResult = await connector.fetchListings({
      integrationId: "int-connector-1",
      organisationId: "org-connector-1",
    });

    const summary = await createImportRunFromListings(
      supabase as never,
      "agent-connector-1",
      "int-connector-1",
      connector.provider,
      fetchResult.listings,
    );

    // Run summary is well-formed
    expect(summary.run_id).toBe("run-connector-1");
    expect(summary.total_items).toBe(3);

    // feed_import_runs upserted with provider:"reapit"
    expect(runChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "reapit",
        agent_id: "agent-connector-1",
        integration_id: "int-connector-1",
        organisation_id: "org-connector-1",
        source_fingerprint: expect.any(String),
        status: "needs_review",
      }),
      { onConflict: "integration_id,source_fingerprint" },
    );

    // feed_import_items upserted with expected rows
    expect(itemChain.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          run_id: "run-connector-1",
          item_type: "listing",
          external_id: "RPT-1001",
          status: "needs_review",
        }),
        expect.objectContaining({
          run_id: "run-connector-1",
          item_type: "listing",
          external_id: "RPT-1003",
          status: "withdrawn",
        }),
      ]),
      { onConflict: "run_id,item_type,external_id" },
    );
  });
});
