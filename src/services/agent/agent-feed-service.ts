/**
 * Agent feed integration service.
 * Manages CRM feed provider integrations (Reapit, Alto, Jupix).
 * API keys are base64-encoded as a placeholder for real encryption.
 * All functions accept a Supabase client as first parameter for testability.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentFeedIntegration, FeedProvider } from "@/types/agent";

/**
 * Encode an API key using base64 (placeholder for Supabase Vault encryption).
 */
function encryptApiKey(key: string): string {
  return Buffer.from(key).toString("base64");
}

/**
 * Get all feed integrations for an agent.
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

  if (error) {
    throw new Error(`Failed to get feed integrations: ${error.message}`);
  }

  return (data ?? []) as AgentFeedIntegration[];
}

/**
 * Create a new feed integration.
 * Encrypts the API key before storing.
 * Sets initial sync_status to 'disconnected'.
 */
export async function createFeedIntegration(
  supabase: SupabaseClient,
  agentId: string,
  input: {
    provider: FeedProvider;
    api_key: string;
    field_mapping?: Record<string, string>;
  },
): Promise<AgentFeedIntegration> {
  const { data, error } = await supabase
    .from("agent_feed_integrations")
    .insert({
      agent_id: agentId,
      provider: input.provider,
      api_key_encrypted: encryptApiKey(input.api_key),
      sync_status: "disconnected",
      field_mapping: input.field_mapping ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create feed integration: ${error.message}`);
  }

  return data as AgentFeedIntegration;
}

/**
 * Update an existing feed integration.
 * Re-encrypts the API key if a new one is provided.
 */
export async function updateFeedIntegration(
  supabase: SupabaseClient,
  integrationId: string,
  agentId: string,
  input: Partial<{
    api_key: string;
    field_mapping: Record<string, string>;
    sync_status: string;
  }>,
): Promise<AgentFeedIntegration> {
  const updatePayload: Record<string, unknown> = {};

  if (input.api_key !== undefined) {
    updatePayload.api_key_encrypted = encryptApiKey(input.api_key);
  }
  if (input.field_mapping !== undefined) {
    updatePayload.field_mapping = input.field_mapping;
  }
  if (input.sync_status !== undefined) {
    updatePayload.sync_status = input.sync_status;
  }

  const { data, error } = await supabase
    .from("agent_feed_integrations")
    .update(updatePayload)
    .eq("id", integrationId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update feed integration: ${error.message}`);
  }

  return data as AgentFeedIntegration;
}

/**
 * Hard-delete a feed integration.
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

  if (error) {
    throw new Error(`Failed to delete feed integration: ${error.message}`);
  }
}

export type FeedSyncStatus = {
  sync_status: string | null;
  last_sync_at: string | null;
  error_log: Record<string, unknown>[] | null;
};

/**
 * Get the current sync status and error log for a feed integration.
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

  if (error) {
    throw new Error(`Failed to get feed sync status: ${error.message}`);
  }

  const row = data as Record<string, unknown>;
  return {
    sync_status: (row.sync_status as string) ?? null,
    last_sync_at: (row.last_sync_at as string) ?? null,
    error_log: (row.error_log as Record<string, unknown>[]) ?? null,
  };
}
