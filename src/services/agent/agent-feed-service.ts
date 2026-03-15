/**
 * Agent feed integration service -- property feed connections to external CRM
 * providers (Reapit, Alto, Jupix) and sync status tracking.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentFeedIntegration, FeedProvider, SyncStatus } from "@/types/agent";

// ============================================================================
// Feed integration CRUD
// ============================================================================

/**
 * Returns all feed integrations for the given agent with their current sync status.
 */
export async function getFeedIntegrations(
  supabase: SupabaseClient,
  agentId: string,
): Promise<AgentFeedIntegration[]> {
  const { data, error } = await supabase
    .from("agent_feed_integrations")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as AgentFeedIntegration[];
}

/**
 * Creates a new feed integration in 'disconnected' status.
 * The api_key is stored as-is in api_key_encrypted (real vault encryption
 * can be added later without changing the interface).
 */
export async function createFeedIntegration(
  supabase: SupabaseClient,
  agentId: string,
  input: {
    provider: FeedProvider;
    api_key: string;
    field_mapping?: Record<string, unknown>;
  },
): Promise<AgentFeedIntegration> {
  const { data, error } = await supabase
    .from("agent_feed_integrations")
    .insert({
      agent_id: agentId,
      provider: input.provider,
      api_key_encrypted: input.api_key,
      sync_status: "disconnected" as SyncStatus,
      field_mapping: input.field_mapping ?? {},
      error_log: [],
    })
    .select()
    .single();

  if (error) throw error;
  return data as AgentFeedIntegration;
}

/**
 * Updates an existing feed integration's configuration.
 */
export async function updateFeedIntegration(
  supabase: SupabaseClient,
  integrationId: string,
  agentId: string,
  input: {
    api_key?: string;
    webhook_url?: string | null;
    field_mapping?: Record<string, unknown>;
    sync_status?: SyncStatus;
  },
): Promise<AgentFeedIntegration> {
  const payload: Record<string, unknown> = {};

  if (input.api_key !== undefined) {
    payload.api_key_encrypted = input.api_key;
  }
  if (input.webhook_url !== undefined) {
    payload.webhook_url = input.webhook_url;
  }
  if (input.field_mapping !== undefined) {
    payload.field_mapping = input.field_mapping;
  }
  if (input.sync_status !== undefined) {
    payload.sync_status = input.sync_status;
  }

  const { data, error } = await supabase
    .from("agent_feed_integrations")
    .update(payload)
    .eq("id", integrationId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (error) throw error;
  return data as AgentFeedIntegration;
}

/**
 * Permanently deletes a feed integration.
 */
export async function deleteFeedIntegration(
  supabase: SupabaseClient,
  integrationId: string,
  agentId: string,
): Promise<void> {
  const { error } = await supabase
    .from("agent_feed_integrations")
    .delete()
    .eq("id", integrationId)
    .eq("agent_id", agentId);

  if (error) throw error;
}

// ============================================================================
// Sync status
// ============================================================================

export type FeedSyncStatus = {
  sync_status: SyncStatus;
  last_sync_at: string | null;
  error_log: Record<string, unknown>[];
};

/**
 * Returns the sync status, last sync timestamp, and error log for a single
 * feed integration.
 */
export async function getFeedSyncStatus(
  supabase: SupabaseClient,
  integrationId: string,
  agentId: string,
): Promise<FeedSyncStatus> {
  const { data, error } = await supabase
    .from("agent_feed_integrations")
    .select("sync_status, last_sync_at, error_log")
    .eq("id", integrationId)
    .eq("agent_id", agentId)
    .single();

  if (error) throw error;

  const row = data as {
    sync_status: SyncStatus;
    last_sync_at: string | null;
    error_log: Record<string, unknown>[];
  };

  return {
    sync_status: row.sync_status,
    last_sync_at: row.last_sync_at,
    error_log: row.error_log ?? [],
  };
}
