/**
 * Reapit source connector — SANDBOX / FIXTURE BACKED.
 *
 * This connector is wired to the in-process `normalizeReapitFixture()` function
 * until the live Reapit API (OIDC auth + signedUrl media CDN + webhook push) is
 * implemented in a later phase. All capability flags reflect the eventual live
 * Reapit API contract so the registry/UI can advertise them correctly, but the
 * transport is always the deterministic fixture payload during this phase.
 */
import { createHash } from "node:crypto";
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

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function sha256(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

/** Derive unique branch records from the listing set. */
function deriveBranches(
  listings: ReturnType<typeof normalizeReapitFixture>,
): ReadonlyArray<BranchRecord> {
  const seen = new Map<string, BranchRecord>();
  for (const listing of listings) {
    if (!seen.has(listing.external_branch_id)) {
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
  "incremental",
  "webhook_push",
  "tombstones",
  "media_urls",
  "branches",
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
