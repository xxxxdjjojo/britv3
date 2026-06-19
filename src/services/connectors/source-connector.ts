import type { NormalizedFeedListing } from "@/services/agent/agent-feed-import-service";

export type ConnectorCapability =
  | "full_snapshot" // emits the complete current portfolio (CSV, Jupix nightly XML)
  | "incremental" // emits deltas since a cursor
  | "webhook_push" // provider pushes changes
  | "tombstones" // explicitly signals removals (vs "absent = removed")
  | "media_urls" // supplies remote media URLs to fetch
  | "branches"; // supplies branch structure

/**
 * A single source row that could not be normalized — surfaced to the UI/error report.
 * IMPORTANT: message must NEVER contain secrets (API keys, credentials, tokens, etc.).
 */
export type RowError = Readonly<{
  /** 1-based source row index or external id, for the downloadable error report. */
  row: number | string;
  /** Machine code, e.g. "missing_field", "invalid_price", "unknown_status". */
  code: string;
  /** Human-readable message (must NEVER contain secrets). */
  message: string;
  /** Optional offending field name. */
  field?: string;
}>;

export type BranchRecord = Readonly<{
  externalId: string;
  name: string;
  postcode?: string;
}>;

export type FetchResult = Readonly<{
  listings: NormalizedFeedListing[];
  /** Rows that failed normalization (per-row errors, e.g. CSV). Empty when all rows OK. */
  errors: RowError[];
  /** SHA256 over the raw source payload(s) — the run idempotency key. */
  sourceFingerprint: string;
  /** Branch records seen this run (for feed_branch_links). */
  branches: BranchRecord[];
  /** Transport diagnostics. transport.ok = true does NOT imply per-item success. */
  transport: { ok: boolean; itemsSeen: number; warnings: string[] };
}>;

export type ConnectorContext = Readonly<{
  integrationId: string;
  /** organisationId post-org-migration; pass agentId where org not yet resolved. */
  organisationId: string;
  /** Resolved secret (never the vault placeholder reference). Optional for credential-less sources. */
  credential?: unknown;
  /** Field mapping for CSV/generic sources: sourceHeader -> canonical field. */
  fieldMapping?: Record<string, string>;
  /** Cursor for incremental connectors. */
  cursor?: string | null;
  /** Raw source payload for fixture/file/push connectors (CSV text, XML/JSON body, etc.). */
  payload?: string | Uint8Array;
  /** Handle to an uploaded object for upload connectors. */
  uploadRef?: string;
}>;

export interface SourceConnector {
  readonly provider: string; // 'csv' | 'sandbox' | 'generic_feed' | 'reapit' | ...
  readonly capabilities: ReadonlySet<ConnectorCapability>;
  /** Probe the source/credential WITHOUT importing. Must actually attempt to reach/parse the source. */
  testConnection(ctx: ConnectorContext): Promise<{ ok: boolean; message: string }>;
  /** Branch structure seen for this integration (may be a subset of fetchListings' branches). */
  discoverBranches(ctx: ConnectorContext): Promise<{ branches: BranchRecord[] }>;
  /** Pull/accept the current set; normalize to canonical shape; surface per-row errors. */
  fetchListings(ctx: ConnectorContext): Promise<FetchResult>;
}
