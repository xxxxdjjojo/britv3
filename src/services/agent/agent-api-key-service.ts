/**
 * Agent API key management — extracted from agent-billing-service.ts.
 *
 * Handles generation, revocation, and listing of API keys for agent
 * integrations. Keys are stored as SHA-256 hashes; the raw key is
 * returned exactly once on creation.
 */
import "server-only";
import { createHash, randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentApiKey } from "@/types/agent";

/**
 * Generates a new API key, stores the SHA-256 hash, and returns the full key
 * exactly once. The raw key is never stored and cannot be retrieved again.
 */
export async function generateApiKey(
  supabase: SupabaseClient,
  userId: string,
  name: string,
): Promise<string> {
  const rawKey = `brite_${randomUUID().replace(/-/g, "")}`;
  const keyPrefix = rawKey.slice(0, 8);
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const { error } = await supabase.from("agent_api_keys").insert({
    agent_id: userId,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    name,
    is_active: true,
    usage_count: 0,
    rate_limit_per_minute: 60,
  });

  if (error) throw error;

  return rawKey;
}

/**
 * Revokes an API key by setting is_active=false and recording revoked_at.
 */
export async function revokeApiKey(
  supabase: SupabaseClient,
  keyId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("agent_api_keys")
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
    })
    .eq("id", keyId)
    .eq("agent_id", userId);

  if (error) throw error;
}

/**
 * Returns all API keys for a user/agent. The key_hash is excluded from the
 * return value — only key_prefix and metadata are returned.
 */
export async function getApiKeys(
  supabase: SupabaseClient,
  userId: string,
): Promise<Omit<AgentApiKey, "key_hash">[]> {
  const { data, error } = await supabase
    .from("agent_api_keys")
    .select(
      "id, agent_id, key_prefix, name, rate_limit_per_minute, last_used_at, usage_count, is_active, created_at, revoked_at",
    )
    .eq("agent_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Omit<AgentApiKey, "key_hash">[];
}
