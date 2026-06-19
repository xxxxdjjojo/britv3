/**
 * Reapit source connector — SANDBOX / FIXTURE BACKED.
 *
 * This connector is wired to the in-process `normalizeReapitFixture()` function
 * until the live Reapit API (OIDC auth + signedUrl media CDN + webhook push) is
 * implemented in a later phase. Capabilities reflect only what the current
 * fixture path actually exercises. The live Reapit connector (future phase) will
 * additionally declare `incremental`, `webhook_push`, and `tombstones` once those
 * code paths are implemented — capabilities must reflect what is actually
 * supported today, not aspirational.
 */
import { sha256 } from "@/lib/hash";
import {
  normalizeReapitFixture,
} from "@/services/agent/agent-feed-import-service";
import type {
  BranchRecord,
  ConnectorCapability,
  ConnectorContext,
  FetchResult,
  SourceConnector,
} from "./source-connector";

/** Derive unique branch records from the listing set. */
function deriveBranches(
  listings: ReturnType<typeof normalizeReapitFixture>,
): ReadonlyArray<BranchRecord> {
  const seen = new Map<string, BranchRecord>();
  for (const listing of listings) {
    if (!seen.has(listing.external_branch_id)) {
      // TODO: the live Reapit API supplies a real branch name; using external_branch_id as placeholder for now.
      seen.set(listing.external_branch_id, {
        externalId: listing.external_branch_id,
        name: listing.external_branch_id,
      });
    }
  }
  return Array.from(seen.values());
}

const REAPIT_CAPABILITIES: ReadonlySet<ConnectorCapability> = new Set<ConnectorCapability>([
  "full_snapshot",
  "branches",
  "media_urls",
]);

export const reapitConnector: SourceConnector = {
  provider: "reapit",
  capabilities: REAPIT_CAPABILITIES,

  async testConnection(_ctx: ConnectorContext) {
    // Fixture is always reachable — a live implementation would probe OIDC + signedUrl.
    return { ok: true, message: "Reapit sandbox fixture reachable (fixture-backed)" };
  },

  async discoverBranches(_ctx: ConnectorContext) {
    const listings = normalizeReapitFixture();
    return { branches: deriveBranches(listings) };
  },

  async fetchListings(_ctx: ConnectorContext): Promise<FetchResult> {
    const listings = normalizeReapitFixture();
    const sourceFingerprint = sha256(listings.map((l) => l.raw_payload));
    const branches = deriveBranches(listings);

    return {
      listings,
      errors: [],
      sourceFingerprint,
      branches,
      transport: {
        ok: true,
        itemsSeen: listings.length,
        warnings: [],
      },
    };
  },
};
