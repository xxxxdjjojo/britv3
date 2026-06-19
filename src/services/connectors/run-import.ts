/**
 * run-import — glues the connector registry to the import pipeline.
 *
 * Single responsibility: resolve which SourceConnector handles a given
 * integration, run fetchListings, apply the empty-feed safety guard, then
 * delegate to createImportRunFromListings. No pipeline logic lives here.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeedImportRunSummary } from "@/services/agent/agent-feed-import-service";
import {
  assessFeedSafety,
  createImportRunFromListings,
} from "@/services/agent/agent-feed-import-service";
import type { RowError } from "./source-connector";
// Barrel import registers all connectors as a side-effect.
import { getConnector } from "@/services/connectors";
import type { ConnectorContext } from "./source-connector";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type RunImportOpts = {
  /** Raw payload for CSV / generic_feed connectors. Ignored by reapit/sandbox. */
  payload?: string;
  /** Column → canonical field mapping for CSV. Ignored by reapit/sandbox. */
  fieldMapping?: Record<string, string>;
};

export type RunImportResult = {
  summary: FeedImportRunSummary;
  errors: ReadonlyArray<RowError>;
  /** Present when the run was blocked (e.g. empty-feed safety). No import was created. */
  blocked?: { reason: string };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type IntegrationRow = {
  provider: string;
  field_mapping: Record<string, string> | null;
  organisation_id: string | null;
};

async function loadIntegration(
  supabase: SupabaseClient,
  integrationId: string,
  agentId: string,
): Promise<IntegrationRow> {
  const { data, error } = await supabase
    .from("agent_feed_integrations")
    .select("provider, field_mapping, organisation_id")
    .eq("id", integrationId)
    .eq("agent_id", agentId)
    .single();

  if (error || !data) {
    throw new Error(
      `Integration ${integrationId} not found: ${error?.message ?? "Unknown error"}`,
    );
  }

  const row = data as Record<string, unknown>;
  return {
    provider: String(row.provider ?? ""),
    field_mapping:
      row.field_mapping != null ? (row.field_mapping as Record<string, string>) : null,
    organisation_id:
      row.organisation_id != null ? String(row.organisation_id) : null,
  };
}

async function getPreviouslyPublishedCount(
  supabase: SupabaseClient,
  integrationId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("feed_listing_links")
    .select("id", { count: "exact", head: true })
    .eq("integration_id", integrationId);

  if (error) {
    // Throw so the caller can treat this as an unsafe state.
    throw new Error(`feed_listing_links count query failed: ${error.message}`);
  }

  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Run an import for the given integration by dispatching to the correct connector.
 *
 * @param supabase       Admin-level Supabase client.
 * @param agentId        Authenticated agent's user id.
 * @param integrationId  The agent_feed_integrations row to sync.
 * @param opts           Optional payload / fieldMapping for CSV / generic_feed.
 */
export async function runConnectorImport(
  supabase: SupabaseClient,
  agentId: string,
  integrationId: string,
  opts: RunImportOpts = {},
): Promise<RunImportResult> {
  const integration = await loadIntegration(supabase, integrationId, agentId);
  const { provider } = integration;

  // Throws with a clear message for alto/jupix (no connector registered yet).
  const connector = getConnector(provider);

  const ctx: ConnectorContext = {
    integrationId,
    organisationId: integration.organisation_id ?? agentId,
    credential: undefined,
    fieldMapping: opts.fieldMapping ?? integration.field_mapping ?? undefined,
    payload: opts.payload,
  };

  const result = await connector.fetchListings(ctx);

  // Empty-feed safety guard (architecture §4):
  // A full-snapshot connector with zero results AND no tombstones capability AND
  // a previously-published portfolio must NOT silently withdraw that portfolio.
  // Block for manual approval instead.
  if (result.listings.length === 0 && !connector.capabilities.has("tombstones")) {
    let previouslyPublishedCount: number;
    let countError: string | null = null;

    try {
      previouslyPublishedCount = await getPreviouslyPublishedCount(supabase, integrationId);
    } catch (err) {
      countError = err instanceof Error ? err.message : "Unknown count error";
      previouslyPublishedCount = 0; // unused — we block regardless
    }

    // If the count query failed we cannot verify the portfolio is empty,
    // so we must BLOCK (fail-safe). Otherwise consult assessFeedSafety.
    const blockReason = countError
      ? "Could not verify the existing published portfolio; blocking an empty feed for manual review."
      : (() => {
          const safety = assessFeedSafety({ incomingItemCount: 0, previouslyPublishedCount });
          return safety.safe ? null : safety.reason;
        })();

    if (blockReason !== null) {
      // Record the block in the integration error log so the UI can surface it.
      await supabase
        .from("agent_feed_integrations")
        .update({
          sync_status: "error",
          error_log: [
            {
              code: "empty_feed_blocked",
              message: blockReason,
              blocked_at: new Date().toISOString(),
            },
          ],
        })
        .eq("id", integrationId)
        .eq("agent_id", agentId);

      const blockedSummary: FeedImportRunSummary = {
        run_id: "",
        total_items: 0,
        eligible_items: 0,
        error_items: 0,
        withdrawn_items: 0,
      };

      return {
        summary: blockedSummary,
        errors: result.errors,
        blocked: { reason: blockReason },
      };
    }
  }

  const summary = await createImportRunFromListings(
    supabase,
    agentId,
    integrationId,
    provider,
    result.listings,
  );

  return { summary, errors: result.errors };
}
