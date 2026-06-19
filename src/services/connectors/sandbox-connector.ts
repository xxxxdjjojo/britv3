/**
 * sandbox — demo connector backed by a bundled XML fixture (no credentials needed).
 * generic_feed — parses an XML or JSON payload supplied via ConnectorContext.payload.
 *
 * Both delegate to the shared parseFeedPayload() in generic-feed-parser.ts.
 *
 * Capabilities are honest: both connectors implement full_snapshot, tombstones,
 * branches, and media_urls. Neither implements incremental or webhook_push.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseFeedPayload } from "./generic-feed-parser";
import type {
  BranchRecord,
  ConnectorCapability,
  ConnectorContext,
  FetchResult,
  SourceConnector,
} from "./source-connector";

// ---------------------------------------------------------------------------
// Shared capabilities
// ---------------------------------------------------------------------------

const FEED_CAPABILITIES: ReadonlySet<ConnectorCapability> = new Set<ConnectorCapability>([
  "full_snapshot",
  "tombstones",
  "branches",
  "media_urls",
]);

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function buildFetchResult(
  parseResult: ReturnType<typeof parseFeedPayload>,
): FetchResult {
  if (!parseResult.ok) {
    return {
      listings: [],
      errors: [],
      sourceFingerprint: parseResult.sourceFingerprint,
      branches: [],
      transport: {
        ok: false,
        itemsSeen: 0,
        warnings: [parseResult.parseError ?? "Feed parse failed"],
      },
    };
  }

  return {
    listings: parseResult.listings,
    errors: parseResult.errors,
    sourceFingerprint: parseResult.sourceFingerprint,
    branches: parseResult.branches,
    transport: {
      ok: true,
      itemsSeen: parseResult.listings.length + parseResult.errors.length,
      warnings: [],
    },
  };
}

// ---------------------------------------------------------------------------
// sandbox connector — fixture-backed
// ---------------------------------------------------------------------------

// __dirname is remapped to /ROOT/... under the Next.js dev server (Turbopack/webpack
// module resolution). Use process.cwd() — always the repo root — instead.
const SANDBOX_FIXTURE_PATH = join(
  process.cwd(),
  "src",
  "services",
  "connectors",
  "__fixtures__",
  "sandbox-portfolio.xml",
);

function loadSandboxFixture(): string {
  return readFileSync(SANDBOX_FIXTURE_PATH, "utf-8");
}

export const sandboxConnector: SourceConnector = {
  provider: "sandbox",
  capabilities: FEED_CAPABILITIES,

  async testConnection(_ctx: ConnectorContext) {
    try {
      const payload = loadSandboxFixture();
      const result = parseFeedPayload(payload, { source: "sandbox" });
      if (!result.ok) {
        return { ok: false, message: `Sandbox fixture parse failed: ${result.parseError}` };
      }
      return {
        ok: true,
        message: `Sandbox fixture reachable — ${result.listings.length} listings parsed`,
      };
    } catch (e) {
      return {
        ok: false,
        message: `Sandbox fixture not accessible: ${e instanceof Error ? e.message : "unknown error"}`,
      };
    }
  },

  async discoverBranches(_ctx: ConnectorContext): Promise<{ branches: ReadonlyArray<BranchRecord> }> {
    const payload = loadSandboxFixture();
    const result = parseFeedPayload(payload, { source: "sandbox" });
    return { branches: result.ok ? result.branches : [] };
  },

  async fetchListings(_ctx: ConnectorContext): Promise<FetchResult> {
    const payload = loadSandboxFixture();
    const result = parseFeedPayload(payload, { source: "sandbox" });
    return buildFetchResult(result);
  },
};

// ---------------------------------------------------------------------------
// generic_feed connector — payload-backed
// ---------------------------------------------------------------------------

function getPayloadString(ctx: ConnectorContext): string | null {
  if (ctx.payload == null) return null;
  if (typeof ctx.payload === "string") return ctx.payload;
  return new TextDecoder().decode(ctx.payload);
}

export const genericFeedConnector: SourceConnector = {
  provider: "generic_feed",
  capabilities: FEED_CAPABILITIES,

  async testConnection(ctx: ConnectorContext) {
    const payload = getPayloadString(ctx);
    if (!payload) {
      return { ok: false, message: "No payload supplied to generic_feed connector" };
    }
    const result = parseFeedPayload(payload, { source: "generic_feed" });
    if (!result.ok) {
      return { ok: false, message: `Feed parse failed: ${result.parseError}` };
    }
    return {
      ok: true,
      message: `Feed parsed OK — ${result.listings.length} listings, ${result.errors.length} row errors`,
    };
  },

  async discoverBranches(ctx: ConnectorContext): Promise<{ branches: ReadonlyArray<BranchRecord> }> {
    const payload = getPayloadString(ctx);
    if (!payload) return { branches: [] };
    const result = parseFeedPayload(payload, { source: "generic_feed" });
    return { branches: result.ok ? result.branches : [] };
  },

  async fetchListings(ctx: ConnectorContext): Promise<FetchResult> {
    const payload = getPayloadString(ctx);
    if (!payload) {
      return {
        listings: [],
        errors: [],
        sourceFingerprint: "",
        branches: [],
        transport: {
          ok: false,
          itemsSeen: 0,
          warnings: ["No payload supplied to generic_feed connector"],
        },
      };
    }
    const result = parseFeedPayload(payload, { source: "generic_feed" });
    return buildFetchResult(result);
  },
};
