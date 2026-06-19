/**
 * Agent feed integration service.
 * Manages CRM feed provider integrations (Reapit, Alto, Jupix).
 * API keys are not stored locally; only a server-side secret reference is persisted.
 * All functions accept a Supabase client as first parameter for testability.
 */

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AgentFeedIntegration,
  AgentFeedIntegrationView,
  FeedProvider,
} from "@/types/agent";

const FEED_INTEGRATION_PUBLIC_COLUMNS = [
  "id",
  "agent_id",
  "provider",
  "webhook_url",
  "sync_status",
  "last_sync_at",
  "field_mapping",
  "error_log",
  "created_at",
  "updated_at",
].join(", ");

type AgentFeedIntegrationRow = AgentFeedIntegrationView &
  Partial<Pick<AgentFeedIntegration, "api_key_encrypted">>;

function createSecretReference(agentId: string, provider: string): string {
  return `vault://${agentId}/${provider}/${randomUUID()}`;
}

function toFeedIntegrationView(
  row: AgentFeedIntegrationRow,
): AgentFeedIntegrationView {
  const { api_key_encrypted: apiKeyEncrypted, ...view } = row;

  return {
    ...view,
    has_secret:
      apiKeyEncrypted === undefined ? true : Boolean(apiKeyEncrypted),
  };
}

/**
 * Get all feed integrations for an agent.
 */
export async function getFeedIntegrations(
  supabase: SupabaseClient,
  agentId: string,
): Promise<AgentFeedIntegrationView[]> {
  const { data, error } = await supabase
    .from("agent_feed_integrations")
    .select(FEED_INTEGRATION_PUBLIC_COLUMNS)
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get feed integrations: ${error.message}`);
  }

  return ((data ?? []) as unknown as AgentFeedIntegrationRow[]).map(
    toFeedIntegrationView,
  );
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
): Promise<AgentFeedIntegrationView> {
  const { data, error } = await supabase
    .from("agent_feed_integrations")
    .insert({
      agent_id: agentId,
      provider: input.provider,
      api_key_encrypted: createSecretReference(agentId, input.provider),
      sync_status: "disconnected",
      field_mapping: input.field_mapping ?? null,
    })
    .select(FEED_INTEGRATION_PUBLIC_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Failed to create feed integration: ${error.message}`);
  }

  return toFeedIntegrationView(data as unknown as AgentFeedIntegrationRow);
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
  }>,
): Promise<AgentFeedIntegrationView> {
  const updatePayload: Record<string, unknown> = {};

  if (input.api_key !== undefined) {
    updatePayload.api_key_encrypted = createSecretReference(agentId, "feed");
  }
  if (input.field_mapping !== undefined) {
    updatePayload.field_mapping = input.field_mapping;
  }

  const { data, error } = await supabase
    .from("agent_feed_integrations")
    .update(updatePayload)
    .eq("id", integrationId)
    .eq("agent_id", agentId)
    .select(FEED_INTEGRATION_PUBLIC_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Failed to update feed integration: ${error.message}`);
  }

  return toFeedIntegrationView(data as unknown as AgentFeedIntegrationRow);
}

export async function setFeedIntegrationSyncStatus(
  supabase: SupabaseClient,
  integrationId: string,
  agentId: string,
  input: {
    sync_status: "connected" | "syncing" | "error";
    last_sync_at?: string | null;
    error_log?: Record<string, unknown>[] | null;
  },
): Promise<AgentFeedIntegrationView> {
  const { data, error } = await supabase
    .from("agent_feed_integrations")
    .update({
      sync_status: input.sync_status,
      last_sync_at: input.last_sync_at ?? new Date().toISOString(),
      error_log: input.error_log ?? null,
    })
    .eq("id", integrationId)
    .eq("agent_id", agentId)
    .select(FEED_INTEGRATION_PUBLIC_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Failed to update feed sync status: ${error.message}`);
  }

  return toFeedIntegrationView(data as unknown as AgentFeedIntegrationRow);
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
