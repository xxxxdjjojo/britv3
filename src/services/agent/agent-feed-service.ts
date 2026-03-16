/**
 * Agent feed integration service -- manage property feed connections
 * (Reapit, Alto, Jupix, etc.).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentFeedIntegration } from "@/types/agent";

// -- Service functions --------------------------------------------------------

/**
 * List all feed integrations for an agent.
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
    throw new Error(`Failed to fetch feed integrations: ${error.message}`);
  }

  return (data ?? []) as AgentFeedIntegration[];
}

/**
 * Create a new feed integration.
 */
export async function createFeedIntegration(
  supabase: SupabaseClient,
  agentId: string,
  input: {
    provider: string;
    api_key: string;
    field_mapping?: Record<string, string>;
  },
): Promise<AgentFeedIntegration> {
  const insertData = {
    agent_id: agentId,
    provider: input.provider,
    // TODO: implement AES-GCM encryption before storing API keys — currently stored as plaintext
    api_key_encrypted: input.api_key,
    sync_status: "disconnected" as const,
    field_mapping: input.field_mapping ?? {},
    error_log: [],
  };

  const { data, error } = await supabase
    .from("agent_feed_integrations")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create feed integration: ${error.message}`);
  }

  return data as AgentFeedIntegration;
}

/**
 * Update a feed integration's configuration.
 */
export async function updateFeedIntegration(
  supabase: SupabaseClient,
  integrationId: string,
  agentId: string,
  input: Partial<{
    provider: string;
    api_key: string;
    field_mapping: Record<string, string>;
    sync_status: string;
  }>,
): Promise<AgentFeedIntegration> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.provider !== undefined) updateData.provider = input.provider;
  if (input.api_key !== undefined)
    // TODO: implement AES-GCM encryption before storing API keys — currently stored as plaintext
    updateData.api_key_encrypted = input.api_key;
  if (input.field_mapping !== undefined)
    updateData.field_mapping = input.field_mapping;
  if (input.sync_status !== undefined)
    updateData.sync_status = input.sync_status;

  const { data, error } = await supabase
    .from("agent_feed_integrations")
    .update(updateData)
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
 * Delete a feed integration (hard delete).
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

/**
 * Get sync status details for a specific feed integration.
 */
export async function getFeedSyncStatus(
  supabase: SupabaseClient,
  integrationId: string,
  agentId: string,
): Promise<{
  sync_status: string;
  last_sync_at: string | null;
  error_log: Record<string, unknown>[];
}> {
  const { data, error } = await supabase
    .from("agent_feed_integrations")
    .select("sync_status, last_sync_at, error_log")
    .eq("id", integrationId)
    .eq("agent_id", agentId)
    .single();

  if (error || !data) {
    throw new Error(
      error?.message ?? "Feed integration not found",
    );
  }

  const row = data as Record<string, unknown>;

  return {
    sync_status: row.sync_status as string,
    last_sync_at: (row.last_sync_at as string) ?? null,
    error_log: (row.error_log as Record<string, unknown>[]) ?? [],
  };
}
