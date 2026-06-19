import { describe, it, expect, beforeEach } from "vitest";
import type { SourceConnector, ConnectorContext, FetchResult } from "./source-connector";
import { registerConnector, getConnector, listConnectorProviders } from "./registry";

// ---------------------------------------------------------------------------
// In-test fake connector — implements SourceConnector with a known provider
// ---------------------------------------------------------------------------
const FAKE_FETCH_RESULT: FetchResult = {
  listings: [],
  errors: [],
  sourceFingerprint: "abc123",
  branches: [],
  transport: { ok: true, itemsSeen: 0, warnings: [] },
};

const fakeConnector: SourceConnector = {
  provider: "fake_provider",
  capabilities: new Set(["full_snapshot", "media_urls"]),

  async testConnection(_ctx: ConnectorContext) {
    return { ok: true, message: "fake connection ok" };
  },

  async discoverBranches(_ctx: ConnectorContext) {
    return { branches: [] };
  },

  async fetchListings(_ctx: ConnectorContext): Promise<FetchResult> {
    return FAKE_FETCH_RESULT;
  },
};

const anotherConnector: SourceConnector = {
  provider: "another_provider",
  capabilities: new Set(["incremental", "tombstones"]),

  async testConnection(_ctx: ConnectorContext) {
    return { ok: false, message: "another connector not connected" };
  },

  async discoverBranches(_ctx: ConnectorContext) {
    return { branches: [] };
  },

  async fetchListings(_ctx: ConnectorContext): Promise<FetchResult> {
    return { ...FAKE_FETCH_RESULT, sourceFingerprint: "def456" };
  },
};

// ---------------------------------------------------------------------------
// Registry must be reset between tests to avoid state leakage.
// Because the registry is a module-level Map we use a reset helper exported
// from registry.ts (test-only — never called in production code).
// ---------------------------------------------------------------------------
import { _resetRegistryForTesting } from "./registry";

describe("connector registry", () => {
  beforeEach(() => {
    _resetRegistryForTesting();
  });

  it("registers a connector and resolves it by providerKey", () => {
    registerConnector(fakeConnector);

    const resolved = getConnector("fake_provider");

    expect(resolved).toBe(fakeConnector);
  });

  it("resolved connector exposes the correct capability flags", () => {
    registerConnector(fakeConnector);

    const resolved = getConnector("fake_provider");

    expect(resolved.capabilities.has("full_snapshot")).toBe(true);
    expect(resolved.capabilities.has("media_urls")).toBe(true);
    // A capability the connector does NOT declare:
    expect(resolved.capabilities.has("incremental")).toBe(false);
  });

  it("throws a clear error for an unknown providerKey", () => {
    expect(() => getConnector("does_not_exist")).toThrowError(
      "Unknown connector provider: does_not_exist",
    );
  });

  it("throws when the same provider is registered twice (double-register guard)", () => {
    registerConnector(fakeConnector);

    expect(() => registerConnector(fakeConnector)).toThrowError(
      /already registered/i,
    );
  });

  it("listConnectorProviders enumerates all registered providers", () => {
    registerConnector(fakeConnector);
    registerConnector(anotherConnector);

    const providers = listConnectorProviders();

    expect(providers).toContain("fake_provider");
    expect(providers).toContain("another_provider");
    expect(providers).toHaveLength(2);
  });

  it("listConnectorProviders returns empty array when no connectors registered", () => {
    expect(listConnectorProviders()).toEqual([]);
  });
});
