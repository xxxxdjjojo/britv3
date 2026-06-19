import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FeedImportRunSummary } from "@/services/agent/agent-feed-import-service";
import type { FetchResult } from "./source-connector";

// ---------------------------------------------------------------------------
// Hoisted mocks — must be declared before any module imports that use them.
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  // Connector registry
  getConnector: vi.fn(),
  // Import service helpers
  assessFeedSafety: vi.fn(),
  createImportRunFromListings: vi.fn(),
}));

vi.mock("@/services/connectors", () => ({
  getConnector: mocks.getConnector,
  listConnectorProviders: vi.fn(),
  registerConnector: vi.fn(),
}));

vi.mock("@/services/agent/agent-feed-import-service", () => ({
  assessFeedSafety: mocks.assessFeedSafety,
  createImportRunFromListings: mocks.createImportRunFromListings,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFetchResult(overrides: Partial<FetchResult> = {}): FetchResult {
  return {
    listings: [],
    errors: [],
    sourceFingerprint: "fp-abc",
    branches: [],
    transport: { ok: true, itemsSeen: 0, warnings: [] },
    ...overrides,
  };
}

const SANDBOX_LISTING = {
  source: "sandbox",
  external_id: "SB-001",
  external_branch_id: "BR-1",
  status: "available" as const,
  listing_type: "sale" as const,
  price: 300000,
  rent_frequency: null,
  address_line1: "1 Demo St",
  address_line2: null,
  city: "London",
  postcode: "E1 1AA",
  latitude: 51.5,
  longitude: -0.1,
  property_type: "flat" as const,
  bedrooms: 2,
  bathrooms: 1,
  reception_rooms: null,
  square_footage: null,
  title: "Demo flat",
  description: "A demo flat.",
  features: {},
  tenure: "leasehold" as const,
  planning_permission_status: "none_known" as const,
  media: [],
  raw_payload: {},
};

function makeChain(result: { data?: unknown; error?: unknown; count?: number | null } = {}) {
  const resolved = { data: null, error: null, count: null, ...result };
  const chain: Record<string, unknown> = {};
  const self = () => chain as never;
  Object.assign(chain, {
    select: vi.fn(self),
    eq: vi.fn(self),
    update: vi.fn(self),
    single: vi.fn().mockResolvedValue(resolved),
    maybeSingle: vi.fn().mockResolvedValue(resolved),
    then: (resolve: (v: typeof resolved) => unknown) =>
      Promise.resolve(resolved).then(resolve),
  });
  return chain as Record<string, ReturnType<typeof vi.fn>>;
}

function makeSupabase({
  integrationRow = {
    provider: "sandbox",
    field_mapping: null,
    organisation_id: "org-1",
  },
  publishedCount = 0,
  updateOk = true,
}: {
  integrationRow?: Record<string, unknown>;
  publishedCount?: number;
  updateOk?: boolean;
} = {}) {
  const integrationChain = makeChain({ data: integrationRow });
  const linkChain = makeChain({ count: publishedCount });
  const updateChain = makeChain({ data: null, error: updateOk ? null : { message: "db error" } });

  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === "agent_feed_integrations") {
          // Both the load query and the update call go through this table.
          // Distinguish by checking whether .update() was called on the chain.
          return {
            ...integrationChain,
            update: vi.fn(() => updateChain),
          };
        }
        if (table === "feed_listing_links") return linkChain;
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as never,
    integrationChain,
    linkChain,
    updateChain,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("runConnectorImport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default safe assessment
    mocks.assessFeedSafety.mockReturnValue({ safe: true, reason: null });
  });

  it("(a) dispatches to sandbox connector and creates a run with provider 'sandbox'", async () => {
    const { runConnectorImport } = await import("./run-import");

    const fetchResult = makeFetchResult({ listings: [SANDBOX_LISTING] });
    const sandboxConnector = {
      provider: "sandbox",
      capabilities: new Set(["full_snapshot", "tombstones"]),
      fetchListings: vi.fn().mockResolvedValue(fetchResult),
      testConnection: vi.fn(),
      discoverBranches: vi.fn(),
    };
    mocks.getConnector.mockReturnValue(sandboxConnector);

    const expectedSummary: FeedImportRunSummary = {
      run_id: "run-sandbox-1",
      total_items: 1,
      eligible_items: 1,
      error_items: 0,
      withdrawn_items: 0,
    };
    mocks.createImportRunFromListings.mockResolvedValue(expectedSummary);

    const { supabase } = makeSupabase({ integrationRow: { provider: "sandbox", field_mapping: null, organisation_id: "org-1" } });
    const result = await runConnectorImport(supabase, "agent-1", "int-1");

    // Correct connector resolved
    expect(mocks.getConnector).toHaveBeenCalledWith("sandbox");
    // fetchListings called
    expect(sandboxConnector.fetchListings).toHaveBeenCalledWith(
      expect.objectContaining({ integrationId: "int-1", organisationId: "org-1" }),
    );
    // createImportRunFromListings called with provider 'sandbox'
    expect(mocks.createImportRunFromListings).toHaveBeenCalledWith(
      supabase,
      "agent-1",
      "int-1",
      "sandbox",
      fetchResult.listings,
    );
    expect(result.summary).toEqual(expectedSummary);
    expect(result.blocked).toBeUndefined();
  });

  it("(b) passes opts.payload and fieldMapping into the connector context for csv", async () => {
    const { runConnectorImport } = await import("./run-import");

    const fetchResult = makeFetchResult({ listings: [SANDBOX_LISTING] });
    const csvConnector = {
      provider: "csv",
      capabilities: new Set(["full_snapshot"]),
      fetchListings: vi.fn().mockResolvedValue(fetchResult),
      testConnection: vi.fn(),
      discoverBranches: vi.fn(),
    };
    mocks.getConnector.mockReturnValue(csvConnector);
    mocks.createImportRunFromListings.mockResolvedValue({
      run_id: "run-csv-1",
      total_items: 1,
      eligible_items: 1,
      error_items: 0,
      withdrawn_items: 0,
    });

    const { supabase } = makeSupabase({
      integrationRow: { provider: "csv", field_mapping: { Price: "price" }, organisation_id: null },
    });

    const csvPayload = "external_id,price\nCSV-1,250000";
    const callerMapping = { external_id: "external_id", price: "price" };

    await runConnectorImport(supabase, "agent-1", "int-csv", {
      payload: csvPayload,
      fieldMapping: callerMapping,
    });

    // ctx passed to fetchListings must carry the caller's payload and fieldMapping
    expect(csvConnector.fetchListings).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: csvPayload,
        fieldMapping: callerMapping,
      }),
    );
  });

  it("(b2) falls back to integration.field_mapping when no caller fieldMapping supplied", async () => {
    const { runConnectorImport } = await import("./run-import");

    const fetchResult = makeFetchResult({ listings: [SANDBOX_LISTING] });
    const csvConnector = {
      provider: "csv",
      capabilities: new Set(["full_snapshot"]),
      fetchListings: vi.fn().mockResolvedValue(fetchResult),
      testConnection: vi.fn(),
      discoverBranches: vi.fn(),
    };
    mocks.getConnector.mockReturnValue(csvConnector);
    mocks.createImportRunFromListings.mockResolvedValue({
      run_id: "run-csv-2",
      total_items: 1,
      eligible_items: 1,
      error_items: 0,
      withdrawn_items: 0,
    });

    const dbMapping = { "Property Price": "price" };
    const { supabase } = makeSupabase({
      integrationRow: { provider: "csv", field_mapping: dbMapping, organisation_id: null },
    });

    const csvPayload = "Property Price\n300000";
    await runConnectorImport(supabase, "agent-1", "int-csv2", { payload: csvPayload });

    expect(csvConnector.fetchListings).toHaveBeenCalledWith(
      expect.objectContaining({ fieldMapping: dbMapping }),
    );
  });

  it("(c) empty-feed guard BLOCKS when listings empty + no tombstones + previouslyPublished > 0", async () => {
    const { runConnectorImport } = await import("./run-import");

    const fetchResult = makeFetchResult({ listings: [] });
    const csvConnector = {
      provider: "csv",
      // No tombstones capability
      capabilities: new Set(["full_snapshot"]),
      fetchListings: vi.fn().mockResolvedValue(fetchResult),
      testConnection: vi.fn(),
      discoverBranches: vi.fn(),
    };
    mocks.getConnector.mockReturnValue(csvConnector);

    // Previously published count > 0
    const blockedReason =
      "Refusing to process an empty feed: 5 previously published listing(s) would be withdrawn. Manual approval required.";
    mocks.assessFeedSafety.mockReturnValue({ safe: false, reason: blockedReason });

    const { supabase } = makeSupabase({
      integrationRow: { provider: "csv", field_mapping: null, organisation_id: "org-1" },
      publishedCount: 5,
    });

    const result = await runConnectorImport(supabase, "agent-1", "int-csv3", {
      payload: "external_id,price\n",
    });

    // createImportRunFromListings must NOT be called
    expect(mocks.createImportRunFromListings).not.toHaveBeenCalled();
    // Result must be blocked
    expect(result.blocked).toBeDefined();
    expect(result.blocked?.reason).toBe(blockedReason);
    expect(result.summary.run_id).toBe("");
  });

  it("(c2) empty-feed does NOT block when connector has tombstones capability", async () => {
    const { runConnectorImport } = await import("./run-import");

    const fetchResult = makeFetchResult({ listings: [] });
    const sandboxConnector = {
      provider: "sandbox",
      // sandbox has tombstones
      capabilities: new Set(["full_snapshot", "tombstones"]),
      fetchListings: vi.fn().mockResolvedValue(fetchResult),
      testConnection: vi.fn(),
      discoverBranches: vi.fn(),
    };
    mocks.getConnector.mockReturnValue(sandboxConnector);
    mocks.createImportRunFromListings.mockResolvedValue({
      run_id: "run-sb-empty",
      total_items: 0,
      eligible_items: 0,
      error_items: 0,
      withdrawn_items: 0,
    });

    const { supabase } = makeSupabase({
      integrationRow: { provider: "sandbox", field_mapping: null, organisation_id: "org-1" },
      publishedCount: 5,
    });

    const result = await runConnectorImport(supabase, "agent-1", "int-sb");

    // assessFeedSafety should not have been consulted
    expect(mocks.assessFeedSafety).not.toHaveBeenCalled();
    // Import run still created (even with 0 listings)
    expect(mocks.createImportRunFromListings).toHaveBeenCalled();
    expect(result.blocked).toBeUndefined();
  });

  it("(d) throws a clear error for an unknown / connector-less provider (alto)", async () => {
    const { runConnectorImport } = await import("./run-import");

    mocks.getConnector.mockImplementation((provider: string) => {
      throw new Error(`Unknown connector provider: ${provider}`);
    });

    const { supabase } = makeSupabase({
      integrationRow: { provider: "alto", field_mapping: null, organisation_id: null },
    });

    await expect(
      runConnectorImport(supabase, "agent-1", "int-alto"),
    ).rejects.toThrow("Unknown connector provider: alto");

    expect(mocks.createImportRunFromListings).not.toHaveBeenCalled();
  });
});
